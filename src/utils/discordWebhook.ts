/**
 * Comprehensive Discord Webhook Notification System for Sultan's Website
 * Dispatches rich embeds for EVERY site event (visits, secrets, music, votes, downloads, admin actions).
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

export type SiteEventType =
  | 'visitor_entry'
  | 'secret_sultan'
  | 'secret_game'
  | 'game_score'
  | 'song_play'
  | 'site_rate'
  | 'share_click'
  | 'download_zip'
  | 'admin_login'
  | 'config_saved'
  | 'stats_reset'
  | 'logs_cleared';

/**
 * Retrieve the active Discord Webhook URL from localStorage configuration
 */
export function getStoredDiscordWebhookUrl(): string | null {
  try {
    const raw = localStorage.getItem('sultan_site_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.discordWebhookUrl && parsed.discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        return parsed.discordWebhookUrl.trim();
      }
    }
  } catch {}
  return null;
}

/**
 * Send visitor entry notification with rich details
 */
export async function sendVisitorNotificationToDiscord(
  webhookUrl: string,
  visitor: VisitorInfo,
  viewCount?: number
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const payload = {
    username: '👑 سلطان | تنبيهات الموقع',
    avatar_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp',
    embeds: [
      {
        title: '🔔 زائر جديد دخل موقعك الآن!',
        description: `قام زائر بالدخول إلى موقع **سلطان** الرسمي (${visitor.flag} **${visitor.country}**).`,
        color: 0xef4444, // Ruby Red
        fields: [
          {
            name: '👤 هوية الزائر',
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
            value: `${visitor.device} (${visitor.browser || 'متصفح'})`,
            inline: true
          },
          ...(viewCount !== undefined
            ? [
                {
                  name: '👁️ إجمالي المشاهدات',
                  value: `**${viewCount.toLocaleString()}** زيارة`,
                  inline: true
                }
              ]
            : []),
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to send discord webhook notification', err);
    return false;
  }
}

/**
 * Universal dispatcher for ANY event that happens on the website
 */
export async function sendSiteEventToDiscord(
  eventType: SiteEventType,
  data?: Record<string, any>,
  customWebhookUrl?: string
): Promise<boolean> {
  const webhookUrl = customWebhookUrl || getStoredDiscordWebhookUrl();
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  let title = '📢 حدث جديد في موقع السلطان';
  let description = 'تم تسجيل نشاط جديد في الموقع.';
  let color = 0x6366f1; // Indigo default
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  switch (eventType) {
    case 'secret_sultan':
      title = '👑 اكتشاف سر ملكي (كلمة سلطان)!';
      description = 'قام أحد الزوار بكتابة كلمة **"sultan"** أو النقر على التاج الملكي وتفعيل المؤثرات الملكية!';
      color = 0xf59e0b; // Gold
      fields.push(
        { name: '🔥 الميزة المفعلة', value: 'احتفال شلال الكونفيتي وموسيقى الفانفار الملكية', inline: true },
        { name: '📊 إجمالي المرات', value: `${data?.count || 1} مرة`, inline: true }
      );
      break;

    case 'secret_game':
      title = '🎮 تشغيل لعبة الركض السرية (Runner Game)!';
      description = 'قام زائر بفتح وتجربة لعبة ركض السلطان وتخطي العقبات!';
      color = 0x8b5cf6; // Purple
      fields.push(
        { name: '🕹️ النشاط', value: 'بدء جولة في لعبة القفز والركض', inline: true }
      );
      break;

    case 'game_score':
      title = '🏆 سكور جديد في لعبة الركض!';
      description = `أنهى أحد اللاعبين جولة في لعبة الركض محققاً سكور **${data?.score || 0}** نقطة!`;
      color = 0xec4899; // Pink
      fields.push(
        { name: '🎯 النقاط المحققة', value: `**${data?.score || 0}** نقطة`, inline: true },
        { name: '👑 صاحب الساحة', value: 'سلطان 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪', inline: true }
      );
      break;

    case 'song_play':
      title = '🎵 تشغيل أغنية في المشغل الصوتي!';
      description = `بدأ الزائر بالاستماع إلى أغنية: **${data?.title || 'أغنية السلطان'}**.`;
      color = 0xef4444; // Red
      fields.push(
        { name: '🎶 الأغنية', value: data?.title || 'غير محدد', inline: true },
        { name: '🎸 التصنيف', value: data?.genre || 'موسيقى حصرية', inline: true },
        { name: '📈 مرات الاستماع', value: `${data?.plays || 1} استماع`, inline: true }
      );
      break;

    case 'site_rate':
      title = data?.isPositive ? '👍 إعجاب جديد بالموقع (Positive Rating)!' : '💡 تقييم وملاحظة جديدة من زائر!';
      description = data?.isPositive
        ? 'قام زائر بالضغط على زر الإعجاب والتعبير عن إعجابه الشديد بالموقع 👑'
        : 'قام زائر بترك تقييم وملاحظة تحسينية للموقع.';
      color = data?.isPositive ? 0x10b981 : 0xf97316; // Emerald or Orange
      fields.push(
        { name: '⭐ نوع التقييم', value: data?.isPositive ? 'إعجاب ملكي 👍' : 'ملاحظة تطويرية 💡', inline: true },
        { name: '📊 إجمالي الإعجابات', value: `**${data?.totalUpvotes || 1}** 👍`, inline: true }
      );
      break;

    case 'share_click':
      title = '🔗 مشاركة رابط الموقع (Share Link)!';
      description = 'قام زائر بنسخ رابط موقع السلطان ومشاركته مع أصدقائه!';
      color = 0x06b6d4; // Cyan
      fields.push(
        { name: '🌐 الرابط المنسوخ', value: '[sultan.kesug.com](https://sultan.kesug.com)', inline: true }
      );
      break;

    case 'download_zip':
      title = '📦 تحميل ملف الـ ZIP للمشروع (Full Source Code)!';
      description = 'قام شخص بتحميل حزمة ملفات الموقع والمصدر بالكامل برابط مباشر!';
      color = 0x3b82f6; // Blue
      fields.push(
        { name: '📁 الملف المحمل', value: '`sultan-exact-studio-app.zip`', inline: true }
      );
      break;

    case 'admin_login':
      title = '🛡️ تسجيل دخول إلى لوحة تحكم السلطان (Admin Login)!';
      description = 'تم تسجيل دخول ناجح إلى لوحة التحكم والإحصائيات الخاصة بالمشرف.';
      color = 0x10b981; // Green
      fields.push(
        { name: '🔑 المشرف', value: 'سلطان (Admin)', inline: true },
        { name: '📍 القسم', value: 'لوحة التحكم والإعدادات', inline: true }
      );
      break;

    case 'config_saved':
      title = '💾 حفظ وتحديث إعدادات الموقع!';
      description = 'قام المشرف بحفظ وتحديث إعدادات وبيانات الموقع من لوحة التحكم بنجاح.';
      color = 0x059669; // Dark Green
      fields.push(
        { name: '👑 الاسم المستعار', value: data?.username || '! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪', inline: true },
        { name: '🎨 الثيم المختار', value: data?.theme || 'الملكي', inline: true },
        { name: '📝 النبذة (Bio)', value: data?.bio ? `${data.bio.slice(0, 40)}...` : 'تم التحديث', inline: false }
      );
      break;

    case 'stats_reset':
      title = '⚠️ تصفير شامل لجميع إحصائيات الموقع (Master Reset)!';
      description = 'تم إجراء عملية تصفير كاملة لكل الإحصائيات (الزيارات، الإعجابات، الأسرار، السجلات) من لوحة التحكم.';
      color = 0xdc2626; // Dark Red
      fields.push(
        { name: '🔄 الحالة', value: 'تم تصفير كل شيء إلى الصفر (0)', inline: true },
        { name: '👮 المنفذ', value: 'المشرف سلطان', inline: true }
      );
      break;

    case 'logs_cleared':
      title = '🗑️ مسح سجل الزيارات المباشرة (Logs Cleared)!';
      description = 'تم مسح كامل سجل زيارات الزوار المخزنة من لوحة التحكم.';
      color = 0x991b1b;
      fields.push(
        { name: '📋 السجل', value: 'تم تفريغ جدول الزيارات', inline: true }
      );
      break;

    default:
      break;
  }

  fields.push(
    { name: '⏱️ التوقيت', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
    { name: '🔗 رابط الموقع', value: '[sultan.kesug.com](https://sultan.kesug.com)', inline: true }
  );

  const payload = {
    username: '👑 سلطان | تنبيهات الموقع الفورية',
    avatar_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp',
    embeds: [
      {
        title,
        description,
        color,
        fields,
        footer: {
          text: 'نظام الرقابة والتنبيهات المباشر لموقع السلطان 👑',
          icon_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error(`Failed to send event [${eventType}] to Discord webhook`, err);
    return false;
  }
}

/**
 * Extract comprehensive client device and browser environment info
 */
export interface ClientEnvironmentDetails {
  deviceType: string;
  os: string;
  browser: string;
  screenResolution: string;
  language: string;
  pageUrl: string;
}

export function getClientEnvironmentDetails(): ClientEnvironmentDetails {
  if (typeof window === 'undefined') {
    return {
      deviceType: '💻 جهاز غير محدد',
      os: 'نظام غير معروف',
      browser: 'متصفح الويب',
      screenResolution: 'غير متوفر',
      language: 'ar',
      pageUrl: 'https://sultan.kesug.com'
    };
  }

  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  let deviceType = '💻 كمبيوتر / مكتبي';
  if (isIOS) deviceType = '📱 هاتف آيفون (Apple iOS)';
  else if (isAndroid) deviceType = '📱 هاتف أندرويد (Android)';
  else if (isMobile) deviceType = '📱 هاتف ذكي (Mobile)';

  let os = 'نظام غير معروف';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS Apple';
  else if (/Android/i.test(ua)) os = 'Android OS';
  else if (/iPhone|iPad/i.test(ua)) os = 'Apple iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'متصفح ويب';
  if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  return {
    deviceType,
    os,
    browser,
    screenResolution: `${window.innerWidth}x${window.innerHeight} px`,
    language: navigator.language || 'ar',
    pageUrl: window.location.href
  };
}

/**
 * Options for sending real-time interaction alerts to Discord
 */
export interface InteractionAlertOptions {
  action: string;
  category?: 'button_click' | 'game' | 'settings' | 'music' | 'easter_egg' | 'navigation' | 'general';
  description?: string;
  details?: Record<string, string | number | boolean>;
  level?: 'info' | 'royal' | 'warning' | 'success';
  webhookUrl?: string;
}

/**
 * Specialized utility to dispatch real-time alerts for any interaction
 * (e.g. button clicks, opening games, changing settings, music playback)
 * with integrated device and browser environment information.
 */
export async function sendInteractionAlertToDiscord(options: InteractionAlertOptions): Promise<boolean> {
  const webhookUrl = options.webhookUrl || getStoredDiscordWebhookUrl();
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const env = getClientEnvironmentDetails();

  let color = 0x6366f1; // Indigo
  let icon = '⚡';

  if (options.level === 'royal' || options.category === 'easter_egg') {
    color = 0xf59e0b; // Gold
    icon = '👑';
  } else if (options.category === 'game') {
    color = 0x8b5cf6; // Purple
    icon = '🎮';
  } else if (options.category === 'music') {
    color = 0xef4444; // Red
    icon = '🎵';
  } else if (options.category === 'settings') {
    color = 0x10b981; // Emerald
    icon = '⚙️';
  } else if (options.level === 'warning') {
    color = 0xdc2626; // Dark Red
    icon = '⚠️';
  } else if (options.category === 'button_click') {
    color = 0x06b6d4; // Cyan
    icon = '🔘';
  }

  const categoryTitles: Record<string, string> = {
    button_click: 'تفاعل وضغط زر تفاعلي',
    game: 'نشاط في لعبة الركض',
    settings: 'تعديل وتحديث إعدادات الموقع',
    music: 'تفاعل مع مشغل الموسيقى',
    easter_egg: 'اكتشاف سر ملكي',
    navigation: 'تنقل وتغيير صفحة',
    general: 'نشاط لحظي في الموقع'
  };

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: '🎯 نوع الإجراء (Action)',
      value: `**${options.action}**`,
      inline: true
    },
    {
      name: '🏷️ التصنيف',
      value: categoryTitles[options.category || 'general'] || 'نشاط تفاعلي',
      inline: true
    },
    {
      name: '📱 تفاصيل الجهاز',
      value: `${env.deviceType}\n*(النظام: ${env.os})*`,
      inline: true
    },
    {
      name: '🌐 المتصفح ودقة الشاشة',
      value: `${env.browser}\n*(الشاشة: ${env.screenResolution})*`,
      inline: true
    }
  ];

  if (options.details && Object.keys(options.details).length > 0) {
    const detailLines = Object.entries(options.details)
      .map(([k, v]) => `• **${k}**: ${v}`)
      .join('\n');
    fields.push({
      name: '📝 بيانات ومعطيات التفاعل',
      value: detailLines,
      inline: false
    });
  }

  fields.push(
    {
      name: '⏱️ التوقيت اللحظي',
      value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
      inline: true
    },
    {
      name: '🔗 رابط الموقع',
      value: '[sultan.kesug.com](https://sultan.kesug.com)',
      inline: true
    }
  );

  const payload = {
    username: '👑 سلطان | رصد التفاعلات اللحظية',
    avatar_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp',
    embeds: [
      {
        title: `${icon} تفاعل لحظي: ${options.action}`,
        description:
          options.description ||
          `قام زائر بإجراء تفاعل مباشر في موقع سلطان (${env.deviceType} - ${env.browser}).`,
        color,
        fields,
        footer: {
          text: 'نظام رصد التفاعلات الفوري لموقع السلطان 👑',
          icon_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to dispatch interaction alert to Discord', err);
    return false;
  }
}

/**
 * Data schema for comprehensive analytics summaries
 */
export interface AnalyticsSummaryData {
  totalViews: number;
  totalUpvotes: number;
  topCountries?: Array<{ country: string; flag?: string; visits: number; percent: number }>;
  trafficSources?: Array<{ name: string; visits: number; percent: number }>;
  topSecrets?: { sultan: number; game: number };
  topSongs?: Array<{ name: string; plays: number }>;
  triggerReason?: 'periodic' | 'manual' | 'top_country_update' | 'secret_milestone' | 'auto_sync';
}

/**
 * Dispatches a rich, comprehensive periodic or event-triggered analytics report to Discord
 * covering top countries, traffic sources, top secrets, most played songs, and view counts.
 */
export async function sendPeriodicAnalyticsSummaryToDiscord(
  summary: AnalyticsSummaryData,
  customWebhookUrl?: string
): Promise<boolean> {
  const webhookUrl = customWebhookUrl || getStoredDiscordWebhookUrl();
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const env = getClientEnvironmentDetails();

  let reasonTitle = '📊 تقرير وملخص إحصائيات الموقع الشامل 👑';
  if (summary.triggerReason === 'top_country_update') {
    reasonTitle = '🌍 تحديث صدارة أعلى الدول زيارة للموقع!';
  } else if (summary.triggerReason === 'secret_milestone') {
    reasonTitle = '👑 تحديث أرقام وتفاعل أسرار السلطان الملكية!';
  } else if (summary.triggerReason === 'periodic') {
    reasonTitle = '⏱️ التقرير الإحصائي الدوري لموقع السلطان';
  } else if (summary.triggerReason === 'manual') {
    reasonTitle = '📤 تقرير إحصائي مباشر ومحدث من لوحة التحكم';
  }

  // Format Top Countries string
  let countriesText = 'لا توجد زيارات دول مسجلة بعد';
  if (summary.topCountries && summary.topCountries.length > 0) {
    countriesText = summary.topCountries
      .slice(0, 5)
      .map((c, i) => `${i + 1}. ${c.flag ? c.flag + ' ' : ''}**${c.country}**: \`${c.visits} زيارة\` (${c.percent}%)`)
      .join('\n');
  }

  // Format Traffic Sources string
  let sourcesText = 'لا توجد مصادر مصنفة بعد';
  if (summary.trafficSources && summary.trafficSources.length > 0) {
    sourcesText = summary.trafficSources
      .map((s) => `• **${s.name}**: \`${s.visits} زيارة\` (${s.percent}%)`)
      .join('\n');
  }

  // Format Top Secrets string
  const sultanSecrets = summary.topSecrets?.sultan ?? 0;
  const gameSecrets = summary.topSecrets?.game ?? 0;
  const totalSecrets = sultanSecrets + gameSecrets;
  const secretsText = totalSecrets > 0
    ? `👑 **كلمة سلطان**: \`${sultanSecrets} مرة\`\n🎮 **لعبة الركض**: \`${gameSecrets} مرة\`\n✨ **الإجمالي**: \`${totalSecrets} سر مكتشف\``
    : 'لم يتم كشف أي أسرار بعد (0)';

  // Format Top Songs string
  let songsText = 'لا توجد استماعات مسجلة بعد';
  if (summary.topSongs && summary.topSongs.length > 0) {
    songsText = summary.topSongs
      .slice(0, 3)
      .map((s, i) => `${i + 1}. **${s.name}**: \`${s.plays} استماع\``)
      .join('\n');
  }

  const fields = [
    {
      name: '👁️ إجمالي الزيارات',
      value: `**${summary.totalViews.toLocaleString()}** زيارة`,
      inline: true
    },
    {
      name: '👍 إعجابات الزوار',
      value: `**${summary.totalUpvotes.toLocaleString()}** 👍`,
      inline: true
    },
    {
      name: '👑 تفاعل الأسرار',
      value: `**${totalSecrets}** سر مكتشف`,
      inline: true
    },
    {
      name: '🌍 أعلى الدول زيارة للموقع',
      value: countriesText,
      inline: false
    },
    {
      name: '🔗 مصادر الزيارات والتفاعل',
      value: sourcesText,
      inline: false
    },
    {
      name: '✨ أكثر الأسرار تفاعلاً',
      value: secretsText,
      inline: true
    },
    {
      name: '🎵 أكثر الأغاني استماعاً',
      value: songsText,
      inline: true
    },
    {
      name: '📱 بيئة الفحص والتحديث',
      value: `${env.deviceType} | ${env.browser}`,
      inline: false
    },
    {
      name: '⏱️ وقت التقرير',
      value: `<t:${Math.floor(Date.now() / 1000)}:F> (<t:${Math.floor(Date.now() / 1000)}:R>)`,
      inline: true
    },
    {
      name: '🔗 لوحة التحكم',
      value: '[دخول اللوحة](https://sultan.kesug.com/#admin)',
      inline: true
    }
  ];

  const payload = {
    username: '👑 سلطان | التقرير الإحصائي الشامل',
    avatar_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp',
    embeds: [
      {
        title: reasonTitle,
        description: 'تقرير شامل ومحدث يوضح حركة المرور وأعلى الدول وتفاعل الأسرار في موقع **سلطان** الرسمي.',
        color: 0xef4444, // Royal Ruby Red
        fields,
        footer: {
          text: 'نظام التقارير الذكية الدوري لموقع السلطان 👑',
          icon_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to send periodic analytics summary to Discord', err);
    return false;
  }
}

/**
 * Checks if the 12:00 AM midnight daily report needs to be dispatched,
 * compiles the full stats from localStorage, and sends the report to Discord.
 */
export async function checkAndSendMidnightDailyReport(forceSend = false): Promise<boolean> {
  const webhookUrl = getStoredDiscordWebhookUrl();
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const lastReportDate = localStorage.getItem('sultan_last_daily_report_date');

  // If not forcing, only send once per calendar day at/after 12:00 AM
  if (!forceSend && lastReportDate === todayStr) {
    return false;
  }

  // 1. Gather Views
  let views = 0;
  const savedViews = localStorage.getItem('sultan_site_views');
  if (savedViews !== null) views = parseInt(savedViews, 10) || 0;

  // 2. Gather Upvotes
  let upvotes = 0;
  const savedUpvotes = localStorage.getItem('sultan_site_upvotes');
  if (savedUpvotes !== null) upvotes = parseInt(savedUpvotes, 10) || 0;

  // 3. Gather Secrets
  let eggStats = { sultan: 0, game: 0 };
  const savedEggs = localStorage.getItem('sultan_egg_triggers');
  if (savedEggs) {
    try {
      const parsed = JSON.parse(savedEggs);
      eggStats = { sultan: parsed.sultan || 0, game: parsed.game || 0 };
    } catch {}
  }

  // 4. Gather Logs & Country Breakdown
  let logs: any[] = [];
  const savedLogs = localStorage.getItem('sultan_site_logs');
  if (savedLogs) {
    try {
      const parsed = JSON.parse(savedLogs);
      if (Array.isArray(parsed)) logs = parsed;
    } catch {}
  }

  const countryCounts: Record<string, { flag: string; count: number }> = {};
  logs.forEach((log) => {
    const c = log.country || 'مصر';
    if (!countryCounts[c]) {
      countryCounts[c] = { flag: log.flag || '🌍', count: 0 };
    }
    countryCounts[c].count++;
  });
  const totalVisits = Math.max(logs.length, 1);
  const topCountries = Object.entries(countryCounts)
    .map(([name, data]) => ({
      country: name,
      flag: data.flag,
      visits: data.count,
      percent: Math.round((data.count / totalVisits) * 100)
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // 5. Traffic Breakdown
  let discordCount = 0;
  let directCount = 0;
  let searchCount = 0;
  logs.forEach((log) => {
    const ref = (log.referrer || '').toLowerCase();
    if (ref.includes('discord')) discordCount++;
    else if (ref.includes('direct') || ref.includes('مباشر') || ref.includes('kesug') || ref.includes('link')) directCount++;
    else searchCount++;
  });
  const trafficSources = [
    { name: '💬 سيرفر الديسكورد (Discord)', visits: discordCount, percent: Math.round((discordCount / totalVisits) * 100) },
    { name: '🔗 روابط مباشرة ومشاركة (Direct)', visits: directCount, percent: Math.round((directCount / totalVisits) * 100) },
    { name: '🔍 محركات البحث والويب (Search)', visits: searchCount, percent: Math.round((searchCount / totalVisits) * 100) }
  ];

  // 6. Song Plays Breakdown
  let songPlays: Record<string, number> = {};
  const savedPlays = localStorage.getItem('sultan_song_plays');
  if (savedPlays) {
    try {
      songPlays = JSON.parse(savedPlays);
    } catch {}
  }
  const topSongs = Object.entries(songPlays)
    .map(([id, plays]) => ({ name: id, plays }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 3);

  const env = getClientEnvironmentDetails();

  let countriesText = 'لا توجد بيانات مسجلة';
  if (topCountries.length > 0) {
    countriesText = topCountries
      .map((c, i) => `${i + 1}. ${c.flag} **${c.country}**: \`${c.visits} زيارة\` (${c.percent}%)`)
      .join('\n');
  }

  let sourcesText = 'لا توجد بيانات';
  if (trafficSources.length > 0) {
    sourcesText = trafficSources
      .map((s) => `• **${s.name}**: \`${s.visits} زيارة\` (${s.percent}%)`)
      .join('\n');
  }

  const sultanSecrets = eggStats.sultan;
  const gameSecrets = eggStats.game;
  const totalSecrets = sultanSecrets + gameSecrets;

  const payload = {
    username: '👑 سلطان | تقرير منتصف الليل اليومي',
    avatar_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp',
    embeds: [
      {
        title: '🌙 التقرير الإحصائي اليومي (12:00 منتصف الليل) 👑',
        description: `أهلاً بك يا سلطان! هذا التقرير التلقائي الدوري الصادر في تمام **منتصف الليل** لتلخيص حركة الموقع وإحصائيات الزوار ليوم **${todayStr}**.`,
        color: 0xef4444, // Royal Red
        fields: [
          {
            name: '👁️ إجمالي المشاهدات والزيارات',
            value: `**${views.toLocaleString()}** زيارة مسجلة`,
            inline: true
          },
          {
            name: '👍 إجمالي التقييمات الإيجابية',
            value: `**${upvotes.toLocaleString()}** إعجاب ملكي`,
            inline: true
          },
          {
            name: '👑 تفاعل الأسرار والألعاب',
            value: `**${totalSecrets}** سر مكتشف *(كلمة سلطان: ${sultanSecrets} | اللعبة: ${gameSecrets})*`,
            inline: false
          },
          {
            name: '🌍 أعلى الدول تفاعلاً وزيارة',
            value: countriesText,
            inline: false
          },
          {
            name: '🔗 قنوات ومصادر حركة المرور',
            value: sourcesText,
            inline: false
          },
          {
            name: '⏱️ وقت إرسال التقرير',
            value: `<t:${Math.floor(Date.now() / 1000)}:F> (<t:${Math.floor(Date.now() / 1000)}:R>)`,
            inline: true
          },
          {
            name: '🔗 رابط الموقع ولوحة التحكم',
            value: '[sultan.kesug.com](https://sultan.kesug.com/#admin)',
            inline: true
          }
        ],
        footer: {
          text: 'نظام التقارير اليومية التلقائية 12:00 AM لموقع السلطان الملكي 👑',
          icon_url: 'https://cdn.discordapp.com/emojis/1056586395350749214.webp'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      localStorage.setItem('sultan_last_daily_report_date', todayStr);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to send midnight daily report to Discord', err);
    return false;
  }
}

/**
 * Initializes timer scheduling to fire precisely at 12:00:00 AM Midnight every day
 */
export function setupMidnightReportTimer(onMidnightReportSent?: () => void): () => void {
  // Check if today's midnight report needs to be sent right now
  checkAndSendMidnightDailyReport().then((sent) => {
    if (sent && onMidnightReportSent) onMidnightReportSent();
  });

  const getMsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // 12:00:00 AM tomorrow
    return Math.max(1000, midnight.getTime() - now.getTime());
  };

  let timerId: any = null;

  const scheduleNext = () => {
    const ms = getMsUntilMidnight();
    timerId = setTimeout(async () => {
      const sent = await checkAndSendMidnightDailyReport(true);
      if (sent && onMidnightReportSent) onMidnightReportSent();
      scheduleNext();
    }, ms);
  };

  scheduleNext();

  return () => {
    if (timerId) clearTimeout(timerId);
  };
}


