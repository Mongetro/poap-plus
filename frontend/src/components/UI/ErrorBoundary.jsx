import { Component } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

/**
 * ErrorBoundary Class Component - Catches JavaScript errors in child component tree
 * @description A React error boundary that catches errors in its child components and displays a fallback UI
 * @features Error catching, error logging, user-friendly error display, recovery mechanism
 * @extends Component
 */
class ErrorBoundary extends Component {
  /**
   * Constructor - Initializes component state
   * @param {Object} props - Component properties
   */
  constructor(props) {
    super(props);
    this.state = {
      hasError: false, // Tracks whether an error has been caught
      error: null, // Stores the caught error object
      errorInfo: null, // Stores additional error information
    };
  }

  /**
   * Static lifecycle method - Updates state when an error is thrown in child components
   * @param {Error} error - The error that was thrown
   * @returns {Object} State update to trigger error display
   * @static
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error,
    };
  }

  /**
   * Lifecycle method - Called after an error has been caught by the error boundary
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Information about which component threw the error
   */
  componentDidCatch(error, errorInfo) {
    // Log error details to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    // You could also log errors to an external service here:
    // logErrorToService(error, errorInfo);

    // Update state with error information
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  /**
   * Handles retry action - resets error state to attempt re-rendering children
   */
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Render method - displays fallback UI when errors occur, otherwise renders children
   * @returns {JSX.Element} Either error display or child components
   */
  render() {
    // If an error has been caught, display fallback UI
    if (this.state.hasError) {
      return (
        // Full-screen error container with centered content
        <div
          className="d-flex justify-content-center align-items-center min-vh-100 bg-light"
          role="alert" // Accessibility: indicates this is an error alert
          aria-live="polite" // Accessibility: announces changes to screen readers
        >
          <div className="text-center">
            {/* Error Icon - Visual indicator of problem */}
            <FaExclamationTriangle
              className="text-danger mb-3"
              size={48}
              aria-hidden="true" // Accessibility: icon is decorative
            />

            {/* Error Heading */}
            <h2 className="h4 mb-3">Something went wrong</h2>

            {/* User-friendly Error Message */}
            <p className="text-muted mb-3">
              Please refresh the page and try again.
            </p>

            {/* Recovery Action Button */}
            <button
              className="btn btn-primary"
              onClick={this.handleRetry}
              aria-label="Try to reload the application"
            >
              Try again
            </button>

            {/* Optional: Display detailed error info in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3 text-start small">
                <summary>Error Details (Development)</summary>
                <pre className="mt-2 p-2 bg-dark text-light rounded">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
