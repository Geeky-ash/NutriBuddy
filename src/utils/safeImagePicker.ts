import { Alert } from 'react-native';

/**
 * Safe wrapper for expo-image-picker.
 * Dynamically loads expo-image-picker to prevent crash if native binary module
 * is not linked into the current development build.
 */
let hasCheckedNative = false;
let nativeImagePicker: any = null;

function getNativeImagePicker() {
  if (hasCheckedNative) return nativeImagePicker;
  hasCheckedNative = true;
  try {
    const RN = require('react-native');
    const isPresent = Boolean(
      RN?.NativeModules?.ExponentImagePicker ||
      (global as any)?.ExpoModules?.ExponentImagePicker
    );
    if (isPresent) {
      nativeImagePicker = require('expo-image-picker');
    }
  } catch {
    nativeImagePicker = null;
  }
  return nativeImagePicker;
}

export const isImagePickerAvailable = (): boolean => {
  const picker = getNativeImagePicker();
  return (
    picker !== null &&
    typeof picker.launchImageLibraryAsync === 'function'
  );
};

export const pickImageFromLibrary = async (): Promise<string | null> => {
  try {
    const picker = getNativeImagePicker();
    if (!picker || typeof picker.launchImageLibraryAsync !== 'function') {
      Alert.alert(
        'Native Build Required',
        'Custom avatar image selection requires compiling the native image-picker module into your APK (npx expo run:android). You can continue enjoying all NutriBuddy features with preset avatars!'
      );
      return null;
    }


    const { status } = await picker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Photo gallery permission is required to select an avatar.'
      );
      return null;
    }

    const result = await picker.launchImageLibraryAsync({
      mediaTypes: picker.MediaTypeOptions?.Images || 'Images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      return result.assets[0].uri;
    }
    return null;
  } catch (err: any) {
    Alert.alert(
      'Photo Notice',
      err?.message || 'Unable to open photo library in current build.'
    );
    return null;
  }
};

export const capturePhotoWithCamera = async (): Promise<string | null> => {
  try {
    const picker = getNativeImagePicker();
    if (!picker || typeof picker.launchCameraAsync !== 'function') {
      Alert.alert(
        'Native Build Required',
        'Camera capture requires compiling the native camera module into your APK (npx expo run:android). You can continue enjoying all NutriBuddy features with preset avatars!'
      );
      return null;
    }

    const { status } = await picker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Camera permission is required to capture an avatar.'
      );
      return null;
    }

    const result = await picker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      return result.assets[0].uri;
    }
    return null;
  } catch (err: any) {
    Alert.alert(
      'Camera Notice',
      err?.message || 'Unable to open camera in current build.'
    );
    return null;
  }
};

