import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapPin, Truck, Droplets } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { OperatorJob } from '@/api/types';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface JobCardDetailsProps {
  job: OperatorJob;
}

interface ChipProps {
  icon: React.ReactNode;
  label: string;
}

const Chip: React.FC<ChipProps> = ({ icon, label }) => {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.full },
      ]}
    >
      {icon}
      <AppText style={[styles.chipText, { color: colors.heading }]}>{label}</AppText>
    </View>
  );
};

export const JobCardDetails: React.FC<JobCardDetailsProps> = ({ job }) => {
  const { colors } = useTheme();
  const street = job.site.street || job.site.label;
  const address = job.site.town ? `${street}, ${job.site.town}` : street;

  return (
    <View>
      <AppText style={[styles.customer, { color: colors.heading }]} numberOfLines={1}>
        {job.customerName}
      </AppText>
      <View style={styles.addressRow}>
        <MapPin size={15} color={colors.mutedForeground} strokeWidth={2} />
        <AppText style={[styles.address, { color: colors.mutedForeground }]} numberOfLines={1}>
          {address}
        </AppText>
      </View>
      <View style={styles.chips}>
        <Chip
          icon={<Droplets size={13} color={colors.primary} strokeWidth={2.2} />}
          label={`${job.estimatedYards} yd³`}
        />
        {job.pump ? (
          <Chip
            icon={<Truck size={13} color={colors.primary} strokeWidth={2.2} />}
            label={job.pump.label}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  customer: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    lineHeight: 23,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  address: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12.5,
  },
});
