import * as ImagePicker from 'expo-image-picker';

export type PhotoSource = 'camera' | 'library';

export type PickPhotoResult =
  | { status: 'picked'; uri: string }
  | { status: 'canceled' }
  | { status: 'denied' };

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  // The whole photo is kept as-is (any size or shape); the round avatar just shows the
  // middle of it, and the full photo opens in the viewer.
  allowsEditing: false,
  quality: 0.5,
  // Saved as a data URI: the picker's own file lives in a cache the phone may clear.
  base64: true,
};

/** Take or choose a profile photo (full image, no forced crop). */
export async function pickProfilePhoto(source: PhotoSource): Promise<PickPhotoResult> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(OPTIONS);

  if (result.canceled || !result.assets?.length) return { status: 'canceled' };

  const asset = result.assets[0];
  const uri = asset.base64
    ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
    : asset.uri;
  return { status: 'picked', uri };
}
