import { useAlcance } from '../scope-context';

export default function ScopeChip() {
  const { alcance, antros } = useAlcance();

  if (alcance === 'rp') return null;

  const texto = alcance === 'corporativo' ? `CORPORATIVO · ${antros.length} antros` : `ANTRO · ${antros[0]?.nombre ?? ''}`;

  return <span className={`scope-chip scope-chip-${alcance}`}>{texto}</span>;
}
