// Cliente Supabase para Lovable Cloud
// Este ficheiro agora aponta para o Lovable Cloud em vez do projeto externo
import { createClient } from '@supabase/supabase-js';

// Lovable Cloud credentials
const SUPABASE_URL = 'https://wrqejvbckvvcqmmoirst.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycWVqdmJja3Z2Y3FtbW9pcnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTI3MjIsImV4cCI6MjA4NTY4ODcyMn0.BVk7T9ZRi7X43hr8MdNI-1vQwfIHJU0hij3l9HiKvy0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
