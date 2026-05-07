import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} className="text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Oops! Something went wrong
              </h1>

              <p className="text-slate-600 mb-6 leading-relaxed">
                We encountered an unexpected error. This has been logged and our team will look into it.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-sm font-medium text-red-600 mb-2">Error Details:</h3>
                  <pre className="text-xs text-slate-700 overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Home size={16} />
                  <span>Go Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
