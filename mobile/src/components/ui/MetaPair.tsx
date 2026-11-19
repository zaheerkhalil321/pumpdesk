import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';

export interface MetaItem {
  label: string; // overline, e.g. "Pour starts"
  value: string; // e.g. "10:30 AM"
  subValue?: string;
}

export interface MetaPairProps {
  left: MetaItem;
  right?: MetaItem;
  style?: ViewStyle;
}

export const MetaPair: React.FC<MetaPairProps> = ({ left, right, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.column}>
        <AppText variant="overline" tone="muted" style={styles.label}>
          {left.label}
        </AppText>
        <AppText variant="value" tone="heading" style={styles.value}>
          {left.value}
        </AppText>
        {left.subValue ? (
          <AppText variant="small" tone="muted">
            {left.subValue}
          </AppText>
        ) : null}
      </View>

      {right ? (
        <>
          <View style={styles.column}>
            <AppText variant="overline" tone="muted" style={styles.label}>
              {right.label}
            </AppText>
            <AppText variant="value" tone="heading" style={styles.value}>
              {right.value}
            </AppText>
            {right.subValue ? (
              <AppText variant="small" tone="muted">
                {right.subValue}
              </AppText>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    width: '100%',
  },
  column: {
    flex: 1,
  },
  label: {
    marginBottom: 4,
  },
  value: {
    letterSpacing: -0.2,
  },
});
