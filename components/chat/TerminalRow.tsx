'use client';

import type { Message } from './types';
import './TerminalRow.scss';

export interface TerminalRowProps {
  message: Message;
}

const WHO_LABEL: Record<Message['who'], string> = {
  you:      'YOU',
  stranger: 'STRANGER',
  system:   'SYS',
};

export default function TerminalRow({ message }: TerminalRowProps) {
  const { who, text, time, dot } = message;

  return (
    <div className={`terminal-row terminal-row--${who}`} role="listitem">
      <span className="terminal-row__gutter">
        {/* Colored dot for system messages */}
        {who === 'system' && dot && (
          <span
            className="terminal-row__sys-dot"
            style={{ background: dot }}
            aria-hidden
          />
        )}
        <span className="terminal-row__who" aria-label={`${WHO_LABEL[who]}:`}>
          {WHO_LABEL[who]}
        </span>
        <span className="terminal-row__sep" aria-hidden>›</span>
      </span>
      <span className="terminal-row__text">{text}</span>
      <span className="terminal-row__time" aria-label={`sent at ${time}`}>{time}</span>
    </div>
  );
}
