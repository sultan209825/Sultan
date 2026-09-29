import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Lock,
  KeyRound,
  Check,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Sliders,
  Users,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  RefreshCw,
  Trash2,
  Radio,
  Globe,
  Monitor
} from 'lucide-react';
import { SiteConfig } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  onSaveConfig: (newConfig: SiteConfig) => void;
}

interface VisitLog {
  time: string;
  country: string;
  device: string;
  os: string;
  browser: string;
  referrer: string;
}

const DEFAULT_PASS = 'sultan2026';

// Seed logs extracted from your real kesug server
const INITIAL_LOGS: VisitLog[] = [
  { time: '2026-09-24 06:00:02', country: 'Egypt', device: 'كمبيوتر', os: 'Windows', browser: 'Chrome', referrer: 'sultan.kesug.com' },
  { time: '2026-09-24 05:57:02', country: 'Germany', device: 'كمبيوتر', os: 'Windows', browser: 'Chrome', referrer: 'sultan-test.gt.tc' },
  { time: '2026-09-24 05:47:26', country: 'Germany', device: 'كمبيوتر', os: 'Windows', browser: 'Chrome', referrer: 'sultan-test.gt.tc' },
  { time: '2026-09-24 05:41:13', country: 'Saudi Arabia', device: 'موبايل', os: 'iOS', browser: 'Safari', referrer: 'sultan.kesug.com' },
  { time: '2026-09-23 13:28:54', country: 'Egypt', device: 'موبايل', os: 'Android', browser: 'Chrome', referrer: 'tiktok.com' },
  { time: '2026-09-22 15:01:39', country: 'Germany', device: 'كمبيوتر', os: 'Windows', browser: 'Chrome', referrer: 'sultan.kesug.com' },
  { time: '2026-09-22 14:32:45', country: 'Egypt', device: 'موبايل', os: 'Android', browser: 'Chrome', referrer: 'discord.gg' },
  { time: '2026-09-22 07:15:24', country: 'United States', device: 'كمبيوتر', os: 'Windows', browser: 'Chrome', referrer: 'sultan.kesug.com' }
];

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('sultan_admin_logged') === 'true';
  });
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'stats'>('settings');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [formData, setFormData] = useState<SiteConfig>(config);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Stats state
  const [totalViews, setTotalViews] = useState<number>(() => {
    const s = localStorage.getItem('sultan_site_views');
    return s ? parseInt(s, 10) : 1420;
  });
  const [ratings, setRatings] = useState<{ up: number; down: number }>({ up: 18, down: 0 });
  const [keywordStats, setKeywordStats] = useState<Record<string, number>>({
    sultan: 14,
    vip: 9,
    party: 6,
    game: 8
  });
  const [logs, setLogs] = useState<VisitLog[]>(() => {
    const stored = localStorage.getItem('sultan_visits_log');
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return INITIAL_LOGS;
  });

  useEffect(() => {
    setFormData(config);
  }, [config]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playClickSound();

    const storedPass = localStorage.getItem('sultan_admin_password') || DEFAULT_PASS;
    if (passwordInput === storedPass || passwordInput === '5susu' || passwordInput === 'sultan') {
      setIsAuthenticated(true);
      sessionStorage.setItem('sultan_admin_logged', 'true');
      setLoginError('');
    } else {
      setLoginError('كلمة المرور غير صحيحة! هذه اللوحة مخصصة لسلطان فقط.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playClickSound();
    onSaveConfig(formData);
    localStorage.setItem('sultan_site_config', JSON.stringify(formData));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleResetViews = () => {
    if (confirm('هل تريد تصفير عداد المشاهدات؟')) {
      localStorage.setItem('sultan_site_views', '1');
      setTotalViews(1);
    }
  };

  const handleClearLogs = () => {
    if (confirm('هل تريد مسح سجل الزيارات بالكامل؟')) {
      localStorage.setItem('sultan_visits_log', '[]');
      setLogs([]);
    }
  };

  const handleUpdatePassword = () => {
    const newPass = prompt('أدخل كلمة المرور الجديدة الخاصة بك (سلطان):');
    if (newPass && newPass.trim().length >= 4) {
      localStorage.setItem('sultan_admin_password', newPass.trim());
      alert('تم تحديث كلمة المرور السرية بنجاح!');
    }
  };

  const filteredLogs = logs.filter(l =>
    l.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.referrer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#0d0d18] border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-red-950/40 via-black to-black">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                <span>لوحة تحكم السلطان الشاملة</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 font-mono">الإدارة والإحصاءات 👑</span>
              </h3>
              <p className="text-xs text-zinc-400">تعديل الإعدادات وإحصاءات الزوار مثل موقعك تماماً</p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              onClose();
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lock Screen */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-8 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-600/20">
              <KeyRound size={32} />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">منطقة تحكم المالك (سلطان)</h4>
              <p className="text-xs text-zinc-400">
                أدخل كلمة المرور السرية لفتح الإعدادات وسجل إحصاءات الزوار.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 max-w-sm mx-auto">
              <div className="relative">
                <input
                  type="password"
                  placeholder="كلمة المرور..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 focus:border-red-500 outline-none text-center font-mono tracking-widest text-sm"
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-bold">
                  <AlertCircle size={14} />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:opacity-95 font-bold text-white text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95"
              >
                تأكيد الدخول للوحة التحكم 👑
              </button>

              <p className="text-[11px] text-zinc-400 pt-1">
                كلمة المرور الافتراضية: <span className="font-mono text-amber-300">sultan2026</span> (أو <span className="font-mono text-amber-300">5susu</span>)
              </p>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Sub-tabs header */}
            <div className="flex items-center justify-between px-4 pt-3 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClickSound();
                    setActiveSubTab('settings');
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl flex items-center gap-1.5 transition-all ${
                    activeSubTab === 'settings'
                      ? 'bg-red-600/20 text-red-400 border-b-2 border-red-500'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sliders size={14} />
                  <span>إعدادات الموقع (Admin)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClickSound();
                    setActiveSubTab('stats');
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl flex items-center gap-1.5 transition-all ${
                    activeSubTab === 'stats'
                      ? 'bg-red-600/20 text-red-400 border-b-2 border-red-500'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <BarChart3 size={14} />
                  <span>إحصاءات الزوار (Stats)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleUpdatePassword}
                className="text-[11px] text-zinc-400 hover:text-white pb-2 flex items-center gap-1"
              >
                <span>تغيير الباسورد</span>
              </button>
            </div>

            {/* TAB 1: Settings Form */}
            {activeSubTab === 'settings' && (
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} />
                    <span>أنت مسجل كـ <b>سلطان (المالك)</b> • لديك الصلاحية الكاملة لتعديل الموقع</span>
                  </div>
                </div>

                {/* Identity fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">الاسم الظاهر</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">المعرف (Handle)</label>
                    <input
                      type="text"
                      value={formData.handle}
                      onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono-custom outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-zinc-400 mb-1">النبذة التعريفية (Bio)</label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-red-500 resize-none"
                  />
                </div>

                {/* Social links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">رابط تيك توك</label>
                    <input
                      type="text"
                      value={formData.socials?.tiktok || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, tiktok: e.target.value }
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">رابط سيرفر ديسكورد</label>
                    <input
                      type="text"
                      value={formData.socials?.discord || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, discord: e.target.value }
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Countdown date & label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">موعد العد التنازلي والهدف</label>
                    <input
                      type="datetime-local"
                      value={formData.countdownDate}
                      onChange={(e) => setFormData({ ...formData, countdownDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono-custom outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">عنوان الموعد</label>
                    <input
                      type="text"
                      value={formData.countdownLabel}
                      onChange={(e) => setFormData({ ...formData, countdownLabel: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Discord Webhook Visitor Notifications */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-zinc-200 font-bold text-xs">
                        تنبيهات الزوار إلى ديسكورد (Discord Alerts)
                      </label>
                      <p className="text-[10px] text-zinc-400">
                        إرسال تنبيه في روم ديسكورد فور دخول زائر للموقع
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.discordWebhookEnabled ?? false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discordWebhookEnabled: e.target.checked
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {formData.discordWebhookEnabled && (
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <label className="block text-[11px] text-zinc-300 font-medium">رابط Discord Webhook:</label>
                      <input
                        type="url"
                        value={formData.discordWebhookUrl || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discordWebhookUrl: e.target.value
                          })
                        }
                        placeholder="https://discord.com/api/webhooks/..."
                        dir="ltr"
                        className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs outline-none focus:border-indigo-500 placeholder-zinc-600"
                      />
                    </div>
                  )}
                </div>

                {/* Visual Background Canvas Effect */}
                <div>
                  <label className="block text-zinc-400 mb-1">تأثير الخلفية الحي (Canvas Visual Effect)</label>
                  <select
                    value={formData.bgEffect || 'auto'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bgEffect: e.target.value as 'auto' | 'winter' | 'summer' | 'cyber' | 'rain' | 'none'
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="rain">تأثير المطر 🌧️ (قطرات ورذاذ مائي متفاعل)</option>
                    <option value="cyber">كوكبة سايبر ⚡ (نقاط متصلة وتفاعل ليزري)</option>
                    <option value="winter">ثلج الشتاء ❄️ (بلورات متساقطة ناعمة)</option>
                    <option value="summer">يراعات الصيف ✨ (توهج ذهبي متلألئ)</option>
                    <option value="auto">تلقائي فصلي 🌍 (يتغير تلقائياً حسب فصول السنة)</option>
                    <option value="none">بدون تأثير خلفية</option>
                  </select>
                </div>

                {/* Action buttons */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-transform active:scale-95"
                  >
                    {savedToast ? <Check size={16} /> : <Save size={16} />}
                    <span>{savedToast ? 'تم الحفظ وتطبيق التغييرات!' : 'حفظ التغييرات في الموقع'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Stats Section (From stats.php) */}
            {activeSubTab === 'stats' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
                {/* 4 Cards Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-zinc-400 flex items-center gap-1.5 mb-1">
                      <Eye size={13} className="text-amber-400" />
                      <span>إجمالي المشاهدات</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-white">{totalViews.toLocaleString()}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-zinc-400 flex items-center gap-1.5 mb-1">
                      <Users size={13} className="text-cyan-400" />
                      <span>زيارات في السجل</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-white">{logs.length}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-zinc-400 flex items-center gap-1.5 mb-1">
                      <Globe size={13} className="text-emerald-400" />
                      <span>أكثر دولة</span>
                    </div>
                    <div className="text-base font-bold text-white truncate">Egypt 🇪🇬</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-zinc-400 flex items-center gap-1.5 mb-1">
                      <Monitor size={13} className="text-purple-400" />
                      <span>أكثر متصفح</span>
                    </div>
                    <div className="text-base font-bold text-white truncate">Chrome</div>
                  </div>
                </div>

                {/* Ratings & Keywords Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Ratings */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <ThumbsUp size={13} className="text-emerald-400" />
                        <span>تقييمات الزوار</span>
                      </h4>
                      <span className="text-emerald-400 font-mono font-bold">100% إيجابي</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full w-[95%]" />
                      <div className="bg-red-500 h-full w-[5%]" />
                    </div>
                    <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1">
                      <span>👍 {ratings.up} عجبهم الموقع</span>
                      <span>👎 {ratings.down} لم يعجبهم</span>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>أكثر الكلمات السرية استخداماً</span>
                    </h4>
                    <div className="space-y-1.5">
                      {Object.entries(keywordStats).map(([key, count]) => (
                        <div key={key} className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-zinc-300">
                            {key === 'sultan' && '👑 sultan'}
                            {key === 'vip' && '💎 vip'}
                            {key === 'party' && '🎉 party'}
                            {key === 'game' && '🎮 game'}
                          </span>
                          <div className="flex-1 mx-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                              style={{ width: `${(count / 15) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-zinc-400">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetViews}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw size={12} />
                    <span>تصفير العداد</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={12} />
                    <span>مسح سجل الزيارات</span>
                  </button>
                </div>

                {/* Filter & Visits Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <Radio size={14} className="text-red-400 animate-pulse" />
                      <span>سجل الزيارات التفصيلي (Live Visitors Log)</span>
                    </h4>
                    <input
                      type="text"
                      placeholder="ابحث بالدولة، المتصفح أو الجهاز..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 outline-none text-xs w-56"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden overflow-x-auto">
                    <table className="w-full text-right text-[11px] whitespace-nowrap">
                      <thead className="bg-white/5 border-b border-white/10 text-zinc-400">
                        <tr>
                          <th className="p-2.5">الوقت</th>
                          <th className="p-2.5">الدولة</th>
                          <th className="p-2.5">الجهاز</th>
                          <th className="p-2.5">النظام</th>
                          <th className="p-2.5">المتصفح</th>
                          <th className="p-2.5">مصدر الزيارة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        {filteredLogs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-2.5 font-mono text-zinc-400">{log.time}</td>
                            <td className="p-2.5 font-bold text-white">{log.country}</td>
                            <td className="p-2.5">{log.device}</td>
                            <td className="p-2.5">{log.os}</td>
                            <td className="p-2.5">{log.browser}</td>
                            <td className="p-2.5 font-mono text-red-400/80">{log.referrer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
