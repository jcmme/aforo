import { FormEvent, useEffect, useState } from 'react';
import { apiRequest, exportarReporte, listarAntros, Antro, ApiError } from '../../api';
import AccessDenied from '../../components/AccessDenied';
import Pill from '../../components/Pill';

interface Reserva {
  id: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  fechaEvento: string;
  numPersonas: number;
  estado: string;
  antro: { nombre: string };
}

export default function ReservasPanel() {
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [antros, setAntros] = useState<Antro[]>([]);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({ antroId: '', clienteNombre: '', clienteTelefono: '', fechaEvento: '', numPersonas: 2 });

  async function cargar() {
    setDenegado(null);
    setError(null);
    try {
      const [listaReservas, listaAntros] = await Promise.all([apiRequest<Reserva[]>('/reservas'), listarAntros()]);
      setReservas(listaReservas);
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
      await apiRequest('/reservas', {
        method: 'POST',
        body: JSON.stringify({ ...form, numPersonas: Number(form.numPersonas) }),
      });
      setForm((f) => ({ ...f, clienteNombre: '', clienteTelefono: '', fechaEvento: '' }));
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la reserva.');
    } finally {
      setEnviando(false);
    }
  }

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Reservas</h2>
        <p>Panel de RPs: alta de reservas y su historial.</p>
      </header>

      <div className="panel-card">
        <h3>Nueva reserva</h3>
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
            <label>Cliente</label>
            <input value={form.clienteNombre} onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input value={form.clienteTelefono} onChange={(e) => setForm({ ...form, clienteTelefono: e.target.value })} />
          </div>
          <div className="field">
            <label>Fecha del evento</label>
            <input type="date" value={form.fechaEvento} onChange={(e) => setForm({ ...form, fechaEvento: e.target.value })} required />
          </div>
          <div className="field">
            <label># Personas</label>
            <input
              type="number"
              min={1}
              value={form.numPersonas}
              onChange={(e) => setForm({ ...form, numPersonas: Number(e.target.value) })}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={enviando || !form.antroId}>
            {enviando ? 'Guardando…' : 'Crear reserva'}
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}
      </div>

      <div className="panel-card">
        <div className="toolbar">
          <h3>Historial</h3>
          <button className="btn btn-secondary" onClick={() => exportarReporte('reservas.export_rp')}>
            Exportar PDF (por RP)
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Antro</th>
                <th>Fecha</th>
                <th># Personas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {reservas?.map((r) => (
                <tr key={r.id}>
                  <td>{r.clienteNombre}</td>
                  <td>{r.antro?.nombre}</td>
                  <td>{r.fechaEvento}</td>
                  <td>{r.numPersonas}</td>
                  <td>
                    <Pill valor={r.estado} />
                  </td>
                </tr>
              ))}
              {reservas?.length === 0 && (
                <tr>
                  <td colSpan={5} className="hint">
                    Sin reservas todavía.
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
