'use client';

import './TypingIndicator.scss';

export default function TypingIndicator() {
  return (
    <div className="typing-indicator" role="status" aria-label="Stranger is typing">
      <div className="typing-indicator__dots" aria-hidden>
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
      </div>
      <span className="typing-indicator__label">Stranger is typing</span>
    </div>
  );
}
