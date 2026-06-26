import type { LocalMessage } from '../hooks/useChatSession';
import type { Message } from '../types';

/**
 * Maps wire-format messages to the view model the chat log renders.
 * Shared by both text and video chats so the mapping lives in one place.
 */
export function toMessageView(messages: LocalMessage[]): Message[] {
  return messages.map((m, i) => ({
    id: i,
    who: m.event === 'sendMessage' ? 'you' : m.event === 'system' ? 'system' : 'stranger',
    text: m.message,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dot: m.event === 'system' ? 'var(--c-ok)' : undefined,
  }));
}
