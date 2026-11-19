import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export interface OfflineBarProps {
  isOnline: boolean;
}

export const OfflineBar: React.FC<OfflineBarProps> = ({ isOnline }) => {
  const { colors, iconSizes } = useTheme();

  if (isOnline) return null;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.warningSoft,
          borderBottomColor: colors.warning,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="You're offline. Changes will send when you're back online."
    >
      <WifiOff
        size={iconSizes.sm}
        color={colors.warning}
        strokeWidth={iconSizes.strokeWidth}
        style={styles.icon}
      />
      <AppText variant="caption" style={[styles.text, { color: colors.warning }]}>
        You&apos;re offline. Changes will send when you&apos;re back online.
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
});
