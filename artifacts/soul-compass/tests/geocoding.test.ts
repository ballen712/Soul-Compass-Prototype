import { afterEach, expect, test, vi } from 'vitest';
import { searchHomeCities } from '../services/geocoding';
afterEach(() => vi.unstubAllGlobals());
test('city lookup sends only the typed query and cancellation signal', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ results: [] }),
    { headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  const controller = new AbortController();
  await searchHomeCities(' Budapest ', controller.signal);
  const url = new URL(fetch.mock.calls[0][0], 'https://app.example');
  expect(url.pathname).toBe('/api/geocoding/cities');
  expect(url.searchParams.get('q')).toBe('Budapest');
  expect([...url.searchParams.keys()]).toEqual(['q']);
  expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
  expect(fetch.mock.calls[0][1].method).toBe('GET');
  expect(fetch.mock.calls[0][1].body).toBeUndefined();
  expect(url.href).not.toContain('geoapify');
});
test('unusable coordinates and malformed provider responses cannot become selected cities', async () => {
  const good = { city: 'City', country: 'Country', latitude: 0, longitude: 0, timeZone: 'UTC' };
  const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
  const fetch = vi.fn().mockResolvedValueOnce(json({
    results: [null, good, { ...good, latitude: 91 }, { ...good, longitude: 181 }, { ...good, timeZone: 'Invalid/Zone' }],
  })).mockResolvedValueOnce(json({ results: 'invalid' }));
  vi.stubGlobal('fetch', fetch);
  expect(await searchHomeCities('City')).toHaveLength(1);
  await expect(searchHomeCities('City')).rejects.toThrow('Unexpected');
});
test('short queries make no requests and rate-limit errors are safe', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('{"error":"internal detail"}',
    { status: 429, headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  expect(await searchHomeCities('x')).toEqual([]);
  expect(fetch).not.toHaveBeenCalled();
  await expect(searchHomeCities('Budapest')).rejects.toThrow('limit reached');
});
