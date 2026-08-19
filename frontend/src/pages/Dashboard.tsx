import { useEffect, useState } from 'react';
import { apiRequest, listarAntros, Antro } from '../api';
import { AlcanceContext, Alcance } from '../scope-context';
import ScopeChip from '../components/ScopeChip';
import ReservasPanel from './panels/ReservasPanel';
import RequisicionesPanel from './panels/RequisicionesPanel';
import PersonalPanel from './panels/PersonalPanel';
import NominaPanel from './panels/NominaPanel';
import MetricasPanel from './panels/MetricasPanel';
import ProveedoresPanel from './panels/ProveedoresPanel';
import UsuariosPanel from './panels/UsuariosPanel';
import CuentasPanel from './panels/CuentasPanel';
import AuditoriaPanel from './panels/AuditoriaPanel';
import ConfiguracionPanel from './panels/ConfiguracionPanel';

const SECCIONES = [
  { id: 'metricas', label: 'Métricas' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'requisiciones', label: 'Requisiciones' },
  { id: 'personal', label: 'Personal y asistencia' },
  { id: 'nomina', label: 'Nómina' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'cuentas', label: 'Cuentas' },
  { id: 'auditoria', label: 'Auditoría' },
] as const;

type SeccionId = (typeof SECCIONES)[number]['id'];

interface Requisicion {
  estado: string;
}

export default function Dashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [secciones, setSecciones] = useState<SeccionId[] | null>(null);
  const [seccion, setSeccion] = useState<SeccionId | null>(null);
  const [antros, setAntros] = useState<Antro[]>([]);
  const [antroFiltro, setAntroFiltro] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState<number | null>(null);
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false);

  useEffect(() => {
    apiRequest<{ email: string; secciones: SeccionId[] }>('/auth/me').then((perfil) => {
      setSecciones(perfil.secciones);
      setSeccion(perfil.secciones[0] ?? null);
    });
    listarAntros().then(setAntros);
  }, []);

  useEffect(() => {
    if (secciones?.includes('requisiciones')) {
      apiRequest<Requisicion[]>('/requisiciones')
        .then((lista) => setPendientes(lista.filter((r) => r.estado === 'pendiente').length))
        .catch(() => setPendientes(null));
    }
  }, [secciones]);

  const alcance: Alcance = antros.length > 1 ? 'corporativo' : antros.length === 1 ? 'antro' : 'rp';
  const seccionesVisibles = SECCIONES.filter((s) => secciones?.includes(s.id));

  return (
    <AlcanceContext.Provider value={{ antros, alcance, antroFiltro, setAntroFiltro }}>
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
          {secciones === null && <p className="hint">Cargando…</p>}
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
              {seccion === 'auditoria' && <AuditoriaPanel />}
            </>
          )}
        </main>
      </div>
    </AlcanceContext.Provider>
  );
}
