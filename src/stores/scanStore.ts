/**
 * Unified Scan Store module providing local SQLite persistence, Supabase sync,
 * and history diary management.
 */
import { useScanStore } from '../store/useScanStore';
import { useScanHistoryStore, HistoryEntry } from '../store/useScanHistoryStore';
import {
  getScans,
  insertScan,
  deleteScan,
  clearScans,
  syncScanToSupabase,
  deleteScanFromSupabase,
  ScanRecord,
} from '../services/storage/database';

export * from '../store/useScanStore';
export { useScanStore as default } from '../store/useScanStore';
export { useScanHistoryStore } from '../store/useScanHistoryStore';
export type { HistoryEntry } from '../store/useScanHistoryStore';
export type { ScanRecord } from '../services/storage/database';
export { deleteScan, clearScans, deleteScanFromSupabase };

/**
 * Loads stored scans from SQLite into memory across app restarts.
 */
export async function fetchScans(): Promise<void> {
  await useScanHistoryStore.getState().fetchScans();
}

/**
 * Manually executes a local SQLite insert transaction and syncs to Supabase.
 */
export async function saveAndSyncScan(record: ScanRecord, userId?: string): Promise<void> {
  await insertScan(record);
  await syncScanToSupabase(record, userId);
}

/**
 * Deletes a scan log by ID:
 * 1. Removes the item from local Zustand state immediately so the card vanishes and daily totals update instantly.
 * 2. Executes an immediate DELETE FROM scans WHERE id = ? in SQLite.
 * 3. Deletes the corresponding record from Supabase public.meal_logs / public.scans.
 */
export async function deleteScanLog(id: string): Promise<void> {
  await useScanHistoryStore.getState().deleteScanLog(id);
}
