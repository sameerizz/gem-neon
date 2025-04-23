"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { clearLocalStorageData, safeLocalStorage } from '../utils';

// Define types
export type MessageType = {
  content: string;
  role: 'user' | 'assistant';
  id: string;
  imageUrl?: string; // Optional field for image messages
};

export type ChatType = {
  id: string;
  title: string;
  messages: MessageType[];
  createdAt: number;
  lastUpdatedAt: number;
};

type ChatContextType = {
  chats: ChatType[];
  currentChatId: string | null;
  createNewChat: () => string;
  switchChat: (chatId: string) => void;
  updateChatMessages: (chatId: string, messages: MessageType[]) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  deleteChat: (chatId: string) => void;
  getCurrentChat: () => ChatType | null;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Generate a unique ID
  const generateId = () => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      try {
        // Create a version of chats that doesn't store full image data in localStorage
        const storageChats = chats.map(chat => ({
          ...chat,
          messages: chat.messages.map(msg => {
            // If message has an image, store a placeholder instead of the full base64 data
            if (msg.imageUrl) {
              // Extract just the image type and a small identifier
              const isDataUrl = msg.imageUrl.startsWith('data:');
              
              // Safely parse the timestamp from the message ID
              let timestamp = '';
              try {
                const parts = msg.id.split('_');
                if (parts.length > 1) {
                  const timestampNum = parseInt(parts[1], 10);
                  if (!isNaN(timestampNum)) {
                    timestamp = new Date(timestampNum).toISOString();
                  } else {
                    timestamp = new Date().toISOString();
                  }
                } else {
                  timestamp = new Date().toISOString();
                }
              } catch (error) {
                console.error('Error parsing message timestamp:', error);
                timestamp = new Date().toISOString();
              }
              
              return {
                ...msg,
                imageUrl: isDataUrl ? `[IMAGE:${timestamp}]` : msg.imageUrl
              };
            }
            return msg;
          })
        }));
        
        localStorage.setItem('gemini-chats', JSON.stringify(storageChats));
      } catch (error) {
        // Handle quota exceeded error
        console.error('Error saving chats to localStorage:', error);
        
        // If we can't save all chats, try saving just the current chat
        if (currentChatId) {
          try {
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat) {
              // Only keep the last 10 messages to reduce size
              const trimmedChat = {
                ...currentChat,
                messages: currentChat.messages.slice(-10).map(msg => {
                  if (msg.imageUrl) {
                    return { ...msg, imageUrl: '[IMAGE]' };
                  }
                  return msg;
                })
              };
              localStorage.setItem('gemini-current-chat', JSON.stringify(trimmedChat));
            }
          } catch (err) {
            console.error('Failed to save even the current chat:', err);
          }
        }
      }
    }
    
    if (currentChatId) {
      try {
        localStorage.setItem('gemini-current-chat-id', currentChatId);
      } catch (error) {
        console.error('Error saving current chat ID:', error);
      }
    }
  }, [chats, currentChatId]);

  // Load chats from localStorage on initial render
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('gemini-chats');
      const savedCurrentChatId = localStorage.getItem('gemini-current-chat-id');
      
      if (savedChats) {
        try {
          const parsedChats = JSON.parse(savedChats) as ChatType[];
          // Note: Image data will need to be re-uploaded if the user wants to see them again
          setChats(parsedChats);
          
          if (savedCurrentChatId && parsedChats.some(chat => chat.id === savedCurrentChatId)) {
            setCurrentChatId(savedCurrentChatId);
          } else if (parsedChats.length > 0) {
            // Set most recent chat as current if saved ID not found
            const mostRecentChat = [...parsedChats].sort((a, b) => {
              // Safely compare dates with fallback if lastUpdatedAt is invalid
              try {
                return b.lastUpdatedAt - a.lastUpdatedAt;
              } catch (error) {
                console.error('Error comparing dates:', error);
                return 0; // Keep the original order if comparison fails
              }
            })[0];
            setCurrentChatId(mostRecentChat.id);
          }
        } catch (error) {
          console.error('Error parsing saved chats:', error);
          // Try to clear potentially corrupted data
          clearLocalStorageData();
          
          // If there's an error, try to load just the current chat
          const savedCurrentChat = localStorage.getItem('gemini-current-chat');
          if (savedCurrentChat) {
            try {
              const parsedCurrentChat = JSON.parse(savedCurrentChat) as ChatType;
              setChats([parsedCurrentChat]);
              setCurrentChatId(parsedCurrentChat.id);
            } catch (err) {
              console.error('Failed to load current chat, creating new chat:', err);
              createNewChat();
            }
          } else {
            // Initialize with a new chat if nothing can be loaded
            createNewChat();
          }
        }
      } else {
        // Initialize with a new chat if no saved chats
        createNewChat();
      }
    } catch (error) {
      console.error('Critical error loading chats:', error);
      clearLocalStorageData();
      createNewChat();
    }
  }, []);

  // Create a new chat
  const createNewChat = (): string => {
    const newChatId = generateId();
    const newChat: ChatType = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
    
    setChats(prevChats => [...prevChats, newChat]);
    setCurrentChatId(newChatId);
    return newChatId;
  };

  // Switch to a different chat
  const switchChat = (chatId: string) => {
    if (chats.some(chat => chat.id === chatId)) {
      setCurrentChatId(chatId);
    }
  };

  // Update messages for a specific chat
  const updateChatMessages = (chatId: string, messages: MessageType[]) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId
          ? { 
              ...chat, 
              messages, 
              lastUpdatedAt: Date.now(),
              // Update title based on first user message if title is still default
              title: chat.title === 'New Chat' && messages.length > 0 && messages[0].role === 'user'
                ? truncateTitle(messages[0].content)
                : chat.title
            }
          : chat
      )
    );
  };

  // Update chat title
  const updateChatTitle = (chatId: string, title: string) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId
          ? { ...chat, title }
          : chat
      )
    );
  };

  // Delete a chat
  const deleteChat = (chatId: string) => {
    // Only proceed if this isn't the last chat
    if (chats.length <= 1) {
      return;
    }
    
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    // If we're deleting the current chat, switch to another one
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        createNewChat();
      }
    }
  };

  // Get current chat object
  const getCurrentChat = (): ChatType | null => {
    if (!currentChatId) return null;
    return chats.find(chat => chat.id === currentChatId) || null;
  };

  // Helper to truncate title to a reasonable length
  const truncateTitle = (text: string): string => {
    const maxLength = 30;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChatId,
        createNewChat,
        switchChat,
        updateChatMessages,
        updateChatTitle,
        deleteChat,
        getCurrentChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 