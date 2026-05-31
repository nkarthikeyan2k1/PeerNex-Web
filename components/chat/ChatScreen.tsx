'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import './ChatScreen.scss';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Message {
  event: string;
  message: string;
}

const ChatScreen = () => {
  const { socket, isConnected } = useSocket();
  const { value } = useLocalStorage('interests', '');

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isChatStarted, setIsChatStarted] = useState(false);

  const isChatStartedRef = useRef(isChatStarted);
  useEffect(() => {
    isChatStartedRef.current = isChatStarted;
  }, [isChatStarted]);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // START CHAT
  const handleStart = () => {
    if (!socket || !isConnected) return;

    const findPeer = {
      event: "findPeer",
      type: "text",
      interests: value
    };
    socket.emit('findPeer', findPeer);

    setIsChatStarted(true);
    setMessages([
      {
        event: 'system',
        message: 'Looking for someone to chat with...',
      },
    ]);
  };

  // NEXT CHAT
  const handleNext = () => {
    handleStart();
  };

  // STOP CHAT
  const handleStop = () => {
    if (!socket || !isConnected) return;

    socket.emit('skipPeer');

    setIsChatStarted(false);

    setMessages((prev) => [
      ...prev,
      {
        event: 'system',
        message: 'Stopping chat...',
      },
    ]);
  };

  // SEND MESSAGE
  const handleSendMessage = () => {

    if (!socket || !isConnected || !text.trim()) return;

    const messageData = {
      event: 'sendMessage',
      message: text,
    };
//     {
//     "event": "sendMessage",
//     "message": "hi"
// }
// {
//     "event": "findPeer",
//     "sda": "5cf63106ea9ba87ce0f7a6e18e0c73c867774cf7b175aa26b5d256d4961e6874##300##1084.1370592010503##11##331699457,3952575411",
//     "language": "en-US",
//     "type": "text",
//     "interests": [
//         "hot",
//         "sex",
//         "fun"
//     ]
// }
// {
//     "event": "chatMessage",
//     "message": "Huiii"
// }
    socket.emit('sendMessage', messageData);
    setMessages((prev) => [...prev, messageData]);

    setText('');
  };

  // SOCKET EVENTS
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log('Connected:', socket.id);
    };

    const onDisconnect = () => {
      console.log('Disconnected');

      setIsChatStarted(false);

      setMessages((prev) => [
        ...prev,
        {
          event: 'stopChat',
          message: 'Connection closed.',
        },
      ]);
    };

    const onChatMessage = (data: Message) => {
      console.log('Message:', data);
      setMessages((prev) => [...prev, data]);
    };

    const onMatched = (data: { roomId: string }) => {
      console.log('Matched:', data);
      setIsChatStarted(true);
      setMessages((prev) => [...prev, {
        event: 'system',
        message: 'Matched with someone',
      }]);
    };

    const onPeerLeft = () => {
      console.log('Stranger disconnected');
      if (isChatStartedRef.current) {
        setMessages([
          {
            event: 'system',
            message: 'Stranger disconnected. Looking for someone new to chat with...',
          },
        ]);
        const findPeer = {
          event: "findPeer",
          type: "text",
          interests: valueRef.current
        };
        socket.emit('findPeer', findPeer);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            event: 'system',
            message: 'Stranger has disconnected.',
          },
        ]);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chatMessage', onChatMessage);
    socket.on('matched', onMatched);
    socket.on('peerLeft', onPeerLeft);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chatMessage', onChatMessage);
      socket.off('matched', onMatched);
      socket.off('peerLeft', onPeerLeft);
    };
  }, [socket]);

  return (
    <div className="chat-screen">
      <div className="chat-screen__container">

        {/* CHAT WINDOW */}
        <div className="chat-screen__chat-window">
        {JSON.stringify(messages)}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chatItem ${
                msg.event === 'system' ? 'systemMessage' : ''
              }`}
            >
              <p className="messageText">
                {msg.event !== 'system' && (
                  <span className="strangerLabel">
                    {msg.event === 'sendMessage' ? 'You' : 'Stranger'}:
                  </span>
                )}{' '}
                {msg.message}
              </p>
            </div>
          ))}

        </div>

        {/* INPUT SECTION */}
        <div className="chat-screen__text-window">

          {/* START BUTTON */}
          {!isChatStarted && <button
            className="chat-screen__skip-button"
            onClick={handleStart}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                handleStart();
              }
            }}
          >
            <div className="mainText">Start - ESC</div>
          </button>}

          {isChatStarted && <button
            className="chat-screen__skip-button"
            onClick={handleNext}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                handleNext();
              }
            }}
          >
            <div className="mainText">Next - ESC</div>
          </button>}

          {/* STOP BUTTON */}
          {isChatStarted && <button
            className="chat-screen__pause-button outlined noSelect no-context-menu"
            onClick={handleStop}
            disabled={!isChatStarted}
          >
            <div className="mainText">Stop</div>
            <div className="subText">Disconnect</div>
          </button>}

          {/* INPUT */}
          <div className="chat-screen__input-container outlined">

            <textarea
              aria-label="Send a message"
              className="chat-screen__message-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                isConnected
                  ? 'Type your message...'
                  : 'Start chat first...'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            {/* SEND BUTTON */}
            <button
              aria-label="Send Message"
              className="chat-screen__send-button"
              onClick={handleSendMessage}
              disabled={!isConnected}
            >
              <svg
                viewBox="0 0 24 24"
                height="24"
                width="24"
                preserveAspectRatio="xMidYMid meet"
                fill="none"
              >
                <path
                  d="M5.4 19.425C5.06667 19.5583 4.75 19.5291 4.45 19.3375C4.15 19.1458 4 18.8666 4 18.5V14L12 12L4 9.99997V5.49997C4 5.1333 4.15 4.85414 4.45 4.66247C4.75 4.4708 5.06667 4.44164 5.4 4.57497L20.8 11.075C21.2167 11.2583 21.425 11.5666 21.425 12C21.425 12.4333 21.2167 12.7416 20.8 12.925L5.4 19.425Z"
                  fill="currentColor"
                />
              </svg>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;