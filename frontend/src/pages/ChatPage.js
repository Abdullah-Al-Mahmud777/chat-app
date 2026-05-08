import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConversationList } from '../components/ConversationList';
import { ChatWindow } from '../components/ChatWindow';
import { UserList } from '../components/UserList';
import { createEchoInstance, subscribeToUserChannel } from '../services/websocket';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export function ChatPage() {
  const { user, logout, token } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showUserList, setShowUserList] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [echo, setEcho] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token && user?.id) {
      try {
        const echoInstance = createEchoInstance(token);
        setEcho(echoInstance);

        const subscription = subscribeToUserChannel(
          echoInstance,
          user.id,
          (updatedConversation) => {
            setConversations((prev) =>
              prev.map((convo) =>
                convo.id === updatedConversation.id ? updatedConversation : convo
              )
            );
          }
        );

        return () => {
          if (subscription) {
            echoInstance.leaveChannel(`user.${user.id}`);
          }
        };
      } catch (error) {
        console.warn('WebSocket setup warning:', error);
      }
    }
  }, [token, user?.id]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleSelectConversation = (convo) => {
    setSelectedConversation(convo);
    setMobileMenuOpen(false);
  };

  const handleSelectUser = (newConversation) => {
    setConversations([...conversations, newConversation]);
    setSelectedConversation(newConversation);
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-4 md:px-6 py-3 md:py-4 shadow-lg flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Chat</h1>
            <p className="text-xs text-gray-400">Real-time messaging</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-white text-sm font-semibold">{user?.name}</span>
            <span className="text-gray-400 text-xs">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg font-semibold transition duration-200 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-0 md:gap-4 p-0 md:p-4 overflow-hidden">
        {/* Sidebar - Hidden on mobile unless mobileMenuOpen */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block absolute md:relative w-full md:w-1/3 h-full md:h-auto bg-black md:bg-transparent z-10 md:z-0`}>
          <ConversationList
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setShowUserList(true)}
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Chat Window - Full width on mobile when selected */}
        <div className="w-full md:w-2/3">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              onClose={() => {
                setSelectedConversation(null);
                setMobileMenuOpen(true);
              }}
              echo={echo}
            />
          ) : (
            <div className="bg-gray-900 rounded-xl shadow-lg h-full flex items-center justify-center border border-gray-800">
              <div className="text-center px-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">No chat selected</h2>
                <p className="text-gray-400 text-sm mb-6">Choose a conversation or start a new one</p>
                <button
                  onClick={() => setShowUserList(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User List Modal */}
      {showUserList && (
        <UserList
          onSelectUser={handleSelectUser}
          onClose={() => setShowUserList(false)}
        />
      )}
    </div>
  );
}
