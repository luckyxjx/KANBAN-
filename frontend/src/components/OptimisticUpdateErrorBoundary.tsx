import React, { Component, type ReactNode } from 'react';
import { CloseIcon } from './icons';
import './OptimisticUpdateErrorBoundary.css';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class OptimisticUpdateErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Optimistic update error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="optimistic-error-overlay">
          <div className="optimistic-error-content">
            <div className="optimistic-error-header">
              <h3>Update Failed</h3>
              <button 
                className="optimistic-error-close"
                onClick={this.handleDismiss}
              >
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="optimistic-error-body">
              <p>
                Your changes couldn't be saved. This might be due to a network issue 
                or the item may have been modified by someone else.
              </p>
              
              {this.state.error && (
                <details className="optimistic-error-details">
                  <summary>Error details</summary>
                  <pre>{this.state.error.message}</pre>
                </details>
              )}
            </div>
            
            <div className="optimistic-error-actions">
              <button 
                className="button-secondary"
                onClick={this.handleDismiss}
              >
                Dismiss
              </button>
              {this.props.onRetry && (
                <button 
                  className="button-primary"
                  onClick={this.handleRetry}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default OptimisticUpdateErrorBoundary;