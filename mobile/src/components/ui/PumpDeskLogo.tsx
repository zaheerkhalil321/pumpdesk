import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { AppText } from './AppText';
import { useTheme } from '@/theme';

export interface PumpDeskBrandLogoProps {
  size?: number; // Tile size in points, default 56
  showWordmark?: boolean;
  showBadge?: boolean;
  compact?: boolean; // small left-aligned row: tile and name side by side
  style?: ViewStyle;
}

export const PumpDeskBrandLogo: React.FC<PumpDeskBrandLogoProps> = ({
  size = 58,
  showWordmark = true,
  showBadge = true,
  compact = false,
  style,
}) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      {/* Precision Vector Monogram Mark */}
      <View>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Deep Navy Squircle Base */}
          <Rect
            x="1"
            y="1"
            width="62"
            height="62"
            rx="16"
            fill={colors.navy}
            stroke={isDark ? colors.border : colors.navy}
            strokeWidth="1.5"
          />

          {/* Precision Rounded Geometric 'P' matching 2nd reference image */}
          <Path
            d="M18.5 12.5 H33 C41 12.5 46.5 18 46.5 24.5 C46.5 31 41 36.5 33 36.5 H25 V46 C25 51 14.5 51 14.5 46 V16.5 C14.5 14.3 16.3 12.5 18.5 12.5 Z M25 19.5 H32.5 C35.5 19.5 37.8 21.8 37.8 24.5 C37.8 27.2 35.5 29.5 32.5 29.5 H25 Z"
            fill={colors.navyForeground}
            fillRule="evenodd"
          />

          {/* Cyan Teal Dot nestled close under the bowl with balanced distance */}
          <Circle cx="43" cy="46" r="5.5" fill="#13ADAF" />
        </Svg>
      </View>

      {/* Wordmark */}
      {showWordmark ? (
        <AppText
          variant={compact ? 'headline' : 'brand'}
          tone="heading"
          style={[styles.wordmark, compact && styles.wordmarkCompact]}
        >
          PumpDesk
        </AppText>
      ) : null}

      {/* Sub-badge: FOR OPERATORS */}
      {showBadge && !compact ? (
        <AppText variant="overline" tone="muted" style={styles.badge}>
          FOR OPERATORS
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerCompact: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  wordmarkCompact: {
    marginTop: 0,
    marginLeft: 8,
  },
  wordmark: {
    marginTop: 12,
    textAlign: 'center',
  },
  badge: {
    letterSpacing: 2.2,
    marginTop: 4,
    textAlign: 'center',
  },
});
