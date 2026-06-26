'use client';

import { useSocket } from '@/providers/SocketProvider';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ChatTopBar from '@/features/chat/components/ChatTopBar';
import ChatLog from '@/features/chat/components/ChatLog';
import Composer from '@/features/chat/components/Composer';
import { useChatSession } from '@/features/chat/hooks/useChatSession';
import { useOnlineCount } from '@/features/chat/hooks/useOnlineCount';
import { toMessageView } from '@/features/chat/lib/messageView';
import VideoStage from './components/VideoStage';
import { useLocalMedia } from './hooks/useLocalMedia';
import { useWebRTC } from './hooks/useWebRTC';
import '@/features/chat/chat-screen.scss';

export default function VideoChat() {
  const { socket, isConnected } = useSocket();
  const [interests] = useLocalStorage('interests', '');
  const online = useOnlineCount();

  const { chatState, connected, messages, text, setText, start, next, stop, sendMessage } =
    useChatSession({ socket, isConnected, mode: 'video', interests });

  const { localStream, localStreamRef, mediaError, micOff, camOff, toggleMic, toggleCam } =
    useLocalMedia(true);
  const { remoteStream } = useWebRTC({ socket, chatState, localStreamRef });

  return (
    <div className="chat-screen chat-screen--video">
      <ChatTopBar mode="video" online={online} connected={connected} />

      <VideoStage
        chatState={chatState}
        micOff={micOff}
        camOff={camOff}
        onMicToggle={toggleMic}
        onCamToggle={toggleCam}
        onNext={next}
        onStop={stop}
        onStart={start}
        localStream={localStream}
        remoteStream={remoteStream}
        mediaError={mediaError}
      >
        {connected ? (
          <ChatLog messages={toMessageView(messages)} style="terminal" isTyping={false} />
        ) : (
          <div className="chat-screen__video-empty">
            Chat appears once you&apos;re connected.
          </div>
        )}

        <Composer
          state={chatState}
          text={text}
          onTextChange={setText}
          onSend={sendMessage}
          onNext={next}
          onStop={stop}
        />
      </VideoStage>
    </div>
  );
}
