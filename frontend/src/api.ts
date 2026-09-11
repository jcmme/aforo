// Quita cualquier "/" final — si VITE_API_URL trae uno, evita el doble
// slash al concatenar con cada ruta (ej. ".../ //auth/login").
const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const TOKEN_KEY = 'aforo_token';
const USER_KEY = 'aforo_user';

export interface UsuarioSesion {
  email: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsuarioSesion(): UsuarioSesion | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function guardarSesion(token: string, email: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({ email }));
}

export function cerrarSesion(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function manejarError(res: Response): Promise<never> {
  let mensaje = res.statusText;
  try {
    const cuerpo = await res.json();
    mensaje = cuerpo.message ?? mensaje;
  } catch {
    // sin cuerpo JSON, se queda con statusText
  }
  throw new ApiError(res.status, Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) await manejarError(res);
  const texto = await res.text();
  return texto ? JSON.parse(texto) : (undefined as T);
}

export interface Antro {
  id: string;
  nombre: string;
}

export function listarAntros(): Promise<Antro[]> {
  return apiRequest<Antro[]>('/antros');
}

export interface FeatureCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface AntroAdmin {
  id: string;
  nombre: string;
  corporativoId: string;
  corporativoNombre: string;
}

export interface CorporativoAdmin {
  id: string;
  nombreComercial: string;
}

export interface FeaturesActivasPorAntro {
  antroId: string;
  features: string[];
}

export function obtenerFeaturesActivas(): Promise<FeaturesActivasPorAntro[]> {
  return apiRequest<FeaturesActivasPorAntro[]>('/feature-flags/activas');
}

export function listarCatalogoFeatures(): Promise<FeatureCatalogo[]> {
  return apiRequest<FeatureCatalogo[]>('/feature-flags/catalogo');
}

export function listarCorporativosAdmin(): Promise<CorporativoAdmin[]> {
  return apiRequest<CorporativoAdmin[]>('/feature-flags/admin/corporativos');
}

export function listarAntrosAdmin(): Promise<AntroAdmin[]> {
  return apiRequest<AntroAdmin[]>('/feature-flags/admin/antros');
}

export function obtenerEstadoFeaturesAntro(antroId: string): Promise<Record<string, boolean>> {
  return apiRequest<Record<string, boolean>>(`/feature-flags/admin/estado/${antroId}`);
}

export function actualizarFeatureAntro(antroId: string, featureCodigo: string, activo: boolean): Promise<void> {
  return apiRequest('/feature-flags/admin/antro', { method: 'PATCH', body: JSON.stringify({ antroId, featureCodigo, activo }) });
}

export function actualizarFeatureCorporativo(corporativoId: string, featureCodigo: string, activo: boolean): Promise<void> {
  return apiRequest('/feature-flags/admin/corporativo', {
    method: 'PATCH',
    body: JSON.stringify({ corporativoId, featureCodigo, activo }),
  });
}

export async function login(email: string, password: string): Promise<string> {
  const { accessToken } = await apiRequest<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return accessToken;
}

export function cambiarPassword(passwordActual: string, passwordNuevo: string): Promise<void> {
  return apiRequest<void>('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify({ passwordActual, passwordNuevo }),
  });
}

export async function exportarReporte(plantillaCodigo: string, filtros: Record<string, unknown> = {}): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/reportes/exportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ plantillaCodigo, filtros }),
  });

  if (!res.ok) await manejarError(res);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${plantillaCodigo}.pdf`;
  enlace.click();
  URL.revokeObjectURL(url);
}
