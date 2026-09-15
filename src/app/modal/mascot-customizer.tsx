import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Check, Sparkles, Palette, Crown } from 'lucide-react-native';
import { colors, radii, shadows, typography, spacing } from '../../theme';
import { useMascotStore } from '../../store/useMascotStore';
import {
  MASCOT_SKINS,
  MASCOT_ACCESSORIES,
  MascotSkinId,
  MascotAccessoryId,
} from '../../types/mascot';
import { Mascot3DErrorBoundary } from '../../components/mascot/Mascot3DErrorBoundary';

// Lazy load 3D Canvas on-demand to avoid bundling three.js on initial app start
const LazyMascot3DCanvas = React.lazy(
  () => import('../../components/mascot/Mascot3DCanvas')
);

export default function MascotCustomizerModal() {
  const router = useRouter();
  const mood = useMascotStore((state) => state.mood);
  const activeSkin = useMascotStore((state) => state.activeSkin);
  const activeAccessory = useMascotStore((state) => state.activeAccessory);
  const setSkin = useMascotStore((state) => state.setSkin);
  const setAccessory = useMascotStore((state) => state.setAccessory);

  const [activeTab, setActiveTab] = useState<'skins' | 'accessories'>('skins');
  const [use3DPreview, setUse3DPreview] = useState(false);

  const skinList = Object.values(MASCOT_SKINS);
  const currentSkinData = MASCOT_SKINS[activeSkin] || MASCOT_SKINS.classic_panda;
  const currentAccessoryData = MASCOT_ACCESSORIES.find(
    (a) => a.id === activeAccessory
  );

  const handleSelectSkin = (skinId: MascotSkinId) => {
    Haptics.selectionAsync();
    setSkin(skinId);
  };

  const handleSelectAccessory = (accessoryId: MascotAccessoryId) => {
    Haptics.selectionAsync();
    setAccessory(accessoryId);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Safe 2D Preview renderer
  const render2DPreview = () => (
    <View style={styles.fallbackPreviewContainer}>
      {activeAccessory !== 'none' && currentAccessoryData && (
        <View style={styles.preview2DAccessory}>
          <Text style={styles.preview2DAccessoryEmoji}>
            {currentAccessoryData.emoji}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.preview2DFace,
          { backgroundColor: currentSkinData.coatColor },
        ]}
      >
        <View style={styles.preview2DEyebrowRow}>
          <View style={styles.preview2DEyebrow} />
          <View style={styles.preview2DEyebrow} />
        </View>
        <View style={styles.preview2DEyes}>
          <View style={styles.preview2DEyeDot} />
          <View style={styles.preview2DEyeDot} />
        </View>
        <View
          style={[
            styles.preview2DSnout,
            { backgroundColor: currentSkinData.snoutColor },
          ]}
        >
          <View style={styles.preview2DNose} />
          <View style={styles.preview2DMouth} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <Crown size={20} color={colors.brand.amber} />
              <Text style={styles.title}>Bao’s Wardrobe</Text>
            </View>
            <Text style={styles.subtitle}>
              Personalize your nutrition companion’s look
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Live Stage Showcase */}
        <View style={styles.showcaseCard}>
          <View style={styles.previewCanvasWrapper}>
            {use3DPreview ? (
              <Mascot3DErrorBoundary
                fallback={render2DPreview()}
                onError={() => setUse3DPreview(false)}
              >
                <React.Suspense fallback={render2DPreview()}>
                  <LazyMascot3DCanvas
                    mood={mood}
                    skin={activeSkin}
                    accessory={activeAccessory}
                    size={140}
                    onError={() => setUse3DPreview(false)}
                  />
                </React.Suspense>
              </Mascot3DErrorBoundary>
            ) : (
              render2DPreview()
            )}
          </View>

          <View style={styles.showcaseMeta}>
            <Text style={styles.showcaseMascotName}>
              {currentSkinData.name}
            </Text>
            <Text style={styles.showcaseAccessoryName}>
              Equipped: {currentAccessoryData?.name || 'Natural'}
            </Text>
          </View>
        </View>

        {/* Segmented Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'skins' && styles.tabButtonActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('skins');
            }}
            activeOpacity={0.8}
          >
            <Palette
              size={15}
              color={
                activeTab === 'skins'
                  ? colors.brand.primaryDark
                  : colors.text.muted
              }
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'skins' && styles.tabButtonTextActive,
              ]}
            >
              Fur & Coat ({skinList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'accessories' && styles.tabButtonActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('accessories');
            }}
            activeOpacity={0.8}
          >
            <Sparkles
              size={15}
              color={
                activeTab === 'accessories'
                  ? colors.brand.primaryDark
                  : colors.text.muted
              }
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'accessories' && styles.tabButtonTextActive,
              ]}
            >
              Accessories ({MASCOT_ACCESSORIES.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Options List */}
        <ScrollView
          style={styles.optionsScrollView}
          contentContainerStyle={styles.optionsContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'skins' ? (
            /* Skins List */
            <View style={styles.itemList}>
              {skinList.map((item) => {
                const isSelected = activeSkin === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.card,
                      isSelected && styles.cardSelected,
                    ]}
                    onPress={() => handleSelectSkin(item.id)}
                    activeOpacity={0.8}
                  >
                    {/* Color Swatch Circle */}
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: item.coatColor },
                      ]}
                    >
                      <View
                        style={[
                          styles.innerColorSwatch,
                          { backgroundColor: item.earColor },
                        ]}
                      />
                    </View>

                    <View style={styles.itemDetails}>
                      <View style={styles.itemNameRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Check size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.itemDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Accessories List */
            <View style={styles.itemList}>
              {MASCOT_ACCESSORIES.map((item) => {
                const isSelected = activeAccessory === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.card,
                      isSelected && styles.cardSelected,
                    ]}
                    onPress={() => handleSelectAccessory(item.id)}
                    activeOpacity={0.8}
                  >
                    {/* Emoji Thumbnail */}
                    <View style={styles.emojiThumbnail}>
                      <Text style={styles.emojiText}>{item.emoji}</Text>
                    </View>

                    <View style={styles.itemDetails}>
                      <View style={styles.itemNameRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Check size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.itemDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Done Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleClose}
            activeOpacity={0.85}
          >
            <Text style={styles.doneButtonText}>Looks Perfect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showcaseCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.card,
  },
  previewCanvasWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackPreviewContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  preview2DAccessory: {
    position: 'absolute',
    top: -14,
    zIndex: 10,
  },
  preview2DAccessoryEmoji: {
    fontSize: 24,
  },
  preview2DFace: {
    width: 76,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview2DEyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 36,
    marginBottom: 4,
  },
  preview2DEyebrow: {
    width: 10,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  preview2DEyes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 32,
    marginBottom: 4,
  },
  preview2DEyeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
  },
  preview2DSnout: {
    width: 28,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview2DNose: {
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E293B',
  },
  preview2DMouth: {
    width: 8,
    height: 3,
    borderBottomWidth: 1.5,
    borderColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  showcaseMeta: {
    alignItems: 'center',
    marginTop: 4,
  },
  showcaseMascotName: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.text.primary,
  },
  showcaseAccessoryName: {
    ...typography.caption,
    color: colors.brand.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface.card,
    borderRadius: radii.full,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.full,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.subtle,
  },
  tabButtonText: {
    ...typography.button,
    fontSize: 13,
    color: colors.text.muted,
  },
  tabButtonTextActive: {
    color: colors.brand.primaryDark,
  },
  optionsScrollView: {
    flex: 1,
  },
  optionsContentContainer: {
    paddingBottom: 20,
  },
  itemList: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    gap: spacing.md,
  },
  cardSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.subtle,
  },
  innerColorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  emojiThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  emojiText: {
    fontSize: 22,
  },
  itemDetails: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.text.primary,
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  footer: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  doneButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: radii.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  doneButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontSize: 15,
  },
});
