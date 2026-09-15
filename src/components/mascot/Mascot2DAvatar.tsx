import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  MascotMood,
  MascotSkinId,
  MascotAccessoryId,
  MASCOT_SKINS,
  MASCOT_ACCESSORIES,
} from '../../types/mascot';

interface Mascot2DAvatarProps {
  mood?: MascotMood;
  skinId?: MascotSkinId;
  skin?: MascotSkinId;
  accessoryId?: MascotAccessoryId;
  accessory?: MascotAccessoryId;
  size?: number;
}

export const Mascot2DAvatar: React.FC<Mascot2DAvatarProps> = ({
  mood = 'IDLE',
  skinId,
  skin,
  accessoryId,
  accessory,
  size = 52,
}) => {
  const activeSkinId = skin || skinId || 'classic_panda';
  const activeAccessoryId = accessory || accessoryId || 'none';

  const skinData = MASCOT_SKINS[activeSkinId] || MASCOT_SKINS.classic_panda;
  const currentAccessory = MASCOT_ACCESSORIES.find(
    (a) => a.id === activeAccessoryId
  );

  // Dynamic sizing ratio relative to base size 52
  const scale = size / 52;
  const headSize = Math.round(size * 0.95);
  const earSize = Math.round(18 * scale);
  const eyeDotSize = Math.round(5.5 * scale);
  const snoutWidth = Math.round(28 * scale);
  const snoutHeight = Math.round(18 * scale);
  const noseWidth = Math.round(8 * scale);
  const noseHeight = Math.round(4.5 * scale);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          minWidth: 48,
          minHeight: 48,
        },
      ]}
    >
      {/* 2D Accessory Badge if active */}
      {activeAccessoryId !== 'none' && currentAccessory && (
        <View
          style={[
            styles.accessoryTopBadge,
            { top: -Math.round(12 * scale) },
          ]}
        >
          <Text style={{ fontSize: Math.round(16 * scale) }}>
            {currentAccessory.emoji}
          </Text>
        </View>
      )}

      {/* Left Ear */}
      <View
        style={[
          styles.ear,
          {
            width: earSize,
            height: earSize,
            borderRadius: earSize / 2,
            backgroundColor: skinData.earColor,
            left: Math.round(2 * scale),
            top: 0,
          },
        ]}
      >
        <View
          style={[
            styles.innerEar,
            {
              width: Math.round(earSize * 0.55),
              height: Math.round(earSize * 0.55),
              borderRadius: Math.round(earSize * 0.55) / 2,
              backgroundColor: skinData.innerEarColor,
            },
          ]}
        />
      </View>

      {/* Right Ear */}
      <View
        style={[
          styles.ear,
          {
            width: earSize,
            height: earSize,
            borderRadius: earSize / 2,
            backgroundColor: skinData.earColor,
            right: Math.round(2 * scale),
            top: 0,
          },
        ]}
      >
        <View
          style={[
            styles.innerEar,
            {
              width: Math.round(earSize * 0.55),
              height: Math.round(earSize * 0.55),
              borderRadius: Math.round(earSize * 0.55) / 2,
              backgroundColor: skinData.innerEarColor,
            },
          ]}
        />
      </View>

      {/* Face Mask & Fur Head */}
      <View
        style={[
          styles.faceCircle,
          {
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
            backgroundColor: skinData.coatColor,
          },
        ]}
      >
        {/* White Brow Markings */}
        <View
          style={[
            styles.eyebrowRow,
            { width: Math.round(36 * scale), marginBottom: Math.round(3 * scale) },
          ]}
        >
          <View
            style={[
              styles.eyebrow,
              {
                width: Math.round(9 * scale),
                height: Math.round(3 * scale),
                borderRadius: Math.round(1.5 * scale),
              },
            ]}
          />
          <View
            style={[
              styles.eyebrow,
              {
                width: Math.round(9 * scale),
                height: Math.round(3 * scale),
                borderRadius: Math.round(1.5 * scale),
              },
            ]}
          />
        </View>

        {/* Eyes Expression based on mood */}
        <View
          style={[
            styles.eyeRow,
            { width: Math.round(30 * scale), marginBottom: Math.round(4 * scale) },
          ]}
        >
          {mood === 'HAPPY' ? (
            <>
              <Text style={[styles.eyeSmile, { fontSize: Math.round(14 * scale) }]}>
                ^
              </Text>
              <Text style={[styles.eyeSmile, { fontSize: Math.round(14 * scale) }]}>
                ^
              </Text>
            </>
          ) : mood === 'CAUTIOUS' ? (
            <>
              <View
                style={[
                  styles.eyeDot,
                  {
                    width: eyeDotSize,
                    height: eyeDotSize,
                    borderRadius: eyeDotSize / 2,
                  },
                ]}
              />
              <View
                style={[
                  styles.eyeDot,
                  {
                    width: eyeDotSize,
                    height: Math.round(eyeDotSize * 0.6),
                    borderRadius: eyeDotSize / 2,
                  },
                ]}
              />
            </>
          ) : mood === 'SAD' ? (
            <>
              <Text style={[styles.eyeSad, { fontSize: Math.round(13 * scale) }]}>
                v
              </Text>
              <Text style={[styles.eyeSad, { fontSize: Math.round(13 * scale) }]}>
                v
              </Text>
            </>
          ) : (
            <>
              <View
                style={[
                  styles.eyeDot,
                  {
                    width: eyeDotSize,
                    height: eyeDotSize,
                    borderRadius: eyeDotSize / 2,
                  },
                ]}
              />
              <View
                style={[
                  styles.eyeDot,
                  {
                    width: eyeDotSize,
                    height: eyeDotSize,
                    borderRadius: eyeDotSize / 2,
                  },
                ]}
              />
            </>
          )}
        </View>

        {/* Snout, Nose & Mouth */}
        <View
          style={[
            styles.snout,
            {
              width: snoutWidth,
              height: snoutHeight,
              borderRadius: snoutHeight / 2,
              backgroundColor: skinData.snoutColor,
            },
          ]}
        >
          <View
            style={[
              styles.noseDot,
              {
                width: noseWidth,
                height: noseHeight,
                borderRadius: noseHeight / 2,
              },
            ]}
          />
          {mood === 'HAPPY' ? (
            <View
              style={[
                styles.mouthSmile,
                {
                  width: Math.round(8 * scale),
                  height: Math.round(4 * scale),
                  borderBottomWidth: Math.round(1.5 * scale),
                },
              ]}
            />
          ) : mood === 'SAD' ? (
            <View
              style={[
                styles.mouthPout,
                {
                  width: Math.round(7 * scale),
                  height: Math.round(3 * scale),
                  borderTopWidth: Math.round(1.5 * scale),
                },
              ]}
            />
          ) : (
            <View
              style={[
                styles.mouthNeutral,
                {
                  width: Math.round(6 * scale),
                  height: Math.round(1.5 * scale),
                },
              ]}
            />
          )}
        </View>

        {/* Cheeks blush */}
        <View
          style={[
            styles.blush,
            styles.blushLeft,
            {
              width: Math.round(7 * scale),
              height: Math.round(4 * scale),
              left: Math.round(5 * scale),
              top: Math.round(headSize * 0.45),
            },
          ]}
        />
        <View
          style={[
            styles.blush,
            styles.blushRight,
            {
              width: Math.round(7 * scale),
              height: Math.round(4 * scale),
              right: Math.round(5 * scale),
              top: Math.round(headSize * 0.45),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  accessoryTopBadge: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 15,
  },
  ear: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  innerEar: {
    opacity: 0.9,
  },
  faceCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 3,
    overflow: 'hidden',
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  eyebrow: {
    backgroundColor: '#FFFFFF',
    opacity: 0.95,
  },
  eyeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  eyeDot: {
    backgroundColor: '#0F172A',
  },
  eyeSmile: {
    color: '#0F172A',
    fontWeight: '800',
    lineHeight: 14,
  },
  eyeSad: {
    color: '#0F172A',
    fontWeight: '800',
    lineHeight: 14,
  },
  snout: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
    marginTop: 1,
  },
  noseDot: {
    backgroundColor: '#1E293B',
    marginBottom: 1,
  },
  mouthSmile: {
    borderColor: '#1E293B',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  mouthPout: {
    borderColor: '#1E293B',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  mouthNeutral: {
    backgroundColor: '#1E293B',
  },
  blush: {
    position: 'absolute',
    borderRadius: 3,
    backgroundColor: 'rgba(244, 63, 94, 0.45)',
    zIndex: 4,
  },
  blushLeft: {},
  blushRight: {},
});

export default Mascot2DAvatar;
