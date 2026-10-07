import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Share2,
  MessageSquare,
  Users,
  Gamepad2,
  Headphones,
  ExternalLink,
  Shield,
  Crown,
  Sparkles,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Zap,
  User,
  Trophy,
  Radio
} from 'lucide-react';
import { LanyardData, SiteConfig, DailyStory } from '../types';
import { fetchLanyardUser, subscribeToLanyard, DISCORD_USER_ID } from '../utils/lanyard';
import { audioEngine } from '../utils/audioEngine';
import { getTheme } from '../utils/themeSystem';
import { DailyStoryModal } from './DailyStoryModal';
import { DiscordActivityRadarModal } from './DiscordActivityRadarModal';
import { CountdownWidget } from './CountdownWidget';
import { defaultDailyStory } from '../data/defaultDailyStory';

interface DiscordProfileCardProps {
  config: SiteConfig;
  typedBio: string;
  countdownString: string;
  isMusicPlaying: boolean;
  musicTempo: number;
  tilt: { x: number; y: number };
  onAvatarClick: () => void;
  onShare: () => void;
  copiedLink: boolean;
  hasRated: 'up' | 'down' | null;
  onRate: (choice: 'up' | 'down') => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
  isEcoMode?: boolean;
}

export const DiscordProfileCard: React.FC<DiscordProfileCardProps> = ({
  config,
  typedBio,
  countdownString,
  isMusicPlaying,
  musicTempo,
  tilt,
  onAvatarClick,
  onShare,
  copiedLink,
  hasRated,
  onRate,
  onMouseMove,
  onMouseLeave,
  cardRef,
  isEcoMode = false
}) => {
  const [lanyard, setLanyard] = useState<LanyardData | null>(null);
  const [copiedTag, setCopiedTag] = useState<boolean>(false);
  const [onlineMembers, setOnlineMembers] = useState<number>(11);
  const [totalMembers, setTotalMembers] = useState<number>(32);
  const [serverName, setServerName] = useState<string>('✨ Friends For Ever ✨');
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState<boolean>(false);
  const dailyStory = config.dailyStory || defaultDailyStory;

  useEffect(() => {
    // 1. Initial fetch from Lanyard
    const loadUser = async () => {
      const data = await fetchLanyardUser(DISCORD_USER_ID);
      if (data) setLanyard(data);
    };
    loadUser();

    // 2. Realtime WebSocket subscription for instant live updates
    const unsubscribe = subscribeToLanyard(DISCORD_USER_ID, (data) => {
      setLanyard(data);
    });

    // 3. Periodic poll fallback
    const liveSyncInterval = setInterval(loadUser, 15000);

    // 4. Fetch exact Discord guild stats
    const fetchExactGuildStats = async () => {
      try {
        const res = await fetch('https://discord.com/api/v10/invites/TUU6EeC6pb?with_counts=true');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.approximate_presence_count === 'number') {
            setOnlineMembers(data.approximate_presence_count);
          }
          if (typeof data.approximate_member_count === 'number') {
            setTotalMembers(data.approximate_member_count);
          }
          if (data.guild?.name) {
            setServerName(data.guild.name);
          }
        }
      } catch (err) {
        console.warn('Discord stats check error', err);
      }
    };

    fetchExactGuildStats();
    const guildInterval = setInterval(fetchExactGuildStats, 60000);

    return () => {
      unsubscribe();
      clearInterval(liveSyncInterval);
      clearInterval(guildInterval);
    };
  }, []);

  const handleCopyTag = async () => {
    audioEngine.playClickSound();
    const username = lanyard?.discord_user?.username || config.handle || '5susu';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(username);
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      const input = document.createElement('input');
      input.value = username;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopiedTag(true);
    audioEngine.playRoyalFanfare();
    setTimeout(() => setCopiedTag(false), 2000);
  };

  const status = lanyard?.discord_status || 'dnd';

  // Dynamic status glow styling depending on Discord status
  const statusConfig = {
    online: {
      color: 'bg-emerald-500',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      glow: 'shadow-[0_0_12px_#10b981]',
      borderGlow: 'hover:border-emerald-500/40',
      label: 'متصل الآن',
      indicator: (
        <span className="w-5 h-5 rounded-full bg-emerald-500 border-3 border-[#0c0c16] shadow-[0_0_10px_#10b981] flex items-center justify-center" />
      )
    },
    idle: {
      color: 'bg-amber-400',
      text: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      glow: 'shadow-[0_0_12px_#f59e0b]',
      borderGlow: 'hover:border-amber-500/40',
      label: 'خامل (Idle)',
      indicator: (
        <span className="w-5 h-5 rounded-full bg-amber-400 border-3 border-[#0c0c16] shadow-[0_0_10px_#f59e0b] relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0c0c16] absolute -top-0.5 -left-0.5" />
        </span>
      )
    },
    dnd: {
      color: 'bg-rose-500',
      text: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/30',
      glow: 'shadow-[0_0_12px_#f43f5e]',
      borderGlow: 'hover:border-rose-500/40',
      label: 'مشغول (DND)',
      indicator: (
        <span className="w-5 h-5 rounded-full bg-rose-500 border-3 border-[#0c0c16] shadow-[0_0_12px_#f43f5e] flex items-center justify-center">
          <span className="w-2 h-0.5 bg-white rounded-full" />
        </span>
      )
    },
    offline: {
      color: 'bg-zinc-500',
      text: 'text-zinc-400',
      badgeBg: 'bg-zinc-500/10 border-zinc-500/30',
      glow: 'shadow-[0_0_8px_#71717a]',
      borderGlow: 'hover:border-zinc-500/40',
      label: 'غير متصل',
      indicator: (
        <span className="w-5 h-5 rounded-full bg-zinc-600 border-3 border-[#0c0c16] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0c0c16]" />
        </span>
      )
    }
  }[status];

  // Activities check
  const gameActivity = lanyard?.activities?.find((a) => a.type === 0);
  const spotify = lanyard?.listening_to_spotify ? lanyard.spotify : null;

  // Real Discord avatar
  const avatarUrl = useMemo(() => {
    if (lanyard?.discord_user?.avatar && lanyard?.discord_user?.id) {
      const ext = lanyard.discord_user.avatar.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/avatars/${lanyard.discord_user.id}/${lanyard.discord_user.avatar}.${ext}?size=256`;
    }
    return 'https://cdn.discordapp.com/avatars/1224502828371017788/ade8f00bc6ce5c846cc73f3ab4d88174.png?size=256';
  }, [lanyard?.discord_user?.avatar, lanyard?.discord_user?.id]);

  // Real Discord Avatar Decoration
  const avatarDecorationUrl = useMemo(() => {
    const asset = lanyard?.discord_user?.avatar_decoration_data?.asset;
    if (asset) {
      return `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png`;
    }
    return 'https://cdn.discordapp.com/avatar-decoration-presets/a_363732b221f45aa7e81b3be945c6e072.png';
  }, [lanyard?.discord_user?.avatar_decoration_data?.asset]);

  // Real Discord Nameplate
  const nameplate = lanyard?.discord_user?.collectibles?.nameplate || {
    asset: 'nameplates/ghost_moth/1541458062701895761/',
    label: 'A pale moth glows softly in misty light',
    palette: 'black',
    sku_id: '1541458062701895761'
  };

  const activeTheme = getTheme(config.theme);
  const displayName = lanyard?.discord_user?.global_name || config.username || '! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪';
  const username = lanyard?.discord_user?.username || config.handle || '5susu';
  const [isCardHovered, setIsCardHovered] = useState<boolean>(false);

  return (
    <div className="relative w-full max-w-xl mx-auto py-2">
      {/* Dynamic Ambient Ground Shadow that expands and breathes with the card's float */}
      <div
        className={`absolute -bottom-2 inset-x-8 h-8 rounded-full pointer-events-none transition-all duration-700 ${
          isCardHovered
            ? 'blur-2xl scale-105 opacity-85'
            : 'blur-xl animate-sultan-floor-shadow opacity-50'
        }`}
        style={{
          background: `radial-gradient(circle, ${activeTheme.accentHex} 0%, ${activeTheme.secondaryHex} 60%, transparent 100%)`
        }}
      />

      {/* Floating Levitation Outer Container */}
      <div
        className={`w-full transition-transform duration-700 ease-out will-change-transform ${
          isCardHovered ? 'animate-sultan-hover-float' : 'animate-sultan-float'
        }`}
      >
        <div
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseEnter={() => setIsCardHovered(true)}
          onMouseLeave={() => {
            setIsCardHovered(false);
            onMouseLeave();
          }}
          className={`w-full relative rounded-3xl bg-[#0b0b14]/90 border border-white/10 ${statusConfig.borderGlow} backdrop-blur-2xl shadow-2xl shadow-black/80 transition-all duration-300 overflow-hidden text-right`}
          dir="rtl"
        >
      {/* Dynamic Profile Effect: Floating particles */}
      <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
        <div className="absolute top-8 left-1/4 w-1.5 h-1.5 rounded-full bg-cyan-300/60 blur-[0.5px] animate-ping duration-1000" />
        <div className="absolute top-20 right-1/3 w-2 h-2 rounded-full bg-purple-300/50 blur-[0.5px] animate-pulse duration-700" />
        <div className="absolute top-12 right-12 w-1.5 h-1.5 rounded-full bg-pink-300/60 blur-[0.5px] animate-bounce duration-1000" />
        <div className="absolute top-28 left-16 w-1 h-1 rounded-full bg-indigo-300/70 animate-ping duration-1000" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
      </div>

      {/* Top Laser Border Glow */}
      <div
        className="absolute -top-[1px] left-8 right-8 h-[2px] opacity-85 z-20 transition-all duration-700"
        style={{
          background: `linear-gradient(to right, transparent, ${activeTheme.accentHex}, transparent)`
        }}
      />

      {/* 1. Discord Profile Custom Banner */}
      <div className="relative h-28 sm:h-32 w-full bg-gradient-to-r from-[#17132e] via-[#321844] to-[#0f0c1f] overflow-hidden border-b border-white/5">
        {/* Subtle Cyber Grid in Banner */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Discord Nitro Banner Aura Glows */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-red-600/35 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-indigo-600/35 blur-2xl pointer-events-none" />

        {/* Status Pill Badge (Top Left) */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] font-mono-custom">
          <span className={`w-2 h-2 rounded-full ${statusConfig.color} animate-pulse ${statusConfig.glow}`} />
          <span className={`font-bold ${statusConfig.text}`}>{statusConfig.label}</span>
        </div>

        {/* Share Button (Top Right) with tactile CSS scale */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => {
              audioEngine.playClickSound();
              onShare();
            }}
            className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-white/15 border border-white/10 backdrop-blur-md text-[11px] text-zinc-300 hover:text-white transition-all duration-150 active:scale-90 flex items-center gap-1 cursor-pointer"
            title="مشاركة رابط الصفحة"
          >
            {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
            <span>{copiedLink ? 'تم النسخ!' : 'مشاركة'}</span>
          </button>
        </div>
      </div>

      {/* Main Body below Banner */}
      <div className="px-4 sm:px-7 pb-6 space-y-4 sm:space-y-5">
        {/* 2. Avatar Overlap Zone with Live Decoration / Frame & Story Ring */}
        <div className="flex flex-wrap items-end justify-between -mt-12 sm:-mt-16 relative z-10 mb-2 gap-2">
          {/* Steady Calm Avatar with Status Indicator and Live Story Ring */}
          <div
            className="relative cursor-pointer group/avatar shrink-0"
            onClick={() => {
              if (dailyStory.enabled !== false) {
                audioEngine.playPowerUpSound();
                setIsStoryModalOpen(true);
              } else {
                onAvatarClick();
              }
            }}
            data-tooltip="انقر لفتح ستوري السلطان اليوم 👑"
          >
            {/* Story Live Indicator Pill on Avatar Top */}
            {dailyStory.enabled !== false && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  audioEngine.playPowerUpSound();
                  setIsStoryModalOpen(true);
                }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 hover:scale-105 text-white font-extrabold text-[9px] tracking-wider shadow-lg shadow-red-600/60 border border-white/20 flex items-center gap-1 active:scale-95 transition-all animate-pulse"
                title="فتح ستوري السلطان اليوم"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>ستوري 🔴</span>
              </button>
            )}

            {/* Steady Discord Avatar Container with Story Gradient Ring */}
            <div
              className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#0c0c16] p-1 border-4 border-[#0b0b14] shadow-2xl overflow-hidden transition-all duration-300 ${
                dailyStory.enabled !== false
                  ? 'ring-2 ring-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'ring-1 ring-white/10'
              }`}
            >
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover rounded-full select-none"
              />

              {/* Discord Live Avatar Decoration / Frame */}
              {avatarDecorationUrl && (
                <img
                  src={avatarDecorationUrl}
                  alt="Discord Avatar Decoration"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-115 select-none"
                />
              )}
            </div>

            {/* Real Discord Status Indicator Badge */}
            <div className="absolute bottom-1 right-1 z-20">
              {statusConfig.indicator}
            </div>
          </div>

          {/* Quick Action Buttons on Header Right: Radar, Copy Tag & Account */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 max-w-full">
            {/* Live Discord Activity Radar Button */}
            <button
              onClick={() => {
                audioEngine.playClickSound();
                setIsRadarModalOpen(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 hover:text-white text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-90 flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 cursor-pointer"
              title="فتح رادار نشاط السلطان بالديسكورد"
            >
              <Radio size={13} className="text-cyan-400 animate-pulse" />
              <span>الرادار 🎙️</span>
            </button>

            <button
              onClick={handleCopyTag}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-mono-custom transition-all duration-150 active:scale-90 flex items-center gap-1.5 border shadow-sm cursor-pointer max-w-[140px] sm:max-w-none ${
                copiedTag
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white'
              }`}
              title="نسخ يوزر الديسكورد"
            >
              {copiedTag ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span className="truncate">{copiedTag ? 'تم النسخ!' : `@${username}`}</span>
            </button>

            <a
              href={`https://discord.com/users/${lanyard?.discord_user?.id || '1224502828371017788'}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => audioEngine.playClickSound()}
              className="px-2.5 sm:px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 hover:scale-105 active:scale-90 flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
              title="فتح حساب وبروفايل ديسكورد الرسمي"
            >
              <User size={13} />
              <span className="hidden xs:inline sm:inline">الأكونت</span>
            </a>
          </div>
        </div>

        {/* 3. Display Name */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-display-custom drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]">
              {displayName}
            </h1>
            <span
              title="موثّق رسمياً"
              className="w-5 h-5 rounded-full bg-gradient-to-r from-red-600 to-amber-500 flex items-center justify-center text-white text-[11px] shadow-md shadow-red-500/30"
            >
              ✓
            </span>
            <Crown size={18} className="text-amber-400" />
          </div>
        </div>

        {/* 4. Discord Badges Row (عضو منذ 2020) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
          {/* Prominent Discord Badge: عضو منذ 2020 with Calendar Icon */}
          <div
            className="group/badge relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-150 active:scale-95 cursor-default"
            data-tooltip="عضو رسمي وموثق في منصة ديسكورد منذ عام 2020"
          >
            <div className="w-5 h-5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 group-hover/badge:scale-110 group-hover/badge:bg-indigo-500/30 transition-all">
              <Calendar size={13} className="text-indigo-300 group-hover/badge:text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-medium">عضو منذ</span>
              <span className="font-mono text-indigo-300 font-extrabold tracking-wide">{config.joinYear || '2020'}</span>
            </div>
          </div>
        </div>

        {/* Sultan's Daily Story Capsule */}
        {dailyStory.enabled !== false && (
          <div
            onClick={() => {
              audioEngine.playPowerUpSound();
              setIsStoryModalOpen(true);
            }}
            className="group/story relative cursor-pointer overflow-hidden p-3 rounded-2xl bg-gradient-to-r from-red-950/40 via-amber-950/25 to-black/70 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:border-red-400 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all duration-200 active:scale-95"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl sm:text-3xl animate-bounce shrink-0 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                  {dailyStory.moodEmoji || '🦾'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/25 text-red-300 font-bold border border-red-500/40 animate-pulse">
                      ستوري اليوم 🔴
                    </span>
                    <span className="text-xs font-bold text-white group-hover/story:text-red-300 transition-colors">
                      {dailyStory.category || 'يوميات وبطولات السلطان'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 truncate mt-0.5 font-medium">
                    « {dailyStory.text || 'اليوم تركيز عالي في الجيم 🦾 + مذاكرة فيزياء 📖.. ومساءً سهرة رايقة فالورانت وديسكورد مع الشباب! 🔥'} »
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl bg-white/10 group-hover/story:bg-red-600/40 text-xs font-bold text-white transition-colors shadow-sm">
                <span>عرض 💬</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Discord Activity Radar Interactive Capsule */}
        <div
          onClick={() => {
            audioEngine.playClickSound();
            setIsRadarModalOpen(true);
          }}
          className="group/radar cursor-pointer p-3 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-indigo-950/20 to-black/60 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-200 active:scale-95 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 shadow-md">
              <Radio size={17} className="animate-pulse text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white group-hover/radar:text-cyan-300 transition-colors">
                  رادار نشاط السلطان بالديسكورد (Live Radar)
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                {gameActivity
                  ? `يلعب الآن: ${gameActivity.name} 🎮`
                  : spotify
                  ? `يستمع إلى: ${spotify.song} 🎧`
                  : `الحالة: ${statusConfig.label} • متاح للمحادثة واللعب 🟢`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 shrink-0 group-hover/radar:bg-cyan-500/30 transition-colors">
            <span>الرادار 🎙️</span>
          </div>
        </div>

        {/* 5. الوصف (About Me / Bio Section) */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
          <div className="text-[11px] font-bold text-zinc-400 font-mono tracking-wider flex items-center justify-between">
            <span>عني • ABOUT ME</span>
            <span className="text-[10px] text-zinc-500">Discord Bio</span>
          </div>
          <div className="min-h-[26px] text-sm text-zinc-200 font-bold flex items-center gap-1">
            <span>{typedBio}</span>
            <span className="w-1.5 h-4 bg-red-500 animate-pulse inline-block" />
          </div>
        </div>

        {/* 7. المناسبة والعد التنازلي التفاعلي (Milestone Countdown Widget) */}
        {config.countdownDate && (
          <div>
            <CountdownWidget
              targetDate={config.countdownDate}
              label={config.countdownLabel || 'المناسبة والهدف القادم 🎯'}
              accentColor={activeTheme.accentHex}
              compact={false}
            />
          </div>
        )}

        {/* 9. Discord Server Live Box (Friends For Ever) with Tactile CTA */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/30 to-[#0e0d1c] border border-indigo-500/25 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                👑
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                  <span className="truncate">{serverName}</span>
                  <ExternalLink size={12} className="text-indigo-400 shrink-0" />
                </h2>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span className="text-emerald-400 font-bold">{onlineMembers}</span> متصل
                  </span>
                  <span>•</span>
                  <span>
                    <span className="text-zinc-300 font-bold">{totalMembers}</span> عضو
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[10px] sm:text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 shrink-0">
              TUU6EeC6pb
            </span>
          </div>

          <a
            href="https://discord.gg/TUU6EeC6pb"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => audioEngine.playClickSound()}
            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <MessageSquare size={16} />
            <span>انضم لسيرفر السلطان (Friends For Ever) 🚀</span>
          </a>
        </div>

        {/* 10. Rating Section with tactile CSS Scale */}
        <div className="flex items-center justify-center gap-3 text-xs text-zinc-400 pt-3 border-t border-white/5">
          <span>رأيك في بروفايل السلطان؟</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRate('up')}
              className={`p-2 rounded-xl border transition-all duration-150 active:scale-90 flex items-center gap-1 cursor-pointer ${
                hasRated === 'up'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
              }`}
              title="عجبني جداً"
            >
              <ThumbsUp size={14} />
              <span className="font-mono-custom text-[11px]">عجبني</span>
            </button>

            <button
              onClick={() => onRate('down')}
              className={`p-2 rounded-xl border transition-all duration-150 active:scale-90 flex items-center gap-1 cursor-pointer ${
                hasRated === 'down'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
              }`}
              title="محتاج تطوير"
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>

      {/* Modals: Sultan's Daily Story & Live Discord Activity Radar */}
      <DailyStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        story={dailyStory}
        config={config}
        avatarUrl={avatarUrl}
      />
      <DiscordActivityRadarModal
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
        lanyard={lanyard}
        config={config}
        serverOnlineMembers={onlineMembers}
        serverTotalMembers={totalMembers}
        serverName={serverName}
      />
    </div>
  );
};
