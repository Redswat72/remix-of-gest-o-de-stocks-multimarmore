-- Tabela de Auditoria
CREATE TABLE public.auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID NOT NULL,
    user_nome VARCHAR NOT NULL,
    user_email VARCHAR NOT NULL,
    user_role VARCHAR NOT NULL,
    tipo_acao VARCHAR NOT NULL,
    entidade VARCHAR NOT NULL,
    entidade_id UUID,
    descricao TEXT NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_auditoria_data_hora ON public.auditoria(data_hora DESC);
CREATE INDEX idx_auditoria_user_id ON public.auditoria(user_id);
CREATE INDEX idx_auditoria_tipo_acao ON public.auditoria(tipo_acao);
CREATE INDEX idx_auditoria_entidade ON public.auditoria(entidade);

-- Enable RLS
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Apenas superadmin pode ver auditoria
CREATE POLICY "Superadmin pode ver auditoria"
ON public.auditoria
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

-- Sistema pode inserir (via triggers)
CREATE POLICY "Sistema pode inserir auditoria"
ON public.auditoria
FOR INSERT
WITH CHECK (true);

-- Função para registar auditoria de movimentos
CREATE OR REPLACE FUNCTION public.audit_movimento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_nome VARCHAR;
    v_user_email VARCHAR;
    v_user_role VARCHAR;
    v_descricao TEXT;
    v_tipo_acao VARCHAR;
BEGIN
    -- Obter info do utilizador
    SELECT p.nome, p.email INTO v_user_nome, v_user_email
    FROM public.profiles p WHERE p.user_id = COALESCE(NEW.operador_id, OLD.operador_id);
    
    SELECT ur.role::VARCHAR INTO v_user_role
    FROM public.user_roles ur WHERE ur.user_id = COALESCE(NEW.operador_id, OLD.operador_id)
    LIMIT 1;
    
    IF TG_OP = 'INSERT' THEN
        v_tipo_acao := 'criacao_movimento';
        v_descricao := 'Movimento ' || NEW.tipo || ' criado. Produto: ' || NEW.produto_id || ', Quantidade: ' || NEW.quantidade;
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_novos)
        VALUES (NEW.operador_id, COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'movimentos', NEW.id, v_descricao, to_jsonb(NEW));
    
    ELSIF TG_OP = 'UPDATE' AND NEW.cancelado = true AND OLD.cancelado = false THEN
        v_tipo_acao := 'cancelamento_movimento';
        v_descricao := 'Movimento cancelado. Motivo: ' || COALESCE(NEW.motivo_cancelamento, 'Não especificado');
        
        -- Usar cancelado_por se disponível
        IF NEW.cancelado_por IS NOT NULL THEN
            SELECT p.nome, p.email INTO v_user_nome, v_user_email
            FROM public.profiles p WHERE p.user_id = NEW.cancelado_por;
            
            SELECT ur.role::VARCHAR INTO v_user_role
            FROM public.user_roles ur WHERE ur.user_id = NEW.cancelado_por
            LIMIT 1;
        END IF;
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_anteriores, dados_novos)
        VALUES (COALESCE(NEW.cancelado_por, NEW.operador_id), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'movimentos', NEW.id, v_descricao, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Função para registar auditoria de produtos
CREATE OR REPLACE FUNCTION public.audit_produto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_nome VARCHAR;
    v_user_email VARCHAR;
    v_user_role VARCHAR;
    v_descricao TEXT;
    v_tipo_acao VARCHAR;
BEGIN
    -- Obter info do utilizador atual
    SELECT p.nome, p.email INTO v_user_nome, v_user_email
    FROM public.profiles p WHERE p.user_id = auth.uid();
    
    SELECT ur.role::VARCHAR INTO v_user_role
    FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    LIMIT 1;
    
    IF TG_OP = 'INSERT' THEN
        v_tipo_acao := 'criacao_produto';
        v_descricao := 'Produto criado: ' || NEW.idmm || ' - ' || NEW.tipo_pedra;
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'produtos', NEW.id, v_descricao, to_jsonb(NEW));
    
    ELSIF TG_OP = 'UPDATE' THEN
        v_tipo_acao := 'edicao_produto';
        v_descricao := 'Produto editado: ' || NEW.idmm;
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_anteriores, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'produtos', NEW.id, v_descricao, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Função para registar auditoria de clientes
CREATE OR REPLACE FUNCTION public.audit_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_nome VARCHAR;
    v_user_email VARCHAR;
    v_user_role VARCHAR;
    v_descricao TEXT;
    v_tipo_acao VARCHAR;
BEGIN
    SELECT p.nome, p.email INTO v_user_nome, v_user_email
    FROM public.profiles p WHERE p.user_id = auth.uid();
    
    SELECT ur.role::VARCHAR INTO v_user_role
    FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    LIMIT 1;
    
    IF TG_OP = 'INSERT' THEN
        v_tipo_acao := 'criacao_cliente';
        v_descricao := 'Cliente criado: ' || NEW.nome;
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'clientes', NEW.id, v_descricao, to_jsonb(NEW));
    
    ELSIF TG_OP = 'UPDATE' THEN
        v_tipo_acao := 'edicao_cliente';
        v_descricao := 'Cliente editado: ' || NEW.nome;
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_anteriores, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'clientes', NEW.id, v_descricao, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Função para registar auditoria de locais
CREATE OR REPLACE FUNCTION public.audit_local()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_nome VARCHAR;
    v_user_email VARCHAR;
    v_user_role VARCHAR;
    v_descricao TEXT;
    v_tipo_acao VARCHAR;
BEGIN
    SELECT p.nome, p.email INTO v_user_nome, v_user_email
    FROM public.profiles p WHERE p.user_id = auth.uid();
    
    SELECT ur.role::VARCHAR INTO v_user_role
    FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    LIMIT 1;
    
    IF TG_OP = 'INSERT' THEN
        v_tipo_acao := 'criacao_local';
        v_descricao := 'Local criado: ' || NEW.nome || ' (' || NEW.codigo || ')';
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'locais', NEW.id, v_descricao, to_jsonb(NEW));
    
    ELSIF TG_OP = 'UPDATE' THEN
        v_tipo_acao := 'edicao_local';
        v_descricao := 'Local editado: ' || NEW.nome;
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_anteriores, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'locais', NEW.id, v_descricao, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Função para registar auditoria de user_roles
CREATE OR REPLACE FUNCTION public.audit_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_nome VARCHAR;
    v_user_email VARCHAR;
    v_user_role VARCHAR;
    v_target_nome VARCHAR;
    v_descricao TEXT;
    v_tipo_acao VARCHAR;
BEGIN
    SELECT p.nome, p.email INTO v_user_nome, v_user_email
    FROM public.profiles p WHERE p.user_id = auth.uid();
    
    SELECT ur.role::VARCHAR INTO v_user_role
    FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    LIMIT 1;
    
    SELECT p.nome INTO v_target_nome
    FROM public.profiles p WHERE p.user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    IF TG_OP = 'INSERT' THEN
        v_tipo_acao := 'atribuicao_role';
        v_descricao := 'Role ' || NEW.role || ' atribuída ao utilizador ' || COALESCE(v_target_nome, 'Desconhecido');
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'user_roles', NEW.id, v_descricao, to_jsonb(NEW));
    
    ELSIF TG_OP = 'UPDATE' THEN
        v_tipo_acao := 'alteracao_role';
        v_descricao := 'Role alterada de ' || OLD.role || ' para ' || NEW.role || ' do utilizador ' || COALESCE(v_target_nome, 'Desconhecido');
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_anteriores, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'user_roles', NEW.id, v_descricao, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Função para registar auditoria de profiles (alteração de parque)
CREATE OR REPLACE FUNCTION public.audit_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_nome VARCHAR;
    v_user_email VARCHAR;
    v_user_role VARCHAR;
    v_descricao TEXT;
    v_tipo_acao VARCHAR;
BEGIN
    SELECT p.nome, p.email INTO v_user_nome, v_user_email
    FROM public.profiles p WHERE p.user_id = auth.uid();
    
    SELECT ur.role::VARCHAR INTO v_user_role
    FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    LIMIT 1;
    
    IF TG_OP = 'UPDATE' AND OLD.local_id IS DISTINCT FROM NEW.local_id THEN
        v_tipo_acao := 'alteracao_parque_utilizador';
        v_descricao := 'Parque do utilizador ' || NEW.nome || ' alterado';
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_anteriores, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'profiles', NEW.id, v_descricao, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar triggers
CREATE TRIGGER audit_movimento_trigger
AFTER INSERT OR UPDATE ON public.movimentos
FOR EACH ROW EXECUTE FUNCTION public.audit_movimento();

CREATE TRIGGER audit_produto_trigger
AFTER INSERT OR UPDATE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.audit_produto();

CREATE TRIGGER audit_cliente_trigger
AFTER INSERT OR UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.audit_cliente();

CREATE TRIGGER audit_local_trigger
AFTER INSERT OR UPDATE ON public.locais
FOR EACH ROW EXECUTE FUNCTION public.audit_local();

CREATE TRIGGER audit_user_role_trigger
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_user_role();

CREATE TRIGGER audit_profile_trigger
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_profile();