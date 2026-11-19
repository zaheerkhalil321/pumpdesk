import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { AppText } from './AppText';

export interface NavyHeaderProps {
  backLabel?: string;
  onBack?: () => void;
  /** Small centred title in the top bar (used by the work ticket). */
  title?: string;
  rightAction?: React.ReactNode;
  /** Large title shown inside the header ("hero" style). */
  heading?: string;
  subheading?: string;
  /** Badge or chip shown under the heading. */
  badge?: React.ReactNode;
}

const BACK_SIZE = 40;

export const NavyHeader: React.FC<NavyHeaderProps> = ({
  backLabel = 'Jobs',
  onBack,
  title,
  rightAction,
  heading,
  subheading,
  badge,
}) => {
  const { colors, iconSizes, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.navy,
    paddingTop: insets.top + spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
    shadowColor: colors.navy,
  };

  return (
    <View style={[styles.header, containerStyle]}>
      <View style={styles.topRow}>
        <View style={styles.leftSlot}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Back to ${backLabel}`}
            >
              <View style={styles.backCircle}>
                <View
                  style={[
                    styles.backFill,
                    { backgroundColor: colors.navyForeground, borderRadius: radius.full },
                  ]}
                />
                <ChevronLeft
                  size={iconSizes.md}
                  color={colors.navyForeground}
                  strokeWidth={iconSizes.strokeWidth}
                />
              </View>
              <AppText variant="header" tone="navyForeground" style={styles.backText}>
                {backLabel}
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {title ? (
          <View style={styles.titleSlot} pointerEvents="none">
            <AppText variant="header" tone="navyForeground" numberOfLines={1}>
              {title}
            </AppText>
          </View>
        ) : null}

        <View style={styles.rightSlot}>{rightAction || null}</View>
      </View>

      {heading ? (
        <View style={styles.hero}>
          <AppText
            tone="navyForeground"
            style={styles.heading}
            numberOfLines={2}
            accessibilityRole="header"
          >
            {heading}
          </AppText>
          {subheading ? (
            <AppText tone="navyForeground" style={styles.subheading} numberOfLines={2}>
              {subheading}
            </AppText>
          ) : null}
          {badge ? <View style={styles.badgeRow}>{badge}</View> : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    zIndex: 10,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  topRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  backCircle: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backFill: {
    ...StyleSheet.absoluteFill,
    opacity: 0.14,
  },
  backText: {
    marginLeft: 8,
  },
  titleSlot: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  hero: {
    marginTop: 12,
  },
  heading: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subheading: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
    opacity: 0.8,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
});
