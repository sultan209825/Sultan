// Discord Bot Gateway Service for Sultan's Personal Discord Bot
// Connects to Discord Gateway and gives VIP role automatically when any member joins!

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
}

const state: BotState = {
  isOnline: false,
  botName: null,
  botId: null,
  guildName: null,
  roleName: null,
  lastError: null,
  assignedCount: 0
};

let currentWs: any = null;
let heartbeatIntervalId: any = null;
let activeConfig: BotConfig | null = null;

export function getBotState() {
  return { ...state };
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

          // Identify with GUILDS (1) + GUILD_MEMBERS (2) intents = 513
          ws.send(
            JSON.stringify({
              op: 2,
              d: {
                token: config.botToken,
                intents: 513,
                properties: {
                  os: 'linux',
                  browser: 'sultan-site',
                  device: 'sultan-site'
                },
                presence: {
                  activities: [
                    {
                      name: '👑 Sultan VIP Auto-Role',
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
