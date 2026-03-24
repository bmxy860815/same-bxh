import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-500 font-medium">预览加载失败</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-[10px] text-red-400 underline"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
