// Cliente Supabase para instância externa Multimármore
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fgeouidkmtmfblgosgwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZW91aWRrbXRtZmJsZ29zZ3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTM2ODgsImV4cCI6MjA4NTY4OTY4OH0.vZqdreg6iODzirCHP5dnsDcNUUxqwdm_SJYHcpEY0g4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
