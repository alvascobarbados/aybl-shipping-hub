
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.my_company_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_company_id() TO authenticated;
REVOKE ALL ON FUNCTION public.expire_holds() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hold_space(uuid,numeric,numeric,public.fare_type,boolean,text,public.origin_option,public.delivery_option,numeric,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hold_space(uuid,numeric,numeric,public.fare_type,boolean,text,public.origin_option,public.delivery_option,numeric,boolean) TO authenticated;
