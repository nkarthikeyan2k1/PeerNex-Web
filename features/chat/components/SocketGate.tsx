'use client';

import React from 'react';
import { useSocket, MAX_RECONNECT_ATTEMPTS } from '@/providers/SocketProvider';
import './SocketGate.scss';

/**
 * Wraps chat pages with a slim connecting banner while Socket.IO is
 * establishing the connection (e.g. during a Render cold-start). Shows the
 * retry count (n/MAX) and, once every attempt has failed, a reload button.
 * The banner auto-dismisses once `isConnected` becomes true; it never
 * blocks the page layout beneath it.
 */
export default function SocketGate({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting, reconnectAttempt, reconnectFailed } = useSocket();
  const showBanner = !isConnected && (isConnecting || reconnectFailed);

  return (
    <>
      {showBanner && (
        <div
          className={`socket-gate-banner${reconnectFailed ? ' socket-gate-banner--failed' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="socket-gate-banner__dot" aria-hidden />
          {reconnectFailed ? (
            <>
              <span className="socket-gate-banner__text">Couldn&apos;t reach the server.</span>
              <button className="socket-gate-banner__reload" onClick={() => window.location.reload()}>
                Reload page
              </button>
            </>
          ) : (
            <span className="socket-gate-banner__text">
              Connecting to server{reconnectAttempt > 0
                ? <> — retry <strong>{reconnectAttempt}/{MAX_RECONNECT_ATTEMPTS}</strong></>
                : ' — may take a few seconds on first load'}
            </span>
          )}
        </div>
      )}
      {children}
    </>
  );
}
