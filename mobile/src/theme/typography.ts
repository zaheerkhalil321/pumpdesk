import { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  extrabold: 'Figtree_800ExtraBold',
} as const;

export type TypographyVariant =
  | 'brand'
  | 'display'
  | 'title'
  | 'headline'
  | 'value'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'caption'
  | 'overline'
  | 'button'
  | 'header';

export const typography: Record<TypographyVariant, TextStyle> = {
  brand: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  value: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  small: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  overline: {
    fontFamily: fontFamilies.bold,
    fontSize: 12.5,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  header: {
    fontFamily: fontFamilies.semibold,
    fontSize: 17,
    lineHeight: 22,
  },
};
