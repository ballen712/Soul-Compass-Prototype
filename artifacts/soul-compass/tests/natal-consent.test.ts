import { beforeEach, expect, test, vi } from 'vitest';
import { LocalProfileStore } from '../profile/storage';
import { natalRequest, requestNatal } from '../services/natal';
import type { UserProfile } from '../profile/profile';
import { calculateNatalChart } from '@workspace/api-client-react';
vi.mock('@workspace/api-client-react', () => ({ calculateNatalChart: vi.fn(async () => ({ chart: 'test double' })) }));
const profile: UserProfile = {
  birthDate: '1991-06-20', birthTime: { status: 'known', localTime: '23:51' },
  birthPlace: { city: 'Kyiv', country: 'Ukraine', latitude: 50.45, longitude: 30.52, timeZone: 'Europe/Kyiv' },
  currentResidence: { city: 'Budapest', country: 'Hungary', latitude: 47.5, longitude: 19.04, timeZone: 'Europe/Budapest' },
};
beforeEach(() => vi.clearAllMocks());
test('service checks consent before API; decline and revocation block all future sends', async () => {
  const store = new LocalProfileStore({ getItem: async () => null, setItem: async () => {} });
  await store.load(); await store.saveProfile(profile);
  await expect(requestNatal(store, profile, null)).rejects.toThrow();
  await store.setConsent(false); await expect(requestNatal(store, profile, null)).rejects.toThrow();
  expect(calculateNatalChart).not.toHaveBeenCalled();
  await store.setConsent(true); await requestNatal(store, profile, null);
  expect(calculateNatalChart).toHaveBeenCalledTimes(1);
  expect(calculateNatalChart).toHaveBeenCalledWith(natalRequest(profile, null), { signal: expect.any(AbortSignal) });
  await store.setConsent(false); await expect(requestNatal(store, profile, null)).rejects.toThrow();
  expect(calculateNatalChart).toHaveBeenCalledTimes(1);
});
test('payload minimization excludes residence, names, identifiers, settings and preferences', () => {
  expect(natalRequest(profile, 'later')).toEqual({
    birthDate: '1991-06-20', birthTime: { status: 'known', localTime: '23:51', disambiguation: 'later' },
    birthPlace: { latitude: 50.45, longitude: 30.52, timeZone: 'Europe/Kyiv' },
    houseSystem: 'placidus', zodiac: 'tropical',
  });
});
test('unknown birth time is not changed to midnight or given DST disambiguation', () => {
  expect(natalRequest({ ...profile, birthTime: { status: 'unknown' } }, 'earlier').birthTime).toEqual({ status: 'unknown' });
});
