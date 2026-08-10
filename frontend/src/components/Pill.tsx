export default function Pill({ valor }: { valor: string }) {
  return <span className={`pill pill-${valor}`}>{valor.replace('_', ' ')}</span>;
}
