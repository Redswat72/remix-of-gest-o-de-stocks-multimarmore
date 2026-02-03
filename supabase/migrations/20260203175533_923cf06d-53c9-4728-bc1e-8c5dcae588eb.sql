-- Adicionar colunas de dimensões e fotos para cada parga (1-4)
-- Estas colunas são usadas apenas quando forma = 'chapa'

-- Parga 1 - dimensões e fotos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS parga1_comprimento_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga1_altura_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga1_espessura_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga1_foto1_url text NULL,
ADD COLUMN IF NOT EXISTS parga1_foto2_url text NULL;

-- Parga 2 - dimensões e fotos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS parga2_comprimento_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga2_altura_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga2_espessura_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga2_foto1_url text NULL,
ADD COLUMN IF NOT EXISTS parga2_foto2_url text NULL;

-- Parga 3 - dimensões e fotos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS parga3_comprimento_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga3_altura_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga3_espessura_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga3_foto1_url text NULL,
ADD COLUMN IF NOT EXISTS parga3_foto2_url text NULL;

-- Parga 4 - dimensões e fotos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS parga4_comprimento_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga4_altura_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga4_espessura_cm numeric NULL,
ADD COLUMN IF NOT EXISTS parga4_foto1_url text NULL,
ADD COLUMN IF NOT EXISTS parga4_foto2_url text NULL;