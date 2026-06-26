'use client';

import { useEffect, useState } from 'react';

/** Decorative live peer counter that drifts up and down on an interval. */
export function useOnlineCount(initial = 16128, intervalMs = 2600) {
  const [online, setOnline] = useState(initial);

  useEffect(() => {
    const iv = setInterval(
      () => setOnline(n => n + Math.floor(Math.random() * 7) - 3),
      intervalMs,
    );
    return () => clearInterval(iv);
  }, [intervalMs]);

  return online;
}
