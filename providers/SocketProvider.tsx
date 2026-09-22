'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { clientEnv } from '@/lib/clientEnv';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    /** True while a connection attempt is in progress but not yet established. */
    isConnecting: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    isConnecting: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Backend URL is injected at runtime into window.PEER_NEX (see app/(main)/layout.tsx),
        // so we read it synchronously and connect directly — native WebSockets, no fetch race.
        // Empty/missing url falls back to a same-origin connection for local dev.
        const socketUrl = clientEnv().SOCKET_URL;
        const socketInstance = io(socketUrl || undefined, {
            transports: ["polling", "websocket"],
            autoConnect: false,
            // ── Reconnection hardening for Render free-tier cold starts ──────────
            // Render can take 20-30 s to wake. Retry indefinitely with exponential
            // back-off (capped at 8 s) so the user never has to manually refresh
            // while the server is warming up.
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
            timeout: 30000,
        });
        socketRef.current = socketInstance;

        const onConnect = () => {
            setIsConnecting(false);
            setIsConnected(true);
            setSocket(socketInstance); // Triggers re-render asynchronously on connect
        };
        const onDisconnect = () => {
            setIsConnected(false);
            setSocket(null);
        };
        const onReconnectAttempt = () => setIsConnecting(true);
        const onReconnect = () => setIsConnecting(false);

        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.io.on('reconnect_attempt', onReconnectAttempt);
        socketInstance.io.on('reconnect', onReconnect);

        // Mark as connecting immediately when we kick off the first attempt.
        setIsConnecting(true);
        socketInstance.connect();

        return () => {
            socketInstance.off('connect', onConnect);
            socketInstance.off('disconnect', onDisconnect);
            socketInstance.io.off('reconnect_attempt', onReconnectAttempt);
            socketInstance.io.off('reconnect', onReconnect);
            socketInstance.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnecting(false);
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, isConnecting }}>
            {children}
        </SocketContext.Provider>
    );
};
