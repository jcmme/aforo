import { useEffect, useState } from 'react';
import { ApiError, AntroAdmin, CorporativoAdmin, VerComo, listarAntrosAdmin, listarCorporativosAdmin } from '../../api';
import AccessDenied from '../../components/AccessDenied';

/**
 * Solo Súper Admin: elegir un corporativo o un antro y ver Aforo exactamente
 * como lo ve ese cliente, con todos los permisos, hasta darle "Salir".
 */
export default function EntrarPanel({ onEntrar }: { onEntrar: (verComo: VerComo) => void }) {
  const [corporativos, setCorporativos] = useState<CorporativoAdmin[] | null>(null);
  const [antros, setAntros] = useState<AntroAdmin[]>([]);
  const [denegado, setDenegado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarCorporativosAdmin(), listarAntrosAdmin()])
      .then(([listaCorporativos, listaAntros]) => {
        setCorporativos(listaCorporativos);
        setAntros(listaAntros);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setDenegado(err.message);
        else setError(err instanceof Error ? err.message : 'Error inesperado.');
      });
  }, []);

  if (denegado) return <AccessDenied mensaje={denegado} />;

  return (
    <>
      <header>
        <h2>Entrar a un cliente</h2>
        <p>Ve Aforo tal cual lo ve un cliente, con todos los permisos. Solo verás los módulos que tenga prendidos en Features.</p>
      </header>

      {error && <div className="error-msg">{error}</div>}
      {corporativos === null && !error && <p className="hint">Cargando…</p>}
      {corporativos?.length === 0 && <p className="hint">Todavía no hay clientes.</p>}

      {corporativos?.map((corporativo) => {
        const antrosDelCorporativo = antros.filter((a) => a.corporativoId === corporativo.id);
        return (
          <div className="panel-card" key={corporativo.id}>
            <div className="toolbar">
              <h3>{corporativo.nombreComercial}</h3>
              <button className="btn" onClick={() => onEntrar({ tipo: 'corporativo', id: corporativo.id })}>
                Entrar al corporativo
              </button>
            </div>
            {antrosDelCorporativo.length === 0 && <p className="hint">Sin antros todavía.</p>}
            {antrosDelCorporativo.map((antro) => (
              <div className="flag-row" key={antro.id}>
                <div className="flag-info">
                  <h4>{antro.nombre}</h4>
                </div>
                <button className="btn btn-secondary" onClick={() => onEntrar({ tipo: 'antro', id: antro.id })}>
                  Entrar a este antro
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
