
import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#172B4D',
    background: '#F6F8FC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8F4F3',
    textSecondary: '#718096',

    primary: '#234E70',
    primarySoft: '#E8F0F7',
    accent: '#159A91',
    accentSoft: '#E3F5F2',

    success: '#21865B',
    successSoft: '#E5F6EC',
    warning: '#B7791F',
    warningSoft: '#FFF4D6',
    danger: '#C74747',
    dangerSoft: '#FDECEC',

    border: '#E2E8F0',
    card: '#FFFFFF',
    overlay: '#172B4D',
  },
  dark: {
    text: '#F1F5F9',
    background: '#101923',
    backgroundElement: '#1B2836',
    backgroundSelected: '#263C4C',
    textSecondary: '#A7B5C5',

    primary: '#8CC5E8',
    primarySoft: '#263C4C',
    accent: '#56C9BD',
    accentSoft: '#203E40',

    success: '#73D6A0',
    successSoft: '#203D32',
    warning: '#F2C66D',
    warningSoft: '#40351F',
    danger: '#FF9999',
    dangerSoft: '#46292D',

    border: '#344354',
    card: '#1B2836',
    overlay: '#000000',
  },
} as const;

export type ThemeColor =
  keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
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
