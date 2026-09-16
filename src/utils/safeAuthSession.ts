export type AuthSessionResult = {
  type: 'success' | 'cancel' | 'dismiss' | 'error';
  url?: string;
};

function getRN(): any {
  try {
    return require('react-native');
  } catch {
    return null;
  }
}

let hasCheckedNativeBrowser = false;
let nativeWebBrowser: any = null;

function getNativeWebBrowser() {
  if (hasCheckedNativeBrowser) return nativeWebBrowser;
  hasCheckedNativeBrowser = true;
  try {
    if (process.env.NODE_ENV === 'test') {
      nativeWebBrowser = require('expo-web-browser');
      return nativeWebBrowser;
    }
    const RN = require('react-native');
    const isPresent = Boolean(
      RN?.NativeModules?.ExpoWebBrowser ||
      (global as any)?.ExpoModules?.ExpoWebBrowser
    );
    if (isPresent) {
      nativeWebBrowser = require('expo-web-browser');
      try {
        nativeWebBrowser.maybeCompleteAuthSession();
      } catch {}
    }
  } catch {
    nativeWebBrowser = null;
  }
  return nativeWebBrowser;
}

let hasCheckedAuthSession = false;
let nativeAuthSession: any = null;

function getAuthSession() {
  if (hasCheckedAuthSession) return nativeAuthSession;
  hasCheckedAuthSession = true;
  try {
    if (process.env.NODE_ENV === 'test') {
      nativeAuthSession = require('expo-auth-session');
      return nativeAuthSession;
    }
    const browser = getNativeWebBrowser();
    if (browser) {
      nativeAuthSession = require('expo-auth-session');
    }
  } catch {
    nativeAuthSession = null;
  }
  return nativeAuthSession;
}

/**
 * Returns the application redirect URI for OAuth flows.
 * Uses expo-auth-session if available, falling back safely to 'nutribuddy://auth'.
 */
export function getAuthRedirectUri(): string {
  try {
    const session = getAuthSession();
    if (session && typeof session.makeRedirectUri === 'function') {
      return session.makeRedirectUri({
        scheme: 'nutribuddy',
        path: 'auth',
      });
    }
  } catch {}
  return 'nutribuddy://auth';
}

/**
 * Opens a secure authentication session.
 * Uses native ExpoWebBrowser when compiled in APK, or falls back to system Linking with deep-link listener.
 */
export async function openAuthSession(
  url: string,
  redirectUrl: string
): Promise<AuthSessionResult> {
  try {
    const browser = getNativeWebBrowser();
    if (browser && typeof browser.openAuthSessionAsync === 'function') {
      const res = await browser.openAuthSessionAsync(url, redirectUrl);
      return {
        type: res.type === 'success' ? 'success' : 'cancel',
        url: res.url,
      };
    }

    // Graceful fallback via Linking when ExpoWebBrowser binary is not compiled in APK
    const RN = getRN();
    const Linking = RN?.Linking;
    const Alert = RN?.Alert;

    if (!Linking) {
      return { type: 'cancel' };
    }

    return new Promise((resolve) => {
      let subscription: any = null;
      const timeout = setTimeout(() => {
        if (subscription?.remove) subscription.remove();
        resolve({ type: 'cancel' });
      }, 120000);

      const handleUrl = (event: { url: string }) => {
        if (
          event.url &&
          (event.url.includes('access_token') ||
            event.url.includes('code') ||
            event.url.includes('auth'))
        ) {
          clearTimeout(timeout);
          if (subscription?.remove) subscription.remove();
          resolve({ type: 'success', url: event.url });
        }
      };

      try {
        subscription = Linking.addEventListener('url', handleUrl);
      } catch {}

      Linking.openURL(url).catch((err: any) => {
        clearTimeout(timeout);
        if (subscription?.remove) subscription.remove();
        console.warn('[SafeAuthSession] Linking.openURL error:', err);
        if (Alert?.alert) {
          Alert.alert(
            'Google Sign-In Notice',
            'Could not launch system browser for Google authentication.'
          );
        }
        resolve({ type: 'error' });
      });
    });
  } catch (err: any) {
    console.warn('[SafeAuthSession] openAuthSession error:', err);
    return { type: 'cancel' };
  }
}

/**
 * Robust parser for OAuth redirect URLs extracting hash fragment tokens or query parameters
 */
export function parseAuthUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!url) return params;

  // 1. Hash fragment parsing (#access_token=...&refresh_token=...)
  const hashIdx = url.indexOf('#');
  if (hashIdx !== -1) {
    const hashContent = url.substring(hashIdx + 1);
    hashContent.split('&').forEach((part) => {
      const [key, val] = part.split('=');
      if (key && val) {
        try {
          params[decodeURIComponent(key)] = decodeURIComponent(val);
        } catch {
          params[key] = val;
        }
      }
    });
  }

  // 2. Query parameter parsing (?code=...&error=...)
  const queryIdx = url.indexOf('?');
  if (queryIdx !== -1) {
    const queryEnd = hashIdx !== -1 ? hashIdx : url.length;
    const queryContent = url.substring(queryIdx + 1, queryEnd);
    queryContent.split('&').forEach((part) => {
      const [key, val] = part.split('=');
      if (key && val) {
        try {
          params[decodeURIComponent(key)] = decodeURIComponent(val);
        } catch {
          params[key] = val;
        }
      }
    });
  }

  return params;
}
