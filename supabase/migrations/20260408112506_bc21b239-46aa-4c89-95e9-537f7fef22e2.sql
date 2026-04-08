
-- Add new columns to blocos table
ALTER TABLE public.blocos ADD COLUMN IF NOT EXISTS sem_documento boolean DEFAULT false;
ALTER TABLE public.blocos ADD COLUMN IF NOT EXISTS pedreira_origem text;
ALTER TABLE public.blocos ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;
ALTER TABLE public.blocos ADD COLUMN IF NOT EXISTS corte_parcial boolean DEFAULT false;
ALTER TABLE public.blocos ADD COLUMN IF NOT EXISTS medicao_pendente boolean DEFAULT false;

-- Add espessura columns to chapas table (per parga)
ALTER TABLE public.chapas ADD COLUMN IF NOT EXISTS parga1_espessura numeric;
ALTER TABLE public.chapas ADD COLUMN IF NOT EXISTS parga2_espessura numeric;
ALTER TABLE public.chapas ADD COLUMN IF NOT EXISTS parga3_espessura numeric;
ALTER TABLE public.chapas ADD COLUMN IF NOT EXISTS parga4_espessura numeric;
