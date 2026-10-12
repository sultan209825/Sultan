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
  rawSource?: 'direct_discord' | 'server_proxy' | 'cached';
}

let lastResolvedState: LiveVoiceResult | null = null;

export function parseWidgetMembersAndVoice(data: any): LiveVoiceResult {
  const serverName = data?.name || '✨ Friends For Ever ✨';
  const members: any[] = Array.isArray(data?.members) ? data.members : [];
  const channels: any[] = Array.isArray(data?.channels) ? data.channels : [];

  const availableChannels: ChannelInfo[] = channels.map((c) => ({
    id: c.id,
    name: c.name,
    position: c.position
  }));

  // Find Sultan
  const sultanCandidates = members.filter((m: any) => {
    const u = (m.username || '').toLowerCase();
    const g = (m.game?.name || '').toLowerCase();
    return (
      m.id === '1224502828371017788' ||
      u.includes('5susu') ||
      u.includes('sultan') ||
      u.includes('سلطان') ||
      m.username?.includes('𝑺𝒖𝒍𝒕𝒂𝒏') ||
      m.username?.includes('𓆩') ||
      m.username?.includes('𓆪') ||
      g.includes('sultan') ||
      g.includes('سلطان') ||
      g.includes('5susu') ||
      g.includes('𝑺𝒖𝒍𝒕𝒂𝒏')
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
    connectedAt: inVoice ? (lastResolvedState?.channelId === targetChannelId && lastResolvedState?.connectedAt ? lastResolvedState.connectedAt : new Date().toISOString()) : null,
    companions,
    allVoiceMembers,
    availableChannels,
    rawSource: 'direct_discord'
  };
}

/**
 * Robust fetch with dual-path execution:
 * 1. Fetches from /api/discord/live-voice with unique timestamp (handled by server via fast cached-busted proxy in 500ms)
 * 2. Fallback client-side proxy if server route ever fails or times out
 * 3. Cross-verifies status with Lanyard so Sultan is never falsely marked as offline
 * 4. Automatically triggers timeline diff detection
 */
export async function fetchLiveVoiceTelemetry(): Promise<LiveVoiceResult> {
  const prev = lastResolvedState;
  let resolved: LiveVoiceResult | null = null;

  // 1. Query server proxy /api/discord/live-voice with unique timestamp to bypass caching
  try {
    const timestampKey = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const serverRes = await fetch(
      `/api/discord/live-voice?bypassCache=1&_t=${timestampKey}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache'
        },
        signal: AbortSignal.timeout(3500)
      }
    );
    if (serverRes.ok) {
      const data = await serverRes.json();
      const svc = data?.sultanVoiceChannel || data;
      if (svc && typeof svc === 'object') {
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
  } catch {}

  // 2. Client fallback direct via Jina proxy if server returned nothing or had an error
  if (!resolved || (!resolved.inVoice && (!resolved.allVoiceMembers || resolved.allVoiceMembers.length === 0))) {
    try {
      const timestampKey = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const proxyRes = await fetch(
        `https://r.jina.ai/https://discord.com/api/guilds/1306240131224571957/widget.json?_t=${timestampKey}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'x-no-cache': 'true'
          },
          signal: AbortSignal.timeout(3500)
        }
      );
      if (proxyRes.ok) {
        const text = await proxyRes.text();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const json = JSON.parse(text.slice(firstBrace, lastBrace + 1));
          if (json && Array.isArray(json.members)) {
            resolved = parseWidgetMembersAndVoice(json);
            // Sync with backend cache
            fetch('/api/discord/sync-widget', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(json)
            }).catch(() => {});
          }
        }
      }
    } catch {}
  }

  // 3. Safe fallback if network completely offline: retain previous known valid state
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
      status: 'online',
      serverName: '✨ Friends For Ever ✨',
      connectedAt: null,
      companions: [],
      allVoiceMembers: [],
      availableChannels: [],
      rawSource: 'cached'
    };
  }

  // Cross-verify status with Lanyard API to guarantee Sultan is never falsely marked as offline
  try {
    const lanRes = await fetch('https://api.lanyard.rest/v1/users/1224502828371017788', {
      signal: AbortSignal.timeout(2000)
    });
    if (lanRes.ok) {
      const lanData = await lanRes.json();
      const dStatus = lanData?.data?.discord_status;
      if (dStatus && dStatus !== 'offline') {
        resolved.status = dStatus;
      }
    }
  } catch {}

  // Detect state diff and write to timeline
  diffVoiceStates(prev, resolved);
  lastResolvedState = resolved;

  return resolved;
}
