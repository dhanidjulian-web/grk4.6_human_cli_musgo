import { Platform } from 'react-native';

export type Palette = {
  name: 'light' | 'dark';
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceHigh: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  info: string;
  ok: string;
  warn: string;
  danger: string;
  shadow: string;
  termBg: string;
  termText: string;
};

export const dark: Palette = {
  name: 'dark',
  bg: '#0A0E14',
  surface: '#111823',
  surfaceAlt: '#161F2C',
  surfaceHigh: '#1D2836',
  border: '#23303F',
  text: '#E9EFF8',
  textDim: '#94A5BB',
  textFaint: '#5E6E84',
  accent: '#31D0AA',
  accentSoft: 'rgba(49,208,170,0.14)',
  onAccent: '#04231B',
  info: '#6FA8FF',
  ok: '#4ADE80',
  warn: '#FBBF24',
  danger: '#F87171',
  shadow: '#000000',
  termBg: '#060A0F',
  termText: '#C3D3E4',
};

export const light: Palette = {
  name: 'light',
  bg: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F8',
  surfaceHigh: '#E4EAF3',
  border: '#DCE3ED',
  text: '#0E1721',
  textDim: '#5A6B80',
  textFaint: '#8B9AB0',
  accent: '#0E9F7E',
  accentSoft: 'rgba(14,159,126,0.12)',
  onAccent: '#FFFFFF',
  info: '#3B6FE0',
  ok: '#16A34A',
  warn: '#B45309',
  danger: '#DC2626',
  shadow: '#0B1B2B',
  termBg: '#0B1017',
  termText: '#C3D3E4',
};

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };

export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}) as string;

export function shadowFor(t: Palette, level = 1) {
  return Platform.OS === 'web'
    ? { boxShadow: `0 ${2 * level}px ${8 * level}px ${t.shadow}22` }
    : {
        shadowColor: t.shadow,
        shadowOpacity: t.name === 'dark' ? 0.45 : 0.12,
        shadowRadius: 6 * level,
        shadowOffset: { width: 0, height: 2 * level },
        elevation: 2 * level,
      };
}
