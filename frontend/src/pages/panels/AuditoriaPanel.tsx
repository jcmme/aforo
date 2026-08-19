import { useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../../api';
import AccessDenied from '../../components/AccessDenied';

interface RegistroAuditoria {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalle: Record<string, unknown> | null;
  actor: string;
  actorEmail: string;
  createdAt: string;
}

export default function AuditoriaPanel() {
  const [registros, setRegistros] = useState<RegistroAuditoria[] | null>(null);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<RegistroAuditoria[]>('/auditoria')
      .then(setRegistros)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setDenegado(err.message);
        else setError(err instanceof Error ? err.message : 'Error inesperado.');
      });
  }, []);

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Auditoría</h2>
        <p>Rastro completo de decisiones tomadas en la plataforma — visible únicamente para Super Admin.</p>
      </header>

      <div className="panel-card">
        {error && <div className="error-msg">{error}</div>}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Quién</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registros?.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.createdAt).toLocaleString('es-MX')}</td>
                  <td>
                    {r.actor}
                    <br />
                    <span className="hint">{r.actorEmail}</span>
                  </td>
                  <td>{r.accion}</td>
                  <td>{r.entidad}</td>
                  <td>{r.detalle ? JSON.stringify(r.detalle) : '—'}</td>
                </tr>
              ))}
              {registros?.length === 0 && (
                <tr>
                  <td colSpan={5} className="hint">
                    Sin registros todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
