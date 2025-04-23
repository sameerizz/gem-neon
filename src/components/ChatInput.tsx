"use client";

import React, { useState, useRef, useEffect } from 'react';
import PromptTemplates from './PromptTemplates';

type ChatInputProps = {
  onSendMessage: (message: string, imageFile?: File) => void;
  isLoading?: boolean;
};

export default function ChatInput({ 
  onSendMessage, 
  isLoading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [globalDragActive, setGlobalDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedImage) && !isLoading) {
      onSendMessage(message, selectedImage || undefined);
      setMessage('');
      setSelectedImage(null);
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleImageDrop = (file: File) => {
    if (file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  // Handle image paste from clipboard
  const handlePaste = (e: ClipboardEvent) => {
    // Return if we're loading or no clipboard data
    if (isLoading || !e.clipboardData) return;
    
    const items = e.clipboardData.items;
    
    // Check if clipboard has image content
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        // Prevent default to avoid pasting image as text
        e.preventDefault();
        
        // Get image as a file
        const file = items[i].getAsFile();
        if (file) {
          // Show brief visual feedback for pasting
          setIsPasting(true);
          setTimeout(() => setIsPasting(false), 300);
          
          // Set the image
          setSelectedImage(file);
          return;
        }
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectTemplate = (promptTemplate: string) => {
    setMessage(promptTemplate);
    setShowTemplates(false);
    
    // Focus the textarea and resize it
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
      }, 0);
    }
  };

  // Toggle templates visibility
  const toggleTemplates = () => {
    setShowTemplates(!showTemplates);
  };

  // Local component drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setGlobalDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleImageDrop(file);
    }
  };

  // Global document drag and drop handlers
  const handleGlobalDragEnter = (e: DragEvent) => {
    e.preventDefault();
    
    // Check if files are being dragged
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      setGlobalDragActive(true);
    }
  };

  const handleGlobalDragOver = (e: DragEvent) => {
    e.preventDefault();
    // Keep the drag active while over the document
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      setGlobalDragActive(true);
    }
  };

  const handleGlobalDragLeave = (e: DragEvent) => {
    e.preventDefault();
    
    // Only deactivate if leaving the document entirely
    // This checks if we're leaving to an element outside the window
    if (e.relatedTarget === null) {
      setGlobalDragActive(false);
    }
  };
  
  const handleGlobalDrop = (e: DragEvent) => {
    e.preventDefault();
    setGlobalDragActive(false);
    setIsDragging(false);
    
    // Process the dropped files
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Only process image files
      if (file.type.startsWith('image/')) {
        handleImageDrop(file);
      }
    }
  };

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const resizeTextarea = () => {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`; // Max height of 200px
    };

    textarea.addEventListener('input', resizeTextarea);
    
    // Initial resize
    resizeTextarea();
    
    return () => textarea.removeEventListener('input', resizeTextarea);
  }, []);

  // Set up paste event listener
  useEffect(() => {
    // Add event listener to window for paste events
    window.addEventListener('paste', handlePaste);
    
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isLoading]); // Re-add listener when isLoading changes

  // Set up global drag and drop event listeners
  useEffect(() => {
    // Only add these listeners if we're not loading
    if (isLoading) return;
    
    document.addEventListener('dragenter', handleGlobalDragEnter);
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('drop', handleGlobalDrop);
    
    return () => {
      document.removeEventListener('dragenter', handleGlobalDragEnter);
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('dragleave', handleGlobalDragLeave);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, [isLoading]);

  return (
    <div className="sticky bottom-0 w-full py-4">
      {/* Global drag overlay - shows when dragging over any part of the page */}
      {globalDragActive && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-[rgba(0,0,0,0.5)] rounded-xl p-8 border-2 border-[rgba(45,226,230,0.7)] shadow-[0_0_30px_rgba(45,226,230,0.3)]">
            <div className="text-[rgba(45,226,230,0.9)] text-center">
              <svg className="h-16 w-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">Drop image anywhere</p>
            </div>
          </div>
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        className="mx-auto max-w-[740px] px-4"
      >
        <div className="relative">
          {/* Prompt Templates */}
          {showTemplates && (
            <div className="mb-3 glass-panel rounded-xl border border-[rgba(45,226,230,0.3)] shadow-[0_0_15px_rgba(45,226,230,0.15)] backdrop-blur-md overflow-hidden">
              <PromptTemplates onSelectTemplate={handleSelectTemplate} />
            </div>
          )}
        
          <div 
            ref={dropAreaRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`glass-panel rounded-xl border transition-all duration-300 ${
              isDragging || globalDragActive
                ? 'border-[rgba(45,226,230,0.7)] shadow-[0_0_20px_rgba(45,226,230,0.3)] min-h-[120px]' 
                : isPasting
                  ? 'border-[rgba(45,226,230,0.7)] shadow-[0_0_20px_rgba(45,226,230,0.3)]' 
                  : 'border-[rgba(45,226,230,0.3)] shadow-[0_0_15px_rgba(45,226,230,0.15)]'
            } backdrop-blur-md overflow-hidden flex flex-col`}
          >
            {/* Drag indicator overlay */}
            {isDragging && !globalDragActive && (
              <div className="absolute inset-0 bg-[rgba(45,226,230,0.05)] flex items-center justify-center pointer-events-none z-10">
                <div className="bg-[rgba(0,0,0,0.5)] rounded-lg p-4 border border-[rgba(45,226,230,0.5)]">
                  <div className="text-[rgba(45,226,230,0.9)] text-center">
                    <svg className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium">Drop image here</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show selected image preview if any */}
            {selectedImage && (
              <div className="px-4 pt-3 flex items-center">
                <div className="relative mr-2">
                  <div className="h-12 w-12 rounded-md border border-[rgba(45,226,230,0.5)] overflow-hidden relative">
                    <img 
                      src={URL.createObjectURL(selectedImage)} 
                      alt="Selected" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 bg-[rgba(45,226,230,0.15)] rounded-full h-5 w-5 flex items-center justify-center border border-[rgba(45,226,230,0.5)]"
                  >
                    <svg className="h-3 w-3 text-[rgba(229,231,235,0.95)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <span className="text-xs text-[rgba(229,231,235,0.7)]">{selectedImage.name}</span>
              </div>
            )}
            
            <div className={`flex items-center ${isDragging || globalDragActive ? 'py-4' : ''}`}>
              {/* Image upload button with tooltip */}
              <div className="group relative ml-3">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isLoading}
                  className="p-2.5 rounded-lg flex items-center justify-center transition-all duration-200 bg-[rgba(45,226,230,0.1)] hover:bg-[rgba(45,226,230,0.2)] border border-[rgba(45,226,230,0.3)] text-[rgba(45,226,230,0.9)]"
                  aria-label="Upload image"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                {/* <div className="absolute bottom-full right-0 mb-2 px-1.5 py-0.5 bg-[rgba(0,0,0,0.7)] text-white text-xs rounded shadow-sm border border-[rgba(45,226,230,0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                  Image <span className="text-[rgba(45,226,230,0.9)]">Ctrl+V</span>
                </div> */}
              </div>
              
              {/* Templates button with tooltip */}
              <div className="group relative ml-1">
                <button
                  type="button"
                  onClick={toggleTemplates}
                  disabled={isLoading}
                  className="p-2.5 rounded-lg flex items-center justify-center transition-all duration-200 bg-[rgba(45,226,230,0.1)] hover:bg-[rgba(45,226,230,0.2)] border border-[rgba(45,226,230,0.3)] text-[rgba(45,226,230,0.9)]"
                  aria-label="Prompt templates"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </button>
                {/* <div className="absolute bottom-full right-0 mb-2 px-1.5 py-0.5 bg-[rgba(0,0,0,0.7)] text-white text-xs rounded shadow-sm border border-[rgba(45,226,230,0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                  Prompt templates
                </div> */}
              </div>
              
              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
                disabled={isLoading}
              />
              
              {/* Text input with paste hint */}
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleMessageChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="How can I help you today?"
                  disabled={isLoading || isDragging || globalDragActive}
                  className={`w-full bg-transparent border-none resize-none py-4 px-5 text-base leading-relaxed text-[rgba(229,231,235,0.95)] outline-none placeholder:text-[rgba(229,231,235,0.5)] min-h-[54px] max-h-[200px] overflow-y-auto text-left ${
                    isDragging || globalDragActive ? 'opacity-50' : ''
                  }`}
                  rows={1}
                />
              </div>
              
              {/* Send button with tooltip */}
              <div className="group relative">
                <button
                  type="submit"
                  disabled={isLoading || (!message.trim() && !selectedImage) || isDragging || globalDragActive}
                  className={`mr-3 p-2.5 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    (message.trim() || selectedImage) && !isLoading && !isDragging && !globalDragActive
                      ? 'bg-[rgba(45,226,230,0.15)] hover:bg-[rgba(45,226,230,0.25)] border border-[rgba(45,226,230,0.3)] text-[rgba(45,226,230,0.9)]'
                      : 'opacity-50 bg-[rgba(45,226,230,0.05)] border border-[rgba(45,226,230,0.1)] text-[rgba(45,226,230,0.6)] cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-[rgba(45,226,230,0.9)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
                <div className="absolute bottom-full right-0 mb-2 px-1.5 py-0.5 bg-[rgba(0,0,0,0.7)] text-white text-xs rounded shadow-sm border border-[rgba(45,226,230,0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                  Send
                </div>
              </div>
            </div>
          </div>
          
          {/* Flash tag below input */}
          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[rgba(45,226,230,0.1)] border border-[rgba(45,226,230,0.3)] text-xs text-[rgba(45,226,230,0.9)]">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-[rgba(45,226,230,0.9)]"></span>
              Gemini 2.0 Flash
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 