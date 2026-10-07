import React, { useState } from 'react';
import { Gamepad2, Copy, Check, ExternalLink, ShieldCheck, Flame, Trophy, Sparkles, Swords, Zap } from 'lucide-react';
import { GamerAccount, GamerHubConfig } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { ThemeDefinition } from '../utils/themeSystem';

interface GamerHubProps {
  config?: GamerHubConfig;
  theme: ThemeDefinition;
}

export const GamerHub: React.FC<GamerHubProps> = ({ config, theme }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!config || !config.enabled) return null;

  const enabledAccounts = config.accounts?.filter((acc) => acc.enabled) || [];
  if (enabledAccounts.length === 0) return null;

  const handleCopy = (text: string, accId: string) => {
    audioEngine.playPowerUpSound();
    navigator.clipboard.writeText(text);
    setCopiedId(accId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const getGameBadge = (game: GamerAccount['game']) => {
    switch (game) {
      case 'valorant':
        return {
          icon: '⚡',
          color: 'from-rose-600/30 to-red-600/20 border-rose-500/40 text-rose-300',
          badgeText: 'VALORANT'
        };
      case 'steam':
        return {
          icon: '🎮',
          color: 'from-sky-600/30 to-indigo-600/20 border-sky-500/40 text-sky-300',
          badgeText: 'STEAM'
        };
      case 'pubg':
        return {
          icon: '🦅',
          color: 'from-amber-600/30 to-orange-600/20 border-amber-500/40 text-amber-300',
          badgeText: 'PUBG MOBILE'
        };
      case 'discord':
        return {
          icon: '💬',
          color: 'from-indigo-600/30 to-violet-600/20 border-indigo-500/40 text-indigo-300',
          badgeText: 'DISCORD'
        };
      case 'epic':
        return {
          icon: '🚀',
          color: 'from-zinc-600/30 to-zinc-800/30 border-zinc-400/40 text-zinc-200',
          badgeText: 'EPIC GAMES'
        };
      default:
        return {
          icon: '🎯',
          color: 'from-purple-600/30 to-pink-600/20 border-purple-500/40 text-purple-300',
          badgeText: 'GAMING'
        };
    }
  };

  return (
    <section className="w-full relative rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-4 sm:p-6 shadow-2xl transition-all duration-300 hover:border-white/20 overflow-hidden group">
      {/* Dynamic ambient backdrop glow */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: theme.accentHex }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: theme.secondaryHex }}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 sm:pb-4 mb-3.5 sm:mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-105 shrink-0"
            style={{
              backgroundColor: `${theme.accentHex}15`,
              borderColor: `${theme.accentHex}40`
            }}
          >
            <Gamepad2 size={18} style={{ color: theme.accentHex }} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-lg font-extrabold text-white truncate">منطقة اللاعب (Gamer Showcase)</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono-custom font-bold bg-white/10 border border-white/15 text-zinc-300 shrink-0">
                PRO 🎮
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 truncate">
              آيديات وحسابات السلطان في الألعاب • انسخ والعب معي! ⚔️
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-bold self-start sm:self-auto shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{config.statusText || 'جاهز للعب وسحق الخصوم 🟢'}</span>
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
        {enabledAccounts.map((acc) => {
          const badge = getGameBadge(acc.game);
          const fullCopyText = acc.tagOrCode
            ? `${acc.ign}${acc.tagOrCode.startsWith('#') ? acc.tagOrCode : ` (${acc.tagOrCode})`}`
            : acc.ign;
          const isCopied = copiedId === acc.id;

          return (
            <div
              key={acc.id}
              className={`p-4 rounded-2xl border transition-all duration-300 relative group/card flex flex-col justify-between gap-3 ${
                isCopied
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
              }`}
            >
              {/* Card Top: Game badge + Rank */}
              <div className="flex items-center justify-between gap-2">
                <div className={`px-2.5 py-1 rounded-xl border bg-gradient-to-r text-[10px] font-bold font-mono-custom flex items-center gap-1.5 ${badge.color}`}>
                  <span>{badge.icon}</span>
                  <span>{badge.badgeText}</span>
                </div>

                {acc.rank && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold">
                    <Trophy size={11} className="text-amber-400" />
                    <span>{acc.rank}</span>
                  </div>
                )}
              </div>

              {/* Card Middle: IGN and details */}
              <div className="text-right">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-white font-mono-custom tracking-wide">
                    {acc.ign}
                  </span>
                  {acc.tagOrCode && (
                    <span className="text-xs font-mono-custom font-bold text-zinc-400">
                      {acc.tagOrCode}
                    </span>
                  )}
                </div>
                {acc.extraInfo && (
                  <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                    <Sparkles size={11} style={{ color: theme.accentHex }} />
                    <span>{acc.extraInfo}</span>
                  </p>
                )}
              </div>

              {/* Card Bottom: Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleCopy(fullCopyText, acc.id)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 ${
                    isCopied
                      ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-zinc-200 hover:text-white'
                  }`}
                  title="نسخ الآيدي والاسم"
                >
                  {isCopied ? (
                    <>
                      <Check size={13} className="text-black" />
                      <span>تم نسخ الآيدي! 🎮</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-zinc-400 group-hover/card:text-white" />
                      <span>نسخ الآيدي</span>
                    </>
                  )}
                </button>

                {acc.profileUrl && (
                  <a
                    href={acc.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => audioEngine.playClickSound()}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors"
                    title="فتح الرابط المباشر"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
