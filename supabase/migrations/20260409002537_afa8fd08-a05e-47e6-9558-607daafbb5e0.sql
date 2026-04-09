CREATE POLICY "Todos autenticados podem ver profiles basico"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);