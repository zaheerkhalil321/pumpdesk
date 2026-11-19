import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';

/**
 * The phone's real "While Using App" location permission.
 * The app can ask for it, but only the phone's Settings can take it away,
 * so turning it off (or on after a "Don't allow") opens Settings.
 */
export function useLocationPermission() {
  const [granted, setGranted] = useState<boolean | null>(null); // null = still reading
  const [canAskAgain, setCanAskAgain] = useState(true);

  useEffect(() => {
    const read = () =>
      Location.getForegroundPermissionsAsync()
        .then((perm) => {
          setGranted(perm.granted);
          setCanAskAgain(perm.canAskAgain);
        })
        .catch(() => setGranted(false));

    read();
    // Re-read when the operator comes back from the Settings app.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') read();
    });
    return () => sub.remove();
  }, []);

  const openSettings = (title: string, message: string) =>
    Alert.alert(title, message, [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
    ]);

  const setEnabled = useCallback(
    async (on: boolean) => {
      if (on) {
        if (canAskAgain) {
          const perm = await Location.requestForegroundPermissionsAsync();
          setGranted(perm.granted);
          setCanAskAgain(perm.canAskAgain);
          if (perm.granted || perm.canAskAgain) return;
        }
        openSettings(
          'Location is off for PumpDesk',
          'Turn on location for PumpDesk in Settings so dispatch can see your arrival time.'
        );
      } else {
        openSettings(
          'Turn off location in Settings',
          'Only your phone can turn off location for PumpDesk. Open Settings and set Location to Never.'
        );
      }
    },
    [canAskAgain]
  );

  return { granted, setEnabled };
}
