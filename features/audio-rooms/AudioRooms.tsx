'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Mic, 
  MicOff, 
  Search, 
  Share2, 
  ArrowLeft, 
  Sparkles, 
  Lock, 
  Radio, 
  Users, 
  Link as LinkIcon,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { clientEnv } from '@/lib/clientEnv';
import { STATIONS } from './stationsData';
import './audio-rooms.scss';

interface PeerUser {
  id: string;
  name: string;
  avatarColor: string;
  isMuted?: boolean;
}

export default function AudioRooms() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderPref, setGenderPref] = useState<'any' | 'male' | 'female'>('any');
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio & WebRTC State
  const [isMuted, setIsMuted] = useState(false);
  const [localAudioActive, setLocalAudioActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<PeerUser[]>([]);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

  // User identity
  const [userName] = useState<string>('Karthi');
  const userInitial = userName.charAt(0).toUpperCase();
  const userColor = '#00dce5';

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const audioElements = useRef<Record<string, HTMLAudioElement>>({});

  const activeStation = STATIONS.find((s) => s.id === activeRoomId) || null;
  const trendingStation = STATIONS[0]; // Chennai Central

  // ─── Socket.IO Connection ────────────────────────────────────────────────
  useEffect(() => {
    const socketUrl = clientEnv().SOCKET_URL || '';
    const socket = io(socketUrl ? `${socketUrl}/audio` : '/audio', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('room-counts', (counts: Record<string, number>) => {
      setLiveCounts(counts);
    });

    socket.on('room-error', (data: { roomId: string; message: string }) => {
      setErrorMessage(data.message);
      setActiveRoomId(null);
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ─── Room WebRTC Lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    if (!activeRoomId) return;

    let isMounted = true;

    const startRoomSession = async () => {
      try {
        setMicError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalAudioActive(true);
        setIsMuted(false);

        const socket = socketRef.current;
        if (!socket) return;

        // Join room with user metadata
        socket.emit('join-room', {
          roomId: activeRoomId,
          name: userName,
          avatarColor: userColor,
          isMuted: false,
        });

        // Existing users in the room
        socket.on('room-users', (users: PeerUser[]) => {
          setConnectedPeers(users);
          users.forEach((user) => {
            const pc = createPeerConnection(user.id, true);
            peerConnections.current[user.id] = pc;
          });
        });

        // When a new user joins
        socket.on('user-joined', (user: PeerUser) => {
          setConnectedPeers((prev) => {
            const exists = prev.some((p) => p.id === user.id);
            return exists ? prev : [...prev, user];
          });
          const pc = createPeerConnection(user.id, false);
          peerConnections.current[user.id] = pc;
        });

        // Signaling exchange
        socket.on('signal', async (payload: { from: string; signal: any }) => {
          const { from, signal } = payload;
          let pc = peerConnections.current[from];
          if (!pc) {
            pc = createPeerConnection(from, false);
            peerConnections.current[from] = pc;
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

        // Peer mute status change
        socket.on('user-mute-change', ({ id, isMuted: muted }: { id: string; isMuted: boolean }) => {
          setConnectedPeers((prev) =>
            prev.map((p) => (p.id === id ? { ...p, isMuted: muted } : p))
          );
        });

        // When a user leaves
        socket.on('user-left', (userId: string) => {
          setConnectedPeers((prev) => prev.filter((p) => p.id !== userId));
          if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
          }
          if (audioElements.current[userId]) {
            audioElements.current[userId].pause();
            audioElements.current[userId].remove();
            delete audioElements.current[userId];
          }
        });
      } catch (err: any) {
        console.error('Microphone error:', err);
        setMicError('Microphone not allowed. Tap mic to retry.');
        setLocalAudioActive(false);
      }
    };

    startRoomSession();

    return () => {
      isMounted = false;
      const socket = socketRef.current;
      if (socket) {
        socket.emit('leave-room', activeRoomId);
        socket.off('room-users');
        socket.off('user-joined');
        socket.off('signal');
        socket.off('user-mute-change');
        socket.off('user-left');
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};

      Object.values(audioElements.current).forEach((audio) => {
        audio.pause();
        audio.remove();
      });
      audioElements.current = {};

      setConnectedPeers([]);
      setLocalAudioActive(false);
    };
  }, [activeRoomId, userName]);

  // ─── WebRTC Peer Connection Helper ───────────────────────────────────────
  const createPeerConnection = (targetUserId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit('signal', { to: targetUserId, signal: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (!audioElements.current[targetUserId]) {
        const audio = new Audio();
        audio.autoplay = true;
        audioElements.current[targetUserId] = audio;
      }
      audioElements.current[targetUserId].srcObject = e.streams[0];
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    if (isInitiator) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socketRef.current?.emit('signal', { to: targetUserId, signal: offer });
      });
    }

    return pc;
  };

  // ─── Join Room with 6-User Limit Check ────────────────────────────────────
  const handleJoinRoom = (roomId: string) => {
    const currentUsers = liveCounts[roomId] || 0;
    if (currentUsers >= 6) {
      setErrorMessage('This lounge is currently full (6/6 users). Maximum limit is 6 people.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    setActiveRoomId(roomId);
  };

  // ─── Microphone Toggle ───────────────────────────────────────────────────
  const toggleMute = () => {
    if (!localStreamRef.current) {
      if (activeRoomId) {
        const current = activeRoomId;
        setActiveRoomId(null);
        setTimeout(() => setActiveRoomId(current), 50);
      }
      return;
    }

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);

    if (socketRef.current && activeRoomId) {
      socketRef.current.emit('mute-toggle', nextMuted);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // ─── Filter Stations ─────────────────────────────────────────────────────
  const filteredStations = STATIONS.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="pnx-audio">
      {/* ── Error Banner Toast ───────────────────────────────────────────── */}
      {errorMessage && (
        <div className="pnx-audio__error-banner">
          <AlertCircle size={18} color="#ef4444" />
          <span>{errorMessage}</span>
          <button
            className="pnx-audio__error-banner-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Modern Topbar ────────────────────────────────────────────────── */}
      <header className="pnx-audio__topbar">
        <Link href="/" className="pnx-audio__topbar-brand">
          <span className="pnx-audio__topbar-brand-name">PeerNex</span>
          <span className="pnx-audio__topbar-brand-tag">Voice</span>
        </Link>

        <div className="pnx-audio__topbar-status">
          <span className="pnx-audio__topbar-status-dot" />
          <span>3 Active Public Lounges (Max 6 / lounge)</span>
        </div>

        <div className="pnx-audio__topbar-user">
          <div className="pnx-audio__topbar-user-avatar">{userInitial}</div>
          <span className="pnx-audio__topbar-user-name">{userName}</span>
        </div>
      </header>

      {/* ── Main View Container ─────────────────────────────────────────── */}
      <div className="pnx-audio__container">
        {activeStation ? (
          /* ══════════════════════════════════════════════════════════════════
             IN-ROOM EXPERIENCE (REAL USERS + MAX 6 LIMIT)
             ══════════════════════════════════════════════════════════════════ */
          <div className="pnx-audio__stage">
            {/* Stage Header */}
            <div className="pnx-audio__stage-header">
              <div className="pnx-audio__stage-header-left">
                <button
                  className="pnx-audio__stage-header-back-btn"
                  onClick={() => setActiveRoomId(null)}
                >
                  <ArrowLeft size={16} />
                  <span>All Lounges</span>
                </button>
                <div className="pnx-audio__stage-header-title-box">
                  <h1 className="pnx-audio__stage-header-title">
                    <span>{activeStation.name}</span>
                  </h1>
                  <div className="pnx-audio__stage-header-meta">
                    <span>{activeStation.city}, {activeStation.state}</span>
                    <span>•</span>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>
                      Live ({1 + connectedPeers.length} / {activeStation.maxCapacity})
                    </span>
                  </div>
                </div>
              </div>

              <div className="pnx-audio__stage-header-right">
                <button className="pnx-audio__stage-header-share-btn" onClick={handleShare}>
                  {copiedLink ? <Check size={15} color="#22c55e" /> : <Share2 size={15} />}
                  <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Speakers Grid ("On Stage") - Real Users */}
            <div>
              <div className="pnx-audio__stage-section-title">
                <Radio size={14} color="#00dce5" />
                <span>Speakers On Stage ({1 + connectedPeers.length} / 6)</span>
              </div>

              <div className="pnx-audio__stage-speakers-grid">
                {/* Local Real User Tile */}
                <div
                  className={`pnx-audio__stage-speaker-tile pnx-audio__stage-speaker-tile--me ${
                    !isMuted && localAudioActive ? 'pnx-audio__stage-speaker-tile--speaking' : ''
                  }`}
                >
                  <div className="pnx-audio__stage-speaker-tile-avatar-wrap">
                    <div
                      className="pnx-audio__stage-speaker-tile-avatar"
                      style={{ background: 'linear-gradient(135deg, #00dce5, #0284c7)' }}
                    >
                      {userInitial}
                    </div>
                    {!isMuted && localAudioActive && (
                      <div className="pnx-audio__stage-speaker-tile-wave-ring" />
                    )}
                    {isMuted && (
                      <div className="pnx-audio__stage-speaker-tile-mute-badge">
                        <MicOff size={13} />
                      </div>
                    )}
                  </div>
                  <span className="pnx-audio__stage-speaker-tile-name">{userName} (You)</span>
                  <span className="pnx-audio__stage-speaker-tile-role">Speaker</span>
                </div>

                {/* Real Remote Connected Users */}
                {connectedPeers.map((peer) => (
                  <div
                    key={peer.id}
                    className="pnx-audio__stage-speaker-tile"
                  >
                    <div className="pnx-audio__stage-speaker-tile-avatar-wrap">
                      <div
                        className="pnx-audio__stage-speaker-tile-avatar"
                        style={{ backgroundColor: peer.avatarColor || '#38bdf8' }}
                      >
                        {peer.name.charAt(0).toUpperCase()}
                      </div>
                      {peer.isMuted && (
                        <div className="pnx-audio__stage-speaker-tile-mute-badge">
                          <MicOff size={13} />
                        </div>
                      )}
                    </div>
                    <span className="pnx-audio__stage-speaker-tile-name">{peer.name}</span>
                    <span className="pnx-audio__stage-speaker-tile-role">Speaker</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audience / In Lounge Section (3 placeholder members + real listeners) */}
            <div className="pnx-audio__stage-listeners-box">
              <div className="pnx-audio__stage-section-title" style={{ marginBottom: '10px' }}>
                <Users size={14} color="#64748b" />
                <span>In Lounge ({activeStation.defaultParticipants.length + 1 + connectedPeers.length})</span>
              </div>
              <div className="pnx-audio__stage-listeners-list">
                <div className="pnx-audio__stage-listener-chip">
                  <div
                    className="pnx-audio__stage-listener-chip-avatar"
                    style={{ background: '#00dce5', color: '#031c20' }}
                  >
                    {userInitial}
                  </div>
                  <span>{userName} (You)</span>
                </div>
                {connectedPeers.map((peer) => (
                  <div key={peer.id} className="pnx-audio__stage-listener-chip">
                    <div
                      className="pnx-audio__stage-listener-chip-avatar"
                      style={{ backgroundColor: peer.avatarColor || '#38bdf8' }}
                    >
                      {peer.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{peer.name}</span>
                  </div>
                ))}
                {activeStation.defaultParticipants.map((p, idx) => (
                  <div key={idx} className="pnx-audio__stage-listener-chip">
                    <div
                      className="pnx-audio__stage-listener-chip-avatar"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.initial}
                    </div>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Apple/Linear Style Dock Controls */}
            <div className="pnx-audio__dock">
              <button
                className={`pnx-audio__dock-mic-btn ${
                  isMuted || !localAudioActive
                    ? 'pnx-audio__dock-mic-btn--muted'
                    : 'pnx-audio__dock-mic-btn--live'
                }`}
                onClick={toggleMute}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted || !localAudioActive ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <div className="pnx-audio__dock-info">
                <span className="pnx-audio__dock-info-status">
                  {micError ? 'Mic blocked' : isMuted ? 'Muted' : 'Speaking'}
                </span>
                <span className="pnx-audio__dock-info-hint">
                  {isMuted ? 'Tap mic to speak' : 'Mic live on stage'}
                </span>
              </div>

              <button
                className="pnx-audio__dock-btn"
                onClick={handleShare}
                title="Copy lounge invite"
              >
                <LinkIcon size={18} />
              </button>

              <button
                className="pnx-audio__dock-leave-btn"
                onClick={() => setActiveRoomId(null)}
              >
                <ArrowLeft size={16} />
                <span>Leave</span>
              </button>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════════
             LOBBY & DISCOVERY VIEW (ONLY 3 ROOMS + MAX 6 LIMIT)
             ══════════════════════════════════════════════════════════════════ */
          <>
            {/* Spotlight Row: 1-to-1 Voice (Coming Soon) & Featured Lounge */}
            <section className="pnx-audio__spotlight">
              {/* 1-to-1 Voice Card */}
              <div className="pnx-audio__spotlight-card">
                <div>
                  <div className="pnx-audio__spotlight-card-header">
                    <span className="pnx-audio__spotlight-card-badge">
                      <Sparkles size={12} />
                      <span>Instant Voice Match</span>
                    </span>
                    <span className="pnx-audio__spotlight-card-tag-soon">Coming Soon</span>
                  </div>

                  <h2 className="pnx-audio__spotlight-card-title">1-to-1 Private Voice</h2>
                  <p className="pnx-audio__spotlight-card-desc">
                    Connect anonymously with real people worldwide through low-latency peer-to-peer audio.
                    Filter by preference or match with anyone instantly.
                  </p>

                  <div className="pnx-audio__spotlight-card-preferences">
                    <span className="pnx-audio__spotlight-card-preferences-label">Match:</span>
                    <button
                      className={`pnx-audio__spotlight-card-preferences-btn ${
                        genderPref === 'any' ? 'pnx-audio__spotlight-card-preferences-btn--active' : ''
                      }`}
                      onClick={() => setGenderPref('any')}
                    >
                      <Sparkles size={13} />
                      <span>Any</span>
                    </button>
                    <button
                      className="pnx-audio__spotlight-card-preferences-btn pnx-audio__spotlight-card-preferences-btn--locked"
                      onClick={() => setGenderPref('male')}
                    >
                      <span>Male</span>
                      <Lock size={12} />
                    </button>
                    <button
                      className="pnx-audio__spotlight-card-preferences-btn pnx-audio__spotlight-card-preferences-btn--locked"
                      onClick={() => setGenderPref('female')}
                    >
                      <span>Female</span>
                      <Lock size={12} />
                    </button>
                  </div>
                </div>

                <div className="pnx-audio__spotlight-card-cta">
                  <button className="pnx-audio__spotlight-card-cta-btn pnx-audio__spotlight-card-cta-btn--soon" disabled>
                    <Mic size={16} />
                    <span>Start 1-to-1 Call (Coming Soon)</span>
                  </button>
                  <span className="pnx-audio__spotlight-card-cta-note">
                    Early access rolls out next week
                  </span>
                </div>
              </div>

              {/* Trending Lounge Spotlight */}
              {trendingStation && (
                <div className="pnx-audio__spotlight-trending">
                  <div>
                    <div className="pnx-audio__spotlight-trending-badge">
                      <Radio size={14} />
                      <span>Featured Lounge</span>
                    </div>
                    <h3 className="pnx-audio__spotlight-trending-title">{trendingStation.name}</h3>
                    <p className="pnx-audio__spotlight-trending-desc">{trendingStation.desc}</p>
                  </div>

                  <div className="pnx-audio__spotlight-trending-meta">
                    <div className="pnx-audio__spotlight-trending-meta-speaker">
                      <span>🗣️</span>
                      <span>
                        {(liveCounts[trendingStation.id] || 0) >= 6
                          ? 'Full (6/6)'
                          : `${liveCounts[trendingStation.id] || 0} / 6 active`}
                      </span>
                    </div>
                    <button
                      className="pnx-audio__spotlight-trending-meta-action"
                      onClick={() => handleJoinRoom(trendingStation.id)}
                    >
                      {(liveCounts[trendingStation.id] || 0) >= 6 ? 'Lounge Full' : 'Hop In Now →'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Header & Search */}
            <section className="pnx-audio__filter-section">
              <h2 className="pnx-audio__filter-section-title">Public Audio Lounges</h2>

              <div className="pnx-audio__filter-section-controls">
                <div className="pnx-audio__filter-section-search">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Search lounges..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Only the 3 Lounges Grid */}
            <section className="pnx-audio__grid">
              {filteredStations.map((station) => {
                const realCount = liveCounts[station.id] || 0;
                const isFull = realCount >= station.maxCapacity;

                return (
                  <div
                    key={station.id}
                    className="pnx-audio__card"
                    onClick={() => handleJoinRoom(station.id)}
                  >
                    <div>
                      <div className="pnx-audio__card-top">
                        <span className="pnx-audio__card-region">{station.state}</span>
                        <div
                          className="pnx-audio__card-live-tag"
                          style={
                            isFull
                              ? { color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)' }
                              : {}
                          }
                        >
                          <span
                            className="pnx-audio__card-live-tag-dot"
                            style={isFull ? { backgroundColor: '#ef4444' } : {}}
                          />
                          <span>{isFull ? 'FULL (6/6)' : `${realCount} / ${station.maxCapacity} Active`}</span>
                        </div>
                      </div>

                      <h3 className="pnx-audio__card-title">{station.name}</h3>
                      <div className="pnx-audio__card-location">
                        {station.city}, {station.state}
                      </div>
                      <p className="pnx-audio__card-desc">{station.desc}</p>
                    </div>

                    <div className="pnx-audio__card-footer">
                      <div className="pnx-audio__card-speakers">
                        <div className="pnx-audio__card-speakers-avatars">
                          {station.defaultParticipants.slice(0, 3).map((p, i) => (
                            <div
                              key={i}
                              className="pnx-audio__card-speakers-circle"
                              style={{ backgroundColor: p.color }}
                            >
                              {p.initial}
                            </div>
                          ))}
                        </div>
                        <span className="pnx-audio__card-speakers-count">
                          {station.speakerNote}
                        </span>
                      </div>

                      <button
                        className="pnx-audio__card-join-btn"
                        style={
                          isFull
                            ? { opacity: 0.6, cursor: 'not-allowed', background: '#1c1520', color: '#f87171' }
                            : {}
                        }
                      >
                        <span>{isFull ? 'Full' : 'Join'}</span>
                        <span>{isFull ? '🔒' : '→'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
