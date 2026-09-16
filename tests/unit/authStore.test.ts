import { useAuthStore } from '../../src/store/useAuthStore';
import { useProfileStore } from '../../src/store/useProfileStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      authError: null,
    });
  });

  it('starts with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });

  it('signs in as guest and synchronizes with useProfileStore', () => {
    useAuthStore.getState().signInAsGuest();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.profile).not.toBeNull();
    expect(state.profile?.daily_calories).toBe(2100);
    expect(state.profile?.protein_g).toBe(130);

    const profileState = useProfileStore.getState();
    expect(profileState.goals.dailyCalories).toBe(2100);
    expect(profileState.goals.targetProtein).toBe(130);
  });

  it('updates profile and propagates macro goals to useProfileStore', async () => {
    useAuthStore.getState().signInAsGuest();

    const res = await useAuthStore.getState().updateProfile({
      full_name: 'Dr. Jordan Miles',
      daily_calories: 2400,
      protein_g: 160,
      carbs_g: 240,
      fat_g: 75,
    });

    expect(res.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.profile?.full_name).toBe('Dr. Jordan Miles');
    expect(state.profile?.daily_calories).toBe(2400);
    expect(state.profile?.protein_g).toBe(160);

    const profileState = useProfileStore.getState();
    expect(profileState.userName).toBe('Dr. Jordan Miles');
    expect(profileState.goals.dailyCalories).toBe(2400);
    expect(profileState.goals.targetProtein).toBe(160);
    expect(profileState.goals.targetCarbs).toBe(240);
    expect(profileState.goals.targetFat).toBe(75);
  });

  it('signs out and resets authenticated state', async () => {
    useAuthStore.getState().signInAsGuest();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });

  it('clears auth errors properly', () => {
    useAuthStore.setState({ authError: 'Invalid login credentials' });
    expect(useAuthStore.getState().authError).toBe('Invalid login credentials');

    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().authError).toBeNull();
  });

  it('signs in with Google and populates user session', async () => {
    const res = await useAuthStore.getState().signInWithGoogle();
    expect(res.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.profile).not.toBeNull();
    expect(state.profile?.full_name).toBeTruthy();

    const profileState = useProfileStore.getState();
    expect(profileState.userName).toBe(state.profile?.full_name);
  });

  it('exposes compatible exports from src/stores/authStore.ts', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuthStore: aliasedStore } = require('../../src/stores/authStore');
    expect(aliasedStore).toBeDefined();
    expect(typeof aliasedStore.getState).toBe('function');
  });
});
