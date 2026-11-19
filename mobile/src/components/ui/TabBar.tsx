import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';


export const TabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}) => {
  const { colors, iconSizes, radius } = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.navy,
          paddingBottom: Math.max(insets.bottom, 8),
          borderTopLeftRadius: radius.xl + 4,
          borderTopRightRadius: radius.xl + 4,
        },
      ]}
      role="tablist"
    >
      {state.routes.map((route, index) => {
        const focused = index === state.index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const color = focused ? colors.primary : colors.mutedForeground;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            Haptics.selectionAsync().catch(() => {});
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.item}
            role="tab"
            aria-selected={focused}
            accessibilityLabel={label}
          >
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: focused ? colors.primarySoft : 'transparent',
                  borderRadius: radius.lg,
                },
              ]}
            >
              {options.tabBarIcon?.({ focused, color, size: iconSizes.md })}
              <Text numberOfLines={1} style={[styles.label, { color }]}>
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  item: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pill: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12,
  },
});
