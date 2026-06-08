'use client';

import type { Message } from './types';
import './BubbleRow.scss';

export interface BubbleRowProps {
  message: Message;
}

const WHO_LABEL: Record<'you' | 'stranger', string> = {
  you:      'You',
  stranger: 'Stranger',
};

export default function BubbleRow({ message }: BubbleRowProps) {
  const { who, text, time } = message;

  return (
    <div className={`bubble-row bubble-row--${who}`} role="listitem">
      <div className="bubble-row__meta">
        <span className="bubble-row__author">{WHO_LABEL[who as 'you' | 'stranger']}</span>
        <span className="bubble-row__time">{time}</span>
      </div>
      <p className="bubble-row__bubble">{text}</p>
    </div>
  );
}
