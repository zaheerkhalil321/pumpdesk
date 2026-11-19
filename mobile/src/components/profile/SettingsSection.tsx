import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface SettingsSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

/** A titled group of settings rows on one rounded card. */
export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, footer, children }) => {
  const { colors, radius } = useTheme();

  return (
    <View style={styles.section}>
      {title ? (
        <AppText style={[styles.title, { color: colors.mutedForeground }]} accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl },
        ]}
      >
        {children}
      </View>
      {footer ? (
        <AppText style={[styles.footer, { color: colors.mutedForeground }]}>{footer}</AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 13.5,
    letterSpacing: 0.1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  footer: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginHorizontal: 4,
  },
});
