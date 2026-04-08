
CREATE OR REPLACE FUNCTION public.check_stock_disponivel()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    stock_atual INTEGER;
BEGIN
    IF NEW.tipo IN ('transferencia', 'saida') THEN
        SELECT COALESCE(SUM(quantidade), 0) INTO stock_atual
        FROM public.stock
        WHERE id_mm = NEW.id_mm
          AND tipo_produto = NEW.tipo_produto
          AND local_id = NEW.local_origem_id;
        
        IF stock_atual < NEW.quantidade THEN
            RAISE EXCEPTION 'Stock insuficiente. Disponível: %, Solicitado: %', stock_atual, NEW.quantidade;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_stock_after_movimento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.cancelado = false THEN
        IF NEW.tipo = 'entrada' THEN
            INSERT INTO public.stock (id_mm, tipo_produto, local_id, quantidade)
            VALUES (NEW.id_mm, NEW.tipo_produto, NEW.local_destino_id, NEW.quantidade)
            ON CONFLICT (id_mm, tipo_produto, local_id)
            DO UPDATE SET quantidade = stock.quantidade + EXCLUDED.quantidade;
        
        ELSIF NEW.tipo = 'transferencia' THEN
            UPDATE public.stock 
            SET quantidade = quantidade - NEW.quantidade
            WHERE id_mm = NEW.id_mm AND tipo_produto = NEW.tipo_produto AND local_id = NEW.local_origem_id;
            
            INSERT INTO public.stock (id_mm, tipo_produto, local_id, quantidade)
            VALUES (NEW.id_mm, NEW.tipo_produto, NEW.local_destino_id, NEW.quantidade)
            ON CONFLICT (id_mm, tipo_produto, local_id)
            DO UPDATE SET quantidade = stock.quantidade + EXCLUDED.quantidade;
        
        ELSIF NEW.tipo = 'saida' THEN
            UPDATE public.stock 
            SET quantidade = quantidade - NEW.quantidade
            WHERE id_mm = NEW.id_mm AND tipo_produto = NEW.tipo_produto AND local_id = NEW.local_origem_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.revert_stock_on_cancel()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.cancelado = true AND OLD.cancelado = false THEN
        IF NEW.tipo = 'entrada' THEN
            UPDATE public.stock 
            SET quantidade = quantidade - NEW.quantidade
            WHERE id_mm = NEW.id_mm AND tipo_produto = NEW.tipo_produto AND local_id = NEW.local_destino_id;
        
        ELSIF NEW.tipo = 'transferencia' THEN
            UPDATE public.stock 
            SET quantidade = quantidade + NEW.quantidade
            WHERE id_mm = NEW.id_mm AND tipo_produto = NEW.tipo_produto AND local_id = NEW.local_origem_id;
            
            UPDATE public.stock 
            SET quantidade = quantidade - NEW.quantidade
            WHERE id_mm = NEW.id_mm AND tipo_produto = NEW.tipo_produto AND local_id = NEW.local_destino_id;
        
        ELSIF NEW.tipo = 'saida' THEN
            UPDATE public.stock 
            SET quantidade = quantidade + NEW.quantidade
            WHERE id_mm = NEW.id_mm AND tipo_produto = NEW.tipo_produto AND local_id = NEW.local_origem_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;
