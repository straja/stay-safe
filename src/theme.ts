/**
 * Design tokens for World Alert.
 * Dark, calm, information-focused palette.
 */

export const COLORS = {
  background: '#0d1117',
  surface: '#161b22',
  surfaceElevated: '#21262d',
  border: '#30363d',

  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  textMuted: '#484f58',

  accent: '#58a6ff',
  accentSubtle: 'rgba(88, 166, 255, 0.1)',

  severityHigh: '#f85149',
  severityMedium: '#d29922',
  severityLow: '#3fb950',

  mapOverlay: 'rgba(13, 17, 23, 0.85)',

  line: '#58a6ff',
  lineSecondary: '#d29922',
  lineTertiary: '#3fb950',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FONT = {
  sizeSm: 12,
  sizeMd: 15,
  sizeLg: 18,
  sizeXl: 24,
  size2xl: 32,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;
