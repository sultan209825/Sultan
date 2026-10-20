import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Share2,
  Copy,
  MessageSquare,
  Check,
  Gamepad2,
  Sparkles,
  Crown,
  Radio,
  RotateCcw,
  ExternalLink,
  Flame,
  X,
  Zap,
  Leaf,
  Palette,
  BatteryCharging,
  Link2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioEngine';
import { recordSiteLog } from '../utils/siteLogger';
import { DISCORD_USER_ID } from '../utils/lanyard';
import { THEMES } from '../utils/themeSystem';

interface CustomContextMenuProps {
  onShare: () => void;
  onOpenGame?: () => void;
  onOpenTicTacToe?: () => void;
  onOpenRadar?: () => void;
  onOpenLoyalty?: () => void;
  discordUrl?: string;
  discordUsername?: string;
  discordUserId?: string;
  isEcoMode?: boolean;
  onToggleEcoMode?: () => void;
  currentTheme?: string;
  onCycleTheme?: () => void;
}

export const CustomContextMenu: React.FC<CustomContextMenuProps> = ({
  onShare,
  onOpenGame,
  onOpenTicTacToe,
  onOpenRadar,
  onOpenLoyalty,
  discordUrl = 'https://discord.gg/TUU6EeC6pb',
  discordUsername = '5susu',
  discordUserId = DISCORD_USER_ID,
  isEcoMode = false,
  onToggleEcoMode,
  currentTheme = 'blood_royal',
  onCycleTheme
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const openTimeRef = useRef<number>(0);
  const openScrollYRef = useRef<number>(0);
  const touchTimerRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const openAtCoordinates = useCallback((clientX: number, clientY: number) => {
    openTimeRef.current = Date.now();
    openScrollYRef.current = window.scrollY;

    const menuWidth = 295;
    const menuHeight = 490;
    const margin = 16;

    let x = clientX;
    let y = clientY;

    if (x + menuWidth > window.innerWidth - margin) {
      x = window.innerWidth - menuWidth - margin;
    }
    if (x < margin) {
      x = margin;
    }

    if (y + menuHeight > window.innerHeight - margin) {
      y = window.innerHeight - menuHeight - margin;
    }
    if (y < margin) {
      y = margin;
    }

    setPos({ x, y });
    setVisible(true);

    audioEngine.playClickSound();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(12); } catch {}
    }
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow native browser menu if Shift is held down
      if (e.shiftKey) {
        setVisible(false);
        return;
      }

      // Allow native context menu inside editable inputs
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) {
        setVisible(false);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      openAtCoordinates(e.clientX, e.clientY);
    };

    // Mobile long press (550ms)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, button, a')) return;

      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }

      touchTimerRef.current = window.setTimeout(() => {
        openAtCoordinates(touch.clientX, touch.clientY);
      }, 550);
    };

    const handleTouchEnd = () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    };

    const handlePointerDownOutside = (e: MouseEvent | PointerEvent) => {
      if (e.button === 2) return;
      if (Date.now() - openTimeRef.current < 180) return;

      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    const handleScroll = () => {
      if (Math.abs(window.scrollY - openScrollYRef.current) > 35) {
        setVisible(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchmove', handleTouchEnd, { passive: true });
    document.addEventListener('pointerdown', handlePointerDownOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchEnd);
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, [openAtCoordinates]);

  if (!visible) return null;

  const handleCopyLink = () => {
    audioEngine.playClickSound();
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x: pos.x / window.innerWidth, y: pos.y / window.innerHeight }
      });
      setTimeout(() => {
        setCopiedLink(false);
        setVisible(false);
      }, 900);
      recordSiteLog('نسخ رابط الموقع 🔗', 'نسخ من القائمة الملكية');
    } catch {}
  };

  const discordProfileUrl = `https://discord.com/users/${discordUserId || DISCORD_USER_ID}`;

  const handleCopyAccountLink = () => {
    audioEngine.playClickSound();
    try {
      navigator.clipboard.writeText(discordProfileUrl);
      setCopiedAccount(true);
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { x: pos.x / window.innerWidth, y: pos.y / window.innerHeight }
      });
      setTimeout(() => {
        setCopiedAccount(false);
        setVisible(false);
      }, 1000);
      recordSiteLog('نسخ لينك حساب الديسكورد 🔗', `تم نسخ الرابط: ${discordProfileUrl}`);
    } catch {}
  };

  const themeObj = THEMES[currentTheme] || THEMES.blood_royal;

  return (
    <div
      ref={menuRef}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-[99999] w-[295px] bg-[#090b14]/98 border border-red-500/40 rounded-2xl p-2.5 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(239,68,68,0.25)] text-right select-none animate-in fade-in zoom-in-95 duration-150 backdrop-blur-3xl overflow-hidden"
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Cyber-Royal Header Capsule */}
      <div className="px-3 py-2 text-[11px] font-bold text-zinc-300 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-red-950/60 via-[#150e1e] to-transparent rounded-xl mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-600/30 border border-red-500/50 flex items-center justify-center text-amber-300 shadow-md">
            👑
          </div>
          <div>
            <h4 className="text-white font-extrabold tracking-wide text-xs">قائمة السلطان الملكية</h4>
            <span className="text-[9px] text-zinc-400 font-mono">Cyber Controls</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X size={13} />
        </button>
      </div>

      {/* 2. Top Interactive 3-Grid (الألعاب والرادار) */}
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        {/* Game 1: Runner */}
        <button
          type="button"
          onClick={() => {
            onOpenGame?.();
            setVisible(false);
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-red-950/40 to-black border border-red-500/30 hover:border-red-400 text-center flex flex-col items-center justify-center gap-1 group transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          title="تشغيل لعبة قفزة السلطان"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
            <Gamepad2 size={14} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-200 group-hover:text-white truncate">القفزة</span>
        </button>

        {/* Game 2: Tic-Tac-Toe */}
        <button
          type="button"
          onClick={() => {
            onOpenTicTacToe?.();
            setVisible(false);
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-amber-950/40 to-black border border-amber-500/30 hover:border-amber-400 text-center flex flex-col items-center justify-center gap-1 group transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          title="تحدي إكس أو الملكي"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Crown size={14} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-200 group-hover:text-white truncate">إكس أو</span>
        </button>

        {/* Radar */}
        <button
          type="button"
          onClick={() => {
            onOpenRadar?.();
            setVisible(false);
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-cyan-950/40 to-black border border-cyan-500/30 hover:border-cyan-400 text-center flex flex-col items-center justify-center gap-1 group transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          title="فتح رادار نشاط الديسكورد"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
            <Radio size={14} className="animate-pulse" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-200 group-hover:text-white truncate">الرادار</span>
        </button>
      </div>

      {/* 3. Settings Quick Row: Eco Mode & Theme Switcher */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {/* Eco Mode Toggle */}
        <button
          type="button"
          onClick={() => {
            onToggleEcoMode?.();
            audioEngine.playPowerUpSound();
          }}
          className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
            isEcoMode
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'bg-white/[0.04] border-white/10 hover:border-white/20 text-zinc-300 hover:text-white'
          }`}
          title="تفعيل أو إلغاء وضع توفير الطاقة"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Leaf size={14} className={isEcoMode ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'} />
            <div className="text-right min-w-0">
              <p className="text-[10px] font-extrabold truncate">توفير الطاقة</p>
              <p className="text-[9px] text-zinc-400">{isEcoMode ? 'مفعّل 🌿' : 'معطّل ⚡'}</p>
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full ${isEcoMode ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-zinc-600'}`} />
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={() => {
            onCycleTheme?.();
          }}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-500/40 text-zinc-200 hover:text-white flex items-center justify-between transition-all cursor-pointer"
          title="تبديل الثيم الملكي"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Palette size={14} className="text-amber-400" />
            <div className="text-right min-w-0">
              <p className="text-[10px] font-extrabold truncate">تبديل الثيم</p>
              <p className="text-[9px] text-amber-300 truncate">{themeObj.emoji} {themeObj.name}</p>
            </div>
          </div>
          <RotateCcw size={11} className="text-zinc-400 hover:rotate-180 transition-transform" />
        </button>
      </div>

      {/* 4. Action Rows List */}
      <div className="space-y-1 text-xs text-zinc-200">
        {/* Discord Server Link */}
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            audioEngine.playClickSound();
            setVisible(false);
          }}
          className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between bg-indigo-950/30 hover:bg-indigo-600/25 border border-indigo-500/25 hover:border-indigo-500/50 hover:text-white transition-all text-right group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/25 text-indigo-300 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <MessageSquare size={13} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-[11px] truncate">سيرفر ديسكورد السلطان</p>
              <p className="text-[9px] text-indigo-300/80 truncate">Friends For Ever 🚀</p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>متصل</span>
          </span>
        </a>

        {/* Copy Discord Account Link */}
        <button
          type="button"
          onClick={handleCopyAccountLink}
          className="w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between hover:bg-white/10 hover:text-white transition-all text-right group cursor-pointer"
          title={`نسخ لينك حساب الديسكورد: ${discordProfileUrl}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
              {copiedAccount ? <Check size={13} className="text-emerald-400" /> : <Link2 size={13} />}
            </div>
            <span className="font-medium text-[11px] truncate">
              {copiedAccount ? 'تم نسخ لينك الحساب! 🔗' : 'نسخ لينك حساب الديسكورد'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-zinc-400">Link 🔗</span>
        </button>

        {/* Copy Website URL */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between hover:bg-white/10 hover:text-white transition-all text-right group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </div>
            <span className="font-medium text-[11px] truncate">
              {copiedLink ? 'تم نسخ رابط الموقع! 🎉' : 'نسخ رابط الموقع'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-zinc-400">URL</span>
        </button>

        {/* Native Web Share */}
        <button
          type="button"
          onClick={() => {
            onShare();
            setVisible(false);
          }}
          className="w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between hover:bg-white/10 hover:text-white transition-all text-right group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Share2 size={13} />
            </div>
            <span className="font-medium text-[11px] truncate">مشاركة صفحة البروفايل</span>
          </div>
          <span className="text-[9px] font-mono text-amber-400/80">Share</span>
        </button>

        {/* Loyalty Badges Modal */}
        {onOpenLoyalty && (
          <button
            type="button"
            onClick={() => {
              onOpenLoyalty();
              setVisible(false);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between hover:bg-white/10 hover:text-white transition-all text-right group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame size={13} />
              </div>
              <span className="font-medium text-[11px] truncate">أوسمة ورتب الولاء الملكية</span>
            </div>
            <span className="text-[9px] font-mono text-amber-400 font-bold">VIP</span>
          </button>
        )}

        {/* Refresh Page */}
        <button
          type="button"
          onClick={() => {
            audioEngine.playClickSound();
            window.location.reload();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between hover:bg-white/10 hover:text-white transition-all text-right group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
              <RotateCcw size={13} />
            </div>
            <span className="font-medium text-[11px] truncate">تحديث الصفحة</span>
          </div>
          <span className="text-[9px] font-mono text-zinc-400">Reload</span>
        </button>
      </div>
    </div>
  );
};
