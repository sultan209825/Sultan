/**
 * Site Activity Logger & Storage Manager
 * Stores rich event logs (visits, button clicks, secret triggers, game launches, ratings)
 * in localStorage for the Admin LogViewer.
 */

export interface SiteLogEntry {
  id: string;
  time: string;
  timestamp: number;
  eventType: string; // e.g. 'زيارة الموقع 🌍', 'الضغط على زر 🔘', 'فتح لعبة 🎮', 'كشف سر سلطان 👑', 'تقييم إيجابي 👍', 'مشاركة رابط 🔗', 'تحميل ZIP 📦'
  action?: string;
  country: string;
  flag: string;
  city: string;
  device: string;
  os: string;
  browser: string;
  referrer: string;
  duration?: string;
  details?: string;
}

const STORAGE_KEY = 'sultan_site_logs';

/**
 * Extracts current visitor environment info
 */
export function getCurrentClientEnv() {
  if (typeof window === 'undefined') {
    return {
      device: 'كمبيوتر',
      os: 'نظام تشغيل',
      browser: 'متصفح',
      referrer: 'مباشر'
    };
  }

  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  let os = 'Windows 11';
  if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (isIOS) os = 'iOS';
  else if (isAndroid) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Chrome';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = isMobile ? 'Chrome Mobile' : 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  const ref = document.referrer
    ? document.referrer.includes('discord')
      ? 'discord.gg/TUU6EeC6pb'
      : document.referrer
    : 'direct / رابط مباشر';

  return {
    device: isMobile ? 'موبايل' : 'كمبيوتر',
    os,
    browser,
    referrer: ref
  };
}

/**
 * Reads all stored site logs from localStorage
 */
export function getStoredLogs(): SiteLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        eventType: item.eventType || 'زيارة الموقع 🌍',
        timestamp: item.timestamp || Number(item.id) || Date.now()
      }));
    }
  } catch (err) {
    console.error('Error reading logs from localStorage', err);
  }
  return [];
}

/**
 * Formats a timestamp into an Arabic friendly time string
 */
export function formatLogTime(date: Date = new Date()): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  const displayHours = hours % 12 || 12;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day} - ${displayHours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Records a new event log into localStorage
 */
export function recordSiteLog(
  eventType: string,
  actionDesc?: string,
  extra?: {
    country?: string;
    flag?: string;
    city?: string;
    details?: string;
    duration?: string;
  }
): SiteLogEntry {
  const env = getCurrentClientEnv();
  const now = new Date();

  const newLog: SiteLogEntry = {
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
    time: formatLogTime(now),
    timestamp: now.getTime(),
    eventType: eventType || 'نشاط في الموقع ⚡',
    action: actionDesc || '',
    country: extra?.country || 'مصر',
    flag: extra?.flag || '🇪🇬',
    city: extra?.city || 'القاهرة',
    device: env.device,
    os: env.os,
    browser: env.browser,
    referrer: env.referrer,
    duration: extra?.duration || 'جلسة نشطة',
    details: extra?.details || ''
  };

  try {
    const current = getStoredLogs();
    const updated = [newLog, ...current.slice(0, 249)]; // Keep up to 250 recent entries
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Trigger storage event for live subscribers in other tabs
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Failed to store site log', err);
  }

  return newLog;
}

let isGlobalLoggerInitialized = false;
let lastActionTime = 0;
let lastActionDesc = '';

/**
 * Initializes automatic global event listener for all DOM interactions
 * Captures button clicks, link navigations, text copy, and tab switching.
 */
export function initGlobalInteractionLogger(): void {
  if (typeof window === 'undefined' || isGlobalLoggerInitialized) return;
  isGlobalLoggerInitialized = true;

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      recordSiteLog('مغادرة التبويب 👁️', 'الزائر غادر أو أخفى تبويب الموقع');
    } else {
      recordSiteLog('العودة للموقع 👀', 'الزائر رجع إلى تبويب الموقع النشط');
    }
  });

  // Track copy events (e.g. copying Sultan handle, bio, or links)
  document.addEventListener('copy', () => {
    const selected = window.getSelection()?.toString()?.trim();
    recordSiteLog('نسخ نص 📋', 'تم نسخ نص من محتوى الصفحة', {
      details: selected ? `النص المنسوخ: "${selected.slice(0, 60)}${selected.length > 60 ? '...' : ''}"` : 'نسخ للحافظة'
    });
  });

  // Track clicks on all buttons, links, and interactive elements
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest button or anchor
      const btn = target.closest('button, a, [role="button"]') as HTMLElement | null;
      if (!btn) return;

      // Avoid noisy clicks inside the LogViewer search/filter bar to prevent spam
      if (btn.closest('[data-log-ignore="true"]') || btn.closest('table')) return;

      const label =
        btn.getAttribute('aria-label') ||
        btn.getAttribute('title') ||
        btn.innerText ||
        btn.textContent ||
        '';
      const cleanLabel = label.trim().replace(/\s+/g, ' ').slice(0, 45);

      // Debounce duplicate clicks on same element within 600ms
      const now = Date.now();
      const actionKey = cleanLabel || btn.tagName;
      if (now - lastActionTime < 500 && lastActionDesc === actionKey) {
        return;
      }
      lastActionTime = now;
      lastActionDesc = actionKey;

      if (btn.tagName === 'A') {
        const href = btn.getAttribute('href') || '';
        if (href.startsWith('#') || href.startsWith('javascript:')) return;
        recordSiteLog('الضغط على رابط 🔗', `رابط: ${cleanLabel || href.slice(0, 30)}`, {
          details: `الرابط المستهدف: ${href}`
        });
      } else if (cleanLabel) {
        // Only log if not already an explicitly logged primary action button
        const isCommonAction =
          cleanLabel.includes('تصدير') ||
          cleanLabel.includes('مسح') ||
          cleanLabel.includes('إعادة ضبط') ||
          cleanLabel.includes('فلترة');
        if (!isCommonAction) {
          recordSiteLog('الضغط على زر 🔘', `زر: ${cleanLabel}`);
        }
      }
    },
    { capture: true }
  );
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  initGlobalInteractionLogger();
}

/**
 * Clears all site logs from localStorage
 */
export function clearStoredLogs(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('storage'));
}

/**
 * Deletes a single log by its unique ID
 */
export function deleteSingleStoredLog(logId: string): SiteLogEntry[] {
  const logs = getStoredLogs().filter((l) => l.id !== logId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  window.dispatchEvent(new Event('storage'));
  return logs;
}

/**
 * Exports logs to a beautifully formatted plain text (.txt) file
 */
export function exportLogsToTextFile(logs: SiteLogEntry[]): void {
  if (typeof window === 'undefined' || logs.length === 0) return;

  const nowStr = formatLogTime(new Date());
  let content = `========================================================================\n`;
  content += `👑 سجل اللوق والنشاطات الشامل لموقع السلطان الرسمي\n`;
  content += `تاريخ التصدير: ${nowStr}\n`;
  content += `إجمالي السجلات: ${logs.length} سجل\n`;
  content += `الموقع الرسمي: https://sultan.kesug.com\n`;
  content += `========================================================================\n\n`;

  logs.forEach((log, index) => {
    content += `[سجل #${index + 1}]\n`;
    content += `• نوع الحدث: ${log.eventType}\n`;
    if (log.action) content += `• تفاصيل الإجراء: ${log.action}\n`;
    content += `• الوقت والتاريخ: ${log.time}\n`;
    content += `• الدولة: ${log.flag || ''} ${log.country} (${log.city || 'غير محدد'})\n`;
    content += `• الجهاز: ${log.device} | ${log.os} | ${log.browser}\n`;
    content += `• المصدر (Referrer): ${log.referrer}\n`;
    if (log.details) content += `• ملاحظات إضافية: ${log.details}\n`;
    content += `------------------------------------------------------------------------\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `sultan_activity_logs_${dateStr}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
