// Tokens visuales de AFORO — sistema "Platino" (CLAUDE.md §9).
// Vida nocturna premium en clave monocroma: negro profundo, blanco cálido y
// aire. El "acento" es crema/platino (no dorado): se reserva para acciones y
// estados activos. Tipografía elegante: serif Cormorant para los títulos
// grandes, sans Jost para la interfaz. Divisores hairline, cero ruido.

export const colors = {
  // Fondos en capas (elevación muy sutil), negro casi puro.
  bg: '#09090B',
  bgElevated: '#0E0E11',
  surface: '#121215',
  surfaceAlt: '#17171B',

  // Líneas: hairline casi invisible para el look limpio tipo guía.
  border: '#232329',
  hairline: 'rgba(255,255,255,0.055)',

  // Texto cálido, alto contraste.
  text: '#F5F4F1',
  textMuted: '#9A9AA2',
  textFaint: '#5C5C64',

  // Acento único: crema/platino (blanco cálido). Sobre él va texto casi negro.
  accent: '#ECE6DA',
  accentSoft: '#CFC9BB',
  accentDeep: '#B8B2A4',
  onAccent: '#0B0B0D',

  qrBg: '#FFFFFF',
  qrFg: '#0A0A0C',

  // Semáforo y estados: SÍ llevan color (es funcional, no decorativo).
  success: '#5FB890',
  warning: '#E0AE63',
  danger: '#E0696B',

  // Alias de compatibilidad (el acento ahora es crema/platino).
  primary: '#ECE6DA',
  primaryDark: '#B8B2A4',
  bgAlt: '#0E0E11',
  borderGlow: '#232329',
} as const;

// Degradados muy sutiles; se usan con mesura (scrim de fotos, respaldo).
export const gradients = {
  accent: ['#F3EEE4', '#ECE6DA', '#CFC9BB'] as const,
  // Respaldo elegante detrás de las fotos (para que nunca se vea hueco).
  foto: ['#1B1B20', '#121216', '#09090B'] as const,
  // Oscurecedor inferior para texto sobre imagen.
  scrim: ['transparent', 'rgba(9,9,11,0.1)', 'rgba(9,9,11,0.94)'] as const,
  // Alias de compatibilidad.
  primary: ['#F3EEE4', '#ECE6DA', '#CFC9BB'] as const,
  header: ['#0E0E11', '#09090B'] as const,
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

// Familias tipográficas (cargadas en el arranque; ver src/lib/fuentes.ts).
// Serif de alto contraste para lo editorial; sans geométrica para la interfaz.
export const familias = {
  displaySemi: 'Cormorant_600SemiBold',
  displayBold: 'Cormorant_700Bold',
  displayMed: 'Cormorant_500Medium',
  sans: 'Jost_400Regular',
  sansMed: 'Jost_500Medium',
  sansSemi: 'Jost_600SemiBold',
} as const;

export const font = {
  // Títulos en serif Cormorant (grandes, elegantes); interfaz en Jost.
  display: { fontFamily: familias.displayBold, fontSize: 46, fontWeight: '700' as const, color: colors.text, letterSpacing: 0.5 },
  title: { fontFamily: familias.displaySemi, fontSize: 34, fontWeight: '600' as const, color: colors.text, letterSpacing: 0.2 },
  h2: { fontFamily: familias.displaySemi, fontSize: 24, fontWeight: '600' as const, color: colors.text, letterSpacing: 0.2 },
  // Encabezados funcionales pequeños: sans, más legibles que la serif fina.
  h3: { fontFamily: familias.sansSemi, fontSize: 16, fontWeight: '600' as const, color: colors.text, letterSpacing: 0.1 },
  body: { fontFamily: familias.sans, fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 23 },
  muted: { fontFamily: familias.sans, fontSize: 13, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 19 },
  kicker: {
    fontFamily: familias.sansSemi,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    color: colors.accentSoft,
  },
} as const;

/** Semáforo de validación de puerta (tonos sobrios). */
export const semaforo = {
  verde: colors.success,
  amarillo: colors.warning,
  rojo: colors.danger,
} as const;
