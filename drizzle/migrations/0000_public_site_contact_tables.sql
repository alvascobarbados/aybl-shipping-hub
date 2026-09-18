CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  side text NOT NULL UNIQUE,
  label text NOT NULL,
  audience_note text,
  company_name text,
  contact_name text,
  address text,
  address_zh text,
  phone text,
  whatsapp text,
  wechat text,
  email text,
  hours text,
  hours_zh text,
  timezone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contact details are public" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins update contact details" ON public.site_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert contact details" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  company text,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'customer',
  message text,
  customer_name text,
  customer_email text,
  cbm numeric,
  sailing_id uuid REFERENCES public.sailings(id) ON DELETE SET NULL,
  side text NOT NULL DEFAULT 'barbados',
  status text NOT NULL DEFAULT 'new',
  handled_by uuid,
  handled_at timestamptz
);

GRANT INSERT ON public.contact_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.contact_requests TO authenticated;
GRANT ALL ON public.contact_requests TO service_role;

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone may send a contact request" ON public.contact_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff read contact requests" ON public.contact_requests
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update contact requests" ON public.contact_requests
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

INSERT INTO public.site_settings (side, label, audience_note, company_name, contact_name, address, address_zh, phone, whatsapp, wechat, email, hours, hours_zh, timezone)
VALUES
  ('barbados', 'Barbados', 'For customers: quotes, bookings, collection.', 'ABL Shipping Ltd', 'Customer desk', '[PLACEHOLDER] 1 Bay Street, Bridgetown, Barbados', NULL, '[PLACEHOLDER] +1 246 000 0000', '[PLACEHOLDER] +1 246 000 0000', NULL, 'placeholder@ablshipping.example', 'Mon-Fri 08:00-16:30', NULL, 'AST'),
  ('china', 'China', 'For suppliers and factories: delivering cargo to our warehouse, or reserving space on behalf of a customer in Barbados.', 'ABL Shipping (China)', '[PLACEHOLDER] Origin desk', '[PLACEHOLDER] Yantian District, Shenzhen, Guangdong', '[占位] 广东省深圳市盐田区', '[PLACEHOLDER] +86 000 0000 0000', '[PLACEHOLDER] +86 000 0000 0000', '[PLACEHOLDER] ablshipping-cn', 'placeholder-cn@ablshipping.example', 'Mon-Sat 09:00-18:00', '周一至周六 09:00-18:00', 'CST');
