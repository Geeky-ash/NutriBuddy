import { useMascotStore } from '../../src/store/useMascotStore';
import {
  MASCOT_SKINS,
  MASCOT_ACCESSORIES,
  MascotSkinId,
  MascotAccessoryId,
} from '../../src/types/mascot';
import { env } from '../../src/config/env';

describe('Mascot Customization Engine & Wardrobe Store', () => {
  beforeEach(() => {
    // Reset store state
    useMascotStore.setState({
      mood: 'IDLE',
      activeSkin: 'classic_panda',
      activeAccessory: 'none',
      speechText: 'Hello! I am Bao, your nutrition companion.',
      isSpeechVisible: false,
    });
  });

  test('should initialize with default classic panda skin and no accessories', () => {
    const state = useMascotStore.getState();
    expect(state.activeSkin).toBe('classic_panda');
    expect(state.activeAccessory).toBe('none');
  });

  test('should equip different fur skins and update store state', () => {
    const { setSkin } = useMascotStore.getState();

    setSkin('golden_panda');
    expect(useMascotStore.getState().activeSkin).toBe('golden_panda');

    setSkin('snow_leopard');
    expect(useMascotStore.getState().activeSkin).toBe('snow_leopard');

    setSkin('zen_capybara');
    expect(useMascotStore.getState().activeSkin).toBe('zen_capybara');
  });

  test('should equip accessories and update store state', () => {
    const { setAccessory } = useMascotStore.getState();

    setAccessory('chef_hat');
    expect(useMascotStore.getState().activeAccessory).toBe('chef_hat');

    setAccessory('sprout_leaf');
    expect(useMascotStore.getState().activeAccessory).toBe('sprout_leaf');

    setAccessory('monocle');
    expect(useMascotStore.getState().activeAccessory).toBe('monocle');

    setAccessory('none');
    expect(useMascotStore.getState().activeAccessory).toBe('none');
  });

  test('MASCOT_SKINS registry contains valid palette definitions for all skins', () => {
    const skinIds: MascotSkinId[] = [
      'classic_panda',
      'golden_panda',
      'snow_leopard',
      'zen_capybara',
    ];

    skinIds.forEach((id) => {
      const skin = MASCOT_SKINS[id];
      expect(skin).toBeDefined();
      expect(skin.name).toBeTruthy();
      expect(skin.coatColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(skin.earColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(skin.snoutColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(skin.badgeAccent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  test('MASCOT_ACCESSORIES registry contains 5 unique accessories with emojis', () => {
    expect(MASCOT_ACCESSORIES.length).toBe(5);

    const accessoryIds: MascotAccessoryId[] = [
      'none',
      'chef_hat',
      'sprout_leaf',
      'sweatband',
      'monocle',
    ];

    accessoryIds.forEach((id) => {
      const acc = MASCOT_ACCESSORIES.find((a) => a.id === id);
      expect(acc).toBeDefined();
      expect(acc?.emoji).toBeTruthy();
      expect(acc?.description).toBeTruthy();
    });
  });

  test('should announce 3D and 2D engine switch messages via speech state', () => {
    const { setSpeech } = useMascotStore.getState();

    setSpeech('3D Engine Enabled', 3500);
    expect(useMascotStore.getState().speechText).toBe('3D Engine Enabled');
    expect(useMascotStore.getState().isSpeechVisible).toBe(true);

    setSpeech('2D Vector Mode Active', 3500);
    expect(useMascotStore.getState().speechText).toBe('2D Vector Mode Active');
    expect(useMascotStore.getState().isSpeechVisible).toBe(true);
  });
});

describe('Environment Configuration & Secrets', () => {
  test('env config exports valid AI provider', () => {
    expect(['gemini', 'openai']).toContain(env.AI_PROVIDER);
  });

  test('env config defines helper boolean flags', () => {
    expect(typeof env.IS_GEMINI_CONFIGURED).toBe('boolean');
    expect(typeof env.IS_OPENAI_CONFIGURED).toBe('boolean');
    expect(typeof env.IS_AI_AVAILABLE).toBe('boolean');
  });
});
