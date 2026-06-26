import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  /** `true` si la app corre sin Supabase (auth simulada en memoria). */
  demo: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    nombre: string,
    rol: UserRole,
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const demo = supabase === null;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    // Carga la sesión inicial y escucha cambios de auth.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void loadProfile(data.session.user.id);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) void loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      setProfile({
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        rol: data.rol,
        corporativoId: data.corporativo_id,
      });
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    if (!supabase) {
      // Modo demo: acepta cualquier credencial como cliente.
      setProfile({
        id: 'demo-user',
        email,
        nombre: 'Invitado',
        rol: 'cliente',
        corporativoId: null,
      });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signUp(
    email: string,
    password: string,
    nombre: string,
    rol: UserRole,
  ) {
    if (!supabase) {
      setProfile({
        id: 'demo-user',
        email,
        nombre,
        rol,
        corporativoId: rol === 'venue_staff' ? 'c1' : null,
      });
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      // Crea el perfil asociado. `corporativo_id` se asigna luego en onboarding.
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        nombre,
        rol,
      });
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ profile, loading, demo, signIn, signUp, signOut }),
    [profile, loading, demo],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
