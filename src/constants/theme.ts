import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1929',
    background: '#F8F6F3',
    backgroundElement: '#F1EDE8',
    backgroundSelected: '#ECE9FE',
    textSecondary: '#6E687B',

    primary: '#3B5BFF',
    primarySoft: '#EEF1FF',
    brandMid: '#7C5CFA',
    brandMidSoft: '#F2EEFF',
    accent: '#EB5B97',
    accentSoft: '#FFF0F6',
    warm: '#E07A3A',
    warmSoft: '#FFF3E8',
    teal: '#0F8B8D',
    tealSoft: '#E7F7F6',

    success: '#19875E',
    successSoft: '#E6F7EF',
    warning: '#C47716',
    warningSoft: '#FFF5E2',
    danger: '#D63D67',
    dangerSoft: '#FFEBF0',

    border: '#E8E2DC',
    card: '#FFFFFF',
    overlay: '#1C1929',
  },
  dark: {
    text: '#E8ECF8',
    background: '#121726',
    backgroundElement: '#1B2236',
    backgroundSelected: '#242E49',
    textSecondary: '#8E99B8',

    primary: '#5D82FF',
    primarySoft: '#1E2A4A',
    brandMid: '#9B7EFF',
    brandMidSoft: '#282144',
    accent: '#F46FAE',
    accentSoft: '#3B2032',
    warm: '#F29B63',
    warmSoft: '#3D2719',
    teal: '#4DC4C6',
    tealSoft: '#163537',

    success: '#73D6A0',
    successSoft: '#203D32',
    warning: '#F2C66D',
    warningSoft: '#40351F',
    danger: '#FF7EB6',
    dangerSoft: '#3B2032',

    border: '#2A334D',
    card: '#1B2236',
    overlay: '#000000',
  },
} as const;

export type ThemeColor =
  keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansSemiBold: 'Inter_600SemiBold',
    sansBold: 'Inter_700Bold',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'JetBrainsMono_500Medium',
  },
  default: {
    sans: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansSemiBold: 'Inter_600SemiBold',
    sansBold: 'Inter_700Bold',
    serif: 'serif',
    rounded: 'normal',
    mono: 'JetBrainsMono_500Medium',
  },
  web: {
    sans: "'Inter_400Regular', 'Inter', system-ui, sans-serif",
    sansMedium: "'Inter_500Medium', 'Inter', system-ui, sans-serif",
    sansSemiBold: "'Inter_600SemiBold', 'Inter', system-ui, sans-serif",
    sansBold: "'Inter_700Bold', 'Inter', system-ui, sans-serif",
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: "'JetBrainsMono_500Medium', 'JetBrains Mono', monospace",
  },
});

export const Shadows = {
  subtle: {
    shadowColor: '#2B2340',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  card: {
    shadowColor: '#2B2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#2B2340',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  primaryGlow: {
    shadowColor: '#4E54F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 6,
  },
  emeraldGlow: {
    shadowColor: '#19875E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
} as const;

export const Radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset =
  Platform.select({ ios: 50, android: 80 }) ?? 0;

export const MaxContentWidth = 800;
