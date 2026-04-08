
CREATE OR REPLACE FUNCTION public.transferir_produto(
  p_id_mm text,
  p_tipo text,
  p_parque_destino text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_tipo = 'bloco' THEN
    UPDATE public.blocos SET parque = p_parque_destino WHERE id_mm = p_id_mm;
  ELSIF p_tipo = 'chapa' THEN
    UPDATE public.chapas SET parque = p_parque_destino WHERE id_mm = p_id_mm;
  ELSIF p_tipo = 'ladrilho' THEN
    UPDATE public.ladrilho SET parque = p_parque_destino WHERE id_mm = p_id_mm;
  ELSE
    RAISE EXCEPTION 'Tipo de produto inválido: %', p_tipo;
  END IF;
END;
$$;
