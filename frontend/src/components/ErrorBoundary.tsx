"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary — catches uncaught React render errors and shows a
 * clean fallback UI instead of a blank page.
 * Wrap sections (or full pages) you want to isolate.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production you'd ship to Sentry / Datadog here
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 p-8 bg-white rounded-2xl border border-[#ccc3d7]/20">
          <span className="material-symbols-outlined text-5xl text-red-400">error_outline</span>
          <div className="text-center">
            <h3 className="font-display text-lg font-semibold text-[#1d1a24] mb-1">Something went wrong</h3>
            <p className="text-sm text-[#4a4455] max-w-sm">
              {this.state.error?.message || "An unexpected error occurred. Please refresh the page."}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2 bg-[#5300b7] text-white rounded-full text-sm font-semibold hover:scale-105 transition-all"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
