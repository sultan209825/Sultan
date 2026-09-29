import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  X,
  FileCode,
  Flame,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface SiteAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip?: () => void;
}

export const SiteAuditorModal: React.FC<SiteAuditorModalProps> = ({ isOpen, onClose, onDownloadZip }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, idx: number) => {
    audioEngine.playClickSound();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const auditItems = [
    {
      severity: 'critical' as const,
      title: '🚨 ثغرة تسريب رابط الويبهوك الحساس في المتصفح (مكشوف للجميع)',
      file: 'script.js (السطر 674)',
      summary:
        'رابط Discord Webhook مكتوب نصياً داخل كود الجافاسكريبت للزوار! أي زائر يقدر يفتح F12 ويشوف الرابط، ويبعت سبام أو يحذف الويبهوك تماماً.',
      fix: 'احذف السطر والويبهوك من script.js واعتمد على السيرفر الخلفي PHP فقط لحماية سر الويبهوك.',
      codeToCopy: `// ❌ احذف هذا الكود القديم من script.js:
// const webhookUrl = "https://discord.com/api/webhooks/1549678192581672982/...";

// ✅ البديل الآمن: الإرسال فقط عبر notify.php بدون كشف التوكن في الفرونت إند:
function sendDiscordWebhookJS(event, data) {
  fetch('notify.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(Object.assign({ event: event }, data || {}))
  }).catch(() => {});
}`
    },
    {
      severity: 'critical' as const,
      title: '💥 خطأ قاتل (Syntax Error) يوقف إشعارات notify.php تماماً',
      file: 'notify.php (السطور 14-22)',
      summary:
        'في ملف notify.php، المتغير $payload يتم فحصه قبل أن تتم قراءته، وهناك قوس شرطي مفتوح بدون إغلاق، مما يسبب خطأ سيرفر 500 وتعطل إرسال الإشعارات.',
      fix: 'استبدل ملف notify.php بالكامل بالكود المصحح التالي:',
      codeToCopy: `<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/webhook.php';

startSecureSession();
sendSecurityHeaders('application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isSameOriginRequest()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'forbidden']);
    exit;
}

$rawInput = (string) file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload) || empty($payload['event'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'invalid_payload']);
    exit;
}

$event = (string) $payload['event'];
if (!in_array($event, ['visit', 'song_played', 'rating', 'keyword'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'unsupported_event']);
    exit;
}

// حدود الإرسال للحد من السبام
if ($event === 'visit') {
    $last = (int) ($_SESSION['visit_notification_at'] ?? 0);
    if ($last > time() - (6 * 3600)) {
        echo json_encode(['success' => false, 'reason' => 'rate_limited']);
        exit;
    }
    $_SESSION['visit_notification_at'] = time();
} elseif ($event === 'song_played') {
    $lastSong = (int) ($_SESSION['song_notification_at'] ?? 0);
    if ($lastSong > time() - 300) {
        echo json_encode(['success' => false, 'reason' => 'rate_limited']);
        exit;
    }
    $_SESSION['song_notification_at'] = time();
}

$sent = sendDiscordWebhook($event, $payload);
echo json_encode(['success' => $sent]);`
    },
    {
      severity: 'high' as const,
      title: '⚡ حظر استضافة InfinityFree / Kesug للطلبات التلقائية و Lanyard',
      file: 'سيرفر الاستضافة (Kesug)',
      summary:
        'استضافات Kesug المجانية تفرض جدار حماية فحص المتصفح (testcookie / aes.js)، مما يجعل طلبات الـ WebSocket والـ fetch للخدمات الخارجية تسقط أحياناً ويعلق الموقع على "جارِ الاتصال".',
      fix: 'أضفنا في هذه النسخة نظام Fallback فوري وذكي بحيث إذا تأخر Lanyard يتم عرض بيانات السلطان فوراً بدون أي تجميد أو انتظار.'
    },
    {
      severity: 'medium' as const,
      title: '🎵 مشغل الموسيقى وتعدد التراكات الحصرية',
      file: 'config.json & مشغل الصوت',
      summary:
        'الموقع القديم كان يعتمد على رابط وحيد لملف bg-music.mp3 أو song1.mp3، بينما أنت سجلت 5 أغاني وتراكات مميزة جداً بكلمات قوية.',
      fix: 'دمجنا التراكات الخمسة بكلماتها وإيقاعاتها الحصرية في مشغل فخم مع إمكانية رفع وتجربة أي ملف صوتي محلي.'
    }
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#0c0c16] border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-red-950/40 to-black">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                تقرير فحص موقعك sultan.kesug.com والحلول
              </h3>
              <p className="text-xs text-zinc-400 font-mono-custom">
                تحليل أمني وبرمجي دقيق + أكواد جاهزة للتصحيح
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              onClose();
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-3 text-xs text-zinc-300">
            <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={16} />
            <p>
              قمنا بفحص الكود بالكامل ووجدنا سبب المشاكل التي قد تواجهها في موقعك القديم، وأهمها تسريب رابط ديسكورد ويبهوك وعطل في كود ملف <span className="font-mono-custom text-red-300">notify.php</span>. يمكنك نسخ الأكواد المصححة أدناه لتحديث ملفاتك القديمة!
            </p>
          </div>

          {auditItems.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                item.severity === 'critical'
                  ? 'bg-red-950/20 border-red-500/30 hover:border-red-500/50'
                  : item.severity === 'high'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-indigo-950/20 border-indigo-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                  {item.title}
                </h4>
                <span className="text-[10px] font-mono-custom px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 flex-shrink-0">
                  {item.file}
                </span>
              </div>

              <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{item.summary}</p>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-emerald-300 mb-2">
                <span className="font-bold text-white block mb-0.5">الحل البرمجي:</span>
                {item.fix}
              </div>

              {item.codeToCopy && (
                <div className="relative mt-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-[#12121e] px-3 py-1.5 rounded-t-xl border-x border-t border-white/10 font-mono-custom">
                    <span className="flex items-center gap-1">
                      <Terminal size={12} className="text-red-400" />
                      الكود المصحح
                    </span>
                    <button
                      onClick={() => copyCode(item.codeToCopy!, idx)}
                      className="flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>نسخ الكود</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre
                    dir="ltr"
                    className="p-3 bg-black/70 border border-white/10 rounded-b-xl text-[11px] font-mono-custom text-zinc-300 overflow-x-auto max-h-48 leading-relaxed selection:bg-red-500/30"
                  >
                    {item.codeToCopy}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#080810] flex flex-wrap items-center justify-between gap-2">
          {onDownloadZip ? (
            <button
              onClick={() => {
                audioEngine.playClickSound();
                onDownloadZip();
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 flex items-center gap-1.5 shadow-md shadow-red-600/20"
            >
              <span>📥 تحميل ملف ZIP الجاهز للرفع الآن</span>
            </button>
          ) : (
            <span className="text-xs text-zinc-400 font-mono-custom">
              النسخة التي تتصفحها الآن تم فيها حل جميع هذه المشاكل تلقائياً ✅
            </span>
          )}

          <button
            onClick={() => {
              audioEngine.playClickSound();
              onClose();
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-transform active:scale-95"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
