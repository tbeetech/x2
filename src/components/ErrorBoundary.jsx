import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info);
    }
  }

  handleReset = () => {
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
        });
      }
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
          <h2 className="text-xl font-semibold">Something went wrong.</h2>
          <p className="max-w-md text-center text-sm text-slate-400">
            An unexpected error occurred while rendering this section. Please try again or contact support if the
            problem persists.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
