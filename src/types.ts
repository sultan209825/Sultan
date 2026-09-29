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

export interface SiteConfig {
  username: string;
  handle: string;
  bio: string;
  joinYear: string;
  footerDomain: string;
  theme: 'default' | 'royal' | 'emerald' | 'rose';
  bgEffect: 'auto' | 'winter' | 'summer' | 'cyber' | 'rain' | 'none';
  bgStyle?: 'particle' | 'static' | 'glow';
  countdownDate: string;
  countdownLabel: string;
  discordWebhookUrl?: string;
  discordWebhookEnabled?: boolean;
  socials: Record<string, string>;
  socialsEnabled: Record<string, boolean>;
}

export interface LanyardData {
  discord_user: {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
    global_name?: string;
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
