import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can wire this to a logging service later
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background-primary p-6">
          <div className="max-w-lg w-full bg-background-secondary border border-border-subtle rounded-lg p-6 text-text-primary">
            <div className="flex items-center mb-4">
              <svg
                className="w-6 h-6 text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold">Something went wrong</h2>
            </div>
            <p className="text-text-secondary text-sm">
              An unexpected error occurred. You can try to continue working or
              reload the app.
            </p>
            {this.state.error && (
              <pre className="mt-3 text-xs overflow-auto bg-neutral-900 text-neutral-200 p-3 rounded max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded"
              >
                Continue
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-border-subtle rounded hover:bg-background-primary"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
