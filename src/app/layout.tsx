import "./globals.css";
import type { Metadata } from "next";
import { ChatProvider } from "@/lib/contexts/ChatContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Neon Gemini",
  description: "A futuristic chat interface with Google's Gemini API",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#061b2b] bg-cover bg-center bg-no-repeat bg-fixed">
        <ErrorBoundary>
          <ChatProvider>
            {children}
          </ChatProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
