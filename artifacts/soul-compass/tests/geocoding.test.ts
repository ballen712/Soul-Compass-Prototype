import { afterEach, expect, test, vi } from 'vitest';
import { searchHomeCities } from '../services/geocoding';
afterEach(() => vi.unstubAllGlobals());
test('city lookup sends only the typed query and cancellation signal', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
  vi.stubGlobal('fetch', fetch);
  const controller = new AbortController();
  await searchHomeCities(' Budapest ', controller.signal);
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.searchParams.get('name')).toBe('Budapest');
  expect([...url.searchParams.keys()].sort()).toEqual(['count', 'format', 'language', 'name']);
  expect(fetch.mock.calls[0][1]).toEqual({ signal: controller.signal });
});
test('unusable coordinates and malformed provider responses cannot become selected cities', async () => {
  const good = { name: 'City', country: 'Country', latitude: 0, longitude: 0, timezone: 'UTC' };
  const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({
    results: [null, good, { ...good, latitude: 91 }, { ...good, longitude: 181 }, { ...good, timezone: 'Invalid/Zone' }],
  }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ results: 'invalid' }) });
  vi.stubGlobal('fetch', fetch);
  expect(await searchHomeCities('City')).toHaveLength(1);
  await expect(searchHomeCities('City')).rejects.toThrow('Unexpected');
});
