import { useEffect, useState } from 'react';
import { apiRequest, listarAntros, obtenerFeaturesActivas, Antro, ApiError, VerComo, entrarComo, salirDeVerComo, hayVerComo } from '../api';
import { AlcanceContext, Alcance } from '../scope-context';
import { FeatureFlagsContext } from '../feature-flags-context';
import ScopeChip from '../components/ScopeChip';
import ReservasPanel from './panels/ReservasPanel';
import RequisicionesPanel from './panels/RequisicionesPanel';
import PersonalPanel from './panels/PersonalPanel';
import NominaPanel from './panels/NominaPanel';
import MetricasPanel from './panels/MetricasPanel';
import ProveedoresPanel from './panels/ProveedoresPanel';
import UsuariosPanel from './panels/UsuariosPanel';
import CuentasPanel from './panels/CuentasPanel';
import ClientesPanel from './panels/ClientesPanel';
import FeatureFlagsPanel from './panels/FeatureFlagsPanel';
import AuditoriaPanel from './panels/AuditoriaPanel';
import ConfiguracionPanel from './panels/ConfiguracionPanel';
import EntrarPanel from './panels/EntrarPanel';

const SECCIONES = [
  { id: 'metricas', label: 'Métricas' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'requisiciones', label: 'Requisiciones' },
  { id: 'personal', label: 'Personal y asistencia' },
  { id: 'nomina', label: 'Nómina' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'cuentas', label: 'Cuentas' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'flags', label: 'Features' },
  { id: 'auditoria', label: 'Auditoría' },
  { id: 'entrar', label: 'Entrar a un cliente' },
] as const;

type SeccionId = (typeof SECCIONES)[number]['id'];

interface Perfil {
  email: string;
  secciones: SeccionId[];
  esSuperAdmin: boolean;
  viendoComo: { corporativoNombre: string; antroNombre: string | null } | null;
}

interface Requisicion {
  estado: string;
}

export default function Dashboard({
  email,
  onLogout,
  onCambiarVista,
}: {
  email: string;
  onLogout: () => void;
  /** Remonta el Dashboard para que todo se vuelva a pedir con la vista nueva. */
  onCambiarVista: () => void;
}) {
  const [secciones, setSecciones] = useState<SeccionId[] | null>(null);
  const [seccion, setSeccion] = useState<SeccionId | null>(null);
  const [antros, setAntros] = useState<Antro[]>([]);
  const [antroFiltro, setAntroFiltro] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState<number | null>(null);
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false);
  const [featuresPorAntro, setFeaturesPorAntro] = useState<Record<string, string[]>>({});
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [viendoComo, setViendoComo] = useState<Perfil['viendoComo']>(null);

  useEffect(() => {
    apiRequest<Perfil>('/auth/me')
      .then((perfil) => {
        setSecciones(perfil.secciones);
        setSeccion(perfil.secciones[0] ?? null);
        setViendoComo(perfil.viendoComo);
      })
      .catch((err) => {
        // Token vencido (dura JWT_EXPIRES_IN) o inválido: de vuelta al login
        // en vez de quedarse en "Cargando…" para siempre.
        if (err instanceof ApiError && err.status === 401) onLogout();
        // El cliente al que se había entrado ya no existe (o ya no eres
        // Súper Admin): se sale de esa vista en vez de quedar atorado.
        else if (hayVerComo()) salir();
        else setErrorCarga(err instanceof Error ? err.message : 'Error desconocido');
      });
    listarAntros().then(setAntros);
    obtenerFeaturesActivas()
      .then((lista) => {
        const mapa: Record<string, string[]> = {};
        for (const item of lista) mapa[item.antroId] = item.features;
        setFeaturesPorAntro(mapa);
      })
      .catch(() => setFeaturesPorAntro({}));
  }, []);

  useEffect(() => {
    if (secciones?.includes('requisiciones')) {
      apiRequest<Requisicion[]>('/requisiciones')
        .then((lista) => setPendientes(lista.filter((r) => r.estado === 'pendiente').length))
        .catch(() => setPendientes(null));
    }
  }, [secciones]);

  function entrar(verComo: VerComo) {
    entrarComo(verComo);
    onCambiarVista();
  }

  function salir() {
    salirDeVerComo();
    onCambiarVista();
  }

  const alcance: Alcance = antros.length > 1 ? 'corporativo' : antros.length === 1 ? 'antro' : 'rp';
  const seccionesVisibles = SECCIONES.filter((s) => secciones?.includes(s.id));

  return (
    <AlcanceContext.Provider value={{ antros, alcance, antroFiltro, setAntroFiltro }}>
      <FeatureFlagsContext.Provider value={{ featuresPorAntro }}>
        <div className="app-shell">
          <header className="mobile-topbar">
            <span className="brand">Aforo</span>
            <ScopeChip />
            <button className="mobile-topbar__gear" onClick={() => setMostrarConfiguracion(true)} aria-label="Configuración">
              ⚙
            </button>
          </header>

          <aside className="sidebar">
            <div className="brand">Aforo</div>
            <ScopeChip />
            <nav>
              {seccionesVisibles.map((s) => (
                <button
                  key={s.id}
                  className={s.id === seccion && !mostrarConfiguracion ? 'active' : ''}
                  onClick={() => {
                    setSeccion(s.id);
                    setMostrarConfiguracion(false);
                  }}
                >
                  {s.label}
                  {s.id === 'requisiciones' && !!pendientes && <span className="nav-badge">{pendientes}</span>}
                </button>
              ))}
            </nav>
            <div className="user-box">
              <span>{email}</span>
              <div className="user-box-actions">
                <button className="btn-icon" onClick={() => setMostrarConfiguracion(true)} aria-label="Configuración">
                  ⚙
                </button>
                <button className="btn btn-secondary" onClick={onLogout}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </aside>

          <main className="main">
            {viendoComo && (
              <div className="ver-como-banner">
                <span>
                  Estás viendo Aforo como <strong>{viendoComo.antroNombre ?? viendoComo.corporativoNombre}</strong>
                  {viendoComo.antroNombre && <> · {viendoComo.corporativoNombre}</>}
                </span>
                <button className="btn btn-secondary" onClick={salir}>
                  Salir
                </button>
              </div>
            )}
            {secciones === null && !errorCarga && <p className="hint">Cargando…</p>}
            {errorCarga && <p className="hint">No se pudo cargar tu perfil: {errorCarga}. Recarga la página.</p>}
            {secciones?.length === 0 && !mostrarConfiguracion && <p className="hint">Tu usuario no tiene acceso a ninguna sección todavía.</p>}
            {mostrarConfiguracion ? (
              <ConfiguracionPanel email={email} onLogout={onLogout} />
            ) : (
              <>
                {seccion === 'metricas' && <MetricasPanel />}
                {seccion === 'reservas' && <ReservasPanel />}
                {seccion === 'requisiciones' && <RequisicionesPanel />}
                {seccion === 'personal' && <PersonalPanel />}
                {seccion === 'nomina' && <NominaPanel />}
                {seccion === 'proveedores' && <ProveedoresPanel />}
                {seccion === 'usuarios' && <UsuariosPanel />}
                {seccion === 'cuentas' && <CuentasPanel />}
                {seccion === 'clientes' && <ClientesPanel />}
                {seccion === 'flags' && <FeatureFlagsPanel />}
                {seccion === 'auditoria' && <AuditoriaPanel />}
                {seccion === 'entrar' && <EntrarPanel onEntrar={entrar} />}
              </>
            )}
          </main>
        </div>
      </FeatureFlagsContext.Provider>
    </AlcanceContext.Provider>
  );
}
