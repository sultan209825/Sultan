export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { botToken, guildId, roleId, userId } = body;

    if (!botToken || !guildId || !roleId || !userId) {
      return res.status(400).json({ success: false, message: 'بيانات السيرفر أو الرتبة أو المستخدم ناقصة' });
    }

    let targetUserId = String(userId).replace(/^@/, '').trim();

    // If identifier is not numeric Snowflake ID, search member
    if (!/^\d{16,21}$/.test(targetUserId)) {
      const searchRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/search?query=${encodeURIComponent(targetUserId)}&limit=10`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
            'User-Agent': 'DiscordBot (https://sultan.vercel.app, 1.0.0)'
          }
        }
      );
      if (searchRes.ok) {
        const members = await searchRes.json();
        if (Array.isArray(members) && members.length > 0) {
          const found = members.find((m: any) => {
            const u = (m.user?.username || '').toLowerCase();
            const g = (m.user?.global_name || '').toLowerCase();
            const nick = (m.nick || '').toLowerCase();
            const q = targetUserId.toLowerCase();
            return u === q || g === q || nick === q || u.includes(q);
          });
          targetUserId = (found || members[0]).user?.id || targetUserId;
        }
      }
    }

    if (!/^\d{16,21}$/.test(targetUserId)) {
      return res.status(404).json({
        success: false,
        notInServer: true,
        message: 'تعذر العثور على الحساب بالاسم! يرجى إدخال الآيدي الرقمي (User ID) المكون من 18-19 رقماً.'
      });
    }

    // Verify member exists in guild
    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${targetUserId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        'User-Agent': 'DiscordBot (https://sultan.vercel.app, 1.0.0)'
      }
    });

    if (memberRes.status === 404) {
      return res.status(404).json({
        success: false,
        notInServer: true,
        message: `الحساب صاحب الآيدي (${targetUserId}) ليس عضواً في هذا السيرفر حالياً! يجب دخول السيرفر أولاً.`
      });
    }

    const memberData = await memberRes.json();
    const currentRoles: string[] = Array.isArray(memberData?.roles) ? memberData.roles : [];
    const hasRole = currentRoles.includes(roleId);

    // Toggle Role: If already has role -> Remove it
    if (hasRole) {
      const delRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${targetUserId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${botToken}`,
          'User-Agent': 'DiscordBot (https://sultan.vercel.app, 1.0.0)'
        }
      });

      if (delRes.status === 204) {
        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'الرتبة كانت مضافة لحسابك بالفعل، وتمت إزالتها بنجاح الآن! 🗑️'
        });
      } else if (delRes.status === 403) {
        return res.status(403).json({
          success: false,
          message: 'صلاحيات البوت غير كافية! ارفع رتبة البوت في إعدادات السيرفر (Roles) لتكون أعلى من رتبة الـ VIP.'
        });
      }
    }

    // Add Role
    const addRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${targetUserId}/roles/${roleId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
        'User-Agent': 'DiscordBot (https://sultan.vercel.app, 1.0.0)'
      }
    });

    if (addRes.status === 204) {
      return res.status(200).json({
        success: true,
        action: 'added',
        message: 'تم منح وإضافة رتبة VIP بنجاح تام لحسابك في السيرفر! 👑'
      });
    } else if (addRes.status === 403) {
      return res.status(403).json({
        success: false,
        message: 'صلاحيات البوت غير كافية! ارفع رتبة البوت في إعدادات السيرفر (Roles) لتكون أعلى من رتبة الـ VIP.'
      });
    } else {
      const errJson = await addRes.json().catch(() => ({}));
      return res.status(addRes.status).json({
        success: false,
        message: `خطأ من الديسكورد: ${errJson.message || addRes.statusText}`
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
}
