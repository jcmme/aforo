import { FormEvent, useEffect, useState } from 'react';
import { apiRequest, exportarReporte, listarAntros, Antro, ApiError } from '../../api';
import AccessDenied from '../../components/AccessDenied';
import Pill from '../../components/Pill';
import FiltroAntro from '../../components/FiltroAntro';
import { useAlcance } from '../../scope-context';

interface Empleado {
  id: string;
  nombre: string;
  puesto: string;
  tipoPago: string;
  estado: string;
  antro: { nombre: string };
}

const PUESTOS = ['mesero', 'barra', 'seguridad', 'gerente', 'otro'];
const TIPOS_PAGO = ['por_hora', 'quincenal'];
const ESTADOS_ASISTENCIA = ['asistio', 'falta', 'retardo', 'permiso'];

export default function PersonalPanel() {
  const { antroFiltro } = useAlcance();
  const [empleados, setEmpleados] = useState<Empleado[] | null>(null);
  const [antros, setAntros] = useState<Antro[]>([]);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensajeAsistencia, setMensajeAsistencia] = useState<string | null>(null);

  const [formEmpleado, setFormEmpleado] = useState({ antroId: '', nombre: '', puesto: 'mesero', tipoPago: 'quincenal' });
  const [formAsistencia, setFormAsistencia] = useState({ empleadoId: '', fecha: '', estado: 'asistio' });

  async function cargar() {
    setDenegado(null);
    setError(null);
    try {
      const query = antroFiltro ? `?antroId=${antroFiltro}` : '';
      const [listaEmpleados, listaAntros] = await Promise.all([
        apiRequest<Empleado[]>(`/personal/empleados${query}`),
        listarAntros(),
      ]);
      setEmpleados(listaEmpleados);
      setAntros(listaAntros);
      setFormEmpleado((f) => ({ ...f, antroId: f.antroId || listaAntros[0]?.id || '' }));
      setFormAsistencia((f) => ({ ...f, empleadoId: f.empleadoId || listaEmpleados[0]?.id || '' }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setDenegado(err.message);
      else setError(err instanceof Error ? err.message : 'Error inesperado.');
    }
  }

  useEffect(() => {
    cargar();
  }, [antroFiltro]);

  async function crearEmpleado(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await apiRequest('/personal/empleados', { method: 'POST', body: JSON.stringify(formEmpleado) });
      setFormEmpleado((f) => ({ ...f, nombre: '' }));
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el empleado.');
    } finally {
      setEnviando(false);
    }
  }

  async function registrarAsistencia(e: FormEvent) {
    e.preventDefault();
    setMensajeAsistencia(null);
    setError(null);
    try {
      await apiRequest('/personal/asistencia', { method: 'POST', body: JSON.stringify(formAsistencia) });
      setMensajeAsistencia('Asistencia registrada.');
      setFormAsistencia((f) => ({ ...f, fecha: '' }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la asistencia.');
    }
  }

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Personal y asistencia</h2>
        <p>Directorio de empleados y checador diario.</p>
      </header>

      <div className="panel-card">
        <h3>Nuevo empleado</h3>
        <form className="form-row" onSubmit={crearEmpleado}>
          <div className="field">
            <label>Antro</label>
            <select value={formEmpleado.antroId} onChange={(e) => setFormEmpleado({ ...formEmpleado, antroId: e.target.value })} required>
              {antros.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Nombre</label>
            <input value={formEmpleado.nombre} onChange={(e) => setFormEmpleado({ ...formEmpleado, nombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Puesto</label>
            <select value={formEmpleado.puesto} onChange={(e) => setFormEmpleado({ ...formEmpleado, puesto: e.target.value })}>
              {PUESTOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tipo de pago</label>
            <select value={formEmpleado.tipoPago} onChange={(e) => setFormEmpleado({ ...formEmpleado, tipoPago: e.target.value })}>
              {TIPOS_PAGO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit" disabled={enviando || !formEmpleado.antroId}>
            {enviando ? 'Guardando…' : 'Dar de alta'}
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}
      </div>

      <div className="panel-card">
        <h3>Pasar asistencia</h3>
        <form className="form-row" onSubmit={registrarAsistencia}>
          <div className="field">
            <label>Empleado</label>
            <select value={formAsistencia.empleadoId} onChange={(e) => setFormAsistencia({ ...formAsistencia, empleadoId: e.target.value })} required>
              {empleados?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={formAsistencia.fecha} onChange={(e) => setFormAsistencia({ ...formAsistencia, fecha: e.target.value })} required />
          </div>
          <div className="field">
            <label>Estado</label>
            <select value={formAsistencia.estado} onChange={(e) => setFormAsistencia({ ...formAsistencia, estado: e.target.value })}>
              {ESTADOS_ASISTENCIA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit" disabled={!formAsistencia.empleadoId}>
            Registrar
          </button>
        </form>
        {mensajeAsistencia && <p className="hint">{mensajeAsistencia}</p>}
      </div>

      <div className="panel-card">
        <div className="toolbar">
          <h3>Empleados</h3>
          <FiltroAntro />
          <button className="btn btn-secondary" onClick={() => exportarReporte('personal.export_asistencia')}>
            Exportar asistencia (PDF)
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Antro</th>
                <th>Puesto</th>
                <th>Tipo de pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {empleados?.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.nombre}</td>
                  <td>{emp.antro?.nombre}</td>
                  <td>{emp.puesto}</td>
                  <td>{emp.tipoPago}</td>
                  <td>
                    <Pill valor={emp.estado} />
                  </td>
                </tr>
              ))}
              {empleados?.length === 0 && (
                <tr>
                  <td colSpan={5} className="hint">
                    Sin empleados todavía.
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
