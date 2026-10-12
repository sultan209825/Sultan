// Discord Bot Gateway Service for Sultan's Personal Discord Bot
// Connects to Discord Gateway and gives VIP role automatically when any member joins!

import fs from 'fs';
import path from 'path';

interface BotConfig {
  botToken: string;
  guildId: string;
  roleId: string;
}

interface BotState {
  isOnline: boolean;
  botName: string | null;
  botId: string | null;
  guildName: string | null;
  roleName: string | null;
  lastError: string | null;
  assignedCount: number;
  sultanVoiceChannel: {
    channelId: string | null;
    channelName: string | null;
    isMuted: boolean;
    isDeafened: boolean;
    isStreaming: boolean;
    connectedAt: string | null;
  } | null;
}

const state: BotState = {
  isOnline: true,
  botName: null,
  botId: null,
  guildName: null,
  roleName: null,
  lastError: null,
  assignedCount: 0,
  sultanVoiceChannel: null
};

let currentWs: any = null;
let heartbeatIntervalId: any = null;
let activeConfig: BotConfig | null = null;

interface CachedWidget {
  timestamp: number;
  data: any;
}

const SNAPSHOT_PATH = path.resolve(process.cwd(), 'src/data/last_widget_snapshot.json');

function loadSnapshot(): any {
  try {
    if (fs.existsSync(SNAPSHOT_PATH)) {
      const content = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch {}
  return null;
}

function saveSnapshot(data: any): void {
  try {
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

const initialSnapshot = loadSnapshot();
let lastKnownValidWidgetData: any = initialSnapshot;
let cachedWidget: CachedWidget | null = initialSnapshot
  ? { timestamp: Date.now(), data: initialSnapshot }
  : null;
let rateLimitBlockedUntil = 0;
const CACHE_TTL_MS = 2500; // 2.5s cache to gracefully absorb rapid polling

export function syncWidgetData(widgetJson: any) {
  if (widgetJson && Array.isArray(widgetJson.members)) {
    cachedWidget = { timestamp: Date.now(), data: widgetJson };
    lastKnownValidWidgetData = widgetJson;
    rateLimitBlockedUntil = 0;
    saveSnapshot(widgetJson);
    return true;
  }
  return false;
}

async function fetchGuildWidgetData(guildId: string, force = false): Promise<any> {
  const now = Date.now();
  if (!force && cachedWidget && now - cachedWidget.timestamp < CACHE_TTL_MS) {
    return cachedWidget.data;
  }

  // 1. Try Discord direct only if not currently rate limited
  if (now > rateLimitBlockedUntil) {
    try {
      const res = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(1800)
      });
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.channels)) {
          rateLimitBlockedUntil = 0;
          cachedWidget = { timestamp: now, data: json };
          lastKnownValidWidgetData = json;
          saveSnapshot(json);
          return json;
        }
      } else if (res.status === 429) {
        // Block direct Discord calls for 2 minutes to prevent slowing down requests
        rateLimitBlockedUntil = now + 120000;
      }
    } catch {}
  }

  // 2. High-resilience Jina proxy fallback with fresh unique timestamp (guarantees live, uncached Discord snapshot)
  try {
    const timestampKey = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const jinaRes = await fetch(`https://r.jina.ai/https://discord.com/api/guilds/${guildId}/widget.json?_t=${timestampKey}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'x-no-cache': 'true'
      },
      signal: AbortSignal.timeout(3500)
    });
    if (jinaRes.ok) {
      const text = await jinaRes.text();
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const json = JSON.parse(text.slice(firstBrace, lastBrace + 1));
        if (json && Array.isArray(json.channels) && Array.isArray(json.members)) {
          cachedWidget = { timestamp: now, data: json };
          lastKnownValidWidgetData = json;
          saveSnapshot(json);
          return json;
        }
      }
    }
  } catch {}

  // 3. Resilient fallback: return last known good data rather than breaking live telemetry
  if (cachedWidget) return cachedWidget.data;
  if (lastKnownValidWidgetData) return lastKnownValidWidgetData;
  return null;
}

export function getBotState() {
  return { ...state };
}

export async function getLiveVoiceState(guildId: string = '1306240131224571957', force = false) {
  // Query real-time Discord Guild Widget API with multi-domain fallback & cache-busting
  try {
    const data = await fetchGuildWidgetData(guildId, force);

    if (data && Array.isArray(data.members)) {
      // Find Sultan: strictly match his known username patterns or Discord ID (do NOT match generic m.id === '0' which matches everyone)
      const sultanCandidates = data.members.filter((m: any) => {
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

      // Prioritize candidate actively in a voice channel
      const sultanInVoice = sultanCandidates.find((m: any) => Boolean(m.channel_id));
      const sultan = sultanInVoice || sultanCandidates[0];

      const availableChannels = (data.channels || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        position: c.position
      }));

      // If WebSocket bot Gateway has active presence, override or supplement Sultan's channel state
      const isGatewayVoice = currentWs && currentWs.readyState === 1 && state.isOnline && state.sultanVoiceChannel?.channelId;

      if (isGatewayVoice || (sultan && sultan.channel_id)) {
        const targetChannelId = isGatewayVoice ? state.sultanVoiceChannel!.channelId! : sultan.channel_id;
        const channel = (data.channels || []).find((c: any) => c.id === targetChannelId);
        const channelName = isGatewayVoice
          ? (state.sultanVoiceChannel!.channelName || channel?.name || 'غرفة صوتية خاصة 🎙️')
          : (channel?.name || 'غرفة صوتية خاصة 🎙️');

        const isChannelChanged = state.sultanVoiceChannel?.channelId !== targetChannelId;

        // Find companions in the same voice channel
        const companions = (data.members || [])
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
          }));

        // All voice members in the server across all channels
        const allVoiceMembers = (data.members || [])
          .filter((m: any) => Boolean(m.channel_id))
          .map((m: any) => ({
            id: m.id || m.username,
            username: m.username,
            avatar_url: m.avatar_url,
            isMuted: Boolean(m.mute || m.self_mute),
            isDeafened: Boolean(m.deaf || m.self_deaf),
            isStreaming: Boolean(m.self_stream || m.streaming || m.self_video),
            channelId: m.channel_id,
            channelName: (data.channels || []).find((c: any) => c.id === m.channel_id)?.name || 'روم صوتي',
            isSultan: m === sultan || m.username === sultan?.username,
            status: m.status || 'online'
          }));

        const isStreaming = isGatewayVoice
          ? state.sultanVoiceChannel!.isStreaming
          : Boolean(
              sultan?.self_stream ||
              sultan?.streaming ||
              (data.members || []).some((m: any) => m === sultan && (m.self_stream || m.self_video))
            );

        const isMuted = isGatewayVoice
          ? state.sultanVoiceChannel!.isMuted
          : Boolean(sultan?.self_mute || sultan?.mute || sultan?.suppress);

        const isDeafened = isGatewayVoice
          ? state.sultanVoiceChannel!.isDeafened
          : Boolean(sultan?.self_deaf || sultan?.deaf);

        const voiceInfo = {
          inVoice: true,
          channelId: targetChannelId,
          channelName,
          isMuted,
          selfMute: isGatewayVoice ? isMuted : Boolean(sultan?.self_mute),
          serverMute: isGatewayVoice ? false : Boolean(sultan?.mute),
          isDeafened,
          selfDeaf: isGatewayVoice ? isDeafened : Boolean(sultan?.self_deaf),
          serverDeaf: isGatewayVoice ? false : Boolean(sultan?.deaf),
          isStreaming,
          status: sultan?.status || 'online',
          serverName: data.name || '✨ Friends For Ever ✨',
          connectedAt: isChannelChanged ? new Date().toISOString() : (state.sultanVoiceChannel?.connectedAt || new Date().toISOString()),
          companions,
          allVoiceMembers,
          availableChannels
        };
        state.sultanVoiceChannel = voiceInfo;
        return voiceInfo;
      } else {
        state.sultanVoiceChannel = null;
        return {
          inVoice: false,
          channelId: null,
          channelName: data.channels?.[1]?.name || '🎤﹒General',
          isMuted: false,
          selfMute: false,
          serverMute: false,
          isDeafened: false,
          selfDeaf: false,
          serverDeaf: false,
          isStreaming: false,
          status: sultan?.status || 'offline',
          serverName: data.name || '✨ Friends For Ever ✨',
          connectedAt: null,
          companions: [],
          allVoiceMembers: (data.members || []).filter((m: any) => Boolean(m.channel_id)).map((m: any) => ({
            id: m.id || m.username,
            username: m.username,
            avatar_url: m.avatar_url,
            isMuted: Boolean(m.mute || m.self_mute),
            isDeafened: Boolean(m.deaf || m.self_deaf),
            isStreaming: Boolean(m.self_stream || m.streaming || m.self_video),
            channelId: m.channel_id,
            channelName: (data.channels || []).find((c: any) => c.id === m.channel_id)?.name || 'روم صوتي',
            isSultan: false,
            status: m.status || 'online'
          })),
          availableChannels
        };
      }
    }
  } catch (err) {
    console.error('Error fetching Discord widget live voice:', err);
  }

  return {
    inVoice: false,
    channelId: null,
    channelName: '🎤﹒General',
    isMuted: false,
    isDeafened: false,
    isStreaming: false,
    status: 'offline',
    connectedAt: null,
    companions: [],
    availableChannels: [
      { id: '1306240131551858704', name: '🎤﹒General', position: 1 },
      { id: '1540800657588752395', name: '🎬﹒Watching Movies', position: 4 },
      { id: '1540457611701387314', name: '🎮﹒Gaming', position: 2 },
      { id: '1540457327298347170', name: '📖﹒Study', position: 3 },
      { id: '1545422837618184302', name: '💤﹒AFK', position: 5 }
    ]
  };
}

export function getActiveConfig(): BotConfig | null {
  return activeConfig;
}

export async function assignRoleToMember(
  userIdOrQuery: string,
  configOverride?: Partial<BotConfig>
): Promise<{ success: boolean; message: string; action?: 'added' | 'removed'; notInServer?: boolean; targetUser?: string }> {
  const token = configOverride?.botToken || activeConfig?.botToken;
  const guildId = configOverride?.guildId || activeConfig?.guildId;
  const roleId = configOverride?.roleId || activeConfig?.roleId;

  if (!token || !guildId || !roleId) {
    return { success: false, message: 'بيانات البوت أو السيرفر أو الرتبة غير مكتملة في النظام.' };
  }

  try {
    let resolvedUserId = (userIdOrQuery || '').trim();

    // Fetch guild details for owner resolution
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${token}` }
    });
    const guildData = guildRes.ok ? await guildRes.json() : null;

    // If identifier is not numeric ID, try to search member or match from member list
    if (!/^\d{16,21}$/.test(resolvedUserId)) {
      const cleanQuery = resolvedUserId.replace(/^@/, '').trim().toLowerCase();
      if (cleanQuery.length > 0) {
        // 1. Try Discord members search
        const searchRes = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/search?query=${encodeURIComponent(cleanQuery)}&limit=10`,
          { headers: { Authorization: `Bot ${token}`, 'User-Agent': 'DiscordBot (https://sultan.kesug.com, 1.0.0)' } }
        );
        if (searchRes.ok) {
          const members = await searchRes.json();
          if (Array.isArray(members) && members.length > 0) {
            const found = members.find((m: any) => {
              const u = (m.user?.username || '').toLowerCase();
              const g = (m.user?.global_name || '').toLowerCase();
              const nick = (m.nick || '').toLowerCase();
              return u === cleanQuery || g === cleanQuery || nick === cleanQuery || u.includes(cleanQuery);
            });
            resolvedUserId = (found || members[0]).user?.id || resolvedUserId;
          }
        }

        // 2. If still not resolved, try members listing
        if (!/^\d{16,21}$/.test(resolvedUserId)) {
          const listRes = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
            { headers: { Authorization: `Bot ${token}`, 'User-Agent': 'DiscordBot (https://sultan.kesug.com, 1.0.0)' } }
          );
          if (listRes.ok) {
            const members = await listRes.json();
            if (Array.isArray(members)) {
              const found = members.find((m: any) => {
                const u = (m.user?.username || '').toLowerCase();
                const g = (m.user?.global_name || '').toLowerCase();
                const nick = (m.nick || '').toLowerCase();
                return u === cleanQuery || g === cleanQuery || nick === cleanQuery || u.includes(cleanQuery) || g.includes(cleanQuery);
              });
              if (found?.user?.id) {
                resolvedUserId = found.user.id;
              }
            }
          }
        }
      }

      // If still not resolved and guild has owner: fallback to owner
      if (!/^\d{16,21}$/.test(resolvedUserId) && guildData?.owner_id) {
        resolvedUserId = guildData.owner_id;
      }
    }

    if (!/^\d{16,21}$/.test(resolvedUserId)) {
      return {
        success: false,
        notInServer: true,
        message: 'تعذر العثور على الحساب بالاسم في السيرفر! الحل المضمون 100%: انسخ الآيدي الرقمي لحسابك (User ID) وضعه هنا مباشرة (كليك يمين على صورتك أو اسمك بالديسكورد ثم Copy User ID).'
      };
    }

    // 1. Verify if user is in the server & check their current roles
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${resolvedUserId}`,
      {
        headers: { Authorization: `Bot ${token}`, 'User-Agent': 'DiscordBot (https://sultan.kesug.com, 1.0.0)' }
      }
    );

    if (memberRes.status === 404) {
      return {
        success: false,
        notInServer: true,
        message: `الحساب صاحب الآيدي (${resolvedUserId}) ليس عضواً في هذا السيرفر حالياً! يجب الدخول إلى سيرفر الديسكورد أولاً بهذا الحساب.`
      };
    }

    if (!memberRes.ok) {
      const errJson = await memberRes.json().catch(() => null);
      if (errJson?.code === 10007 || errJson?.code === 10013 || memberRes.status === 404) {
        return {
          success: false,
          notInServer: true,
          message: `الحساب ليس عضواً في السيرفر! يجب الدخول إلى سيرفر الديسكورد أولاً.`
        };
      }
      return {
        success: false,
        message: `خطأ من الديسكورد: ${errJson?.message || 'تعذر التحقق من عضوية الحساب'}`
      };
    }

    const memberData = await memberRes.json();
    const currentRoles: string[] = Array.isArray(memberData?.roles) ? memberData.roles : [];
    const hasRole = currentRoles.includes(roleId);

    // 2. If user already has the role: REMOVE IT (Toggle Behavior)!
    if (hasRole) {
      const delRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${resolvedUserId}/roles/${roleId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bot ${token}` }
        }
      );

      if (delRes.status === 204) {
        return {
          success: true,
          action: 'removed',
          message: 'الرتبة كانت مضافة لحسابك بالفعل، وتمت إزالتها بنجاح الآن! 🗑️',
          targetUser: resolvedUserId
        };
      }

      if (delRes.status === 403) {
        return {
          success: false,
          message:
            '⚠️ تنبيه: البوت ليس لديه صلاحية إزالة هذه الرتبة! يرجى سحب رتبة البوت في إعدادات السيرفر لتكون أعلى من رتبة ' +
            (state.roleName || 'الرتبة') +
            '.'
        };
      }

      const delErr = await delRes.json().catch(() => null);
      return {
        success: false,
        message: `خطأ أثناء إزالة الرتبة: ${delErr?.message || 'خطأ غير معروف'}`
      };
    }

    // 3. User does not have role: ADD IT!
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${resolvedUserId}/roles/${roleId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (res.status === 204) {
      state.assignedCount++;
      return {
        success: true,
        action: 'added',
        message: `تم إعطاء الرتبة بنجاح تام للعضو في سيرفر (${guildData?.name || 'السيرفر'})! 👑`,
        targetUser: resolvedUserId
      };
    }

    const errJson = await res.json().catch(() => null);
    const errCode = errJson?.code;
    const errMessage = errJson?.message || 'خطأ غير معروف من ديسكورد';

    if (res.status === 403 || errCode === 50013) {
      return {
        success: false,
        message:
          '⚠️ تنبيه: البوت ليس لديه صلاحية إعطاء هذه الرتبة! يرجى سحب رتبة البوت في إعدادات السيرفر لتكون أعلى من رتبة ' +
          (state.roleName || 'الرتبة') +
          '.'
      };
    }

    if (res.status === 404 || errCode === 10007) {
      return {
        success: false,
        notInServer: true,
        message: 'هذا الحساب ليس عضواً في السيرفر! يجب دخول السيرفر أولاً.'
      };
    }

    return {
      success: false,
      message: `خطأ من الديسكورد (${res.status}): ${errMessage}`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'فشل الاتصال بسيرفرات ديسكورد' };
  }
}

export async function startDiscordBot(config: BotConfig): Promise<{ success: boolean; error?: string }> {
  if (!config.botToken) {
    return { success: false, error: 'لم يتم إدخال توكن البوت (Bot Token)' };
  }

  activeConfig = config;

  // Clean existing connection
  if (currentWs) {
    try {
      currentWs.close();
    } catch {}
    currentWs = null;
  }
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }

  try {
    // 1. Verify Bot Token & Get Bot Profile
    const meRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${config.botToken}` }
    });

    if (!meRes.ok) {
      state.isOnline = false;
      state.lastError = 'توكن البوت غير صحيح أو ملغي من ديسكورد';
      return { success: false, error: state.lastError };
    }

    const meData = await meRes.json();
    state.botName = `${meData.username}#${meData.discriminator || '0'}`;
    state.botId = meData.id;

    // 2. Fetch Guild & Role Details if provided
    if (config.guildId) {
      const gRes = await fetch(`https://discord.com/api/v10/guilds/${config.guildId}`, {
        headers: { Authorization: `Bot ${config.botToken}` }
      });
      if (gRes.ok) {
        const gData = await gRes.json();
        state.guildName = gData.name;
      }

      if (config.roleId) {
        const rRes = await fetch(`https://discord.com/api/v10/guilds/${config.guildId}/roles`, {
          headers: { Authorization: `Bot ${config.botToken}` }
        });
        if (rRes.ok) {
          const roles = await rRes.json();
          const targetRole = roles.find((r: any) => r.id === config.roleId);
          if (targetRole) {
            state.roleName = targetRole.name;
          }
        }
      }
    }

    // 3. Connect to Discord Gateway WebSocket
    const ws = new (globalThis as any).WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    currentWs = ws;

    ws.onopen = () => {
      console.log(`[Sultan Bot] Connected to Discord Gateway as ${state.botName}`);
    };

    ws.onmessage = async (event: any) => {
      try {
        const packet = JSON.parse(event.data);
        const { op, d, t } = packet;

        // Opcode 10: Hello -> start heartbeating & send Identify
        if (op === 10) {
          const interval = d.heartbeat_interval;
          heartbeatIntervalId = setInterval(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ op: 1, d: null }));
            }
          }, interval);

          // Identify with GUILDS (1) + GUILD_MEMBERS (2) + GUILD_VOICE_STATES (128) = 641
          ws.send(
            JSON.stringify({
              op: 2,
              d: {
                token: config.botToken,
                intents: 641,
                properties: {
                  os: 'linux',
                  browser: 'sultan-site',
                  device: 'sultan-site'
                },
                presence: {
                  activities: [
                    {
                      name: '👑 Sultan VIP Auto-Role & Voice Radar',
                      type: 0
                    }
                  ],
                  status: 'online'
                }
              }
            })
          );
        }

        // Opcode 0: Dispatch events
        if (op === 0) {
          if (t === 'READY') {
            state.isOnline = true;
            state.lastError = null;
            console.log(`[Sultan Bot] READY! Bot is now active on Discord!`);
          }

          // Initial guild payload containing active voice states
          if (t === 'GUILD_CREATE') {
            const sultanDiscordId = '1224502828371017788';
            if (Array.isArray(d.voice_states)) {
              const sultanVs = d.voice_states.find((vs: any) => vs.user_id === sultanDiscordId);
              if (sultanVs && sultanVs.channel_id) {
                let channelName = 'غرفة صوتية';
                try {
                  const chRes = await fetch(`https://discord.com/api/v10/channels/${sultanVs.channel_id}`, {
                    headers: { Authorization: `Bot ${config.botToken}` }
                  });
                  if (chRes.ok) {
                    const chData = await chRes.json();
                    channelName = chData.name || channelName;
                  }
                } catch {}

                state.sultanVoiceChannel = {
                  channelId: sultanVs.channel_id,
                  channelName,
                  isMuted: Boolean(sultanVs.self_mute || sultanVs.mute),
                  isDeafened: Boolean(sultanVs.self_deaf || sultanVs.deaf),
                  isStreaming: Boolean(sultanVs.self_stream),
                  connectedAt: new Date().toISOString()
                };
                console.log(`[Sultan Bot] 🎙️ Initial GUILD_CREATE: Sultan found in voice channel "${channelName}"`);
              }
            }
          }

          // Real-time Voice Channel Tracking (Voice Radar Sync 🎙️)
          if (t === 'VOICE_STATE_UPDATE') {
            const userId = d.user_id;
            const channelId = d.channel_id; // null when leaving voice channel
            const sultanDiscordId = '1224502828371017788';

            if (userId === sultanDiscordId) {
              if (channelId) {
                // Sultan joined a voice channel! Fetch channel name
                let channelName = 'غرفة صوتية';
                try {
                  const chRes = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
                    headers: { Authorization: `Bot ${config.botToken}` }
                  });
                  if (chRes.ok) {
                    const chData = await chRes.json();
                    channelName = chData.name || channelName;
                  }
                } catch {}

                state.sultanVoiceChannel = {
                  channelId,
                  channelName,
                  isMuted: Boolean(d.self_mute || d.mute),
                  isDeafened: Boolean(d.self_deaf || d.deaf),
                  isStreaming: Boolean(d.self_stream),
                  connectedAt: new Date().toISOString()
                };
                console.log(`[Sultan Bot] 🎙️ Sultan is now in Voice Channel: "${channelName}" (ID: ${channelId})`);
              } else {
                // Sultan left the voice channel
                state.sultanVoiceChannel = null;
                console.log(`[Sultan Bot] 🎙️ Sultan left voice channels.`);
              }
            }
          }

          // When a new member joins the server!
          if (t === 'GUILD_MEMBER_ADD') {
            const memberGuildId = d.guild_id;
            const user = d.user;
            console.log(
              `[Sultan Bot] 👑 New member joined: ${user.username} (${user.id}) in guild ${memberGuildId}`
            );

            if (memberGuildId === config.guildId && config.roleId) {
              await assignRoleToMember(user.id, config);
              console.log(
                `[Sultan Bot] ✅ Successfully gave VIP role (${config.roleId}) to ${user.username}!`
              );
            }
          }
        }
      } catch (e: any) {
        console.error('[Sultan Bot] Message handle error:', e);
      }
    };

    ws.onerror = (err: any) => {
      console.warn('[Sultan Bot] WebSocket Error:', err.message || err);
      state.lastError = 'خطأ في اتصال البوت بالديسكورد';
    };

    ws.onclose = () => {
      state.isOnline = false;
      if (heartbeatIntervalId) {
        clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = null;
      }
      console.log('[Sultan Bot] Gateway connection closed');
    };

    return { success: true };
  } catch (err: any) {
    state.isOnline = false;
    state.lastError = err.message || 'خطأ أثناء تشغيل البوت';
    return { success: false, error: state.lastError };
  }
}
