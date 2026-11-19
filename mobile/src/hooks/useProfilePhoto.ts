import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Demo only: kept on the phone until the backend has a profile-photo bucket.
const STORAGE_KEY = '@pumpdesk/profile_photo';

export function useProfilePhoto() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((uri) => setPhotoUri(uri))
      .catch(() => {});
  }, []);

  const savePhoto = useCallback((uri: string | null) => {
    setPhotoUri(uri);
    const op = uri ? AsyncStorage.setItem(STORAGE_KEY, uri) : AsyncStorage.removeItem(STORAGE_KEY);
    op.catch(() => {});
  }, []);

  return { photoUri, savePhoto };
}
