import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0D1330',
    background: '#FFFFFF',
    backgroundElement: '#F6F8FC',
    backgroundSelected: '#E8EEFF',
    textSecondary: '#7B86A6',

    primary: '#2554FF',
    primarySoft: '#E8EEFF',
    accent: '#F46FAE',
    accentSoft: '#FFE3F0',

    success: '#21865B',
    successSoft: '#E5F6EC',
    warning: '#B7791F',
    warningSoft: '#FFF4D6',
    danger: '#D63A85',
    dangerSoft: '#FFE3F0',

    border: '#E3E8F5',
    card: '#FFFFFF',
    overlay: '#0D1330',
  },
  dark: {
    text: '#E8ECF8',
    background: '#121726',
    backgroundElement: '#1B2236',
    backgroundSelected: '#242E49',
    textSecondary: '#8E99B8',

    primary: '#5D82FF',
    primarySoft: '#1E2A4A',
    accent: '#F46FAE',
    accentSoft: '#3B2032',

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
    sans: 'SpaceGrotesk_400Regular',
    sansMedium: 'SpaceGrotesk_500Medium',
    sansBold: 'SpaceGrotesk_700Bold',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'JetBrainsMono_500Medium',
  },
  default: {
    sans: 'SpaceGrotesk_400Regular',
    sansMedium: 'SpaceGrotesk_500Medium',
    sansBold: 'SpaceGrotesk_700Bold',
    serif: 'serif',
    rounded: 'normal',
    mono: 'JetBrainsMono_500Medium',
  },
  web: {
    sans: "'Space Grotesk', system-ui, sans-serif",
    sansMedium: "'Space Grotesk', system-ui, sans-serif",
    sansBold: "'Space Grotesk', system-ui, sans-serif",
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: "'JetBrains Mono', monospace",
  },
});

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