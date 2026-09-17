import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { ENV } from '../../config/env';

export interface ScanRecord {
  id: string;
  user_id: string | null;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  nova_score: number;
  health_rating: number;
  image_uri: string | null;
  created_at: string;
}

const STORAGE_KEY = '@nutribuddy_sqlite_scans';
let cachedDb: any = null;
let isNativeSqlite = false;
let initPromise: Promise<void> | null = null;

let hasCheckedNative = false;
let isNativePresent = false;
let hasWarnedScansTable = false;

/**
 * Checks if the native ExpoSQLiteNext binary is compiled into the current runtime.
 */
function isExpoSQLiteNativeAvailable(): boolean {
  if (hasCheckedNative) return isNativePresent;
  hasCheckedNative = true;

  try {
    // 1. Jest test environment has the mock configured
    if (typeof jest !== 'undefined' || process.env.NODE_ENV === 'test') {
      isNativePresent = true;
      return true;
    }

    // 2. React Native runtime check for compiled native module
    const RN = require('react-native');
    const hasExpoModules = Boolean(
      (global as any)?.ExpoModules?.ExpoSQLiteNext ||
      (global as any)?.ExpoModules?.ExpoSQLite ||
      (global as any)?.expo?.modules?.ExpoSQLiteNext ||
      (global as any)?.expo?.modules?.ExpoSQLite ||
      RN?.NativeModules?.ExpoSQLiteNext ||
      RN?.NativeModules?.ExpoSQLite
    );

    isNativePresent = hasExpoModules;
    return isNativePresent;
  } catch {
    isNativePresent = false;
    return false;
  }
}

/**
 * Dynamically resolves expo-sqlite without throwing on unsupported runtimes.
 */
function getNativeSqlite() {
  if (!isExpoSQLiteNativeAvailable()) {
    return null;
  }

  try {
    const sqlite = require('expo-sqlite');
    return sqlite;
  } catch {
    return null;
  }
}

/**
 * Returns database handle (native SQLite or null for fallback mode).
 */
function getDatabase() {
  if (cachedDb) return cachedDb;
  const sqlite = getNativeSqlite();
  if (sqlite && typeof sqlite.openDatabaseSync === 'function') {
    try {
      cachedDb = sqlite.openDatabaseSync('nutribuddy.db');
      isNativeSqlite = true;
      return cachedDb;
    } catch (err) {
      console.warn('[Database] Native SQLite open error, falling back to AsyncStorage:', err);
    }
  }
  return null;
}

/**
 * Initializes the SQLite table `scans` with all required schema columns:
 * id, user_id, food_name, calories, protein, carbs, fat, nova_score, health_rating, image_uri, created_at
 */
export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = getDatabase();
      if (db) {
        // Create table with all required columns
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT,
            food_name TEXT NOT NULL,
            calories REAL NOT NULL DEFAULT 0,
            protein REAL NOT NULL DEFAULT 0,
            carbs REAL NOT NULL DEFAULT 0,
            fat REAL NOT NULL DEFAULT 0,
            nova_score INTEGER NOT NULL DEFAULT 1,
            health_rating REAL NOT NULL DEFAULT 0,
            image_uri TEXT,
            created_at TEXT NOT NULL
          );
        `);
      }
    } catch (error) {
      console.warn('[Database] initDatabase error, operating in fallback mode:', error);
    }
  })();

  return initPromise;
}

/**
 * Inserts or replaces a scanned meal record locally in SQLite.
 */
export async function insertScan(record: ScanRecord): Promise<void> {
  await initDatabase();

  const db = getDatabase();
  if (db && isNativeSqlite) {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO scans (
          id, user_id, food_name, calories, protein, carbs, fat, nova_score, health_rating, image_uri, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        record.id,
        record.user_id,
        record.food_name,
        record.calories,
        record.protein,
        record.carbs,
        record.fat,
        record.nova_score,
        record.health_rating,
        record.image_uri,
        record.created_at
      );
      // Also keep AsyncStorage in sync for seamless dual persistence
      await updateAsyncStorageScan(record);
      return;
    } catch (err) {
      console.warn('[Database] SQLite insert failed, saving to AsyncStorage fallback:', err);
    }
  }

  // Fallback storage path
  await updateAsyncStorageScan(record);
}

/**
 * Retrieves stored scans ordered by `created_at DESC`.
 */
export async function getScans(userId?: string): Promise<ScanRecord[]> {
  await initDatabase();

  const db = getDatabase();
  if (db && isNativeSqlite) {
    try {
      let rows: ScanRecord[];
      if (userId) {
        rows = (await db.getAllAsync(
          'SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC;',
          userId
        )) as ScanRecord[];
      } else {
        rows = (await db.getAllAsync(
          'SELECT * FROM scans ORDER BY created_at DESC;'
        )) as ScanRecord[];
      }
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn('[Database] SQLite getScans failed, reading from fallback:', err);
    }
  }

  // Fallback: Read from AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: ScanRecord[] = JSON.parse(raw);
    const sorted = parsed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (userId) {
      return sorted.filter((r) => r.user_id === userId);
    }
    return sorted;
  } catch {
    return [];
  }
}

/**
 * Deletes a scan record by ID.
 */
export async function deleteScan(id: string): Promise<void> {
  await initDatabase();

  const db = getDatabase();
  if (db && isNativeSqlite) {
    try {
      await db.runAsync('DELETE FROM scans WHERE id = ?;', id);
    } catch (err) {
      console.warn('[Database] SQLite delete failed:', err);
    }
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: ScanRecord[] = JSON.parse(raw);
      const filtered = parsed.filter((r) => r.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.warn('[Database] AsyncStorage delete failed:', err);
  }
}

/**
 * Clears all scan records.
 */
export async function clearScans(): Promise<void> {
  await initDatabase();

  const db = getDatabase();
  if (db && isNativeSqlite) {
    try {
      await db.runAsync('DELETE FROM scans;');
    } catch (err) {
      console.warn('[Database] SQLite clear failed:', err);
    }
  }

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[Database] AsyncStorage clear failed:', err);
  }
}

/**
 * Synchronizes a scan record to Supabase `scans` or `meal_logs` table.
 */
export async function syncScanToSupabase(
  record: ScanRecord,
  userId?: string
): Promise<boolean> {
  if (!ENV.HAS_SUPABASE) return false;

  const targetUserId = userId || record.user_id;
  if (!targetUserId || targetUserId === 'guest' || targetUserId === 'guest-user') {
    return false;
  }

  const payload = {
    id: record.id,
    user_id: targetUserId,
    food_name: record.food_name,
    calories: record.calories,
    protein: record.protein,
    carbs: record.carbs,
    fat: record.fat,
    nova_score: record.nova_score,
    health_rating: record.health_rating,
    image_uri: record.image_uri,
    created_at: record.created_at,
  };

  try {
    // 1. Try 'scans' table first
    const { error: scansError } = await supabase.from('scans').upsert(payload);
    if (!scansError) return true;

    // 2. If 'scans' table is missing or errors, fallback to 'meal_logs'
    const { error: mealLogsError } = await supabase.from('meal_logs').upsert(payload);
    if (!mealLogsError) return true;

    const isSchemaNotice =
      scansError?.message?.includes('schema cache') ||
      scansError?.message?.includes('does not exist') ||
      mealLogsError?.message?.includes('schema cache') ||
      mealLogsError?.message?.includes('does not exist');

    if (isSchemaNotice) {
      if (!hasWarnedScansTable) {
        hasWarnedScansTable = true;
        console.warn(
          '[Supabase Sync] Notice: "public.scans" table is not yet created in your Supabase project. Scans are fully persisted locally in SQLite. To enable cloud sync, execute the migration in supabase/migrations/20260917_create_scans.sql.'
        );
      }
    } else {
      console.warn('[Supabase Sync] Remote scan sync notice:', scansError?.message || mealLogsError?.message);
    }
    return false;
  } catch (err: any) {
    return false;
  }
}

// Internal helper for AsyncStorage mirroring
async function updateAsyncStorageScan(record: ScanRecord): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing: ScanRecord[] = raw ? JSON.parse(raw) : [];
    const index = existing.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      existing[index] = record;
    } else {
      existing.unshift(record);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('[Database] AsyncStorage update error:', err);
  }
}
