import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Phone } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface ProfileHeaderProps {
  fullName: string;
  initials: string;
  companyName: string;
  phone?: string;
  photoUri: string | null;
  /** Tap on the photo (view it, or add one). */
  onPressPhoto: () => void;
  /** Tap on the camera badge (change photo). */
  onEditPhoto: () => void;
}

const AVATAR = 108;
const RING = 4;

/** Navy cover with the avatar sitting half over its bottom edge. */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  fullName,
  initials,
  companyName,
  phone,
  photoUri,
  onPressPhoto,
  onEditPhoto,
}) => {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const ringSize = AVATAR + RING * 2;

  return (
    <View>
      <View
        style={[
          styles.cover,
          {
            backgroundColor: colors.navy,
            paddingTop: insets.top + spacing.base,
            paddingHorizontal: spacing.screenPadding,
            paddingBottom: ringSize / 2 + spacing.lg,
            borderBottomLeftRadius: radius.xl + 8,
            borderBottomRightRadius: radius.xl + 8,
          },
        ]}
      >
        <AppText style={[styles.coverTitle, { color: colors.navyForeground }]} accessibilityRole="header">
          Profile
        </AppText>
        <AppText style={[styles.coverSub, { color: colors.navyForeground }]}>{companyName}</AppText>
      </View>

      <View style={[styles.identity, { marginTop: -ringSize / 2 }]}>
        <View style={{ width: ringSize, height: ringSize }}>
          <Pressable
            onPress={onPressPhoto}
            accessibilityRole="button"
            accessibilityLabel={photoUri ? 'View profile photo' : 'Add profile photo'}
            style={[
              styles.ring,
              {
                width: ringSize,
                height: ringSize,
                padding: RING,
                backgroundColor: colors.background,
                borderRadius: radius.full,
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.fill} contentFit="cover" transition={150} />
              ) : (
                <AppText style={[styles.initials, { color: colors.primaryForeground }]}>{initials}</AppText>
              )}
            </View>
          </Pressable>
          <Pressable
            onPress={onEditPhoto}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={photoUri ? 'Change profile photo' : 'Add profile photo'}
            style={[
              styles.badge,
              { backgroundColor: colors.navy, borderColor: colors.background, borderRadius: radius.full },
            ]}
          >
            <Camera size={16} color={colors.navyForeground} strokeWidth={2.4} />
          </Pressable>
        </View>

        <AppText style={[styles.name, { color: colors.heading }]}>{fullName}</AppText>
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: colors.primarySoft, borderRadius: radius.full }]}>
            <AppText style={[styles.chipText, { color: colors.primary }]}>Pump operator</AppText>
          </View>
          {phone ? (
            <View style={[styles.chip, { backgroundColor: colors.surfaceMuted, borderRadius: radius.full }]}>
              <Phone size={12} color={colors.mutedForeground} strokeWidth={2.4} />
              <AppText style={[styles.chipText, { color: colors.mutedForeground }]}>{phone}</AppText>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cover: {},
  coverTitle: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  coverSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 14.5,
    marginTop: 2,
    opacity: 0.75,
  },
  identity: {
    alignItems: 'center',
  },
  ring: {},
  avatar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 36,
    // Without its own line height the text keeps the body one (too short) and gets clipped.
    lineHeight: 44,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 36,
    height: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12.5,
  },
});
