/**
 * NutriBuddy Safe Auth Session Service
 * Handles OAuth redirects, PKCE code exchanges, and nutribuddy://auth deep link callbacks.
 */

export * from '../../utils/safeAuthSession';
export {
  getAuthRedirectUri,
  openAuthSession,
  parseAuthUrlParams,
} from '../../utils/safeAuthSession';
export type { AuthSessionResult } from '../../utils/safeAuthSession';
