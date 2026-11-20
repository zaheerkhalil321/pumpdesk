import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { View, StyleSheet, Easing, Pressable } from 'react-native';
import ToastMessage, {
  ToastAnimationConfig,
  ToastConfig,
  ToastConfigParams,
} from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { AppText } from './AppText';

type AlertTone = 'success' | 'info' | 'warning';

export interface AlertAction {
  label: string;
  onPress: () => void;
}

export interface ShowAlertOptions {
  message?: string;
  tone?: AlertTone;
  /** A button on the alert, e.g. "Undo". The alert then stays a little longer. */
  action?: AlertAction;
}

interface TopAlertContextValue {
  showAlert: (title: string, options?: ShowAlertOptions) => void;
}

const TopAlertContext = createContext<TopAlertContextValue | null>(null);

const DURATION_MS = 2800;
const DURATION_WITH_ACTION_MS = 5000;

// Quick, smooth slide (the package default is a slower spring).
const ANIMATION: ToastAnimationConfig = {
  enter: { type: 'timing', duration: 180, easing: Easing.out(Easing.cubic) },
  exit: { type: 'timing', duration: 150, easing: Easing.in(Easing.cubic) },
};

/** Our card look for react-native-toast-message. */
const AlertCard: React.FC<{
  tone: AlertTone;
  title?: string;
  message?: string;
  action?: AlertAction;
}> = ({ tone, title, message, action }) => {
  const { colors, radius } = useTheme();
  const accent = tone === 'success' ? colors.done : tone === 'warning' ? colors.warning : colors.info;
  const accentSoft =
    tone === 'success' ? colors.doneSoft : tone === 'warning' ? colors.warningSoft : colors.infoSoft;
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'warning' ? AlertTriangle : Info;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={message ? `${title}. ${message}` : title}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          shadowColor: colors.navy,
        },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: accentSoft, borderRadius: radius.full }]}>
        <Icon size={20} color={accent} strokeWidth={2.4} />
      </View>
      <View style={styles.text}>
        <AppText style={[styles.title, { color: colors.heading }]}>{title}</AppText>
        {message ? (
          <AppText style={[styles.message, { color: colors.mutedForeground }]}>{message}</AppText>
        ) : null}
      </View>
      {action ? (
        <Pressable
          onPress={() => {
            ToastMessage.hide();
            action.onPress();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={[styles.action, { backgroundColor: colors.primarySoft, borderRadius: radius.full }]}
        >
          <AppText style={[styles.actionText, { color: colors.primary }]}>{action.label}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
};

interface AlertProps {
  action?: AlertAction;
}

const toastConfig: ToastConfig = {
  success: ({ text1, text2, props }: ToastConfigParams<AlertProps>) => (
    <AlertCard tone="success" title={text1} message={text2} action={props?.action} />
  ),
  info: ({ text1, text2, props }: ToastConfigParams<AlertProps>) => (
    <AlertCard tone="info" title={text1} message={text2} action={props?.action} />
  ),
  warning: ({ text1, text2, props }: ToastConfigParams<AlertProps>) => (
    <AlertCard tone="warning" title={text1} message={text2} action={props?.action} />
  ),
};

/**
 * App-wide alert from the top (react-native-toast-message). It lives above the
 * navigator, so it still shows after the screen that raised it has closed.
 */
export const TopAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();

  const showAlert = useCallback<TopAlertContextValue['showAlert']>((title, options) => {
    const tone = options?.tone ?? 'success';
    if (tone === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    ToastMessage.show({
      type: tone,
      text1: title,
      text2: options?.message,
      position: 'top',
      visibilityTime: options?.action || tone === 'warning' ? DURATION_WITH_ACTION_MS : DURATION_MS,
      props: { action: options?.action } satisfies AlertProps,
    });
  }, []);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <TopAlertContext.Provider value={value}>
      {children}
      <ToastMessage config={toastConfig} topOffset={insets.top + 8} animationConfig={ANIMATION} />
    </TopAlertContext.Provider>
  );
};

export function useTopAlert(): TopAlertContextValue {
  const ctx = useContext(TopAlertContext);
  if (!ctx) throw new Error('useTopAlert must be used within a TopAlertProvider');
  return ctx;
}

const styles = StyleSheet.create({
  card: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconTile: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
  },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
  },
  message: {
    fontFamily: fontFamilies.regular,
    fontSize: 13.5,
    marginTop: 2,
  },
});
