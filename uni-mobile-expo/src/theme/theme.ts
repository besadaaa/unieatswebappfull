import { MD3DarkTheme } from 'react-native-paper';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#fb923c', // Orange primary color
    primaryContainer: '#ea580c',
    secondary: '#10b981', // Emerald secondary
    secondaryContainer: '#059669',
    tertiary: '#8b5cf6', // Purple tertiary
    surface: '#1e293b', // Dark surface
    surfaceVariant: '#334155',
    background: '#0f1424', // Main dark background
    onBackground: '#ffffff',
    onSurface: '#ffffff',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    outline: '#475569',
    outlineVariant: '#64748b',
    error: '#ef4444',
    errorContainer: '#dc2626',
    onError: '#ffffff',
    onErrorContainer: '#ffffff',
    inverseSurface: '#f1f5f9',
    inverseOnSurface: '#0f172a',
    inversePrimary: '#ea580c',
    shadow: '#000000',
    scrim: '#000000',
    surfaceDisabled: '#1e293b80',
    onSurfaceDisabled: '#ffffff60',
    backdrop: '#00000080',
  },
};

export const colors = {
  // Main brand colors
  primary: '#fb923c',
  primaryDark: '#ea580c',
  secondary: '#10b981',
  secondaryDark: '#059669',
  tertiary: '#8b5cf6',
  tertiaryDark: '#7c3aed',
  
  // Background colors
  background: '#0f1424',
  surface: '#1e293b',
  surfaceVariant: '#334155',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  
  // Status colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border colors
  border: '#475569',
  borderLight: '#64748b',
  
  // Gradient colors
  gradientStart: '#fb923c',
  gradientEnd: '#ea580c',
  
  // Card colors
  card: '#1e293b',
  cardHover: '#334155',
  
  // Button colors
  buttonPrimary: '#fb923c',
  buttonSecondary: '#10b981',
  buttonTertiary: '#8b5cf6',
  
  // Input colors
  input: '#334155',
  inputBorder: '#475569',
  inputFocus: '#fb923c',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.25)',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};
