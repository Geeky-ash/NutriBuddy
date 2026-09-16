import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  MascotMood,
  MascotSkinId,
  MascotAccessoryId,
  MASCOT_SKINS,
} from '../../types/mascot';
import { Mascot3DErrorBoundary } from './Mascot3DErrorBoundary';

export { Mascot3DErrorBoundary };

// Global JSX intrinsics declaration for Three.js in React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      sphereGeometry: any;
      boxGeometry: any;
      cylinderGeometry: any;
      torusGeometry: any;
      capsuleGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
    }
  }
}

// Safely require @react-three/fiber/native with web fallback
let NativeCanvas: any = null;
let nativeUseFrame: any = null;

try {
  const r3fNative = require('@react-three/fiber/native');
  NativeCanvas = r3fNative.Canvas;
  nativeUseFrame = r3fNative.useFrame;
} catch {
  try {
    const r3fWeb = require('@react-three/fiber');
    NativeCanvas = r3fWeb.Canvas;
    nativeUseFrame = r3fWeb.useFrame;
  } catch {
    NativeCanvas = null;
    nativeUseFrame = null;
  }
}

interface Mascot3DCanvasProps {
  mood: MascotMood;
  skinId?: MascotSkinId;
  skin?: MascotSkinId;
  accessoryId?: MascotAccessoryId;
  accessory?: MascotAccessoryId;
  equippedSkin?: MascotSkinId;
  equippedAccessory?: MascotAccessoryId;
  size?: number;
  width?: number | string;
  height?: number | string;
  onError?: (error?: any) => void;
  fallback?: React.ReactNode;
}

/**
 * Procedural Full-Body 3D Mascot ("Bao the Red Panda")
 * Renders in 60 FPS WebGL via React Three Fiber Native with:
 * - Full anatomical Red Panda body: Head, Ears, Cheek Tufts, Torso, Belly, Arms, Legs, Paws, and Ringed Tail
 * - Dynamic PBR Fur coat and specular materials
 * - Realistic studio lighting: Key light [5, 5, 5], Ambient fill 0.7, Warm point light, and Rim highlight
 * - Mood-driven skeletal animations (HAPPY bounce & cheering, CAUTIOUS inquisitive head-tilt, SAD droop & shiver, IDLE organic breathing)
 * - Procedural 3D Wardrobe accessories attached directly to Bao's head mesh
 */
function Bao3DModel({
  mood,
  skinId = 'classic_panda',
  accessoryId = 'none',
  useFrame,
}: {
  mood: MascotMood;
  skinId?: MascotSkinId;
  accessoryId?: MascotAccessoryId;
  useFrame?: any;
}) {
  const groupRef = useRef<any>(null);
  const headRef = useRef<any>(null);
  const torsoRef = useRef<any>(null);
  const leftArmRef = useRef<any>(null);
  const rightArmRef = useRef<any>(null);
  const tailRef = useRef<any>(null);

  const skin = MASCOT_SKINS[skinId] || MASCOT_SKINS.classic_panda;

  // Real-time skeletal and mood animation loop
  if (useFrame) {
    useFrame((state: any) => {
      const t = state.clock.getElapsedTime();
      if (!groupRef.current) return;

      if (mood === 'HAPPY') {
        // Celebratory bounce, joyful bobbing & playful swivel
        groupRef.current.position.y = -0.2 + Math.sin(t * 7) * 0.12;
        groupRef.current.rotation.y = Math.sin(t * 3.5) * 0.25;
        groupRef.current.rotation.z = Math.sin(t * 5) * 0.08;

        if (headRef.current) {
          headRef.current.rotation.z = Math.sin(t * 6) * 0.08;
          headRef.current.rotation.x = -0.05 + Math.sin(t * 7) * 0.04;
        }

        // Cheerful arm pumping / cheering
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 0.35 + Math.sin(t * 7) * 0.2;
          leftArmRef.current.rotation.x = -0.2 + Math.sin(t * 7) * 0.15;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -0.35 - Math.sin(t * 7) * 0.2;
          rightArmRef.current.rotation.x = -0.2 + Math.sin(t * 7) * 0.15;
        }

        // Excited tail wagging
        if (tailRef.current) {
          tailRef.current.rotation.y = Math.sin(t * 8) * 0.45;
          tailRef.current.rotation.z = Math.cos(t * 8) * 0.15;
        }
      } else if (mood === 'CAUTIOUS') {
        // Inquisitive head-tilt, observant slow breathing
        groupRef.current.position.y = -0.2 + Math.sin(t * 2.2) * 0.025;
        groupRef.current.rotation.y = Math.sin(t * 1.5) * 0.12;
        groupRef.current.rotation.z = 0.04;

        if (headRef.current) {
          headRef.current.rotation.z = 0.18 + Math.sin(t * 1.8) * 0.05;
          headRef.current.rotation.y = Math.sin(t * 1.2) * 0.12;
          headRef.current.rotation.x = 0.06;
        }

        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 0.1;
          leftArmRef.current.rotation.x = 0.1;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -0.1;
          rightArmRef.current.rotation.x = 0.1;
        }

        // Subtle inquisitive tail twitch
        if (tailRef.current) {
          tailRef.current.rotation.y = Math.sin(t * 2.5) * 0.16;
          tailRef.current.rotation.z = Math.cos(t * 2.5) * 0.06;
        }
      } else if (mood === 'SAD') {
        // Protective shiver, drooping posture & worried micro-tremble
        groupRef.current.position.y = -0.26 + Math.sin(t * 1.5) * 0.015;
        groupRef.current.rotation.x = 0.14;
        groupRef.current.rotation.z = Math.sin(t * 14) * 0.025;
        groupRef.current.rotation.y = Math.sin(t * 2) * 0.04;

        if (headRef.current) {
          headRef.current.rotation.x = 0.18;
          headRef.current.rotation.z = Math.sin(t * 14) * 0.02;
        }

        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 0.05;
          leftArmRef.current.rotation.x = 0.25;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -0.05;
          rightArmRef.current.rotation.x = 0.25;
        }

        // Drooping tail
        if (tailRef.current) {
          tailRef.current.rotation.x = -0.28;
          tailRef.current.rotation.y = Math.sin(t * 2) * 0.08;
        }
      } else {
        // IDLE: Organic breathing loop & gentle curious gaze
        groupRef.current.position.y = -0.2 + Math.sin(t * 2.0) * 0.035;
        groupRef.current.rotation.y = Math.sin(t * 1.2) * 0.08;
        groupRef.current.rotation.z = Math.sin(t * 1.0) * 0.015;
        groupRef.current.rotation.x = Math.sin(t * 2.0) * 0.015;

        if (headRef.current) {
          headRef.current.position.y = 0.65 + Math.sin(t * 2.0) * 0.012;
          headRef.current.rotation.z = Math.sin(t * 1.0) * 0.02;
          headRef.current.rotation.y = Math.sin(t * 1.4) * 0.06;
        }

        if (torsoRef.current) {
          torsoRef.current.scale.y = 1.15 + Math.sin(t * 2.0) * 0.02;
        }

        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 0.12 + Math.sin(t * 2.0) * 0.03;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -0.12 - Math.sin(t * 2.0) * 0.03;
        }

        // Luxurious natural sine wave tail swing
        if (tailRef.current) {
          tailRef.current.rotation.y =
            Math.sin(t * 2.4) * 0.3 + Math.sin(t * 1.2) * 0.12;
          tailRef.current.rotation.z = Math.cos(t * 2.4) * 0.08;
        }
      }
    });
  }

  return (
    <group ref={groupRef} scale={[1.35, 1.35, 1.35]} position={[0, -0.2, 0]}>
      {/* ======================================================== */}
      {/* 1. ANATOMICAL RED PANDA HEAD & EXPRESSIVE FACIAL FEATURES */}
      {/* ======================================================== */}
      <group ref={headRef} position={[0, 0.65, 0]}>
        {/* Head Main Sphere (PBR Fur Shader) */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshStandardMaterial
            color={skin.coatColor}
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>

        {/* Fluffy Red Panda Cheek Fur Tufts */}
        <mesh position={[-0.32, -0.06, 0.12]} rotation={[0, 0, 0.35]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color={skin.coatColor} roughness={0.7} />
        </mesh>
        <mesh position={[0.32, -0.06, 0.12]} rotation={[0, 0, -0.35]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color={skin.coatColor} roughness={0.7} />
        </mesh>

        {/* White Cheek Highlight Patches */}
        <mesh position={[-0.23, -0.06, 0.25]}>
          <sphereGeometry args={[0.085, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
        </mesh>
        <mesh position={[0.23, -0.06, 0.25]}>
          <sphereGeometry args={[0.085, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
        </mesh>

        {/* Rounded Snout / Muzzle */}
        <mesh position={[0, -0.08, 0.3]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={skin.snoutColor} roughness={0.7} />
        </mesh>

        {/* Button Nose with subtle specular shine */}
        <mesh position={[0, -0.04, 0.44]}>
          <sphereGeometry args={[0.042, 12, 12]} />
          <meshStandardMaterial color="#1E293B" roughness={0.25} metalness={0.15} />
        </mesh>

        {/* Glossy Cornea Eyes */}
        <mesh position={[-0.14, 0.05, 0.32]}>
          <sphereGeometry args={[0.044, 16, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.12} />
        </mesh>
        <mesh position={[0.14, 0.05, 0.32]}>
          <sphereGeometry args={[0.044, 16, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.12} />
        </mesh>

        {/* Eye Catchlight Specular Dots (Sparkling Life) */}
        <mesh position={[-0.13, 0.065, 0.355]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.15, 0.065, 0.355]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* Left Ear Outer & Inner */}
        <mesh position={[-0.28, 0.32, 0]} rotation={[0, 0, 0.35]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={skin.earColor} roughness={0.7} />
        </mesh>
        <mesh position={[-0.27, 0.31, 0.05]} rotation={[0, 0, 0.35]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={skin.innerEarColor} roughness={0.8} />
        </mesh>

        {/* Right Ear Outer & Inner */}
        <mesh position={[0.28, 0.32, 0]} rotation={[0, 0, -0.35]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={skin.earColor} roughness={0.7} />
        </mesh>
        <mesh position={[0.27, 0.31, 0.05]} rotation={[0, 0, -0.35]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={skin.innerEarColor} roughness={0.8} />
        </mesh>

        {/* White Eyebrow Fur Tufts */}
        <mesh position={[-0.12, 0.16, 0.31]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.08, 0.026, 0.015]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </mesh>
        <mesh position={[0.12, 0.16, 0.31]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.08, 0.026, 0.015]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </mesh>

        {/* ======================================================== */}
        {/* PROCEDURAL 3D ACCESSORIES ATTACHED DIRECTLY TO HEAD MESH */}
        {/* ======================================================== */}
        {/* 1. Master Chef Toque */}
        {accessoryId === 'chef_hat' && (
          <group position={[0, 0.38, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.2, 0.12, 24]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.11, 0]}>
              <sphereGeometry args={[0.24, 20, 20]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.205, 0.205, 0.03, 24]} />
              <meshStandardMaterial color="#F43F5E" roughness={0.4} />
            </mesh>
          </group>
        )}

        {/* 2. Living Sprout Leaf */}
        {accessoryId === 'sprout_leaf' && (
          <group position={[0, 0.36, 0]}>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.016, 0.02, 0.12, 12]} />
              <meshStandardMaterial color="#10B981" roughness={0.35} />
            </mesh>
            <mesh position={[-0.08, 0.14, 0]} rotation={[0, 0, 0.5]}>
              <sphereGeometry args={[0.065, 14, 14]} />
              <meshStandardMaterial color="#10B981" roughness={0.25} />
            </mesh>
            <mesh position={[0.08, 0.12, 0]} rotation={[0, 0, -0.5]}>
              <sphereGeometry args={[0.06, 14, 14]} />
              <meshStandardMaterial color="#34D399" roughness={0.25} />
            </mesh>
          </group>
        )}

        {/* 3. Athletic Sweatband */}
        {accessoryId === 'sweatband' && (
          <group position={[0, 0.14, 0]}>
            <mesh rotation={[0.2, 0, 0]}>
              <torusGeometry args={[0.375, 0.036, 16, 32]} />
              <meshStandardMaterial color="#3B82F6" roughness={0.5} />
            </mesh>
            <mesh rotation={[0.2, 0, 0]}>
              <torusGeometry args={[0.377, 0.012, 14, 32]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
            </mesh>
          </group>
        )}

        {/* 4. Detective Monocle */}
        {accessoryId === 'monocle' && (
          <group position={[-0.14, 0.05, 0.34]}>
            <mesh>
              <torusGeometry args={[0.06, 0.01, 14, 24]} />
              <meshStandardMaterial
                color="#F59E0B"
                metalness={0.88}
                roughness={0.16}
              />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.004, 18]} />
              <meshStandardMaterial
                color="#E0F2FE"
                roughness={0.05}
                opacity={0.45}
                transparent={true}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* ======================================================== */}
      {/* 2. CHUBBY TORSO & CREAM BELLY PATCH                      */}
      {/* ======================================================== */}
      <group position={[0, 0.15, 0]}>
        {/* Chubby Torso */}
        <mesh ref={torsoRef} position={[0, 0, 0]} scale={[1.0, 1.15, 0.88]}>
          <sphereGeometry args={[0.34, 22, 22]} />
          <meshStandardMaterial
            color={skin.coatColor}
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>

        {/* Wholesome Cream Belly Patch */}
        <mesh position={[0, -0.02, 0.16]} scale={[0.82, 0.95, 0.5]}>
          <sphereGeometry args={[0.26, 18, 18]} />
          <meshStandardMaterial
            color={skin.snoutColor}
            roughness={0.8}
          />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 3. ARMS & FRONT PAWS                                     */}
      {/* ======================================================== */}
      {/* Left Arm */}
      <group
        ref={leftArmRef}
        position={[-0.3, 0.22, 0.08]}
        rotation={[0.15, 0, 0.15]}
      >
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.22, 14]} />
          <meshStandardMaterial color={skin.coatColor} roughness={0.7} />
        </mesh>
        {/* Dark Paws */}
        <mesh position={[0, -0.22, 0]}>
          <sphereGeometry args={[0.078, 12, 12]} />
          <meshStandardMaterial color={skin.earColor} roughness={0.75} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group
        ref={rightArmRef}
        position={[0.3, 0.22, 0.08]}
        rotation={[0.15, 0, -0.15]}
      >
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.22, 14]} />
          <meshStandardMaterial color={skin.coatColor} roughness={0.7} />
        </mesh>
        {/* Dark Paws */}
        <mesh position={[0, -0.22, 0]}>
          <sphereGeometry args={[0.078, 12, 12]} />
          <meshStandardMaterial color={skin.earColor} roughness={0.75} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 4. LEGS & STANDING FEET                                   */}
      {/* ======================================================== */}
      {/* Left Leg */}
      <group position={[-0.16, -0.18, 0]}>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.08, 0.095, 0.2, 14]} />
          <meshStandardMaterial color={skin.earColor} roughness={0.75} />
        </mesh>
        {/* Foot Paw */}
        <mesh position={[0, -0.18, 0.05]} scale={[1, 0.65, 1.3]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color={skin.earColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.16, -0.18, 0]}>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.08, 0.095, 0.2, 14]} />
          <meshStandardMaterial color={skin.earColor} roughness={0.75} />
        </mesh>
        {/* Foot Paw */}
        <mesh position={[0, -0.18, 0.05]} scale={[1, 0.65, 1.3]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color={skin.earColor} roughness={0.8} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 5. BAO'S SIGNATURE RINGED BUSHY PANDA TAIL               */}
      {/* ======================================================== */}
      <group ref={tailRef} position={[0, -0.06, -0.18]}>
        {/* Ring 1 (Base - Coat Color) */}
        <mesh position={[0, 0.02, -0.06]}>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshStandardMaterial color={skin.coatColor} roughness={0.7} />
        </mesh>

        {/* Ring 2 (Cream Ring) */}
        <mesh position={[0.06, 0.12, -0.14]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.75} />
        </mesh>

        {/* Ring 3 (Coat Color) */}
        <mesh position={[0.14, 0.24, -0.22]}>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshStandardMaterial color={skin.coatColor} roughness={0.7} />
        </mesh>

        {/* Ring 4 (Cream Ring) */}
        <mesh position={[0.22, 0.38, -0.28]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.75} />
        </mesh>

        {/* Ring 5 (Dark Fluffy Tip) */}
        <mesh position={[0.28, 0.52, -0.32]}>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshStandardMaterial color={skin.earColor} roughness={0.75} />
        </mesh>
      </group>
    </group>
  );
}

export const Mascot3DCanvas: React.FC<Mascot3DCanvasProps> = ({
  mood,
  skinId,
  skin,
  accessoryId,
  accessory,
  equippedSkin,
  equippedAccessory,
  size = 78,
  width,
  height,
  onError,
  fallback = null,
}) => {
  const resolvedSkin = equippedSkin || skin || skinId || 'classic_panda';
  const resolvedAccessory =
    equippedAccessory || accessory || accessoryId || 'none';

  const containerWidth = width ?? size;
  const containerHeight = height ?? Math.round(size * 1.18);

  if (!NativeCanvas) {
    if (onError) onError(new Error('Native WebGL Canvas not available'));
    return <>{fallback}</>;
  }

  return (
    <Mascot3DErrorBoundary onError={onError} fallback={fallback}>
      <View
        style={[
          styles.canvasContainer,
          { width: containerWidth as any, height: containerHeight as any },
        ]}
        collapsable={false}
      >
        <View style={styles.fixedAspectFrame} collapsable={false}>
          <NativeCanvas
            style={styles.canvasSurface}
            camera={{ position: [0, 0.5, 4.2], fov: 45 }}
            gl={{
              alpha: true,
              antialias: true,
              preserveDrawingBuffer: true,
              powerPreference: 'high-performance',
            }}
            onCreated={(state: any) => {
              try {
                const w = state?.size?.width;
                const h = state?.size?.height;
                if (
                  state?.gl &&
                  typeof w === 'number' &&
                  typeof h === 'number' &&
                  w > 0 &&
                  h > 0
                ) {
                  if (typeof state.gl.setViewport === 'function') {
                    state.gl.setViewport(0, 0, w, h);
                  }
                }
              } catch (err) {
                console.warn('[Mascot3DCanvas] onCreated adjustment ignored:', err);
              }
            }}
            onError={(err: any) => {
              console.warn('[Mascot3DCanvas] WebGL context error caught:', err);
              if (onError) onError(err);
            }}
          >
            {/* Full Studio 3D Lighting Setup */}
            {/* 1. Ambient Fill (0.7 intensity) */}
            <ambientLight intensity={0.7} color="#FFFFFF" />

            {/* 2. Direct Key Light [5, 5, 5] */}
            <directionalLight
              position={[5, 5, 5]}
              intensity={1.4}
              color="#FFFBF0"
            />

            {/* 3. Warm Point Light to Highlight Fur Textures */}
            <pointLight
              position={[0, 1.2, 2.2]}
              intensity={0.6}
              color="#FDE68A"
            />

            {/* 4. Cool Rim Highlight for Character Separation */}
            <directionalLight
              position={[-3, 2, -3]}
              intensity={0.6}
              color="#BAE6FD"
            />

            {/* Full-Body 3D Animated Character */}
            <Bao3DModel
              key={`bao-${resolvedSkin}-${resolvedAccessory}`}
              mood={mood}
              skinId={resolvedSkin}
              accessoryId={resolvedAccessory}
              useFrame={nativeUseFrame}
            />
          </NativeCanvas>
        </View>
      </View>
    </Mascot3DErrorBoundary>
  );
};

const styles = StyleSheet.create({
  canvasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  fixedAspectFrame: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  canvasSurface: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});

export default Mascot3DCanvas;
