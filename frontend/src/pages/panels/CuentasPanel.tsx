import { FormEvent, useEffect, useState } from 'react';
import { apiRequest, listarAntros, Antro, ApiError } from '../../api';
import AccessDenied from '../../components/AccessDenied';
import Pill from '../../components/Pill';

interface CuentaSecundaria {
  id: string;
  nombre: string;
  email: string;
  estado: string;
  rol: string;
  antroId: string | null;
  antro: string | null;
}

const ROLES = ['Gerente de Antro', 'RP', 'Hostess'];

export default function CuentasPanel() {
  const [cuentas, setCuentas] = useState<CuentaSecundaria[] | null>(null);
  const [antros, setAntros] = useState<Antro[]>([]);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({ nombre: '', email: '', passwordInicial: '', rol: 'Gerente de Antro', antroId: '' });

  async function cargar() {
    setDenegado(null);
    setError(null);
    try {
      const [listaCuentas, listaAntros] = await Promise.all([
        apiRequest<CuentaSecundaria[]>('/usuarios'),
        listarAntros(),
      ]);
      setCuentas(listaCuentas);
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
    setExito(null);
    try {
      await apiRequest('/usuarios', { method: 'POST', body: JSON.stringify(form) });
      setExito(`Cuenta creada: ${form.email}`);
      setForm((f) => ({ ...f, nombre: '', email: '', passwordInicial: '' }));
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  }

  async function alternarEstado(cuenta: CuentaSecundaria) {
    setError(null);
    const nuevoEstado = cuenta.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await apiRequest(`/usuarios/${cuenta.id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado: nuevoEstado }) });
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la cuenta.');
    }
  }

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Cuentas</h2>
        <p>La cuenta general de cada antro (Gerente de Antro) y las cuentas secundarias que ha creado — para darlas de alta o deshabilitarlas desde aquí.</p>
      </header>

      <div className="panel-card">
        <h3>Nueva cuenta</h3>
        <form className="form-row" onSubmit={crear}>
          <div className="field">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Correo</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label>Contraseña inicial</label>
            <input
              type="text"
              minLength={8}
              value={form.passwordInicial}
              onChange={(e) => setForm({ ...form, passwordInicial: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
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
          <button className="btn" type="submit" disabled={enviando || !form.antroId}>
            {enviando ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}
        {exito && <p className="hint">{exito}</p>}
      </div>

      {antros.map((antro) => {
        const cuentasAntro = cuentas?.filter((c) => c.antroId === antro.id) ?? [];
        const general = cuentasAntro.filter((c) => c.rol === 'Gerente de Antro');
        const secundarias = cuentasAntro.filter((c) => c.rol !== 'Gerente de Antro');

        return (
          <div className="panel-card" key={antro.id}>
            <h3>{antro.nombre}</h3>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {general.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.nombre} <span className="hint">(cuenta general)</span>
                      </td>
                      <td>{c.email}</td>
                      <td>{c.rol}</td>
                      <td>
                        <Pill valor={c.estado} />
                      </td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => alternarEstado(c)}>
                          {c.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {general.length === 0 && (
                    <tr>
                      <td colSpan={5} className="hint">
                        Sin cuenta general todavía — créala arriba con el rol "Gerente de Antro".
                      </td>
                    </tr>
                  )}
                  {secundarias.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nombre}</td>
                      <td>{c.email}</td>
                      <td>{c.rol}</td>
                      <td>
                        <Pill valor={c.estado} />
                      </td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => alternarEstado(c)}>
                          {c.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {secundarias.length === 0 && (
                    <tr>
                      <td colSpan={5} className="hint">
                        Sin RP ni Hostess todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
