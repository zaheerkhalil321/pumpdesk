import { AuthHeader } from '@/components/auth/AuthHeader';
import {
  AppText,
  Button,
  Card,
  ContactDispatchSheet,
  Screen,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ReadyScreen() {
  const router = useRouter();
  const { colors, radius } = useTheme();
  const { operator } = useAuth();
  const [showHelpSheet, setShowHelpSheet] = useState(false);

  const firstName = operator?.firstName || 'Rob';
  const companyName = operator?.company?.name || 'Midcoast Concrete Pumping';
  const town = operator?.company?.town || 'Warren, Maine';

  const handleContinue = () => {
    router.push('/(auth)/location');
  };

  return (
    <Screen scroll padded>
      <View style={styles.content}>
        <View>
          <AuthHeader style={styles.header} />

          <View style={styles.titleSection}>
            <AppText variant="display" tone="heading" style={styles.title}>
              You&apos;re ready, {firstName}
            </AppText>
            <AppText variant="small" tone="muted" style={styles.subtitle}>
              Your jobs and work tickets,{'\n'}all in one place.
            </AppText>
          </View>

          {/* Company Card */}
          <Card tone="default" style={styles.companyCard}>
            <View
              style={[
                styles.initialsTile,
                {
                  backgroundColor: colors.navy,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <AppText
                variant="headline"
                tone="navyForeground"
                style={styles.initialsText}
              >
                MC
              </AppText>
            </View>

            <View style={styles.companyInfo}>
              <AppText
                variant="headline"
                tone="heading"
                style={styles.companyName}
              >
                {companyName}
              </AppText>
              <AppText variant="small" tone="muted">
                {town}
              </AppText>
            </View>
          </Card>
        </View>

        <View style={styles.bottomSection}>
          <Button
            label="View my jobs"
            variant="primary"
            size="lg"
            onPress={handleContinue}
            style={styles.continueButton}
          />

          <TouchableOpacity
            onPress={() => setShowHelpSheet(true)}
            style={styles.helpLink}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Not your company? Get help"
          >
            <AppText variant="small" tone="link" style={{ textDecorationLine: 'underline' }}>
              Not your company? Get help
            </AppText>
          </TouchableOpacity>
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
  },
  header: {
    marginTop: 8,
    marginBottom: 28,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    lineHeight: 22,
    textAlign: 'center',
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
  },
  initialsTile: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  initialsText: {
    textAlign: 'center',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    marginBottom: 2,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    width: '100%',
  },
  continueButton: {
    width: '100%',
  },
  helpLink: {
    paddingVertical: 10,
    marginTop: 10,
  },
});
