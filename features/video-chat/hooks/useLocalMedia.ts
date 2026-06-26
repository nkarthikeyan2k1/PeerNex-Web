'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Acquires the local camera/mic while `active`, exposes mic/cam mute toggles,
 * and releases all tracks on cleanup. The raw stream is also surfaced as a ref
 * so `useWebRTC` can attach its tracks to the peer connection.
 */
export function useLocalMedia(active: boolean) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) return;

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
  }, [active]);

  // Sync mic/cam enabled state to live tracks
  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOff; });
  }, [micOff]);

  useEffect(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOff; });
  }, [camOff]);

  return {
    localStream,
    localStreamRef,
    mediaError,
    micOff,
    camOff,
    toggleMic: () => setMicOff(v => !v),
    toggleCam: () => setCamOff(v => !v),
  };
}
