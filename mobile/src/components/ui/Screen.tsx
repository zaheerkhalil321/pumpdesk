import { useTheme } from '@/theme';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  headerBackground?: 'default' | 'navy';
  keyboardAvoiding?: boolean;
  /** Set false on screens inside the tab bar, which already handles the bottom safe area. */
  bottomInset?: boolean;
  /** Pull-to-refresh, for scrolling screens. */
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  padded = true,
  style,
  contentContainerStyle,
  headerBackground = 'default',
  keyboardAvoiding = true,
  bottomInset = true,
  refreshControl,
}) => {
  const { colors, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const statusBarStyle =
    headerBackground === 'navy' || isDark ? 'light' : 'dark';

  // Tabs keep other screens mounted, so only the focused screen sets the status bar colour.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(statusBarStyle);
    }, [statusBarStyle]),
  );

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const topPadding = headerBackground === 'navy' ? 0 : insets.top;

  const innerStyle: ViewStyle = {
    paddingHorizontal: padded ? spacing.screenPadding : 0,
    paddingTop: topPadding,
    paddingBottom: (bottomInset ? insets.bottom : 0) + spacing.md,
  };

  const content = scroll ? (
    <ScrollView
      style={style}
      contentContainerStyle={[innerStyle, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, innerStyle, style]}>{children}</View>
  );

  return (
    <View style={containerStyle}>
      {keyboardAvoiding && Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={styles.keyboardAvoid} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
});
