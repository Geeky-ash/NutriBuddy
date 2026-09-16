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
  equippedSkin?: MascotSkinId;
  equippedAccessory?: MascotAccessoryId;
  size?: number;
}

/**
 * Full-Body 2D Vector Red Panda Avatar ("Bao the Buddy")
 * Complete anatomical character with:
 * - Rounded head, ears, brows, expressive eyes, snout & cheeks
 * - Chubby torso with cream belly patch
 * - Arms and dark paws
 * - Standing legs and foot pads
 * - Bushy ringed tail arching behind the body
 * - Unconstrained layout dimensions without circular cropped borders
 */
export const Mascot2DAvatar: React.FC<Mascot2DAvatarProps> = ({
  mood = 'IDLE',
  skinId,
  skin,
  accessoryId,
  accessory,
  equippedSkin,
  equippedAccessory,
  size = 64,
}) => {
  const activeSkinId = equippedSkin || skin || skinId || 'classic_panda';
  const activeAccessoryId =
    equippedAccessory || accessory || accessoryId || 'none';

  const skinData = MASCOT_SKINS[activeSkinId] || MASCOT_SKINS.classic_panda;
  const currentAccessory = MASCOT_ACCESSORIES.find(
    (a) => a.id === activeAccessoryId
  );

  // Dynamic scale based on reference width of 64px
  const scale = size / 64;
  const totalHeight = Math.round(size * 1.25);

  // Head dimensions
  const headWidth = Math.round(44 * scale);
  const headHeight = Math.round(38 * scale);
  const earSize = Math.round(16 * scale);
  const eyeDotSize = Math.round(4.5 * scale);
  const snoutWidth = Math.round(22 * scale);
  const snoutHeight = Math.round(14 * scale);
  const noseWidth = Math.round(6 * scale);
  const noseHeight = Math.round(3.5 * scale);

  // Body dimensions
  const bodyWidth = Math.round(38 * scale);
  const bodyHeight = Math.round(36 * scale);
  const bellyWidth = Math.round(26 * scale);
  const bellyHeight = Math.round(26 * scale);

  // Limbs dimensions
  const armWidth = Math.round(10 * scale);
  const armHeight = Math.round(20 * scale);
  const pawSize = Math.round(10 * scale);
  const legWidth = Math.round(12 * scale);
  const legHeight = Math.round(14 * scale);
  const footWidth = Math.round(16 * scale);
  const footHeight = Math.round(9 * scale);

  // Tail dimensions
  const tailWidth = Math.round(20 * scale);
  const tailHeight = Math.round(38 * scale);

  return (
    <View
      style={[
        styles.fullBodyContainer,
        {
          width: size,
          height: totalHeight,
          minWidth: 48,
          minHeight: 60,
        },
      ]}
    >
      {/* 1. Ground Shadow underneath feet */}
      <View
        style={[
          styles.groundShadow,
          {
            width: Math.round(size * 0.65),
            height: Math.round(7 * scale),
            borderRadius: Math.round(3.5 * scale),
            bottom: 0,
          },
        ]}
      />

      {/* 2. Signature Ringed Bushy Panda Tail (Positioned Behind Body) */}
      <View
        style={[
          styles.tailContainer,
          {
            width: tailWidth,
            height: tailHeight,
            bottom: Math.round(12 * scale),
            right: Math.round(2 * scale),
            borderRadius: Math.round(tailWidth / 2),
            backgroundColor: skinData.coatColor,
          },
        ]}
      >
        {/* Ring 1 (Cream) */}
        <View
          style={[
            styles.tailRing,
            {
              top: Math.round(7 * scale),
              height: Math.round(6 * scale),
              backgroundColor: '#FEF3C7',
            },
          ]}
        />
        {/* Ring 2 (Coat) */}
        <View
          style={[
            styles.tailRing,
            {
              top: Math.round(15 * scale),
              height: Math.round(6 * scale),
              backgroundColor: skinData.coatColor,
            },
          ]}
        />
        {/* Ring 3 (Cream) */}
        <View
          style={[
            styles.tailRing,
            {
              top: Math.round(23 * scale),
              height: Math.round(6 * scale),
              backgroundColor: '#FEF3C7',
            },
          ]}
        />
        {/* Tail Tip (Dark Ear Fur) */}
        <View
          style={[
            styles.tailRing,
            {
              bottom: 0,
              height: Math.round(8 * scale),
              borderBottomLeftRadius: Math.round(tailWidth / 2),
              borderBottomRightRadius: Math.round(tailWidth / 2),
              backgroundColor: skinData.earColor,
            },
          ]}
        />
      </View>

      {/* 3. Lower Legs & Feet */}
      <View
        style={[
          styles.legsRow,
          {
            bottom: Math.round(4 * scale),
            width: Math.round(bodyWidth * 0.9),
          },
        ]}
      >
        {/* Left Foot */}
        <View
          style={[
            styles.foot,
            {
              width: footWidth,
              height: footHeight,
              borderRadius: Math.round(footHeight / 2),
              backgroundColor: skinData.earColor,
            },
          ]}
        />
        {/* Right Foot */}
        <View
          style={[
            styles.foot,
            {
              width: footWidth,
              height: footHeight,
              borderRadius: Math.round(footHeight / 2),
              backgroundColor: skinData.earColor,
            },
          ]}
        />
      </View>

      {/* 4. Chubby Torso & Cream Belly Patch */}
      <View
        style={[
          styles.torso,
          {
            width: bodyWidth,
            height: bodyHeight,
            borderRadius: Math.round(bodyWidth * 0.45),
            backgroundColor: skinData.coatColor,
            bottom: Math.round(10 * scale),
          },
        ]}
      >
        {/* Cream Belly Patch */}
        <View
          style={[
            styles.belly,
            {
              width: bellyWidth,
              height: bellyHeight,
              borderRadius: Math.round(bellyWidth * 0.45),
              backgroundColor: skinData.snoutColor,
              bottom: Math.round(2 * scale),
            },
          ]}
        />
      </View>

      {/* 5. Left & Right Front Paws / Arms */}
      <View
        style={[
          styles.armsRow,
          {
            bottom: Math.round(18 * scale),
            width: Math.round(bodyWidth + 12 * scale),
          },
        ]}
      >
        {/* Left Arm */}
        <View
          style={[
            styles.arm,
            {
              width: armWidth,
              height: armHeight,
              borderRadius: Math.round(armWidth / 2),
              backgroundColor: skinData.coatColor,
              transform: [{ rotate: '18deg' }],
            },
          ]}
        >
          <View
            style={[
              styles.paw,
              {
                width: pawSize,
                height: pawSize,
                borderRadius: pawSize / 2,
                backgroundColor: skinData.earColor,
              },
            ]}
          />
        </View>

        {/* Right Arm */}
        <View
          style={[
            styles.arm,
            {
              width: armWidth,
              height: armHeight,
              borderRadius: Math.round(armWidth / 2),
              backgroundColor: skinData.coatColor,
              transform: [{ rotate: '-18deg' }],
            },
          ]}
        >
          <View
            style={[
              styles.paw,
              {
                width: pawSize,
                height: pawSize,
                borderRadius: pawSize / 2,
                backgroundColor: skinData.earColor,
              },
            ]}
          />
        </View>
      </View>

      {/* 6. Anatomical Head, Ears & Expressions */}
      <View
        style={[
          styles.headContainer,
          {
            width: headWidth,
            height: headHeight,
            top: Math.round(8 * scale),
          },
        ]}
      >
        {/* 2D Accessory Badge if active */}
        {activeAccessoryId !== 'none' && currentAccessory && (
          <View
            style={[
              styles.accessoryTopBadge,
              { top: -Math.round(14 * scale) },
            ]}
          >
            <Text style={{ fontSize: Math.round(18 * scale) }}>
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
              left: -Math.round(4 * scale),
              top: -Math.round(4 * scale),
            },
          ]}
        >
          <View
            style={[
              styles.innerEar,
              {
                width: Math.round(earSize * 0.52),
                height: Math.round(earSize * 0.52),
                borderRadius: Math.round(earSize * 0.52) / 2,
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
              right: -Math.round(4 * scale),
              top: -Math.round(4 * scale),
            },
          ]}
        >
          <View
            style={[
              styles.innerEar,
              {
                width: Math.round(earSize * 0.52),
                height: Math.round(earSize * 0.52),
                borderRadius: Math.round(earSize * 0.52) / 2,
                backgroundColor: skinData.innerEarColor,
              },
            ]}
          />
        </View>

        {/* Head Main Shape */}
        <View
          style={[
            styles.headMesh,
            {
              width: headWidth,
              height: headHeight,
              borderRadius: Math.round(headHeight / 2),
              backgroundColor: skinData.coatColor,
            },
          ]}
        >
          {/* White Brow Markings */}
          <View
            style={[
              styles.eyebrowRow,
              { width: Math.round(28 * scale), marginTop: Math.round(3 * scale) },
            ]}
          >
            <View
              style={[
                styles.eyebrow,
                {
                  width: Math.round(7 * scale),
                  height: Math.round(2.5 * scale),
                  borderRadius: Math.round(1.2 * scale),
                },
              ]}
            />
            <View
              style={[
                styles.eyebrow,
                {
                  width: Math.round(7 * scale),
                  height: Math.round(2.5 * scale),
                  borderRadius: Math.round(1.2 * scale),
                },
              ]}
            />
          </View>

          {/* Eyes Expression */}
          <View
            style={[
              styles.eyeRow,
              { width: Math.round(24 * scale), marginTop: Math.round(2 * scale) },
            ]}
          >
            {mood === 'HAPPY' ? (
              <>
                <Text style={[styles.eyeSmile, { fontSize: Math.round(12 * scale) }]}>
                  ^
                </Text>
                <Text style={[styles.eyeSmile, { fontSize: Math.round(12 * scale) }]}>
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
                <Text style={[styles.eyeSad, { fontSize: Math.round(11 * scale) }]}>
                  v
                </Text>
                <Text style={[styles.eyeSad, { fontSize: Math.round(11 * scale) }]}>
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
                    width: Math.round(7 * scale),
                    height: Math.round(3.5 * scale),
                    borderBottomWidth: Math.round(1.5 * scale),
                  },
                ]}
              />
            ) : mood === 'SAD' ? (
              <View
                style={[
                  styles.mouthPout,
                  {
                    width: Math.round(6 * scale),
                    height: Math.round(2.5 * scale),
                    borderTopWidth: Math.round(1.5 * scale),
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.mouthNeutral,
                  {
                    width: Math.round(5 * scale),
                    height: Math.round(1.5 * scale),
                  },
                ]}
              />
            )}
          </View>

          {/* Rosy Cheeks */}
          <View
            style={[
              styles.blush,
              {
                width: Math.round(6 * scale),
                height: Math.round(3.5 * scale),
                left: Math.round(4 * scale),
                bottom: Math.round(snoutHeight * 0.5),
              },
            ]}
          />
          <View
            style={[
              styles.blush,
              {
                width: Math.round(6 * scale),
                height: Math.round(3.5 * scale),
                right: Math.round(4 * scale),
                bottom: Math.round(snoutHeight * 0.5),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullBodyContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  groundShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
    alignSelf: 'center',
    zIndex: 0,
  },
  tailContainer: {
    position: 'absolute',
    zIndex: 1,
    overflow: 'hidden',
    transform: [{ rotate: '25deg' }],
  },
  tailRing: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  legsRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
    alignSelf: 'center',
  },
  foot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  torso: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 3,
    alignSelf: 'center',
  },
  belly: {
    alignSelf: 'center',
  },
  armsRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 4,
    alignSelf: 'center',
  },
  arm: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  paw: {
    alignSelf: 'center',
  },
  headContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    alignSelf: 'center',
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
  headMesh: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 3,
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
});

export default Mascot2DAvatar;
