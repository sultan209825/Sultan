import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Heart,
  Crown,
  Flame,
  Clock,
  Share2,
  Volume2,
  VolumeX,
  ThumbsUp,
  MessageCircle,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyStory, SiteConfig } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { recordSiteLog } from '../utils/siteLogger';
import { saveGlobalConfigToCloud } from '../services/firebase';

interface DailyStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: DailyStory;
  config: SiteConfig;
  onUpdateStory?: (updatedStory: DailyStory) => void;
  avatarUrl: string;
}

export const DailyStoryModal: React.FC<DailyStoryModalProps> = ({
  isOpen,
  onClose,
  story,
  config,
  onUpdateStory,
  avatarUrl
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [myReactions, setMyReactions] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [reactionsCount, setReactionsCount] = useState<Record<string, number>>(() => {
    return story.reactions || {
      '🔥': 82,
      '👑': 67,
      '🦾': 54,
      '❤️': 49
    };
  });

  // Swipe to dismiss state
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('sultan-clear-hover-state'));
    window.dispatchEvent(new CustomEvent('hide-custom-tooltip'));
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    audioEngine.playClickSound();
    onClose();
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (dragOffset > 85) {
      handleClose();
    }
    setDragOffset(0);
    setTouchStartY(null);
  };

  // Story auto-progress timer (10 seconds duration)
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused]);

  if (!isOpen) return null;

  const handleReact = (emoji: string) => {
    audioEngine.playPowerUpSound();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 }
    });

    const isAlready = myReactions[emoji];
    const newCount = (reactionsCount[emoji] || 0) + (isAlready ? -1 : 1);
    const updatedReactions = {
      ...reactionsCount,
      [emoji]: Math.max(0, newCount)
    };

    setMyReactions((prev) => ({ ...prev, [emoji]: !isAlready }));
    setReactionsCount(updatedReactions);

    const updatedStory: DailyStory = {
      ...story,
      reactions: updatedReactions,
      likesCount: (story.likesCount || 100) + (isAlready ? -1 : 1)
    };

    if (onUpdateStory) {
      onUpdateStory(updatedStory);
    }

    recordSiteLog('تفاعل مع ستوري السلطان 💬', `تفاعل بـ ${emoji} على حالة اليوم`);

    // Persist to Cloud Firestore
    saveGlobalConfigToCloud({
      ...config,
      dailyStory: updatedStory
    }).catch(() => {});
  };

  const handleShareStory = async () => {
    audioEngine.playClickSound();
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      confetti({ particleCount: 30, spread: 50 });
      recordSiteLog('مشاركة ستوري السلطان 🔗', 'نسخ رابط الموقع لمشاركة ستوري اليوم');
    } catch {}
  };

  const reactionEmojis = [
    { emoji: '🔥', label: 'حريقة' },
    { emoji: '👑', label: 'فخم' },
    { emoji: '🦾', label: 'وحش' },
    { emoji: '❤️', label: 'حب' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={handleClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-md rounded-t-[32px] sm:rounded-3xl bg-[#0d0e18] border border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.35)] overflow-hidden flex flex-col justify-between p-5 sm:p-6 min-h-[500px] text-white animate-modal-slide-up transition-transform"
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Swipe to Dismiss Top Grab Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 hover:bg-white/40 mx-auto -mt-1 mb-2.5 cursor-grab shrink-0 transition-colors" />

        {/* Animated Background Aura */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-red-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Progress Bar */}
        <div className="relative z-10 w-full mb-4">
          <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-red-500 rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_#ef4444]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header: Sultan Avatar, Username, Time & Close Button */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-red-600 via-amber-500 to-rose-500 animate-spin-slow">
                <img
                  src={avatarUrl}
                  alt={config.username}
                  className="w-full h-full rounded-full object-cover bg-zinc-900 border border-black"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs">👑</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-white tracking-wide">{config.username}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                  ستوري اليوم 🔴
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <Clock size={11} className="text-amber-400" />
                <span>{story.createdAt || 'اليوم • نشط الآن'}</span>
                <span>•</span>
                <span className="text-zinc-300 font-mono">@{config.handle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareStory}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
              title="مشاركة الستوري"
            >
              {copiedLink ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Story Body Card */}
        <div className="relative z-10 my-auto py-6 flex flex-col items-center text-center space-y-4">
          {/* Mood Emoji & Category Tag */}
          <div className="flex items-center gap-2">
            <span className="text-4xl sm:text-5xl animate-bounce drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              {story.moodEmoji || '🦾'}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold shadow-md">
            <Sparkles size={12} className="text-amber-400" />
            <span>{story.category || 'يوميات وبطولات السلطان'}</span>
          </div>

          {/* Story Quote Text */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-inner w-full">
            <p className="text-base sm:text-lg font-bold text-zinc-100 leading-relaxed font-sans select-none">
              « {story.text || 'اليوم تركيز عالي في الجيم 🦾 + مذاكرة فيزياء 📖.. ومساءً سهرة رايقة فالورانت وديسكورد مع الشباب! 🔥'} »
            </p>
          </div>

          <p className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>اضغط مطولاً للإيقاف المؤقت ⏸️</span>
          </p>
        </div>

        {/* Bottom Reactions Bar */}
        <div className="relative z-10 pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-bold px-1">
            <span>تفاعل مع حالة السلطان اليوم:</span>
            <span className="text-[11px] text-amber-400 font-mono">
              {Object.values(reactionsCount).reduce((a, b) => a + b, 0)} تفاعل 🔥
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {reactionEmojis.map((r) => {
              const active = myReactions[r.emoji];
              const count = reactionsCount[r.emoji] || 0;
              return (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => handleReact(r.emoji)}
                  className={`py-2 px-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 active:scale-90 ${
                    active
                      ? 'bg-gradient-to-t from-red-600/40 to-amber-500/30 border-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{r.emoji}</span>
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
                    <span>{count}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
