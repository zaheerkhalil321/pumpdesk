import { api } from '@/api';
import { AppearanceRow } from '@/components/profile/AppearanceRow';
import { OptionSheet } from '@/components/profile/OptionSheet';
import { PhotoViewer } from '@/components/profile/PhotoViewer';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { SettingsRow } from '@/components/profile/SettingsRow';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { AppText, Screen, useTopAlert } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { usePhotoEditor } from '@/hooks/usePhotoEditor';
import { useProfileStats } from '@/hooks/useProfileStats';
import { formatUsPhone } from '@/lib/phone';
import { useTheme } from '@/theme';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { LogOut, MapPin, Navigation, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

// Read from app.json ("version"), so it never goes out of date.
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

type NavApp = 'ask' | 'apple' | 'google' | 'waze';
const NAV_APPS: { value: NavApp; label: string }[] = [
  { value: 'ask', label: 'Ask each time' },
  { value: 'apple', label: 'Apple Maps' },
  { value: 'google', label: 'Google Maps' },
  { value: 'waze', label: 'Waze' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { operator, signOut } = useAuth();
  const { showAlert } = useTopAlert();
  const photo = usePhotoEditor();
  const stats = useProfileStats();

  const [navApp, setNavApp] = useState<NavApp>('ask');
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const location = useLocationPermission();

  const fullName = operator
    ? `${operator.firstName} ${operator.lastName}`
    : 'Rob Black';
  const initials = operator
    ? `${operator.firstName[0]}${operator.lastName[0]}`
    : 'RB';
  const companyName = operator?.company?.name || 'Midcoast Concrete Pumping';
  // Demo-data reset is for development only: never in a store build, never on the real backend.
  const showDemoReset = __DEV__ && !!api.resetDemoData;

  const handleResetDemoData = async () => {
    if (!api.resetDemoData) return;
    await api.resetDemoData();
    showAlert('Demo data reset');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out of PumpDesk?',
      'You will need your phone number to sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ],
    );
  };

  return (
    <Screen scroll padded={false} headerBackground="navy" bottomInset={false}>
      <ProfileHeader
        fullName={fullName}
        initials={initials}
        companyName={companyName}
        phone={operator?.phone ? formatUsPhone(operator.phone) : undefined}
        photoUri={photo.photoUri}
        onPressPhoto={photo.pressPhoto}
        onEditPhoto={photo.editPhoto}
      />

      <View style={[styles.body, { paddingHorizontal: spacing.screenPadding }]}>
        <ProfileStats stats={stats} />

        <SettingsSection title="Preferences">
          <SettingsRow
            icon={Navigation}
            tint="blue"
            label="Navigation app"
            value={NAV_APPS.find((a) => a.value === navApp)?.label}
            onPress={() => setNavSheetOpen(true)}
          />
          <AppearanceRow />
          <SettingsRow
            icon={MapPin}
            tint="green"
            label="Location sharing"
            showDivider={false}
            right={
              <Switch
                value={!!location.granted}
                disabled={location.granted === null}
                onValueChange={location.setEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
                ios_backgroundColor={colors.border}
                accessibilityLabel="Location sharing"
              />
            }
          />
        </SettingsSection>

        {showDemoReset ? (
          <SettingsSection
            title="Developer"
            footer="Only shown in development builds."
          >
            <SettingsRow
              icon={RotateCcw}
              tint="navy"
              label="Reset demo data"
              showDivider={false}
              onPress={handleResetDemoData}
            />
          </SettingsSection>
        ) : null}

        <SettingsSection>
          <SettingsRow
            icon={LogOut}
            tint="red"
            label="Sign out"
            destructive
            showDivider={false}
            onPress={handleSignOut}
          />
        </SettingsSection>

        <View style={styles.footer}>
          <AppText variant="caption" tone="muted">
            Version {APP_VERSION}
          </AppText>
          <View style={styles.legal}>
            <Pressable accessibilityRole="link" hitSlop={8}>
              <AppText variant="caption" tone="muted">
                Privacy
              </AppText>
            </Pressable>
            <AppText variant="caption" tone="muted">
              {' · '}
            </AppText>
            <Pressable accessibilityRole="link" hitSlop={8}>
              <AppText variant="caption" tone="muted">
                Terms
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>

      <OptionSheet title="Profile photo" {...photo.sheet} />
      <PhotoViewer {...photo.viewer} />
      <OptionSheet
        visible={navSheetOpen}
        title="Navigation app"
        options={NAV_APPS}
        selected={navApp}
        onSelect={(value) => {
          setNavApp(value);
          setNavSheetOpen(false);
        }}
        onClose={() => setNavSheetOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  legal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
