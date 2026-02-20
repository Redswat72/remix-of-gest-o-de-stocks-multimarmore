import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { supabaseMagratex } from '@/lib/supabase-magratex';

export type Empresa = 'multimarmore' | 'magratex';

export const EMPRESAS_CONFIG = {
  multimarmore: {
    id: 'multimarmore' as Empresa,
    nome: 'Multimarmore',
    cor: '#1a56db',
    idPrefix: 'IDMM',
    client: supabase,
  },
  magratex: {
    id: 'magratex' as Empresa,
    nome: 'Magratex',
    cor: '#057a55',
    idPrefix: 'IDMTX',
    client: supabaseMagratex,
  },
} as const;

interface EmpresaContextValue {
  empresa: Empresa | null;
  empresaConfig: typeof EMPRESAS_CONFIG[Empresa] | null;
  supabaseEmpresa: SupabaseClient | null;
  session: Session | null;
  user: User | null;
  userRole: string | null;
  loading: boolean;
  selectEmpresa: (e: Empresa) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextValue | null>(null);
const EMPRESA_STORAGE_KEY = 'grupo-empresa-selecionada';

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const empresaConfig = empresa ? EMPRESAS_CONFIG[empresa] : null;
  const supabaseEmpresa = empresaConfig ? empresaConfig.client : null;
  const user = session?.user ?? null;

  useEffect(() => {
    const saved = localStorage.getItem(EMPRESA_STORAGE_KEY) as Empresa | null;
    if (saved && EMPRESAS_CONFIG[saved]) {
      setEmpresa(saved);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!empresa || !supabaseEmpresa) return;
    setLoading(true);

    supabaseEmpresa.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchRole(supabaseEmpresa, data.session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabaseEmpresa.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) fetchRole(supabaseEmpresa, newSession.user.id);
      else { setUserRole(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, [empresa]);

  async function fetchRole(client: SupabaseClient, userId: string) {
    try {
      const { data } = await client.from('user_roles').select('role').eq('user_id', userId).single();
      setUserRole(data?.role ?? 'operador');
    } catch {
      setUserRole('operador');
    } finally {
      setLoading(false);
    }
  }

  const selectEmpresa = useCallback((e: Empresa) => {
    setEmpresa(e);
    setSession(null);
    setUserRole(null);
    localStorage.setItem(EMPRESA_STORAGE_KEY, e);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabaseEmpresa) return { error: new Error('Nenhuma empresa selecionada') };
    const { error } = await supabaseEmpresa.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, [supabaseEmpresa]);

  const signOut = useCallback(async () => {
    if (!supabaseEmpresa) return;
    await supabaseEmpresa.auth.signOut();
    setSession(null);
    setUserRole(null);
  }, [supabaseEmpresa]);

  return (
    <EmpresaContext.Provider value={{
      empresa, empresaConfig, supabaseEmpresa, session, user, userRole, loading, selectEmpresa, signIn, signOut,
    }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error('useEmpresa deve ser usado dentro de EmpresaProvider');
  return ctx;
}
