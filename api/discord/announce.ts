export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { webhookUrl, embed, content } = body;

    const targetUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL || '';
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'رابط ويب هوك الديسكورد غير متوفر' });
    }

    const discordPayload: any = {};
    if (content) discordPayload.content = content;
    if (embed) discordPayload.embeds = [embed];

    const discordRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (discordRes.ok || discordRes.status === 204) {
      return res.status(200).json({ success: true, message: 'تم إرسال الإشعار للديسكورد بنجاح' });
    } else {
      const errText = await discordRes.text();
      return res.status(discordRes.status).json({ success: false, message: errText });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
}
