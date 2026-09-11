import { useEffect, useState } from 'react';
import {
  ApiError,
  AntroAdmin,
  CorporativoAdmin,
  FeatureCatalogo,
  actualizarFeatureAntro,
  actualizarFeatureCorporativo,
  listarAntrosAdmin,
  listarCatalogoFeatures,
  listarCorporativosAdmin,
  obtenerEstadoFeaturesAntro,
} from '../../api';
import AccessDenied from '../../components/AccessDenied';

type Modo = 'antro' | 'corporativo';

/** 'activo' | 'inactivo' | 'mixto' (algunos antros del corporativo prendidos y otros no). */
type EstadoCorporativo = 'activo' | 'inactivo' | 'mixto';

export default function FeatureFlagsPanel() {
  const [catalogo, setCatalogo] = useState<FeatureCatalogo[] | null>(null);
  const [corporativos, setCorporativos] = useState<CorporativoAdmin[]>([]);
  const [antros, setAntros] = useState<AntroAdmin[]>([]);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modo, setModo] = useState<Modo>('antro');
  const [antroId, setAntroId] = useState('');
  const [corporativoId, setCorporativoId] = useState('');

  const [estadoAntro, setEstadoAntro] = useState<Record<string, boolean> | null>(null);
  const [estadoCorporativo, setEstadoCorporativo] = useState<Record<string, EstadoCorporativo> | null>(null);
  const [cargandoEstado, setCargandoEstado] = useState(false);

  async function cargar() {
    setDenegado(null);
    setError(null);
    try {
      const [listaCatalogo, listaCorporativos, listaAntros] = await Promise.all([
        listarCatalogoFeatures(),
        listarCorporativosAdmin(),
        listarAntrosAdmin(),
      ]);
      setCatalogo(listaCatalogo);
      setCorporativos(listaCorporativos);
      setAntros(listaAntros);
      setAntroId((actual) => actual || listaAntros[0]?.id || '');
      setCorporativoId((actual) => actual || listaCorporativos[0]?.id || '');
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setDenegado(err.message);
      else setError(err instanceof Error ? err.message : 'Error inesperado.');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cargarEstadoAntro(id: string) {
    if (!id) return;
    setCargandoEstado(true);
    setError(null);
    try {
      setEstadoAntro(await obtenerEstadoFeaturesAntro(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el estado.');
    } finally {
      setCargandoEstado(false);
    }
  }

  async function cargarEstadoCorporativo(id: string) {
    if (!id || !catalogo) return;
    setCargandoEstado(true);
    setError(null);
    try {
      const antrosDelCorporativo = antros.filter((a) => a.corporativoId === id);
      const estados = await Promise.all(antrosDelCorporativo.map((a) => obtenerEstadoFeaturesAntro(a.id)));

      const combinado: Record<string, EstadoCorporativo> = {};
      for (const feature of catalogo) {
        if (antrosDelCorporativo.length === 0) {
          combinado[feature.codigo] = 'inactivo';
          continue;
        }
        const valores = estados.map((e) => e[feature.codigo] ?? false);
        if (valores.every((v) => v)) combinado[feature.codigo] = 'activo';
        else if (valores.every((v) => !v)) combinado[feature.codigo] = 'inactivo';
        else combinado[feature.codigo] = 'mixto';
      }
      setEstadoCorporativo(combinado);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el estado.');
    } finally {
      setCargandoEstado(false);
    }
  }

  useEffect(() => {
    if (modo === 'antro' && antroId) cargarEstadoAntro(antroId);
  }, [modo, antroId]);

  useEffect(() => {
    if (modo === 'corporativo' && corporativoId && catalogo) cargarEstadoCorporativo(corporativoId);
  }, [modo, corporativoId, catalogo, antros]);

  async function alternarAntro(featureCodigo: string, activo: boolean) {
    setError(null);
    try {
      await actualizarFeatureAntro(antroId, featureCodigo, activo);
      await cargarEstadoAntro(antroId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la feature.');
    }
  }

  async function alternarCorporativo(featureCodigo: string, activo: boolean) {
    setError(null);
    try {
      await actualizarFeatureCorporativo(corporativoId, featureCodigo, activo);
      await cargarEstadoCorporativo(corporativoId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la feature.');
    }
  }

  if (denegado) return <AccessDenied mensaje={denegado} />;

  const antrosAgrupados = [...antros].sort((a, b) => a.corporativoNombre.localeCompare(b.corporativoNombre) || a.nombre.localeCompare(b.nombre));

  return (
    <>
      <header>
        <h2>Features</h2>
        <p>Catálogo de funciones de la app — actívalas o desactívalas por antro individual o para todo un corporativo de un jalón.</p>
      </header>

      <div className="panel-card">
        <div className="toolbar">
          <h3>Ver por</h3>
          <div className="toolbar-controls">
            <select value={modo} onChange={(e) => setModo(e.target.value as Modo)}>
              <option value="antro">Antro individual</option>
              <option value="corporativo">Corporativo completo</option>
            </select>

            {modo === 'antro' ? (
              <select value={antroId} onChange={(e) => setAntroId(e.target.value)}>
                {antrosAgrupados.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.corporativoNombre} · {a.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <select value={corporativoId} onChange={(e) => setCorporativoId(e.target.value)}>
                {corporativos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreComercial}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {catalogo?.length === 0 && <p className="hint">El catálogo de features todavía está vacío.</p>}

        {catalogo && catalogo.length > 0 && (cargandoEstado ? (
          <p className="hint">Cargando estado…</p>
        ) : (
          <div>
            {catalogo.map((feature) => {
              const activo =
                modo === 'antro' ? (estadoAntro?.[feature.codigo] ?? false) : estadoCorporativo?.[feature.codigo] === 'activo';
              const mixto = modo === 'corporativo' && estadoCorporativo?.[feature.codigo] === 'mixto';

              return (
                <div className="flag-row" key={feature.id}>
                  <div className="flag-info">
                    <h4>
                      {feature.nombre} {mixto && <span className="hint">(activa solo en algunos antros)</span>}
                    </h4>
                    {feature.descripcion && <p>{feature.descripcion}</p>}
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) =>
                        modo === 'antro' ? alternarAntro(feature.codigo, e.target.checked) : alternarCorporativo(feature.codigo, e.target.checked)
                      }
                    />
                    <span className="slider" />
                  </label>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
