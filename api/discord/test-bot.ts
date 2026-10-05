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
    const { botToken, guildId, roleId } = body;

    if (!botToken) {
      return res.status(400).json({ error: 'يرجى كتابة Bot Token أولاً' });
    }

    // 1. Verify Bot Token
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bot ${botToken}`,
        'User-Agent': 'DiscordBot (https://sultansusu.vercel.app, 1.0.0)'
      }
    });

    if (!userRes.ok) {
      return res.status(400).json({ error: 'توكن البوت غير صحيح أو تم إلغاؤه (Invalid Bot Token)' });
    }

    const botUser = await userRes.json();
    let guildInfo: any = null;
    let roleInfo: any = null;

    if (guildId) {
      const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers: {
          Authorization: `Bot ${botToken}`,
          'User-Agent': 'DiscordBot (https://sultansusu.vercel.app, 1.0.0)'
        }
      });
      if (guildRes.ok) {
        guildInfo = await guildRes.json();
      }

      if (roleId) {
        const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
          headers: {
            Authorization: `Bot ${botToken}`,
            'User-Agent': 'DiscordBot (https://sultansusu.vercel.app, 1.0.0)'
          }
        });
        if (rolesRes.ok) {
          const roles = await rolesRes.json();
          roleInfo = roles.find((r: any) => r.id === roleId);
        }
      }
    }

    return res.status(200).json({
      success: true,
      state: {
        connected: true,
        botName: `${botUser.username}#${botUser.discriminator || '0'}`,
        botId: botUser.id,
        guildName: guildInfo?.name || null,
        roleName: roleInfo?.name || null,
        isInGuild: !!guildInfo
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
