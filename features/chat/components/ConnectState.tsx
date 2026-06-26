'use client';

import { Users, Search, Zap } from 'lucide-react';
import type { ChatState } from '../types';
import './ConnectState.scss';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConnectStateProps {
  /** Only 'idle' and 'searching' are valid — 'connected' shows the ChatLog instead */
  state: Exclude<ChatState, 'connected'>;
  onStart: () => void;
  onCancel: () => void;
}

// ─── Searching overlay ───────────────────────────────────────────────────────

function SearchingState({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="connect-state connect-state--searching">
      <div className="connect-state__ring-wrap" aria-hidden>
        <div className="connect-state__ring-track" />
        <div className="connect-state__ring-spinner" />
        <div className="connect-state__ring-core">
          <Search size={24} strokeWidth={1.75} />
        </div>
      </div>

      <p className="connect-state__heading">Finding a peer…</p>
      <p className="connect-state__body">
        Matching you with someone online&nbsp;·&nbsp;anonymous
      </p>

      <button className="connect-state__cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

// ─── Idle hero ───────────────────────────────────────────────────────────────

function IdleState({ onStart }: { onStart: () => void }) {
  return (
    <div className="connect-state connect-state--idle">
      <div className="connect-state__icon-box" aria-hidden>
        <Users size={30} strokeWidth={1.75} />
      </div>

      <p className="connect-state__heading">Chat with strangers instantly</p>
      <p className="connect-state__body">
        You&apos;ll be matched with a random anonymous peer.{' '}
        Your video and text never touch our servers.
      </p>

      <button className="connect-state__cta" onClick={onStart}>
        <Zap size={17} strokeWidth={2.2} aria-hidden />
        Start chatting
        <kbd>↵</kbd>
      </button>
    </div>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

export default function ConnectState({ state, onStart, onCancel }: ConnectStateProps) {
  return state === 'searching'
    ? <SearchingState onCancel={onCancel} />
    : <IdleState onStart={onStart} />;
}
