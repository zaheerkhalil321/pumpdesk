import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Check, Cloud } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { AppText } from './AppText';

export interface StepRowProps {
  label: string; // e.g. "Arrived at shop"
  time: string; // e.g. "8:02 AM"
  onEdit?: () => void;
  editLabel?: string; // default "Edit"; "Edit times" when one link edits every step
  isPendingSync?: boolean;
  style?: ViewStyle;
}

export const StepRow: React.FC<StepRowProps> = ({
  label,
  time,
  onEdit,
  editLabel = 'Edit',
  isPendingSync = false,
  style,
}) => {
  const { colors, iconSizes, spacing } = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: spacing.sm }, style]}>
      <View style={styles.left}>
        <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
          <Check
            size={iconSizes.sm - 4}
            color={colors.primaryForeground}
            strokeWidth={3}
          />
        </View>
        <View style={styles.textContainer}>
          <AppText variant="small" tone="default" style={styles.text}>
            {label} <AppText variant="small" tone="default" style={styles.time}>{time}</AppText>
          </AppText>
        </View>
        {isPendingSync ? (
          <View style={styles.syncIcon} accessibilityLabel="Waiting to send">
            <Cloud size={iconSizes.sm} color={colors.mutedForeground} strokeWidth={1.5} />
          </View>
        ) : null}
      </View>

      {onEdit ? (
        <TouchableOpacity
          onPress={onEdit}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.editButton}
          accessibilityRole="button"
          accessibilityLabel={editLabel === 'Edit' ? `Edit ${label} time` : editLabel}
        >
          <AppText variant="small" tone="link">
            {editLabel}
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    lineHeight: 20,
  },
  time: {
    fontFamily: fontFamilies.semibold,
  },
  syncIcon: {
    marginLeft: 6,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
