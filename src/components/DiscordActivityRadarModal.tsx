import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Gamepad2,
  Headphones,
  Music,
  ExternalLink,
  Copy,
  Check,
  Users,
  Clock,
  Sparkles,
  Shield,
  MessageSquare,
  Flame,
  Zap,
  Mic,
  Monitor,
  Smartphone,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LanyardData, SiteConfig } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { recordSiteLog } from '../utils/siteLogger';
import { DISCORD_USER_ID } from '../utils/lanyard';

interface DiscordActivityRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  lanyard: LanyardData | null;
  config: SiteConfig;
  serverOnlineMembers: number;
  serverTotalMembers: number;
  serverName: string;
}

export const DiscordActivityRadarModal: React.FC<DiscordActivityRadarModalProps> = ({
  isOpen,
  onClose,
  lanyard,
  config,
  serverOnlineMembers,
  serverTotalMembers,
  serverName
}) => {
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const status = lanyard?.discord_status || 'dnd';
  const gameActivity = lanyard?.activities?.find((a) => a.type === 0);
  const spotify = lanyard?.listening_to_spotify ? lanyard.spotify : null;

  // Track elapsed play time
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyId = async () => {
    audioEngine.playClickSound();
    try {
      await navigator.clipboard.writeText(DISCORD_USER_ID);
      setCopiedId(true);
      confetti({ particleCount: 40, spread: 60 });
      audioEngine.playRoyalFanfare();
      setTimeout(() => setCopiedId(false), 2500);
      recordSiteLog('نسخ آيدي الديسكورد 📋', 'نسخ Snowflake ID من رادار النشاط');
    } catch {}
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'online':
        return {
          text: 'متصل الآن (Online)',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          dot: 'bg-emerald-400'
        };
      case 'idle':
        return {
          text: 'خامل (Idle / AFK)',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          dot: 'bg-amber-400'
        };
      case 'dnd':
        return {
          text: 'مشغول (Do Not Disturb)',
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/30',
          dot: 'bg-rose-400'
        };
      default:
        return {
          text: 'غير متصل (Offline)',
          color: 'text-zinc-400',
          bg: 'bg-zinc-500/10 border-zinc-500/30',
          dot: 'bg-zinc-500'
        };
    }
  };

  const statusBadge = getStatusBadge();

  // Active client device
  const getActiveDevice = () => {
    if (lanyard?.active_on_discord_desktop) {
      return { icon: <Monitor size={14} />, name: 'كمبيوتر (Desktop Client)' };
    }
    if (lanyard?.active_on_discord_mobile) {
      return { icon: <Smartphone size={14} />, name: 'موبايل (Mobile App)' };
    }
    if (lanyard?.active_on_discord_web) {
      return { icon: <Globe size={14} />, name: 'متصفح (Web Client)' };
    }
    return { icon: <Monitor size={14} />, name: 'ديسكورد الرسمي' };
  };

  const activeDevice = getActiveDevice();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#090b14] border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col p-5 sm:p-6 text-white space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Radar Sweep Background */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full border border-cyan-500/20 pointer-events-none opacity-40 animate-ping" />
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full border border-cyan-400/30 pointer-events-none opacity-50" />

        {/* Header Bar */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  رادار نشاط الديسكورد المباشر (Activity Radar)
                </h3>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <p className="text-[11px] text-zinc-400">
                بث حي ومباشر عبر خوادم Lanyard WebSocket
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Live Status Card */}
        <div className="relative z-10 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-indigo-950/20 to-black/60 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-zinc-900 shadow-md">
                <img
                  src={
                    lanyard?.discord_user?.avatar
                      ? `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${lanyard.discord_user.avatar}.png?size=128`
                      : 'https://cdn.discordapp.com/embed/avatars/0.png'
                  }
                  alt={config.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className={`w-3.5 h-3.5 rounded-full absolute -bottom-1 -right-1 border-2 border-[#090b14] ${statusBadge.dot}`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-white">{config.username}</h4>
                <span className="text-zinc-400 font-mono text-xs">@{config.handle}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot} animate-pulse`} />
                  <span>{statusBadge.text}</span>
                </span>
                <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                  {activeDevice.icon}
                  <span>{activeDevice.name}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyId}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
            title="نسخ Snowflake ID"
          >
            {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copiedId ? 'تم النسخ!' : 'آيدي الحساب'}</span>
          </button>
        </div>

        {/* Section 1: Active Game or Custom Activity */}
        <div className="relative z-10 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300 border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5 text-white">
              <Gamepad2 size={15} className="text-purple-400" />
              <span>نشاط الألعاب والبرامج (Current Gaming Activity)</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE DETECT</span>
            </span>
          </div>

          {gameActivity ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300 shadow-md">
                <Gamepad2 size={24} />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-white truncate">{gameActivity.name}</p>
                {gameActivity.details && (
                  <p className="text-xs text-purple-300 truncate mt-0.5">{gameActivity.details}</p>
                )}
                {gameActivity.state && (
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{gameActivity.state}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span>جاهز للعب وسحق الخصوم في VALORANT & PUBG 🎮🔥</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                LFG READY
              </span>
            </div>
          )}
        </div>

        {/* Section 2: Spotify Live Hub */}
        {spotify && (
          <div className="relative z-10 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5 text-white">
                <Music size={15} className="text-emerald-400" />
                <span>يستمع الآن على Spotify (Listening to Spotify)</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="flex items-center gap-3">
              {spotify.album_art_url ? (
                <img
                  src={spotify.album_art_url}
                  alt={spotify.song}
                  className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 shadow-md animate-spin-slow shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Headphones size={22} className="text-emerald-300" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-sm text-white truncate">{spotify.song}</p>
                <p className="text-xs text-emerald-300 truncate mt-0.5">{spotify.artist}</p>
                {spotify.album && (
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">ألبوم: {spotify.album}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Official Sultan Discord Server Hub */}
        <div className="relative z-10 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-lg font-bold shadow-md">
              👑
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-white">{serverName}</h4>
              <p className="text-[11px] text-indigo-300 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>{serverOnlineMembers} متصل</span>
                </span>
                <span>•</span>
                <span>{serverTotalMembers} عضو بالسيرفر</span>
              </p>
            </div>
          </div>

          <a
            href={config.socials?.discord || 'https://discord.gg/TUU6EeC6pb'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              audioEngine.playClickSound();
              recordSiteLog('دخول سيرفر الديسكورد 💬', 'الانتقال إلى سيرفر السلطان من رادار النشاط');
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-90 font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <span>دخول السيرفر 🚀</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Quick Direct Actions Bar */}
        <div className="relative z-10 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href={`https://discord.com/users/${DISCORD_USER_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              audioEngine.playClickSound();
              recordSiteLog('فتح خاص الديسكورد 💬', 'فتح بروفايل السلطان لإرسال رسالة خاصة');
            }}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all hover:border-cyan-500/40"
          >
            <MessageSquare size={15} className="text-cyan-400" />
            <span>إرسال رسالة خاصة (Direct Message) 💬</span>
          </a>

          <button
            type="button"
            onClick={handleCopyId}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all hover:border-cyan-500/40"
          >
            {copiedId ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} className="text-amber-400" />}
            <span>{copiedId ? 'تم نسخ آيدي السلطان! ✅' : 'نسخ آيدي ديسكورد السلطان 📋'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
