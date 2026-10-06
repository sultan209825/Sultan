import React, { useState, useEffect } from 'react';
import { Timer, Sparkles, Flame, Calendar, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioEngine';

interface CountdownWidgetProps {
  targetDate: string;
  label?: string;
  accentColor?: string;
  className?: string;
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isReached: boolean;
  totalMs: number;
}

export const CountdownWidget: React.FC<CountdownWidgetProps> = ({
  targetDate,
  label = 'الهدف القادم 🎯',
  accentColor = '#ef4444',
  className = '',
  compact = false
}) => {
  const [time, setTime] = useState<TimeRemaining>(() => calculateRemaining(targetDate));

  function calculateRemaining(targetStr: string): TimeRemaining {
    if (!targetStr) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isReached: false, totalMs: 0 };
    }
    let parsed = new Date(targetStr).getTime();
    if (isNaN(parsed) && targetStr.includes(' ')) {
      parsed = new Date(targetStr.replace(' ', 'T')).getTime();
    }
    const target = parsed;
    const now = Date.now();
    const diff = target - now;

    if (isNaN(target) || diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isReached: true, totalMs: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isReached: false, totalMs: diff };
  }

  useEffect(() => {
    // Immediate calculation
    setTime(calculateRemaining(targetDate));

    // Live update every second for interactive real-time ticking
    const interval = setInterval(() => {
      setTime(calculateRemaining(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  const handleWidgetClick = () => {
    audioEngine.playPowerUpSound();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.4 }
    });
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      onClick={handleWidgetClick}
      className={`group/countdown relative cursor-pointer select-none rounded-2xl bg-gradient-to-br from-black/85 via-[#100c1e]/90 to-black/90 border border-white/10 hover:border-amber-500/40 shadow-lg shadow-black/70 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-98 ${
        compact ? 'p-1.5 sm:p-2' : 'p-2 sm:p-2.5'
      } ${className}`}
      style={{
        boxShadow: `0 4px 20px -2px rgba(0, 0, 0, 0.7), 0 0 15px -3px ${accentColor}25`
      }}
      title={`${label} - انقر للاحتفال! 🎉`}
      dir="rtl"
    >
      {/* Subtle Ambient Backlight Glow */}
      <div
        className="absolute -inset-0.5 rounded-2xl opacity-20 group-hover/countdown:opacity-40 blur-sm pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`
        }}
      />

      {/* Header Label Row */}
      <div className="relative z-10 flex items-center justify-between gap-1 pb-1 border-b border-white/5">
        <div className="flex items-center gap-1 min-w-0">
          <Flame size={compact ? 11 : 12} className="text-amber-400 shrink-0 animate-pulse" />
          <span
            className={`font-bold text-zinc-200 truncate group-hover/countdown:text-amber-300 transition-colors ${
              compact ? 'text-[10px]' : 'text-[10px] sm:text-[11px]'
            }`}
          >
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5 shrink-0">
          <Clock size={compact ? 9 : 10} className="text-amber-400" />
          <span>متبقي</span>
        </div>
      </div>

      {/* Countdown Digits Grid */}
      {time.isReached ? (
        <div className="relative z-10 pt-1.5 text-center flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 animate-bounce">
          <Sparkles size={14} className="text-amber-400" />
          <span>تم الوصول للهدف بنجاح! 👑🎉</span>
        </div>
      ) : (
        <div className="relative z-10 pt-1.5 flex items-center justify-between gap-1 text-center">
          {/* Days */}
          <div className="flex-1 min-w-[28px] sm:min-w-[34px] py-1 px-0.5 rounded-xl bg-white/[0.04] border border-white/5 group-hover/countdown:border-white/10 transition-colors">
            <span
              className={`block font-extrabold font-mono-custom text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] ${
                compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'
              }`}
            >
              {time.days}
            </span>
            <span className="block text-[7px] sm:text-[8px] text-zinc-400 font-sans font-medium">
              يوم
            </span>
          </div>

          <span className="text-zinc-600 font-bold text-[10px] select-none">:</span>

          {/* Hours */}
          <div className="flex-1 min-w-[26px] sm:min-w-[30px] py-1 px-0.5 rounded-xl bg-white/[0.04] border border-white/5 group-hover/countdown:border-white/10 transition-colors">
            <span
              className={`block font-extrabold font-mono-custom text-zinc-200 tracking-tight ${
                compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'
              }`}
            >
              {pad(time.hours)}
            </span>
            <span className="block text-[7px] sm:text-[8px] text-zinc-400 font-sans font-medium">
              ساعة
            </span>
          </div>

          <span className="text-zinc-600 font-bold text-[10px] select-none">:</span>

          {/* Minutes */}
          <div className="flex-1 min-w-[26px] sm:min-w-[30px] py-1 px-0.5 rounded-xl bg-white/[0.04] border border-white/5 group-hover/countdown:border-white/10 transition-colors">
            <span
              className={`block font-extrabold font-mono-custom text-zinc-200 tracking-tight ${
                compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'
              }`}
            >
              {pad(time.minutes)}
            </span>
            <span className="block text-[7px] sm:text-[8px] text-zinc-400 font-sans font-medium">
              دقيقة
            </span>
          </div>

          <span className="text-zinc-600 font-bold text-[10px] select-none">:</span>

          {/* Seconds (Pulsing live tick) */}
          <div className="flex-1 min-w-[26px] sm:min-w-[30px] py-1 px-0.5 rounded-xl bg-gradient-to-b from-amber-500/15 to-transparent border border-amber-500/30 group-hover/countdown:border-amber-400/50 transition-colors shadow-sm">
            <span
              className={`block font-extrabold font-mono-custom text-amber-400 tracking-tight animate-pulse ${
                compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'
              }`}
            >
              {pad(time.seconds)}
            </span>
            <span className="block text-[7px] sm:text-[8px] text-amber-300/80 font-sans font-medium">
              ثانية
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
