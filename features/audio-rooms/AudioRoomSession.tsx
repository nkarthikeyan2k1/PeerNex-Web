'use client';
import { useEffect, useRef, useState } from 'react';
import { clientEnv } from '@/lib/clientEnv';
import { io, Socket } from 'socket.io-client';

export default function AudioRoomSession({ room, onLeave }: { room: any, onLeave: () => void }) {
  const [peers, setPeers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    let socket: Socket;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;

        const socketUrl = clientEnv().SOCKET_URL || '';
        // Connect specifically to /audio namespace
        socket = io(socketUrl ? `${socketUrl}/audio` : '/audio', { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-room', room.id);
        });

        socket.on('room-users', (users: string[]) => {
          setPeers(users);
          users.forEach(userId => {
            const pc = createPeerConnection(userId, true);
            peersRef.current[userId] = pc;
          });
        });

        socket.on('user-joined', (userId: string) => {
          setPeers(prev => [...prev, userId]);
          const pc = createPeerConnection(userId, false);
          peersRef.current[userId] = pc;
        });

        socket.on('signal', async (payload: any) => {
          const { from, signal } = payload;
          // create a pc if it doesn't exist (can happen if signal comes before user-joined)
          let pc = peersRef.current[from];
          if (!pc) {
             pc = createPeerConnection(from, false);
             peersRef.current[from] = pc;
          }

          if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', { to: from, signal: pc.localDescription });
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal));
          }
        });

        socket.on('user-left', (userId: string) => {
          setPeers(prev => prev.filter(id => id !== userId));
          if (peersRef.current[userId]) {
            peersRef.current[userId].close();
            delete peersRef.current[userId];
          }
          if (audioRefs.current[userId]) {
             audioRefs.current[userId].pause();
             delete audioRefs.current[userId];
          }
        });

      } catch (err) {
        console.error('Failed to get local audio', err);
      }
    };

    init();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.values(peersRef.current).forEach(pc => pc.close());
    };
  }, [room.id]);

  const createPeerConnection = (targetUser: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('signal', { to: targetUser, signal: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (!audioRefs.current[targetUser]) {
        const audio = new Audio();
        audio.autoplay = true;
        audioRefs.current[targetUser] = audio;
      }
      audioRefs.current[targetUser].srcObject = e.streams[0];
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    if (isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socketRef.current?.emit('signal', { to: targetUser, signal: offer });
      });
    }

    return pc;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-6 w-full">
      <div className="glass-card p-10 rounded-3xl max-w-2xl w-full flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-2 text-cyan-400">{room.name}</h2>
        <p className="text-gray-400 mb-8 text-center">{room.desc}</p>
        
        <div className="flex flex-col items-center justify-center mb-10 w-full py-12 bg-black/30 rounded-2xl">
          <div className="relative">
            <div className="w-24 h-24 bg-cyan-600/20 rounded-full flex items-center justify-center animate-pulse absolute -inset-4"></div>
            <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center z-10 relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic text-white"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
          </div>
          <p className="mt-6 text-xl font-medium">{peers.length} {peers.length === 1 ? 'person' : 'people'} listening</p>
        </div>

        <button 
          onClick={onLeave}
          className="px-8 py-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full font-medium transition-colors border border-red-500/30"
        >
          Leave Station
        </button>
      </div>
    </div>
  );
}
