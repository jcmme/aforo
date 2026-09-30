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

/** Color e icono por módulo; el resto del catálogo cae en AZUL con icono genérico. */
const AZUL = '0, 122, 255';
const ICONO_GENERICO = 'M4 8h16M4 16h16M9 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z';

const ESTILO_MODULO: Record<string, { color: string; icono: string }> = {
  'modulo.reservas': {
    color: AZUL,
    icono: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  },
  'modulo.metricas': { color: '88, 86, 214', icono: 'M3 3v18h18M7 15l4-5 3 3 5-7' },
  'modulo.requisiciones': {
    color: '255, 149, 0',
    icono: 'M9 11l3 3 5-6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
  },
  'modulo.personal': {
    color: '52, 199, 89',
    icono: 'M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87',
  },
  'modulo.nomina': { color: '48, 176, 199', icono: 'M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2.2 3 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3' },
  'modulo.proveedores': { color: '175, 82, 222', icono: 'M3 9l1-5h16l1 5M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9zM9 13h6' },
};

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

  async function alternar(featureCodigo: string, activo: boolean) {
    setError(null);
    try {
      if (modo === 'antro') {
        await actualizarFeatureAntro(antroId, featureCodigo, activo);
        await cargarEstadoAntro(antroId);
      } else {
        await actualizarFeatureCorporativo(corporativoId, featureCodigo, activo);
        await cargarEstadoCorporativo(corporativoId);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la feature.');
    }
  }

  if (denegado) return <AccessDenied mensaje={denegado} />;

  const antrosAgrupados = [...antros].sort(
    (a, b) => a.corporativoNombre.localeCompare(b.corporativoNombre) || a.nombre.localeCompare(b.nombre),
  );

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

        {catalogo &&
          catalogo.length > 0 &&
          (cargandoEstado ? (
            <p className="hint">Cargando estado…</p>
          ) : (
            <div className="tiles">
              {catalogo.map((feature) => {
                const estado = modo === 'antro' ? (estadoAntro?.[feature.codigo] ? 'activo' : 'inactivo') : estadoCorporativo?.[feature.codigo];
                const activo = estado === 'activo';
                const mixto = estado === 'mixto';
                const { color, icono } = ESTILO_MODULO[feature.codigo] ?? { color: AZUL, icono: ICONO_GENERICO };

                return (
                  <button
                    type="button"
                    key={feature.id}
                    className={`tile${activo ? ' tile-on' : ''}`}
                    style={activo ? { background: `rgba(${color}, 0.1)` } : undefined}
                    aria-pressed={activo}
                    onClick={() => alternar(feature.codigo, !activo)}
                  >
                    <div className="tile-top">
                      <span className="icon-chip" style={activo ? { background: `rgb(${color})` } : undefined}>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d={icono} />
                        </svg>
                      </span>
                      <span
                        className={`switch-visual${activo ? ' on' : ''}${mixto ? ' mixto' : ''}`}
                        style={activo ? { background: `rgb(${color})` } : mixto ? { background: 'var(--warn)' } : undefined}
                      />
                    </div>
                    <div>
                      <h4>{feature.nombre}</h4>
                      {feature.descripcion && <p>{feature.descripcion}</p>}
                      <span className="tile-estado" style={activo ? { color: `rgb(${color})` } : mixto ? { color: 'var(--warn)' } : undefined}>
                        {activo ? 'Prendido' : mixto ? 'Solo en algunos antros' : 'Apagado'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
      </div>
    </>
  );
}
