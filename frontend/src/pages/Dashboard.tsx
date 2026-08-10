import { useState } from 'react';
import ReservasPanel from './panels/ReservasPanel';
import RequisicionesPanel from './panels/RequisicionesPanel';
import PersonalPanel from './panels/PersonalPanel';
import NominaPanel from './panels/NominaPanel';
import MetricasPanel from './panels/MetricasPanel';
import ProveedoresPanel from './panels/ProveedoresPanel';

const SECCIONES = [
  { id: 'metricas', label: 'Métricas' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'requisiciones', label: 'Requisiciones' },
  { id: 'personal', label: 'Personal y asistencia' },
  { id: 'nomina', label: 'Nómina' },
  { id: 'proveedores', label: 'Proveedores' },
] as const;

type SeccionId = (typeof SECCIONES)[number]['id'];

export default function Dashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [seccion, setSeccion] = useState<SeccionId>('metricas');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Aforo</div>
        <nav>
          {SECCIONES.map((s) => (
            <button key={s.id} className={s.id === seccion ? 'active' : ''} onClick={() => setSeccion(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="user-box">
          <span>{email}</span>
          <button className="btn btn-secondary" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main">
        {seccion === 'metricas' && <MetricasPanel />}
        {seccion === 'reservas' && <ReservasPanel />}
        {seccion === 'requisiciones' && <RequisicionesPanel />}
        {seccion === 'personal' && <PersonalPanel />}
        {seccion === 'nomina' && <NominaPanel />}
        {seccion === 'proveedores' && <ProveedoresPanel />}
      </main>
    </div>
  );
}
