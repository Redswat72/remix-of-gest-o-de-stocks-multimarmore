-- Adicionar coluna peso_ton à tabela produtos para blocos
ALTER TABLE public.produtos
ADD COLUMN peso_ton numeric NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.produtos.peso_ton IS 'Peso em toneladas (obrigatório para blocos)';