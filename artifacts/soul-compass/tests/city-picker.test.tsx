import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const lookup = vi.hoisted(() => vi.fn());
vi.mock('../services/geocoding', () => ({ searchHomeCities: lookup }));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text', TextInput: 'TextInput', View: 'View',
  StyleSheet: { create: (styles: unknown) => styles }, Linking: { openURL: vi.fn() },
  useColorScheme: () => 'light',
}));
import { HomeCityPicker } from '../components/HomeCityPicker';
let renderer: ReactTestRenderer;
const select = vi.fn();
const city = (name: string) => ({ city: name, country: 'Test', latitude: 0, longitude: 0, timeZone: 'UTC' });
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  lookup.mockReset(); select.mockReset();
  await act(async () => { renderer = create(<HomeCityPicker label="Place of Birth" value={null} onSelect={select} />); });
});
afterEach(async () => { await act(async () => renderer.unmount()); });
async function query(text: string) {
  await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Place of Birth' }).props.onChangeText(text));
}
function search() { return renderer.root.findByProps({ accessibilityLabel: 'Search cities' }).props.onPress(); }
test('explicit searches select exact coordinates into independent birthplace and residence controls', async () => {
  const residence = vi.fn();
  const budapest = { city: 'Budapest', country: 'Hungary', admin1: 'Central Hungary',
    latitude: 47.4978789, longitude: 19.0402383, timeZone: 'Europe/Budapest' };
  const tokyo = { city: 'Tokyo', country: 'Japan', latitude: 35.6768601,
    longitude: 139.7638947, timeZone: 'Asia/Tokyo' };
  await act(async () => renderer.update(<>
    <HomeCityPicker label="Place of Birth" value={null} onSelect={select} />
    <HomeCityPicker label="Current residence" value={null} onSelect={residence} />
  </>));
  expect(lookup).not.toHaveBeenCalled();
  lookup.mockResolvedValueOnce([budapest]).mockResolvedValueOnce([tokyo]);
  await query('Budapest');
  expect(lookup).not.toHaveBeenCalled();
  await act(async () => renderer.root.findAllByProps({ accessibilityLabel: 'Search cities' })[0].props.onPress());
  const selectResult = (name: string) => renderer.root.findAllByType('Pressable' as any).find(
    p => p.findAllByType('Text' as any).some(t => t.children.includes(name)))!.props.onPress();
  await act(async () => selectResult('Budapest'));
  expect(select).toHaveBeenCalledExactlyOnceWith({ city: 'Budapest', country: 'Hungary',
    latitude: 47.4978789, longitude: 19.0402383, timeZone: 'Europe/Budapest' });
  expect(residence).not.toHaveBeenCalled();
  await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Current residence' }).props.onChangeText('Tokyo'));
  await act(async () => renderer.root.findAllByProps({ accessibilityLabel: 'Search cities' })[1].props.onPress());
  await act(async () => selectResult('Tokyo'));
  expect(residence).toHaveBeenCalledExactlyOnceWith(tokyo);
  expect(select).toHaveBeenCalledTimes(1);
  const output = JSON.stringify(renderer.toJSON());
  expect(output).toContain('Geoapify'); expect(output).toContain('OpenStreetMap');
  expect(output).toContain('Privacy');
  expect(output).not.toContain('Search sends only your typed city query');
  expect(output).not.toContain('Open-Meteo');
});
test('late older search is ignored even if its fetch double ignores cancellation', async () => {
  let resolveOld!: (value: unknown) => void;
  lookup.mockImplementationOnce(() => new Promise(r => { resolveOld = r; })).mockResolvedValueOnce([city('New result')]);
  await query('Old city');
  let pending!: Promise<void>;
  await act(async () => { pending = search(); });
  const signal = lookup.mock.calls[0][1] as AbortSignal;
  await query('New city');
  expect(signal.aborted).toBe(true);
  await act(async () => { await search(); });
  await act(async () => { resolveOld([city('Stale result')]); await pending; });
  const text = JSON.stringify(renderer.toJSON());
  expect(text).toContain('New result'); expect(text).not.toContain('Stale result');
  expect(select).not.toHaveBeenCalled();
});
test('changing text clears completed results before they can be selected', async () => {
  lookup.mockResolvedValueOnce([city('Earlier result')]);
  await query('Earlier'); await act(async () => { await search(); });
  expect(JSON.stringify(renderer.toJSON())).toContain('Earlier result');
  await query('Later');
  expect(JSON.stringify(renderer.toJSON())).not.toContain('Earlier result');
  expect(select).not.toHaveBeenCalled();
});
test('unmount aborts an outstanding lookup and ignores its later response', async () => {
  let resolve!: (value: unknown) => void;
  lookup.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  await query('City');
  let pending!: Promise<void>;
  await act(async () => { pending = search(); });
  const signal = lookup.mock.calls[0][1] as AbortSignal;
  await act(async () => renderer.unmount());
  expect(signal.aborted).toBe(true);
  await act(async () => { resolve([city('Too late')]); await pending; });
  expect(select).not.toHaveBeenCalled();
});
