CREATE OR REPLACE FUNCTION public.update_item_fotos(p_tabela text, p_id uuid, p_fotos jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed text[];
  k text;
  sets text[] := '{}';
  sql text;
BEGIN
  IF NOT (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'area_comercial')) THEN
    RAISE EXCEPTION 'Sem permissão para atualizar fotografias';
  END IF;

  IF p_tabela = 'blocos' THEN
    allowed := ARRAY['foto1_url','foto2_url','foto3_url','foto4_url'];
  ELSIF p_tabela = 'chapas' THEN
    allowed := ARRAY['parga1_foto_primeira','parga1_foto_ultima','parga2_foto_primeira','parga2_foto_ultima','parga3_foto_primeira','parga3_foto_ultima','parga4_foto_primeira','parga4_foto_ultima'];
  ELSIF p_tabela = 'ladrilho' THEN
    allowed := ARRAY['foto_amostra_url','foto1_url','foto2_url'];
  ELSE
    RAISE EXCEPTION 'Tabela inválida: %', p_tabela;
  END IF;

  FOR k IN SELECT jsonb_object_keys(p_fotos)
  LOOP
    IF k = ANY(allowed) THEN
      sets := sets || format('%I = %L', k, p_fotos ->> k);
    END IF;
  END LOOP;

  IF array_length(sets, 1) IS NULL THEN
    RETURN;
  END IF;

  sql := format('UPDATE public.%I SET %s WHERE id = %L', p_tabela, array_to_string(sets, ', '), p_id);
  EXECUTE sql;
END;
$$;

REVOKE ALL ON FUNCTION public.update_item_fotos(text, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_item_fotos(text, uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_item_fotos(text, uuid, jsonb) TO authenticated;