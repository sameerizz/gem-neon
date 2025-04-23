"use client";

import React, { useState } from 'react';
import Chat from './Chat';
import { useChat } from '../lib/contexts/ChatContext';

export default function ChatLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { chats, currentChatId, createNewChat, switchChat, deleteChat, getCurrentChat } = useChat();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNewChat = () => {
    createNewChat();
    // No longer auto-expands the sidebar
  };

  const handleChatSelect = (chatId: string) => {
    switchChat(chatId);
    // No longer collapses the sidebar
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering the parent click (selecting chat)
    deleteChat(chatId);
  };

  // Sort chats by last updated (most recent first)
  const sortedChats = [...chats].sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-screen relative">
      {/* Collapsed Sidebar */}
      <div className={`flex flex-col items-center py-4 glass-darker border-r border-[rgba(45,226,230,0.3)] shadow-[0_0_15px_rgba(45,226,230,0.3)] z-20 absolute top-0 bottom-0 left-0 ${
        isSidebarCollapsed ? 'w-16' : 'w-0 opacity-0 pointer-events-none'
      } transition-all duration-300 ease-in-out`}>
        {/* Mini Logo */}
        <div className="w-10 h-10 rounded-md bg-[rgba(45,226,230,0.1)] border border-[rgba(45,226,230,0.4)] flex items-center justify-center mb-6 shadow-[0_0_10px_rgba(45,226,230,0.2)] backdrop-blur-md">
          <span className="font-bold text-xl neon-teal">G</span>
        </div>
        
        {/* Toggle button */}
        <button 
          onClick={toggleSidebar}
          className="w-10 h-10 rounded-md bg-[rgba(45,226,230,0.15)] border border-[rgba(45,226,230,0.3)] flex items-center justify-center mb-6 hover:bg-[rgba(45,226,230,0.25)] transition-all duration-200 shadow-[0_0_8px_rgba(45,226,230,0.2)]"
          aria-label="Expand sidebar"
        >
          <svg className="w-5 h-5 text-[rgba(45,226,230,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* New chat button */}
        <button 
          onClick={handleNewChat}
          className="w-10 h-10 rounded-full bg-[rgba(45,226,230,0.15)] border border-[rgba(45,226,230,0.3)] flex items-center justify-center mb-6 hover:bg-[rgba(45,226,230,0.25)] transition-all duration-200 shadow-[0_0_8px_rgba(45,226,230,0.2)]"
        >
          <svg className="w-5 h-5 text-[rgba(45,226,230,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        {/* Chats icon */}
        <button className="w-10 h-10 rounded-md bg-transparent flex items-center justify-center mb-6 hover:bg-[rgba(45,226,230,0.1)] transition-all duration-200">
          <svg className="w-5 h-5 text-[rgba(45,226,230,0.7)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h4M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
          </svg>
        </button>
        
        {/* User avatar at bottom */}
        <div className="mt-auto mb-4">
          <div className="w-10 h-10 rounded-md bg-[rgba(45,226,230,0.1)] border border-[rgba(45,226,230,0.3)] flex items-center justify-center shadow-[0_0_8px_rgba(45,226,230,0.2)]">
            <span className="text-[rgba(45,226,230,0.9)]">S</span>
          </div>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'pl-20 pr-4 pt-4 pb-4' : 'pl-[calc(80px+1rem)] pr-4 pt-4 pb-4'
      }`}>
        
        {/* Sidebar Toggle Button (visible when sidebar is expanded) */}
        {!isSidebarCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="absolute left-4 top-4 z-30 w-8 h-8 rounded-md bg-[rgba(45,226,230,0.15)] border border-[rgba(45,226,230,0.3)] flex items-center justify-center hover:bg-[rgba(45,226,230,0.25)] transition-all duration-200 shadow-[0_0_8px_rgba(45,226,230,0.2)]"
            aria-label="Collapse sidebar"
          >
            <svg className="w-4 h-4 text-[rgba(45,226,230,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {/* Expanded Sidebar */}
        <div className={`glass-darker rounded-r-2xl border-r border-[rgba(45,226,230,0.3)] shadow-[0_0_15px_rgba(45,226,230,0.2)] transition-all duration-300 ease-in-out z-10 absolute top-0 bottom-0 left-0 ${
          isSidebarCollapsed ? 'w-0 opacity-0 -ml-4' : 'w-80 opacity-100'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header with Logo */}
            <div className="p-6 border-b border-[rgba(45,226,230,0.2)] flex flex-col items-center">
              <div className="w-20 h-20 rounded-xl bg-[rgba(45,226,230,0.1)] border border-[rgba(45,226,230,0.4)] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(45,226,230,0.3)]">
                <span className="font-bold text-3xl neon-teal">G</span>
              </div>
              <div className="font-bold text-2xl neon-teal tracking-wide">GEMINI</div>
            </div>
            
            {/* New Chat Button */}
            <div className="p-4">
              <button 
                onClick={handleNewChat}
                className="w-full py-3 rounded-xl bg-[rgba(45,226,230,0.15)] border border-[rgba(45,226,230,0.3)] flex items-center justify-center hover:bg-[rgba(45,226,230,0.25)] transition-all duration-200 shadow-[0_0_10px_rgba(45,226,230,0.2)]"
              >
                <svg className="w-5 h-5 text-[rgba(45,226,230,0.9)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[rgba(45,226,230,0.9)] font-medium">New Chat</span>
              </button>
            </div>
            
            {/* Tabs and chat history */}
            <div className="p-4 text-sm">
              <div className="mb-4">
                <div className="px-3 py-2 border-b-2 border-[rgba(45,226,230,0.6)] font-medium text-[rgba(45,226,230,0.9)]">Chats</div>
              </div>
            </div>
            
            {/* Chat History Section */}
            <div className="flex-1 overflow-y-auto p-2">
              {/* Chat items */}
              <div className="space-y-3 px-2">
                {sortedChats.map((chat) => (
                  <div 
                    key={chat.id} 
                    onClick={() => handleChatSelect(chat.id)}
                    className={`p-3 rounded-lg border backdrop-blur-md ${
                      chat.id === currentChatId 
                        ? 'border-[rgba(45,226,230,0.5)] bg-[rgba(45,226,230,0.1)] shadow-[0_0_10px_rgba(45,226,230,0.2)]' 
                        : 'border-[rgba(45,226,230,0.2)] bg-[rgba(45,226,230,0.05)] hover:bg-[rgba(45,226,230,0.1)]'
                    } cursor-pointer flex items-center group transition-all duration-200`}
                  >
                    <div className="h-8 w-8 rounded-md bg-[rgba(45,226,230,0.1)] flex items-center justify-center border border-[rgba(45,226,230,0.3)] mr-3">
                      <svg className="w-4 h-4 text-[rgba(45,226,230,0.9)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 10h8M8 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-[rgba(229,231,235,0.9)]">
                        {chat.title}
                      </div>
                      <div className="text-xs text-[rgba(229,231,235,0.6)]">
                        {formatDate(chat.lastUpdatedAt)}
                      </div>
                    </div>
                    {chats.length > 1 && (
                      <button 
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-[rgba(255,100,100,0.1)] hover:bg-[rgba(255,100,100,0.2)] flex items-center justify-center transition-all duration-200 ml-2"
                        aria-label="Delete chat"
                      >
                        <svg className="w-3.5 h-3.5 text-[rgba(255,100,100,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* User Info */}
            <div className="p-4 border-t border-[rgba(45,226,230,0.2)] flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-[rgba(45,226,230,0.1)] flex items-center justify-center border border-[rgba(45,226,230,0.3)]">
                  <span className="text-[rgba(45,226,230,0.9)]">S</span>
                </div>
                <div className="ml-3 text-sm text-[rgba(229,231,235,0.9)]">Sameer Siddiqui</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-center pt-2 pb-6">
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">{getCurrentChat()?.title || 'New Chat'}</span>
          </h1>
        </div>
        
        {/* Chat Content */}
        <div className="flex-1 overflow-hidden mx-auto w-full max-w-[740px]">
          <Chat />
        </div>
      </div>
    </div>
  );
} 