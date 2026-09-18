-- 1. ports.city
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS city text;
UPDATE public.ports SET city = CASE code WHEN 'CNYTN' THEN 'Shenzhen' WHEN 'CNSHA' THEN 'Shanghai' WHEN 'BBBGI' THEN 'Bridgetown' ELSE city END;

-- 2. per-destination-country shipment number sequence
CREATE TABLE IF NOT EXISTS public.shipment_counters (
  country_code text PRIMARY KEY,
  last_no integer NOT NULL DEFAULT 1000
);
ALTER TABLE public.shipment_counters ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.shipment_counters TO service_role;

ALTER TABLE public.sailings ADD COLUMN IF NOT EXISTS shipment_no text;

CREATE OR REPLACE FUNCTION public.assign_shipment_no()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cc text;
  n integer;
BEGIN
  IF NEW.shipment_no IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT left(p.code, 2) INTO cc FROM public.ports p WHERE p.id = NEW.destination_port_id;
  IF cc IS NULL THEN
    RAISE EXCEPTION 'destination port not found';
  END IF;
  INSERT INTO public.shipment_counters (country_code, last_no)
  VALUES (cc, 1001)
  ON CONFLICT (country_code) DO UPDATE SET last_no = public.shipment_counters.last_no + 1
  RETURNING last_no INTO n;
  NEW.shipment_no := cc || '-' || n::text;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sailings_shipment_no ON public.sailings;
CREATE TRIGGER sailings_shipment_no BEFORE INSERT ON public.sailings
FOR EACH ROW EXECUTE FUNCTION public.assign_shipment_no();

-- 3. clear the old demo sailings and reseed the three reference ones
DELETE FROM public.booking_events WHERE booking_id IN (SELECT id FROM public.bookings);
DELETE FROM public.bookings;
DELETE FROM public.backfill_allocations;
DELETE FROM public.sailings;
DELETE FROM public.shipment_counters;

INSERT INTO public.companies (id, name, country)
VALUES ('11111111-1111-4111-8111-111111111111', 'Island Tools & Hardware Ltd', 'Barbados')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sailings (voyage_no, origin_port_id, destination_port_id, cargo_cutoff_at, etd, eta, capacity_cbm, capacity_kg, status)
SELECT v.voyage_no, o.id, d.id, v.cutoff::timestamptz, v.etd::date, v.eta::date, 66, 26000, 'open'
FROM (VALUES
  ('ABL-YTN-2610', 'CNYTN', '2026-10-02 17:00:00+00', '2026-10-07', '2026-11-08', 1),
  ('ABL-SHA-2611', 'CNSHA', '2026-10-16 17:00:00+00', '2026-10-21', '2026-11-22', 2),
  ('ABL-YTN-2612', 'CNYTN', '2026-10-30 17:00:00+00', '2026-11-04', '2026-12-06', 3)
) AS v(voyage_no, origin_code, cutoff, etd, eta, ord)
JOIN public.ports o ON o.code = v.origin_code
JOIN public.ports d ON d.code = 'BBBGI'
ORDER BY v.ord;

-- confirmed + pending volumes as real booking rows so the view computes them
INSERT INTO public.bookings (ref, company_id, sailing_id, cbm, gross_kg, chargeable_cbm, status, hold_expires_at)
SELECT b.ref, '11111111-1111-4111-8111-111111111111', s.id, b.cbm, 0, b.cbm, b.status::booking_status,
       CASE WHEN b.status = 'held' THEN now() + interval '40 hours' ELSE NULL END
FROM (VALUES
  ('ABL-B-10601', 'BB-1001', 41.0, 'confirmed'),
  ('ABL-B-10602', 'BB-1001', 16.5, 'held'),
  ('ABL-B-10603', 'BB-1002', 6.0, 'confirmed'),
  ('ABL-B-10604', 'BB-1002', 4.0, 'held')
) AS b(ref, shipment_no, cbm, status)
JOIN public.sailings s ON s.shipment_no = b.shipment_no;

-- 4. expose shipment_no on the availability view
DROP VIEW IF EXISTS public.sailing_availability;
CREATE VIEW public.sailing_availability AS
SELECT s.id AS sailing_id,
    s.voyage_no,
    s.shipment_no,
    s.capacity_cbm,
    s.capacity_kg,
    COALESCE(b.booked_cbm, 0::numeric) AS booked_cbm,
    COALESCE(b.held_cbm, 0::numeric) AS held_cbm,
    COALESCE(b.booked_kg, 0::numeric) AS booked_kg,
    COALESCE(f.backfill_cbm, 0::numeric) AS backfill_cbm,
    COALESCE(b.booked_cbm, 0::numeric) + COALESCE(b.held_cbm, 0::numeric) + COALESCE(f.backfill_cbm, 0::numeric) AS committed_cbm,
    GREATEST(s.capacity_cbm - COALESCE(b.booked_cbm, 0::numeric) - COALESCE(b.held_cbm, 0::numeric) - COALESCE(f.backfill_cbm, 0::numeric), 0::numeric) AS available_cbm,
    COALESCE(e.last_change, s.updated_at) AS last_change_at
   FROM public.sailings s
     LEFT JOIN ( SELECT bookings.sailing_id,
            sum(CASE WHEN bookings.status = ANY (ARRAY['confirmed'::booking_status, 'received'::booking_status, 'loaded'::booking_status, 'sailed'::booking_status, 'arrived'::booking_status, 'released'::booking_status]) THEN bookings.chargeable_cbm ELSE 0::numeric END) AS booked_cbm,
            sum(CASE WHEN bookings.status = 'held'::booking_status AND (bookings.hold_expires_at IS NULL OR bookings.hold_expires_at > now()) THEN bookings.chargeable_cbm ELSE 0::numeric END) AS held_cbm,
            sum(CASE WHEN bookings.status <> ALL (ARRAY['cancelled'::booking_status, 'expired'::booking_status]) THEN bookings.gross_kg ELSE 0::numeric END) AS booked_kg
           FROM public.bookings GROUP BY bookings.sailing_id) b ON b.sailing_id = s.id
     LEFT JOIN ( SELECT backfill_allocations.sailing_id, sum(backfill_allocations.cbm) AS backfill_cbm
           FROM public.backfill_allocations GROUP BY backfill_allocations.sailing_id) f ON f.sailing_id = s.id
     LEFT JOIN ( SELECT bk.sailing_id, max(ev.created_at) AS last_change
           FROM public.booking_events ev JOIN public.bookings bk ON bk.id = ev.booking_id
          GROUP BY bk.sailing_id) e ON e.sailing_id = s.id;

GRANT SELECT ON public.sailing_availability TO anon, authenticated;
GRANT ALL ON public.sailing_availability TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS sailings_shipment_no_key ON public.sailings (shipment_no);