'use client';

import { useRef, useEffect } from 'react';
import { Smile, Tag, ArrowUp, X, SkipForward } from 'lucide-react';
import type { ChatState } from '../types';
import './Composer.scss';

export interface ComposerProps {
  state: ChatState;
  text: string;
  onTextChange: (t: string) => void;
  onSend: () => void;
  onNext: () => void;
  onStop: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NextButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="composer__action composer__action--next"
      onClick={onClick}
      title="Skip to next peer (Esc)"
      aria-label="Next peer"
    >
      <SkipForward size={15} strokeWidth={2} aria-hidden className="composer__action-icon" />
      <span className="composer__action-label">Next</span>
      <kbd className="composer__action-kbd">ESC</kbd>
    </button>
  );
}

function EndButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="composer__action composer__action--end"
      onClick={onClick}
      title="End session"
      aria-label="End chat"
    >
      <X size={16} strokeWidth={2.5} aria-hidden />
      <span className="composer__action-label">End</span>
    </button>
  );
}

function InputWell({
  text,
  disabled,
  onChange,
  onSend,
  onKeyDown,
}: {
  text: string;
  disabled: boolean;
  onChange: (t: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to 4 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  return (
    <div className={`composer__well${disabled ? ' composer__well--disabled' : ''}`}>
      <textarea
        ref={textareaRef}
        className="composer__textarea"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={disabled ? 'Press Start to find someone…' : 'Type a message…'}
        disabled={disabled}
        rows={1}
        aria-label="Message input"
      />
      <div className="composer__well-actions">
        {/* Ghost utility buttons — placeholders for emoji/tag pickers */}
        <button
          className="composer__ghost-btn"
          aria-label="Emoji"
          tabIndex={-1}
          disabled={disabled}
          type="button"
        >
          <Smile size={18} strokeWidth={1.75} />
        </button>
        <button
          className="composer__ghost-btn"
          aria-label="Interests"
          tabIndex={-1}
          disabled={disabled}
          type="button"
        >
          <Tag size={17} strokeWidth={1.75} />
        </button>
        <button
          className="composer__send-btn"
          onClick={onSend}
          disabled={disabled || !text.trim()}
          aria-label="Send message"
          type="button"
        >
          <ArrowUp size={18} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function Composer({
  state,
  text,
  onTextChange,
  onSend,
  onNext,
  onStop,
}: ComposerProps) {
  const connected = state === 'connected';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
    if (e.key === 'Escape' && connected) {
      e.preventDefault();
      onNext();
    }
  };

  return (
    <div className="composer">
      {connected && <NextButton onClick={onNext} />}

      <InputWell
        text={text}
        disabled={!connected}
        onChange={onTextChange}
        onSend={onSend}
        onKeyDown={handleKeyDown}
      />

      {connected && <EndButton onClick={onStop} />}
    </div>
  );
}
