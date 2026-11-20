import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { Place } from '@/api/types';
import {
  buildMapsLink,
  getDestination,
  type MapsPlatform,
  type NavigationAppChoice,
} from './navigation-urls';

export type { NavigationApp, NavigationAppChoice } from './navigation-urls';

const platform: MapsPlatform =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'other';

/**
 * Open turn-by-turn directions to a place. Tries the app's own link first and
 * falls back to the web link if the app is not installed (or in Expo Go).
 * canOpenURL is deliberately not used: it needs scheme declarations that Expo
 * Go ignores and Android 11+ hides, while openURL rejects when nothing handles it.
 */
export async function openMaps(
  place: Place,
  app: NavigationAppChoice = 'ask'
): Promise<void> {
  const link = buildMapsLink(getDestination(place), app, platform);
  try {
    await Linking.openURL(link.native);
  } catch {
    await Linking.openURL(link.web).catch(() => {});
  }
}
