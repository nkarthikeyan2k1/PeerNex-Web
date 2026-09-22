'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/providers/SocketProvider';

interface UserCountPayload {
  totalUsers: number;
  waitingUsers: number;
}

/**
 * Subscribes to the server's `userCountUpdate` event and returns the real
 * connected-user count. Pulls the socket from SocketProvider context
 * automatically. Falls back to `null` while the socket is not yet
 * connected (callers can render a placeholder like "—" or a spinner).
 */
export function useOnlineCount(): number | null {
  const { socket } = useSocket();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onUpdate = ({ totalUsers }: UserCountPayload) => {
      setCount(totalUsers);
    };

    socket.on('userCountUpdate', onUpdate);
    return () => {
      socket.off('userCountUpdate', onUpdate);
    };
  }, [socket]);

  return count;
}
