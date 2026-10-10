import React from 'react';
import { X, Crown, Flame, Sparkles, Trophy, CheckCircle, ShieldCheck } from 'lucide-react';
import { LOYALTY_TIERS, VisitorLoyaltyState } from '../utils/visitorLoyalty';
import { audioEngine } from '../utils/audioEngine';

interface VisitorLoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  loyalty: VisitorLoyaltyState;
}

export const VisitorLoyaltyModal: React.FC<VisitorLoyaltyModalProps> = ({
  isOpen,
  onClose,
  loyalty
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    audioEngine.playClickSound();
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0d0e18] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/20 text-white space-y-4 animate-modal-slide-up max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
              <Flame size={20} className="animate-pulse text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5 font-display-custom">
                <span>أوسمة ورتب الولاء الملكية</span>
                <span className="text-amber-400">{loyalty.currentTier.badge}</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                سلسلة زيارات متتالية: <strong className="text-amber-400">{loyalty.streakDays} أيام</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Active Badge Highlight */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-950/30 to-black/60 border border-amber-500/40 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-md">
              {loyalty.currentTier.badge}
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-mono">رتبتك الحالية في المملكة:</span>
              <h4 className="text-sm font-black text-amber-300 font-display-custom">
                {loyalty.currentTier.name}
              </h4>
              <p className="text-[10px] text-zinc-300 mt-0.5">{loyalty.currentTier.perkDescription}</p>
            </div>
          </div>
          <div className="text-left shrink-0">
            <span className="text-xs font-mono font-black text-emerald-400 block">
              🔥 {loyalty.streakDays}
            </span>
            <span className="text-[9px] text-zinc-400">يوم متصل</span>
          </div>
        </div>

        {/* Next Tier Progress */}
        {loyalty.nextTier && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px] text-zinc-300">
              <span>الرتبة القادمة: <strong className="text-amber-300">{loyalty.nextTier.name} {loyalty.nextTier.badge}</strong></span>
              <span className="text-amber-400 font-mono">متبقي {loyalty.daysToNextTier} أيام</span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((loyalty.streakDays / loyalty.nextTier.minDays) * 100))}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Tiers Ladder */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] text-zinc-400 font-bold block">مستويات الولاء الملكية:</span>
          {LOYALTY_TIERS.map((tier) => {
            const isUnlocked = loyalty.streakDays >= tier.minDays;
            const isCurrent = loyalty.currentTier.id === tier.id;

            return (
              <div
                key={tier.id}
                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-400/30'
                    : isUnlocked
                    ? 'bg-white/5 border-emerald-500/30'
                    : 'bg-black/30 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{tier.badge}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate">{tier.name}</span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          أنت هنا
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 truncate block">
                      {tier.perkDescription}
                    </span>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  {isUnlocked ? (
                    <span className="text-emerald-400 text-xs flex items-center gap-1">
                      <CheckCircle size={13} />
                      <span className="text-[10px]">مفعّل</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-400">
                      {tier.minDays} أيام
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-zinc-400 text-center pt-1 font-mono">
          قم بزيارة الموقع يومياً لتطوير رتبتك والحفاظ على سلسلة الحماس 🔥
        </p>
      </div>
    </div>
  );
};
