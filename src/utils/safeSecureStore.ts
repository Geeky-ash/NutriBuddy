import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safe wrapper for native ExpoSecureStore.
 * Falls back to AsyncStorage if the native binary module is not compiled into the current build.
 */
let hasCheckedNative = false;
let nativeSecureStore: any = null;

function getNativeSecureStore() {
  if (hasCheckedNative) return nativeSecureStore;
  hasCheckedNative = true;
  try {
    const RN = require('react-native');
    const isPresent = Boolean(
      RN?.NativeModules?.ExpoSecureStore ||
      (global as any)?.ExpoModules?.ExpoSecureStore
    );
    if (isPresent) {
      nativeSecureStore = require('expo-secure-store');
    }
  } catch {
    nativeSecureStore = null;
  }
  return nativeSecureStore;
}

const memoryStore = new Map<string, string>();
const isWeb = typeof localStorage !== 'undefined';


export const safeSecureStore = {
  getItemAsync: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }
      const store = getNativeSecureStore();
      if (store && typeof store.getItemAsync === 'function') {
        const val = await store.getItemAsync(key);
        if (val !== null && val !== undefined) return val;
      }
    } catch {
      // Native module absent or threw, fall through to AsyncStorage
    }

    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStore.get(key) || null;
    }
  },

  setItemAsync: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
        return;
      }
      const store = getNativeSecureStore();
      if (store && typeof store.setItemAsync === 'function') {
        await store.setItemAsync(key, value);
        return;
      }
    } catch {
      // Native module absent or threw, fall through to AsyncStorage
    }

    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },

  deleteItemAsync: async (key: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
        return;
      }
      const store = getNativeSecureStore();
      if (store && typeof store.deleteItemAsync === 'function') {
        await store.deleteItemAsync(key);
        return;
      }
    } catch {
      // Native module absent or threw, fall through to AsyncStorage
    }


    try {
      await AsyncStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};
