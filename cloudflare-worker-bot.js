// =========================================================================
// 👑 Sultan Discord VIP Bot - Cloudflare Worker (Free Serverless Proxy)
// =========================================================================
// هذا السكربت المجاني 100% يحل مشكلة حظر استضافة InfinityFree لاتصال الديسكورد
// خطوات التشغيل في دقيقة واحدة:
// 1. افتح https://dash.cloudflare.com وسجل حساب مجاني.
// 2. اذهب إلى Workers & Pages ➔ اضغط Create Application ➔ Create Worker.
// 3. اضغط Deploy ثم Quick Edit (تعديل سريع).
// 4. احذف الكود القديم والصق هذا الكود كاملاً ثم اضغط Save and Deploy.
// 5. انسخ الرابط الذي يظهر لك (مثل https://sultan-bot.subdomain.workers.dev)
// 6. ضعه في لوحة تحكم موقعك (/admin) في خانة: رابط البروكسي السحابي!
// =========================================================================

export default {
  async fetch(request) {
    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const corsHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
      let data = {};
      try {
        data = await request.json();
      } catch (e) {
        data = {};
      }

      const action = data.action || '';
      const botToken = (data.botToken || '').trim();
      const guildId = (data.guildId || '').trim();
      const roleId = (data.roleId || '').trim();
      const userId = (data.userId || '').trim();

      if (!botToken) {
        return new Response(JSON.stringify({ success: false, message: 'يرجى إرسال Bot Token' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Helper function for Discord API
      const discordFetch = async (endpoint, method = 'GET', body = null) => {
        const opts = {
          method,
          headers: {
            'Authorization': `Bot ${botToken}`,
            'User-Agent': 'DiscordBot (https://sultan.kesug.com, 1.0.0)',
            'Content-Type': 'application/json'
          }
        };
        if (body) opts.body = JSON.stringify(body);
        return fetch(`https://discord.com/api/v10${endpoint}`, opts);
      };

      // -------------------------------------------------------------
      // ACTION 1: Test Bot Connection
      // -------------------------------------------------------------
      if (action === 'test' || (!userId && botToken)) {
        const userRes = await discordFetch('/users/@me');
        if (!userRes.ok) {
          return new Response(JSON.stringify({
            success: false,
            message: 'توكن البوت غير صحيح أو تم إلغاؤه (Invalid Bot Token)'
          }), { status: 400, headers: corsHeaders });
        }

        const botUser = await userRes.json();
        let guildInfo = null;
        let roleInfo = null;
        let botInGuild = false;

        if (guildId) {
          const gRes = await discordFetch(`/guilds/${guildId}`);
          if (gRes.ok) {
            guildInfo = await gRes.json();
            botInGuild = true;
          }

          if (roleId) {
            const rRes = await discordFetch(`/guilds/${guildId}/roles`);
            if (rRes.ok) {
              const roles = await rRes.json();
              roleInfo = roles.find(r => r.id === roleId);
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          state: {
            connected: true,
            botName: `${botUser.username}#${botUser.discriminator || '0'}`,
            botId: botUser.id,
            guildName: guildInfo ? guildInfo.name : null,
            roleName: roleInfo ? roleInfo.name : null,
            isInGuild: botInGuild
          }
        }), { status: 200, headers: corsHeaders });
      }

      // -------------------------------------------------------------
      // ACTION 2: Assign / Toggle Role to Member
      // -------------------------------------------------------------
      if (!userId || !guildId || !roleId) {
        return new Response(JSON.stringify({
          success: false,
          message: 'بيانات السيرفر أو الرتبة أو المستخدم ناقصة'
        }), { status: 400, headers: corsHeaders });
      }

      let resolvedUserId = userId.replace(/^@/, '').trim();

      // If user provided username/display name instead of numeric ID: search for member
      if (!/^\d{16,21}$/.test(resolvedUserId)) {
        const searchRes = await discordFetch(`/guilds/${guildId}/members/search?query=${encodeURIComponent(resolvedUserId)}&limit=10`);
        if (searchRes.ok) {
          const members = await searchRes.json();
          if (Array.isArray(members) && members.length > 0) {
            const found = members.find(m => {
              const u = (m.user?.username || '').toLowerCase();
              const g = (m.user?.global_name || '').toLowerCase();
              const nick = (m.nick || '').toLowerCase();
              const q = resolvedUserId.toLowerCase();
              return u === q || g === q || nick === q || u.includes(q);
            });
            resolvedUserId = (found || members[0]).user?.id || resolvedUserId;
          }
        }
      }

      if (!/^\d{16,21}$/.test(resolvedUserId)) {
        return new Response(JSON.stringify({
          success: false,
          notInServer: true,
          message: 'تعذر العثور على الحساب بالاسم! يرجى إدخال الآيدي الرقمي (User ID) المكون من 18-19 رقماً.'
        }), { status: 404, headers: corsHeaders });
      }

      // Fetch member to verify and check current roles
      const memberRes = await discordFetch(`/guilds/${guildId}/members/${resolvedUserId}`);
      if (memberRes.status === 404) {
        return new Response(JSON.stringify({
          success: false,
          notInServer: true,
          message: `الحساب صاحب الآيدي (${resolvedUserId}) ليس عضواً في هذا السيرفر حالياً! يجب دخول السيرفر أولاً.`
        }), { status: 404, headers: corsHeaders });
      }

      const memberData = await memberRes.json();
      const currentRoles = Array.isArray(memberData?.roles) ? memberData.roles : [];
      const hasRole = currentRoles.includes(roleId);

      // If role already exists -> REMOVE IT (Toggle)
      if (hasRole) {
        const delRes = await discordFetch(`/guilds/${guildId}/members/${resolvedUserId}/roles/${roleId}`, 'DELETE');
        if (delRes.status === 204) {
          return new Response(JSON.stringify({
            success: true,
            action: 'removed',
            message: 'الرتبة كانت مضافة لحسابك بالفعل، وتمت إزالتها بنجاح الآن! 🗑️'
          }), { status: 200, headers: corsHeaders });
        } else if (delRes.status === 403) {
          return new Response(JSON.stringify({
            success: false,
            message: 'صلاحيات البوت غير كافية! ارفع رتبة البوت في إعدادات السيرفر (Roles) لتكون أعلى من رتبة الـ VIP.'
          }), { status: 403, headers: corsHeaders });
        }
      }

      // Role doesn't exist -> ADD IT
      const addRes = await discordFetch(`/guilds/${guildId}/members/${resolvedUserId}/roles/${roleId}`, 'PUT');
      if (addRes.status === 204) {
        return new Response(JSON.stringify({
          success: true,
          action: 'added',
          message: 'تم منح وإضافة رتبة VIP بنجاح تام لحسابك في السيرفر! 👑'
        }), { status: 200, headers: corsHeaders });
      } else if (addRes.status === 403) {
        return new Response(JSON.stringify({
          success: false,
          message: 'صلاحيات البوت غير كافية! ارفع رتبة البوت في إعدادات السيرفر (Roles) لتكون أعلى من رتبة الـ VIP.'
        }), { status: 403, headers: corsHeaders });
      } else {
        const errJson = await addRes.json().catch(() => ({}));
        return new Response(JSON.stringify({
          success: false,
          message: `خطأ من الديسكورد: ${errJson.message || addRes.statusText}`
        }), { status: addRes.status, headers: corsHeaders });
      }
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        message: `خطأ في سيرفر البروكسي: ${err.message}`
      }), { status: 500, headers: corsHeaders });
    }
  }
};
