'use client';

import { Mic, MicOff, Video, VideoOff, SkipForward, X, MessageSquare } from 'lucide-react';
import VideoTile from './VideoTile';
import ConnectState from './ConnectState';
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
}: VideoStageProps) {
  const connected = chatState === 'connected';

  return (
    <div className="video-stage">

      {/* ── Left: video column ──────────────────────────────────────────────── */}
      <div className="video-stage__col">

        {/* Tile area — fills available height */}
        <div className="video-stage__tile-area">
          {connected ? (
            <>
              {/* Stranger full tile */}
              <VideoTile who="stranger" label="Stranger" state="live" />
              {/* Your PiP — bottom-right */}
              <div className="video-stage__pip">
                <VideoTile
                  who="you"
                  label="You"
                  state={camOff ? 'cam-off' : 'live'}
                  muted
                  pip
                />
              </div>
            </>
          ) : (
            /* Not connected: ConnectState overlay inside a dark bordered box */
            <div className="video-stage__idle-box">
              <ConnectState state={chatState} onStart={onStart} />
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
