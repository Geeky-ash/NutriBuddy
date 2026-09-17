/**
 * Unified Scan Store module providing local SQLite persistence, Supabase sync,
 * and history diary management.
 */
import { useScanStore } from '../store/useScanStore';
import { useScanHistoryStore, HistoryEntry } from '../store/useScanHistoryStore';
import { getScans, insertScan, deleteScan, clearScans, syncScanToSupabase, ScanRecord } from '../services/storage/database';

export * from '../store/useScanStore';
export { useScanStore as default } from '../store/useScanStore';
export { useScanHistoryStore } from '../store/useScanHistoryStore';
export type { HistoryEntry } from '../store/useScanHistoryStore';
export type { ScanRecord } from '../services/storage/database';

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
