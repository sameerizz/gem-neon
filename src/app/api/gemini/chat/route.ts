import { NextResponse } from 'next/server';

export const runtime = "edge";

// Try multiple possible environment variable names
const GEMINI_API_KEY = 
  process.env.GEMINI_API_KEY || 
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.gemini_api_key; // Try lowercase version too

console.log('Environment vars check:', { 
  hasKey: !!GEMINI_API_KEY, 
  keyLength: GEMINI_API_KEY ? GEMINI_API_KEY.length : 0,
  firstFewChars: GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 3) + '...' : 'none'
});

const MODEL = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Define message type with optional imageUrl
type Message = {
  role: string;
  content: string;
  imageUrl?: string;
};

// Fetch from Gemini API with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 30000) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export async function POST(req: Request) {
  // Check if API key is configured
  if (!GEMINI_API_KEY) {
    console.error('API key missing! Make sure GEMINI_API_KEY is set in your environment variables.');
    const envVars = Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('KEY'));
    
    return NextResponse.json({ 
      error: "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.",
      debug: {
        availableEnvVars: envVars,
        runningIn: process.env.VERCEL_ENV || 'unknown',
        region: process.env.VERCEL_REGION || 'unknown'
      }
    }, { status: 500 });
  }
  
  try {
    const { messages }: { messages: Message[] } = await req.json();
    
    // Find the last user message
    const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user');
    const lastUserMessage = lastUserMessageIndex >= 0 ? messages[lastUserMessageIndex] : null;
    
    if (!lastUserMessage) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 });
    }

    // Build context from previous messages
    const conversationHistory = messages.slice(0, lastUserMessageIndex)
      .map((m: Message) => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
    
    // Check if the last user message contains an image
    const hasImage = !!lastUserMessage.imageUrl && !lastUserMessage.imageUrl.startsWith('[IMAGE');
    let requestBody: any;
    
    if (hasImage && lastUserMessage.imageUrl) {
      try {
        // Extract image data and MIME type
        const imageDataMatch = lastUserMessage.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        
        if (!imageDataMatch) {
          throw new Error('Invalid image data format');
        }
        
        const [, mimeType, base64Data] = imageDataMatch;
        
        // Check if the base64 data is too large (Gemini has a limit)
        // Approximate size in bytes
        const approximateSize = (base64Data.length * 3) / 4;
        const MAX_SIZE = 4 * 1024 * 1024; // 4MB limit
        
        if (approximateSize > MAX_SIZE) {
          throw new Error('Image size too large for Gemini API');
        }
        
        // Create multimodal request for image input
        requestBody = {
          contents: [
            {
              parts: [
                // Add previous conversation context if available
                ...(conversationHistory ? [{
                  text: conversationHistory
                }] : []),
                // Add the image as inline data
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                },
                // Add the text message if any
                {
                  text: `Human: ${lastUserMessage.content || "What's in this image?"}\nAssistant:`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096
          }
        };
      } catch (error) {
        console.error('Error processing image for Gemini API:', error);
        return NextResponse.json({ 
          error: `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 400 });
      }
    } else {
      // Text-only request - create a properly formatted prompt for Gemini
      const finalPrompt = conversationHistory 
        ? `${conversationHistory}\n\nHuman: ${lastUserMessage.content}\nAssistant:`
        : `Human: ${lastUserMessage.content}\nAssistant:`;
      
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: finalPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096
        }
      };
    }
    
    console.log("Sending to Gemini:", hasImage ? "Multimodal request with image" : requestBody.contents[0].parts[0].text);
    
    // Fetch from Gemini API with enhanced error handling
    try {
      const response = await fetchWithTimeout(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }, 30000); // 30-second timeout
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        
        try {
          // Try to parse as JSON if possible for more details
          const errorData = JSON.parse(errorText);
          return NextResponse.json({ 
            error: `Gemini API error: ${response.status}`, 
            details: errorData 
          }, { status: response.status });
        } catch (e) {
          // If not JSON, return as plain text
          return NextResponse.json({ 
            error: `Gemini API error: ${response.status}`, 
            details: errorText 
          }, { status: response.status });
        }
      }
      
      let data;
      try {
        const responseText = await response.text();
        
        // Pre-process the response text to remove any DOCTYPE or HTML tags
        const cleanedText = responseText
          .replace(/<!DOCTYPE[^>]*>/ig, '')
          .replace(/<\/?html[^>]*>/ig, '')
          .replace(/<\/?body[^>]*>/ig, '')
          .replace(/<\/?head[^>]*>/ig, '')
          .replace(/<[^>]*>/g, '')
          .trim();
        
        data = JSON.parse(cleanedText);
      } catch (error) {
        console.error('Error parsing JSON response:', error);
        return NextResponse.json({ 
          error: "Failed to parse API response"
        }, { status: 500 });
      }
      
      // Extract the response text based on the Gemini API response structure
      let text = '';
      if (data.candidates && data.candidates.length > 0) {
        if (data.candidates[0].content?.parts && data.candidates[0].content.parts.length > 0) {
          text = data.candidates[0].content.parts[0].text || '';
        }
      }
      
      // Sanitize the response to remove any unexpected tokens or characters
      // This will remove any potential HTML or DOCTYPE declarations that could cause JSON parsing issues
      text = text.replace(/<!DOCTYPE[^>]*>/i, '')
                .replace(/<html[^>]*>/i, '')
                .replace(/<\/?body[^>]*>/i, '')
                .replace(/<\/?head[^>]*>/i, '')
                .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
                .trim();
      
      // Clean up the response if needed
      if (text.startsWith('Assistant:')) {
        text = text.substring('Assistant:'.length).trim();
      }
      
      if (!text) {
        text = 'Sorry, I couldn\'t generate a response.';
      }
      
      console.log("Received from Gemini:", text.substring(0, 100) + '...');
      
      // Return the proper response format
      return NextResponse.json({ text });
    } catch (error) {
      console.error('Error in Gemini API request:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return NextResponse.json({ 
            error: "Request timed out. This could be due to a large image or network issues." 
          }, { status: 408 });
        }
        
        return NextResponse.json({ 
          error: `API request failed: ${error.message}` 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: "An unknown error occurred while processing your request." 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in Gemini API:', error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}

// Helper function to handle colon notation in route paths 
export async function GET(req: Request) {
  // Add a route to clear local storage data if there's corruption
  return NextResponse.json({ 
    message: "Gemini API is available. Use POST method to send messages."
  });
} 