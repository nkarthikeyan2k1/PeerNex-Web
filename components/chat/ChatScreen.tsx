'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ChatTopBar from './ChatTopBar';
import ConnectState from './ConnectState';
import Composer from './Composer';
import ChatLog from './ChatLog';
import VideoStage from './VideoStage';
import type { ChatMode, ChatState, Message } from './types';
import './ChatScreen.scss';

interface LocalMessage {
  event: string;
  message: string;
}

const ChatScreen = () => {
  const { socket, isConnected } = useSocket();
  const [value] = useLocalStorage('interests', '');

  const [chatState, setChatState] = useState<ChatState>('idle');
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [text, setText] = useState('');
  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [mode, setMode] = useState<ChatMode>('text');
  const [online, setOnline] = useState(16128);

  // lets socket callbacks read the latest state without stale closure
  const chatStateRef = useRef<ChatState>('idle');
  const valueRef     = useRef(value);

  useEffect(() => { chatStateRef.current = chatState; }, [chatState]);
  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    const iv = setInterval(
      () => setOnline(n => n + Math.floor(Math.random() * 7) - 3),
      2600,
    );
    return () => clearInterval(iv);
  }, []);

  const connected = chatState === 'connected';

  const handleStart = () => {
    if (!socket || !isConnected) return;
    socket.emit('findPeer', { event: 'findPeer', type: 'text', interests: value });
    setChatState('searching');
    setMessages([]);
  };

  const handleNext = () => {
    if (!socket || !isConnected) return;
    socket.emit('skipPeer');
    socket.emit('findPeer', { event: 'findPeer', type: 'text', interests: value });
    setChatState('searching');
    setMessages([]);
  };

  const handleStop = () => {
    if (!socket || !isConnected) return;
    socket.emit('skipPeer');
    setChatState('idle');
    setMessages([]);
  };

  const handleSendMessage = () => {
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

    // only auto-reconnect if user was mid-conversation, not if they stopped
    const onPeerLeft = () => {
      if (chatStateRef.current === 'connected') {
        setChatState('searching');
        setMessages([]);
        socket.emit('findPeer', {
          event: 'findPeer',
          type: 'text',
          interests: valueRef.current,
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

  return (
    <div className={`chat-screen${mode === 'video' ? ' chat-screen--video' : ''}`}>

      <ChatTopBar
        mode={mode}
        onModeChange={setMode}
        online={online}
        connected={connected}
      />

      {mode === 'video' ? (
        <VideoStage
          chatState={chatState}
          micOff={micOff}
          camOff={camOff}
          onMicToggle={() => setMicOff(v => !v)}
          onCamToggle={() => setCamOff(v => !v)}
          onNext={handleNext}
          onStop={handleStop}
          onStart={handleStart}
        >
          {connected ? (
            <ChatLog
              messages={messages.map((m, i): Message => ({
                id: i,
                who: m.event === 'sendMessage' ? 'you' : m.event === 'system' ? 'system' : 'stranger',
                text: m.message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                dot: m.event === 'system' ? 'var(--c-ok)' : undefined,
              }))}
              style="terminal"
              isTyping={false}
            />
          ) : (
            <div className="chat-screen__video-empty">
              Chat appears once you&apos;re connected.
            </div>
          )}
          <Composer
            state={chatState}
            text={text}
            onTextChange={setText}
            onSend={handleSendMessage}
            onNext={handleNext}
            onStop={handleStop}
          />
        </VideoStage>

      ) : (
        <>
          {!connected ? (
            <ConnectState state={chatState} onStart={handleStart} />
          ) : (
            <ChatLog
              messages={messages.map((m, i): Message => ({
                id: i,
                who: m.event === 'sendMessage' ? 'you' : m.event === 'system' ? 'system' : 'stranger',
                text: m.message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                dot: m.event === 'system' ? 'var(--c-ok)' : undefined,
              }))}
              style="terminal"
              isTyping={false}
            />
          )}
          <Composer
            state={chatState}
            text={text}
            onTextChange={setText}
            onSend={handleSendMessage}
            onNext={handleNext}
            onStop={handleStop}
          />
        </>

      )}

    </div>
  );
};

export default ChatScreen;