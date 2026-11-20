import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import type { Place } from '@/api/types';
import { useTopAlert } from '@/components/ui';
import { openMaps } from '@/features/navigation-apps';
import {
  availableNavigationApps,
  hasCoordinates,
  type NavigationAppChoice,
} from '@/features/navigation-urls';
import { useNavigationApp } from './useNavigationApp';

/**
 * Navigate buttons: uses the saved maps app, or asks each time.
 * A maps app is only opened when the place has an exact map point; without one the
 * operator gets an alert instead of being sent to a guessed spot.
 * Render `<OptionSheet {...sheet} />` once on the screen.
 */
export function useOpenMaps() {
  const { app } = useNavigationApp();
  const { showAlert } = useTopAlert();
  const [pending, setPending] = useState<Place | null>(null);

  const navigate = useCallback(
    (place: Place) => {
      if (!hasCoordinates(place)) {
        showAlert('Location not found', {
          message: 'This address has no map location yet. Ask dispatch to set it.',
          tone: 'warning',
        });
        return;
      }
      if (app === 'ask') setPending(place);
      else void openMaps(place, app);
    },
    [app, showAlert]
  );

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const sheet = {
    visible: pending !== null,
    title: 'Open in',
    options: availableNavigationApps(platform).filter((o) => o.value !== 'ask') as {
      value: Exclude<NavigationAppChoice, 'ask'>;
      label: string;
    }[],
    onSelect: (choice: Exclude<NavigationAppChoice, 'ask'>) => {
      if (pending) void openMaps(pending, choice);
      setPending(null);
    },
    onClose: () => setPending(null),
  };

  return { navigate, sheet };
}
