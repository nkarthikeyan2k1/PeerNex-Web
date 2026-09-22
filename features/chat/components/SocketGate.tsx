'use client';

import React from 'react';
import { useSocket } from '@/providers/SocketProvider';
import './SocketGate.scss';

/**
 * Wraps chat pages with a slim connecting banner while Socket.IO is
 * establishing the initial connection (e.g. during a Render cold-start).
 * The banner auto-dismisses once `isConnected` becomes true; it never
 * blocks the page layout beneath it.
 */
export default function SocketGate({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting } = useSocket();
  const showBanner = isConnecting && !isConnected;

  return (
    <>
      {showBanner && (
        <div className="socket-gate-banner" role="status" aria-live="polite">
          <span className="socket-gate-banner__dot" aria-hidden />
          <span className="socket-gate-banner__text">
            Connecting to server — may take a few seconds on first load
          </span>
        </div>
      )}
      {children}
    </>
  );
}
