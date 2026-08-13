'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ShieldAlert } from 'lucide-react';
import { getSocket } from '@/lib/socket';

export interface ChatMessage {
  sender: string;
  message: string;
  isSystem?: boolean;
  timestamp: string;
}

interface ChatProps {
  roomCode: string;
  playerName: string;
}

export const Chat: React.FC<ChatProps> = ({ roomCode, playerName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    const handleChatMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.off('chat:message', handleChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socket.emit('chat:message', {
      roomCode,
      sender: playerName,
      message: inputText.trim()
    });

    setInputText('');
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden border border-purple-900/40">
      {/* Chat Header */}
      <div className="p-3 bg-purple-950/50 border-b border-purple-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-300 font-medium text-sm">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <span>Room Discussion Chat</span>
        </div>
        <span className="text-xs text-slate-400 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-700/30">
          Live
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 max-h-[350px] min-h-[220px]">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            No messages yet. Ask questions to find the imposter!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.isSystem ? 'items-center my-1.5' : msg.sender === playerName ? 'items-end' : 'items-start'}`}>
              {msg.isSystem ? (
                <div className="flex items-center gap-1.5 bg-purple-900/30 border border-purple-700/30 text-purple-200 text-xs px-3 py-1.5 rounded-full text-center max-w-[90%] shadow-sm">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>{msg.message}</span>
                </div>
              ) : (
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-md ${
                  msg.sender === playerName 
                    ? 'bg-purple-600 text-white rounded-br-none' 
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                }`}>
                  <div className="flex items-center gap-2 justify-between mb-0.5">
                    <span className="text-[11px] font-semibold text-purple-200/90">
                      {msg.sender === playerName ? 'You' : msg.sender}
                    </span>
                    <span className="text-[9px] opacity-60">{msg.timestamp}</span>
                  </div>
                  <p className="break-words leading-relaxed text-xs">{msg.message}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="p-2.5 bg-slate-950/70 border-t border-purple-900/40 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question or reply..."
          className="flex-1 bg-slate-900/90 border border-purple-900/50 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white p-2 rounded-xl transition-all shadow-md shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
