import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import { DEMO_USUARIO } from '@/data/mock';
import type { Rol, Usuario } from '@/types';

export interface DatosRegistro {
  nombre: string;
  username: string;
  email: string;
  telefono: string;
  password: string;
}

interface AuthContextValue {
  usuario: Usuario | null;
  /** Rol activo para la navegación por rol. Toda cuenta nace cliente. */
  rolActivo: Rol;
  loading: boolean;
  /** `true` cuando la app corre sin Supabase (sesión simulada). */
  demo: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrar: (datos: DatosRegistro) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  /** Borra la cuenta del titular (App Store 5.1.1(v) / LFPDPPP). */
  eliminarCuenta: () => Promise<void>;
  /** Cambia el rol activo SOLO en modo demo (para recorrer las vistas). */
  cambiarRolDemo: (rol: Rol) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Mapea una fila de `usuarios` al modelo de dominio. */
function filaAUsuario(r: Record<string, any>): Usuario {
  return {
    id: r.id,
    nombre: r.nombre,
    username: r.username,
    email: r.email,
    telefono: r.telefono,
    emailVerificado: r.email_verificado ?? false,
    telefonoVerificado: r.telefono_verificado ?? false,
    creadoEn: r.creado_en,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [rolActivo, setRolActivo] = useState<Rol>('cliente');
  const [loading, setLoading] = useState(true);
  const demo = supabase === null;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void cargarPerfil(data.session.user.id);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) void cargarPerfil(session.user.id);
      else {
        setUsuario(null);
        setRolActivo('cliente');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function cargarPerfil(userId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) setUsuario(filaAUsuario(data));
    // El rol activo por defecto es cliente; las membresías de personal se
    // resuelven en las secciones de personal (2-4).
    setRolActivo('cliente');
    setLoading(false);
  }

  async function iniciarSesion(email: string, password: string) {
    if (!supabase) {
      setUsuario({ ...DEMO_USUARIO, email });
      setRolActivo('cliente');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function registrar(datos: DatosRegistro) {
    if (!supabase) {
      setUsuario({
        ...DEMO_USUARIO,
        nombre: datos.nombre,
        username: datos.username,
        email: datos.email,
        telefono: datos.telefono,
        emailVerificado: false,
      });
      setRolActivo('cliente');
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
    });
    if (error) throw error;
    if (data.user) {
      // Toda cuenta nace como cliente. Verificación de correo vía Supabase Auth;
      // la de teléfono se completa en un paso aparte (proveedor SMS).
      await supabase.from('usuarios').insert({
        id: data.user.id,
        nombre: datos.nombre,
        username: datos.username,
        email: datos.email,
        telefono: datos.telefono,
      });
    }
  }

  async function cerrarSesion() {
    if (supabase) await supabase.auth.signOut();
    setUsuario(null);
    setRolActivo('cliente');
  }

  async function eliminarCuenta() {
    if (!supabase) {
      // Demo: no hay backend; el borrado se simula cerrando la sesión.
      setUsuario(null);
      setRolActivo('cliente');
      return;
    }
    // El borrado real (anonimizar reservas + cascada) vive en el servidor.
    const { error } = await supabase.functions.invoke('eliminar-cuenta');
    if (error) throw new Error('No se pudo eliminar la cuenta. Intenta de nuevo.');
    await supabase.auth.signOut();
    setUsuario(null);
    setRolActivo('cliente');
  }

  function cambiarRolDemo(rol: Rol) {
    // Solo demo: en producción el rol proviene de las membresías del usuario.
    if (demo) setRolActivo(rol);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, rolActivo, loading, demo, iniciarSesion, registrar, cerrarSesion, eliminarCuenta, cambiarRolDemo }),
    [usuario, rolActivo, loading, demo],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
