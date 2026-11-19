import React from 'react';
import { View, StyleSheet, ViewStyle, Image, ImageSourcePropType } from 'react-native';
import { Truck } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { AppText } from './AppText';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  image?: ImageSourcePropType;
  card?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon,
  image,
  card = false,
  children,
  style,
}) => {
  const { colors, radius, spacing } = useTheme();

  const isCard = card || !!image;

  return (
    <View
      style={[
        styles.container,
        isCard
          ? [
              styles.cardContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.base,
              },
            ]
          : { padding: spacing.xl },
        style,
      ]}
    >
      {image ? (
        <View style={styles.imageWrapper}>
          <Image source={image} style={styles.image} resizeMode="contain" />
        </View>
      ) : (
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: colors.primarySoft,
              borderRadius: radius.full,
            },
          ]}
        >
          {icon || (
            <Truck
              size={36}
              color={colors.primary}
              strokeWidth={1.75}
            />
          )}
        </View>
      )}

      <AppText
        style={[
          styles.title,
          {
            color: colors.heading,
            fontFamily: fontFamilies.bold,
          },
        ]}
      >
        {title}
      </AppText>

      {subtitle ? (
        <AppText variant="body" tone="muted" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}

      {children ? <View style={styles.actionContainer}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 12,
  },
  cardContainer: {
    borderWidth: 1,
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconCircle: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    fontSize: 21,
    lineHeight: 27,
    marginBottom: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
});