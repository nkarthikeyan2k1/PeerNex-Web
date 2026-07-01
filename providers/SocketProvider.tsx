'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { clientEnv } from '@/lib/clientEnv';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Backend URL is injected at runtime into window.PEER_NEX (see app/(main)/layout.tsx),
        // so we read it synchronously and connect directly — native WebSockets, no fetch race.
        // Empty/missing url falls back to a same-origin connection for local dev.
        const socketUrl = clientEnv().SOCKET_URL;
        const socketInstance = io(socketUrl || undefined, {
            transports: ["polling", "websocket"],
            autoConnect: false,
        });
        socketRef.current = socketInstance;

        const onConnect = () => {
            setIsConnected(true);
            setSocket(socketInstance); // Triggers re-render asynchronously on connect
        };
        const onDisconnect = () => {
            setIsConnected(false);
            setSocket(null);
        };

        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.connect();

        return () => {
            socketInstance.off('connect', onConnect);
            socketInstance.off('disconnect', onDisconnect);
            socketInstance.disconnect();
            socketRef.current = null;
            setSocket(null);
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};