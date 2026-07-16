import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="card max-w-md w-full p-8 text-center shadow-xl border border-slate-100 dark:border-slate-800 backdrop-blur-md bg-white/85 dark:bg-slate-800/85">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Terjadi Kesalahan Sistem
            </h2>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Aplikasi mengalami kendala teknis yang tidak terduga. Silakan muat ulang halaman atau kembali ke Beranda.
            </p>

            {this.state.error && (
              <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg text-left text-xs font-mono text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto mb-6 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-red-500">[Error] </span>
                {this.state.error.message}
                {this.state.error.stack && (
                  <pre className="mt-1 whitespace-pre-wrap leading-relaxed opacity-70">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="btn-primary w-full py-2.5 rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
              </svg>
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
