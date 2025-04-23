import { NextResponse } from 'next/server';

export const runtime = "edge";

export async function GET() {
  // Create a safe list of environment variables (removing actual values of sensitive ones)
  const safeEnvList = Object.keys(process.env).map(key => {
    const isSensitive = 
      key.includes('KEY') || 
      key.includes('SECRET') || 
      key.includes('TOKEN') || 
      key.includes('PASSWORD');
    
    return {
      name: key,
      exists: true,
      value: isSensitive ? `${key} exists but value hidden for security` : process.env[key],
      sensitive: isSensitive
    };
  });

  return NextResponse.json({
    message: "Environment variables test",
    geminiKeyExists: !!process.env.GEMINI_API_KEY,
    geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    environment: process.env.NODE_ENV || 'unknown',
    vercelEnv: process.env.VERCEL_ENV || 'not on vercel',
    envVars: safeEnvList,
  });
} 