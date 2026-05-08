import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToConversation } from '../services/websocket';

const API_BASE = 'http://localhost:8000/api';

export function ChatWindow({ conversation, onClose, echo }) {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversation || !conversation.other_user) return;
    
    fetchMessages();
    
    if (echo && conversation?.id) {
      const subscription = subscribeToConversation(
        echo,
        conversation.id,
        (newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
      );

      return () => {
        if (subscription) {
          echo.leaveChannel(`conversation.${conversation.id}`);
        }
      };
    }
  }, [conversation?.id, echo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversation || !conversation.id) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/conversations/${conversation.id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data.data);

      await axios.post(
        `${API_BASE}/conversations/${conversation.id}/mark-as-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !conversation.id) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      const response = await axios.post(
        `${API_BASE}/conversations/${conversation.id}/messages`,
        { content: messageContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!echo) {
        setMessages([...messages, response.data]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    }
  };

  // Guard against undefined conversation
  if (!conversation || !conversation.other_user) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-2xl h-full flex items-center justify-center border border-gray-800">
        <p className="text-gray-400">Select a conversation to start</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{conversation.other_user.name[0]}</span>
          </div>
          <div className="hidden sm:block">
            <h3 className="text-lg md:text-xl font-bold text-white">{conversation.other_user.name}</h3>
            <p className="text-xs text-gray-400">Online</p>
          </div>
          <div className="sm:hidden">
            <h3 className="text-lg font-bold text-white">{conversation.other_user.name}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-white transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-center">No messages yet. Start the conversation! 👋</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === conversation.other_user.id ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.sender_id === conversation.other_user.id
                    ? 'bg-gray-800 text-gray-100 border border-gray-700'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                }`}
              >
                <p className="text-sm md:text-base break-words">{msg.content}</p>
                <p className="text-xs mt-2 opacity-70">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-700 bg-gray-800 p-4 md:p-6 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 md:px-6 py-3 rounded-lg font-semibold transition duration-200"
        >
          <span className="hidden sm:inline">Send</span>
          <span className="sm:hidden">→</span>
        </button>
      </form>
    </div>
  );
}
