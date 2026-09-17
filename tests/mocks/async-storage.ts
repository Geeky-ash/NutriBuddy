/**
 * Jest Mock for @react-native-async-storage/async-storage
 */
const storage = new Map<string, string>();

export const getItem = jest.fn(async (key: string) => {
  return storage.get(key) || null;
});

export const setItem = jest.fn(async (key: string, value: string) => {
  storage.set(key, value);
});

export const removeItem = jest.fn(async (key: string) => {
  storage.delete(key);
});

export const clear = jest.fn(async () => {
  storage.clear();
});

export const getAllKeys = jest.fn(async () => {
  return Array.from(storage.keys());
});

export default {
  getItem,
  setItem,
  removeItem,
  clear,
  getAllKeys,
};
