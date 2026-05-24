'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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

        // Initialize the socket once on client side
        const socketInstance = io("http://localhost:3001", {
            transports: ["websocket", "polling"],
            autoConnect: false, // Connect manually in useEffect
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

        // Manually trigger connect
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