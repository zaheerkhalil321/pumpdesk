import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FileText, Clock, Droplets, Cable } from 'lucide-react-native';
import { AppText, Badge, Button, Card } from '@/components/ui';
import type { BadgeTone } from '@/components/ui/Badge';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface WorkTicketCardProps {
  statusLabel: string;
  statusTone: BadgeTone;
  buttonLabel: string;
  submitted: boolean;
  onPress: () => void;
}

const PARTS = [
  { label: 'Times', Icon: Clock },
  { label: 'Yards', Icon: Droplets },
  { label: 'Hose & extras', Icon: Cable },
] as const;

export const WorkTicketCard: React.FC<WorkTicketCardProps> = ({
  statusLabel,
  statusTone,
  buttonLabel,
  submitted,
  onPress,
}) => {
  const { colors, radius } = useTheme();

  return (
    <Card tone="soft" style={{ ...styles.card, borderRadius: radius.xl }}>
      <View style={styles.head}>
        <View style={[styles.iconTile, { backgroundColor: colors.primary, borderRadius: radius.md }]}>
          <FileText size={20} color={colors.primaryForeground} strokeWidth={2.2} />
        </View>
        <View style={styles.headText}>
          <AppText style={[styles.title, { color: colors.heading }]}>Work ticket</AppText>
          <Badge label={statusLabel} tone={statusTone} dot={statusTone === 'warning'} />
        </View>
      </View>

      <View style={styles.parts}>
        {PARTS.map(({ label, Icon }) => (
          <View
            key={label}
            style={[
              styles.part,
              { backgroundColor: colors.surface, borderColor: colors.primarySoftBorder, borderRadius: radius.full },
            ]}
          >
            <Icon size={13} color={colors.primary} strokeWidth={2.2} />
            <AppText style={[styles.partText, { color: colors.heading }]}>{label}</AppText>
          </View>
        ))}
      </View>

      <Button
        label={buttonLabel}
        variant={submitted ? 'outline' : 'primary'}
        size="md"
        caption={!submitted ? 'You can do this later' : undefined}
        onPress={onPress}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  parts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  part: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  partText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12.5,
  },
});
