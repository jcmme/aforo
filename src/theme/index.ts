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

// Tipografía: UNA sola familia en toda la app (Jost, geométrica y elegante).
// La jerarquía se logra con el PESO, no con familias distintas: títulos en
// ligero (delgado y aireado), interfaz en regular, énfasis en medio. Nada de
// serif ni mezclas — look uniforme. `fontWeight` acompaña a cada familia para
// que web no sintetice pesos falsos (evita que se vea dispareja).
export const familias = {
  light: 'Jost_300Light',
  regular: 'Jost_400Regular',
  medium: 'Jost_500Medium',
  semi: 'Jost_600SemiBold',
  // Alias de compatibilidad (todo apunta a Jost).
  sans: 'Jost_400Regular',
  sansMed: 'Jost_500Medium',
  sansSemi: 'Jost_600SemiBold',
  displayLight: 'Jost_300Light',
  displaySemi: 'Jost_400Regular',
  displayBold: 'Jost_500Medium',
  displayMed: 'Jost_400Regular',
} as const;

export const font = {
  // Títulos delgados y elegantes (Jost Light); cuerpo regular; énfasis medio.
  display: { fontFamily: familias.light, fontSize: 44, fontWeight: '300' as const, color: colors.text, letterSpacing: 0.5 },
  title: { fontFamily: familias.light, fontSize: 32, fontWeight: '300' as const, color: colors.text, letterSpacing: 0.3 },
  h2: { fontFamily: familias.regular, fontSize: 23, fontWeight: '400' as const, color: colors.text, letterSpacing: 0.1 },
  h3: { fontFamily: familias.medium, fontSize: 16, fontWeight: '500' as const, color: colors.text, letterSpacing: 0.1 },
  body: { fontFamily: familias.regular, fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 23 },
  muted: { fontFamily: familias.regular, fontSize: 13, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 19 },
  kicker: {
    fontFamily: familias.medium,
    fontSize: 11,
    fontWeight: '500' as const,
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
