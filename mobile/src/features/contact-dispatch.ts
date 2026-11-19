import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export function openTextDispatch(phoneNumber: string, message?: string): void {
  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const bodyParam = message ? `${separator}body=${encodeURIComponent(message)}` : '';
  const url = `sms:${cleanPhone}${bodyParam}`;
  Linking.openURL(url).catch(() => {});
}

export function openCallDispatch(phoneNumber: string): void {
  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  const url = `tel:${cleanPhone}`;
  Linking.openURL(url).catch(() => {});
}
