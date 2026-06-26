'use client';

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { ChatMode, ChatState } from '../types';

/** Wire-format message exchanged with the signalling server. */
export interface LocalMessage {
  event: string;
  message: string;
}

interface UseChatSessionParams {
  socket: Socket | null;
  isConnected: boolean;
  mode: ChatMode;
  interests: string;
}

/**
 * Owns the peer-matching state machine and message list shared by both the
 * text and video chats: find / skip / stop / send, plus the socket lifecycle
 * (chatMessage, matched, peerLeft, disconnect).
 *
 * It intentionally knows nothing about WebRTC — the video feature layers its
 * own `matched`/`signal` listeners on top via `useWebRTC`.
 */
export function useChatSession({ socket, isConnected, mode, interests }: UseChatSessionParams) {
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [text, setText] = useState('');

  // refs let socket callbacks read latest state without stale closures
  const chatStateRef = useRef<ChatState>('idle');
  const interestsRef = useRef(interests);
  const modeRef = useRef(mode);

  useEffect(() => { chatStateRef.current = chatState; }, [chatState]);
  useEffect(() => { interestsRef.current = interests; }, [interests]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const connected = chatState === 'connected';

  const start = () => {
    if (!socket || !isConnected) return;
    socket.emit('findPeer', { event: 'findPeer', type: mode, interests });
    setChatState('searching');
    setMessages([]);
  };

  const next = () => {
    if (!socket || !isConnected) return;
    socket.emit('skipPeer');
    socket.emit('findPeer', { event: 'findPeer', type: mode, interests });
    setChatState('searching');
    setMessages([]);
  };

  const stop = () => {
    if (!socket || !isConnected) return;
    socket.emit('skipPeer');
    setChatState('idle');
    setMessages([]);
  };

  const sendMessage = () => {
    if (!socket || !isConnected || !text.trim() || !connected) return;
    const msg: LocalMessage = { event: 'sendMessage', message: text };
    socket.emit('sendMessage', msg);
    setMessages(prev => [...prev, msg]);
    setText('');
  };

  useEffect(() => {
    if (!socket) return;

    const onDisconnect = () => {
      setChatState('idle');
      setMessages([]);
    };

    const onChatMessage = (data: LocalMessage) => {
      setMessages(prev => [...prev, data]);
    };

    const onMatched = () => {
      setChatState('connected');
      setMessages(prev => [
        ...prev,
        { event: 'system', message: 'Connected — say hello!' },
      ]);
    };

    const onPeerLeft = () => {
      if (chatStateRef.current === 'connected') {
        setChatState('searching');
        setMessages([]);
        socket.emit('findPeer', {
          event: 'findPeer',
          type: modeRef.current,
          interests: interestsRef.current,
        });
      }
    };

    socket.on('disconnect',  onDisconnect);
    socket.on('chatMessage', onChatMessage);
    socket.on('matched',     onMatched);
    socket.on('peerLeft',    onPeerLeft);

    return () => {
      socket.off('disconnect',  onDisconnect);
      socket.off('chatMessage', onChatMessage);
      socket.off('matched',     onMatched);
      socket.off('peerLeft',    onPeerLeft);
    };
  }, [socket]);

  return { chatState, connected, messages, text, setText, start, next, stop, sendMessage };
}
