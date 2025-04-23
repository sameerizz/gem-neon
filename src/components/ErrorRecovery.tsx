"use client";

import React from 'react';
import { clearLocalStorageData } from '../lib/utils';

type ErrorRecoveryProps = {
  error: string;
  onReset: () => void;
};

export default function ErrorRecovery({ error, onReset }: ErrorRecoveryProps) {
  const handleClearData = () => {
    clearLocalStorageData();
    // Reload the page to get a fresh state
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-[rgba(255,100,100,0.1)] border border-[rgba(255,100,100,0.3)] rounded-lg shadow-lg mt-8">
      <h2 className="text-xl font-bold mb-4 text-[rgba(255,100,100,0.9)]">
        Error Encountered
      </h2>
      <p className="text-[rgba(229,231,235,0.95)] mb-4">
        {error || "An unexpected error occurred. This might be due to corrupted data or network issues."}
      </p>
      <div className="flex flex-col space-y-3">
        <button
          onClick={onReset}
          className="py-2 px-4 border border-[rgba(45,226,230,0.3)] bg-[rgba(45,226,230,0.1)] hover:bg-[rgba(45,226,230,0.2)] text-[rgba(45,226,230,0.9)] rounded transition-colors duration-200"
        >
          Try Again
        </button>
        <button
          onClick={handleClearData}
          className="py-2 px-4 border border-[rgba(255,154,108,0.3)] bg-[rgba(255,154,108,0.1)] hover:bg-[rgba(255,154,108,0.2)] text-[rgba(255,154,108,0.9)] rounded transition-colors duration-200"
        >
          Reset App Data
        </button>
      </div>
      <p className="text-xs text-[rgba(229,231,235,0.7)] mt-4">
        Note: Resetting app data will clear your chat history and any unsaved messages.
      </p>
    </div>
  );
} 