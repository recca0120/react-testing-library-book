import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      eventId: Math.random().toString(36).substr(2, 9),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Call the error callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevResetKeys[idx] !== resetKey
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  render() {
    const { hasError, error, errorInfo, eventId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div role="alert" className="error-boundary" data-testid="error-boundary">
          <div className="error-content">
            <h2>Oops! Something went wrong</h2>
            <details className="error-details">
              <summary>Error Details</summary>
              <div className="error-info">
                <p><strong>Error:</strong> {error?.message}</p>
                <p><strong>Event ID:</strong> {eventId}</p>
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <p><strong>Stack Trace:</strong></p>
                    <pre className="error-stack">{error?.stack}</pre>
                    {errorInfo && (
                      <>
                        <p><strong>Component Stack:</strong></p>
                        <pre className="component-stack">{errorInfo.componentStack}</pre>
                      </>
                    )}
                  </>
                )}
              </div>
            </details>
            <div className="error-actions">
              <button onClick={this.resetErrorBoundary} data-testid="reset-button">
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()} 
                data-testid="reload-button"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component wrapper
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for throwing errors in functional components
export const useErrorHandler = () => {
  return (error: Error) => {
    throw error;
  };
};