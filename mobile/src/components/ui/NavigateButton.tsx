import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Navigation } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export interface NavigateButtonProps {
  label: string; // e.g. "Navigate to shop" or "Navigate to job site"
  subLabel?: string; // e.g. "Midcoast Concrete Pumping · Warren, ME"
  onPress: () => void;
  style?: ViewStyle;
}

export const NavigateButton: React.FC<NavigateButtonProps> = ({
  label,
  subLabel,
  onPress,
  style,
}) => {
  const { colors, radius, spacing, heights, iconSizes } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          borderRadius: radius.md,
          borderColor: colors.link,
          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          minHeight: heights.secondaryButton,
          paddingVertical: subLabel ? spacing.sm : spacing.md,
          paddingHorizontal: spacing.base,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}${subLabel ? `, ${subLabel}` : ''}`}
    >
      <View style={styles.iconContainer}>
        <Navigation
          size={iconSizes.md}
          color={colors.link}
          strokeWidth={iconSizes.strokeWidth}
        />
      </View>
      <View style={styles.textContainer}>
        <AppText variant="button" tone="link" style={styles.labelText}>
          {label}
        </AppText>
        {subLabel ? (
          <AppText variant="small" tone="muted" style={styles.subLabelText} numberOfLines={1}>
            {subLabel}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    marginRight: 10,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    textAlign: 'center',
  },
  subLabelText: {
    textAlign: 'center',
    marginTop: 2,
  },
});
