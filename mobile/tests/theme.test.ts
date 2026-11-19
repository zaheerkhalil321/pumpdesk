import { lightColors, darkColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius, heights } from '../src/theme/spacing';

describe('Theme and Design Tokens', () => {
  it('defines matching keys for light and dark color themes', () => {
    const lightKeys = Object.keys(lightColors).sort();
    const darkKeys = Object.keys(darkColors).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it('has valid navy, primary and background tokens', () => {
    expect(lightColors.navy).toBe('#0A2A5A');
    expect(lightColors.primary).toBe('#26A5AB');
    expect(lightColors.background).toBe('#F8FAFC');

    expect(darkColors.navy).toBe('#0F1B33');
    expect(darkColors.primary).toBe('#2DD4BF');
    expect(darkColors.background).toBe('#0B1220');
  });

  it('defines all required typography variants', () => {
    const requiredVariants = [
      'display',
      'title',
      'headline',
      'value',
      'body',
      'bodyStrong',
      'small',
      'caption',
      'overline',
      'button',
      'header',
    ];
    for (const v of requiredVariants) {
      expect(typography[v as keyof typeof typography]).toBeDefined();
      expect(typography[v as keyof typeof typography].fontSize).toBeGreaterThan(0);
    }
  });

  it('has value typography with tabular numbers fontVariant', () => {
    expect(typography.value.fontVariant).toContain('tabular-nums');
  });

  it('has standard spacing and heights for glove-friendly touch targets', () => {
    expect(heights.primaryButton).toBe(56);
    expect(heights.secondaryButton).toBe(52);
    expect(heights.input).toBe(52);
    expect(heights.listRow).toBe(56);
    expect(heights.minTouchTarget).toBeGreaterThanOrEqual(48);
    expect(spacing.screenPadding).toBe(20);
    expect(radius.md).toBe(12);
    expect(radius.lg).toBe(16);
  });
});
