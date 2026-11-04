import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, test, vi } from 'vitest';
const events = vi.hoisted(() => ({ listener: undefined as undefined | ((state: string) => void), remove: vi.fn() }));
vi.mock('react-native', () => ({
  AppState: { addEventListener: (_event: string, callback: (state: string) => void) => {
    events.listener = callback; return { remove: events.remove };
  } },
}));
import { useLocalClock } from '../hooks/useLocalClock';
let renderer: ReactTestRenderer | undefined;
let current: Date;
function Probe() { current = useLocalClock(); return null; }
afterEach(async () => { await act(async () => renderer?.unmount()); renderer = undefined; vi.useRealTimers(); });
test('open local screens advance at the next tick and immediately after returning to foreground', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-04T23:59:30Z'));
  await act(async () => { renderer = create(<Probe />); });
  const start = current!.getTime();
  await act(async () => { vi.advanceTimersByTime(60_000); });
  expect(current!.getTime()).toBe(start + 60_000);
  vi.setSystemTime(new Date('2026-11-06T01:00:00Z'));
  await act(async () => events.listener?.('active'));
  expect(current!.toISOString()).toBe('2026-11-06T01:00:00.000Z');
  await act(async () => renderer?.unmount()); renderer = undefined;
  expect(events.remove).toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
});
