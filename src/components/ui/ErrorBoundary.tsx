import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * React requires error boundaries to be class components - there's no hooks
 * equivalent for getDerivedStateFromError/componentDidCatch.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("AlienOS encountered an unexpected error:", error);
  }

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-[var(--color-canvas)] text-center px-4">
          <img src="/logo.svg" alt="" className="h-14 w-14 rounded-xl" />
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Something went wrong</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              AlienOS hit an unexpected error. Your data is safe in local storage - try reloading.
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="inline-flex items-center h-11 md:h-9 px-4 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm shadow-accent-500/20 transition-colors duration-150"
          >
            Reload AlienOS
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
