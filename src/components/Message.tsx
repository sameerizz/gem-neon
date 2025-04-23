"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyIcon } from '@radix-ui/react-icons';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { InlineMath, BlockMath } from 'react-katex';

type MessageProps = {
  content: string;
  role: 'user' | 'assistant';
  isTyping?: boolean;
  displayedContent?: string;
  imageUrl?: string;
  onRetry?: (content: string) => void;
  messageId: string;
};

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function Message({ 
  content, 
  role, 
  isTyping = false, 
  displayedContent = '', 
  imageUrl,
  onRetry,
  messageId
}: MessageProps) {
  // State to show copy tooltip
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [codeBlockCopied, setCodeBlockCopied] = useState<Record<number, boolean>>({});
  const markdownRef = useRef<HTMLDivElement>(null);
  
  // Use displayed content (for typewriter effect) if provided, otherwise use full content
  const textToShow = isTyping ? displayedContent : content;

  // Function to copy content to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setShowCopyTooltip(true);
    setTimeout(() => setShowCopyTooltip(false), 2000);
  };

  // Add copy buttons to code blocks after rendering
  useEffect(() => {
    if (!markdownRef.current || isTyping) return;

    // Find all code blocks
    const codeBlocks = markdownRef.current.querySelectorAll('pre');
    
    codeBlocks.forEach((codeBlock, index) => {
      // Skip if already has a copy button
      if (codeBlock.querySelector('.code-copy-button')) return;
      
      // Get the code content
      const code = codeBlock.querySelector('code');
      if (!code) return;
      
      // Position the container properly
      codeBlock.style.position = 'relative';
      
      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'code-copy-button absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs bg-[rgba(45,226,230,0.15)] hover:bg-[rgba(45,226,230,0.25)] text-[rgba(45,226,230,0.9)] border border-[rgba(45,226,230,0.3)] transition-all duration-200 opacity-0 group-hover:opacity-100';
      copyButton.title = 'Copy code';
      
      // Copy button inner content
      copyButton.innerHTML = `
        <span class="flex items-center">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </span>
      `;
      
      // Add click handler
      copyButton.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(code.textContent || '');
        
        // Show "Copied!" feedback
        copyButton.innerHTML = `
          <span class="flex items-center">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        `;
        
        // Reset after 2 seconds
        setTimeout(() => {
          copyButton.innerHTML = `
            <span class="flex items-center">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </span>
          `;
        }, 2000);
      });
      
      // Add the button to the code block
      codeBlock.appendChild(copyButton);
    });
  }, [content, isTyping]);

  // Function to detect if content is possibly HTML
  const isPossiblyHTML = (text: string) => {
    return /<\/?[a-z][\s\S]*>/i.test(text);
  };

  // Determine if current content might be HTML
  const mightBeHTML = role === 'assistant' && isPossiblyHTML(textToShow);

  return (
    <div className={`py-6 ${
      role === 'assistant' 
        ? 'bg-transparent' 
        : 'bg-[rgba(255,154,108,0.05)]'
      } mb-3 rounded-lg`}>
      <div className="mx-auto max-w-[740px] px-6">
        <div className="flex gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 mt-1">
            {role === 'assistant' ? (
              <div className="h-9 w-9 rounded-md bg-[rgba(45,226,230,0.08)] border border-[rgba(45,226,230,0.4)] shadow-[0_0_10px_rgba(45,226,230,0.2)] flex items-center justify-center text-[rgba(45,226,230,0.9)]">
                G
              </div>
            ) : (
              <div className="h-9 w-9 rounded-md bg-[rgba(255,154,108,0.08)] border border-[rgba(255,154,108,0.4)] shadow-[0_0_10px_rgba(255,154,108,0.2)] flex items-center justify-center text-[rgba(255,154,108,0.9)]">
                U
              </div>
            )}
          </div>
          
          {/* Message content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium flex items-center mb-2 justify-between">
              <div>
                {role === 'assistant' ? (
                  <span className="neon-teal mr-2">GEMINI</span>
                ) : (
                  <span className="neon-orange">You</span>
                )}
              </div>
              
              {/* Action buttons for user messages - only retry now */}
              {role === 'user' && onRetry && !isTyping && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onRetry(content)}
                    className="text-xs px-2 py-1 rounded bg-[rgba(255,154,108,0.1)] hover:bg-[rgba(255,154,108,0.2)] text-[rgba(255,154,108,0.9)] border border-[rgba(255,154,108,0.3)] transition-all duration-200"
                    title="Retry message"
                  >
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retry
                    </span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Display image if available */}
            {imageUrl && (
              <div className="mb-4">
                {imageUrl.startsWith('[IMAGE') ? (
                  <div className="rounded-lg border border-[rgba(45,226,230,0.3)] overflow-hidden bg-[rgba(0,0,0,0.2)] shadow-[0_0_10px_rgba(45,226,230,0.15)] p-4 flex items-center justify-center">
                    <div className="text-[rgba(229,231,235,0.7)] text-sm flex items-center">
                      <svg className="h-5 w-5 mr-2 text-[rgba(45,226,230,0.7)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Image (reload required to view)
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[rgba(45,226,230,0.3)] overflow-hidden bg-[rgba(0,0,0,0.2)] shadow-[0_0_10px_rgba(45,226,230,0.15)]">
                    <img 
                      src={imageUrl} 
                      alt="Uploaded" 
                      className="max-w-full max-h-[300px] object-contain"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Text content */}
            <div className={`prose prose-invert max-w-none group ${
              role === 'assistant' 
                ? 'text-[rgba(229,231,235,0.95)] text-[15px] leading-relaxed' 
                : 'text-[rgba(255,154,108,0.95)] text-[15px] leading-relaxed'
            }`}>
              {role === 'user' ? (
                <div className="whitespace-pre-wrap relative">
                  {textToShow}
                </div>
              ) : (
                <div ref={markdownRef} className="markdown-content relative">
                  {mightBeHTML ? (
                    // If content might be HTML, use rehypeRaw to render it
                    <div className="relative">
                      <ReactMarkdown
                        className="prose prose-invert max-w-none leading-[1.8] break-words"
                        components={{
                          code({ node, inline, className, children, ...props }: CodeProps) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeContent = String(children).replace(/\n$/, '');

                            // Handle math
                            if (inline) {
                              if (className === 'language-math') {
                                return <InlineMath math={codeContent} />;
                              }
                            } else if (className === 'language-math') {
                              return <BlockMath math={codeContent} />;
                            }

                            return !inline && match ? (
                              <div className="relative bg-gray-950 rounded-md mb-4">
                                <div className="flex items-center justify-between px-4 py-1 border-b border-gray-800 text-xs text-gray-400">
                                  <span>{match[1]}</span>
                                  <button
                                    onClick={() => copyToClipboard(codeContent)}
                                    className="hover:text-white transition"
                                    aria-label="Copy code"
                                  >
                                    <CopyIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {codeContent}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                        // Apply rehypeRaw plugin when content might be HTML
                        rehypePlugins={mightBeHTML ? [rehypeRaw] : []}
                      >
                        {textToShow}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    // Normal markdown rendering
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {textToShow}
                    </ReactMarkdown>
                  )}
                  {isTyping && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-[rgba(45,226,230,0.9)] cursor-blink"></span>
                  )}
                </div>
              )}
              
              {/* Message Copy button - shown on hover or when tooltip is active */}
              {!isTyping && textToShow && (
                <div className={`relative mt-2 flex justify-end ${showCopyTooltip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}>
                  <button 
                    onClick={() => copyToClipboard(textToShow)}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      role === 'assistant' 
                        ? 'bg-[rgba(45,226,230,0.1)] hover:bg-[rgba(45,226,230,0.2)] text-[rgba(45,226,230,0.9)] border border-[rgba(45,226,230,0.3)]' 
                        : 'bg-[rgba(255,154,108,0.1)] hover:bg-[rgba(255,154,108,0.2)] text-[rgba(255,154,108,0.9)] border border-[rgba(255,154,108,0.3)]'
                    } transition-all duration-200`}
                  >
                    {showCopyTooltip ? (
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 