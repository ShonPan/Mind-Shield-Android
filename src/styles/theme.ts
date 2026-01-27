export const colors = {
  // Risk levels
  riskGreen: '#2E7D32',
  riskYellow: '#F9A825',
  riskRed: '#C62828',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',

  // Text
  textPrimary: '#212121',
  textSecondary: '#616161',
  textOnDark: '#FFFFFF',
  textMuted: '#9E9E9E',

  // UI
  primary: '#1565C0',
  primaryDark: '#0D47A1',
  accent: '#FF6F00',
  border: '#E0E0E0',
  divider: '#EEEEEE',
  disabled: '#BDBDBD',

  // Alert
  alertBackground: '#FFEBEE',
  alertBorder: '#EF9A9A',
  warningBackground: '#FFF8E1',
  warningBorder: '#FFE082',
  safeBackground: '#E8F5E9',
  safeBorder: '#A5D6A7',
};

export const fonts = {
  sizeSmall: 16,
  sizeBody: 18,
  sizeLarge: 20,
  sizeHeader: 24,
  sizeTitle: 28,
  sizeHero: 36,

  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightBold: '700' as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const touchTarget = {
  minHeight: 48,
  minWidth: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  round: 999,
};
