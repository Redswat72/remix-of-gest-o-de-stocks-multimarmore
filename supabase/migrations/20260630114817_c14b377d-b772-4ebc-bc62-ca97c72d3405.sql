-- 1. Tabela de adendas aos movimentos
CREATE TABLE public.movimento_adendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimento_id UUID REFERENCES public.movimentos(id) ON DELETE CASCADE NOT NULL,
    validado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    descricao TEXT NOT NULL,
    estado_validacao VARCHAR(50) NOT NULL DEFAULT 'pendente', -- pendente, consumido_parcial, consumido_total, faturado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Grants obrigatórios
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimento_adendas TO authenticated;
GRANT ALL ON public.movimento_adendas TO service_role;

-- RLS
ALTER TABLE public.movimento_adendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizadores autenticados podem ver adendas"
ON public.movimento_adendas FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Apenas admin e comercial podem criar adendas"
ON public.movimento_adendas FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'area_comercial'));

CREATE POLICY "Apenas admin e comercial podem atualizar adendas"
ON public.movimento_adendas FOR UPDATE TO authenticated
USING (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'area_comercial'));

CREATE POLICY "Apenas admin e comercial podem apagar adendas"
ON public.movimento_adendas FOR DELETE TO authenticated
USING (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'area_comercial'));

-- Trigger updated_at
CREATE TRIGGER update_movimento_adendas_updated_at
BEFORE UPDATE ON public.movimento_adendas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger auditoria adenda
CREATE OR REPLACE FUNCTION public.audit_movimento_adenda()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_nome VARCHAR;
    v_user_email VARCHAR;
    v_user_role VARCHAR;
    v_tipo_acao VARCHAR;
    v_descricao TEXT;
BEGIN
    SELECT p.nome, p.email INTO v_user_nome, v_user_email
    FROM public.profiles p WHERE p.user_id = auth.uid();
    
    SELECT ur.role::VARCHAR INTO v_user_role
    FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    LIMIT 1;
    
    IF TG_OP = 'INSERT' THEN
        v_tipo_acao := 'criacao_adenda';
        v_descricao := 'Adenda registada no movimento ' || NEW.movimento_id || '. Estado: ' || NEW.estado_validacao || '. Descrição: ' || NEW.descricao;
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'movimento_adendas', NEW.id, v_descricao, to_jsonb(NEW));
    
    ELSIF TG_OP = 'UPDATE' THEN
        v_tipo_acao := 'edicao_adenda';
        v_descricao := 'Adenda editada no movimento ' || NEW.movimento_id || '. Estado: ' || NEW.estado_validacao;
        
        INSERT INTO public.auditoria (user_id, user_nome, user_email, user_role, tipo_acao, entidade, entidade_id, descricao, dados_anteriores, dados_novos)
        VALUES (auth.uid(), COALESCE(v_user_nome, 'Sistema'), COALESCE(v_user_email, 'sistema@app'), COALESCE(v_user_role, 'sistema'), v_tipo_acao, 'movimento_adendas', NEW.id, v_descricao, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_movimento_adendas_trigger
AFTER INSERT OR UPDATE ON public.movimento_adendas
FOR EACH ROW EXECUTE FUNCTION public.audit_movimento_adenda();


-- 2. Tabela de anexos das adendas
CREATE TABLE public.movimento_anexos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adenda_id UUID REFERENCES public.movimento_adendas(id) ON DELETE CASCADE NOT NULL,
    ficheiro_url TEXT NOT NULL,
    ficheiro_nome TEXT NOT NULL,
    tipo_ficheiro VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Grants obrigatórios
GRANT SELECT, INSERT, DELETE ON public.movimento_anexos TO authenticated;
GRANT ALL ON public.movimento_anexos TO service_role;

-- RLS
ALTER TABLE public.movimento_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizadores autenticados podem ver anexos de adendas"
ON public.movimento_anexos FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Apenas admin e comercial podem criar anexos de adendas"
ON public.movimento_anexos FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'area_comercial'));

CREATE POLICY "Apenas admin e comercial podem apagar anexos de adendas"
ON public.movimento_anexos FOR DELETE TO authenticated
USING (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'area_comercial'));


-- 3. Storage RLS para o bucket movimentos_anexos
CREATE POLICY "Utilizadores autenticados podem ver objetos de anexos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'movimentos_anexos');

CREATE POLICY "Admin e comercial podem carregar objetos de anexos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'movimentos_anexos' AND (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'area_comercial')));

CREATE POLICY "Admin e comercial podem apagar objetos de anexos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'movimentos_anexos' AND (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'area_comercial')));
