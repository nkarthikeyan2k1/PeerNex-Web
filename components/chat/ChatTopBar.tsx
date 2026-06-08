'use client';

import { MessageSquare, Video, Settings } from 'lucide-react';
import type { ChatMode } from './types';
import './ChatTopBar.scss';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatTopBarProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  /** Animated peer count — owner manages the interval, we just display it */
  online: number;
  connected: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MODE_TABS: Array<{ key: ChatMode; label: string; Icon: React.ElementType }> = [
  { key: 'text',  label: 'Text',  Icon: MessageSquare },
  { key: 'video', label: 'Video', Icon: Video },
];

// ─── Sub-components (ISP: each piece only receives what it needs) ─────────────

function Divider() {
  return <span className="chat-topbar__divider" aria-hidden />;
}

function OnlineCount({ count }: { count: number }) {
  return (
    <div className="chat-topbar__online">
      <span className="chat-topbar__online-dot" aria-hidden />
      <span className="chat-topbar__online-count">{count.toLocaleString()}+</span>
      <span className="chat-topbar__online-label">online</span>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: ChatMode; onChange: (m: ChatMode) => void }) {
  return (
    <div className="chat-topbar__mode" role="tablist" aria-label="Chat mode">
      {MODE_TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          role="tab"
          aria-selected={mode === key}
          className={`chat-topbar__mode-btn${mode === key ? ' chat-topbar__mode-btn--active' : ''}`}
          onClick={() => onChange(key)}
        >
          <Icon size={14} strokeWidth={2} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <div className="chat-topbar__status">
      <span
        className={`chat-topbar__status-label${connected ? ' chat-topbar__status-label--on' : ''}`}
        aria-live="polite"
      >
        {connected ? 'ACTIVE' : 'IDLE'}
      </span>
      {/* Visual-only — connection is driven by socket, not user interaction */}
      <div
        className={`chat-topbar__toggle${connected ? ' chat-topbar__toggle--on' : ''}`}
        aria-hidden
      >
        <span className="chat-topbar__toggle-thumb" />
      </div>
    </div>
  );
}

// ─── Public component ────────────────────────────────────────────────────────
// Layout mirrors design: [PeerNex | online] ··· [mode toggle | status | ⚙]

export default function ChatTopBar({ mode, onModeChange, online, connected }: ChatTopBarProps) {
  return (
    <header className="chat-topbar">

      {/* Left — branding + live peer count */}
      <div className="chat-topbar__left">
        <span className="chat-topbar__brand">PeerNex</span>
        <Divider />
        <OnlineCount count={online} />
      </div>

      {/* Right — controls */}
      <div className="chat-topbar__right">
        <ModeToggle mode={mode} onChange={onModeChange} />
        <Divider />
        <ConnectionStatus connected={connected} />
        <button className="chat-topbar__settings-btn" aria-label="Settings" title="Settings">
          <Settings size={17} strokeWidth={1.75} />
        </button>
      </div>

    </header>
  );
}
