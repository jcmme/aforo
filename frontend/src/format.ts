/** Deja solo dígitos y un punto decimal — lo que el backend espera recibir. */
export function limpiarMonto(valor: string): string {
  const limpio = valor.replace(/[^\d.]/g, '');
  const partes = limpio.split('.');
  return partes.length <= 1 ? limpio : `${partes[0]}.${partes.slice(1).join('')}`;
}

/** Agrega comas de miles mientras se escribe, sin tocar los decimales todavía sin terminar. */
export function formatearMontoInput(valor: string): string {
  if (!valor) return '';
  const [entero, decimal] = valor.split('.');
  const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal !== undefined ? `${enteroFormateado}.${decimal}` : enteroFormateado;
}

/** Formatea un monto ya guardado (string o number) como "$12,450.00" para mostrarlo. */
export function formatMonto(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (Number.isNaN(numero)) return '—';
  return numero.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
