import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ORCA ERROR BOUNDARY]', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#020b14] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-ocean-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h2 className="text-lg font-bold">ORCA Interface Recovery</h2>
                <p className="text-xs text-slate-400">An unexpected UI rendering error was intercepted.</p>
              </div>
            </div>

            <div className="bg-ocean-1000 p-3 rounded-xl border border-ocean-800 text-xs font-mono text-red-300 overflow-x-auto max-h-40">
              {this.state.error?.toString() || 'Unknown runtime error'}
            </div>

            <button
              type="button"
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
