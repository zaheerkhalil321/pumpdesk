import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Button, PhoneField, ContactDispatchSheet } from '@/components/ui';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { useAuth } from '@/hooks/useAuth';
import { CountryCode, isValidPhone, toE164 } from '@/lib/phone';
import { ApiError, isMockMode } from '@/api';

export default function SignInScreen() {
  const router = useRouter();
  const { sendCode } = useAuth();

  const [country, setCountry] = useState<CountryCode>('US');
  // Demo data: the seed operator's number is filled in. Real backend: start empty.
  const [phone, setPhone] = useState(isMockMode ? '(207) 555-0168' : '');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [showHelpSheet, setShowHelpSheet] = useState(false);

  const isValid = isValidPhone(phone, country);

  const handleSendCode = async () => {
    if (!isValid || loading) return;
    setError(undefined);
    setLoading(true);

    try {
      await sendCode(toE164(phone, country));
      router.push('/(auth)/verify');
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === 'phone_not_found') {
          setError("We couldn't find this number. Ask dispatch to add it.");
        } else if (err.code === 'rate_limited') {
          setError('Too many tries. Wait a minute and try again.');
        } else if (err.code === 'offline') {
          setError('No connection. Check your signal and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError("We couldn't find this number. Ask dispatch to add it.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll padded keyboardAvoiding>
      <View style={styles.content}>
        <View>
          <AuthHeader style={styles.header} />

          <View style={styles.titleSection}>
            <AppText variant="display" tone="heading" style={styles.title}>
              Welcome back
            </AppText>
            <AppText variant="small" tone="muted" style={styles.subtitle}>
              Sign in to see your jobs and work tickets.
            </AppText>
          </View>

          <View style={styles.formSection}>
            <PhoneField
              label="Mobile number"
              value={phone}
              onChangeText={(formatted) => {
                setPhone(formatted);
                if (error) setError(undefined);
              }}
              country={country}
              onCountryChange={(next) => {
                setCountry(next);
                setPhone('');
                setError(undefined);
              }}
              helperText="Use the number your company has on file."
              error={error}
            />

            <Button
              label="Send code"
              variant="primary"
              size="lg"
              disabled={!isValid || loading}
              loading={loading}
              onPress={handleSendCode}
              style={styles.sendButton}
            />

            <View style={styles.captionGroup}>
              <AppText variant="caption" tone="muted" style={styles.captionText}>
                We&apos;ll text you a sign-in code.
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.captionText}>
                Message and data rates may apply.
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            onPress={() => setShowHelpSheet(true)}
            style={styles.helpLink}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Need help signing in?"
          >
            <AppText variant="small" tone="link">
              Need help signing in?
            </AppText>
          </TouchableOpacity>

          <AppText variant="caption" tone="muted" style={styles.termsText}>
            Terms of use · Privacy
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
    paddingTop: 16,
    justifyContent: 'space-between',
    minHeight: 620,
  },
  header: {
    marginTop: 8,
    marginBottom: 28,
  },
  titleSection: {
    marginBottom: 28,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    lineHeight: 22,
  },
  formSection: {
    width: '100%',
  },
  sendButton: {
    marginTop: 12,
  },
  captionGroup: {
    alignItems: 'center',
    marginTop: 14,
  },
  captionText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  helpLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  termsText: {
    textAlign: 'center',
  },
});
