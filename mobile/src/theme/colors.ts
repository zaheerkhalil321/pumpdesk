export interface ColorTheme {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  foreground: string;
  mutedForeground: string;
  navy: string;
  navyForeground: string;
  heading: string;
  primary: string;
  primaryPressed: string;
  primaryForeground: string;
  primarySoft: string;
  primarySoftBorder: string;
  primaryText: string;
  link: string;
  linkPressed: string;
  success: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  done: string;
  doneSoft: string;
  info: string;
  infoSoft: string;
  disabled: string;
  disabledForeground: string;
  overlay: string;
}

export const lightColors: ColorTheme = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  foreground: '#0F172A',
  mutedForeground: '#64748B',
  navy: '#0A2A5A',
  navyForeground: '#FFFFFF',
  heading: '#0A2A5A',
  primary: '#26A5AB',
  primaryPressed: '#1E8E93',
  primaryForeground: '#FFFFFF',
  primarySoft: '#EAF8FA',
  primarySoftBorder: '#B9E5E8',
  primaryText: '#084B4E',
  link: '#0D9488',
  linkPressed: '#0F766E',
  success: '#26A5AB',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  done: '#15803D',
  doneSoft: '#DCFCE7',
  info: '#2563EB',
  infoSoft: '#E3EDFF',
  disabled: '#CBD5E1',
  disabledForeground: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
};

export const darkColors: ColorTheme = {
  background: '#0B1220',
  surface: '#111A2B',
  surfaceMuted: '#172338',
  border: '#243049',
  foreground: '#F1F5F9',
  mutedForeground: '#94A3B8',
  navy: '#0F1B33',
  navyForeground: '#F1F5F9',
  heading: '#F1F5F9',
  primary: '#2DD4BF',
  primaryPressed: '#14B8A6',
  primaryForeground: '#042F2E',
  primarySoft: '#0F2E2D',
  primarySoftBorder: '#1F4F4B',
  primaryText: '#5EEAD4',
  link: '#2DD4BF',
  linkPressed: '#14B8A6',
  success: '#2DD4BF',
  warning: '#FBBF24',
  warningSoft: '#3A2A0A',
  danger: '#F87171',
  dangerSoft: '#3B1212',
  done: '#4ADE80',
  doneSoft: '#123022',
  info: '#7DB2FF',
  infoSoft: '#15264A',
  disabled: '#334155',
  disabledForeground: '#64748B',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export type ColorKey = keyof ColorTheme;
