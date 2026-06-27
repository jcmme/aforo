// Tokens visuales de AFORO — app del cliente (CLAUDE.md §9).
// Estética de vida nocturna: modo oscuro, alto contraste, tipografía marcada.
// Paleta: cian eléctrico como color principal con acento coral.

export const colors = {
  bg: '#07090F',
  bgAlt: '#0A0E17',
  surface: '#10151F',
  surfaceAlt: '#161C29',
  border: '#222A3A',
  borderGlow: '#0E7490',
  text: '#F4F8FB',
  textMuted: '#93A1B5',
  textFaint: '#5E6B80',
  primary: '#06B6D4',
  primaryDark: '#0891B2',
  accent: '#FB7185',
  accentDark: '#E11D63',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#F43F5E',
  qrBg: '#FFFFFF',
  qrFg: '#07090F',
} as const;

// Degradados (de claro a oscuro). Se usan con expo-linear-gradient.
export const gradients = {
  // Marca / botones primarios: cian → teal profundo.
  primary: ['#22D3EE', '#06B6D4', '#0E7490'] as const,
  // Acento cálido para realces puntuales.
  accent: ['#FB7185', '#F43F5E'] as const,
  // Overlay inferior para fotos (texto legible encima).
  scrim: ['transparent', 'rgba(7,9,15,0.15)', 'rgba(7,9,15,0.95)'] as const,
  // Fondo sutil de cabeceras.
  header: ['#0E1626', '#07090F'] as const,
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
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const font = {
  title: { fontSize: 30, fontWeight: '900' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 21, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '500' as const, color: colors.text },
  muted: { fontSize: 13, fontWeight: '500' as const, color: colors.textMuted },
  kicker: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 2,
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
