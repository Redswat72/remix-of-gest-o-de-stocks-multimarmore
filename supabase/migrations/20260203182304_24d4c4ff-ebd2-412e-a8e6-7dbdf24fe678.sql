-- Adicionar campos variedade e origem_bloco à tabela produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS variedade VARCHAR(255),
ADD COLUMN IF NOT EXISTS origem_bloco VARCHAR(100);

-- Comentários para documentação
COMMENT ON COLUMN public.produtos.variedade IS 'Variedade específica da pedra (ex: Estremoz Clássico, Rosa Aurora)';
COMMENT ON COLUMN public.produtos.origem_bloco IS 'Origem do bloco (adquirido ou produção própria)';