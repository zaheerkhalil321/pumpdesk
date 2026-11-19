import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
} from 'react-native';
import { useTheme } from '@/theme';
import { extractDigits } from '@/lib/phone';
import { AppText } from './AppText';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  hasError = false,
}) => {
  const { colors, radius } = useTheme();
  // TextInput ref in React Native 0.88 / React 19
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = value.split('');

  const handleChangeText = (text: string) => {
    const clean = extractDigits(text).slice(0, length);
    onChange(clean);
    if (clean.length === length && onComplete) {
      onComplete(clean);
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<{ key: string }>) => {
    if (e.nativeEvent.key === 'Backspace' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  return (
    <Pressable
      onPress={handleBoxPress}
      style={styles.container}
      accessibilityRole="none"
      accessibilityLabel={`Verification code ${value}`}
    >
      {/* Hidden input to capture keyboard events & autofill */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        onKeyPress={handleKeyPress}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={styles.hiddenInput}
        caretHidden
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus
      />

      <View style={styles.boxesRow}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isCurrentActive = isFocused && index === Math.min(value.length, length - 1);

          let borderColor: string = colors.border;
          if (hasError) {
            borderColor = colors.danger;
          } else if (isCurrentActive) {
            borderColor = colors.primary;
          }

          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  borderRadius: radius.md,
                  borderColor,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <AppText
                variant="value"
                tone={hasError ? 'danger' : 'default'}
                style={styles.digitText}
              >
                {digit}
              </AppText>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  box: {
    width: 50,
    height: 52,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    textAlign: 'center',
  },
});
