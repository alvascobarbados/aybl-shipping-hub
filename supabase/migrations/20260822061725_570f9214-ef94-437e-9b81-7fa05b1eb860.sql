
CREATE TYPE public.app_role AS ENUM ('customer','ops','admin');
CREATE TYPE public.sailing_status AS ENUM ('scheduled','open','closed','sailed','arrived','released');
CREATE TYPE public.booking_status AS ENUM ('held','confirmed','received','loaded','sailed','arrived','released','cancelled','expired');
CREATE TYPE public.fare_type AS ENUM ('saver','flex');
CREATE TYPE public.origin_option AS ENUM ('cfs','pickup_gz','pickup_yiwu');
CREATE TYPE public.delivery_option AS ENUM ('collect','deliver');
CREATE TYPE public.document_type AS ENUM ('confirmation','supplier_label','house_bl','manifest','invoice');

CREATE SEQUENCE IF NOT EXISTS public.booking_ref_seq START 602;
GRANT USAGE ON SEQUENCE public.booking_ref_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.ports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  country text NOT NULL,
  cfs_address text,
  cfs_address_zh text,
  transit_days_to_bgi int NOT NULL DEFAULT 38,
  floor_rate_usd numeric(10,2) NOT NULL DEFAULT 165,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ports TO anon, authenticated;
GRANT ALL ON public.ports TO service_role;
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sailings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voyage_no text NOT NULL UNIQUE,
  origin_port_id uuid NOT NULL REFERENCES public.ports(id),
  destination_port_id uuid NOT NULL REFERENCES public.ports(id),
  cargo_cutoff_at timestamptz NOT NULL,
  etd timestamptz NOT NULL,
  eta timestamptz NOT NULL,
  capacity_cbm numeric(10,2) NOT NULL DEFAULT 66,
  capacity_kg numeric(12,2) NOT NULL DEFAULT 26000,
  status public.sailing_status NOT NULL DEFAULT 'open',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sailings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sailings TO authenticated;
GRANT ALL ON public.sailings TO service_role;
ALTER TABLE public.sailings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_sailings_updated BEFORE UPDATE ON public.sailings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  effective_from date NOT NULL DEFAULT current_date,
  is_active boolean NOT NULL DEFAULT true,
  early_days int NOT NULL DEFAULT 28,
  std_days int NOT NULL DEFAULT 14,
  std_mult numeric(6,3) NOT NULL DEFAULT 1.12,
  late_mult numeric(6,3) NOT NULL DEFAULT 1.30,
  demand70_mult numeric(6,3) NOT NULL DEFAULT 1.08,
  demand85_mult numeric(6,3) NOT NULL DEFAULT 1.15,
  flex_mult numeric(6,3) NOT NULL DEFAULT 1.12,
  standing_discount numeric(6,3) NOT NULL DEFAULT 0.10,
  cfs_fee_per_cbm numeric(10,2) NOT NULL DEFAULT 25,
  terminal_fee_per_cbm numeric(10,2) NOT NULL DEFAULT 30,
  doc_fee numeric(10,2) NOT NULL DEFAULT 75,
  insurance_rate numeric(6,4) NOT NULL DEFAULT 0.012,
  insurance_min numeric(10,2) NOT NULL DEFAULT 35,
  photo_check_fee numeric(10,2) NOT NULL DEFAULT 45,
  pickup_fee_gz numeric(10,2) NOT NULL DEFAULT 60,
  pickup_fee_yiwu numeric(10,2) NOT NULL DEFAULT 95,
  delivery_fee_base numeric(10,2) NOT NULL DEFAULT 65,
  delivery_fee_per_cbm numeric(10,2) NOT NULL DEFAULT 18,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.price_rules TO anon, authenticated;
GRANT INSERT, UPDATE ON public.price_rules TO authenticated;
GRANT ALL ON public.price_rules TO service_role;
ALTER TABLE public.price_rules ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_price_rules_updated BEFORE UPDATE ON public.price_rules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'Barbados',
  address text,
  tax_id text,
  phone text,
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('ops','admin'));
$$;

CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sailing_id uuid NOT NULL REFERENCES public.sailings(id),
  cbm numeric(10,2) NOT NULL,
  gross_kg numeric(12,2) NOT NULL DEFAULT 0,
  chargeable_cbm numeric(10,2) NOT NULL,
  cargo_type text NOT NULL DEFAULT 'General merchandise',
  fare public.fare_type NOT NULL DEFAULT 'saver',
  standing boolean NOT NULL DEFAULT false,
  origin_option public.origin_option NOT NULL DEFAULT 'cfs',
  delivery_option public.delivery_option NOT NULL DEFAULT 'collect',
  insurance_declared_value numeric(12,2) NOT NULL DEFAULT 0,
  photo_check boolean NOT NULL DEFAULT false,
  price_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_usd numeric(12,2) NOT NULL DEFAULT 0,
  status public.booking_status NOT NULL DEFAULT 'held',
  hold_expires_at timestamptz,
  seal_no text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_sailing ON public.bookings(sailing_id);
CREATE INDEX idx_bookings_company ON public.bookings(company_id);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status public.booking_status NOT NULL,
  note text,
  photos text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_events_booking ON public.booking_events(booking_id);
GRANT SELECT, INSERT ON public.booking_events TO authenticated;
GRANT ALL ON public.booking_events TO service_role;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  sailing_id uuid REFERENCES public.sailings(id) ON DELETE CASCADE,
  type public.document_type NOT NULL,
  title text,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.backfill_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sailing_id uuid NOT NULL REFERENCES public.sailings(id) ON DELETE CASCADE,
  cbm numeric(10,2) NOT NULL,
  product text,
  owner text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backfill_allocations TO authenticated;
GRANT ALL ON public.backfill_allocations TO service_role;
ALTER TABLE public.backfill_allocations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sailing_id uuid NOT NULL REFERENCES public.sailings(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  cbm numeric(10,2) NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.waitlist_entries TO authenticated;
GRANT ALL ON public.waitlist_entries TO service_role;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ports public read" ON public.ports FOR SELECT USING (true);
CREATE POLICY "sailings public read" ON public.sailings FOR SELECT USING (true);
CREATE POLICY "sailings staff write" ON public.sailings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "price public read" ON public.price_rules FOR SELECT USING (true);
CREATE POLICY "price admin write" ON public.price_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "companies own read" ON public.companies FOR SELECT TO authenticated
  USING (id = public.my_company_id() OR public.is_staff(auth.uid()));
CREATE POLICY "companies insert" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "companies own update" ON public.companies FOR UPDATE TO authenticated
  USING (id = public.my_company_id() OR public.is_staff(auth.uid()))
  WITH CHECK (id = public.my_company_id() OR public.is_staff(auth.uid()));

CREATE POLICY "profiles own read" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR company_id = public.my_company_id() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles own update" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "roles own read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated
  USING (company_id = public.my_company_id() OR public.is_staff(auth.uid()));
CREATE POLICY "bookings insert" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (company_id = public.my_company_id() OR public.is_staff(auth.uid()));
CREATE POLICY "bookings update" ON public.bookings FOR UPDATE TO authenticated
  USING (company_id = public.my_company_id() OR public.is_staff(auth.uid()))
  WITH CHECK (company_id = public.my_company_id() OR public.is_staff(auth.uid()));

CREATE POLICY "events read" ON public.booking_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id
    AND (b.company_id = public.my_company_id() OR public.is_staff(auth.uid()))));
CREATE POLICY "events insert" ON public.booking_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id
    AND (b.company_id = public.my_company_id() OR public.is_staff(auth.uid()))));

CREATE POLICY "documents read" ON public.documents FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.company_id = public.my_company_id()));
CREATE POLICY "documents insert" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "backfill staff" ON public.backfill_allocations FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "waitlist read" ON public.waitlist_entries FOR SELECT TO authenticated
  USING (company_id = public.my_company_id() OR public.is_staff(auth.uid()));
CREATE POLICY "waitlist insert" ON public.waitlist_entries FOR INSERT TO authenticated WITH CHECK (true);

CREATE VIEW public.sailing_availability
WITH (security_invoker = true) AS
SELECT
  s.id AS sailing_id,
  s.voyage_no,
  s.capacity_cbm,
  s.capacity_kg,
  COALESCE(b.booked_cbm, 0)::numeric AS booked_cbm,
  COALESCE(b.held_cbm, 0)::numeric AS held_cbm,
  COALESCE(b.booked_kg, 0)::numeric AS booked_kg,
  COALESCE(f.backfill_cbm, 0)::numeric AS backfill_cbm,
  (COALESCE(b.booked_cbm,0) + COALESCE(b.held_cbm,0) + COALESCE(f.backfill_cbm,0))::numeric AS committed_cbm,
  GREATEST(s.capacity_cbm - COALESCE(b.booked_cbm,0) - COALESCE(b.held_cbm,0) - COALESCE(f.backfill_cbm,0), 0)::numeric AS available_cbm,
  COALESCE(e.last_change, s.updated_at) AS last_change_at
FROM public.sailings s
LEFT JOIN (
  SELECT sailing_id,
    SUM(CASE WHEN status IN ('confirmed','received','loaded','sailed','arrived','released') THEN chargeable_cbm ELSE 0 END) AS booked_cbm,
    SUM(CASE WHEN status = 'held' AND (hold_expires_at IS NULL OR hold_expires_at > now()) THEN chargeable_cbm ELSE 0 END) AS held_cbm,
    SUM(CASE WHEN status NOT IN ('cancelled','expired') THEN gross_kg ELSE 0 END) AS booked_kg
  FROM public.bookings GROUP BY sailing_id
) b ON b.sailing_id = s.id
LEFT JOIN (
  SELECT sailing_id, SUM(cbm) AS backfill_cbm FROM public.backfill_allocations GROUP BY sailing_id
) f ON f.sailing_id = s.id
LEFT JOIN (
  SELECT bk.sailing_id, MAX(ev.created_at) AS last_change
  FROM public.booking_events ev JOIN public.bookings bk ON bk.id = ev.booking_id
  GROUP BY bk.sailing_id
) e ON e.sailing_id = s.id;

GRANT SELECT ON public.sailing_availability TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.calc_quote(
  _sailing_id uuid, _cbm numeric, _gross_kg numeric, _fare public.fare_type,
  _standing boolean DEFAULT false, _origin public.origin_option DEFAULT 'cfs',
  _delivery public.delivery_option DEFAULT 'collect',
  _insurance_value numeric DEFAULT 0, _photo_check boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE r public.price_rules; s public.sailings; p public.ports; av record;
  ch numeric; d numeric; lead numeric; fill numeric; dem numeric; base numeric;
  freight numeric; lines jsonb := '[]'::jsonb; total numeric := 0; extra numeric;
BEGIN
  SELECT * INTO r FROM public.price_rules WHERE is_active ORDER BY effective_from DESC LIMIT 1;
  SELECT * INTO s FROM public.sailings WHERE id = _sailing_id;
  SELECT * INTO p FROM public.ports WHERE id = s.origin_port_id;
  SELECT * INTO av FROM public.sailing_availability WHERE sailing_id = _sailing_id;
  ch := CEIL(GREATEST(_cbm, COALESCE(_gross_kg,0)/1000.0) * 2) / 2.0;
  d := EXTRACT(EPOCH FROM (s.cargo_cutoff_at - now())) / 86400.0;
  lead := CASE WHEN d >= r.early_days THEN 1 WHEN d >= r.std_days THEN r.std_mult
               ELSE CASE WHEN _standing THEN r.std_mult ELSE r.late_mult END END;
  fill := CASE WHEN s.capacity_cbm > 0 THEN av.committed_cbm / s.capacity_cbm ELSE 0 END;
  dem := CASE WHEN fill >= 0.85 THEN r.demand85_mult WHEN fill >= 0.70 THEN r.demand70_mult ELSE 1 END;
  base := p.floor_rate_usd * lead * dem * (CASE WHEN _fare = 'flex' THEN r.flex_mult ELSE 1 END);
  IF _standing THEN base := base * (1 - r.standing_discount); END IF;
  base := ROUND(base, 2);
  freight := ROUND(base * ch, 2);
  lines := lines || jsonb_build_object('key','freight','label','Ocean freight','qty',ch,'unit',base,'amount',freight);
  total := freight;
  extra := ROUND(r.cfs_fee_per_cbm * ch, 2);
  lines := lines || jsonb_build_object('key','cfs','label', p.name || ' CFS','qty',ch,'unit',r.cfs_fee_per_cbm,'amount',extra);
  total := total + extra;
  extra := ROUND(r.terminal_fee_per_cbm * ch, 2);
  lines := lines || jsonb_build_object('key','terminal','label','Bridgetown terminal','qty',ch,'unit',r.terminal_fee_per_cbm,'amount',extra);
  total := total + extra;
  lines := lines || jsonb_build_object('key','docs','label','Documentation','qty',1,'unit',r.doc_fee,'amount',r.doc_fee);
  total := total + r.doc_fee;
  IF _origin = 'pickup_gz' THEN
    lines := lines || jsonb_build_object('key','pickup','label','Supplier pickup - Guangzhou','qty',1,'unit',r.pickup_fee_gz,'amount',r.pickup_fee_gz);
    total := total + r.pickup_fee_gz;
  ELSIF _origin = 'pickup_yiwu' THEN
    lines := lines || jsonb_build_object('key','pickup','label','Supplier pickup - Yiwu','qty',1,'unit',r.pickup_fee_yiwu,'amount',r.pickup_fee_yiwu);
    total := total + r.pickup_fee_yiwu;
  END IF;
  IF _delivery = 'deliver' THEN
    extra := ROUND(r.delivery_fee_base + r.delivery_fee_per_cbm * ch, 2);
    lines := lines || jsonb_build_object('key','delivery','label','Delivery in Barbados','qty',1,'unit',extra,'amount',extra);
    total := total + extra;
  END IF;
  IF COALESCE(_insurance_value,0) > 0 THEN
    extra := ROUND(GREATEST(r.insurance_min, r.insurance_rate * _insurance_value), 2);
    lines := lines || jsonb_build_object('key','insurance','label','Cargo insurance','qty',1,'unit',extra,'amount',extra);
    total := total + extra;
  END IF;
  IF _photo_check THEN
    lines := lines || jsonb_build_object('key','photo','label','Photo check at origin warehouse','qty',1,'unit',r.photo_check_fee,'amount',r.photo_check_fee);
    total := total + r.photo_check_fee;
  END IF;
  RETURN jsonb_build_object(
    'chargeable_cbm', ch, 'rate_per_cbm', base, 'lines', lines,
    'total', ROUND(total,2), 'all_in_per_cbm', ROUND(total/GREATEST(ch,0.5),2),
    'tariff_version', r.version, 'fill', ROUND(fill,4), 'days_to_cutoff', ROUND(d,2));
END; $$;

CREATE OR REPLACE FUNCTION public.hold_space(
  _sailing_id uuid, _cbm numeric, _gross_kg numeric DEFAULT 0,
  _fare public.fare_type DEFAULT 'saver', _standing boolean DEFAULT false,
  _cargo_type text DEFAULT 'General merchandise',
  _origin public.origin_option DEFAULT 'cfs', _delivery public.delivery_option DEFAULT 'collect',
  _insurance_value numeric DEFAULT 0, _photo_check boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.sailings; avail numeric; take numeric; remainder numeric;
  q jsonb; comp uuid; new_ref text; bid uuid; next_sailing uuid;
BEGIN
  comp := public.my_company_id();
  IF comp IS NULL THEN RAISE EXCEPTION 'No company profile for this user'; END IF;
  SELECT * INTO s FROM public.sailings WHERE id = _sailing_id FOR UPDATE;
  IF s.id IS NULL THEN RAISE EXCEPTION 'Sailing not found'; END IF;
  IF s.status <> 'open' OR s.cargo_cutoff_at <= now() THEN RAISE EXCEPTION 'Sailing is closed'; END IF;
  SELECT available_cbm INTO avail FROM public.sailing_availability WHERE sailing_id = _sailing_id;
  take := LEAST(CEIL(GREATEST(_cbm, COALESCE(_gross_kg,0)/1000.0)*2)/2.0, FLOOR(avail*2)/2.0);
  remainder := GREATEST(CEIL(_cbm*2)/2.0 - take, 0);
  SELECT id INTO next_sailing FROM public.sailings
    WHERE origin_port_id = s.origin_port_id AND etd > s.etd AND status = 'open' ORDER BY etd LIMIT 1;
  IF take < 0.5 THEN
    INSERT INTO public.waitlist_entries (sailing_id, company_id, cbm)
      VALUES (COALESCE(next_sailing, _sailing_id), comp, _cbm);
    RETURN jsonb_build_object('held', 0, 'waitlisted', _cbm, 'next_sailing_id', next_sailing);
  END IF;
  q := public.calc_quote(_sailing_id, take, _gross_kg, _fare, _standing, _origin, _delivery, _insurance_value, _photo_check);
  new_ref := 'AYBL-B-' || (10000 + nextval('public.booking_ref_seq'))::text;
  INSERT INTO public.bookings (ref, company_id, sailing_id, cbm, gross_kg, chargeable_cbm, cargo_type,
    fare, standing, origin_option, delivery_option, insurance_declared_value, photo_check,
    price_breakdown, total_usd, status, hold_expires_at, created_by)
  VALUES (new_ref, comp, _sailing_id, take, COALESCE(_gross_kg,0), (q->>'chargeable_cbm')::numeric, _cargo_type,
    _fare, _standing, _origin, _delivery, COALESCE(_insurance_value,0), _photo_check,
    q, (q->>'total')::numeric, 'held', now() + interval '48 hours', auth.uid())
  RETURNING id INTO bid;
  INSERT INTO public.booking_events (booking_id, status, note, created_by)
    VALUES (bid, 'held', 'Space held for 48 hours', auth.uid());
  IF remainder >= 0.5 THEN
    INSERT INTO public.waitlist_entries (sailing_id, company_id, cbm)
      VALUES (COALESCE(next_sailing, _sailing_id), comp, remainder);
  END IF;
  RETURN jsonb_build_object('held', take, 'waitlisted', remainder, 'booking_id', bid, 'ref', new_ref,
    'next_sailing_id', next_sailing);
END; $$;

GRANT EXECUTE ON FUNCTION public.hold_space(uuid,numeric,numeric,public.fare_type,boolean,text,public.origin_option,public.delivery_option,numeric,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calc_quote(uuid,numeric,numeric,public.fare_type,boolean,public.origin_option,public.delivery_option,numeric,boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.expire_holds() RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  WITH x AS (UPDATE public.bookings SET status = 'expired'
    WHERE status = 'held' AND hold_expires_at IS NOT NULL AND hold_expires_at <= now() RETURNING id)
  INSERT INTO public.booking_events (booking_id, status, note)
  SELECT id, 'expired', 'Hold expired after 48 hours' FROM x;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE allow text; is_owner boolean := false;
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT current_setting('app.owner_allowlist', true) INTO allow;
  IF allow IS NOT NULL AND allow <> '' THEN
    is_owner := lower(NEW.email) = ANY (string_to_array(lower(allow), ','));
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_owner THEN 'admin'::public.app_role ELSE 'customer'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.ports (code, name, country, cfs_address, cfs_address_zh, transit_days_to_bgi, floor_rate_usd) VALUES
 ('CNYTN','Yantian','China','AYBL CFS, Warehouse B7, Yantian Comprehensive Bonded Zone, Shenzhen 518083','盐田综合保税区 B7 仓库, 深圳 518083', 38, 165),
 ('CNSHA','Shanghai','China','AYBL CFS, Warehouse C12, Waigaoqiao Free Trade Zone, Shanghai 200131','外高桥保税区 C12 仓库, 上海 200131', 41, 175),
 ('BBBGI','Bridgetown','Barbados','AYBL Terminal, Bridgetown Port, Barbados', NULL, 0, 0);

INSERT INTO public.price_rules (version, effective_from, is_active) VALUES ('2026.08-3', DATE '2026-08-22', true);

INSERT INTO public.sailings (voyage_no, origin_port_id, destination_port_id, cargo_cutoff_at, etd, eta, status)
SELECT v.voy, o.id, d.id, v.cut::timestamptz, v.etd::timestamptz, v.eta::timestamptz, 'open'
FROM (VALUES
 ('AYBL-YTN-2618','CNYTN','2026-09-11 17:00+00','2026-09-16 12:00+00','2026-10-24 12:00+00'),
 ('AYBL-SHA-2619','CNSHA','2026-09-18 17:00+00','2026-09-23 12:00+00','2026-11-03 12:00+00'),
 ('AYBL-YTN-2620','CNYTN','2026-09-25 17:00+00','2026-09-30 12:00+00','2026-11-07 12:00+00'),
 ('AYBL-SHA-2621','CNSHA','2026-10-02 17:00+00','2026-10-07 12:00+00','2026-11-17 12:00+00'),
 ('AYBL-YTN-2622','CNYTN','2026-10-09 17:00+00','2026-10-14 12:00+00','2026-11-21 12:00+00'),
 ('AYBL-SHA-2623','CNSHA','2026-10-16 17:00+00','2026-10-21 12:00+00','2026-12-01 12:00+00')
) AS v(voy, pcode, cut, etd, eta)
JOIN public.ports o ON o.code = v.pcode
JOIN public.ports d ON d.code = 'BBBGI';

INSERT INTO public.companies (name, country, address, tax_id, phone, whatsapp)
VALUES ('Island Tools & Hardware Ltd','Barbados','Fontabelle, St. Michael, Bridgetown','BB-1049221','+1 246 555 0142','+1 246 555 0142');

INSERT INTO public.backfill_allocations (sailing_id, cbm, product, owner)
SELECT id, 8, 'Household consumables', 'AYBL backfill' FROM public.sailings WHERE voyage_no = 'AYBL-YTN-2618'
UNION ALL SELECT id, 4, 'Packaging materials', 'AYBL backfill' FROM public.sailings WHERE voyage_no = 'AYBL-SHA-2619';
