import { useEffect, useState } from 'react';
import { apiRequest, exportarReporte, ApiError } from '../../api';
import AccessDenied from '../../components/AccessDenied';

interface FilaMetrica {
  antro: string;
  totalReservas: string;
  confirmadas: string;
  noShows: string;
  gastosAprobados: string;
}

export default function MetricasPanel() {
  const [filas, setFilas] = useState<FilaMetrica[] | null>(null);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<FilaMetrica[]>('/metricas/resumen')
      .then(setFilas)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setDenegado(err.message);
        else setError(err instanceof Error ? err.message : 'Error inesperado.');
      });
  }, []);

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Métricas</h2>
        <p>Desempeño por antro: ocupación de reservas y gastos aprobados.</p>
      </header>

      <div className="panel-card">
        <div className="toolbar">
          <h3>Resumen por antro</h3>
          <button className="btn btn-secondary" onClick={() => exportarReporte('metricas.resumen_por_antro')}>
            Exportar PDF
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Antro</th>
                <th>Reservas</th>
                <th>Confirmadas</th>
                <th>No-shows</th>
                <th>Gastos aprobados</th>
              </tr>
            </thead>
            <tbody>
              {filas?.map((f) => (
                <tr key={f.antro}>
                  <td>{f.antro}</td>
                  <td>{f.totalReservas}</td>
                  <td>{f.confirmadas}</td>
                  <td>{f.noShows}</td>
                  <td>${f.gastosAprobados}</td>
                </tr>
              ))}
              {filas?.length === 0 && (
                <tr>
                  <td colSpan={5} className="hint">
                    Sin datos todavía.
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
