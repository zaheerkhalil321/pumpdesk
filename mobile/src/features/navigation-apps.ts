import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export type NavigationAppChoice = 'ask' | 'apple' | 'google' | 'waze';

export async function openMaps(
  address: string,
  preferredApp: NavigationAppChoice = 'ask'
): Promise<void> {
  const encoded = encodeURIComponent(address);

  if (preferredApp === 'apple' && Platform.OS === 'ios') {
    const url = `maps://?daddr=${encoded}`;
    await Linking.openURL(url).catch(() => {});
    return;
  }

  if (preferredApp === 'google') {
    const nativeUrl = `comgooglemaps://?daddr=${encoded}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl).catch(() => {});
    } else {
      await Linking.openURL(webUrl).catch(() => {});
    }
    return;
  }

  if (preferredApp === 'waze') {
    const nativeUrl = `waze://?q=${encoded}&navigate=yes`;
    const webUrl = `https://waze.com/ul?q=${encoded}&navigate=yes`;
    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl).catch(() => {});
    } else {
      await Linking.openURL(webUrl).catch(() => {});
    }
    return;
  }

  // Default / Ask: open native map viewer
  const defaultUrl =
    Platform.OS === 'ios'
      ? `maps://?daddr=${encoded}`
      : `geo:0,0?q=${encoded}`;

  await Linking.openURL(defaultUrl).catch(() => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`).catch(() => {});
  });
}
