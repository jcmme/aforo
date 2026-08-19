import { FormEvent, useEffect, useState } from 'react';
import { apiRequest, exportarReporte, listarAntros, Antro, ApiError } from '../../api';
import AccessDenied from '../../components/AccessDenied';
import FiltroAntro from '../../components/FiltroAntro';
import MoneyInput from '../../components/MoneyInput';
import { useAlcance } from '../../scope-context';
import { formatMonto } from '../../format';

interface Periodo {
  id: string;
  periodoInicio: string;
  periodoFin: string;
  estado: string;
  antro: { nombre: string };
}

interface Empleado {
  id: string;
  nombre: string;
}

interface Detalle {
  id: string;
  horasTrabajadas: string;
  faltas: number;
  percepciones: string;
  deducciones: string;
  totalPagar: string;
  empleado: Empleado;
}

export default function NominaPanel() {
  const { antroFiltro } = useAlcance();
  const [periodos, setPeriodos] = useState<Periodo[] | null>(null);
  const [antros, setAntros] = useState<Antro[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('');
  const [detalle, setDetalle] = useState<Detalle[]>([]);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formPeriodo, setFormPeriodo] = useState({ antroId: '', periodoInicio: '', periodoFin: '' });
  const [formDetalle, setFormDetalle] = useState({ empleadoId: '', horasTrabajadas: '', faltas: '0', percepciones: '', deducciones: '0' });

  async function cargar() {
    setDenegado(null);
    setError(null);
    try {
      const query = antroFiltro ? `?antroId=${antroFiltro}` : '';
      const [listaPeriodos, listaAntros, listaEmpleados] = await Promise.all([
        apiRequest<Periodo[]>(`/personal/nomina/periodos${query}`),
        listarAntros(),
        apiRequest<Empleado[]>(`/personal/empleados${query}`),
      ]);
      setPeriodos(listaPeriodos);
      setAntros(listaAntros);
      setEmpleados(listaEmpleados);
      setFormPeriodo((f) => ({ ...f, antroId: f.antroId || listaAntros[0]?.id || '' }));
      setFormDetalle((f) => ({ ...f, empleadoId: f.empleadoId || listaEmpleados[0]?.id || '' }));
      if (!periodoSeleccionado && listaPeriodos[0]) setPeriodoSeleccionado(listaPeriodos[0].id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setDenegado(err.message);
      else setError(err instanceof Error ? err.message : 'Error inesperado.');
    }
  }

  useEffect(() => {
    cargar();
  }, [antroFiltro]);

  useEffect(() => {
    if (!periodoSeleccionado) {
      setDetalle([]);
      return;
    }
    apiRequest<Detalle[]>(`/personal/nomina/periodos/${periodoSeleccionado}/detalle`)
      .then(setDetalle)
      .catch(() => setDetalle([]));
  }, [periodoSeleccionado]);

  async function crearPeriodo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const nuevo = await apiRequest<Periodo>('/personal/nomina/periodos', { method: 'POST', body: JSON.stringify(formPeriodo) });
      await cargar();
      setPeriodoSeleccionado(nuevo.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el periodo.');
    }
  }

  async function registrarDetalle(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest(`/personal/nomina/periodos/${periodoSeleccionado}/detalle`, {
        method: 'POST',
        body: JSON.stringify({
          empleadoId: formDetalle.empleadoId,
          horasTrabajadas: Number(formDetalle.horasTrabajadas),
          faltas: Number(formDetalle.faltas),
          percepciones: Number(formDetalle.percepciones),
          deducciones: Number(formDetalle.deducciones),
        }),
      });
      const actualizado = await apiRequest<Detalle[]>(`/personal/nomina/periodos/${periodoSeleccionado}/detalle`);
      setDetalle(actualizado);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el detalle.');
    }
  }

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Nómina</h2>
        <p>Periodos de nómina y detalle de pago por trabajador.</p>
      </header>

      <div className="panel-card">
        <h3>Abrir periodo</h3>
        <form className="form-row" onSubmit={crearPeriodo}>
          <div className="field">
            <label>Antro</label>
            <select value={formPeriodo.antroId} onChange={(e) => setFormPeriodo({ ...formPeriodo, antroId: e.target.value })} required>
              {antros.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Inicio</label>
            <input type="date" value={formPeriodo.periodoInicio} onChange={(e) => setFormPeriodo({ ...formPeriodo, periodoInicio: e.target.value })} required />
          </div>
          <div className="field">
            <label>Fin</label>
            <input type="date" value={formPeriodo.periodoFin} onChange={(e) => setFormPeriodo({ ...formPeriodo, periodoFin: e.target.value })} required />
          </div>
          <button className="btn" type="submit" disabled={!formPeriodo.antroId}>
            Abrir periodo
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}
      </div>

      <div className="panel-card">
        <div className="toolbar">
          <h3>Detalle del periodo</h3>
          <FiltroAntro />
          <div className="toolbar-controls">
            <select value={periodoSeleccionado} onChange={(e) => setPeriodoSeleccionado(e.target.value)}>
              {periodos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.antro?.nombre} · {p.periodoInicio} → {p.periodoFin}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary"
              disabled={!periodoSeleccionado}
              onClick={() => exportarReporte('nomina.export_periodo', { periodoId: periodoSeleccionado })}
            >
              Exportar PDF
            </button>
          </div>
        </div>

        {periodoSeleccionado && (
          <form className="form-row" onSubmit={registrarDetalle}>
            <div className="field">
              <label>Empleado</label>
              <select value={formDetalle.empleadoId} onChange={(e) => setFormDetalle({ ...formDetalle, empleadoId: e.target.value })} required>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Horas</label>
              <input type="number" min={0} step="0.5" value={formDetalle.horasTrabajadas} onChange={(e) => setFormDetalle({ ...formDetalle, horasTrabajadas: e.target.value })} required />
            </div>
            <div className="field">
              <label>Faltas</label>
              <input type="number" min={0} value={formDetalle.faltas} onChange={(e) => setFormDetalle({ ...formDetalle, faltas: e.target.value })} />
            </div>
            <div className="field">
              <label>Percepciones</label>
              <MoneyInput value={formDetalle.percepciones} onChange={(v) => setFormDetalle({ ...formDetalle, percepciones: v })} required />
            </div>
            <div className="field">
              <label>Deducciones</label>
              <MoneyInput value={formDetalle.deducciones} onChange={(v) => setFormDetalle({ ...formDetalle, deducciones: v })} />
            </div>
            <button className="btn" type="submit">
              Guardar detalle
            </button>
          </form>
        )}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Horas</th>
                <th>Faltas</th>
                <th>Percepciones</th>
                <th>Deducciones</th>
                <th>Total a pagar</th>
              </tr>
            </thead>
            <tbody>
              {detalle.map((d) => (
                <tr key={d.id}>
                  <td>{d.empleado?.nombre}</td>
                  <td>{d.horasTrabajadas}</td>
                  <td>{d.faltas}</td>
                  <td>${formatMonto(d.percepciones)}</td>
                  <td>${formatMonto(d.deducciones)}</td>
                  <td>${formatMonto(d.totalPagar)}</td>
                </tr>
              ))}
              {periodoSeleccionado && detalle.length === 0 && (
                <tr>
                  <td colSpan={6} className="hint">
                    Sin detalle capturado todavía.
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
