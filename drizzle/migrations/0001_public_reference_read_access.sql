GRANT SELECT ON public.ports TO anon, authenticated;
GRANT SELECT ON public.sailings TO anon, authenticated;
GRANT SELECT ON public.price_rules TO anon, authenticated;
GRANT SELECT ON public.sailing_availability TO anon, authenticated;

DROP POLICY IF EXISTS "ports public read" ON public.ports;
CREATE POLICY "ports public read" ON public.ports FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "sailings public read" ON public.sailings;
CREATE POLICY "sailings public read" ON public.sailings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "price public read" ON public.price_rules;
CREATE POLICY "price public read" ON public.price_rules FOR SELECT TO anon, authenticated USING (true);