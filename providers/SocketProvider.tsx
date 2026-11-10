'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { clientEnv } from '@/lib/clientEnv';

/** Reconnection attempts before giving up and asking the user to reload. */
export const MAX_RECONNECT_ATTEMPTS = 10;

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    /** True while a connection attempt is in progress but not yet established. */
    isConnecting: boolean;
    /** Which reconnection attempt we're on (0 when connected / idle). */
    reconnectAttempt: number;
    /** All MAX_RECONNECT_ATTEMPTS failed — the client has stopped retrying. */
    reconnectFailed: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    isConnecting: false,
    reconnectAttempt: 0,
    reconnectFailed: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [reconnectFailed, setReconnectFailed] = useState(false);

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
            // Render can take 20-30 s to wake. Retry with exponential back-off
            // (capped at 8 s) — enough to ride out a cold start — then stop and
            // let the banner offer a reload instead of retrying forever.
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
            timeout: 30000,
        });
        socketRef.current = socketInstance;

        const onConnect = () => {
            setIsConnecting(false);
            setIsConnected(true);
            setReconnectAttempt(0);
            setSocket(socketInstance);
        };
        const onDisconnect = () => {
            setIsConnected(false);
            setSocket(null);
        };
        const onReconnectAttempt = (attempt: number) => {
            setIsConnecting(true);
            setReconnectAttempt(attempt);
        };
        const onReconnect = () => {
            setIsConnecting(false);
            setReconnectAttempt(0);
        };
        const onReconnectFailed = () => {
            setIsConnecting(false);
            setReconnectFailed(true);
        };

        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.io.on('reconnect_attempt', onReconnectAttempt);
        socketInstance.io.on('reconnect', onReconnect);
        socketInstance.io.on('reconnect_failed', onReconnectFailed);

        socketInstance.connect();

        return () => {
            socketInstance.off('connect', onConnect);
            socketInstance.off('disconnect', onDisconnect);
            socketInstance.io.off('reconnect_attempt', onReconnectAttempt);
            socketInstance.io.off('reconnect', onReconnect);
            socketInstance.io.off('reconnect_failed', onReconnectFailed);
            socketInstance.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnecting(false);
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, isConnecting, reconnectAttempt, reconnectFailed }}>
            {children}
        </SocketContext.Provider>
    );
};
