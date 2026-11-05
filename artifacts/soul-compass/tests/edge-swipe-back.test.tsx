import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('react-native', () => ({
  PanResponder: { create: (handlers: any) => ({ panHandlers: {
    onMoveShouldSetResponderCapture: handlers.onMoveShouldSetPanResponderCapture,
    onResponderRelease: handlers.onPanResponderRelease,
  } }) },
  Platform: { OS: 'ios' },
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));

import { EdgeSwipeBack } from '../components/EdgeSwipeBack';

let renderer: ReactTestRenderer | undefined;

afterEach(() => {
  act(() => renderer?.unmount());
  renderer = undefined;
});

test('only a deliberate rightward swipe from the left edge triggers back', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const onBack = vi.fn();
  act(() => {
    renderer = create(
      <EdgeSwipeBack testID="edge-swipe-back" onBack={onBack}>
        <Text>Screen content</Text>
      </EdgeSwipeBack>,
    );
  });
  const handlers = renderer!.root.findByProps({ testID: 'edge-swipe-back' }).props;
  const shouldCapture = handlers.onMoveShouldSetResponderCapture;

  expect(shouldCapture({}, { x0: 22, dx: 30, dy: 5 })).toBe(true);
  expect(shouldCapture({}, { x0: 40, dx: 100, dy: 0 })).toBe(false);
  expect(shouldCapture({}, { x0: 22, dx: 25, dy: 30 })).toBe(false);

  handlers.onResponderRelease({}, { x0: 22, dx: 45, dy: 4 });
  expect(onBack).not.toHaveBeenCalled();
  handlers.onResponderRelease({}, { x0: 22, dx: 100, dy: 12 });
  expect(onBack).toHaveBeenCalledTimes(1);
});
