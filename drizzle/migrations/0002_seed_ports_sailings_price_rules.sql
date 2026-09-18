INSERT INTO public.ports (code, name, country, cfs_address, cfs_address_zh, transit_days_to_bgi, floor_rate_usd)
VALUES
  ('CNYTN', 'Yantian', 'China', 'ABL Shipping CFS, Warehouse 7, Yantian Logistics Park, Yantian District, Shenzhen, Guangdong', 'ABL Shipping 拼箱仓库, 广东省深圳市盐田区盐田物流园7号仓', 38, 165),
  ('CNSHA', 'Shanghai', 'China', 'ABL Shipping CFS, Building C2, Waigaoqiao Logistics Park, Pudong New Area, Shanghai', 'ABL Shipping 拼箱仓库, 上海市浦东新区外高桥物流园C2栋', 41, 175),
  ('BBBGI', 'Bridgetown', 'Barbados', 'Bridgetown Port, Princess Alice Highway, Bridgetown, St. Michael, Barbados', NULL, 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO public.price_rules (version, effective_from, is_active)
SELECT 'v1.0', CURRENT_DATE, true
WHERE NOT EXISTS (SELECT 1 FROM public.price_rules WHERE is_active);

WITH o AS (
  SELECT id, code FROM public.ports WHERE code IN ('CNYTN','CNSHA')
), d AS (
  SELECT id FROM public.ports WHERE code = 'BBBGI'
), spec(n, port_code, cutoff_days) AS (
  VALUES (1,'CNYTN',7), (2,'CNSHA',14), (3,'CNYTN',21), (4,'CNSHA',28), (5,'CNYTN',35), (6,'CNSHA',42)
)
INSERT INTO public.sailings (voyage_no, origin_port_id, destination_port_id, cargo_cutoff_at, etd, eta, capacity_cbm, capacity_kg, status)
SELECT
  'ABL-' || CASE WHEN spec.port_code = 'CNYTN' THEN 'YTN' ELSE 'SHA' END || '-' || (2610 + spec.n)::text,
  o.id, d.id,
  date_trunc('hour', now()) + (spec.cutoff_days || ' days')::interval,
  date_trunc('hour', now()) + ((spec.cutoff_days + 3) || ' days')::interval,
  date_trunc('hour', now()) + ((spec.cutoff_days + 3 + CASE WHEN spec.port_code = 'CNYTN' THEN 38 ELSE 41 END) || ' days')::interval,
  66, 26000, 'open'
FROM spec JOIN o ON o.code = spec.port_code CROSS JOIN d
WHERE NOT EXISTS (SELECT 1 FROM public.sailings);