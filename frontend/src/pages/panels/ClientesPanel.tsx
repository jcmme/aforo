import { FormEvent, useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../../api';
import AccessDenied from '../../components/AccessDenied';
import Pill from '../../components/Pill';

interface Cliente {
  id: string;
  nombreComercial: string;
  estado: string;
  createdAt: string;
}

interface ClienteCreado {
  corporativo: { id: string; nombreComercial: string };
  antro: { id: string; nombre: string };
  dueno: { id: string; nombre: string; email: string };
}

export default function ClientesPanel() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState<ClienteCreado | null>(null);
  const [passwordEntregada, setPasswordEntregada] = useState('');

  const [form, setForm] = useState({
    nombreComercial: '',
    antroNombre: '',
    antroCiudad: '',
    duenoNombre: '',
    duenoEmail: '',
    duenoPasswordInicial: '',
  });

  async function cargar() {
    setDenegado(null);
    setError(null);
    try {
      setClientes(await apiRequest<Cliente[]>('/onboarding/clientes'));
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
    setCreado(null);
    try {
      const resultado = await apiRequest<ClienteCreado>('/onboarding/clientes', { method: 'POST', body: JSON.stringify(form) });
      setCreado(resultado);
      setPasswordEntregada(form.duenoPasswordInicial);
      setForm({ nombreComercial: '', antroNombre: '', antroCiudad: '', duenoNombre: '', duenoEmail: '', duenoPasswordInicial: '' });
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo dar de alta el cliente.');
    } finally {
      setEnviando(false);
    }
  }

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Clientes</h2>
        <p>Da de alta un cliente nuevo cuando se firme el contrato: crea su corporativo, su primer antro y la cuenta Dueño que le entregas.</p>
      </header>

      <div className="panel-card">
        <h3>Nuevo cliente</h3>
        <form className="form-row" onSubmit={crear}>
          <div className="field">
            <label>Nombre comercial (corporativo)</label>
            <input value={form.nombreComercial} onChange={(e) => setForm({ ...form, nombreComercial: e.target.value })} required />
          </div>
          <div className="field">
            <label>Nombre del antro</label>
            <input value={form.antroNombre} onChange={(e) => setForm({ ...form, antroNombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Ciudad (opcional)</label>
            <input value={form.antroCiudad} onChange={(e) => setForm({ ...form, antroCiudad: e.target.value })} />
          </div>
          <div className="field">
            <label>Nombre del Dueño</label>
            <input value={form.duenoNombre} onChange={(e) => setForm({ ...form, duenoNombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Correo del Dueño</label>
            <input type="email" value={form.duenoEmail} onChange={(e) => setForm({ ...form, duenoEmail: e.target.value })} required />
          </div>
          <div className="field">
            <label>Contraseña inicial</label>
            <input
              type="text"
              minLength={8}
              value={form.duenoPasswordInicial}
              onChange={(e) => setForm({ ...form, duenoPasswordInicial: e.target.value })}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={enviando}>
            {enviando ? 'Creando…' : 'Dar de alta cliente'}
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}

        {creado && (
          <div className="panel-card" style={{ background: 'var(--good-soft)', border: '1px solid var(--good)' }}>
            <h3>Cliente creado — datos para entregar</h3>
            <p>
              <strong>{creado.corporativo.nombreComercial}</strong> · antro "{creado.antro.nombre}"
            </p>
            <p className="hint">Correo: {creado.dueno.email}</p>
            <p className="hint">Contraseña inicial: {passwordEntregada}</p>
            <p className="hint">Pídele que la cambie desde Configuración en cuanto entre por primera vez.</p>
          </div>
        )}
      </div>

      <div className="panel-card">
        <h3>Clientes dados de alta</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre comercial</th>
                <th>Estado</th>
                <th>Alta</th>
              </tr>
            </thead>
            <tbody>
              {clientes?.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombreComercial}</td>
                  <td>
                    <Pill valor={c.estado} />
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString('es-MX')}</td>
                </tr>
              ))}
              {clientes?.length === 0 && (
                <tr>
                  <td colSpan={3} className="hint">
                    Sin clientes todavía.
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
