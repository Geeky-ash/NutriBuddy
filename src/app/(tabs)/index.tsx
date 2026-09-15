import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraViewfinder } from '../../components/scanner/CameraViewfinder';
import { MascotWidget } from '../../components/mascot/MascotWidget';

export default function ScannerScreen() {
  const router = useRouter();

  const handleOpenResults = () => {
    router.push('/modal/scan-results' as any);
  };

  return (
    <View style={styles.container}>
      {/* Edge-to-Edge Viewfinder */}
      <CameraViewfinder onOpenResults={handleOpenResults} />

      {/* Floating Interactive 3D/2D Mascot Stage with Speech Bubble */}
      <MascotWidget onTapMascot={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
