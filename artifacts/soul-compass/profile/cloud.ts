import { supabase } from '@/auth/supabase';
import type { UserProfile } from './profile';
import { notifySessionExpired } from '@/auth/events';

export type CloudPreferences = {
  language: string;
  crystalCollection: string[];
  crystalPreferences: { intentions: string[]; hiddenCrystals: string[] };
};
export type CloudRecord = { profile: UserProfile; preferences: CloudPreferences; version: number };
export const defaultPreferences = (): CloudPreferences => ({
  language: 'en', crystalCollection: [], crystalPreferences: { intentions: [], hiddenCrystals: [] },
});
export class AccountRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function accountRequest<T>(path: string, options: RequestInit = {}, expectedUserId?: string): Promise<T> {
  if (!supabase) throw new AccountRequestError('Cloud accounts are not configured yet.', 503);
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    notifySessionExpired();
    throw new AccountRequestError('Your session expired. Please sign in again.', 401);
  }
  if (expectedUserId && data.session.user.id !== expectedUserId) throw new AccountRequestError('Your account changed. Please retry from your current account.', 409);
  const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : '';
  const response = await fetch(`${base}/api/me${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${data.session.access_token}` },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json();
  if (!response.ok) {
    if (response.status === 401) notifySessionExpired();
    throw new AccountRequestError(typeof body.error === 'string' ? body.error : 'Account request failed.', response.status);
  }
  return body as T;
}
