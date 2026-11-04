import { beforeEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ values: new Map<string, string>() }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
  getItemAsync: async (key: string) => state.values.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => { expect(value.length).toBeLessThanOrEqual(2048); state.values.set(key, value); },
  deleteItemAsync: async (key: string) => { state.values.delete(key); },
}));
import { sessionStorage } from '../auth/sessionStorage';
beforeEach(() => state.values.clear());
test('native sessions persist across reads, rotate chunks and delete without AsyncStorage', async () => {
  const value = 'mock-session-data-'.repeat(500);
  await sessionStorage.setItem('test', value);
  expect(await sessionStorage.getItem('test')).toBe(value);
  const previous = new Set(state.values.keys());
  await sessionStorage.setItem('test', value + 'new');
  expect(await sessionStorage.getItem('test')).toBe(value + 'new');
  for (const key of previous) if (key !== 'test') expect(state.values.has(key)).toBe(false);
  await sessionStorage.removeItem('test'); expect(state.values.size).toBe(0);
});
