import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { MessageSquare, Phone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { openTextDispatch, openCallDispatch } from '@/features/contact-dispatch';
import { AppText } from './AppText';

export interface ContactDispatchButtonsProps {
  dispatchPhone: string;
  style?: ViewStyle;
}

export const ContactDispatchButtons: React.FC<ContactDispatchButtonsProps> = ({
  dispatchPhone,
  style,
}) => {
  const { colors, radius, iconSizes } = useTheme();

  const handleText = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    openTextDispatch(dispatchPhone);
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    openCallDispatch(dispatchPhone);
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={handleText}
        style={({ pressed }) => [
          styles.button,
          {
            borderRadius: radius.md,
            borderColor: colors.primarySoftBorder,
            backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Text Dispatch"
      >
        <MessageSquare
          size={18}
          color={colors.primary}
          strokeWidth={iconSizes.strokeWidth}
          style={styles.icon}
        />
        <AppText style={[styles.label, { color: colors.heading }]}>
          Text Dispatch
        </AppText>
      </Pressable>

      <Pressable
        onPress={handleCall}
        style={({ pressed }) => [
          styles.button,
          {
            borderRadius: radius.md,
            borderColor: colors.primarySoftBorder,
            backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Call Dispatch"
      >
        <Phone
          size={18}
          color={colors.primary}
          strokeWidth={iconSizes.strokeWidth}
          style={styles.icon}
        />
        <AppText style={[styles.label, { color: colors.heading }]}>
          Call Dispatch
        </AppText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
  },
});
