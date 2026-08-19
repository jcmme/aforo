import { limpiarMonto, formatearMontoInput } from '../format';

/**
 * Input de dinero: guarda/entrega el valor limpio (sin comas, listo para
 * Number(...)), pero muestra en pantalla el valor con comas de miles
 * mientras el usuario escribe.
 */
export default function MoneyInput({
  value,
  onChange,
  required,
  id,
}: {
  value: string;
  onChange: (valorLimpio: string) => void;
  required?: boolean;
  id?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      placeholder="0.00"
      value={formatearMontoInput(value)}
      onChange={(e) => onChange(limpiarMonto(e.target.value))}
      required={required}
    />
  );
}
