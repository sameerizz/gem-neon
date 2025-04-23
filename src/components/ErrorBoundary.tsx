"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorRecovery from './ErrorRecovery';
import { clearLocalStorageData } from '../lib/utils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center">
          <ErrorRecovery 
            error={this.state.error?.message || "An unexpected error occurred"} 
            onReset={this.handleReset} 
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 