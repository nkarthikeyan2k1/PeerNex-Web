'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import type { ChatState } from '@/features/chat/types';
import { ICE_SERVERS } from '@/Constant/ICE_Constant';

/** Peer's mic/cam state. A disabled track still sends (black/silent) frames, so
 *  the receiver can't detect it — each side announces it explicitly instead. */
export interface MediaState {
  micOff: boolean;
  camOff: boolean;
}

const MEDIA_ON: MediaState = { micOff: false, camOff: false };

type SignalPayload =
  | { type: RTCSdpType; sdp: string }
  | { candidate: RTCIceCandidateInit }
  | { media: MediaState };

interface UseWebRTCParams {
  socket: Socket | null;
  /** Drives connection teardown — any state other than 'connected' closes the peer. */
  chatState: ChatState;
  /** Local media tracks to publish, owned by `useLocalMedia`. */
  localStreamRef: RefObject<MediaStream | null>;
  /** Local mic/cam toggles — announced to the peer so their UI can reflect them. */
  micOff: boolean;
  camOff: boolean;
}

/**
 * Sets up the RTCPeerConnection when the session matches a peer and exchanges
 * SDP/ICE over the socket. Runs only inside the video chat; the text chat never
 * mounts it. Teardown is driven off `chatState` so next / stop / peerLeft /
 * disconnect all converge on a single close path.
 */
export function useWebRTC({ socket, chatState, localStreamRef, micOff, camOff }: UseWebRTCParams) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteMedia, setRemoteMedia] = useState<MediaState>(MEDIA_ON);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);

  const closePeerConnection = () => {
    peerConnRef.current?.close();
    peerConnRef.current = null;
    setRemoteStream(null);
    setRemoteMedia(MEDIA_ON);
  };

  // While a call is live, tear the peer connection down when we leave it — the
  // cleanup fires on next / stop / peerLeft / disconnect / unmount alike.
  useEffect(() => {
    if (chatState !== 'connected') return;
    return () => closePeerConnection();
  }, [chatState]);

  // Announce our mic/cam state on every match (so a camera turned off during
  // preview is reflected right away) and whenever it changes mid-call. Rides
  // the server's generic `signal` relay — no server-side change needed.
  useEffect(() => {
    if (!socket || chatState !== 'connected') return;
    socket.emit('signal', { signal: { media: { micOff, camOff } } });
  }, [socket, chatState, micOff, camOff]);

  useEffect(() => {
    if (!socket) return;

    // Server sends { roomId, isInitiator }. The initiator creates the offer.
    const onMatched = async ({ isInitiator }: { roomId: string; isInitiator: boolean }) => {
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

    const onSignal = async ({ signal }: { signal: SignalPayload }) => {
      if ('media' in signal) {
        setRemoteMedia(signal.media);
        return;
      }

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

    socket.on('matched', onMatched);
    socket.on('signal',  onSignal);

    return () => {
      socket.off('matched', onMatched);
      socket.off('signal',  onSignal);
    };
  }, [socket, localStreamRef]);

  return { remoteStream, remoteMedia };
}
