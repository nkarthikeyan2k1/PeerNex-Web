'use client';

import { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, SkipForward, X, MessageSquare } from 'lucide-react';
import VideoTile from './VideoTile';
import ConnectState from './ConnectState';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { ChatState } from './types';
import './VideoStage.scss';

export interface VideoStageProps {
  chatState: ChatState;
  micOff: boolean;
  camOff: boolean;
  onMicToggle: () => void;
  onCamToggle: () => void;
  onNext: () => void;
  onStop: () => void;
  onStart: () => void;
  /** Side chat panel: ChatLog + Composer passed from ChatScreen */
  children: React.ReactNode;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  mediaError?: string | null;
}

// ─── Control bar ─────────────────────────────────────────────────────────────

interface ControlBarProps {
  chatState: ChatState;
  micOff: boolean;
  camOff: boolean;
  onMicToggle: () => void;
  onCamToggle: () => void;
  onNext: () => void;
  onStop: () => void;
}

function ControlBar({
  chatState,
  micOff,
  camOff,
  onMicToggle,
  onCamToggle,
  onNext,
  onStop,
}: ControlBarProps) {
  const connected  = chatState === 'connected';
  const actionable = chatState !== 'idle';

  return (
    <div className="vs-controls">
      <button
        className={`vs-controls__btn${micOff ? ' vs-controls__btn--off' : ''}`}
        onClick={onMicToggle}
        disabled={!connected}
        aria-label={micOff ? 'Unmute mic' : 'Mute mic'}
        title="Mic"
      >
        {micOff ? <MicOff size={18} strokeWidth={1.75} /> : <Mic size={18} strokeWidth={1.75} />}
      </button>

      <button
        className={`vs-controls__btn${camOff ? ' vs-controls__btn--off' : ''}`}
        onClick={onCamToggle}
        disabled={!connected}
        aria-label={camOff ? 'Turn camera on' : 'Turn camera off'}
        title="Camera"
      >
        {camOff
          ? <VideoOff size={18} strokeWidth={1.75} />
          : <Video    size={18} strokeWidth={1.75} />}
      </button>

      <button
        className="vs-controls__btn vs-controls__btn--next"
        onClick={onNext}
        disabled={!actionable}
        aria-label="Next peer"
        title="Next (Esc)"
      >
        <SkipForward size={16} strokeWidth={2} aria-hidden />
        Next
      </button>

      <button
        className="vs-controls__btn vs-controls__btn--end"
        onClick={onStop}
        disabled={!actionable}
        aria-label="End session"
        title="End"
      >
        <X size={18} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function VideoStage({
  chatState,
  micOff,
  camOff,
  onMicToggle,
  onCamToggle,
  onNext,
  onStop,
  onStart,
  children,
  localStream,
  remoteStream,
  mediaError,
}: VideoStageProps) {
  const connected = chatState === 'connected';
  const isMobile = useIsMobile();
  const [chatOpen, setChatOpen] = useState(false);

  const youState = mediaError
    ? 'blocked'
    : camOff
      ? 'cam-off'
      : localStream
        ? 'live'
        : 'waiting';

  // ── Mobile: immersive full-bleed video + slide-up chat sheet ────────────────
  if (isMobile) {
    return (
      <div className="video-stage video-stage--mobile">
        {connected ? (
          <>
            <VideoTile
              who="stranger"
              label="Stranger"
              state={remoteStream ? 'live' : 'waiting'}
              stream={remoteStream}
            />
            <div className="video-stage__pip video-stage__pip--mobile">
              <VideoTile
                who="you"
                label="You"
                state={youState}
                muted
                pip
                stream={localStream}
                errorMessage={mediaError ?? undefined}
              />
            </div>

            {/* Floating glass control bar */}
            <div className="vs-float">
              <button
                className={`vs-float__btn${micOff ? ' vs-float__btn--off' : ''}`}
                onClick={onMicToggle}
                aria-label={micOff ? 'Unmute mic' : 'Mute mic'}
                title="Mic"
              >
                {micOff ? <MicOff size={18} strokeWidth={1.75} /> : <Mic size={18} strokeWidth={1.75} />}
              </button>
              <button
                className={`vs-float__btn${camOff ? ' vs-float__btn--off' : ''}`}
                onClick={onCamToggle}
                aria-label={camOff ? 'Turn camera on' : 'Turn camera off'}
                title="Camera"
              >
                {camOff ? <VideoOff size={18} strokeWidth={1.75} /> : <Video size={18} strokeWidth={1.75} />}
              </button>
              <button
                className="vs-float__btn"
                onClick={() => setChatOpen(true)}
                aria-label="Open chat"
                title="Chat"
              >
                <MessageSquare size={18} strokeWidth={1.75} />
              </button>
              <button
                className="vs-float__btn vs-float__btn--next"
                onClick={onNext}
                aria-label="Next peer"
                title="Next"
              >
                <SkipForward size={18} strokeWidth={2} />
              </button>
              <button
                className="vs-float__btn vs-float__btn--end"
                onClick={onStop}
                aria-label="End session"
                title="End"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          </>
        ) : (
          <div className="video-stage__idle-box video-stage__idle-box--mobile">
            <ConnectState state={chatState} onStart={onStart} onCancel={onStop} />
          </div>
        )}

        {/* Chat bottom sheet */}
        {connected && (
          <>
            <div
              className={`vs-sheet-scrim${chatOpen ? ' vs-sheet-scrim--open' : ''}`}
              onClick={() => setChatOpen(false)}
              aria-hidden
            />
            <div className={`vs-sheet${chatOpen ? ' vs-sheet--open' : ''}`} role="dialog" aria-label="Live chat">
              <div className="vs-sheet__header">
                <span className="vs-sheet__title">
                  <MessageSquare size={15} strokeWidth={2} aria-hidden /> Live chat
                </span>
                <button
                  className="vs-sheet__close"
                  onClick={() => setChatOpen(false)}
                  aria-label="Close chat"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
              {children}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Desktop / tablet: video column + side chat panel ────────────────────────
  return (
    <div className="video-stage">

      {/* ── Left: video column ──────────────────────────────────────────────── */}
      <div className="video-stage__col">

        {/* Tile area — fills available height */}
        <div className="video-stage__tile-area">
          {connected ? (
            <>
              {/* Stranger full tile */}
              <VideoTile
                who="stranger"
                label="Stranger"
                state={remoteStream ? 'live' : 'waiting'}
                stream={remoteStream}
              />
              <div className="video-stage__pip">
                <VideoTile
                  who="you"
                  label="You"
                  state={mediaError ? 'blocked' : camOff ? 'cam-off' : localStream ? 'live' : 'waiting'}
                  muted
                  pip
                  stream={localStream}
                  errorMessage={mediaError ?? undefined}
                />
              </div>
            </>
          ) : (
            /* Not connected: ConnectState overlay inside a dark bordered box */
            <div className="video-stage__idle-box">
              <ConnectState state={chatState} onStart={onStart} onCancel={onStop} />
            </div>
          )}
        </div>

        {/* Control bar */}
        <ControlBar
          chatState={chatState}
          micOff={micOff}
          camOff={camOff}
          onMicToggle={onMicToggle}
          onCamToggle={onCamToggle}
          onNext={onNext}
          onStop={onStop}
        />
      </div>

      {/* ── Right: side chat panel ──────────────────────────────────────────── */}
      <div className="video-stage__chat">
        <div className="video-stage__chat-header">
          <MessageSquare size={15} strokeWidth={2} aria-hidden />
          Live chat
        </div>
        {children}
      </div>

    </div>
  );
}
