-- Adicionar colunas de pargas para chapas
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS parga1_nome TEXT,
ADD COLUMN IF NOT EXISTS parga1_quantidade INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parga2_nome TEXT,
ADD COLUMN IF NOT EXISTS parga2_quantidade INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parga3_nome TEXT,
ADD COLUMN IF NOT EXISTS parga3_quantidade INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parga4_nome TEXT,
ADD COLUMN IF NOT EXISTS parga4_quantidade INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantidade_total_chapas INTEGER DEFAULT 0;

-- Função para calcular quantidade total de chapas
CREATE OR REPLACE FUNCTION public.calculate_quantidade_total_chapas()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    -- Só calcula para chapas
    IF NEW.forma = 'chapa' THEN
        NEW.quantidade_total_chapas := COALESCE(NEW.parga1_quantidade, 0) 
                                      + COALESCE(NEW.parga2_quantidade, 0) 
                                      + COALESCE(NEW.parga3_quantidade, 0) 
                                      + COALESCE(NEW.parga4_quantidade, 0);
    ELSE
        -- Para não-chapas, limpar os campos de parga
        NEW.parga1_nome := NULL;
        NEW.parga1_quantidade := NULL;
        NEW.parga2_nome := NULL;
        NEW.parga2_quantidade := NULL;
        NEW.parga3_nome := NULL;
        NEW.parga3_quantidade := NULL;
        NEW.parga4_nome := NULL;
        NEW.parga4_quantidade := NULL;
        NEW.quantidade_total_chapas := NULL;
    END IF;
    RETURN NEW;
END;
$function$;

-- Trigger para calcular automaticamente
DROP TRIGGER IF EXISTS trigger_calculate_quantidade_total_chapas ON public.produtos;
CREATE TRIGGER trigger_calculate_quantidade_total_chapas
BEFORE INSERT OR UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.calculate_quantidade_total_chapas();

-- Atualizar produtos existentes do tipo chapa
UPDATE public.produtos
SET quantidade_total_chapas = COALESCE(parga1_quantidade, 0) 
                             + COALESCE(parga2_quantidade, 0) 
                             + COALESCE(parga3_quantidade, 0) 
                             + COALESCE(parga4_quantidade, 0)
WHERE forma = 'chapa';