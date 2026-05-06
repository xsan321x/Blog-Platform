'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for the rich text editor.
 * Catches TipTap / ProseMirror runtime errors and shows a recovery UI.
 */
export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Editor crashed:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-destructive/30 bg-destructive/5 rounded-2xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center gap-4">
          <AlertTriangle className="w-10 h-10 text-destructive/60" />
          <div>
            <p className="font-semibold text-destructive mb-1">Editor failed to load</p>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred in the editor.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Reload editor
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
