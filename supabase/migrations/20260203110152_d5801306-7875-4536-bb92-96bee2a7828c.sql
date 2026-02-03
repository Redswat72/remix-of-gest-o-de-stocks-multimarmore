-- Adicionar foto4_url para blocos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS foto4_url TEXT;

-- Criar bucket para fotos de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para fotos de produtos
CREATE POLICY "Todos podem ver fotos de produtos"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

CREATE POLICY "Admin pode fazer upload de fotos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produtos' AND is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode atualizar fotos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'produtos' AND is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode eliminar fotos"
ON storage.objects FOR DELETE
USING (bucket_id = 'produtos' AND is_admin_or_above(auth.uid()));