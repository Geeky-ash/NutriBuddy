import {
  initDatabase,
  insertScan,
  getScans,
  deleteScan,
  clearScans,
  syncScanToSupabase,
  ScanRecord,
} from '../../src/services/storage/database';

describe('SQLite Database Service (scans table)', () => {
  beforeEach(async () => {
    await clearScans();
  });

  it('initializes the database and creates scans table without error', async () => {
    await expect(initDatabase()).resolves.toBeUndefined();
  });

  it('inserts and retrieves scans with all required schema columns', async () => {
    const scan: ScanRecord = {
      id: 'test-scan-1',
      user_id: 'user-123',
      food_name: 'Organic Blueberries',
      calories: 84,
      protein: 1.1,
      carbs: 21.4,
      fat: 0.5,
      nova_score: 1,
      health_rating: 98,
      image_uri: 'file://blueberries.jpg',
      created_at: new Date().toISOString(),
    };

    await insertScan(scan);

    const rows = await getScans();
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const found = rows.find((r) => r.id === 'test-scan-1');
    expect(found).toBeDefined();
    expect(found?.food_name).toBe('Organic Blueberries');
    expect(found?.calories).toBe(84);
    expect(found?.protein).toBe(1.1);
    expect(found?.carbs).toBe(21.4);
    expect(found?.fat).toBe(0.5);
    expect(found?.nova_score).toBe(1);
    expect(found?.health_rating).toBe(98);
    expect(found?.image_uri).toBe('file://blueberries.jpg');
    expect(found?.user_id).toBe('user-123');
  });

  it('deletes scan by ID correctly', async () => {
    const scan: ScanRecord = {
      id: 'scan-to-delete',
      user_id: null,
      food_name: 'Test Cookie',
      calories: 150,
      protein: 2,
      carbs: 20,
      fat: 7,
      nova_score: 4,
      health_rating: 40,
      image_uri: null,
      created_at: new Date().toISOString(),
    };

    await insertScan(scan);
    let rows = await getScans();
    expect(rows.some((r) => r.id === 'scan-to-delete')).toBe(true);

    await deleteScan('scan-to-delete');
    rows = await getScans();
    expect(rows.some((r) => r.id === 'scan-to-delete')).toBe(false);
  });

  it('handles syncScanToSupabase gracefully even in offline/mock environment', async () => {
    const scan: ScanRecord = {
      id: 'sync-scan',
      user_id: 'test-user',
      food_name: 'Steel Cut Oatmeal',
      calories: 160,
      protein: 5,
      carbs: 28,
      fat: 2.5,
      nova_score: 1,
      health_rating: 92,
      image_uri: null,
      created_at: new Date().toISOString(),
    };

    const result = await syncScanToSupabase(scan, 'test-user');
    expect(typeof result).toBe('boolean');
  });
});
