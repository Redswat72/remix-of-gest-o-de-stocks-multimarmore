
-- Add new columns to stock
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS id_mm text;
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS tipo_produto text;

-- Make produto_id nullable
ALTER TABLE public.stock ALTER COLUMN produto_id DROP NOT NULL;
ALTER TABLE public.stock ALTER COLUMN produto_id SET DEFAULT NULL;

-- Also make produto_id nullable on movimentos
ALTER TABLE public.movimentos ALTER COLUMN produto_id DROP NOT NULL;
ALTER TABLE public.movimentos ALTER COLUMN produto_id SET DEFAULT NULL;

-- Add id_mm and tipo_produto to movimentos if not exist
ALTER TABLE public.movimentos ADD COLUMN IF NOT EXISTS id_mm text;
ALTER TABLE public.movimentos ADD COLUMN IF NOT EXISTS tipo_produto text;

-- Drop old unique constraint on stock if exists
DO $$
BEGIN
  -- Try to drop the unique constraint on (produto_id, local_id)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.stock'::regclass 
    AND contype = 'u'
    AND conname LIKE '%produto_id%local_id%'
  ) THEN
    EXECUTE format('ALTER TABLE public.stock DROP CONSTRAINT %I',
      (SELECT conname FROM pg_constraint 
       WHERE conrelid = 'public.stock'::regclass 
       AND contype = 'u'
       AND conname LIKE '%produto_id%local_id%'
       LIMIT 1));
  END IF;
END $$;

-- Add new unique constraint
ALTER TABLE public.stock ADD CONSTRAINT stock_id_mm_tipo_local_unique 
  UNIQUE (id_mm, tipo_produto, local_id);
