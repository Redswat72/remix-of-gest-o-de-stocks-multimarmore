
ALTER TABLE public.movimento_adendas
  ADD COLUMN IF NOT EXISTS id_mm text,
  ADD COLUMN IF NOT EXISTS estado_operacao text,
  ADD COLUMN IF NOT EXISTS documentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS criado_por uuid;

-- Copiar dados existentes das colunas antigas para as novas
UPDATE public.movimento_adendas
SET estado_operacao = COALESCE(estado_operacao, estado_validacao),
    criado_por = COALESCE(criado_por, validado_por),
    id_mm = COALESCE(id_mm, (SELECT m.id_mm FROM public.movimentos m WHERE m.id = movimento_adendas.movimento_id));
