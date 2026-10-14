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
  Radio,
  Music,
  Mic,
  Volume2,
  Film,
  BookOpen,
  Moon,
  Coffee,
  Clapperboard,
  Tv
} from 'lucide-react';
import { LanyardData, SiteConfig, DailyStory } from '../types';
import { fetchLanyardUser, subscribeToLanyard, DISCORD_USER_ID } from '../utils/lanyard';
import { audioEngine } from '../utils/audioEngine';
import { getTheme } from '../utils/themeSystem';
import { DailyStoryModal } from './DailyStoryModal';
import { DiscordActivityRadarModal } from './DiscordActivityRadarModal';
import { CountdownWidget } from './CountdownWidget';
import { defaultDailyStory } from '../data/defaultDailyStory';
import { VisitorLoyaltyState } from '../utils/visitorLoyalty';

interface DiscordProfileCardProps {
  config: SiteConfig;
  typedBio: string;
  countdownString: string;
  isMusicPlaying?: boolean;
  musicTempo?: number;
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
  onOpenMusic?: () => void;
  onOpenGaming?: () => void;
  onOpenSecrets?: () => void;
  visitorLoyalty?: VisitorLoyaltyState;
  onOpenLoyaltyModal?: () => void;
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
  isEcoMode = false,
  onOpenMusic,
  onOpenGaming,
  onOpenSecrets,
  visitorLoyalty,
  onOpenLoyaltyModal
}) => {
  const [lanyard, setLanyard] = useState<LanyardData | null>(null);
  const [copiedTag, setCopiedTag] = useState<boolean>(false);
  const [onlineMembers, setOnlineMembers] = useState<number>(11);
  const [totalMembers, setTotalMembers] = useState<number>(32);
  const [serverName, setServerName] = useState<string>('✨ Friends For Ever ✨');
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState<boolean>(false);
  const [pulsingSection, setPulsingSection] = useState<string | null>(null);
  const [serverVoiceChannel, setServerVoiceChannel] = useState<string>('🎤﹒General');
  const [currentVoiceRoom, setCurrentVoiceRoom] = useState<string | null>(null);
  const [voiceCompanions, setVoiceCompanions] = useState<Array<{ username: string; avatar_url?: string }>>([]);
  const [voiceStateDetails, setVoiceStateDetails] = useState<{
    inVoice: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    isStreaming: boolean;
    channelName: string;
    availableChannels?: Array<{ id: string; name: string }>;
  }>({
    inVoice: false,
    isMuted: false,
    isDeafened: false,
    isStreaming: false,
    channelName: '🎤﹒General',
    availableChannels: [
      { id: '1306240131551858704', name: '🎤﹒General' },
      { id: '1540800657588752395', name: '🎬﹒Watching Movies' },
      { id: '1540457611701387314', name: '🎮﹒Gaming' },
      { id: '1540457327298347170', name: '📖﹒Study' },
      { id: '1545422837618184302', name: '💤﹒AFK' }
    ]
  });
  const dailyStory = config.dailyStory || defaultDailyStory;

  const handleSectionClick = (sectionKey: string, action?: () => void) => {
    audioEngine.playPowerUpSound();
    setPulsingSection(sectionKey);
    setTimeout(() => {
      setPulsingSection(null);
    }, 450);
    if (action) {
      setTimeout(() => {
        action();
      }, 120);
    }
  };

  useEffect(() => {
    // 1. Initial fetch from Lanyard & Bot Voice Service (scheduled every 5 seconds as requested)
    const loadUser = async () => {
      try {
        const data = await fetchLanyardUser(DISCORD_USER_ID);
        if (data) setLanyard(data);
      } catch {}

      try {
        const res = await fetch(`/api/discord/bot-service?_t=${Date.now()}`);
        if (res.ok) {
          const botData = await res.json();
          const svc = botData?.sultanVoiceChannel;
          if (svc?.inVoice) {
            const chName = svc.channelName || 'غرفة صوتية';
            setCurrentVoiceRoom(chName);
            setVoiceCompanions(svc.companions || []);
            setVoiceStateDetails({
              inVoice: true,
              channelName: chName,
              isMuted: Boolean(svc.isMuted),
              isDeafened: Boolean(svc.isDeafened),
              isStreaming: Boolean(svc.isStreaming),
              availableChannels: svc.availableChannels || []
            });
          } else {
            setCurrentVoiceRoom(null);
            setVoiceCompanions([]);
            setVoiceStateDetails({
              inVoice: false,
              channelName: svc?.channelName || serverVoiceChannel || '🎤﹒General',
              isMuted: false,
              isDeafened: false,
              isStreaming: false,
              availableChannels: svc?.availableChannels || []
            });
          }
        }
      } catch {}
    };
    loadUser();

    // 2. Realtime WebSocket subscription for instant live updates
    const unsubscribe = subscribeToLanyard(DISCORD_USER_ID, (data) => {
      setLanyard(data);
    });

    // 3. Periodic poll scheduled every 5 seconds (5000ms) for high resilience & instant room detection
    const liveSyncInterval = setInterval(loadUser, 5000);

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
          if (data.channel?.name) {
            setServerVoiceChannel(data.channel.name);
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

  const playHover = () => {
    if (!isEcoMode) {
      audioEngine.playHoverSound(false);
    }
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

  // Active game or rich activity from Lanyard
  const activeActivity = useMemo(() => {
    if (!lanyard?.activities || lanyard.activities.length === 0) return null;
    return (
      lanyard.activities.find((a) => a.type === 0 || a.type === 1 || a.type === 5) ||
      lanyard.activities.find((a) => a.type !== 4) ||
      lanyard.activities[0]
    );
  }, [lanyard?.activities]);

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

  // Dynamic Room State Detection (Gaming / Movies / General / Chill / AFK) based on Lanyard & Voice Room Data
  type RoomState = 'Gaming' | 'Movies' | 'General' | 'Chill' | 'AFK' | 'Default';

  const roomCategory = useMemo<RoomState>(() => {
    const roomLower = (currentVoiceRoom || '').toLowerCase();

    // 1. Direct Voice Room Check
    if (roomLower.includes('gaming') || roomLower.includes('لعب') || roomLower.includes('🎮')) {
      return 'Gaming';
    }
    if (
      roomLower.includes('movie') ||
      roomLower.includes('watching') ||
      roomLower.includes('سينما') ||
      roomLower.includes('أفلام') ||
      roomLower.includes('🎬')
    ) {
      return 'Movies';
    }
    if (roomLower.includes('general') || roomLower.includes('عام') || roomLower.includes('سيرفر') || roomLower.includes('🎤')) {
      return 'General';
    }
    if (roomLower.includes('afk') || roomLower.includes('خامل') || roomLower.includes('away') || roomLower.includes('💤')) {
      return 'AFK';
    }
    if (
      roomLower.includes('study') ||
      roomLower.includes('chill') ||
      roomLower.includes('مذاكرة') ||
      roomLower.includes('روقان') ||
      roomLower.includes('📖') ||
      roomLower.includes('🎧')
    ) {
      return 'Chill';
    }

    // 2. Lanyard API activities & presence detection fallback
    const hasGame = lanyard?.activities?.some((a) => a.type === 0);
    if (hasGame) {
      return 'Gaming';
    }

    const hasStreamOrMovie = lanyard?.activities?.some(
      (a) => a.type === 3 || a.type === 1 || a.name?.toLowerCase().includes('movie') || a.details?.toLowerCase().includes('movie')
    );
    if (hasStreamOrMovie) {
      return 'Movies';
    }

    if (lanyard?.discord_status === 'idle') {
      return 'AFK';
    }

    if (lanyard?.listening_to_spotify || lanyard?.activities?.some((a) => a.type === 2)) {
      return 'Chill';
    }

    return 'Default';
  }, [currentVoiceRoom, lanyard?.activities, lanyard?.discord_status, lanyard?.listening_to_spotify]);

  const currentRoomConfig = useMemo(() => {
    switch (roomCategory) {
      case 'Gaming':
        return {
          cardBg: 'bg-gradient-to-b from-[#061811]/95 via-[#09151e]/95 to-[#080812]/95 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.25)]',
          ambientGlow: 'from-emerald-500/45 via-teal-500/35 to-cyan-500/45',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          label: currentVoiceRoom ? `🎮 ${currentVoiceRoom}` : '🎮 روم الألعاب (Gaming)',
          bannerAura: 'bg-emerald-500/45'
        };
      case 'Movies':
        return {
          cardBg: 'bg-gradient-to-b from-[#1b0a24]/95 via-[#130d22]/95 to-[#080812]/95 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.25)]',
          ambientGlow: 'from-purple-600/45 via-pink-600/35 to-rose-600/45',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
          label: currentVoiceRoom ? `🎬 ${currentVoiceRoom}` : '🎬 روم الأفلام (Watching Movies)',
          bannerAura: 'bg-purple-600/45'
        };
      case 'General':
        return {
          cardBg: 'bg-gradient-to-b from-[#0c122b]/95 via-[#0e1026]/95 to-[#080812]/95 border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.25)]',
          ambientGlow: 'from-indigo-600/45 via-blue-600/35 to-violet-600/45',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]',
          label: currentVoiceRoom ? `🎤 ${currentVoiceRoom}` : '🎤 الروم الصوتي العام (General)',
          bannerAura: 'bg-indigo-600/45'
        };
      case 'Chill':
        return {
          cardBg: 'bg-gradient-to-b from-[#091426]/95 via-[#0d132b]/95 to-[#080812]/95 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)]',
          ambientGlow: 'from-cyan-500/45 via-indigo-500/35 to-sky-500/45',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
          label: currentVoiceRoom ? `📖 ${currentVoiceRoom}` : '🎧 روم الروقان والمذاكرة (Study / Chill)',
          bannerAura: 'bg-cyan-500/45'
        };
      case 'AFK':
        return {
          cardBg: 'bg-gradient-to-b from-[#1a1207]/95 via-[#131118]/95 to-[#080812]/95 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)]',
          ambientGlow: 'from-amber-500/45 via-orange-500/35 to-yellow-500/45',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
          label: currentVoiceRoom ? `💤 ${currentVoiceRoom}` : '💤 وضع الخمول والراحة (AFK)',
          bannerAura: 'bg-amber-500/45'
        };
      default:
        return {
          cardBg: 'bg-[#0b0b14]/95 border-white/10 shadow-2xl shadow-black/80',
          ambientGlow: 'from-red-600/25 via-purple-600/20 to-indigo-600/25',
          badgeBg: '',
          label: '',
          bannerAura: 'bg-red-600/35'
        };
    }
  }, [roomCategory, currentVoiceRoom]);

  // Distinct room metadata and icons helper (Users for General, Film for Movies, Gamepad2 for Gaming, BookOpen for Study, Moon for AFK)
  type RoomType = 'general' | 'movies' | 'gaming' | 'study' | 'afk' | 'other';

  interface ServerRoomMeta {
    id: string;
    name: string;
    cleanName: string;
    type: RoomType;
    IconComponent: React.ComponentType<{ size?: number; className?: string }>;
    accentColor: string;
    badgeBg: string;
    activeBorder: string;
    activeBg: string;
    activeGlow: string;
    description: string;
  }

  const getRoomMeta = (roomName: string, id: string = ''): ServerRoomMeta => {
    const lower = (roomName || '').toLowerCase();

    // 1. Watching Movies (Film / Movie icon 🎬)
    if (
      lower.includes('movie') ||
      lower.includes('watching') ||
      lower.includes('سينما') ||
      lower.includes('أفلام') ||
      lower.includes('🎬')
    ) {
      return {
        id: id || 'watching_movies',
        name: roomName || '🎬﹒Watching Movies',
        cleanName: 'Watching Movies',
        type: 'movies',
        IconComponent: Film,
        accentColor: 'text-purple-400',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        activeBorder: 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]',
        activeBg: 'bg-gradient-to-r from-purple-950/70 via-fuchsia-950/50 to-black/80',
        activeGlow: 'from-purple-600/40 via-pink-600/30 to-rose-600/40',
        description: 'مشاهدة الأفلام والسينما 🎬'
      };
    }

    // 2. General (Users icon 👥)
    if (
      lower.includes('general') ||
      lower.includes('عام') ||
      lower.includes('سيرفر') ||
      lower.includes('🎤')
    ) {
      return {
        id: id || 'general',
        name: roomName || '🎤﹒General',
        cleanName: 'General',
        type: 'general',
        IconComponent: Users,
        accentColor: 'text-indigo-400',
        badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        activeBorder: 'border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]',
        activeBg: 'bg-gradient-to-r from-indigo-950/70 via-blue-950/50 to-black/80',
        activeGlow: 'from-indigo-600/40 via-blue-600/30 to-violet-600/40',
        description: 'الروم الصوتي العام للتجمع 👥'
      };
    }

    // 3. Gaming (Gamepad2 icon 🎮)
    if (
      lower.includes('gaming') ||
      lower.includes('لعب') ||
      lower.includes('ألعاب') ||
      lower.includes('🎮')
    ) {
      return {
        id: id || 'gaming',
        name: roomName || '🎮﹒Gaming',
        cleanName: 'Gaming',
        type: 'gaming',
        IconComponent: Gamepad2,
        accentColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        activeBorder: 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]',
        activeBg: 'bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-black/80',
        activeGlow: 'from-emerald-500/40 via-teal-500/30 to-cyan-500/40',
        description: 'روم الألعاب والبطولات 🎮'
      };
    }

    // 4. Study / Chill (BookOpen icon 📖)
    if (
      lower.includes('study') ||
      lower.includes('chill') ||
      lower.includes('مذاكرة') ||
      lower.includes('روقان') ||
      lower.includes('📖') ||
      lower.includes('🎧')
    ) {
      return {
        id: id || 'study',
        name: roomName || '📖﹒Study',
        cleanName: 'Study / Chill',
        type: 'study',
        IconComponent: BookOpen,
        accentColor: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        activeBorder: 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]',
        activeBg: 'bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-black/80',
        activeGlow: 'from-cyan-500/40 via-indigo-500/30 to-sky-500/40',
        description: 'مذاكرة وروقان وهدوء 📖'
      };
    }

    // 5. AFK (Moon icon 💤)
    if (
      lower.includes('afk') ||
      lower.includes('خامل') ||
      lower.includes('away') ||
      lower.includes('💤')
    ) {
      return {
        id: id || 'afk',
        name: roomName || '💤﹒AFK',
        cleanName: 'AFK',
        type: 'afk',
        IconComponent: Moon,
        accentColor: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        activeBorder: 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
        activeBg: 'bg-gradient-to-r from-amber-950/70 via-orange-950/50 to-black/80',
        activeGlow: 'from-amber-500/40 via-orange-500/30 to-yellow-500/40',
        description: 'وضع الراحة والخمول 💤'
      };
    }

    return {
      id: id || 'other',
      name: roomName || 'غرفة صوتية',
      cleanName: roomName.replace(/^[^\w\u0600-\u06FF]+/, '').trim() || 'غرفة صوتية',
      type: 'other',
      IconComponent: Radio,
      accentColor: 'text-zinc-400',
      badgeBg: 'bg-white/10 text-zinc-300 border-white/10',
      activeBorder: 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      activeBg: 'bg-white/[0.06]',
      activeGlow: 'from-zinc-600/30 via-zinc-500/20 to-zinc-600/30',
      description: 'غرفة صوتية بالسيرفر 🎙️'
    };
  };

  // Dynamic server rooms merging canonical rooms (General, Watching Movies, Gaming, Study, AFK) with live API
  const serverRooms = useMemo<ServerRoomMeta[]>(() => {
    const canonicalRooms = [
      { id: '1306240131551858704', name: '🎤﹒General' },
      { id: '1540800657588752395', name: '🎬﹒Watching Movies' },
      { id: '1540457611701387314', name: '🎮﹒Gaming' },
      { id: '1540457327298347170', name: '📖﹒Study' },
      { id: '1545422837618184302', name: '💤﹒AFK' }
    ];

    const liveChannels = (voiceStateDetails.availableChannels && voiceStateDetails.availableChannels.length > 0)
      ? voiceStateDetails.availableChannels
      : [];

    const merged = [...canonicalRooms];
    for (const ch of liveChannels) {
      if (!ch || !ch.name) continue;
      if (ch.name.includes('Creator')) continue;
      const cleanApi = ch.name.replace(/^[^\w\u0600-\u06FF]+/, '').trim().toLowerCase();
      const exists = merged.some((m) => {
        const cleanM = m.name.replace(/^[^\w\u0600-\u06FF]+/, '').trim().toLowerCase();
        return m.id === ch.id || cleanM === cleanApi;
      });
      if (!exists) {
        merged.push({ id: ch.id, name: ch.name });
      }
    }

    return merged.map((ch) => getRoomMeta(ch.name, ch.id));
  }, [voiceStateDetails.availableChannels]);

  // Current active room metadata
  const currentActiveRoomMeta = useMemo(() => {
    const targetRoomName = (voiceStateDetails.inVoice && currentVoiceRoom)
      ? currentVoiceRoom
      : (voiceStateDetails.channelName || serverVoiceChannel || '🎤﹒General');
    return getRoomMeta(targetRoomName);
  }, [voiceStateDetails.inVoice, currentVoiceRoom, voiceStateDetails.channelName, serverVoiceChannel]);

  const isRoomActive = (room: ServerRoomMeta) => {
    if (!voiceStateDetails.inVoice || !currentVoiceRoom) return false;
    const cleanCurrent = currentVoiceRoom.replace(/^[^\w\u0600-\u06FF]+/, '').trim().toLowerCase();
    const cleanRoomName = room.name.replace(/^[^\w\u0600-\u06FF]+/, '').trim().toLowerCase();
    const cleanCleanName = room.cleanName.toLowerCase();

    return (
      cleanCurrent.includes(cleanRoomName) ||
      cleanRoomName.includes(cleanCurrent) ||
      cleanCurrent.includes(cleanCleanName) ||
      room.type === currentActiveRoomMeta.type
    );
  };

  // Clear hover state immediately on card close, modal dismissal, or blur
  useEffect(() => {
    const handleClearHover = () => {
      setIsCardHovered(false);
    };

    window.addEventListener('sultan-clear-hover-state', handleClearHover);
    window.addEventListener('hide-custom-tooltip', handleClearHover);
    window.addEventListener('blur', handleClearHover);
    window.addEventListener('mouseleave', handleClearHover);

    return () => {
      window.removeEventListener('sultan-clear-hover-state', handleClearHover);
      window.removeEventListener('hide-custom-tooltip', handleClearHover);
      window.removeEventListener('blur', handleClearHover);
      window.removeEventListener('mouseleave', handleClearHover);
    };
  }, []);

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
        className={`w-full relative transition-transform duration-700 ease-out will-change-transform ${
          isCardHovered ? 'animate-sultan-hover-float' : 'animate-sultan-float'
        }`}
      >
        {/* Dynamic Ambient Room Aura Glow (يعكس حالة ولون الروم الحالي: ألعاب / روقان / خمول) */}
        <div
          className={`absolute -inset-1.5 rounded-[32px] bg-gradient-to-r ${currentRoomConfig.ambientGlow} blur-2xl opacity-70 pointer-events-none transition-all duration-700`}
        />

        <div
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseEnter={() => {
            setIsCardHovered(true);
          }}
          onMouseLeave={() => {
            setIsCardHovered(false);
            onMouseLeave();
          }}
          className={`w-full relative rounded-3xl ${currentRoomConfig.cardBg} border backdrop-blur-2xl transition-all duration-700 overflow-hidden text-right z-20 ${statusConfig.borderGlow}`}
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
        className="absolute -top-[1px] left-8 right-8 h-[2px] opacity-85 transition-all duration-700 z-20"
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
        <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full ${currentRoomConfig.bannerAura} blur-2xl pointer-events-none transition-all duration-700`} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-indigo-600/35 blur-2xl pointer-events-none" />

        {/* Status Pill Badge (Top Left) */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] font-mono-custom">
          <span className={`w-2 h-2 rounded-full ${statusConfig.color} animate-pulse ${statusConfig.glow}`} />
          <span className={`font-bold ${statusConfig.text}`}>{statusConfig.label}</span>
        </div>

        {/* Dynamic Room State Pill Badge (Gaming / Chill / AFK) */}
        {currentRoomConfig.label && (
          <div
            className={`absolute top-3 left-28 xs:left-32 sm:left-36 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md text-[10px] font-bold transition-all duration-500 shadow-md ${currentRoomConfig.badgeBg}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            <span className="truncate max-w-[120px] sm:max-w-none">{currentRoomConfig.label}</span>
          </div>
        )}

        {/* Share Button (Top Right) with tactile CSS scale */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onMouseEnter={playHover}
            onTouchStart={playHover}
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
            onMouseEnter={playHover}
            onTouchStart={playHover}
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
                onMouseEnter={playHover}
                onTouchStart={playHover}
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

          {/* Quick Action Buttons on Header Right: Copy Tag & Account */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 max-w-full">
            <button
              onMouseEnter={playHover}
              onTouchStart={playHover}
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
              onMouseEnter={playHover}
              onTouchStart={playHover}
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

        {/* صف كبسولات الأقسام الرئيسية: الألعاب، الأسرار، الرادار */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1 pb-1 w-full">
          {/* 1. الألعاب */}
          <div className="relative group/sec">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-600/35 to-teal-600/35 opacity-0 group-hover/sec:opacity-100 transition-opacity duration-300 blur-md pointer-events-none" />
            <button
              type="button"
              onClick={() => handleSectionClick('gaming', onOpenGaming)}
              onMouseEnter={playHover}
              onTouchStart={playHover}
              className={`relative w-full min-h-[46px] flex flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-black/60 border border-emerald-500/30 group-hover/sec:border-emerald-400/80 text-white text-xs font-bold transition-all duration-200 active:scale-90 shadow-sm group-hover/sec:shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer overflow-hidden ${
                pulsingSection === 'gaming'
                  ? 'scale-90 ring-2 ring-emerald-400 bg-emerald-900/60 shadow-[0_0_25px_rgba(16,185,129,0.7)]'
                  : ''
              }`}
              title="منصة الجيمنج وبطولات الألعاب"
              data-tooltip="فتح حسابات وإعدادات ألعاب السلطان"
            >
              {pulsingSection === 'gaming' && (
                <span className="absolute inset-0 rounded-2xl animate-ping border-2 border-emerald-400 opacity-75 pointer-events-none" />
              )}
              <Gamepad2 size={15} className={`text-emerald-400 group-hover/sec:scale-110 transition-transform shrink-0 ${pulsingSection === 'gaming' ? 'animate-bounce' : ''}`} />
              <span className="truncate">الألعاب 🎮</span>
            </button>
          </div>

          {/* 3. الأسرار */}
          <div className="relative group/sec">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-600/35 to-yellow-600/35 opacity-0 group-hover/sec:opacity-100 transition-opacity duration-300 blur-md pointer-events-none" />
            <button
              type="button"
              onClick={() => handleSectionClick('secrets', onOpenSecrets)}
              onMouseEnter={playHover}
              onTouchStart={playHover}
              className={`relative w-full min-h-[46px] flex flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-gradient-to-b from-amber-950/40 to-black/60 border border-amber-500/30 group-hover/sec:border-amber-400/80 text-white text-xs font-bold transition-all duration-200 active:scale-90 shadow-sm group-hover/sec:shadow-[0_0_20px_rgba(245,158,11,0.35)] cursor-pointer overflow-hidden ${
                pulsingSection === 'secrets'
                  ? 'scale-90 ring-2 ring-amber-400 bg-amber-900/60 shadow-[0_0_25px_rgba(245,158,11,0.7)]'
                  : ''
              }`}
              title="الألعاب والمهام السرية"
              data-tooltip="فتح لعبة السلطان والمهام الملكية"
            >
              {pulsingSection === 'secrets' && (
                <span className="absolute inset-0 rounded-2xl animate-ping border-2 border-amber-400 opacity-75 pointer-events-none" />
              )}
              <Sparkles size={15} className={`text-amber-400 group-hover/sec:scale-110 transition-transform shrink-0 ${pulsingSection === 'secrets' ? 'animate-bounce' : ''}`} />
              <span className="truncate">الأسرار 👑</span>
            </button>
          </div>

          {/* 4. الرادار */}
          <div className="relative group/sec">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-600/35 to-sky-600/35 opacity-0 group-hover/sec:opacity-100 transition-opacity duration-300 blur-md pointer-events-none" />
            <button
              type="button"
              onClick={() => handleSectionClick('radar', () => setIsRadarModalOpen(true))}
              onMouseEnter={playHover}
              onTouchStart={playHover}
              className={`relative w-full min-h-[46px] flex flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-black/60 border border-cyan-500/30 group-hover/sec:border-cyan-400/80 text-white text-xs font-bold transition-all duration-200 active:scale-90 shadow-sm group-hover/sec:shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer overflow-hidden ${
                pulsingSection === 'radar'
                  ? 'scale-90 ring-2 ring-cyan-400 bg-cyan-900/60 shadow-[0_0_25px_rgba(6,182,212,0.7)]'
                  : ''
              }`}
              title="رادار نشاط الديسكورد المباشر"
              data-tooltip="فتح رادار نشاط السلطان بالديسكورد"
            >
              {pulsingSection === 'radar' && (
                <span className="absolute inset-0 rounded-2xl animate-ping border-2 border-cyan-400 opacity-75 pointer-events-none" />
              )}
              <Radio size={15} className={`text-cyan-400 animate-pulse group-hover/sec:scale-110 transition-transform shrink-0 ${pulsingSection === 'radar' ? 'animate-bounce' : ''}`} />
              <span className="truncate">الرادار 🎙️</span>
            </button>
          </div>
        </div>

        {/* Real-time Spotify Live Listening Card (مزامنة مباشرة مع سبوتيفاي السلطان) */}
        {spotify && (
          <a
            href={spotify.track_id ? `https://open.spotify.com/track/${spotify.track_id}` : 'https://open.spotify.com'}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={playHover}
            className="group/spot w-full relative flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-black/80 to-zinc-950 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-emerald-500/40 shadow-sm bg-black">
                {spotify.album_art_url ? (
                  <img
                    src={spotify.album_art_url}
                    alt={spotify.song || 'Spotify Album'}
                    className="w-full h-full object-cover group-hover/spot:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-400">
                    <Music size={20} />
                  </div>
                )}
                <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-ping" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>يستمع الآن على Spotify 🎧</span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-white truncate group-hover/spot:text-emerald-300 transition-colors">
                  {spotify.song}
                </p>
                <p className="text-[11px] text-zinc-300 truncate font-medium">
                  {spotify.artist}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold group-hover/spot:bg-emerald-500/30 transition-all">
              <span className="hidden sm:inline">تشغيل في سبوتيفاي</span>
              <ExternalLink size={13} />
            </div>
          </a>
        )}

        {/* 5. Discord Badges Row (عضو منذ 2020 + رادار الألعاب المباشر + شارة الولاء) */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5 pb-0.5">
          {/* Prominent Discord Badge: عضو منذ 2020 with Calendar Icon */}
          <div
            onMouseEnter={playHover}
            onTouchStart={playHover}
            className="group/badge relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-150 active:scale-95 cursor-default"
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

          {/* Feature 2: رادار حالة اللعب والنشاط الفوري (Live Gaming Activity Badge) */}
          {(() => {
            const isOffline = !lanyard?.discord_status || lanyard.discord_status === 'offline';
            const currentGame = lanyard?.activities?.find((a) => a.type === 0)?.name;
            const spotifySong = lanyard?.listening_to_spotify ? lanyard.spotify?.song : null;

            return (
              <button
                type="button"
                onClick={() => {
                  audioEngine.playPowerUpSound();
                  setIsRadarModalOpen(true);
                }}
                onMouseEnter={playHover}
                onTouchStart={playHover}
                className={`group/radar relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                  isOffline
                    ? 'bg-zinc-900/80 border-zinc-700/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 shadow-sm'
                    : currentGame
                    ? 'bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-blue-950/70 border-purple-500/40 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:border-purple-400'
                    : spotifySong
                    ? 'bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-black/70 border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:border-emerald-400'
                    : 'bg-gradient-to-r from-cyan-950/70 via-sky-950/50 to-blue-950/70 border-cyan-500/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:border-cyan-400'
                }`}
                data-tooltip="عرض رادار الألعاب والنشاط المباشر للسلطان"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  isOffline ? 'bg-zinc-500' : 'bg-emerald-400 animate-ping'
                }`} />
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-zinc-400 font-medium">
                    {isOffline ? 'الرادار:' : currentGame ? 'يلعب الآن:' : spotifySong ? 'يستمع إلى:' : 'الحالة:'}
                  </span>
                  <span className={`font-bold truncate max-w-[130px] sm:max-w-[160px] ${
                    isOffline ? 'text-zinc-400' : currentGame ? 'text-purple-300' : spotifySong ? 'text-emerald-300' : 'text-cyan-300'
                  }`}>
                    {isOffline
                      ? 'وضع الاستعداد 💤'
                      : currentGame || (spotifySong ? `${spotifySong} 🎵` : 'متصل ديسكورد 💬')}
                  </span>
                </div>
              </button>
            );
          })()}

          {/* Feature 3: نظام شارات الولاء للزوار (Visitor VIP Badges & Loyalty Streaks) */}
          {visitorLoyalty && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playPowerUpSound();
                if (onOpenLoyaltyModal) onOpenLoyaltyModal();
              }}
              onMouseEnter={playHover}
              onTouchStart={playHover}
              className="group/loyalty relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/70 via-yellow-950/40 to-black/70 border border-amber-500/40 text-amber-200 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-150 active:scale-95 cursor-pointer"
              data-tooltip={`ولاؤك الملكي: ${visitorLoyalty.streakDays} أيام متتالية (${visitorLoyalty.currentTier.name})`}
            >
              <Flame size={13} className="text-amber-400 animate-pulse" />
              <span>{visitorLoyalty.currentTier.badge}</span>
              <span className="font-mono text-amber-300 font-bold">{visitorLoyalty.streakDays}d</span>
            </button>
          )}
        </div>

        {/* Sultan's Daily Story Capsule */}
        {dailyStory.enabled !== false && (
          <div
            onMouseEnter={playHover}
            onTouchStart={playHover}
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

        {/* 5. الوصف (About Me / Bio Section) */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
          <div className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider flex items-center justify-between">
            <span>عني • ABOUT ME</span>
            <span className="text-[10px] text-zinc-400">Discord Bio</span>
          </div>
          <div className="min-h-[26px] text-sm sm:text-base text-white font-bold flex items-center gap-1">
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
              isEcoMode={isEcoMode}
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
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-zinc-300 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span className="text-emerald-400 font-bold">{onlineMembers}</span> متصل
                  </span>
                  <span>•</span>
                  <span>
                    <span className="text-zinc-200 font-bold">{totalMembers}</span> عضو
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[10px] sm:text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 shrink-0 font-bold">
              TUU6EeC6pb
            </span>
          </div>

          <a
            href="https://discord.gg/TUU6EeC6pb"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={playHover}
            onTouchStart={playHover}
            onClick={() => audioEngine.playClickSound()}
            className="w-full min-h-[46px] py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <MessageSquare size={16} />
            <span>انضم لسيرفر السلطان (Friends For Ever) 🚀</span>
          </a>
        </div>

        {/* 10. Rating Section with tactile CSS Scale */}
        <div className="flex items-center justify-center gap-3 text-xs text-zinc-300 pt-3 border-t border-white/10">
          <span className="font-medium">رأيك في بروفايل السلطان؟</span>
          <div className="flex items-center gap-2">
            <button
              onMouseEnter={playHover}
              onTouchStart={playHover}
              onClick={() => onRate('up')}
              className={`min-h-[44px] min-w-[68px] px-3 py-2 rounded-xl border transition-all duration-150 active:scale-90 flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
                hasRated === 'up'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200 hover:text-white'
              }`}
              title="عجبني جداً"
              aria-label="تقييم إيجابي"
            >
              <ThumbsUp size={15} />
              <span className="font-mono-custom text-xs">عجبني</span>
            </button>

            <button
              onMouseEnter={playHover}
              onTouchStart={playHover}
              onClick={() => onRate('down')}
              className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border transition-all duration-150 active:scale-90 flex items-center justify-center gap-1 cursor-pointer ${
                hasRated === 'down'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white'
              }`}
              title="محتاج تطوير"
              aria-label="تقييم سلبي"
            >
              <ThumbsDown size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>

      {/* Modals: Sultan's Daily Story & Live Discord Activity Radar */}
      <DailyStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => {
          setIsStoryModalOpen(false);
          setIsCardHovered(false);
          window.dispatchEvent(new CustomEvent('sultan-clear-hover-state'));
          window.dispatchEvent(new CustomEvent('hide-custom-tooltip'));
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        }}
        story={dailyStory}
        config={config}
        avatarUrl={avatarUrl}
      />
      <DiscordActivityRadarModal
        isOpen={isRadarModalOpen}
        onClose={() => {
          setIsRadarModalOpen(false);
          setIsCardHovered(false);
          window.dispatchEvent(new CustomEvent('sultan-clear-hover-state'));
          window.dispatchEvent(new CustomEvent('hide-custom-tooltip'));
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        }}
        lanyard={lanyard}
        config={config}
        serverOnlineMembers={onlineMembers}
        serverTotalMembers={totalMembers}
        serverName={serverName}
      />
    </div>
  );
};
