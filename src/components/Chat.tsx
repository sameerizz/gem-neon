"use client";

import React, { useRef, useState, useEffect } from 'react';
import Message from './Message';
import ChatInput from './ChatInput';
import { useChat, MessageType } from '../lib/contexts/ChatContext';
import ErrorRecovery from './ErrorRecovery';
// import { cn } from "@/lib/utils";

export default function Chat() {
  const { currentChatId, getCurrentChat, updateChatMessages } = useChat();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // For typewriter effect
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const [fullContent, setFullContent] = useState('');
  const typingSpeedRef = useRef(5); // Milliseconds per character
  const charsPerTickRef = useRef(3); // Type 3 characters at a time
  
  // For loading indicator animation
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const loadingTexts = ['thinking', 'generating', 'cooking', 'processing', 'contemplating'];
  
  // Track user scroll state
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastScrollTopRef = useRef(0);

  // Get current messages from context
  const currentChat = getCurrentChat();
  const messages = currentChat?.messages || [];
  
  // Check if we should center the input (no messages)
  const shouldCenterInput = messages.length === 0 && !isLoading;

  // Enhanced smooth scrolling function
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Handle scroll events to detect user scrolling
  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;
    
    const currentScrollTop = container.scrollTop;
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    
    // Detect if user is scrolling up (manually scrolling)
    if (currentScrollTop < lastScrollTopRef.current && typingMessageId) {
      setUserHasScrolled(true);
    }
    
    // Check if scroll position is near bottom
    const scrollBottomPosition = maxScrollTop - currentScrollTop;
    setIsNearBottom(scrollBottomPosition < 100);
    
    // If user scrolls to bottom, reset the userHasScrolled flag
    if (isNearBottom) {
      setUserHasScrolled(false);
    }
    
    lastScrollTopRef.current = currentScrollTop;
  };

  // Set up scroll event listener
  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Reset user scroll state when changing chats
  useEffect(() => {
    setUserHasScrolled(false);
    setIsNearBottom(true);
    // Short delay to allow the DOM to update before scrolling
    setTimeout(() => scrollToBottom('auto'), 50);
  }, [currentChatId]);
  
  // Improved scroll to bottom of messages with respect for user scrolling
  useEffect(() => {
    if (!messageContainerRef.current) return;
    
    // Cases when we should auto-scroll:
    // 1. When a new message is added (not an AI response)
    // 2. When typing starts (new AI response begins)
    const shouldAutoScroll = 
      (isNearBottom && !userHasScrolled) || // Near bottom and user hasn't manually scrolled up
      (typingMessageId && displayedContent === ''); // Just started typing (new response)
    
    if (shouldAutoScroll) {
      // Use a short delay to ensure DOM is updated
      setTimeout(() => scrollToBottom(), 10);
    }
  }, [messages.length, displayedContent, typingMessageId, isNearBottom, userHasScrolled]);

  // Typewriter effect - updated to respect user scroll position
  useEffect(() => {
    if (!typingMessageId || !fullContent || !currentChatId) return;
    
    if (displayedContent.length >= fullContent.length) {
      // We're done typing
      setTimeout(() => {
        // Update the message with full content and stop typing effect
        const updatedMessages = messages.map(msg => 
          msg.id === typingMessageId 
            ? { ...msg, content: fullContent } 
            : msg
        );
        
        updateChatMessages(currentChatId, updatedMessages);
        setTypingMessageId(null);
        setDisplayedContent('');
        setFullContent('');
        
        // Only auto-scroll if we're near the bottom
        if (isNearBottom && !userHasScrolled) {
          scrollToBottom();
        }
      }, 100);
      return;
    }
    
    // Add multiple characters at a time
    const timeoutId = setTimeout(() => {
      setDisplayedContent(prev => {
        const remainingChars = fullContent.length - prev.length;
        const charsToAdd = Math.min(charsPerTickRef.current, remainingChars);
        return prev + fullContent.substr(prev.length, charsToAdd);
      });
      
      // Only auto-scroll if user hasn't manually scrolled up and is near bottom
      if (isNearBottom && !userHasScrolled) {
        scrollToBottom();
      }
    }, typingSpeedRef.current);
    
    return () => clearTimeout(timeoutId);
  }, [typingMessageId, fullContent, displayedContent, currentChatId, messages, updateChatMessages, userHasScrolled, isNearBottom]);
  
  // Rotate through loading texts
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setLoadingTextIndex(prev => (prev + 1) % loadingTexts.length);
    }, 1500); // Change text every 1.5 seconds
    
    return () => clearInterval(interval);
  }, [isLoading, loadingTexts.length]);

  // Generate a unique ID
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Upload image to get URL with compression
  const uploadImage = async (imageFile: File): Promise<string> => {
    try {
      // Create a canvas to compress the image
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (!event.target?.result) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          // Create an image object
          const img = new Image();
          img.onload = () => {
            // Create a canvas and get its context
            const canvas = document.createElement('canvas');
            
            // Calculate new dimensions - limit to max 800px width or height while keeping aspect ratio
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 800;
            
            if (width > height && width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
            
            // Set canvas dimensions and draw the resized image
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG at 85% quality (0.85)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          };
          
          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };
          
          // Set the source of the image
          img.src = event.target.result as string;
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(imageFile);
      });
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  };

  const handleSendMessage = async (content: string, imageFile?: File) => {
    if (!currentChatId) return;

    // Reset error state
    setError(null);
    
    // Reset scroll overrides when sending new message
    setUserHasScrolled(false);
    
    // Process image if provided
    let imageUrl: string | undefined = undefined;
    if (imageFile) {
      try {
        setIsLoading(true);
        imageUrl = await uploadImage(imageFile);
      } catch (error) {
        console.error('Error uploading image:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }
    }
    
    // Add user message to chat
    const userMessageId = generateId();
    const userMessage: MessageType = { 
      content, 
      role: 'user', 
      id: userMessageId,
      imageUrl 
    };
    const updatedMessages = [...messages, userMessage];
    updateChatMessages(currentChatId, updatedMessages);
    
    // Force immediate scroll to bottom when sending a message
    setTimeout(() => scrollToBottom('auto'), 50);
    
    setIsLoading(true);
    
    try {
      // Create a message array without IDs for the API
      // For the API we might need to handle images differently depending on the API's capabilities
      const messagesForApi = updatedMessages.map(({ content, role, imageUrl }) => ({ 
        content, 
        role, 
        imageUrl 
      }));
      
      console.log('Sending messages to API:', JSON.stringify(messagesForApi));
      
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messagesForApi }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API error:', data);
        throw new Error(data.error || `API returned ${response.status}`);
      }
      
      // Check if data contains a text response
      if (data && data.text) {
        // Create a new assistant message
        const assistantMessageId = generateId();
        const assistantMessage: MessageType = { 
          content: '', // Start with empty content for typewriter effect
          role: 'assistant', 
          id: assistantMessageId 
        };
        
        // Add the empty message to the chat
        const newMessages = [...updatedMessages, assistantMessage];
        updateChatMessages(currentChatId, newMessages);
        
        // Reset user scroll state for new response
        setUserHasScrolled(false);
        
        // Setup typewriter effect
        setTypingMessageId(assistantMessageId);
        setFullContent(data.text);
        setDisplayedContent('');
        
        // Scroll to the new message
        setTimeout(() => scrollToBottom(), 50);
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        // Fallback for any other unexpected response format
        console.error('Unexpected response format:', data);
        throw new Error('Received an unexpected response format');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      
      // Add error message
      const errorAssistantMessage: MessageType = {
        content: `Sorry, I encountered an error. Please try again. (Error: ${errorMessage})`,
        role: 'assistant',
        id: generateId()
      };
      
      updateChatMessages(currentChatId, [...updatedMessages, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle retrying a message
  const handleRetryMessage = (content: string) => {
    // Find the last user message and its index
    const messagesReversed = [...messages];
    messagesReversed.reverse();
    const lastUserMessageIndex = messagesReversed.findIndex(msg => msg.role === 'user');
    
    if (lastUserMessageIndex !== -1) {
      // Convert the index back to the original array order
      const actualIndex = messages.length - 1 - lastUserMessageIndex;
      
      // Remove all messages after the last user message
      const updatedMessages = messages.slice(0, actualIndex);
      updateChatMessages(currentChatId as string, updatedMessages);
    }
    
    // Short delay to ensure state updates before sending
    setTimeout(() => {
      // Send the message
      handleSendMessage(content);
    }, 50);
  };

  // At the beginning of the Chat component, add a function to reset error state
  const resetError = () => {
    setError(null);
  };

  // Render Messages and the chat input
  return (
    <div className="flex flex-col h-full relative">
      {shouldCenterInput ? (
        // Centered welcome screen with input for new chat
        <div className="flex items-center justify-center h-full">
          <div className="w-full max-w-[640px] px-4 transform -translate-y-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold neon-teal mb-2">Welcome to Gemini 2.0 Flash</h2>
              <p className="text-[rgba(229,231,235,0.7)] mb-2">Ask me anything or upload an image to analyze</p>
            </div>
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
            />
          </div>
        </div>
      ) : (
        // Regular chat layout with messages and input at bottom
        <>
          <div 
            ref={messageContainerRef}
            className="flex-1 overflow-y-auto pb-2 custom-scrollbar"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  messageId={message.id}
                  content={message.id === typingMessageId ? displayedContent : message.content}
                  role={message.role}
                  isTyping={message.id === typingMessageId}
                  displayedContent={message.id === typingMessageId ? displayedContent : undefined}
                  imageUrl={message.imageUrl}
                  onRetry={message.role === 'user' ? handleRetryMessage : undefined}
                />
              ))}
              
              {/* Loading indicator */}
              {isLoading && !typingMessageId && (
                <div className="flex justify-center items-center py-10">
                  <div className="flex flex-col items-center">
                    <div className="h-5 w-5 relative mb-3">
                      <div className="animate-ping absolute h-5 w-5 rounded-full bg-[rgba(255,154,108,0.4)]"></div>
                      <div className="relative h-5 w-5 rounded-full bg-[rgba(255,154,108,0.7)]"></div>
                    </div>
                    <span className="capitalize text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-500 to-pink-500 font-medium text-lg animate-pulse">
                      {loadingTexts[loadingTextIndex]}...
                    </span>
                  </div>
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="py-4">
                  <ErrorRecovery error={error} onReset={resetError} />
                </div>
              )}
            </div>
            
            {/* Empty div for scrolling to the end of messages */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Fixed position chat input at bottom */}
          <div>
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
            />
          </div>
        </>
      )}
    </div>
  );
} 