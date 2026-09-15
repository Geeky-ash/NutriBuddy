import { create } from 'zustand';
import { ScanType, ProcessingStatus, ScanResultData } from '../types/scan';

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

export const useScanStore = create<ScanState>((set) => ({
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

  setScanSuccess: (results) =>
    set({
      processingStatus: 'SUCCESS',
      scanResults: results,
      errorMessage: null,
    }),

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
