import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ViewStyle, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
}

const TRACK_PADDING = 3;
const TRACK_BORDER = 1;
const SPRING = { damping: 18, stiffness: 220, mass: 0.8 };

interface SegmentLabelProps {
  label: string;
  position: SharedValue<number>;
  index: number;
  activeColor: string;
  inactiveColor: string;
}

const SegmentLabel: React.FC<SegmentLabelProps> = ({
  label,
  position,
  index,
  activeColor,
  inactiveColor,
}) => {
  // Animated text colour follows the sliding indicator (Reanimated style).
  const animatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      Math.min(Math.abs(position.value - index), 1),
      [0, 1],
      [activeColor, inactiveColor]
    ),
  }));

  return <Animated.Text style={[styles.label, animatedStyle]}>{label}</Animated.Text>;
};

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onChange,
  style,
}) => {
  const { colors, radius } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const position = useSharedValue(selectedIndex);

  const segmentWidth =
    trackWidth > 0
      ? (trackWidth - 2 * (TRACK_PADDING + TRACK_BORDER)) / options.length
      : 0;

  useEffect(() => {
    position.value = withSpring(selectedIndex, SPRING);
  }, [selectedIndex, position]);

  const indicatorStyle = useAnimatedStyle(() => ({
    // Reanimated style: slides the pill under the selected option.
    transform: [{ translateX: position.value * segmentWidth }],
  }));

  const handleSelect = (index: number) => {
    if (index === selectedIndex) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(index);
  };

  const handleLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.track,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          borderRadius: radius.full,
        },
        style,
      ]}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { width: segmentWidth, backgroundColor: colors.primary, borderRadius: radius.full },
            indicatorStyle,
          ]}
        />
      ) : null}
      {options.map((option, index) => (
        <Pressable
          key={option}
          onPress={() => handleSelect(index)}
          style={styles.segment}
          accessibilityRole="tab"
          accessibilityState={{ selected: index === selectedIndex }}
          accessibilityLabel={option}
        >
          <SegmentLabel
            label={option}
            position={position}
            index={index}
            activeColor={colors.primaryForeground}
            inactiveColor={colors.heading}
          />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    padding: TRACK_PADDING,
    borderWidth: TRACK_BORDER,
  },
  indicator: {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
  },
  segment: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
    fontSize: 15,
    fontFamily: fontFamilies.bold,
  },
});
