import { createClient } from '@supabase/supabase-js';

const MAGRATEX_URL = 'https://dzpifvfgbezsdhoqvizu.supabase.co';
const MAGRATEX_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cGlmdmZnYmV6c2Rob3F2aXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODA2NzIsImV4cCI6MjA4NzE1NjY3Mn0.sp2YkZUsxmmczlPX5WiBXIM4AzePcMw9QuRbXYMrRVs';

export const supabaseMagratex = createClient(MAGRATEX_URL, MAGRATEX_ANON_KEY, {
  auth: {
    storageKey: 'sb-magratex-auth',
    persistSession: true,
    autoRefreshToken: true,
  },
});
