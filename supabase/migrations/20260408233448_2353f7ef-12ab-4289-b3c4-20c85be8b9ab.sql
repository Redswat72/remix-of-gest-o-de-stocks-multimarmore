
CREATE OR REPLACE FUNCTION public.registar_transferencia(
  p_id_mm text,
  p_tipo text,
  p_local_origem_id uuid,
  p_local_destino_id uuid,
  p_parque_destino text,
  p_tipo_documento text,
  p_numero_documento text,
  p_operador_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Atualizar parque do produto
  IF p_tipo = 'bloco' THEN
    UPDATE public.blocos SET parque = p_parque_destino WHERE id_mm = p_id_mm;
  ELSIF p_tipo = 'chapa' THEN
    UPDATE public.chapas SET parque = p_parque_destino WHERE id_mm = p_id_mm;
  ELSIF p_tipo = 'ladrilho' THEN
    UPDATE public.ladrilho SET parque = p_parque_destino WHERE id_mm = p_id_mm;
  ELSE
    RAISE EXCEPTION 'Tipo de produto inválido: %', p_tipo;
  END IF;

  -- 2. Registar movimento (o trigger update_stock_after_movimento trata do stock)
  INSERT INTO public.movimentos (
    id, tipo, tipo_documento, numero_documento,
    local_origem_id, local_destino_id, operador_id,
    id_mm, tipo_produto, quantidade,
    data_movimento, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'transferencia', p_tipo_documento::tipo_documento,
    NULLIF(p_numero_documento, ''), p_local_origem_id, p_local_destino_id, p_operador_id,
    p_id_mm, p_tipo, 1,
    now(), now(), now()
  );
END;
$$;
