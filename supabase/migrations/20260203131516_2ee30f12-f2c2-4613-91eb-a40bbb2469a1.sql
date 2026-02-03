-- Adicionar coluna linha à tabela produtos para posição interna no parque
ALTER TABLE public.produtos 
ADD COLUMN linha character varying NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.produtos.linha IS 'Posição interna dentro do parque (linha, corredor, fila) - informação operacional';