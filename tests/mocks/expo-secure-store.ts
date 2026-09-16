const storage = new Map<string, string>();

export const getItemAsync = jest.fn(async (key: string) => {
  return storage.get(key) || null;
});

export const setItemAsync = jest.fn(async (key: string, value: string) => {
  storage.set(key, value);
});

export const deleteItemAsync = jest.fn(async (key: string) => {
  storage.delete(key);
});

export const isAvailableAsync = jest.fn(async () => true);

export default {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
  isAvailableAsync,
};
