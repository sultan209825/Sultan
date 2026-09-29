import React, { useState, useEffect } from 'react';
import { Crown, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onFinish?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('تهيئة بوابة السلطان...');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const steps = [
      { p: 35, text: 'تحميل الموارد الملكية...', delay: 250 },
      { p: 65, text: 'مزامنة بيانات السلطان والموسيقى...', delay: 550 },
      { p: 88, text: 'تجهيز المؤثرات والحماية...', delay: 850 },
      { p: 100, text: 'أهلاً بك في مملكة السلطان 👑', delay: 1100 }
    ];

    const timeouts = steps.map((step) =>
      setTimeout(() => {
        setProgress(step.p);
        setStatusText(step.text);
      }, step.delay)
    );

    const finishTimeout = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 400);
    }, 1450);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(finishTimeout);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#050509] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-400 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      dir="rtl"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full bg-red-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[350px] max-h-[350px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6">
        {/* Emblem with pulsing neon laser ring */}
        <div className="relative">
          <div className="absolute -inset-3 rounded-full border border-red-500/40 animate-laser" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 blur-sm opacity-60 animate-pulse" />
          
          <div className="relative w-28 h-28 rounded-full overflow-hidden bg-black p-1 border-2 border-red-500/80 shadow-2xl shadow-red-600/50 flex items-center justify-center">
            <img
              src="/og-image.png"
              alt="ELSULTAN Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-500 to-red-600 text-white p-1.5 rounded-full shadow-lg border border-amber-300/40 animate-bounce">
            <Crown size={15} />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-lg font-black text-white tracking-wide">
            <span className="text-red-500">𓆩</span>
            <span className="bg-gradient-to-r from-red-400 via-white to-amber-300 bg-clip-text text-transparent">
              ELSULTAN
            </span>
            <span className="text-red-500">𓆪</span>
          </div>
          <p className="text-xs font-mono text-zinc-400">سلطان • الموقع الشخصي الرسمي</p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full space-y-2.5">
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-[1px] border border-white/10 backdrop-blur-md">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_#ef4444]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
              <Sparkles size={12} className="text-amber-400 animate-spin" />
              <span>{statusText}</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
