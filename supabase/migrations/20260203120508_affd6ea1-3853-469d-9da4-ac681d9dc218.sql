-- Adicionar campos para QR Code na tabela produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS qr_code_url text,
ADD COLUMN IF NOT EXISTS qr_code_data text;

-- Comentários para documentação
COMMENT ON COLUMN public.produtos.qr_code_url IS 'URL estável do produto para QR Code (ex: /p/{idmm})';
COMMENT ON COLUMN public.produtos.qr_code_data IS 'Dados do QR Code em formato data URI (PNG base64) para download/impressão';