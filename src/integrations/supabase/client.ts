/**
 * ⚠️ ATENÇÃO - APENAS BD EXTERNA ⚠️
 * 
 * Este projeto utiliza EXCLUSIVAMENTE o Supabase externo (fgeouidkmtmfblgosgwr).
 * A infraestrutura Lovable Cloud NÃO deve ser usada para evitar perda de dados.
 * 
 * O cliente Supabase é configurado manualmente em src/lib/supabase-external.ts
 * para garantir isolamento total da cloud Lovable.
 * 
 * NÃO importar @supabase/supabase-js diretamente noutros ficheiros.
 * Usar sempre: import { supabase } from '@/integrations/supabase/client'
 * ou: import { supabase } from '@/lib/supabase-external'
 */

// Re-export do cliente Supabase externo Multimármore
export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase-external';
