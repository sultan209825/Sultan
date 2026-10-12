import React, { useState, useEffect, useMemo } from 'react';
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
  Globe,
  Film,
  BookOpen,
  Moon,
  MicOff,
  VolumeX,
  Tv,
  Coffee,
  Wifi,
  Volume2
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
  const [serverVoiceChannel, setServerVoiceChannel] = useState<string>('🎤﹒General');
  const [liveVoiceData, setLiveVoiceData] = useState<{
    inVoice: boolean;
    channelName: string;
    isMuted: boolean;
    selfMute?: boolean;
    serverMute?: boolean;
    isDeafened: boolean;
    selfDeaf?: boolean;
    serverDeaf?: boolean;
    isStreaming: boolean;
    isBotConnected: boolean;
    connectedAt?: string | null;
    companions?: Array<{ username: string; avatar_url?: string; isMuted?: boolean; isDeafened?: boolean }>;
    availableChannels?: Array<{ id: string; name: string }>;
  }>({
    inVoice: false,
    channelName: '🎤﹒General',
    isMuted: false,
    selfMute: false,
    serverMute: false,
    isDeafened: false,
    selfDeaf: false,
    serverDeaf: false,
    isStreaming: false,
    isBotConnected: false,
    connectedAt: null,
    companions: [],
    availableChannels: [
      { id: '1306240131551858704', name: '🎤﹒General' },
      { id: '1540800657588752395', name: '🎬﹒Watching Movies' },
      { id: '1540457611701387314', name: '🎮﹒Gaming' },
      { id: '1540457327298347170', name: '📖﹒Study' },
      { id: '1545422837618184302', name: '💤﹒AFK' }
    ]
  });

  // Swipe to dismiss state
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);

  // Prevent background page horizontal/vertical shift while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'pan-y';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  // Poll Bot Service & Server Invite for real Discord voice state
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const checkBotVoice = async () => {
      try {
        // Fetch actual server voice channel from Discord invite
        try {
          const invRes = await fetch('https://discord.com/api/v10/invites/TUU6EeC6pb?with_counts=true');
          if (invRes.ok) {
            const invData = await invRes.json();
            if (invData.channel?.name && isMounted) {
              setServerVoiceChannel(invData.channel.name);
            }
          }
        } catch {}

        try {
          const res = await fetch(`/api/discord/bot-service?_t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data?.sultanVoiceChannel) {
              const svc = data.sultanVoiceChannel;
              const hasStream = Boolean(
                svc.isStreaming ||
                lanyard?.activities?.some((a) => a.type === 1) ||
                lanyard?.activities?.some((a) => a.name?.toLowerCase().includes('stream') || a.details?.toLowerCase().includes('stream'))
              );

              if (svc.inVoice || svc.channelId) {
                setLiveVoiceData({
                  inVoice: true,
                  channelName: svc.channelName || serverVoiceChannel || '🎤﹒General',
                  isMuted: Boolean(svc.isMuted),
                  selfMute: Boolean(svc.selfMute),
                  serverMute: Boolean(svc.serverMute),
                  isDeafened: Boolean(svc.isDeafened),
                  selfDeaf: Boolean(svc.selfDeaf),
                  serverDeaf: Boolean(svc.serverDeaf),
                  isStreaming: hasStream,
                  isBotConnected: true,
                  connectedAt: svc.connectedAt,
                  companions: svc.companions || [],
                  availableChannels: svc.availableChannels || []
                });
              } else {
                setLiveVoiceData((prev) => ({
                  ...prev,
                  inVoice: false,
                  channelName: svc.channelName || serverVoiceChannel || '🎤﹒General',
                  isMuted: false,
                  selfMute: false,
                  serverMute: false,
                  isDeafened: false,
                  selfDeaf: false,
                  serverDeaf: false,
                  isStreaming: hasStream,
                  isBotConnected: true,
                  connectedAt: null,
                  companions: [],
                  availableChannels: svc.availableChannels || prev.availableChannels
                }));
              }
            }
          }
        } catch {}
      } catch {}
    };

    checkBotVoice();
    const interval = setInterval(checkBotVoice, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, serverVoiceChannel]);

  const handleTouchStart = (e: React.TouchEvent) => {
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
    if (dragOffset > 85) {
      handleClose();
    }
    setDragOffset(0);
    setTouchStartY(null);
  };

  const handleTouchCancel = () => {
    setDragOffset(0);
    setTouchStartY(null);
  };

  const status = lanyard?.discord_status || 'dnd';
  const gameActivity = lanyard?.activities?.find((a) => a.type === 0);
  const activeActivity = lanyard?.activities?.find((a) => a.type !== 2) || lanyard?.activities?.[0];
  const spotify = lanyard?.listening_to_spotify ? lanyard.spotify : null;

  // Track elapsed play time from activity timestamp
  const [elapsedTimerString, setElapsedTimerString] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const targetAct = gameActivity || activeActivity;
      const startTime = targetAct?.timestamps?.start;
      if (!startTime) {
        setElapsedTimerString('');
        return;
      }
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      if (hours > 0) {
        setElapsedTimerString(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      } else {
        setElapsedTimerString(
          `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameActivity?.timestamps?.start, activeActivity?.timestamps?.start]);

  const getActivityImageUrl = (act: any) => {
    if (!act?.assets?.large_image && !act?.assets?.small_image) return null;
    const img = act.assets?.large_image || act.assets?.small_image;
    if (typeof img === 'string') {
      if (img.startsWith('mp:external/')) {
        return `https://media.discordapp.net/external/${img.replace('mp:external/', '')}`;
      }
      if (act.application_id) {
        return `https://cdn.discordapp.com/app-assets/${act.application_id}/${img}.png`;
      }
    }
    return null;
  };

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-x-hidden overflow-y-auto select-none"
      onClick={handleClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-3xl bg-[#090b14] border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col p-5 sm:p-6 text-white space-y-5 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden animate-modal-slide-up transition-transform overscroll-contain"
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
          touchAction: 'pan-y'
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Mobile Swipe to Dismiss Top Grab Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 hover:bg-white/40 mx-auto -mt-1 -mb-1 cursor-grab shrink-0 transition-colors" />

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
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
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

          {(gameActivity || activeActivity) ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300 shadow-md overflow-hidden relative">
                {getActivityImageUrl(gameActivity || activeActivity) ? (
                  <img
                    src={getActivityImageUrl(gameActivity || activeActivity)!}
                    alt={(gameActivity || activeActivity)?.name || 'Game'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Gamepad2 size={24} />
                )}
                {(gameActivity || activeActivity)?.timestamps?.start && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black animate-pulse" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-extrabold text-sm text-white truncate">{(gameActivity || activeActivity)?.name}</p>
                  {elapsedTimerString && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                      ⏱️ {elapsedTimerString}
                    </span>
                  )}
                </div>
                {(gameActivity || activeActivity)?.details && (
                  <p className="text-xs text-purple-300 truncate mt-0.5 font-medium">{(gameActivity || activeActivity)?.details}</p>
                )}
                {(gameActivity || activeActivity)?.state && (
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{(gameActivity || activeActivity)?.state}</p>
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

        {/* Section 2.5: Discord Voice Lounge Radar Sync (مركز تفاصيل الروم الصوتي المباشر والمايك والديفن والستريم) */}
        {(() => {
          // Dynamic room meta helper
          const getModalRoomMeta = (name: string) => {
            const lower = (name || '').toLowerCase();
            if (lower.includes('movie') || lower.includes('watching') || lower.includes('سينما') || lower.includes('أفلام') || lower.includes('🎬')) {
              return {
                type: 'movies',
                Icon: Film,
                cleanName: 'Watching Movies',
                arabicName: 'مشاهدة الأفلام والسينما 🎬',
                accentColor: 'text-purple-400',
                activeBadge: 'bg-purple-500/25 text-purple-200 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
                activeBg: 'bg-gradient-to-r from-purple-950/70 via-fuchsia-950/40 to-black/80',
                borderClass: 'border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
              };
            }
            if (lower.includes('general') || lower.includes('عام') || lower.includes('سيرفر') || lower.includes('🎤')) {
              return {
                type: 'general',
                Icon: Users,
                cleanName: 'General',
                arabicName: 'الروم الصوتي العام 👥',
                accentColor: 'text-indigo-400',
                activeBadge: 'bg-indigo-500/25 text-indigo-200 border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]',
                activeBg: 'bg-gradient-to-r from-indigo-950/70 via-blue-950/40 to-black/80',
                borderClass: 'border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.25)]'
              };
            }
            if (lower.includes('gaming') || lower.includes('لعب') || lower.includes('ألعاب') || lower.includes('🎮')) {
              return {
                type: 'gaming',
                Icon: Gamepad2,
                cleanName: 'Gaming',
                arabicName: 'روم الألعاب والبطولات 🎮',
                accentColor: 'text-emerald-400',
                activeBadge: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
                activeBg: 'bg-gradient-to-r from-emerald-950/70 via-teal-950/40 to-black/80',
                borderClass: 'border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
              };
            }
            if (lower.includes('study') || lower.includes('chill') || lower.includes('مذاكرة') || lower.includes('روقان') || lower.includes('📖') || lower.includes('🎧')) {
              return {
                type: 'study',
                Icon: BookOpen,
                cleanName: 'Study / Chill',
                arabicName: 'مذاكرة وروقان 📖',
                accentColor: 'text-cyan-400',
                activeBadge: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
                activeBg: 'bg-gradient-to-r from-cyan-950/70 via-blue-950/40 to-black/80',
                borderClass: 'border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
              };
            }
            if (lower.includes('afk') || lower.includes('خامل') || lower.includes('away') || lower.includes('💤')) {
              return {
                type: 'afk',
                Icon: Moon,
                cleanName: 'AFK',
                arabicName: 'وضع الخمول والراحة 💤',
                accentColor: 'text-amber-400',
                activeBadge: 'bg-amber-500/25 text-amber-200 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
                activeBg: 'bg-gradient-to-r from-amber-950/70 via-orange-950/40 to-black/80',
                borderClass: 'border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
              };
            }
            return {
              type: 'other',
              Icon: Mic,
              cleanName: name.replace(/^[^\w\u0600-\u06FF]+/, '').trim() || 'غرفة صوتية',
              arabicName: 'غرفة صوتية بالسيرفر 🎙️',
              accentColor: 'text-zinc-400',
              activeBadge: 'bg-white/10 text-white border-white/30',
              activeBg: 'bg-white/[0.04]',
              borderClass: 'border-white/10'
            };
          };

          const currentMeta = getModalRoomMeta(liveVoiceData.inVoice ? liveVoiceData.channelName : (serverVoiceChannel || '🎤﹒General'));
          const CurrentRoomIcon = currentMeta.Icon;

          // Merge canonical rooms (General, Watching Movies, Gaming, Study, AFK) with any live API channels
          const canonical = [
            { id: '1306240131551858704', name: '🎤﹒General' },
            { id: '1540800657588752395', name: '🎬﹒Watching Movies' },
            { id: '1540457611701387314', name: '🎮﹒Gaming' },
            { id: '1540457327298347170', name: '📖﹒Study' },
            { id: '1545422837618184302', name: '💤﹒AFK' }
          ];
          const dynamicChannels = liveVoiceData.availableChannels || [];
          const allServerRooms = [...canonical];
          for (const ch of dynamicChannels) {
            if (!ch || !ch.name || ch.name.includes('Creator')) continue;
            const clean = ch.name.replace(/^[^\w\u0600-\u06FF]+/, '').trim().toLowerCase();
            const exists = allServerRooms.some((m) => {
              const cleanM = m.name.replace(/^[^\w\u0600-\u06FF]+/, '').trim().toLowerCase();
              return m.id === ch.id || cleanM === clean;
            });
            if (!exists) {
              allServerRooms.push({ id: ch.id, name: ch.name });
            }
          }

          return (
            <div className={`relative z-10 p-4 sm:p-5 rounded-2xl border space-y-4 shadow-xl transition-all duration-300 ${
              liveVoiceData.inVoice
                ? `${currentMeta.activeBg} ${currentMeta.borderClass}`
                : 'bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-black/70 border-violet-500/30'
            }`}>
              {/* Header: Title and Live Voice Status Pill */}
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300 border-b border-white/10 pb-2.5">
                <span className="flex items-center gap-2 text-white">
                  <Mic size={16} className={currentMeta.accentColor} />
                  <span>رادار الغرف الصوتية للديسكورد (Voice Lounge Radar)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border flex items-center gap-1.5 ${
                    liveVoiceData.inVoice
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${liveVoiceData.inVoice ? 'bg-emerald-400 animate-ping' : 'bg-violet-400'}`} />
                    <span>{liveVoiceData.inVoice ? '🟢 متواجد في الروم الصوتي' : '🎙️ رادار الغرف'}</span>
                  </span>
                </div>
              </div>

              {/* Main Room Spotlight Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border relative ${
                    liveVoiceData.inVoice
                      ? `${currentMeta.activeBadge} shadow-lg shadow-black/50`
                      : 'bg-violet-600/20 border-violet-400/30 text-violet-300'
                  }`}>
                    <span className={`w-2.5 h-2.5 rounded-full absolute top-1 right-1 ${
                      liveVoiceData.inVoice ? 'bg-emerald-400 animate-ping' : 'bg-violet-400'
                    }`} />
                    <CurrentRoomIcon size={24} className={`${currentMeta.accentColor} ${liveVoiceData.inVoice ? 'animate-pulse' : ''}`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-zinc-400 font-medium">الروم الحالي:</span>
                      <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                        <CurrentRoomIcon size={16} className={currentMeta.accentColor} />
                        <span>{liveVoiceData.inVoice ? liveVoiceData.channelName : (serverVoiceChannel || '🎤﹒General')}</span>
                      </h4>
                    </div>

                    <p className="text-[11px] text-zinc-300 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className={liveVoiceData.inVoice ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                        {liveVoiceData.inVoice
                          ? 'السلطان متواجد ويتحدث في هذا الروم الآن'
                          : 'الرادار يراقب نشاط الرومات بالسيرفر'}
                      </span>
                      <span>•</span>
                      <span className="text-zinc-400 font-mono text-[10px]">{serverName || 'سيرفر Friends For Ever ✨'}</span>
                    </p>
                  </div>
                </div>

                <a
                  href={config.socials?.discord || 'https://discord.gg/TUU6EeC6pb'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    audioEngine.playClickSound();
                    recordSiteLog('دخول الروم الصوتي 🎙️', 'انضمام لروم الديسكورد الصوتي');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/30 shrink-0 transition-transform active:scale-95 self-start sm:self-center"
                >
                  <span>{liveVoiceData.inVoice ? 'دخول الروم معه 🎙️' : 'دخول السيرفر الصوتي'}</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* 4 Real-time Voice Telemetry Cards (حالة المايك والديفن والستريم والاتصال) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. حالة المايكروفون (Microphone) */}
                <div className={`p-2.5 rounded-xl border text-right transition-all ${
                  liveVoiceData.inVoice
                    ? (liveVoiceData.isMuted
                        ? 'bg-amber-950/30 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]')
                    : 'bg-black/30 border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-zinc-400">حالة المايك</span>
                    {liveVoiceData.isMuted ? (
                      <MicOff size={15} className="text-amber-400" />
                    ) : (
                      <Mic size={15} className="text-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <p className={`text-xs font-black truncate ${
                    liveVoiceData.isMuted ? 'text-amber-300' : 'text-emerald-300'
                  }`}>
                    {liveVoiceData.inVoice
                      ? (liveVoiceData.isMuted ? 'مكتوم 🔇' : 'المايك يعمل 🎙️')
                      : 'غير متصل'}
                  </p>
                  <span className="text-[9px] text-zinc-400 font-mono block mt-0.5 truncate">
                    {liveVoiceData.inVoice
                      ? (liveVoiceData.selfMute ? 'كتم يدوي (Self Mute)' : liveVoiceData.serverMute ? 'مكتوم إدارياً' : 'جاهز للتحدث')
                      : 'في وضع الانتظار'}
                  </span>
                </div>

                {/* 2. حالة السماعة والديفن (Headphones & Deafen) */}
                <div className={`p-2.5 rounded-xl border text-right transition-all ${
                  liveVoiceData.inVoice
                    ? (liveVoiceData.isDeafened
                        ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                        : 'bg-indigo-950/30 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]')
                    : 'bg-black/30 border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-zinc-400">حالة السماعة</span>
                    {liveVoiceData.isDeafened ? (
                      <VolumeX size={15} className="text-rose-400" />
                    ) : (
                      <Headphones size={15} className="text-indigo-400" />
                    )}
                  </div>
                  <p className={`text-xs font-black truncate ${
                    liveVoiceData.isDeafened ? 'text-rose-300' : 'text-indigo-300'
                  }`}>
                    {liveVoiceData.inVoice
                      ? (liveVoiceData.isDeafened ? 'السماعة مكتومة 🔕' : 'السماعة تعمل 🎧')
                      : 'غير متصل'}
                  </p>
                  <span className="text-[9px] text-zinc-400 font-mono block mt-0.5 truncate">
                    {liveVoiceData.inVoice
                      ? (liveVoiceData.selfDeaf ? 'ديفن شخصي (Deafen)' : liveVoiceData.serverDeaf ? 'ديفن إداري' : 'يستمع للمحادثة')
                      : 'في وضع الانتظار'}
                  </span>
                </div>

                {/* 3. بث الشاشة والستريم (Screen Streaming) */}
                <div className={`p-2.5 rounded-xl border text-right transition-all ${
                  liveVoiceData.isStreaming
                    ? 'bg-sky-950/30 border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                    : 'bg-black/30 border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-zinc-400">بث الشاشة</span>
                    <Tv size={15} className={liveVoiceData.isStreaming ? 'text-sky-400 animate-pulse' : 'text-zinc-500'} />
                  </div>
                  <p className={`text-xs font-black truncate ${
                    liveVoiceData.isStreaming ? 'text-sky-300 flex items-center gap-1' : 'text-zinc-400'
                  }`}>
                    {liveVoiceData.isStreaming && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping inline-block" />}
                    <span>{liveVoiceData.isStreaming ? 'بث مباشر 📺' : 'لا يوجد بث 📡'}</span>
                  </p>
                  <span className="text-[9px] text-zinc-400 font-mono block mt-0.5 truncate">
                    {liveVoiceData.isStreaming ? 'مشارك للشاشة بالروم' : 'شاشة معطلة'}
                  </span>
                </div>

                {/* 4. جودة الصوت والاتصال (Voice Quality & Status) */}
                <div className={`p-2.5 rounded-xl border text-right transition-all ${
                  liveVoiceData.inVoice
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-black/30 border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-zinc-400">الاتصال الصوتي</span>
                    <Wifi size={15} className={liveVoiceData.inVoice ? 'text-emerald-400' : 'text-zinc-500'} />
                  </div>
                  <p className={`text-xs font-black truncate ${
                    liveVoiceData.inVoice ? 'text-emerald-300' : 'text-zinc-400'
                  }`}>
                    {liveVoiceData.inVoice ? 'اتصال مستقر 📶' : 'وضع الاستعداد'}
                  </p>
                  <span className="text-[9px] text-zinc-400 font-mono block mt-0.5 truncate">
                    {liveVoiceData.inVoice ? 'جودة صوتية عالية HD' : 'جاهز للمزامنة'}
                  </span>
                </div>
              </div>

              {/* Companions in Voice Room */}
              {liveVoiceData.inVoice && liveVoiceData.companions && liveVoiceData.companions.length > 0 && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                      <Users size={13} className="text-emerald-400" />
                      <span>الأعضاء المتواجدون معه في الروم ({liveVoiceData.companions.length}):</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {liveVoiceData.companions.map((comp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white"
                      >
                        {comp.avatar_url ? (
                          <img src={comp.avatar_url} alt={comp.username} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold">
                            {comp.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-emerald-300">{comp.username}</span>
                        <div className="flex items-center gap-1 text-[10px]">
                          {comp.isMuted ? (
                            <span title="مكتوم"><MicOff size={11} className="text-amber-400" /></span>
                          ) : (
                            <span title="المايك يعمل"><Mic size={11} className="text-emerald-400" /></span>
                          )}
                          {comp.isDeafened && (
                            <span title="السماعة مكتومة"><VolumeX size={11} className="text-rose-400" /></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Server Rooms List (عرض رومات General و Watching Movies و Gaming و Study و AFK مع أيقونات مميزة) */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <Volume2 size={13} className="text-indigo-400" />
                    <span>الغرف الصوتية المتاحة بالسيرفر:</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {allServerRooms.length} قنوات
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {allServerRooms.map((ch) => {
                    const meta = getModalRoomMeta(ch.name);
                    const RoomIcon = meta.Icon;
                    const cleanCh = ch.name.replace(/^[^\w\u0600-\u06FF]+/, '').trim().toLowerCase();
                    const cleanCur = (liveVoiceData.channelName || '').replace(/^[^\w\u0600-\u06FF]+/, '').trim().toLowerCase();
                    const isCurrent = liveVoiceData.inVoice && (cleanCur.includes(cleanCh) || cleanCh.includes(cleanCur));

                    return (
                      <div
                        key={ch.id}
                        className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl border text-[11px] transition-all select-none ${
                          isCurrent
                            ? `${meta.activeBadge} font-extrabold scale-[1.02]`
                            : 'bg-black/30 border-white/5 text-zinc-300 hover:text-white hover:border-white/20'
                        }`}
                        title={meta.arabicName}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <RoomIcon size={14} className={isCurrent ? meta.accentColor : 'text-zinc-400'} />
                          <span className="truncate">{meta.cleanName}</span>
                        </div>

                        {isCurrent ? (
                          <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[9px] font-bold border border-emerald-400/40 shadow-sm animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>هنا الآن</span>
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-500 font-mono">صوتي</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

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
