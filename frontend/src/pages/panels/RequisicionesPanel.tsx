import { FormEvent, useEffect, useState } from 'react';
import { apiRequest, exportarReporte, listarAntros, Antro, ApiError } from '../../api';
import AccessDenied from '../../components/AccessDenied';
import Pill from '../../components/Pill';

interface Requisicion {
  id: string;
  destino: string;
  montoSolicitado: string;
  montoResuelto: string | null;
  fechaGastoProgramada: string;
  estado: string;
  antro: { nombre: string };
}

export default function RequisicionesPanel() {
  const [requisiciones, setRequisiciones] = useState<Requisicion[] | null>(null);
  const [antros, setAntros] = useState<Antro[]>([]);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({ antroId: '', montoSolicitado: '', destino: '', fechaGastoProgramada: '' });

  async function cargar() {
    setDenegado(null);
    setError(null);
    try {
      const [lista, listaAntros] = await Promise.all([apiRequest<Requisicion[]>('/requisiciones'), listarAntros()]);
      setRequisiciones(lista);
      setAntros(listaAntros);
      setForm((f) => ({ ...f, antroId: f.antroId || listaAntros[0]?.id || '' }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setDenegado(err.message);
      else setError(err instanceof Error ? err.message : 'Error inesperado.');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await apiRequest('/requisiciones', {
        method: 'POST',
        body: JSON.stringify({ ...form, montoSolicitado: Number(form.montoSolicitado) }),
      });
      setForm((f) => ({ ...f, montoSolicitado: '', destino: '', fechaGastoProgramada: '' }));
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la requisición.');
    } finally {
      setEnviando(false);
    }
  }

  async function resolver(id: string, estado: 'aprobada' | 'rechazada' | 'ajustada', montoSolicitado: string) {
    setError(null);
    let montoResuelto: number | undefined;
    if (estado === 'ajustada') {
      const valor = window.prompt('Nuevo monto aprobado:', montoSolicitado);
      if (!valor) return;
      montoResuelto = Number(valor);
    }
    try {
      await apiRequest(`/requisiciones/${id}/resolver`, { method: 'POST', body: JSON.stringify({ estado, montoResuelto }) });
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo resolver la requisición.');
    }
  }

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Requisiciones</h2>
        <p>Registro ligero del resultado de la junta entre Gerente de Antro y Gerente General.</p>
      </header>

      <div className="panel-card">
        <h3>Nueva requisición</h3>
        <form className="form-row" onSubmit={crear}>
          <div className="field">
            <label>Antro</label>
            <select value={form.antroId} onChange={(e) => setForm({ ...form, antroId: e.target.value })} required>
              {antros.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Destino del gasto</label>
            <input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} required />
          </div>
          <div className="field">
            <label>Monto solicitado</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.montoSolicitado}
              onChange={(e) => setForm({ ...form, montoSolicitado: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Fecha programada</label>
            <input
              type="date"
              value={form.fechaGastoProgramada}
              onChange={(e) => setForm({ ...form, fechaGastoProgramada: e.target.value })}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={enviando || !form.antroId}>
            {enviando ? 'Guardando…' : 'Levantar requisición'}
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}
      </div>

      <div className="panel-card">
        <div className="toolbar">
          <h3>Requisiciones</h3>
          <button className="btn btn-secondary" onClick={() => exportarReporte('requisiciones.export')}>
            Exportar PDF
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Antro</th>
                <th>Destino</th>
                <th>Solicitado</th>
                <th>Resuelto</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Junta</th>
              </tr>
            </thead>
            <tbody>
              {requisiciones?.map((r) => (
                <tr key={r.id}>
                  <td>{r.antro?.nombre}</td>
                  <td>{r.destino}</td>
                  <td>${r.montoSolicitado}</td>
                  <td>{r.montoResuelto ? `$${r.montoResuelto}` : '—'}</td>
                  <td>{r.fechaGastoProgramada}</td>
                  <td>
                    <Pill valor={r.estado} />
                  </td>
                  <td>
                    {r.estado === 'pendiente' ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-secondary" onClick={() => resolver(r.id, 'aprobada', r.montoSolicitado)}>
                          Aprobar
                        </button>
                        <button className="btn btn-secondary" onClick={() => resolver(r.id, 'ajustada', r.montoSolicitado)}>
                          Ajustar
                        </button>
                        <button className="btn btn-secondary" onClick={() => resolver(r.id, 'rechazada', r.montoSolicitado)}>
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="hint">resuelta</span>
                    )}
                  </td>
                </tr>
              ))}
              {requisiciones?.length === 0 && (
                <tr>
                  <td colSpan={7} className="hint">
                    Sin requisiciones todavía.
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
