import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  MascotMood,
  MascotSkinId,
  MascotAccessoryId,
  MASCOT_SKINS,
} from '../../types/mascot';
import { Mascot3DErrorBoundary } from './Mascot3DErrorBoundary';

export { Mascot3DErrorBoundary };

// Global JSX intrinsics declaration for Three.js without requiring R3F at startup
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
      meshStandardMaterial: any;
    }
  }
}

interface Mascot3DCanvasProps {
  mood: MascotMood;
  skinId?: MascotSkinId;
  skin?: MascotSkinId;
  accessoryId?: MascotAccessoryId;
  accessory?: MascotAccessoryId;
  size?: number;
  onError?: (error?: any) => void;
}

/**
 * 3D Stylized Mascot Model ("Bao")
 * Uses procedural PBR meshes with custom skins, 3D accessories,
 * and mood-driven skeletal animations.
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

  const skin = MASCOT_SKINS[skinId] || MASCOT_SKINS.classic_panda;

  // Animation frame loop using dynamically loaded useFrame
  if (useFrame) {
    useFrame((state: any) => {
      const t = state.clock.getElapsedTime();
      if (!groupRef.current) return;

      if (mood === 'HAPPY') {
        groupRef.current.position.y = Math.sin(t * 7) * 0.12;
        groupRef.current.rotation.z = Math.sin(t * 5) * 0.14;
        groupRef.current.rotation.y = Math.sin(t * 3) * 0.25;
      } else if (mood === 'CAUTIOUS') {
        groupRef.current.position.y = Math.sin(t * 2) * 0.03;
        groupRef.current.rotation.z = 0.18 + Math.sin(t * 2) * 0.05;
        groupRef.current.rotation.y = Math.sin(t * 1.5) * 0.1;
      } else if (mood === 'SAD') {
        groupRef.current.position.y = -0.06 + Math.sin(t * 1.5) * 0.02;
        groupRef.current.rotation.x = 0.22;
        groupRef.current.rotation.z = Math.sin(t * 12) * 0.03;
      } else {
        groupRef.current.position.y = Math.sin(t * 2) * 0.04;
        groupRef.current.rotation.y = Math.sin(t * 1) * 0.08;
        groupRef.current.rotation.z = 0;
      }
    });
  }

  return (
    <group ref={groupRef} scale={[1.35, 1.35, 1.35]} position={[0, -0.1, 0]}>
      {/* Head Sphere */}
      <mesh ref={headRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial
          color={skin.coatColor}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Snout */}
      <mesh position={[0, -0.12, 0.42]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={skin.snoutColor} roughness={0.7} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, -0.06, 0.62]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.2, 0.06, 0.46]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} />
      </mesh>
      <mesh position={[0.2, 0.06, 0.46]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} />
      </mesh>

      {/* Left Ear */}
      <mesh position={[-0.42, 0.44, 0]} rotation={[0, 0, 0.35]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={skin.earColor} roughness={0.7} />
      </mesh>
      <mesh position={[-0.4, 0.43, 0.08]} rotation={[0, 0, 0.35]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color={skin.innerEarColor} roughness={0.8} />
      </mesh>

      {/* Right Ear */}
      <mesh position={[0.42, 0.44, 0]} rotation={[0, 0, -0.35]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={skin.earColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.4, 0.43, 0.08]} rotation={[0, 0, -0.35]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color={skin.innerEarColor} roughness={0.8} />
      </mesh>

      {/* White Brow Markings */}
      <mesh position={[-0.18, 0.22, 0.44]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.12, 0.04, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
      <mesh position={[0.18, 0.22, 0.44]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.12, 0.04, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>

      {/* 3D ACCESSORY: Chef Hat */}
      {accessoryId === 'chef_hat' && (
        <group position={[0, 0.56, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.28, 0.18, 20]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.32, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.285, 0.285, 0.04, 20]} />
            <meshStandardMaterial color="#F43F5E" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* 3D ACCESSORY: Sprout Leaf */}
      {accessoryId === 'sprout_leaf' && (
        <group position={[0, 0.52, 0]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
            <meshStandardMaterial color="#10B981" roughness={0.4} />
          </mesh>
          <mesh position={[-0.1, 0.18, 0]} rotation={[0, 0, 0.5]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#10B981" roughness={0.3} />
          </mesh>
          <mesh position={[0.1, 0.16, 0]} rotation={[0, 0, -0.5]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#34D399" roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* 3D ACCESSORY: Sweatband */}
      {accessoryId === 'sweatband' && (
        <group position={[0, 0.2, 0]}>
          <mesh rotation={[0.2, 0, 0]}>
            <torusGeometry args={[0.53, 0.05, 16, 32]} />
            <meshStandardMaterial color="#3B82F6" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* 3D ACCESSORY: Detective Monocle */}
      {accessoryId === 'monocle' && (
        <group position={[-0.2, 0.06, 0.48]}>
          <mesh>
            <torusGeometry args={[0.08, 0.015, 12, 24]} />
            <meshStandardMaterial
              color="#F59E0B"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

export const Mascot3DCanvas: React.FC<Mascot3DCanvasProps> = ({
  mood,
  skinId,
  skin,
  accessoryId,
  accessory,
  size = 68,
  onError,
}) => {
  const resolvedSkin = skin || skinId || 'classic_panda';
  const resolvedAccessory = accessory || accessoryId || 'none';

  const [R3F, setR3F] = useState<{ Canvas: any; useFrame: any } | null>(null);
  const [loadAttempted, setLoadAttempted] = useState(false);

  useEffect(() => {
    let mounted = true;
    try {
      // Isolate native WebGL require to execution phase only
      let canvasComp: any = null;
      let frameHook: any = null;
      try {
        const r3fNative = require('@react-three/fiber/native');
        canvasComp = r3fNative.Canvas;
        frameHook = r3fNative.useFrame;
      } catch {
        try {
          const r3fWeb = require('@react-three/fiber');
          canvasComp = r3fWeb.Canvas;
          frameHook = r3fWeb.useFrame;
        } catch {
          canvasComp = null;
          frameHook = null;
        }
      }

      if (mounted) {
        setLoadAttempted(true);
        if (canvasComp) {
          setR3F({ Canvas: canvasComp, useFrame: frameHook });
        } else {
          if (onError) onError();
        }
      }
    } catch (err) {
      if (mounted) {
        setLoadAttempted(true);
        if (onError) onError(err);
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  if (!loadAttempted || !R3F) {
    return null;
  }

  const { Canvas, useFrame } = R3F;

  return (
    <Mascot3DErrorBoundary onError={onError} fallback={null}>
      <View style={[styles.canvasContainer, { width: size, height: size }]}>
        <Canvas
          camera={{ position: [0, 0, 2.2], fov: 45 }}
          onCreated={() => {}}
          onError={(err: any) => {
            if (onError) onError(err);
          }}
        >
          {/* Studio Lighting */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <pointLight position={[-2, -1, 1]} intensity={0.5} color="#FFD1BA" />

          {/* 3D Animated Model with skin & accessories */}
          <Bao3DModel
            mood={mood}
            skinId={resolvedSkin}
            accessoryId={resolvedAccessory}
            useFrame={useFrame}
          />
        </Canvas>
      </View>
    </Mascot3DErrorBoundary>
  );
};

const styles = StyleSheet.create({
  canvasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default Mascot3DCanvas;
