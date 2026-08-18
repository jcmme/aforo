import { useAlcance } from '../scope-context';

/** Solo aparece para quien ve varios antros (corporativo) — deja enfocarse en uno solo. */
export default function FiltroAntro() {
  const { alcance, antros, antroFiltro, setAntroFiltro } = useAlcance();

  if (alcance !== 'corporativo') return null;

  return (
    <div className="field filtro-antro">
      <label>Ver antro</label>
      <select value={antroFiltro ?? ''} onChange={(e) => setAntroFiltro(e.target.value || null)}>
        <option value="">Todos los antros</option>
        {antros.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
