import { ScannedProduct, LiveMealScanResult } from './nutrition';

export type ScanType = 'PACKAGED' | 'LIVE_FOOD';

export type ProcessingStatus = 'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR';

export type ScanResultData = ScannedProduct | LiveMealScanResult;
