import React, { useState, useEffect, useRef } from 'react';
import { ref, push, set } from 'firebase/database';
import useMessages from '../services/useMessage';
import { database } from '../firebase/config';
import SendIcon from '@mui/icons-material/Send';

type Props = {
  roomId: string
  playerId: string
  players: any
};

const MessagesList: React.FC<Props> = ({ roomId, playerId, players }) => {
  const messages = useMessages(roomId);
  const [newMessage, setNewMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if ('key' in event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    } else {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim()) {
      const messagesRef = ref(database, `messages/${roomId}`);
      const newMessageRef = push(messagesRef);
      const messageId = newMessageRef.key;

      await set(newMessageRef, {
        id_message: messageId,
        sender_id: playerId,
        text: newMessage,
        timestamp: Date.now(),
      });

      setNewMessage('');
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="text-center">
      <div className="border border-slate-500 mb-2 h-[300px] bg-slate-950 p-2 text-left overflow-y-auto scrollbar-cumtor">
        {messages.length === 0 ? (
          <p>Chưa có tin nhắn...</p>
        ) : (
          messages.map((message) => (
            <div key={message.id_message}>
              <div className={"flex gap-2 justify-between " + (playerId === message.sender_id ? ' text-blue-500' : 'text-blue-100')} >
                <p><strong>{players[message.sender_id]?.name}:</strong> {message.text}</p>
                <p><small>{new Date(message.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</small></p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative">
        <input
          type="text"
          className="border bg-transparent w-full py-3 pl-4 pr-11 focus:outline-none"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleSendMessage}
          autoFocus
        />
        <button
          className="absolute top-1/2 -translate-y-1/2 right-3"
          onClick={handleSendMessage}
        >
          <SendIcon sx={{ fontSize: "20px" }} />
        </button>
      </div>
    </div>
  );
};

export default MessagesList;
