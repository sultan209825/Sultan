/**
 * Email Notification Engine for Sultan's Profile & Management System
 * Automatically notifies Sultan at sultan209825@gmail.com upon:
 * 1. Admin Panel Entry / Unauthorized or Authorized Access
 * 2. VIP Secret Discord Role Claim / Activation
 */

import { recordSiteLog } from './siteLogger';

export interface EmailAlertPayload {
  eventType: 'admin_login' | 'vip_role_claim' | 'test_alert';
  title: string;
  details: string;
  userIdentifier?: string;
  metadata?: Record<string, any>;
}

const DEFAULT_TARGET_EMAIL = 'sultan209825@gmail.com';

// Cooldown tracking in memory to prevent duplicate email storms
const lastSentTimestamps: Record<string, number> = {};

/**
 * Get device & environment details in Arabic
 */
function getSystemDetails() {
  const ua = navigator.userAgent;
  let browser = 'متصفح غير معروف';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Google Chrome';
  else if (ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';

  let os = 'نظام غير معروف';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android 📱';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS (Apple) 📱';
  else if (ua.includes('Mac OS')) os = 'macOS (MacBook)';
  else if (ua.includes('Linux')) os = 'Linux';

  return {
    os,
    browser,
    screen: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language || 'ar',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
    url: window.location.href,
    time: new Date().toLocaleString('ar-EG', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'full',
      timeStyle: 'medium'
    })
  };
}

/**
 * Main dispatcher to send email alerts to sultan209825@gmail.com
 */
export async function sendEmailNotification(payload: EmailAlertPayload): Promise<{
  success: boolean;
  message: string;
  needsActivation?: boolean;
}> {
  const storedConfigStr = localStorage.getItem('sultan_site_config');
  let targetEmail = DEFAULT_TARGET_EMAIL;
  let isEnabled = true;
  let notifyOnAdmin = true;
  let notifyOnVip = true;

  if (storedConfigStr) {
    try {
      const cfg = JSON.parse(storedConfigStr);
      if (cfg.emailNotifications) {
        if (cfg.emailNotifications.enabled === false) isEnabled = false;
        if (cfg.emailNotifications.email) targetEmail = cfg.emailNotifications.email.trim();
        if (cfg.emailNotifications.notifyOnAdminLogin === false) notifyOnAdmin = false;
        if (cfg.emailNotifications.notifyOnVipRoleClaim === false) notifyOnVip = false;
      }
    } catch {}
  }

  // Check event-specific toggles
  if (payload.eventType === 'admin_login' && !notifyOnAdmin) {
    return { success: false, message: 'إشعارات دخول الأدمن معطلة في الإعدادات.' };
  }
  if (payload.eventType === 'vip_role_claim' && !notifyOnVip) {
    return { success: false, message: 'إشعارات رتبة VIP معطلة في الإعدادات.' };
  }
  if (!isEnabled && payload.eventType !== 'test_alert') {
    return { success: false, message: 'نظام الإشعارات البريدية معطل بالكامل.' };
  }

  // 1-minute debounce per event type (except manual test alerts)
  const now = Date.now();
  if (payload.eventType !== 'test_alert') {
    const lastSent = lastSentTimestamps[payload.eventType] || 0;
    if (now - lastSent < 60000) {
      return { success: true, message: 'تم إرسال إشعار مماثل مؤخراً لتفادي التكرار (Cooldown).' };
    }
  }

  const sys = getSystemDetails();

  let subject = '';
  if (payload.eventType === 'admin_login') {
    subject = '🚨 تنبيه فوري: تم الدخول إلى لوحة إدارة بروفايل السلطان!';
  } else if (payload.eventType === 'vip_role_claim') {
    subject = '👑 تنبيه ملكي: شخص ما قام بتفعيل رتبة VIP السلطان بالديسكورد!';
  } else {
    subject = '🔔 اختبار نظام الإشعارات البريدية - بروفايل السلطان';
  }

  const emailBody: Record<string, any> = {
    _subject: subject,
    _template: 'table',
    _captcha: 'false',
    '📢 عنوان الحدث': payload.title,
    '📝 تفاصيل العملية': payload.details,
    '👤 معرف المستخدم (إن وجد)': payload.userIdentifier || 'زائر الموقع',
    '⏰ التوقيت': sys.time,
    '💻 نظام التشغيل': sys.os,
    '🌐 المتصفح': sys.browser,
    '📐 دقة الشاشة': sys.screen,
    '🌍 المنطقة الزمنية': sys.timezone,
    '🔗 رابط الصفحة': sys.url
  };

  if (payload.metadata) {
    Object.entries(payload.metadata).forEach(([k, v]) => {
      emailBody[`🔹 ${k}`] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    });
  }

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(emailBody)
    });

    const data = await res.json();
    lastSentTimestamps[payload.eventType] = now;

    if (data.success === 'true' || res.ok) {
      recordSiteLog(
        'إشعار بريد إلكتروني 📧',
        `تم إرسال تنبيه بنجاح إلى: ${targetEmail} (${payload.title})`
      );
      return {
        success: true,
        message: `تم إرسال الإشعار بنجاح إلى بريدك (${targetEmail})!`
      };
    } else if (data.message && data.message.includes('Activation')) {
      recordSiteLog(
        'تفعيل البريد 📧',
        `تم طلب رابط التفعيل عبر FormSubmit للبريد: ${targetEmail}`
      );
      return {
        success: true,
        needsActivation: true,
        message: `تم إرسال رسالة تفعيل إلى (${targetEmail}). يرجى فتح البريد والضغط على زر "Activate Form" لمرة واحدة فقط لتصلك جميع التنبيهات دائماً!`
      };
    } else {
      return {
        success: false,
        message: data.message || 'حدث خطأ أثناء إرسال البريد.'
      };
    }
  } catch (err: any) {
    console.warn('FormSubmit email notice error:', err);
    // Even if external network fails, record to site logs
    recordSiteLog(
      'محاولة إرسال إشعار 📧',
      `تم تسجيل محاولة تنبيه للبريد (${targetEmail}) للحدث: ${payload.title}`
    );
    return {
      success: false,
      message: 'تعذر الاتصال بخدمة البريد. تم تسجيل الحدث في سجلات الموقع.'
    };
  }
}
