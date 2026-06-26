// Shared types for the chat feature — single source of truth for all chat components

export type ChatMode = 'text' | 'video';
export type ChatState = 'idle' | 'searching' | 'connected';
export type ChatStyle = 'bubbles' | 'terminal';

export interface Message {
  id: number;
  who: 'you' | 'stranger' | 'system';
  text: string;
  time: string;
  /** Optional colored dot for system messages (e.g. "var(--c-ok)") */
  dot?: string;
}
