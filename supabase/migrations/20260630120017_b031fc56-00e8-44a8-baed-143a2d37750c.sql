-- Hardening auditoria table policies
DROP POLICY IF EXISTS "Sistema pode inserir auditoria" ON public.auditoria;
DROP POLICY IF EXISTS "Superadmin pode ver auditoria" ON public.auditoria;

CREATE POLICY "Autenticados podem inserir auditoria" ON public.auditoria
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Superadmin pode ver auditoria" ON public.auditoria
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Revoke public execution on SECURITY DEFINER functions from anon and public
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;