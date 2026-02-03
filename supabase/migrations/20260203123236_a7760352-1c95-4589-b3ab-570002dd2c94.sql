-- Corrigir função audit_user_role para lidar com signup (quando auth.uid() é NULL)
CREATE OR REPLACE FUNCTION public.audit_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_user_nome VARCHAR;
    v_user_email VARCHAR;
    v_user_role VARCHAR;
    v_target_nome VARCHAR;
    v_descricao TEXT;
    v_tipo_acao VARCHAR;
BEGIN
    -- Determinar o user_id: usar auth.uid() se disponível, senão usar o user_id do registo
    v_user_id := COALESCE(auth.uid(), NEW.user_id);
    
    -- Se ainda for null (não deve acontecer), retornar sem auditar
    IF v_user_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Obter info do utilizador que está a fazer a ação
    SELECT p.nome, p.email INTO v_user_nome, v_user_email
    FROM public.profiles p WHERE p.user_id = v_user_id;
    
    SELECT ur.role::VARCHAR INTO v_user_role
    FROM public.user_roles ur WHERE ur.user_id = v_user_id
    LIMIT 1;
    
    -- Obter nome do utilizador alvo
    SELECT p.nome INTO v_target_nome
    FROM public.profiles p WHERE p.user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    IF TG_OP = 'INSERT' THEN
        v_tipo_acao := 'atribuicao_role';
        v_descricao := 'Role ' || NEW.role || ' atribuída ao utilizador ' || COALESCE(v_target_nome, 'Novo utilizador');
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_novos)
        VALUES (v_user_id, COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'user_roles', NEW.id, v_descricao, to_jsonb(NEW));
    
    ELSIF TG_OP = 'UPDATE' THEN
        v_tipo_acao := 'alteracao_role';
        v_descricao := 'Role alterada de ' || OLD.role || ' para ' || NEW.role || ' do utilizador ' || COALESCE(v_target_nome, 'Desconhecido');
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_anteriores, dados_novos)
        VALUES (v_user_id, COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'user_roles', NEW.id, v_descricao, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;