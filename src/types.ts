export interface TimedLyricLine {
  startTime: number;
  endTime: number;
  text: string;
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  tempo: number;
  duration: number; // in seconds
  file?: string;
  lyrics: string;
  timedLyrics?: TimedLyricLine[];
  tagline: string;
  isCustomUpload?: boolean;
  coverColor?: string;
  coverImage?: string;
}

export type ThemeId = 'blood_royal' | 'imperial_gold' | 'cyber_neon' | 'stealth_black' | 'emerald_dynasty' | 'royal' | 'default' | 'emerald' | 'rose';

export interface GamerAccount {
  id: string;
  game: 'valorant' | 'steam' | 'pubg' | 'discord' | 'epic' | 'playstation' | 'xbox' | 'league' | 'roblox';
  title: string;
  ign: string;
  tagOrCode?: string;
  rank?: string;
  extraInfo?: string; // e.g. Agent: Reyna, Level 150
  profileUrl?: string;
  icon?: string;
  enabled: boolean;
}

export interface GamerHubConfig {
  enabled: boolean;
  statusText: string;
  isLookingForGroup: boolean;
  accounts: GamerAccount[];
}

export interface DailyStory {
  enabled: boolean;
  text: string;
  moodEmoji: string;
  category: string;
  createdAt: string;
  likesCount?: number;
  reactions?: Record<string, number>;
}

export interface DiscordRadarConfig {
  enabled: boolean;
  customStatusText?: string;
  customStatusEmoji?: string;
  voiceChannelName?: string;
  allowDirectMessage?: boolean;
}

export interface SiteConfig {
  username: string;
  handle: string;
  bio: string;
  joinYear: string;
  footerDomain: string;
  theme: ThemeId;
  bgEffect: 'auto' | 'winter' | 'summer' | 'cyber' | 'rain' | 'none';
  bgStyle?: 'particle' | 'static' | 'glow';
  countdownDate: string;
  countdownLabel: string;
  musicAutoPlay?: boolean;
  defaultVolume?: number;
  tracks?: SongTrack[];
  gamerHub?: GamerHubConfig;
  dailyStory?: DailyStory;
  discordRadar?: DiscordRadarConfig;
  discordWebhookUrl?: string;
  discordWebhookEnabled?: boolean;
  discordAutoRole?: {
    enabled: boolean;
    roleName: string;
    roleId?: string;
    guildId?: string;
    botToken?: string;
    clientId?: string;
    inviteUrl?: string;
    apiProxyUrl?: string;
  };
  socials: Record<string, string>;
  socialsEnabled: Record<string, boolean>;
  emailNotifications?: {
    enabled: boolean;
    email: string;
    notifyOnAdminLogin: boolean;
    notifyOnVipRoleClaim: boolean;
  };
}

export interface LanyardData {
  discord_user: {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
    global_name?: string;
    avatar_decoration_data?: {
      asset: string;
      sku_id?: string;
      expires_at?: number | null;
    } | null;
    collectibles?: {
      nameplate?: {
        asset: string;
        label?: string;
        palette?: string;
        sku_id?: string;
        expires_at?: number | null;
      } | null;
    } | null;
    profile_effect?: {
      id: string;
      expires_at?: number | null;
    } | null;
  };
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: Array<{
    id: string;
    name: string;
    type: number;
    state?: string;
    details?: string;
    timestamps?: { start?: number; end?: number };
    assets?: {
      large_image?: string;
      large_text?: string;
      small_image?: string;
      small_text?: string;
    };
  }>;
  spotify?: {
    track_id: string;
    timestamps: { start: number; end: number };
    song: string;
    artist: string;
    album_art_url: string;
    album: string;
  } | null;
  listening_to_spotify: boolean;
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  file: string;
  description: string;
  fix: string;
  solutionCode?: string;
}
