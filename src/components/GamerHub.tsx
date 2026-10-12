import React, { useState } from 'react';
import {
  Gamepad2,
  Copy,
  Check,
  ExternalLink,
  Trophy,
  Sparkles,
  Swords,
  Zap,
  Activity,
  Monitor,
  Cpu,
  MousePointer,
  Flame,
  Shield,
  HardDrive
} from 'lucide-react';
import { GamerAccount, GamerHubConfig } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { ThemeDefinition } from '../utils/themeSystem';

interface GamerHubProps {
  config?: GamerHubConfig;
  theme: ThemeDefinition;
}

export const GamerHub: React.FC<GamerHubProps> = ({ config, theme }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'accounts' | 'specs'>('accounts');

  if (!config || !config.enabled) return null;

  const enabledAccounts = config.accounts?.filter((acc) => acc.enabled) || [];

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
          badgeText: 'VALORANT PRO',
          winRate: '68% Winrate'
        };
      case 'steam':
        return {
          icon: '🎮',
          color: 'from-sky-600/30 to-indigo-600/20 border-sky-500/40 text-sky-300',
          badgeText: 'STEAM LEVEL 60+',
          winRate: 'CS2 Veteran'
        };
      case 'pubg':
        return {
          icon: '🦅',
          color: 'from-amber-600/30 to-orange-600/20 border-amber-500/40 text-amber-300',
          badgeText: 'PUBG MOBILE CONQUEROR',
          winRate: 'K/D: 6.8'
        };
      case 'discord':
        return {
          icon: '💬',
          color: 'from-indigo-600/30 to-violet-600/20 border-indigo-500/40 text-indigo-300',
          badgeText: 'DISCORD SQUAD',
          winRate: 'Voice Host'
        };
      case 'epic':
        return {
          icon: '🚀',
          color: 'from-zinc-600/30 to-zinc-800/30 border-zinc-400/40 text-zinc-200',
          badgeText: 'EPIC GAMES',
          winRate: 'Fortnite Elite'
        };
      default:
        return {
          icon: '🎯',
          color: 'from-purple-600/30 to-pink-600/20 border-purple-500/40 text-purple-300',
          badgeText: 'PRO GAMING',
          winRate: 'Top Tier'
        };
    }
  };

  return (
    <section
      className="w-full relative rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 p-4 sm:p-6 shadow-2xl transition-all duration-300 hover:border-white/20 overflow-hidden group text-right"
      dir="rtl"
    >
      {/* Dynamic ambient backdrop glow */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: theme.accentHex }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: theme.secondaryHex }}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 sm:pb-4 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-105 shrink-0"
            style={{
              backgroundColor: `${theme.accentHex}15`,
              borderColor: `${theme.accentHex}40`
            }}
          >
            <Gamepad2 size={20} style={{ color: theme.accentHex }} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white truncate">منصة بطولات الجيمنج (Gamer Hub)</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-custom font-bold bg-white/10 border border-white/15 text-zinc-200 shrink-0">
                ESPORTS 🎮
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5 truncate font-medium">
              آيديات وحسابات السلطان في الألعاب، ومواصفات عتاد الكمبيوتر ⚔️
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => {
              audioEngine.playClickSound();
              setActiveTab('accounts');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'accounts' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            الحسابات
          </button>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              setActiveTab('specs');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'specs' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor size={13} />
            <span>عتاد الكمبيوتر 🦾</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Pro Gamer Accounts */}
      {activeTab === 'accounts' && (
        <div className="relative z-10 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {enabledAccounts.map((account) => {
              const isCopied = copiedId === account.id;
              const badge = getGameBadge(account.game);

              return (
                <div
                  key={account.id}
                  className="relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between gap-3 shadow-lg group/card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-inner shrink-0">
                        {badge.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-white text-xs sm:text-sm truncate">
                            {account.title || (account as unknown as { label?: string }).label}
                          </h4>
                          <span
                            className={`text-[9px] px-2 py-0.2 rounded-full font-bold border bg-gradient-to-r ${badge.color} shrink-0`}
                          >
                            {badge.badgeText}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
                          {badge.winRate}
                        </p>
                      </div>
                    </div>

                    {(account.rank || (account as unknown as { stats?: { rank?: string } }).stats?.rank) && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold font-mono shrink-0">
                        🏆 {account.rank || (account as unknown as { stats?: { rank?: string } }).stats?.rank}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/50 border border-white/5">
                    <div className="font-mono text-xs font-bold text-white tracking-wider truncate px-1 select-all">
                      {account.ign || (account as unknown as { username?: string }).username}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopy(account.ign || (account as unknown as { username?: string }).username || '', account.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white'
                        }`}
                        title="نسخ الآيدي"
                      >
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        <span className="text-[10px] hidden xs:inline">
                          {isCopied ? 'تم النسخ' : 'نسخ'}
                        </span>
                      </button>

                      {account.profileUrl && (
                        <a
                          href={account.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => audioEngine.playClickSound()}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors"
                          title="فتح الملف الشخصي"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Steam Official Card Integration */}
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/30 via-slate-950/40 to-black/60 border border-sky-500/30 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl font-bold shadow-md">
                🎮
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs sm:text-sm text-white">حساب Steam الرسمي للسلطان</h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-sky-500/20 text-sky-300 font-mono font-bold">
                    VERIFIED GAMER
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  إضافة فريند • مبادلات الأسلحة في CS2 • مكتبة الألعاب الكاملة
                </p>
              </div>
            </div>

            <a
              href="https://steamcommunity.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => audioEngine.playClickSound()}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all shrink-0"
            >
              <span>فتح ستيم</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* TAB 2: PC Battlestation Hardware Specs (Exact Specifications) */}
      {activeTab === 'specs' && (
        <div className="relative z-10 space-y-3 animate-in fade-in">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <Monitor size={20} className="text-red-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">مواصفات وسيت أب كمبيوتر السلطان 🦾</h4>
              <p className="text-xs text-zinc-400">العتاد الفعلي لجهاز تشغيل الألعاب وتطوير الموقع</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {/* CPU */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 font-mono text-[10px] flex items-center gap-1">
                <Cpu size={12} className="text-amber-400" />
                المعالج (CPU)
              </span>
              <p className="font-black text-white text-sm">Intel Core i5 (4th Gen)</p>
              <p className="text-[11px] text-zinc-500">معالج انتل الجيل الرابع رباعي النواة</p>
            </div>

            {/* GPU */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 font-mono text-[10px] flex items-center gap-1">
                <Zap size={12} className="text-emerald-400" />
                كرت الشاشة (GPU)
              </span>
              <p className="font-black text-white text-sm">NVIDIA GeForce GTX 1060</p>
              <p className="text-[11px] text-zinc-500">كرت شاشة جيمنج قوي للألعاب التنافسية</p>
            </div>

            {/* RAM */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 font-mono text-[10px] flex items-center gap-1">
                <Activity size={12} className="text-purple-400" />
                الذاكرة العشوائية (RAM)
              </span>
              <p className="font-black text-white text-sm">16 GB RAM</p>
              <p className="text-[11px] text-zinc-500">رامات 16 جيجابايت لتعدد المهام والسلاسة</p>
            </div>

            {/* Storage */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 font-mono text-[10px] flex items-center gap-1">
                <HardDrive size={12} className="text-rose-400" />
                المساحة والتخزين
              </span>
              <p className="font-black text-white text-sm">1 TB (1000 GB) Storage</p>
              <p className="text-[11px] text-zinc-500">مساحة تخزين ضخمة لجميع الألعاب والملفات</p>
            </div>

            {/* Monitor */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-zinc-400 font-mono text-[10px] flex items-center gap-1">
                <Monitor size={12} className="text-cyan-400" />
                الشاشة (Display)
              </span>
              <p className="font-black text-white text-sm">60Hz Gaming Screen</p>
              <p className="text-[11px] text-zinc-500">شاشة عرض بدقة Full HD وتردد 60 هرتز</p>
            </div>

            {/* Status / Overall */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1 flex flex-col justify-center items-center text-center">
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                حالة الجهاز
              </span>
              <p className="text-white font-mono font-bold mt-1">SULTAN Rig • Ready 🎮</p>
              <span className="text-[10px] text-zinc-400">Stable Gaming & Performance</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
