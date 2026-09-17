/**
 * Jest Mock for expo-sqlite (Expo SDK 51 modern API)
 */
interface MockRow {
  [key: string]: any;
}

class MockSQLiteDatabase {
  private tables: Map<string, MockRow[]> = new Map();

  async execAsync(source: string): Promise<void> {
    // Parse CREATE TABLE statements simply
    const createMatch = source.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
    if (createMatch) {
      const tableName = createMatch[1];
      if (!this.tables.has(tableName)) {
        this.tables.set(tableName, []);
      }
    }
  }

  async runAsync(source: string, ...params: any[]): Promise<{ lastInsertRowId: number; changes: number }> {
    // Handle INSERT OR REPLACE INTO scans (...) VALUES (...)
    const insertMatch = source.match(/INSERT\s+(?:OR\s+REPLACE\s+INTO|INTO)\s+(\w+)\s*\(([^)]+)\)/i);
    if (insertMatch) {
      const tableName = insertMatch[1];
      const columns = insertMatch[2].split(',').map((c) => c.trim());
      const row: MockRow = {};
      columns.forEach((col, idx) => {
        row[col] = params[idx] !== undefined ? params[idx] : null;
      });

      if (!this.tables.has(tableName)) {
        this.tables.set(tableName, []);
      }
      const table = this.tables.get(tableName)!;
      // If primary key 'id' exists, replace or append
      const existingIdx = table.findIndex((r) => r.id === row.id);
      if (existingIdx >= 0) {
        table[existingIdx] = row;
      } else {
        table.unshift(row);
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // Handle DELETE FROM table WHERE id = ?
    const deleteMatch = source.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(\w+)\s*=\s*\?)?/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1];
      const col = deleteMatch[2];
      if (!this.tables.has(tableName)) return { lastInsertRowId: 0, changes: 0 };
      const table = this.tables.get(tableName)!;
      if (col && params.length > 0) {
        const val = params[0];
        const prevLen = table.length;
        this.tables.set(tableName, table.filter((r) => r[col] !== val));
        return { lastInsertRowId: 0, changes: prevLen - this.tables.get(tableName)!.length };
      } else {
        const count = table.length;
        this.tables.set(tableName, []);
        return { lastInsertRowId: 0, changes: count };
      }
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getAllAsync<T = any>(source: string, ...params: any[]): Promise<T[]> {
    const selectMatch = source.match(/SELECT\s+.*?\s+FROM\s+(\w+)/i);
    if (selectMatch) {
      const tableName = selectMatch[1];
      const table = this.tables.get(tableName) || [];
      // Handle simple WHERE user_id = ?
      if (source.includes('WHERE') && params.length > 0) {
        const whereMatch = source.match(/WHERE\s+(\w+)\s*=\s*\?/i);
        if (whereMatch) {
          const col = whereMatch[1];
          return table.filter((r) => r[col] === params[0]) as unknown as T[];
        }
      }
      return [...table] as unknown as T[];
    }
    return [];
  }

  async getFirstAsync<T = any>(source: string, ...params: any[]): Promise<T | null> {
    const all = await this.getAllAsync<T>(source, ...params);
    return all.length > 0 ? all[0] : null;
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    return await task();
  }
}

const mockDb = new MockSQLiteDatabase();

export const openDatabaseSync = jest.fn((_dbName: string) => mockDb);
export const openDatabaseAsync = jest.fn(async (_dbName: string) => mockDb);

export default {
  openDatabaseSync,
  openDatabaseAsync,
};
