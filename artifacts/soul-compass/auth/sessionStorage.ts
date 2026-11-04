import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const SESSION_STORAGE_KEY = 'soul-compass.auth.v1';
// SecureStore items have platform size limits; commit a small pointer only after
// every chunk is written. Never fall back to unencrypted AsyncStorage on native.
type Pointer = { prefix: string; count: number };
async function pointer(key: string): Promise<Pointer | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  const value = JSON.parse(raw) as Pointer;
  if (!value.prefix.startsWith(key + '.') || !Number.isInteger(value.count) || value.count < 1 || value.count > 200) throw new Error('Invalid session storage.');
  return value;
}
async function removeChunks(value: Pointer | null) {
  if (value) await Promise.all(Array.from({ length: value.count }, (_, i) => SecureStore.deleteItemAsync(`${value.prefix}.${i}`)));
}
export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    const value = await pointer(key);
    if (!value) return null;
    const chunks = await Promise.all(Array.from({ length: value.count }, (_, i) => SecureStore.getItemAsync(`${value.prefix}.${i}`)));
    return chunks.every(c => c !== null) ? chunks.join('') : null;
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); return; }
    const previous = await pointer(key);
    const prefix = `${key}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
    const chunks = value.match(/[\s\S]{1,500}/g) ?? [''];
    if (chunks.length > 200) throw new Error('Session exceeds secure storage capacity.');
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${prefix}.${i}`, chunk, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY })));
    await SecureStore.setItemAsync(key, JSON.stringify({ prefix, count: chunks.length }), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    await removeChunks(previous);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.localStorage.removeItem(key); return; }
    const previous = await pointer(key);
    await SecureStore.deleteItemAsync(key);
    await removeChunks(previous);
  },
};
