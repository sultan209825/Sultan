import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Sultan Biolink app:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-[#06060a] text-white flex flex-col items-center justify-center p-6 text-center select-none"
          dir="rtl"
        >
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0e0e18] border border-red-500/30 shadow-2xl shadow-red-500/20 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-lg">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">حدث خطأ أثناء تحميل الصفحة</h2>
              <p className="text-xs text-zinc-400">
                جارٍ استعادة الحالة الملكية الافتراضية بنجاح
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-left font-mono text-[11px] text-zinc-400 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RotateCw size={16} />
              <span>إعادة تشغيل وتحديث الصفحة 🔄</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
