import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase, UserProfile, uploadAvatarToStorage } from '../services/supabase';
import { useProfileStore } from './useProfileStore';
import { ENV } from '../config/env';
import { getAuthRedirectUri, openAuthSession, parseAuthUrlParams } from '../utils/safeAuthSession';

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;

  // Actions
  loadSession: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (localUri: string) => Promise<string | null>;
  signInAsGuest: () => void;
  clearError: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'guest-user',
  email: 'explorer@nutribuddy.app',
  phone: null,
  full_name: 'NutriExplorer Alex',
  avatar_url: null,
  daily_calories: 2100,
  protein_g: 130,
  carbs_g: 220,
  fat_g: 65,
  gender: 'Male',
  height_cm: 175.0,
  weight_kg: 63.0,
  birth_date: 'Jan 2, 2005',
};

let authSubscriptionInitialized = false;
let hasWarnedSchemaCache = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  authError: null,

  clearError: () => set({ authError: null }),

  loadSession: async () => {
    try {
      set({ isLoading: true, authError: null });

      // If Supabase is not configured, fall back to guest session
      if (!ENV.HAS_SUPABASE) {
        set({
          user: null,
          session: null,
          profile: DEFAULT_PROFILE,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.warn('[AuthStore] Error getting session:', sessionError.message);
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      if (session?.user) {
        const user = session.user;
        // Fetch or create profile
        let userProfile: UserProfile | null = null;
        try {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError) {
            if (
              profileError.message?.includes('schema cache') ||
              profileError.message?.includes('does not exist')
            ) {
              if (!hasWarnedSchemaCache) {
                hasWarnedSchemaCache = true;
                console.warn(
                  '[AuthStore] Notice: "public.profiles" table is not yet created in your Supabase database. NutriBuddy will run smoothly with local profile storage until the SQL migration is executed in your Supabase SQL editor.'
                );
              }
            } else {
              console.warn('[AuthStore] Remote profile fetch notice:', profileError.message);
            }
          } else {
            userProfile = data;
          }

          if (!userProfile) {
            // Provision in-memory fallback profile record
            const newProfile: UserProfile = {
              id: user.id,
              email: user.email || null,
              phone: user.phone || null,
              full_name: user.user_metadata?.full_name || 'NutriExplorer',
              avatar_url: user.user_metadata?.avatar_url || null,
              daily_calories: 2100,
              protein_g: 130,
              carbs_g: 220,
              fat_g: 65,
            };

            // Only attempt remote upsert if the table actually exists
            if (!profileError) {
              await supabase.from('profiles').upsert(newProfile);
            }
            userProfile = newProfile;
          }
        } catch (err) {
          console.warn('[AuthStore] Profile initialization warning:', err);
        }

        // Sync with useProfileStore
        if (userProfile) {
          useProfileStore.getState().setUserName(userProfile.full_name || 'NutriExplorer');
          if (userProfile.avatar_url) {
            useProfileStore.getState().setAvatarUrl(userProfile.avatar_url);
          }
          useProfileStore.getState().setGoals({
            dailyCalories: userProfile.daily_calories,
            targetProtein: userProfile.protein_g,
            targetCarbs: userProfile.carbs_g,
            targetFat: userProfile.fat_g,
          });
          if (userProfile.gender || userProfile.height_cm || userProfile.weight_kg || userProfile.birth_date) {
            useProfileStore.getState().setPersonalMetrics({
              ...(userProfile.gender ? { gender: userProfile.gender } : {}),
              ...(userProfile.height_cm ? { heightCm: userProfile.height_cm } : {}),
              ...(userProfile.weight_kg ? { weightKg: userProfile.weight_kg } : {}),
              ...(userProfile.birth_date ? { birthDate: userProfile.birth_date } : {}),
            });
          }
        }

        set({
          user,
          session,
          profile: userProfile || {
            id: user.id,
            email: user.email || null,
            phone: user.phone || null,
            full_name: user.user_metadata?.full_name || 'NutriExplorer',
            avatar_url: null,
            daily_calories: 2100,
            protein_g: 130,
            carbs_g: 220,
            fat_g: 65,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          session: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // Initialize auth state change listener once
      if (!authSubscriptionInitialized && ENV.HAS_SUPABASE) {
        authSubscriptionInitialized = true;
        supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_OUT' || !newSession) {
            set({
              user: null,
              session: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            get().loadSession();
          }
        });
      }
    } catch (error: any) {
      console.warn('[AuthStore] Unexpected loadSession error:', error);
      set({ isLoading: false, isAuthenticated: false, authError: error?.message });
    }
  },

  signUpWithEmail: async (email, password, fullName) => {
    try {
      set({ isLoading: true, authError: null });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        set({ isLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        const initialProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email.trim(),
          phone: null,
          full_name: fullName.trim() || 'NutriExplorer',
          avatar_url: null,
          daily_calories: 2100,
          protein_g: 130,
          carbs_g: 220,
          fat_g: 65,
        };

        try {
          await supabase.from('profiles').upsert(initialProfile);
        } catch {
          // Non-blocking
        }

        useProfileStore.getState().setUserName(initialProfile.full_name || 'NutriExplorer');
        set({
          user: data.user,
          session: data.session,
          profile: initialProfile,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign up';
      set({ isLoading: false, authError: msg });
      return { success: false, error: msg };
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      set({ isLoading: true, authError: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ isLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Fetch profile
        let userProfile: UserProfile | null = null;
        try {
          const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          userProfile = pData;
        } catch {
          // ignore
        }

        const effectiveProfile: UserProfile = userProfile || {
          id: data.user.id,
          email: data.user.email || email.trim(),
          phone: null,
          full_name: data.user.user_metadata?.full_name || 'NutriExplorer',
          avatar_url: null,
          daily_calories: 2100,
          protein_g: 130,
          carbs_g: 220,
          fat_g: 65,
        };

        useProfileStore.getState().setUserName(effectiveProfile.full_name || 'NutriExplorer');
        useProfileStore.getState().setGoals({
          dailyCalories: effectiveProfile.daily_calories,
          targetProtein: effectiveProfile.protein_g,
          targetCarbs: effectiveProfile.carbs_g,
          targetFat: effectiveProfile.fat_g,
        });

        set({
          user: data.user,
          session: data.session,
          profile: effectiveProfile,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in';
      set({ isLoading: false, authError: msg });
      return { success: false, error: msg };
    }
  },

  signInWithPhone: async (phone) => {
    try {
      set({ isLoading: true, authError: null });

      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });

      if (error) {
        set({ isLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to send phone OTP';
      set({ isLoading: false, authError: msg });
      return { success: false, error: msg };
    }
  },

  verifyPhoneOTP: async (phone, token) => {
    try {
      set({ isLoading: true, authError: null });

      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: token.trim(),
        type: 'sms',
      });

      if (error) {
        set({ isLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        const initialProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || null,
          phone: phone.trim(),
          full_name: 'NutriExplorer',
          avatar_url: null,
          daily_calories: 2100,
          protein_g: 130,
          carbs_g: 220,
          fat_g: 65,
        };

        try {
          await supabase.from('profiles').upsert(initialProfile);
        } catch {
          // ignore
        }

        set({
          user: data.user,
          session: data.session,
          profile: initialProfile,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to verify phone OTP';
      set({ isLoading: false, authError: msg });
      return { success: false, error: msg };
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, authError: null });

      if (!ENV.HAS_SUPABASE) {
        // Offline / Demo fallback: Create Google guest session
        const demoGoogleProfile: UserProfile = {
          id: 'google-demo-user',
          email: 'google.explorer@nutribuddy.app',
          phone: null,
          full_name: 'Google Explorer',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/png?seed=GoogleExplorer&backgroundColor=ecfdf5',
          daily_calories: 2100,
          protein_g: 130,
          carbs_g: 220,
          fat_g: 65,
        };

        set({
          user: {
            id: 'google-demo-user',
            app_metadata: { provider: 'google' },
            user_metadata: { full_name: 'Google Explorer', avatar_url: demoGoogleProfile.avatar_url },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as any,
          session: null,
          profile: demoGoogleProfile,
          isAuthenticated: true,
          isLoading: false,
          authError: null,
        });

        useProfileStore.getState().setUserName(demoGoogleProfile.full_name || 'Google Explorer');
        return { success: true };
      }

      const redirectTo = getAuthRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        set({ isLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }

      if (!data?.url) {
        set({ isLoading: false, authError: 'No authorization URL returned' });
        return { success: false, error: 'No authorization URL returned' };
      }

      const authResult = await openAuthSession(data.url, redirectTo);

      if (authResult.type !== 'success') {
        set({ isLoading: false });
        return { success: false, error: 'Google sign-in was cancelled or dismissed' };
      }

      // Parse returning URL params
      const params = parseAuthUrlParams(authResult.url || '');

      if (params.error_description || params.error) {
        const errDesc = params.error_description || params.error || 'Google authentication failed';
        set({ isLoading: false, authError: errDesc });
        return { success: false, error: errDesc };
      }

      let user = null;
      let session = null;

      if (params.access_token && params.refresh_token) {
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });

        if (sessionErr) {
          set({ isLoading: false, authError: sessionErr.message });
          return { success: false, error: sessionErr.message };
        }

        user = sessionData.user;
        session = sessionData.session;
      } else if (params.code) {
        const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(params.code);

        if (codeErr) {
          set({ isLoading: false, authError: codeErr.message });
          return { success: false, error: codeErr.message };
        }

        user = codeData.user;
        session = codeData.session;
      } else {
        // Refresh active session from Supabase
        const { data: activeSessionData } = await supabase.auth.getSession();
        user = activeSessionData.session?.user || null;
        session = activeSessionData.session;
      }

      if (!user) {
        set({ isLoading: false, authError: 'Failed to retrieve authenticated user' });
        return { success: false, error: 'Failed to retrieve authenticated user' };
      }

      // Fetch or provision profile
      let userProfile: UserProfile | null = null;
      try {
        const { data: dbProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (dbProfile && !profileErr) {
          userProfile = dbProfile;
        } else {
          const googleName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            'NutriExplorer';
          const googleAvatar =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          const newProfile: UserProfile = {
            id: user.id,
            email: user.email || null,
            phone: null,
            full_name: googleName,
            avatar_url: googleAvatar,
            daily_calories: 2100,
            protein_g: 130,
            carbs_g: 220,
            fat_g: 65,
          };

          if (!profileErr) {
            await supabase.from('profiles').upsert(newProfile);
          }
          userProfile = newProfile;
        }
      } catch (profileErr) {
        console.warn('[AuthStore] Google profile fetch warning:', profileErr);
      }

      if (userProfile) {
        useProfileStore.getState().setUserName(userProfile.full_name || 'NutriExplorer');
        useProfileStore.getState().setGoals({
          dailyCalories: userProfile.daily_calories,
          targetProtein: userProfile.protein_g,
          targetCarbs: userProfile.carbs_g,
          targetFat: userProfile.fat_g,
        });
      }

      set({
        user,
        session,
        profile: userProfile || {
          id: user.id,
          email: user.email || null,
          phone: null,
          full_name: user.user_metadata?.full_name || 'NutriExplorer',
          avatar_url: user.user_metadata?.avatar_url || null,
          daily_calories: 2100,
          protein_g: 130,
          carbs_g: 220,
          fat_g: 65,
        },
        isAuthenticated: true,
        isLoading: false,
        authError: null,
      });

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Google authentication error';
      set({ isLoading: false, authError: msg });
      return { success: false, error: msg };
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      if (ENV.HAS_SUPABASE) {
        await supabase.auth.signOut();
      }
      set({
        user: null,
        session: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        authError: null,
      });
    } catch (err) {
      console.warn('[AuthStore] Error during sign out:', err);
      set({
        user: null,
        session: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateProfile: async (updates) => {
    const current = get().profile;
    if (!current) return { success: false, error: 'No active user profile' };

    const updatedProfile: UserProfile = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    set({ profile: updatedProfile });

    if (updatedProfile.full_name) {
      useProfileStore.getState().setUserName(updatedProfile.full_name);
    }
    if (updatedProfile.avatar_url !== undefined) {
      useProfileStore.getState().setAvatarUrl(updatedProfile.avatar_url);
    }
    useProfileStore.getState().setGoals({
      dailyCalories: updatedProfile.daily_calories,
      targetProtein: updatedProfile.protein_g,
      targetCarbs: updatedProfile.carbs_g,
      targetFat: updatedProfile.fat_g,
    });
    if (updatedProfile.gender || updatedProfile.height_cm || updatedProfile.weight_kg || updatedProfile.birth_date) {
      useProfileStore.getState().setPersonalMetrics({
        ...(updatedProfile.gender ? { gender: updatedProfile.gender } : {}),
        ...(updatedProfile.height_cm ? { heightCm: updatedProfile.height_cm } : {}),
        ...(updatedProfile.weight_kg ? { weightKg: updatedProfile.weight_kg } : {}),
        ...(updatedProfile.birth_date ? { birthDate: updatedProfile.birth_date } : {}),
      });
    }

    if (!ENV.HAS_SUPABASE || current.id === 'guest-user') {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(updatedProfile);

      if (error) {
        // If remote database lacks personal metric columns, fallback to upserting standard profile columns
        const isMissingColumn =
          error.message?.includes('schema cache') ||
          error.message?.includes('column of \'profiles\'') ||
          error.message?.includes('column');

        if (isMissingColumn) {
          const baseProfile = {
            id: updatedProfile.id,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
            full_name: updatedProfile.full_name,
            avatar_url: updatedProfile.avatar_url,
            daily_calories: updatedProfile.daily_calories,
            protein_g: updatedProfile.protein_g,
            carbs_g: updatedProfile.carbs_g,
            fat_g: updatedProfile.fat_g,
            updated_at: updatedProfile.updated_at,
          };

          const { error: fallbackErr } = await supabase
            .from('profiles')
            .upsert(baseProfile);

          if (!fallbackErr) {
            // Succeeded with base profile; personal metrics remain securely stored in SQLite & Zustand
            return { success: true };
          }
        }

        console.warn('[AuthStore] Remote profile sync warning:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update remote profile' };
    }
  },

  uploadAvatar: async (localUri) => {
    const current = get().profile;
    const userId = current?.id || 'guest-user';
    const uploadedUrl = await uploadAvatarToStorage(userId, localUri);

    await get().updateProfile({ avatar_url: uploadedUrl });
    return uploadedUrl;
  },

  signInAsGuest: () => {
    set({
      user: null,
      session: null,
      profile: DEFAULT_PROFILE,
      isAuthenticated: true,
      isLoading: false,
      authError: null,
    });
    useProfileStore.getState().setUserName(DEFAULT_PROFILE.full_name || 'NutriExplorer Alex');
    useProfileStore.getState().setGoals({
      dailyCalories: DEFAULT_PROFILE.daily_calories,
      targetProtein: DEFAULT_PROFILE.protein_g,
      targetCarbs: DEFAULT_PROFILE.carbs_g,
      targetFat: DEFAULT_PROFILE.fat_g,
    });
  },
}));
