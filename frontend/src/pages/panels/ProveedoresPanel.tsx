import { FormEvent, useEffect, useState } from 'react';
import { apiRequest, exportarReporte, listarAntros, Antro, ApiError } from '../../api';
import AccessDenied from '../../components/AccessDenied';
import FiltroAntro from '../../components/FiltroAntro';
import { useAlcance } from '../../scope-context';

interface Proveedor {
  id: string;
  nombre: string;
  categoria: string;
  contactoNombre: string | null;
  telefono: string | null;
  estado: string;
}

interface Compra {
  id: string;
  descripcion: string;
  monto: string;
  fecha: string;
  antro: { nombre: string };
  proveedor: { nombre: string };
}

const CATEGORIAS = ['licor', 'insumos', 'sonido', 'seguridad', 'limpieza', 'otro'];

export default function ProveedoresPanel() {
  const { antroFiltro } = useAlcance();
  const [proveedores, setProveedores] = useState<Proveedor[] | null>(null);
  const [compras, setCompras] = useState<Compra[] | null>(null);
  const [antros, setAntros] = useState<Antro[]>([]);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formProveedor, setFormProveedor] = useState({ nombre: '', categoria: 'licor', contactoNombre: '', telefono: '' });
  const [formCompra, setFormCompra] = useState({ antroId: '', proveedorId: '', descripcion: '', monto: '', fecha: '' });

  async function cargar() {
    setDenegado(null);
    setError(null);
    try {
      const [listaProveedores, listaAntros] = await Promise.all([apiRequest<Proveedor[]>('/proveedores'), listarAntros()]);
      setProveedores(listaProveedores);
      setAntros(listaAntros);
      setFormCompra((f) => ({
        ...f,
        antroId: f.antroId || listaAntros[0]?.id || '',
        proveedorId: f.proveedorId || listaProveedores[0]?.id || '',
      }));
      try {
        const query = antroFiltro ? `?antroId=${antroFiltro}` : '';
        setCompras(await apiRequest<Compra[]>(`/compras${query}`));
      } catch {
        setCompras([]);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setDenegado(err.message);
      else setError(err instanceof Error ? err.message : 'Error inesperado.');
    }
  }

  useEffect(() => {
    cargar();
  }, [antroFiltro]);

  async function crearProveedor(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/proveedores', { method: 'POST', body: JSON.stringify(formProveedor) });
      setFormProveedor((f) => ({ ...f, nombre: '', contactoNombre: '', telefono: '' }));
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el proveedor.');
    }
  }

  async function registrarCompra(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/compras', { method: 'POST', body: JSON.stringify({ ...formCompra, monto: Number(formCompra.monto) }) });
      setFormCompra((f) => ({ ...f, descripcion: '', monto: '', fecha: '' }));
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la compra.');
    }
  }

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Proveedores</h2>
        <p>Catálogo corporativo y compras por antro — la base del historial de precios.</p>
      </header>

      <div className="panel-card">
        <h3>Nuevo proveedor</h3>
        <form className="form-row" onSubmit={crearProveedor}>
          <div className="field">
            <label>Nombre</label>
            <input value={formProveedor.nombre} onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Categoría</label>
            <select value={formProveedor.categoria} onChange={(e) => setFormProveedor({ ...formProveedor, categoria: e.target.value })}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Contacto</label>
            <input value={formProveedor.contactoNombre} onChange={(e) => setFormProveedor({ ...formProveedor, contactoNombre: e.target.value })} />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input value={formProveedor.telefono} onChange={(e) => setFormProveedor({ ...formProveedor, telefono: e.target.value })} />
          </div>
          <button className="btn" type="submit">
            Dar de alta
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Contacto</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {proveedores?.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td>{p.contactoNombre ?? '—'}</td>
                  <td>{p.telefono ?? '—'}</td>
                </tr>
              ))}
              {proveedores?.length === 0 && (
                <tr>
                  <td colSpan={4} className="hint">
                    Sin proveedores todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {compras !== null && (
        <div className="panel-card">
          <h3>Registrar compra</h3>
          <form className="form-row" onSubmit={registrarCompra}>
            <div className="field">
              <label>Antro</label>
              <select value={formCompra.antroId} onChange={(e) => setFormCompra({ ...formCompra, antroId: e.target.value })} required>
                {antros.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Proveedor</label>
              <select value={formCompra.proveedorId} onChange={(e) => setFormCompra({ ...formCompra, proveedorId: e.target.value })} required>
                {proveedores?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Descripción</label>
              <input value={formCompra.descripcion} onChange={(e) => setFormCompra({ ...formCompra, descripcion: e.target.value })} required />
            </div>
            <div className="field">
              <label>Monto</label>
              <input type="number" min={0} step="0.01" value={formCompra.monto} onChange={(e) => setFormCompra({ ...formCompra, monto: e.target.value })} required />
            </div>
            <div className="field">
              <label>Fecha</label>
              <input type="date" value={formCompra.fecha} onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })} required />
            </div>
            <button className="btn" type="submit" disabled={!formCompra.antroId || !formCompra.proveedorId}>
              Registrar compra
            </button>
          </form>

          <div className="toolbar">
            <h3>Historial de compras</h3>
            <FiltroAntro />
            <button className="btn btn-secondary" onClick={() => exportarReporte('proveedores.historial_precios')}>
              Exportar PDF
            </button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Antro</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id}>
                    <td>{c.proveedor?.nombre}</td>
                    <td>{c.antro?.nombre}</td>
                    <td>{c.descripcion}</td>
                    <td>${c.monto}</td>
                    <td>{c.fecha}</td>
                  </tr>
                ))}
                {compras.length === 0 && (
                  <tr>
                    <td colSpan={5} className="hint">
                      Sin compras registradas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
