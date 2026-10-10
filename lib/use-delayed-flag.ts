import * as React from 'react';

// True only once `active` has stayed true for `delayMs`. A loading state shown at once flashes for a
// fraction of a second when the wait is short, so wait before showing it.
export function useDelayedFlag(active: boolean, delayMs = 250) {
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return shown;
}
