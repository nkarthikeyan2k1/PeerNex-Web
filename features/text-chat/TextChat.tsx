'use client';

import { useSocket } from '@/providers/SocketProvider';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ChatTopBar from '@/features/chat/components/ChatTopBar';
import ConnectState from '@/features/chat/components/ConnectState';
import ChatLog from '@/features/chat/components/ChatLog';
import Composer from '@/features/chat/components/Composer';
import SocketGate from '@/features/chat/components/SocketGate';
import { useChatSession } from '@/features/chat/hooks/useChatSession';
import { useOnlineCount } from '@/features/chat/hooks/useOnlineCount';
import { toMessageView } from '@/features/chat/lib/messageView';
import '@/features/chat/chat-screen.scss';

export default function TextChat() {
  const { socket, isConnected } = useSocket();
  const [interests] = useLocalStorage('interests', '');
  const online = useOnlineCount();

  const { chatState, connected, messages, text, setText, start, next, stop, sendMessage } =
    useChatSession({ socket, isConnected, mode: 'text', interests });

  return (
    <SocketGate>
      <div className="chat-screen">
        <ChatTopBar mode="text" online={online} connected={connected} />

        {chatState !== 'connected' ? (
          <ConnectState state={chatState} onStart={start} onCancel={stop} />
        ) : (
          <ChatLog messages={toMessageView(messages)} style="terminal" isTyping={false} />
        )}

        <Composer
          state={chatState}
          text={text}
          onTextChange={setText}
          onSend={sendMessage}
          onNext={next}
          onStop={stop}
        />
      </div>
    </SocketGate>
  );
}
