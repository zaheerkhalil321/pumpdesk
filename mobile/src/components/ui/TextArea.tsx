import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export interface TextAreaProps
  extends Omit<TextInputProps, 'style' | 'multiline' | 'onContentSizeChange'> {
  /** Smallest height in points before the operator types (about 3 lines). */
  minHeight?: number;
  /** Height where the box stops growing and starts to scroll. */
  maxHeight?: number;
  /** Shows "12 / 500" under the box when set. */
  maxLength?: number;
}

const PADDING_Y = 12;

/**
 * Multiline input that grows with its text (mobile has no drag-to-resize handle),
 * up to `maxHeight`, then scrolls inside.
 */
export const TextArea: React.FC<TextAreaProps> = ({
  minHeight = 96,
  maxHeight = 220,
  maxLength,
  value,
  editable = true,
  ...inputProps
}) => {
  const { colors, radius, spacing, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const height = Math.min(Math.max(contentHeight + PADDING_Y * 2, minHeight), maxHeight);
  const length = value?.length ?? 0;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.box,
          {
            height,
            borderRadius: radius.md,
            borderColor: isFocused ? colors.primary : colors.border,
            backgroundColor: editable ? colors.surface : colors.surfaceMuted,
            paddingHorizontal: spacing.base,
          },
        ]}
      >
        <TextInput
          {...inputProps}
          value={value}
          editable={editable}
          maxLength={maxLength}
          multiline
          scrollEnabled={height >= maxHeight}
          textAlignVertical="top"
          placeholderTextColor={colors.mutedForeground}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onContentSizeChange={(e) => setContentHeight(e.nativeEvent.contentSize.height)}
          style={[styles.input, typography.body, { color: colors.foreground }]}
        />
      </View>

      {maxLength ? (
        <AppText variant="caption" tone="muted" style={styles.counter}>
          {length} / {maxLength}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  box: {
    borderWidth: 1.5,
    width: '100%',
    paddingVertical: PADDING_Y,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
});
