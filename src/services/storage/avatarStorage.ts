import { uploadAvatarToStorage } from '../supabase';
import { useProfileStore } from '../../store/useProfileStore';

/**
 * Uploads an avatar image to the Supabase Storage 'avatars' bucket.
 * If offline or if Supabase upload encounters an issue (e.g., bucket not yet created),
 * it returns the local file URI as a graceful local fallback so the avatar displays immediately.
 *
 * @param userId - Unique user identifier (auth.users id)
 * @param imageUri - Local file URI (file://, content://) or remote URL
 * @returns The public Supabase CDN URL, or the local imageUri on fallback
 */
export async function uploadAvatarImage(
  userId: string,
  imageUri: string
): Promise<string> {
  const result = await uploadAvatarToStorage(userId, imageUri);
  useProfileStore.getState().setAvatarUrl(result);
  return result;
}

export default uploadAvatarImage;
