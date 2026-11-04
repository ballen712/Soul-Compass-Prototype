import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { sessionStorage, SESSION_STORAGE_KEY } from './sessionStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const authConfigured = Boolean(url && key);
// Only a public/publishable (or legacy anon) key belongs in this module.
export const supabase = url && key ? createClient(url, key, {
  auth: {
    storage: sessionStorage, storageKey: SESSION_STORAGE_KEY,
    autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce',
  },
}) : null;
