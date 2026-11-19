import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SunMoon } from 'lucide-react-native';
import { AppText, SegmentedControl } from '@/components/ui';
import { useTheme, ColorSchemeMode } from '@/theme';
import { fontFamilies } from '@/theme/typography';

const MODES: ColorSchemeMode[] = ['system', 'light', 'dark'];
const LABELS = ['System', 'Light', 'Dark'];

/** Appearance picker shown right in the list (no extra screen). */
export const AppearanceRow: React.FC<{ showDivider?: boolean }> = ({ showDivider = true }) => {
  const { colors, radius, mode, setMode } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        showDivider ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : null,
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.tile, { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm + 2 }]}>
          <SunMoon size={18} color={colors.heading} strokeWidth={2.2} />
        </View>
        <AppText style={[styles.label, { color: colors.heading }]}>Appearance</AppText>
      </View>
      <SegmentedControl
        options={LABELS}
        selectedIndex={MODES.indexOf(mode)}
        onChange={(i) => setMode(MODES[i])}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tile: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
  },
});
