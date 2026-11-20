import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isNavigationAppChoice, type NavigationAppChoice } from '@/features/navigation-urls';

const KEY = 'pumpdesk.navigationApp';

/** The operator's saved maps app. Defaults to "ask each time". */
export function useNavigationApp() {
  const [app, setAppState] = useState<NavigationAppChoice>('ask');

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        if (active && isNavigationAppChoice(stored)) setAppState(stored);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setApp = useCallback((next: NavigationAppChoice) => {
    setAppState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  return { app, setApp };
}
