export type MascotMood = 'HAPPY' | 'CAUTIOUS' | 'SAD' | 'IDLE';

export interface MascotDialogue {
  text: string;
  durationMs?: number;
}

export type MascotSkinId =
  | 'classic_panda'
  | 'golden_panda'
  | 'snow_leopard'
  | 'zen_capybara';

export type MascotAccessoryId =
  | 'none'
  | 'chef_hat'
  | 'sprout_leaf'
  | 'sweatband'
  | 'monocle';

export interface MascotSkin {
  id: MascotSkinId;
  name: string;
  description: string;
  coatColor: string;
  snoutColor: string;
  earColor: string;
  innerEarColor: string;
  badgeAccent: string;
}

export interface MascotAccessory {
  id: MascotAccessoryId;
  name: string;
  description: string;
  emoji: string;
}

export const MASCOT_SKINS: Record<MascotSkinId, MascotSkin> = {
  classic_panda: {
    id: 'classic_panda',
    name: 'Classic Red Panda',
    description: 'Bao’s signature warm terracotta fur with white brow markings.',
    coatColor: '#E66B40',
    snoutColor: '#FFFFFF',
    earColor: '#C85A32',
    innerEarColor: '#FFF1EB',
    badgeAccent: '#E66B40',
  },
  golden_panda: {
    id: 'golden_panda',
    name: 'Golden Bamboo Panda',
    description: 'Sun-drenched honey gold coat honoring wholesome vitality.',
    coatColor: '#F59E0B',
    snoutColor: '#FFFDF5',
    earColor: '#D97706',
    innerEarColor: '#FEF3C7',
    badgeAccent: '#F59E0B',
  },
  snow_leopard: {
    id: 'snow_leopard',
    name: 'Midnight Snow Leopard',
    description: 'Sleek frosted slate coat with cool alpine accents.',
    coatColor: '#64748B',
    snoutColor: '#F8FAFC',
    earColor: '#475569',
    innerEarColor: '#E2E8F0',
    badgeAccent: '#38BDF8',
  },
  zen_capybara: {
    id: 'zen_capybara',
    name: 'Zen Capybara',
    description: 'Calm, grounded espresso tones for peaceful dietary mindfulness.',
    coatColor: '#8D6E63',
    snoutColor: '#D7CCC8',
    earColor: '#6D4C41',
    innerEarColor: '#EFEBE9',
    badgeAccent: '#10B981',
  },
};

export const MASCOT_ACCESSORIES: MascotAccessory[] = [
  {
    id: 'none',
    name: 'Natural / None',
    description: 'Bao in his pure, unadorned natural fluffiness.',
    emoji: '🌿',
  },
  {
    id: 'chef_hat',
    name: 'Master Chef Toque',
    description: 'Tall culinary hat for evaluating gourmet whole foods.',
    emoji: '👨‍🍳',
  },
  {
    id: 'sprout_leaf',
    name: 'Living Sprout Leaf',
    description: 'A tiny green leaf sprouting from Bao’s head symbolizing freshness.',
    emoji: '🌱',
  },
  {
    id: 'sweatband',
    name: 'Athletic Sweatband',
    description: 'Retro sporty headband ready for high-protein meal preps.',
    emoji: '🏃',
  },
  {
    id: 'monocle',
    name: 'Detective Monocle',
    description: 'Sophisticated golden lens for inspecting fine-print ingredients.',
    emoji: '🧐',
  },
];
