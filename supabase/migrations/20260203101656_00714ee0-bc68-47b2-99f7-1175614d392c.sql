-- =====================================
-- PLATAFORMA GESTÃO STOCK MULTIMÁRMORE
-- =====================================

-- 1. ENUMS
-- =====================================
CREATE TYPE public.app_role AS ENUM ('operador', 'admin', 'superadmin');
CREATE TYPE public.forma_produto AS ENUM ('bloco', 'chapa', 'ladrilho');
CREATE TYPE public.tipo_movimento AS ENUM ('entrada', 'transferencia', 'saida');
CREATE TYPE public.tipo_documento AS ENUM ('guia_transporte', 'guia_transferencia', 'factura', 'sem_documento');
CREATE TYPE public.origem_material AS ENUM ('adquirido', 'producao_propria');

-- 2. TABELA LOCAIS (Parques/Armazéns)
-- =====================================
CREATE TABLE public.locais (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    morada TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELA PROFILES (Utilizadores)
-- =====================================
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    local_id UUID REFERENCES public.locais(id),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA USER_ROLES (Segurança - Separada)
-- =====================================
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'operador',
    UNIQUE (user_id, role)
);

-- 5. TABELA CLIENTES
-- =====================================
CREATE TABLE public.clientes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    nif VARCHAR(9),
    morada TEXT,
    codigo_postal VARCHAR(10),
    localidade VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABELA PRODUTOS
-- =====================================
CREATE TABLE public.produtos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idmm VARCHAR(50) NOT NULL UNIQUE,
    tipo_pedra VARCHAR(100) NOT NULL,
    nome_comercial VARCHAR(100),
    forma forma_produto NOT NULL,
    acabamento VARCHAR(50),
    -- Dimensões (campos conforme forma)
    comprimento_cm DECIMAL(10,2),
    largura_cm DECIMAL(10,2),
    altura_cm DECIMAL(10,2),
    espessura_cm DECIMAL(10,2),
    -- Área e Volume calculados
    area_m2 DECIMAL(10,4),
    volume_m3 DECIMAL(10,6),
    -- Fotos (URLs)
    foto1_url TEXT,
    foto2_url TEXT,
    foto3_url TEXT,
    -- Localização GPS
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    -- Metadados
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABELA STOCK (Quantidade por produto/local)
-- =====================================
CREATE TABLE public.stock (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
    local_id UUID REFERENCES public.locais(id) ON DELETE CASCADE NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (produto_id, local_id)
);

-- 8. TABELA MOVIMENTOS
-- =====================================
CREATE TABLE public.movimentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo tipo_movimento NOT NULL,
    tipo_documento tipo_documento NOT NULL,
    numero_documento VARCHAR(50),
    origem_material origem_material,
    -- Produto e quantidade
    produto_id UUID REFERENCES public.produtos(id) NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    -- Locais
    local_origem_id UUID REFERENCES public.locais(id),
    local_destino_id UUID REFERENCES public.locais(id),
    -- Cliente (para saídas)
    cliente_id UUID REFERENCES public.clientes(id),
    -- Transporte
    matricula_viatura VARCHAR(15),
    -- Operador que registou
    operador_id UUID REFERENCES auth.users(id) NOT NULL,
    -- Cancelamento
    cancelado BOOLEAN NOT NULL DEFAULT false,
    cancelado_por UUID REFERENCES auth.users(id),
    cancelado_em TIMESTAMPTZ,
    motivo_cancelamento TEXT,
    -- Observações
    observacoes TEXT,
    -- Timestamps
    data_movimento TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Validações
    CONSTRAINT movimento_transferencia_locais CHECK (
        (tipo = 'transferencia' AND local_origem_id IS NOT NULL AND local_destino_id IS NOT NULL AND local_origem_id != local_destino_id)
        OR tipo != 'transferencia'
    ),
    CONSTRAINT movimento_saida_cliente CHECK (
        (tipo = 'saida' AND cliente_id IS NOT NULL AND local_origem_id IS NOT NULL)
        OR tipo != 'saida'
    ),
    CONSTRAINT movimento_entrada_destino CHECK (
        (tipo = 'entrada' AND local_destino_id IS NOT NULL)
        OR tipo != 'entrada'
    ),
    CONSTRAINT movimento_entre_parques_documento CHECK (
        (tipo = 'transferencia' AND tipo_documento != 'sem_documento')
        OR tipo != 'transferencia'
    ),
    CONSTRAINT movimento_saida_documento CHECK (
        (tipo = 'saida' AND tipo_documento != 'sem_documento')
        OR tipo != 'saida'
    )
);

-- =====================================
-- SECURITY DEFINER FUNCTIONS
-- =====================================

-- Função para verificar role (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Função para obter o local do utilizador
CREATE OR REPLACE FUNCTION public.get_user_local(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT local_id
    FROM public.profiles
    WHERE user_id = _user_id
$$;

-- Função para verificar se é admin ou superior
CREATE OR REPLACE FUNCTION public.is_admin_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'superadmin')
    )
$$;

-- =====================================
-- TRIGGERS
-- =====================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_locais_updated_at BEFORE UPDATE ON public.locais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON public.stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_movimentos_updated_at BEFORE UPDATE ON public.movimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para calcular área/volume automaticamente
CREATE OR REPLACE FUNCTION public.calculate_produto_dimensions()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular área e volume conforme a forma
    IF NEW.forma = 'bloco' THEN
        -- Bloco: área = 2*(c*l + c*a + l*a), volume = c*l*a
        IF NEW.comprimento_cm IS NOT NULL AND NEW.largura_cm IS NOT NULL AND NEW.altura_cm IS NOT NULL THEN
            NEW.area_m2 = 2 * (
                (NEW.comprimento_cm * NEW.largura_cm) +
                (NEW.comprimento_cm * NEW.altura_cm) +
                (NEW.largura_cm * NEW.altura_cm)
            ) / 10000;
            NEW.volume_m3 = (NEW.comprimento_cm * NEW.largura_cm * NEW.altura_cm) / 1000000;
        END IF;
    ELSIF NEW.forma = 'chapa' THEN
        -- Chapa: área = c*l, volume = c*l*espessura
        IF NEW.comprimento_cm IS NOT NULL AND NEW.largura_cm IS NOT NULL THEN
            NEW.area_m2 = (NEW.comprimento_cm * NEW.largura_cm) / 10000;
            IF NEW.espessura_cm IS NOT NULL THEN
                NEW.volume_m3 = (NEW.comprimento_cm * NEW.largura_cm * NEW.espessura_cm) / 1000000;
            END IF;
        END IF;
    ELSIF NEW.forma = 'ladrilho' THEN
        -- Ladrilho: área = c*l, volume = c*l*espessura
        IF NEW.comprimento_cm IS NOT NULL AND NEW.largura_cm IS NOT NULL THEN
            NEW.area_m2 = (NEW.comprimento_cm * NEW.largura_cm) / 10000;
            IF NEW.espessura_cm IS NOT NULL THEN
                NEW.volume_m3 = (NEW.comprimento_cm * NEW.largura_cm * NEW.espessura_cm) / 1000000;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER calculate_produto_dimensions_trigger 
BEFORE INSERT OR UPDATE ON public.produtos 
FOR EACH ROW EXECUTE FUNCTION public.calculate_produto_dimensions();

-- Trigger para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, nome, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), NEW.email);
    
    -- Por defeito, novos utilizadores são operadores
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'operador');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================
-- ROW LEVEL SECURITY
-- =====================================

-- LOCAIS
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver locais ativos"
ON public.locais FOR SELECT
TO authenticated
USING (ativo = true OR public.is_admin_or_above(auth.uid()));

CREATE POLICY "Superadmin pode gerir locais"
ON public.locais FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizadores vêem o próprio perfil"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_above(auth.uid()));

CREATE POLICY "Utilizadores atualizam o próprio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin pode gerir profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin_or_above(auth.uid()))
WITH CHECK (public.is_admin_or_above(auth.uid()));

-- USER_ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizadores vêem os próprios roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_above(auth.uid()));

CREATE POLICY "Superadmin pode gerir roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- CLIENTES
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver clientes"
ON public.clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin pode gerir clientes"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode atualizar clientes"
ON public.clientes FOR UPDATE
TO authenticated
USING (public.is_admin_or_above(auth.uid()))
WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode eliminar clientes"
ON public.clientes FOR DELETE
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- PRODUTOS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver produtos"
ON public.produtos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin pode gerir produtos"
ON public.produtos FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode atualizar produtos"
ON public.produtos FOR UPDATE
TO authenticated
USING (public.is_admin_or_above(auth.uid()))
WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode eliminar produtos"
ON public.produtos FOR DELETE
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- STOCK
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver stock"
ON public.stock FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sistema pode gerir stock"
ON public.stock FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar stock"
ON public.stock FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- MOVIMENTOS
ALTER TABLE public.movimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver movimentos"
ON public.movimentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Operadores podem criar movimentos no seu local"
ON public.movimentos FOR INSERT
TO authenticated
WITH CHECK (
    operador_id = auth.uid() AND
    (
        -- Entrada no seu local
        (tipo = 'entrada' AND local_destino_id = public.get_user_local(auth.uid()))
        -- Transferência/Saída do seu local OU é admin
        OR (tipo IN ('transferencia', 'saida') AND (local_origem_id = public.get_user_local(auth.uid()) OR public.is_admin_or_above(auth.uid())))
        -- Admins podem criar qualquer movimento
        OR public.is_admin_or_above(auth.uid())
    )
);

CREATE POLICY "Admin pode cancelar movimentos"
ON public.movimentos FOR UPDATE
TO authenticated
USING (public.is_admin_or_above(auth.uid()))
WITH CHECK (public.is_admin_or_above(auth.uid()));

-- =====================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================
CREATE INDEX idx_produtos_idmm ON public.produtos(idmm);
CREATE INDEX idx_produtos_tipo_pedra ON public.produtos(tipo_pedra);
CREATE INDEX idx_produtos_forma ON public.produtos(forma);
CREATE INDEX idx_stock_produto_local ON public.stock(produto_id, local_id);
CREATE INDEX idx_movimentos_produto ON public.movimentos(produto_id);
CREATE INDEX idx_movimentos_data ON public.movimentos(data_movimento DESC);
CREATE INDEX idx_movimentos_operador ON public.movimentos(operador_id);
CREATE INDEX idx_movimentos_cliente ON public.movimentos(cliente_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);