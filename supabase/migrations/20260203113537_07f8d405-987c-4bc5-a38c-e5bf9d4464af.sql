-- Criar bucket para fotos HD de produtos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('produtos_hd', 'produtos_hd', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket produtos_hd
CREATE POLICY "Fotos HD produtos são públicas para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos_hd');

CREATE POLICY "Admin e Superadmin podem inserir fotos HD"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'produtos_hd' 
  AND public.is_admin_or_above(auth.uid())
);

CREATE POLICY "Admin e Superadmin podem atualizar fotos HD"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'produtos_hd' 
  AND public.is_admin_or_above(auth.uid())
);

CREATE POLICY "Admin e Superadmin podem eliminar fotos HD"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'produtos_hd' 
  AND public.is_admin_or_above(auth.uid())
);

-- Adicionar campos para fotos HD na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS foto1_hd_url TEXT,
ADD COLUMN IF NOT EXISTS foto2_hd_url TEXT,
ADD COLUMN IF NOT EXISTS foto3_hd_url TEXT,
ADD COLUMN IF NOT EXISTS foto4_hd_url TEXT;