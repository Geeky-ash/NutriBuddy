import { create } from 'zustand';
import { ScanType, ProcessingStatus, ScanResultData, ScannedProduct, LiveMealScanResult } from '../types/scan';
import { insertScan, syncScanToSupabase, ScanRecord } from '../services/storage/database';
import { useAuthStore } from './useAuthStore';

interface ScanState {
  scanType: ScanType;
  processingStatus: ProcessingStatus;
  activeImageUri: string | null;
  ocrText: string | null;
  scanResults: ScanResultData | null;
  errorMessage: string | null;

  // Actions
  setScanType: (type: ScanType) => void;
  startScan: (imageUri?: string) => void;
  setOcrText: (text: string) => void;
  setScanSuccess: (results: ScanResultData) => void;
  setScanError: (message: string) => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  scanType: 'PACKAGED',
  processingStatus: 'IDLE',
  activeImageUri: null,
  ocrText: null,
  scanResults: null,
  errorMessage: null,

  setScanType: (type) => set({ scanType: type }),

  startScan: (imageUri) =>
    set({
      processingStatus: 'SCANNING',
      activeImageUri: imageUri ?? null,
      errorMessage: null,
    }),

  setOcrText: (text) => set({ ocrText: text }),

  setScanSuccess: (results) => {
    const { activeImageUri } = get();
    set({
      processingStatus: 'SUCCESS',
      scanResults: results,
      errorMessage: null,
    });

    // Automatically execute a local SQLite INSERT transaction immediately upon completion & sync to Supabase
    try {
      const isLiveScan = 'items' in results;
      const liveItem = isLiveScan ? (results as unknown as LiveMealScanResult) : null;
      const packagedItem = !isLiveScan ? (results as unknown as ScannedProduct) : null;

      const foodName = isLiveScan
        ? (liveItem?.items?.[0]?.name ? `${liveItem.items[0].name}${liveItem.items.length > 1 ? ` + ${liveItem.items.length - 1} more` : ''}` : 'Prepared Meal')
        : (packagedItem?.name || 'Packaged Item');

      const macros = isLiveScan ? liveItem?.totalMacros : packagedItem?.macrosPer100g;
      const healthScore = isLiveScan ? (liveItem?.overallHealthScore ?? 75) : (packagedItem?.healthScore ?? 75);
      const imageUri = isLiveScan ? (liveItem?.imageUri || activeImageUri) : (packagedItem?.imageUrl || activeImageUri);
      const currentUserId = useAuthStore.getState().user?.id || null;

      const record: ScanRecord = {
        id: (results as any).id || `scan-${Date.now()}`,
        user_id: currentUserId,
        food_name: foodName,
        calories: macros?.calories || 0,
        protein: macros?.protein || 0,
        carbs: macros?.carbohydrates || 0,
        fat: macros?.fat || 0,
        nova_score: healthScore >= 70 ? 1 : healthScore >= 50 ? 2 : 4,
        health_rating: healthScore,
        image_uri: imageUri || null,
        created_at: new Date((results as any).createdAt || (results as any).timestamp || Date.now()).toISOString(),
      };

      insertScan(record).catch((err) =>
        console.warn('[ScanStore] SQLite auto-insert error:', err)
      );

      syncScanToSupabase(record, currentUserId || undefined).catch((err) =>
        console.warn('[ScanStore] Supabase sync notice:', err)
      );
    } catch (err) {
      console.warn('[ScanStore] Scan persistence error:', err);
    }
  },

  setScanError: (message) =>
    set({
      processingStatus: 'ERROR',
      errorMessage: message,
    }),

  resetScan: () =>
    set({
      processingStatus: 'IDLE',
      activeImageUri: null,
      ocrText: null,
      scanResults: null,
      errorMessage: null,
    }),
}));
