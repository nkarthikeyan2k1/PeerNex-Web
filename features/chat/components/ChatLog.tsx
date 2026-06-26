'use client';

import { useEffect, useRef } from 'react';
import SystemLine from './SystemLine';
import TerminalRow from './TerminalRow';
import BubbleRow from './BubbleRow';
import TypingIndicator from './TypingIndicator';
import type { Message, ChatStyle } from '../types';
import './ChatLog.scss';

export interface ChatLogProps {
  messages: Message[];
  style: ChatStyle;
  isTyping: boolean;
}

function MessageRow({ message, style }: { message: Message; style: ChatStyle }) {
  if (message.who === 'system') {
    return <SystemLine text={message.text} dot={message.dot} />;
  }
  if (style === 'terminal') {
    return <TerminalRow message={message} />;
  }
  return <BubbleRow message={message} />;
}

export default function ChatLog({ messages, style, isTyping }: ChatLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className={`chat-log chat-log--${style}`} role="list" aria-label="Chat messages">
      {messages.map((msg) => (
        <MessageRow key={msg.id} message={msg} style={style} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
