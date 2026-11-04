import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Refresh local daily content while open and immediately on returning to it. */
export function useLocalClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return now;
}
