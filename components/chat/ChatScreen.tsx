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
import { ICE_SERVERS } from '@/Constant/ICE_Constant';

interface LocalMessage {
  event: string;
  message: string;
}

type SignalPayload =
  | { type: RTCSdpType; sdp: string }
  | { candidate: RTCIceCandidateInit };

interface ChatScreenProps {
  initialMode?: ChatMode;
}

const ChatScreen = ({ initialMode = 'text' }: ChatScreenProps) => {
  const { socket, isConnected } = useSocket();
  const [value] = useLocalStorage('interests', '');

  const [chatState, setChatState] = useState<ChatState>('idle');
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [text, setText] = useState('');
  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const mode = initialMode;
  const [online, setOnline] = useState(16128);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // refs let socket callbacks read latest state without stale closures
  const chatStateRef = useRef<ChatState>('idle');
  const valueRef = useRef(value);
  const modeRef = useRef(mode);

  useEffect(() => { chatStateRef.current = chatState; }, [chatState]);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const iv = setInterval(
      () => setOnline(n => n + Math.floor(Math.random() * 7) - 3),
      2600,
    );
    return () => clearInterval(iv);
  }, []);

  // Acquire camera/mic only when in video mode; release when leaving
  useEffect(() => {
    if (mode !== 'video') return;

    // getUserMedia is async — if we navigate away before it resolves, the
    // cleanup below runs while the stream is still pending. This flag lets the
    // late-resolving promise stop its own tracks instead of leaking the camera.
    let cancelled = false;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        setMediaError(null);
      })
      .catch((err: DOMException) => {
        console.log('err', err)
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMediaError('Camera access blocked. Allow access in your browser site settings and reload.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMediaError('No camera or microphone found on this device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setMediaError('Camera is in use by another app. Close it and reload.');
        } else {
          setMediaError('Could not access camera or microphone.');
        }
      });

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setMediaError(null);
    };
  }, [mode]);

  // Sync mic/cam enabled state to live tracks
  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOff; });
  }, [micOff]);

  useEffect(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOff; });
  }, [camOff]);

  const closePeerConnection = () => {
    peerConnRef.current?.close();
    peerConnRef.current = null;
    setRemoteStream(null);
  };

  const connected = chatState === 'connected';

  const handleStart = () => {
    if (!socket || !isConnected) return;
    socket.emit('findPeer', { event: 'findPeer', type: mode, interests: value });
    setChatState('searching');
    setMessages([]);
  };

  const handleNext = () => {
    if (!socket || !isConnected) return;
    closePeerConnection();
    socket.emit('skipPeer');
    socket.emit('findPeer', { event: 'findPeer', type: mode, interests: value });
    setChatState('searching');
    setMessages([]);
  };

  const handleStop = () => {
    if (!socket || !isConnected) return;
    closePeerConnection();
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
      closePeerConnection();
      setChatState('idle');
      setMessages([]);
    };

    const onChatMessage = (data: LocalMessage) => {
      setMessages(prev => [...prev, data]);
    };

    // Server sends { roomId, isInitiator }. The initiator creates the offer.
    const onMatched = async ({ isInitiator }: { roomId: string; isInitiator: boolean }) => {
      setChatState('connected');
      setMessages(prev => [
        ...prev,
        { event: 'system', message: 'Connected — say hello!' },
      ]);

      if (modeRef.current !== 'video') return;

      closePeerConnection();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnRef.current = pc;

      localStreamRef.current?.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });

      pc.ontrack = (event) => {
        if (event.streams[0]) setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('signal', { signal: { candidate: event.candidate.toJSON() } });
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('signal', { signal: { type: offer.type, sdp: offer.sdp } });
      }
    };

    const onPeerLeft = () => {
      if (chatStateRef.current === 'connected') {
        closePeerConnection();
        setChatState('searching');
        setMessages([]);
        socket.emit('findPeer', {
          event: 'findPeer',
          type: modeRef.current,
          interests: valueRef.current,
        });
      }
    };

    const onSignal = async ({ signal }: { signal: SignalPayload }) => {
      const pc = peerConnRef.current;
      if (!pc) return;

      if ('type' in signal) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        if (signal.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { signal: { type: answer.type, sdp: answer.sdp } });
        }
      } else {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    };

    socket.on('disconnect',  onDisconnect);
    socket.on('chatMessage', onChatMessage);
    socket.on('matched',     onMatched);
    socket.on('peerLeft',    onPeerLeft);
    socket.on('signal',      onSignal);

    return () => {
      socket.off('disconnect',  onDisconnect);
      socket.off('chatMessage', onChatMessage);
      socket.off('matched',     onMatched);
      socket.off('peerLeft',    onPeerLeft);
      socket.off('signal',      onSignal);
    };
  }, [socket]);

  return (
    <div className={`chat-screen${mode === 'video' ? ' chat-screen--video' : ''}`}>

      <ChatTopBar
        mode={mode}
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
          localStream={localStream}
          remoteStream={remoteStream}
          mediaError={mediaError}
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
            <ConnectState state={chatState} onStart={handleStart} onCancel={handleStop} />
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
