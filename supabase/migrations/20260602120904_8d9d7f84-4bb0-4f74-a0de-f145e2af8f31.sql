
ALTER TABLE public.movimentos ADD COLUMN IF NOT EXISTS cliente_nome text;

ALTER TABLE public.movimentos DROP CONSTRAINT IF EXISTS movimento_saida_cliente;

ALTER TABLE public.movimentos ADD CONSTRAINT movimento_saida_cliente
CHECK (
  tipo <> 'saida'
  OR (
    local_origem_id IS NOT NULL
    AND (cliente_id IS NOT NULL OR (cliente_nome IS NOT NULL AND length(btrim(cliente_nome)) > 0))
  )
);
