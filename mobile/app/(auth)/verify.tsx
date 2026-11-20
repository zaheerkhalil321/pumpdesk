import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import {
  Screen,
  AppText,
  Button,
  OtpInput,
  ContactDispatchSheet,
} from '@/components/ui';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/api';
import { maskPhoneNumber } from '@/lib/phone';
import { formatCountdown, secondsUntilResend } from '@/features/otp';
import { useTheme } from '@/theme';

export default function VerifyScreen() {
  const router = useRouter();
  const { colors, iconSizes } = useTheme();
  const { pendingPhone, codeSentAt, verifyCode, sendCode } = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [now, setNow] = useState(() => Date.now());
  const [showHelpSheet, setShowHelpSheet] = useState(false);

  // Counted from when the code really went out, so leaving and coming back keeps the right time.
  const countdown = secondsUntilResend(codeSentAt, now);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || code;
    if (finalCode.length !== 6 || loading) return;

    setError(undefined);
    setLoading(true);

    try {
      await verifyCode(finalCode);
      router.push('/(auth)/ready');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'phone_not_found') {
        setError("We couldn't find this number. Ask dispatch to add it.");
      } else if (err instanceof ApiError && err.code === 'offline') {
        setError('No connection. Check your signal and try again.');
      } else if (err instanceof ApiError && err.code === 'rate_limited') {
        setError('Too many tries. Wait a minute and try again.');
      } else {
        setError("That code didn't work. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(undefined);
    try {
      await sendCode(pendingPhone);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'rate_limited'
          ? 'Please wait a moment before asking for a new code.'
          : err instanceof ApiError && err.code === 'offline'
            ? 'No connection. Check your signal and try again.'
            : "We couldn't send a new code. Try again."
      );
    } finally {
      setNow(Date.now());
    }
  };

  return (
    <Screen scroll padded keyboardAvoiding>
      <View style={styles.content}>
        <View>
          {/* Top Left Back Arrow Icon Only */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft
              size={iconSizes.md + 2}
              color={colors.foreground}
              strokeWidth={iconSizes.strokeWidth}
            />
          </TouchableOpacity>

          {/* Centered Logo */}
          <AuthHeader showForOperators={false} style={styles.header} />

          {/* Centered Title & Sent To & Change Number */}
          <View style={styles.titleSection}>
            <AppText variant="title" tone="heading" style={styles.title}>
              Enter your code
            </AppText>
            <AppText variant="small" tone="muted" style={styles.sentToText}>
              Sent to {maskPhoneNumber(pendingPhone)}
            </AppText>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.changeNumberButton}
              accessibilityRole="button"
              accessibilityLabel="Change number"
            >
              <AppText variant="small" tone="link">
                Change number
              </AppText>
            </TouchableOpacity>
          </View>

          {/* OTP Boxes */}
          <View style={styles.otpSection}>
            <OtpInput
              value={code}
              onChange={(val) => {
                setCode(val);
                if (error) setError(undefined);
              }}
              onComplete={(completedCode) => handleVerify(completedCode)}
              hasError={!!error}
            />

            {error ? (
              <AppText variant="small" tone="danger" style={styles.errorText}>
                {error}
              </AppText>
            ) : null}

            <Button
              label="Verify & sign in"
              variant="primary"
              size="lg"
              disabled={code.length !== 6 || loading}
              loading={loading}
              onPress={() => handleVerify()}
              style={styles.verifyButton}
            />

            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <AppText variant="caption" tone="muted">
                  Resend code in {formatCountdown(countdown)}
                </AppText>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  accessibilityRole="button"
                  accessibilityLabel="Resend code"
                >
                  <AppText variant="caption" tone="link">
                    Resend code
                  </AppText>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShowHelpSheet(true)}
              style={styles.needHelpBtn}
              accessibilityRole="button"
              accessibilityLabel="Need help?"
            >
              <AppText variant="small" tone="link">
                Need help?
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Terms & Privacy */}
        <View style={styles.bottomSection}>
          <AppText variant="caption" tone="muted" style={styles.termsText}>
            By continuing, you agree to our{' '}
            <AppText variant="caption" tone="link" style={{ textDecorationLine: 'underline' }}>
              Terms of Service
            </AppText>{' '}
            and{' '}
            <AppText variant="caption" tone="link" style={{ textDecorationLine: 'underline' }}>
              Privacy Policy
            </AppText>
            .
          </AppText>
        </View>
      </View>

      <ContactDispatchSheet
        visible={showHelpSheet}
        onClose={() => setShowHelpSheet(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 8,
    justifyContent: 'space-between',
    minHeight: 620,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  header: {
    marginBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    marginBottom: 6,
    textAlign: 'center',
  },
  sentToText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  changeNumberButton: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  otpSection: {
    width: '100%',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 12,
  },
  verifyButton: {
    marginTop: 12,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  needHelpBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  termsText: {
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
});
