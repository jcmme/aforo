// Tokens visuales de AFORO — sistema "minimalista elegante" (CLAUDE.md §9).
// Vida nocturna premium: negro profundo, monocromático, un solo acento
// champagne/oro usado con mesura. Menos ruido, más aire y jerarquía.

export const colors = {
  // Fondos en capas (elevación muy sutil).
  bg: '#0A0A0C',
  bgElevated: '#101013',
  surface: '#141417',
  surfaceAlt: '#1A1A1F',

  // Líneas: hairline casi invisible para un look limpio.
  border: '#26262D',
  hairline: 'rgba(255,255,255,0.06)',

  // Texto cálido, alto contraste.
  text: '#F7F6F3',
  textMuted: '#9C9CA6',
  textFaint: '#5E5E68',

  // Acento único: champagne/oro.
  accent: '#D8B98A',
  accentSoft: '#ECD9B6',
  accentDeep: '#B7976A',

  // Sobre el acento va texto casi negro.
  onAccent: '#0A0A0C',

  // Semáforo y estados, en tonos sobrios (no neón).
  success: '#5FB890',
  warning: '#E0AE63',
  danger: '#E0696B',

  qrBg: '#FFFFFF',
  qrFg: '#0A0A0C',

  // Alias de compatibilidad (el acento ahora es champagne/oro).
  primary: '#D8B98A',
  primaryDark: '#B7976A',
  bgAlt: '#101013',
  borderGlow: '#26262D',
} as const;

// Degradados muy sutiles; se usan con mesura (scrim de fotos, anillo del QR).
export const gradients = {
  accent: ['#ECD9B6', '#D8B98A', '#B7976A'] as const,
  // Respaldo elegante detrás de las fotos (para que nunca se vea hueco).
  foto: ['#1C1C22', '#121216', '#0A0A0C'] as const,
  // Oscurecedor inferior para texto sobre imagen.
  scrim: ['transparent', 'rgba(10,10,12,0.1)', 'rgba(10,10,12,0.92)'] as const,
  // Alias de compatibilidad.
  primary: ['#ECD9B6', '#D8B98A', '#B7976A'] as const,
  header: ['#101013', '#0A0A0C'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 36,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const font = {
  // Jerarquía clara; títulos firmes, cuerpo ligero, etiquetas con tracking.
  display: { fontSize: 40, fontWeight: '800' as const, color: colors.text, letterSpacing: 4 },
  title: { fontSize: 28, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 22 },
  muted: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 19 },
  kicker: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    color: colors.accent,
  },
} as const;

/** Semáforo de validación de puerta (tonos sobrios). */
export const semaforo = {
  verde: colors.success,
  amarillo: colors.warning,
  rojo: colors.danger,
} as const;
