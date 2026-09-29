/**
 * Helper to dispatch visitor entry alerts directly to Discord Webhook
 */

export interface VisitorInfo {
  name: string;
  country: string;
  flag: string;
  device: string;
  os?: string;
  browser?: string;
  page?: string;
}

export async function sendVisitorNotificationToDiscord(
  webhookUrl: string,
  visitor: VisitorInfo,
  viewCount: number
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const payload = {
    username: '👑 سلطان | تنبيهات الزوار',
    avatar_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp',
    embeds: [
      {
        title: '🔔 زائر جديد دخل موقعك الآن!',
        description: `قام زائر بالدخول إلى موقع **سلطان** الشخصي (${visitor.flag} **${visitor.country}**).`,
        color: 0xef4444, // Ruby Red
        fields: [
          {
            name: '👤 هوية الزائر (تقديرية)',
            value: visitor.name || 'زائر مجهول',
            inline: true
          },
          {
            name: '🌍 الدولة والمدينة',
            value: `${visitor.flag} ${visitor.country}`,
            inline: true
          },
          {
            name: '📱 نوع الجهاز والمتصفح',
            value: `${visitor.device} (${visitor.browser || 'المتصفح'})`,
            inline: true
          },
          {
            name: '👁️ إجمالي مشاهدات الموقع',
            value: `**${viewCount.toLocaleString()}** زيارة`,
            inline: true
          },
          {
            name: '⏱️ التوقيت',
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: true
          },
          {
            name: '🔗 رابط الموقع',
            value: '[sultan.kesug.com](https://sultan.kesug.com)',
            inline: true
          }
        ],
        footer: {
          text: 'نظام مراقبة وتنبيهات موقع السلطان الملكي 👑',
          icon_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to send discord webhook notification', err);
    return false;
  }
}
