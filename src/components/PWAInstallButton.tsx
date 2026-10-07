import React, { useState } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, CheckCircle2, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'floating' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // If already installed as standalone PWA, don't show prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
    } else {
      // If beforeinstallprompt hasn't fired yet or browser requires manual add
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-600/30 via-purple-600/30 to-red-600/30 hover:from-red-600/50 hover:to-purple-600/50 border border-red-500/40 text-red-200 hover:text-white text-[11px] font-bold transition-all shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] ${className}`}
          title="تثبيت التطبيق على هاتفك (PWA App)"
        >
          <Smartphone className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="hidden xs:inline">تثبيت التطبيق</span>
          <span className="xs:hidden">تثبيت</span>
        </button>
      )}

      {variant === 'card' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-[#0e0e1a] to-purple-950/40 border border-red-500/30 hover:border-red-400/60 transition-all text-right group ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                  تثبيت موقع سلطان كتطبيق هاتف (PWA)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-300 font-mono">App</span>
              </div>
              <p className="text-[11px] text-zinc-400">وصول سريع للشاشة الرئيسية وأداء فائق السرعة بدون متصفح</p>
            </div>
          </div>
          <Download className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
        </button>
      )}

      {/* iOS & Manual Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#0c0c16] border border-red-500/40 p-5 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-right">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">تثبيت تطبيق سلطان 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪</h3>
                <p className="text-[11px] text-zinc-400">على أجهزة آيفون (iOS) والأجهزة الأخرى</p>
              </div>
            </div>

            <div className="space-y-3 my-4 text-xs text-zinc-300 bg-black/40 p-3.5 rounded-xl border border-white/5">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  اضغط على زر المشاركة <Share2 className="w-3.5 h-3.5 inline mx-1 text-cyan-400" /> في شريط متصفح سفاري بالأسفل.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  مرر لأسفل واختر <span className="text-white font-bold inline-flex items-center gap-1">إضافة إلى الصفحة الرئيسية <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /></span>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  اضغط على <span className="text-white font-bold">إضافة (Add)</span> في الزاوية العلوية ليظهر التطبيق في شاشتك كأيقونة مستقلة وبدون شريط عنوان!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg"
            >
              فهمت، شكراً ✨
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-white shadow-2xl animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">تم تثبيت التطبيق بنجاح على جهازك!</span>
        </div>
      )}
    </>
  );
};
