'use client';

import { useEffect, useRef } from 'react';
import { User, VideoOff, Loader } from 'lucide-react';
import type { VideoTileState } from './types';
import './VideoTile.scss';

export interface VideoTileProps {
  /** Which participant this tile represents */
  who: 'you' | 'stranger';
  /** Display name shown in the name chip */
  label: string;
  /** Visual state — drives which overlay is shown */
  state: VideoTileState;
  /** Live MediaStream — when provided and state === 'live', shown in <video> */
  stream?: MediaStream | null;
  /** Mute the audio track — always true for the "you" tile to avoid feedback */
  muted?: boolean;
  /** Render as a small picture-in-picture tile */
  pip?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <div className="video-tile__live-badge" aria-label="Live">
      <span className="video-tile__live-dot" aria-hidden />
      <span className="video-tile__live-text">LIVE</span>
    </div>
  );
}

function NameChip({
  label,
  state,
}: {
  label: string;
  state: VideoTileState;
}) {
  return (
    <div className="video-tile__name-chip">
      <span
        className={`video-tile__name-dot video-tile__name-dot--${state}`}
        aria-hidden
      />
      <span className="video-tile__name-label">{label}</span>
    </div>
  );
}

function WaitingOverlay() {
  return (
    <div className="video-tile__overlay">
      <div className="video-tile__avatar">
        <Loader size={28} strokeWidth={1.5} className="video-tile__spinner" aria-hidden />
      </div>
      <p className="video-tile__overlay-text">Waiting for peer…</p>
    </div>
  );
}

function CamOffOverlay({ label }: { label: string }) {
  return (
    <div className="video-tile__overlay">
      <div className="video-tile__avatar">
        <User size={28} strokeWidth={1.5} aria-hidden />
      </div>
      <p className="video-tile__overlay-text">
        <VideoOff size={13} strokeWidth={2} aria-hidden />
        {label} · Camera off
      </p>
    </div>
  );
}

function LetterAvatar({ label, pip }: { label: string; pip: boolean }) {
  return (
    <div className="video-tile__letter-wrap">
      <div className={`video-tile__letter-circle${pip ? ' video-tile__letter-circle--pip' : ''}`}>
        {label.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function VideoTile({
  who,
  label,
  state,
  stream,
  muted = false,
  pip = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach MediaStream to the video element whenever it changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream ?? null;
  }, [stream]);

  const showVideo      = state === 'live' && !!stream;
  const showLetterAv   = state === 'live' && !stream;
  const showWaiting    = state === 'waiting';
  const showCamOff     = state === 'cam-off';

  return (
    <div
      className={[
        'video-tile',
        `video-tile--${who}`,
        pip ? 'video-tile--pip' : '',
        `video-tile--${state}`,
      ]
        .filter(Boolean)
        .join(' ')}
      role="figure"
      aria-label={`${label} video`}
    >
      {/* Video element — always in DOM so srcObject assignment is stable */}
      <video
        ref={videoRef}
        className="video-tile__video"
        autoPlay
        playsInline
        muted={muted}
        aria-hidden={!showVideo}
        style={{ display: showVideo ? 'block' : 'none' }}
      />

      {/* State overlays */}
      {showLetterAv && <LetterAvatar label={label} pip={pip} />}
      {showWaiting  && <WaitingOverlay />}
      {showCamOff   && <CamOffOverlay label={label} />}

      {/* Persistent badges — shown on top of video or overlays */}
      {state === 'live' && <LiveBadge />}
      <NameChip label={label} state={state} />
    </div>
  );
}
