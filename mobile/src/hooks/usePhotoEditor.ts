import { useState } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { useTopAlert } from '@/components/ui';
import { pickProfilePhoto, PhotoSource } from '@/features/pick-photo';
import { useProfilePhoto } from './useProfilePhoto';

export type PhotoAction = PhotoSource | 'remove';

// iOS cannot open one modal (sheet, picker) while another is still closing.
const MODAL_GAP_MS = 350;
const wait = () => new Promise((resolve) => setTimeout(resolve, MODAL_GAP_MS));

/** Everything the profile photo needs: the photo, the action sheet and the full-size viewer. */
export function usePhotoEditor() {
  const { showAlert } = useTopAlert();
  const { photoUri, savePhoto } = useProfilePhoto();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const actions: { value: PhotoAction; label: string; destructive?: boolean }[] = [
    { value: 'camera', label: 'Take photo' },
    { value: 'library', label: 'Choose from library' },
    ...(photoUri ? [{ value: 'remove' as const, label: 'Remove photo', destructive: true }] : []),
  ];

  const remove = () => {
    savePhoto(null);
    showAlert('Photo removed');
  };

  const runAction = async (action: PhotoAction) => {
    setSheetOpen(false);
    if (action === 'remove') {
      remove();
      return;
    }
    await wait();
    const result = await pickProfilePhoto(action);
    if (result.status === 'picked') {
      savePhoto(result.uri);
      showAlert('Profile photo updated');
    } else if (result.status === 'denied') {
      Alert.alert('Camera access is off', 'Turn on camera access for PumpDesk in Settings to take a photo.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
      ]);
    }
  };

  return {
    photoUri,
    /** Tap on the photo: view it full size, or pick one if there is none. */
    pressPhoto: () => (photoUri ? setViewerOpen(true) : setSheetOpen(true)),
    editPhoto: () => setSheetOpen(true),
    sheet: {
      visible: sheetOpen,
      options: actions,
      onSelect: runAction,
      onClose: () => setSheetOpen(false),
    },
    viewer: {
      uri: photoUri,
      visible: viewerOpen,
      onClose: () => setViewerOpen(false),
      onChange: async () => {
        setViewerOpen(false);
        await wait();
        setSheetOpen(true);
      },
      onRemove: () => {
        setViewerOpen(false);
        remove();
      },
    },
  };
}
