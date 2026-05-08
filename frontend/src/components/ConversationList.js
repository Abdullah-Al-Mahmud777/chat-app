import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:8000/api';

export function ConversationList({ selectedConversation, onSelectConversation, onNewConversation, onClose }) {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-4 md:px-6 py-3 md:py-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Messages</h2>
        <button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-400 mb-2">No conversations yet</p>
            <p className="text-gray-500 text-sm">Start a new chat to begin</p>
          </div>
        ) : (
          conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => {
                onSelectConversation(convo);
                onClose?.();
              }}
              className={`p-4 md:p-5 border-b border-gray-800 cursor-pointer transition duration-200 ${
                selectedConversation?.id === convo.id
                  ? 'bg-blue-600 bg-opacity-20 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-800 bg-opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{convo.other_user.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{convo.other_user.name}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {convo.last_message?.content || 'No messages yet'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(convo.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
