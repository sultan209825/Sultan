import { diffVoiceStates, ActivityEvent } from './activityTimelineTracker';

export interface VoiceMember {
  id: string;
  username: string;
  avatar_url?: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isStreaming?: boolean;
  channelId?: string;
  channelName?: string;
  status?: string;
  isSultan?: boolean;
}

export interface ChannelInfo {
  id: string;
  name: string;
  position?: number;
}

export interface LiveVoiceResult {
  inVoice: boolean;
  channelId: string | null;
  channelName: string;
  isMuted: boolean;
  selfMute: boolean;
  serverMute: boolean;
  isDeafened: boolean;
  selfDeaf: boolean;
  serverDeaf: boolean;
  isStreaming: boolean;
  status: string;
  serverName: string;
  connectedAt: string | null;
  companions: VoiceMember[];
  allVoiceMembers: VoiceMember[];
  availableChannels: ChannelInfo[];
  rawSource?: 'direct_discord' | 'php_host' | 'server_proxy' | 'cloud_run' | 'jina_proxy' | 'cached';
}

const GUILD_ID = '1306240131224571957';
const DISCORD_WIDGET_URL = `https://discord.com/api/guilds/${GUILD_ID}/widget.json`;

let lastResolvedState: LiveVoiceResult | null = null;

export function parseWidgetMembersAndVoice(data: any, source: LiveVoiceResult['rawSource'] = 'direct_discord'): LiveVoiceResult {
  const serverName = data?.name || '✨ Friends For Ever ✨';
  const members: any[] = Array.isArray(data?.members) ? data.members : [];
  const channels: any[] = Array.isArray(data?.channels) ? data.channels : [];

  const availableChannels: ChannelInfo[] = channels.map((c) => ({
    id: c.id,
    name: c.name,
    position: c.position
  }));

  // Find Sultan: strictly match his known username patterns or Discord ID with NFKD Unicode normalization
  const sultanCandidates = members.filter((m: any) => {
    const rawU = m.username || '';
    const normU = rawU.normalize('NFKD').toLowerCase();
    const rawG = m.game?.name || '';
    const normG = rawG.normalize('NFKD').toLowerCase();
    return (
      m.id === '1224502828371017788' ||
      normU.includes('5susu') ||
      normU.includes('sultan') ||
      normU.includes('سلطان') ||
      rawU.includes('𝑺𝒖𝒍𝒕𝒂𝒏') ||
      rawU.includes('𓆩') ||
      rawU.includes('𓆪') ||
      normG.includes('sultan') ||
      normG.includes('سلطان') ||
      normG.includes('5susu') ||
      rawG.includes('𝑺𝒖𝒍𝒕𝒂𝒏')
    );
  });

  const sultanInVoice = sultanCandidates.find((m: any) => Boolean(m.channel_id));
  const sultan = sultanInVoice || sultanCandidates[0];

  const inVoice = Boolean(sultan && sultan.channel_id);
  const targetChannelId = sultan?.channel_id || null;

  const foundChannel = targetChannelId ? channels.find((c: any) => c.id === targetChannelId) : null;
  const channelName = foundChannel?.name || (inVoice ? 'غرفة صوتية خاصة 🎙️' : '🎤﹒General');

  const isMuted = Boolean(sultan?.self_mute || sultan?.mute || sultan?.suppress);
  const selfMute = Boolean(sultan?.self_mute);
  const serverMute = Boolean(sultan?.mute || sultan?.suppress);
  const isDeafened = Boolean(sultan?.self_deaf || sultan?.deaf);
  const selfDeaf = Boolean(sultan?.self_deaf);
  const serverDeaf = Boolean(sultan?.deaf);
  const isStreaming = Boolean(sultan?.self_stream || sultan?.streaming || sultan?.self_video);

  const companions: VoiceMember[] = inVoice
    ? members
        .filter((m: any) => m.channel_id === targetChannelId && m !== sultan && m.username !== sultan?.username)
        .map((m: any) => ({
          id: m.id || m.username,
          username: m.username,
          avatar_url: m.avatar_url,
          isMuted: Boolean(m.mute || m.self_mute),
          isDeafened: Boolean(m.deaf || m.self_deaf),
          isStreaming: Boolean(m.self_stream || m.streaming || m.self_video),
          channelId: m.channel_id,
          status: m.status || 'online'
        }))
    : [];

  const allVoiceMembers: VoiceMember[] = members
    .filter((m: any) => Boolean(m.channel_id))
    .map((m: any) => ({
      id: m.id || m.username,
      username: m.username,
      avatar_url: m.avatar_url,
      isMuted: Boolean(m.mute || m.self_mute),
      isDeafened: Boolean(m.deaf || m.self_deaf),
      isStreaming: Boolean(m.self_stream || m.streaming || m.self_video),
      channelId: m.channel_id,
      channelName: channels.find((c: any) => c.id === m.channel_id)?.name || 'روم صوتي',
      isSultan: m === sultan || m.username === sultan?.username,
      status: m.status || 'online'
    }));

  return {
    inVoice,
    channelId: targetChannelId,
    channelName,
    isMuted,
    selfMute,
    serverMute,
    isDeafened,
    selfDeaf,
    serverDeaf,
    isStreaming,
    status: sultan?.status || 'online',
    serverName,
    connectedAt: inVoice
      ? (lastResolvedState?.channelId === targetChannelId && lastResolvedState?.connectedAt
          ? lastResolvedState.connectedAt
          : new Date().toISOString())
      : null,
    companions,
    allVoiceMembers,
    availableChannels,
    rawSource: source
  };
}

/**
 * Universal Multi-Tier Live Voice Telemetry Fetcher:
 * Operates flawlessly across:
 * - Local dev & Cloud Run preview environment
 * - Direct Discord Official Widget with native CORS
 * - External static & shared PHP hosting (InfinityFree, cPanel, Vercel)
 * - Mobile and desktop browsers
 */
export async function fetchLiveVoiceTelemetry(): Promise<LiveVoiceResult> {
  const prev = lastResolvedState;
  let resolved: LiveVoiceResult | null = null;
  const timestampKey = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Tier 1: Local Dev & Cloud Run server proxy (/api/discord/live-voice)
  if (typeof window !== 'undefined') {
    try {
      const localRes = await fetch(`/api/discord/live-voice?bypassCache=1&_t=${timestampKey}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3500)
      });
      if (localRes.ok) {
        const ct = localRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await localRes.json();
          const svc = data?.sultanVoiceChannel || data;
          if (svc && typeof svc === 'object' && (svc.inVoice !== undefined || svc.availableChannels)) {
            resolved = {
              inVoice: Boolean(svc.inVoice || svc.channelId),
              channelId: svc.channelId || null,
              channelName: svc.channelName || '🎤﹒General',
              isMuted: Boolean(svc.isMuted),
              selfMute: Boolean(svc.selfMute),
              serverMute: Boolean(svc.serverMute),
              isDeafened: Boolean(svc.isDeafened),
              selfDeaf: Boolean(svc.selfDeaf),
              serverDeaf: Boolean(svc.serverDeaf),
              isStreaming: Boolean(svc.isStreaming),
              status: svc.status || 'online',
              serverName: svc.serverName || '✨ Friends For Ever ✨',
              connectedAt: svc.connectedAt || null,
              companions: Array.isArray(svc.companions) ? svc.companions : [],
              allVoiceMembers: Array.isArray(svc.allVoiceMembers) ? svc.allVoiceMembers : [],
              availableChannels: Array.isArray(svc.availableChannels) ? svc.availableChannels : [],
              rawSource: 'server_proxy'
            };
          }
        }
      }
    } catch {}
  }

  // Tier 2: Direct Client Fetch to Discord Official Widget API
  // NOTE: Do NOT send custom headers like Cache-Control/Pragma which trigger preflight OPTIONS failure.
  // Standard simple GET request natively receives 'access-control-allow-origin: *' from Discord.
  if (!resolved) {
    try {
      const directRes = await fetch(`${DISCORD_WIDGET_URL}?_t=${timestampKey}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (directRes.ok) {
        const json = await directRes.json();
        if (json && Array.isArray(json.members)) {
          resolved = parseWidgetMembersAndVoice(json, 'direct_discord');
        }
      }
    } catch {}
  }

  // Tier 3: External hosting PHP Proxy (if deployed on cPanel / shared host where api_discord_radar.php exists)
  if (!resolved && typeof window !== 'undefined') {
    try {
      const phpRes = await fetch(`./api_discord_radar.php?_t=${timestampKey}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2500)
      });
      if (phpRes.ok) {
        const json = await phpRes.json();
        const widgetData = json?.data || json;
        if (widgetData && Array.isArray(widgetData.members)) {
          resolved = parseWidgetMembersAndVoice(widgetData, 'php_host');
        }
      }
    } catch {}
  }

  // Tier 4: Public CORS Proxy fallback (allorigins)
  if (!resolved) {
    try {
      const proxyRes = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(DISCORD_WIDGET_URL)}`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json && Array.isArray(json.members)) {
          resolved = parseWidgetMembersAndVoice(json, 'jina_proxy');
        }
      }
    } catch {}
  }

  // Safe fallback to prevent layout breaks
  if (!resolved) {
    resolved = prev || {
      inVoice: false,
      channelId: null,
      channelName: '🎤﹒General',
      isMuted: false,
      selfMute: false,
      serverMute: false,
      isDeafened: false,
      selfDeaf: false,
      serverDeaf: false,
      isStreaming: false,
      status: 'offline',
      serverName: '✨ Friends For Ever ✨',
      connectedAt: null,
      companions: [],
      allVoiceMembers: [],
      availableChannels: [],
      rawSource: 'cached'
    };
  }

  // Tier 5: Real-time Lanyard Cross-Verification
  // Updates online/offline status, but NEVER clears voice state if Discord Guild Widget explicitly found him in a channel
  try {
    const lanRes = await fetch('https://api.lanyard.rest/v1/users/1224502828371017788', {
      signal: AbortSignal.timeout(2500)
    });
    if (lanRes.ok) {
      const lanData = await lanRes.json();
      const dStatus = lanData?.data?.discord_status;
      if (dStatus) {
        resolved.status = dStatus;
        // Only if Discord widget did NOT find him in voice AND Lanyard reports offline
        if (dStatus === 'offline' && !resolved.inVoice) {
          resolved.channelId = null;
          resolved.isMuted = false;
          resolved.selfMute = false;
          resolved.serverMute = false;
          resolved.isDeafened = false;
          resolved.selfDeaf = false;
          resolved.serverDeaf = false;
          resolved.isStreaming = false;
        }
      }
    }
  } catch {}

  // Detect state diff and write to timeline
  diffVoiceStates(prev, resolved);
  lastResolvedState = resolved;

  return resolved;
}
