-- Corrigir políticas de stock para maior segurança
-- O stock só deve ser gerido através de funções específicas

-- Remover políticas permissivas
DROP POLICY IF EXISTS "Sistema pode gerir stock" ON public.stock;
DROP POLICY IF EXISTS "Sistema pode atualizar stock" ON public.stock;

-- Função SECURITY DEFINER para atualizar stock (bypass RLS)
CREATE OR REPLACE FUNCTION public.update_stock_after_movimento()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.cancelado = false THEN
        -- Movimento de entrada: aumentar stock no destino
        IF NEW.tipo = 'entrada' THEN
            INSERT INTO public.stock (produto_id, local_id, quantidade)
            VALUES (NEW.produto_id, NEW.local_destino_id, NEW.quantidade)
            ON CONFLICT (produto_id, local_id) 
            DO UPDATE SET quantidade = stock.quantidade + EXCLUDED.quantidade;
        
        -- Movimento de transferência: diminuir origem, aumentar destino
        ELSIF NEW.tipo = 'transferencia' THEN
            -- Diminuir na origem
            UPDATE public.stock 
            SET quantidade = quantidade - NEW.quantidade
            WHERE produto_id = NEW.produto_id AND local_id = NEW.local_origem_id;
            
            -- Aumentar no destino
            INSERT INTO public.stock (produto_id, local_id, quantidade)
            VALUES (NEW.produto_id, NEW.local_destino_id, NEW.quantidade)
            ON CONFLICT (produto_id, local_id) 
            DO UPDATE SET quantidade = stock.quantidade + EXCLUDED.quantidade;
        
        -- Movimento de saída: diminuir stock na origem
        ELSIF NEW.tipo = 'saida' THEN
            UPDATE public.stock 
            SET quantidade = quantidade - NEW.quantidade
            WHERE produto_id = NEW.produto_id AND local_id = NEW.local_origem_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para reverter stock quando movimento é cancelado
CREATE OR REPLACE FUNCTION public.revert_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    -- Só executa se o movimento foi cancelado (passou de false para true)
    IF NEW.cancelado = true AND OLD.cancelado = false THEN
        -- Reverter entrada: diminuir stock no destino
        IF NEW.tipo = 'entrada' THEN
            UPDATE public.stock 
            SET quantidade = quantidade - NEW.quantidade
            WHERE produto_id = NEW.produto_id AND local_id = NEW.local_destino_id;
        
        -- Reverter transferência: aumentar origem, diminuir destino
        ELSIF NEW.tipo = 'transferencia' THEN
            -- Aumentar na origem
            UPDATE public.stock 
            SET quantidade = quantidade + NEW.quantidade
            WHERE produto_id = NEW.produto_id AND local_id = NEW.local_origem_id;
            
            -- Diminuir no destino
            UPDATE public.stock 
            SET quantidade = quantidade - NEW.quantidade
            WHERE produto_id = NEW.produto_id AND local_id = NEW.local_destino_id;
        
        -- Reverter saída: aumentar stock na origem
        ELSIF NEW.tipo = 'saida' THEN
            UPDATE public.stock 
            SET quantidade = quantidade + NEW.quantidade
            WHERE produto_id = NEW.produto_id AND local_id = NEW.local_origem_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers para gestão automática de stock
CREATE TRIGGER manage_stock_on_movimento
AFTER INSERT ON public.movimentos
FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_movimento();

CREATE TRIGGER revert_stock_on_movimento_cancel
AFTER UPDATE ON public.movimentos
FOR EACH ROW EXECUTE FUNCTION public.revert_stock_on_cancel();

-- Função para verificar stock disponível antes de movimento
CREATE OR REPLACE FUNCTION public.check_stock_disponivel()
RETURNS TRIGGER AS $$
DECLARE
    stock_atual INTEGER;
BEGIN
    -- Só verifica para transferências e saídas
    IF NEW.tipo IN ('transferencia', 'saida') THEN
        SELECT COALESCE(quantidade, 0) INTO stock_atual
        FROM public.stock
        WHERE produto_id = NEW.produto_id AND local_id = NEW.local_origem_id;
        
        IF stock_atual < NEW.quantidade THEN
            RAISE EXCEPTION 'Stock insuficiente. Disponível: %, Solicitado: %', stock_atual, NEW.quantidade;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_stock_before_movimento
BEFORE INSERT ON public.movimentos
FOR EACH ROW EXECUTE FUNCTION public.check_stock_disponivel();

-- Novas políticas de stock mais restritivas
-- Apenas admin pode modificar stock diretamente (ajustes manuais)
CREATE POLICY "Admin pode inserir stock"
ON public.stock FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode atualizar stock"
ON public.stock FOR UPDATE
TO authenticated
USING (public.is_admin_or_above(auth.uid()))
WITH CHECK (public.is_admin_or_above(auth.uid()));