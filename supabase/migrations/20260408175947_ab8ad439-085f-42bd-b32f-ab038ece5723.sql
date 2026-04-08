
ALTER TABLE public.blocos ADD COLUMN IF NOT EXISTS foto3_url text;

ALTER TABLE public.ladrilho ADD COLUMN IF NOT EXISTS foto1_url text;
ALTER TABLE public.ladrilho ADD COLUMN IF NOT EXISTS foto2_url text;
