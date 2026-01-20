import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-dark-card rounded-2xl p-8 border-2 border-accent">
            <div className="text-center">
              <div className="text-8xl mb-6">😱</div>
              <h1 className="text-4xl font-bold mb-4 text-accent">
                Oops! Something Went Wrong
              </h1>
              <p className="text-gray-300 mb-6">
                We encountered an unexpected error. This might be a temporary issue.
              </p>

              {this.state.error && (
                <div className="bg-dark-bg rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-mono text-gray-400">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={this.handleReset}
                  className="px-8 py-4 bg-primary hover:bg-primary-light text-white font-bold text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-glow transform hover:scale-105 active:scale-95"
                >
                  🔄 Reload App
                </button>

                <a
                  href="https://github.com/yourusername/booth-selfie/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-dark-lighter hover:bg-dark-card border-2 border-primary text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  🐛 Report Issue
                </a>
              </div>

              <p className="text-sm text-gray-500 mt-8">
                If the problem persists, please check your browser console for more details.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
