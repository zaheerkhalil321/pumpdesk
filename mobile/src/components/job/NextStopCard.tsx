import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Truck, Warehouse } from 'lucide-react-native';
import { AppText, Button, Card, NavigateButton } from '@/components/ui';
import { OperatorJob } from '@/api/types';
import { formatTimeInZone } from '@/lib/dates';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface NextStopCardProps {
  /** The next job today, or null when the operator heads back to the shop. */
  nextJob: OperatorJob | null;
  shop: OperatorJob['shop'];
  onGoToNextJob: () => void;
  onNavigateToShop: () => void;
}

export const NextStopCard: React.FC<NextStopCardProps> = ({
  nextJob,
  shop,
  onGoToNextJob,
  onNavigateToShop,
}) => {
  const { colors, radius, iconSizes } = useTheme();
  const Icon = nextJob ? Truck : Warehouse;

  const title = nextJob
    ? [nextJob.site.street || nextJob.site.label, nextJob.site.town].filter(Boolean).join(' · ')
    : 'Return to shop';
  const meta = nextJob
    ? [
        formatTimeInZone(nextJob.pourStartsAt, nextJob.timezone),
        nextJob.pump ? `Pump ${nextJob.pump.unit} · ${nextJob.pump.label}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : [shop.name, shop.town].filter(Boolean).join(' · ');

  return (
    <Card tone="default" style={{ ...styles.card, borderRadius: radius.xl }}>
      <View style={styles.head}>
        <View style={[styles.iconTile, { backgroundColor: colors.infoSoft, borderRadius: radius.md }]}>
          <Icon size={20} color={colors.info} strokeWidth={2.2} />
        </View>
        <View style={styles.headText}>
          <AppText style={[styles.overline, { color: colors.info }]}>Next stop</AppText>
          <AppText style={[styles.title, { color: colors.heading }]} numberOfLines={2}>
            {title}
          </AppText>
          <AppText style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={2}>
            {meta}
          </AppText>
        </View>
      </View>

      {nextJob ? (
        <Button
          label="Go to next job"
          variant="outline"
          outlineTone="link"
          size="md"
          leftIcon={<Truck size={iconSizes.sm} color={colors.link} />}
          onPress={onGoToNextJob}
        />
      ) : (
        <NavigateButton label="Navigate to shop" onPress={onNavigateToShop} />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  iconTile: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
  },
  overline: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  meta: {
    fontFamily: fontFamilies.medium,
    fontSize: 13.5,
    marginTop: 2,
  },
});
