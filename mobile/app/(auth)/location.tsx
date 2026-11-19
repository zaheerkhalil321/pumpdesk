import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { ChevronLeft, Navigation, Square, ShieldCheck } from 'lucide-react-native';
import { Screen, AppText, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

const LocationBroadcastIllustration = ({ size = 120 }: { size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      {/* Soft Mint Teal Base Circle */}
      <Circle cx="64" cy="64" r="64" fill="#E5F7F7" />

      {/* Radiating Broadcast Signal Rays */}
      <Line x1="35" y1="40" x2="23" y2="32" stroke="#0D9488" strokeWidth="4.5" strokeLinecap="round" />
      <Line x1="34" y1="55" x2="22" y2="60" stroke="#0D9488" strokeWidth="4.5" strokeLinecap="round" />
      <Line x1="93" y1="40" x2="105" y2="32" stroke="#0D9488" strokeWidth="4.5" strokeLinecap="round" />
      <Line x1="94" y1="55" x2="106" y2="60" stroke="#0D9488" strokeWidth="4.5" strokeLinecap="round" />

      {/* Teardrop Location Marker */}
      <Path
        d="M64 96 C60 90, 39 68, 39 49 C39 35.2, 50.2 24, 64 24 C77.8 24, 89 35.2, 89 49 C89 68, 68 90, 64 96 Z"
        stroke="#0D9488"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner Target Circle */}
      <Circle cx="64" cy="49" r="9" stroke="#0D9488" strokeWidth="4.5" fill="none" />
    </Svg>
  );
};

export default function LocationPermissionScreen() {
  const router = useRouter();
  const { colors, iconSizes, isDark } = useTheme();
  const { requestLocationPermission, markLocationPrompted } = useAuth();

  const handleContinue = async () => {
    await requestLocationPermission();
    router.replace('/(app)/(jobs)');
  };

  const handleNotNow = async () => {
    await markLocationPrompted();
    router.replace('/(app)/(jobs)');
  };

  const bulletBg = isDark ? colors.surfaceMuted : '#E2F2F9';

  return (
    <Screen scroll padded>
      <View style={styles.content}>
        <View>
          {/* Top Bar with back arrow & Step 3 of 3 */}
          <View style={styles.topBar}>
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

            <AppText variant="caption" tone="muted">
              Step 3 of 3
            </AppText>
          </View>

          {/* Centered Large Map Pin Circle with Broadcast Waves */}
          <View style={styles.iconCenterWrapper}>
            <LocationBroadcastIllustration size={138} />
          </View>

          {/* Centered Title & Subtitle */}
          <View style={styles.titleSection}>
            <AppText variant="display" tone="heading" style={styles.title}>
              Share your location{'\n'}on the job
            </AppText>
            <AppText variant="small" tone="muted" style={styles.subtitle}>
              Help dispatch see your arrival time—even{'\n'}when your phone is locked.
            </AppText>
          </View>

          {/* 3 Info Rows */}
          <View style={styles.rowsContainer}>
            <View style={styles.infoRow}>
              <View style={[styles.bulletIcon, { backgroundColor: bulletBg }]}>
                <Navigation size={18} color={colors.navy} strokeWidth={2.2} />
              </View>
              <AppText variant="body" tone="default" style={styles.rowText}>
                Starts when you tap Head to job
              </AppText>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.bulletIcon, { backgroundColor: bulletBg }]}>
                <Square size={17} color={colors.navy} strokeWidth={2.2} />
              </View>
              <AppText variant="body" tone="default" style={styles.rowText}>
                Stops when you leave the job
              </AppText>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.bulletIcon, { backgroundColor: bulletBg }]}>
                <ShieldCheck size={20} color={colors.navy} strokeWidth={2.2} />
              </View>
              <AppText variant="body" tone="default" style={styles.rowText}>
                No location sharing off the job
              </AppText>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <AppText variant="caption" tone="muted" style={styles.promptCaption}>
            Your phone will ask for location permission next.
          </AppText>

          <Button
            label="Continue"
            variant="primary"
            size="lg"
            onPress={handleContinue}
            style={styles.continueButton}
          />

          <TouchableOpacity
            onPress={handleNotNow}
            style={styles.notNowLink}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Not now"
          >
            <AppText variant="body" tone="link" style={{ fontWeight: '600' }}>
              Not now
            </AppText>
          </TouchableOpacity>

          <AppText variant="caption" tone="muted" style={styles.settingsCaption}>
            You can change this in Settings.
          </AppText>
        </View>
      </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    minHeight: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  iconCenterWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: fontFamilies.extrabold,
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 34,
    color: '#0A2A5A',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  rowsContainer: {
    gap: 16,
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowText: {
    flex: 1,
    lineHeight: 22,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
    width: '100%',
  },
  promptCaption: {
    textAlign: 'center',
    marginBottom: 14,
  },
  continueButton: {
    width: '100%',
  },
  notNowLink: {
    paddingVertical: 12,
    marginTop: 4,
  },
  settingsCaption: {
    textAlign: 'center',
    marginTop: 4,
  },
});
