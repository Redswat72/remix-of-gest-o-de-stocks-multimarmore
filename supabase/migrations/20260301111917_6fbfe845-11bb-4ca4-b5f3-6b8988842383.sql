
-- ============================================================
-- CRIAR TABELAS blocos, chapas, ladrilho
-- ============================================================

-- 1. BLOCOS (18 colunas)
CREATE TABLE public.blocos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_mm text NOT NULL,
  parque text NOT NULL,
  linha text,
  bloco_origem text,
  comprimento numeric,
  largura numeric,
  altura numeric,
  variedade text,
  quantidade_tons numeric NOT NULL DEFAULT 0,
  quantidade_kg numeric,
  fornecedor text,
  preco_unitario numeric,
  valor_inventario numeric,
  entrada_stock text,
  foto1_url text,
  foto2_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver blocos"
  ON public.blocos FOR SELECT
  USING (true);

CREATE POLICY "Admin pode inserir blocos"
  ON public.blocos FOR INSERT
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode atualizar blocos"
  ON public.blocos FOR UPDATE
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode eliminar blocos"
  ON public.blocos FOR DELETE
  USING (is_admin_or_above(auth.uid()));

-- 2. CHAPAS (30 colunas)
CREATE TABLE public.chapas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_mm text NOT NULL,
  bundle_id text,
  parque text NOT NULL,
  linha text,
  num_chapas integer,
  largura numeric,
  altura numeric,
  variedade text,
  quantidade_m2 numeric NOT NULL DEFAULT 0,
  fornecedor text,
  preco_unitario numeric,
  valor_inventario numeric,
  entrada_stock text,
  parga1_nome text,
  parga1_quantidade integer,
  parga1_comprimento numeric,
  parga1_altura numeric,
  parga1_foto_primeira text,
  parga1_foto_ultima text,
  parga2_nome text,
  parga2_quantidade integer,
  parga2_comprimento numeric,
  parga2_altura numeric,
  parga2_foto_primeira text,
  parga2_foto_ultima text,
  parga3_nome text,
  parga3_quantidade integer,
  parga3_comprimento numeric,
  parga3_altura numeric,
  parga3_foto_primeira text,
  parga3_foto_ultima text,
  parga4_nome text,
  parga4_quantidade integer,
  parga4_comprimento numeric,
  parga4_altura numeric,
  parga4_foto_primeira text,
  parga4_foto_ultima text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver chapas"
  ON public.chapas FOR SELECT
  USING (true);

CREATE POLICY "Admin pode inserir chapas"
  ON public.chapas FOR INSERT
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode atualizar chapas"
  ON public.chapas FOR UPDATE
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode eliminar chapas"
  ON public.chapas FOR DELETE
  USING (is_admin_or_above(auth.uid()));

-- 3. LADRILHO (22 colunas + id = 23)
CREATE TABLE public.ladrilho (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_mm text,
  parque text NOT NULL,
  tipo text,
  dimensoes text,
  comprimento numeric,
  largura numeric,
  altura numeric,
  espessura numeric,
  num_pecas integer,
  quantidade_m2 numeric NOT NULL DEFAULT 0,
  peso numeric,
  butch_no text,
  variedade text,
  acabamento text,
  nota text,
  valorizacao numeric,
  preco_unitario numeric,
  valor_inventario numeric,
  entrada_stock text,
  foto_amostra_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ladrilho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver ladrilho"
  ON public.ladrilho FOR SELECT
  USING (true);

CREATE POLICY "Admin pode inserir ladrilho"
  ON public.ladrilho FOR INSERT
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode atualizar ladrilho"
  ON public.ladrilho FOR UPDATE
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Admin pode eliminar ladrilho"
  ON public.ladrilho FOR DELETE
  USING (is_admin_or_above(auth.uid()));
