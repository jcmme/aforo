// Tokens visuales de AFORO — app del cliente (CLAUDE.md §9).
// Estética de vida nocturna: modo oscuro, alto contraste, tipografía marcada.

export const colors = {
  bg: '#08070D',
  surface: '#121119',
  surfaceAlt: '#1B1A26',
  border: '#2A2838',
  text: '#F7F6FB',
  textMuted: '#9C99B3',
  textFaint: '#6B6880',
  primary: '#8B5CF6',
  primaryDark: '#6D28D9',
  accent: '#22D3EE',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  qrBg: '#FFFFFF',
  qrFg: '#08070D',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const font = {
  // Tipografía marcada: pesos altos para títulos.
  title: { fontSize: 28, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: '800' as const, color: colors.text },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '500' as const, color: colors.text },
  muted: { fontSize: 13, fontWeight: '500' as const, color: colors.textMuted },
  kicker: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.primary,
  },
} as const;

/** Colores del semáforo de validación de puerta (se usa desde Sección 2). */
export const semaforo = {
  verde: colors.success,
  amarillo: colors.warning,
  rojo: colors.danger,
} as const;
