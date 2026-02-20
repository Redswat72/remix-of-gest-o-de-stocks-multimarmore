import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useEmpresa } from '@/context/EmpresaContext';
import type { Profile, UserRole, AppRole, Local } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  userLocal: Local | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { supabaseEmpresa, session: empresaSession, user: empresaUser, signIn: empresaSignIn, signOut: empresaSignOut, loading: empresaLoading } = useEmpresa();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [userLocal, setUserLocal] = useState<Local | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loading = empresaLoading || profileLoading;
  const user = empresaUser;
  const session = empresaSession;

  const fetchProfile = async (userId: string) => {
    if (!supabaseEmpresa) return;
    setProfileLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabaseEmpresa
        .from('profiles')
        .select('*, local:locais(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) { console.error('Erro ao buscar profile:', profileError); return; }
      if (profileData) {
        setProfile(profileData as unknown as Profile);
        setUserLocal(profileData.local as unknown as Local);
      }

      const { data: rolesData, error: rolesError } = await supabaseEmpresa
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) { console.error('Erro ao buscar roles:', rolesError); return; }
      if (rolesData) setRoles(rolesData.map(r => r.role as AppRole));
    } catch (error) {
      console.error('Erro ao buscar dados do utilizador:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
      setRoles([]);
      setUserLocal(null);
    }
  }, [user?.id, supabaseEmpresa]);

  const signIn = async (email: string, password: string) => {
    return empresaSignIn(email, password);
  };

  const signUp = async (email: string, password: string, nome: string) => {
    if (!supabaseEmpresa) return { error: new Error('Nenhuma empresa selecionada') };
    const { error } = await supabaseEmpresa.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await empresaSignOut();
    setProfile(null);
    setRoles([]);
    setUserLocal(null);
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin') || hasRole('superadmin');
  const isSuperadmin = hasRole('superadmin');

  return (
    <AuthContext.Provider value={{
      user, session, profile, roles, userLocal, loading,
      signIn, signUp, signOut, hasRole, isAdmin, isSuperadmin, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
