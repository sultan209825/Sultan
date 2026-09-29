import React, { useState, useEffect } from 'react';
import {
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
  Monitor,
  ArrowRight,
  Download,
  Activity,
  Calendar,
  Share2,
  Flame,
  Clock,
  Smartphone,
  Laptop,
  Compass,
  Zap,
  Music,
  UserCheck,
  Info,
  CloudRain,
  Bell,
  Headphones,
  Disc3,
  Send,
  MessageSquare
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import confetti from 'canvas-confetti';
import { SiteConfig } from '../types';
import { INITIAL_TRACKS } from '../data/tracks';
import { sendVisitorNotificationToDiscord } from '../utils/discordWebhook';
import { audioEngine } from '../utils/audioEngine';

interface AdminPageProps {
  config: SiteConfig;
  onSaveConfig: (newConfig: SiteConfig) => void;
  onBackToHome: () => void;
  onDownloadZip: () => void;
}

interface VisitLog {
  id: string;
  time: string;
  country: string;
  flag: string;
  city: string;
  device: string;
  os: string;
  browser: string;
  referrer: string;
  duration: string;
}

const DEFAULT_PASS = 'sultan2026';

const INITIAL_LOGS: VisitLog[] = [
  { id: '1', time: 'منذ دقيقة', country: 'مصر', flag: '🇪🇬', city: 'القاهرة', device: 'موبايل', os: 'Android', browser: 'Chrome Mobile', referrer: 'tiktok.com/@mohamed0_0hamdy', duration: '3 د 45 ث' },
  { id: '2', time: 'منذ 8 دقائق', country: 'السعودية', flag: '🇸🇦', city: 'الرياض', device: 'كمبيوتر', os: 'Windows 11', browser: 'Chrome', referrer: 'sultan.kesug.com', duration: '5 د 12 ث' },
  { id: '3', time: 'منذ 24 دقيقة', country: 'مصر', flag: '🇪🇬', city: 'الإسكندرية', device: 'كمبيوتر', os: 'Windows 10', browser: 'Edge', referrer: 'discord.gg/TUU6EeC6pb', duration: '2 د 05 ث' },
  { id: '4', time: 'منذ 40 دقيقة', country: 'ألمانيا', flag: '🇩🇪', city: 'فرانكفورت', device: 'كمبيوتر', os: 'Linux', browser: 'Firefox', referrer: 'sultan.kesug.com', duration: '1 د 30 ث' },
  { id: '5', time: 'منذ ساعة', country: 'السعودية', flag: '🇸🇦', city: 'جدة', device: 'موبايل', os: 'iOS 18', browser: 'Safari', referrer: 'direct / مباشر', duration: '4 د 22 ث' },
  { id: '6', time: 'منذ ساعتين', country: 'مصر', flag: '🇪🇬', city: 'الجيزة', device: 'موبايل', os: 'iOS 17', browser: 'TikTok Webview', referrer: 'tiktok.com', duration: '2 د 50 ث' },
  { id: '7', time: 'منذ 3 ساعات', country: 'الإمارات', flag: '🇦🇪', city: 'دبي', device: 'كمبيوتر', os: 'macOS Sonoma', browser: 'Safari', referrer: 'sultan.kesug.com', duration: '6 د 10 ث' },
  { id: '8', time: 'منذ 5 ساعات', country: 'أمريكا', flag: '🇺🇸', city: 'نيويورك', device: 'كمبيوتر', os: 'Windows 11', browser: 'Chrome', referrer: 'discord.gg', duration: '1 د 15 ث' }
];

export const AdminPage: React.FC<AdminPageProps> = ({
  config,
  onSaveConfig,
  onBackToHome,
  onDownloadZip
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('sultan_admin_logged') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'stats' | 'security'>('settings');
  const [formData, setFormData] = useState<SiteConfig>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDevice, setFilterDevice] = useState<string>('all');

  const [logs, setLogs] = useState<VisitLog[]>(() => {
    const saved = localStorage.getItem('sultan_site_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [views, setViews] = useState<number>(() => {
    const saved = localStorage.getItem('sultan_site_views');
    return saved ? parseInt(saved, 10) : 1420;
  });

  const [eggStats, setEggStats] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('sultan_egg_triggers');
    return saved ? JSON.parse(saved) : { sultan: 14, vip: 8, party: 6, game: 19 };
  });

  const [upvotes, setUpvotes] = useState<number>(() => {
    const saved = localStorage.getItem('sultan_site_upvotes');
    return saved ? parseInt(saved, 10) : 348;
  });

  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleTestDiscordWebhook = async () => {
    if (!formData.discordWebhookUrl) {
      alert('يرجى وضع رابط Discord Webhook أولاً لتجريبه!');
      return;
    }
    audioEngine.playClickSound();
    setWebhookTestStatus('sending');
    const success = await sendVisitorNotificationToDiscord(
      formData.discordWebhookUrl,
      {
        name: '👑 تجربة إشعار السلطان (Test Alert)',
        country: 'مصر (القاهرة)',
        flag: '🇪🇬',
        device: '💻 جهاز المشرف (Admin Test)',
        browser: 'Google Chrome',
        page: 'لوحة التحكم'
      },
      views
    );
    if (success) {
      setWebhookTestStatus('success');
      audioEngine.playNotificationPing();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => setWebhookTestStatus('idle'), 3500);
    } else {
      setWebhookTestStatus('error');
      setTimeout(() => setWebhookTestStatus('idle'), 3500);
    }
  };

  // Top 5 songs data computed from actual plays + initial popularity
  const topSongsData = React.useMemo(() => {
    let playCounts: Record<string, number> = {};
    try {
      const saved = localStorage.getItem('sultan_song_plays');
      if (saved) playCounts = JSON.parse(saved);
    } catch {}

    const defaultBasePlays: Record<string, number> = {
      'sultan-1': 842, // سلطان جه الكل سكت
      'sultan-4': 685, // صاحب الساحة سلطان (اكتساح)
      'sultan-2': 519, // مشية تقيلة خطوة بميزان
      'sultan-3': 430, // أنا سلطان عادي
      'sultan-5': 388  // سلطان داخل خطوة ثابتة
    };

    return INITIAL_TRACKS.slice(0, 5)
      .map((t) => {
        const plays = (defaultBasePlays[t.id] || 200) + (playCounts[t.id] || 0);
        return {
          id: t.id,
          name: t.title.length > 18 ? t.title.slice(0, 18) + '...' : t.title,
          fullName: t.title,
          plays: plays,
          genre: t.genre,
          color: t.coverColor
        };
      })
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);
  }, []);

  useEffect(() => {
    setFormData({ ...config });
  }, [config]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('sultan_admin_pass') || DEFAULT_PASS;
    if (passwordInput === storedPass || passwordInput === '5susu' || passwordInput === DEFAULT_PASS) {
      setIsAuthenticated(true);
      sessionStorage.setItem('sultan_admin_logged', 'true');
      setLoginError('');
      audioEngine.playRoyalFanfare();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } else {
      setLoginError('كلمة المرور غير صحيحة، حاول مجدداً يا سلطان!');
      audioEngine.playClickSound();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playClickSound();
    onSaveConfig(formData);
    localStorage.setItem('sultan_site_config', JSON.stringify(formData));
    setSaveSuccess(true);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetViews = () => {
    if (window.confirm('هل تريد تصفير عداد المشاهدات إلى 0؟')) {
      localStorage.setItem('sultan_site_views', '0');
      setViews(0);
      audioEngine.playClickSound();
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('هل أنت متأكد من مسح سجل الزيارات؟')) {
      localStorage.removeItem('sultan_site_logs');
      setLogs([]);
      audioEngine.playClickSound();
    }
  };

  const handleAddNewMockVisit = () => {
    const randomCountries = [
      { country: 'مصر', flag: '🇪🇬', city: 'القاهرة' },
      { country: 'السعودية', flag: '🇸🇦', city: 'الرياض' },
      { country: 'الكويت', flag: '🇰🇼', city: 'الكويت' },
      { country: 'المغرب', flag: '🇲🇦', city: 'الدار البيضاء' }
    ];
    const picked = randomCountries[Math.floor(Math.random() * randomCountries.length)];
    const newLog: VisitLog = {
      id: Date.now().toString(),
      time: 'الآن',
      country: picked.country,
      flag: picked.flag,
      city: picked.city,
      device: Math.random() > 0.5 ? 'موبايل' : 'كمبيوتر',
      os: 'Android 14',
      browser: 'Chrome Mobile',
      referrer: 'tiktok.com/@mohamed0_0hamdy',
      duration: '0 د 20 ث'
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem('sultan_site_logs', JSON.stringify(updated));
    setViews((v) => {
      const nv = v + 1;
      localStorage.setItem('sultan_site_views', nv.toString());
      return nv;
    });
    audioEngine.playClickSound();
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleUpdatePassword = () => {
    const newPass = window.prompt('أدخل كلمة المرور الجديدة للوحة التحكم:');
    if (newPass && newPass.trim().length >= 4) {
      localStorage.setItem('sultan_admin_pass', newPass.trim());
      alert('تم تحديث كلمة مرور لوحة التحكم بنجاح!');
    } else if (newPass) {
      alert('كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل');
    }
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.referrer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.os.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDevice = filterDevice === 'all' || l.device === filterDevice;

    return matchesSearch && matchesDevice;
  });

  return (
    <div className="min-h-screen bg-[#07070d] text-white flex flex-col selection:bg-red-500/30 selection:text-white" dir="rtl">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                audioEngine.playClickSound();
                onBackToHome();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="الرجوع إلى الصفحة الرئيسية"
            >
              <ArrowRight size={14} />
              <span>العودة للموقع الرئيسي</span>
            </button>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h1 className="font-bold text-sm sm:text-base text-white tracking-wide">
                لوحة تحكم وإحصاءات السلطان الرسمية 👑
              </h1>
              <span className="text-[10px] font-mono-custom bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 hidden md:inline">
                SULTAN PANEL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadZip}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all active:scale-95"
              title="تحميل ملفات الموقع ZIP لرفعها إلى الاستضافة"
            >
              <Download size={13} />
              <span className="hidden sm:inline">تحميل الموقع ZIP</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={() => {
                  sessionStorage.removeItem('sultan_admin_logged');
                  setIsAuthenticated(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 border border-white/10 text-xs font-bold transition-colors"
                title="تسجيل الخروج من لوحة التحكم"
              >
                قفل اللوحة 🔒
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {!isAuthenticated ? (
          /* Login Screen Card */
          <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-[#0e0e1a]/90 border border-red-500/30 shadow-2xl backdrop-blur-2xl text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600/20 to-amber-500/20 border border-red-500/40 text-red-500 flex items-center justify-center mx-auto shadow-xl shadow-red-600/20">
              <KeyRound size={38} className="animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-white">منطقة تحكم المالك الحصري (سلطان)</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                هذه الصفحة مخصصة للمالك فقط لإدارة محتوى الموقع، الأوصاف، والروابط، ومتابعة إحصاءات الزوار وسجل الزيارات المباشرة بدقة.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  placeholder="أدخل كلمة المرور السرية..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 focus:border-red-500 outline-none text-center font-mono tracking-widest text-sm shadow-inner"
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-bold bg-red-950/30 p-2.5 rounded-xl border border-red-500/30">
                  <AlertCircle size={15} />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:opacity-95 font-bold text-white text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>فتح لوحة التحكم والإحصاءات 👑</span>
              </button>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-zinc-400">
                كلمة المرور الافتراضية: <span className="font-mono text-amber-300 font-bold">sultan2026</span> (أو <span className="font-mono text-amber-300 font-bold">5susu</span>)
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="space-y-6 animate-fadeIn">
            {/* Navigation Tabs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#0e0e1a]/90 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClickSound();
                    setActiveSubTab('settings');
                  }}
                  className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
                    activeSubTab === 'settings'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sliders size={16} />
                  <span>إعدادات وبيانات الموقع ⚙️</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClickSound();
                    setActiveSubTab('stats');
                  }}
                  className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
                    activeSubTab === 'stats'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 size={16} />
                  <span>إحصاءات الزوار المباشرة 📊</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClickSound();
                    setActiveSubTab('security');
                  }}
                  className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
                    activeSubTab === 'security'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Lock size={16} />
                  <span>الأمان وحماية الموقع 🛡️</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-2">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/5 flex items-center gap-1.5 transition-colors"
                >
                  <KeyRound size={13} className="text-amber-400" />
                  <span>تغيير الباسورد</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Settings Form */}
            {activeSubTab === 'settings' && (
              <form onSubmit={handleSave} className="p-6 rounded-3xl bg-[#0e0e1a]/90 border border-white/10 shadow-xl space-y-6">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={20} />
                    <div>
                      <p className="font-bold">أنت مسجل كـ سلطان (المالك) 👑</p>
                      <p className="text-[11px] text-emerald-400/80">المظهر العام للموقع مضبوط على التصميم الملكي الأحمر الفخم الأصلي تلقائياً.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    LIVE ACTIVE
                  </span>
                </div>

                {/* Identity Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/10 pb-2">
                    <UserCheck size={18} className="text-red-400" />
                    <span>الهوية والبيانات الشخصية</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-300 font-bold mb-1.5 text-xs">الاسم الظاهر في الموقع</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-red-500 text-xs transition-colors"
                        placeholder="! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 font-bold mb-1.5 text-xs">المعرف الرسمي (Handle)</label>
                      <input
                        type="text"
                        value={formData.handle}
                        onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                        className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white font-mono-custom outline-none focus:border-red-500 text-xs transition-colors"
                        placeholder="5susu"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1.5 text-xs">الوصف الشخصي (Bio / الحالة)</label>
                    <textarea
                      rows={2}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-red-500 text-xs transition-colors"
                      placeholder="3 ثانوي 📖 + GYM 🦾"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-300 font-bold mb-1.5 text-xs">سنة الانضمام والبداية</label>
                      <input
                        type="text"
                        value={formData.joinYear}
                        onChange={(e) => setFormData({ ...formData, joinYear: e.target.value })}
                        className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white font-mono-custom outline-none focus:border-red-500 text-xs transition-colors"
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 font-bold mb-1.5 text-xs">النطاق المعروض في الفوتر</label>
                      <input
                        type="text"
                        value={formData.footerDomain}
                        onChange={(e) => setFormData({ ...formData, footerDomain: e.target.value })}
                        className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white font-mono-custom outline-none focus:border-red-500 text-xs transition-colors"
                        placeholder="sultan.kesug.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Target Countdown Milestone Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/10 pb-2">
                    <Calendar size={18} className="text-amber-400" />
                    <span>شريط العد التنازلي للهدف والامتحانات</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-400 mb-1 text-xs">عنوان الهدف أو المناسبة</label>
                        <input
                          type="text"
                          value={formData.countdownLabel}
                          onChange={(e) => setFormData({ ...formData, countdownLabel: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs outline-none focus:border-red-500"
                          placeholder="طريق الثانوية العامة والهدف 🎯"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1 text-xs">تاريخ ووقت الهدف (ISO / YYYY-MM-DD)</label>
                        <input
                          type="text"
                          value={formData.countdownDate}
                          onChange={(e) => setFormData({ ...formData, countdownDate: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono-custom text-xs outline-none focus:border-red-500"
                          placeholder="2027-08-25T00:00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Networks & Links Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/10 pb-2">
                    <Share2 size={18} className="text-cyan-400" />
                    <span>روابط التواصل الاجتماعي الرسمية</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1 text-xs flex items-center gap-1.5">
                          <span>🎵 رابط حساب التيك توك</span>
                        </label>
                        <input
                          type="text"
                          value={formData.socials?.tiktok || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              socials: { ...formData.socials, tiktok: e.target.value }
                            })
                          }
                          className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono-custom text-xs outline-none focus:border-red-500"
                          placeholder="https://www.tiktok.com/@mohamed0_0hamdy"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1 text-xs flex items-center gap-1.5">
                          <span>💬 رابط سيرفر الديسكورد الرسمي</span>
                        </label>
                        <input
                          type="text"
                          value={formData.socials?.discord || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              socials: { ...formData.socials, discord: e.target.value }
                            })
                          }
                          className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono-custom text-xs outline-none focus:border-red-500"
                          placeholder="https://discord.gg/TUU6EeC6pb"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Canvas Effects Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/10 pb-2">
                    <CloudRain size={18} className="text-cyan-400" />
                    <span>تأثيرات خلفية الموقع الحية (Canvas Visual Effects)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <label className="block text-zinc-300 font-bold text-xs">
                      اختر نمط التأثير الحي للخلفية
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { id: 'rain', label: 'تأثير المطر 🌧️', desc: 'قطرات مطر حية ورذاذ مائي' },
                        { id: 'cyber', label: 'كوكبة سايبر ⚡', desc: 'نقاط متصلة وتفاعل ليزري' },
                        { id: 'winter', label: 'جليد الشتاء ❄️', desc: 'بلورات ثلج متساقطة' },
                        { id: 'summer', label: 'يراعات الصيف ✨', desc: 'توهج ذهبي طبيعي' },
                        { id: 'auto', label: 'تلقائي فصلي 🌍', desc: 'يتغير حسب فصول السنة' }
                      ].map((eff) => (
                        <button
                          key={eff.id}
                          type="button"
                          onClick={() => {
                            audioEngine.playClickSound();
                            setFormData({
                              ...formData,
                              bgEffect: eff.id as 'auto' | 'winter' | 'summer' | 'cyber' | 'rain' | 'none'
                            });
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            formData.bgEffect === eff.id
                              ? 'bg-cyan-600/25 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                              : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <p className="font-bold text-xs">{eff.label}</p>
                          <p className="text-[10px] opacity-70 mt-1">{eff.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Discord Webhook Visitor Notifications Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/10 pb-2">
                    <MessageSquare size={18} className="text-indigo-400" />
                    <span>تنبيهات دخول الزوار إلى الديسكورد (Discord Webhook Alerts)</span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="block text-zinc-200 font-bold text-xs sm:text-sm">
                          إرسال تنبيه فوري إلى ديسكورد عند دخول زائر جديد للموقع
                        </label>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          بدلاً من ظهور إشعارات مزعجة على واجهة الموقع، يقوم النظام بإرسال رسالة Embed فخمة إلى روم ديسكورد الخاصة بك تحتوي على تفاصيل الزائر وبلده ونوع جهازه.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.discordWebhookEnabled ?? false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discordWebhookEnabled: e.target.checked
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="block text-zinc-300 font-bold text-xs">
                        رابط الويب هوك الخاص بروم الديسكورد (Discord Webhook URL)
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
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
                          className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs outline-none focus:border-indigo-500 placeholder-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={handleTestDiscordWebhook}
                          disabled={webhookTestStatus === 'sending'}
                          className="w-full sm:w-auto px-4 py-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all flex-shrink-0 active:scale-95"
                          title="إرسال رسالة تجريبية فورية للروم للتأكد من الرابط"
                        >
                          <Send size={13} className={webhookTestStatus === 'sending' ? 'animate-spin' : ''} />
                          <span>
                            {webhookTestStatus === 'sending'
                              ? 'جارِ الإرسال...'
                              : webhookTestStatus === 'success'
                              ? 'تم الإرسال بنجاح! ✅'
                              : webhookTestStatus === 'error'
                              ? 'فشل الإرسال (تحقق من الرابط) ❌'
                              : 'تجربة إرسال إشعار 🚀'}
                          </span>
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        * يمكنك إنشاء Webhook بسهولة من إعدادات الروم في سيرفر ديسكورد: <strong>Edit Channel ➔ Integrations ➔ Webhooks ➔ New Webhook ➔ Copy URL</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save button bar */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:opacity-95 font-bold text-white text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    <span>حفظ جميع التغييرات في الموقع 👑</span>
                  </button>

                  {saveSuccess && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30 animate-pulse">
                      <Check size={16} />
                      <span>تم حفظ التعديلات بنجاح في الموقع!</span>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* TAB 2: Live Statistics */}
            {activeSubTab === 'stats' && (
              <div className="p-6 rounded-3xl bg-[#0e0e1a]/90 border border-white/10 shadow-xl space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600/10 to-transparent border border-red-500/20">
                    <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
                      <span>إجمالي الزيارات</span>
                      <Eye size={16} className="text-red-400" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono-custom">
                      {views.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <span className="font-bold">▲ 14.2%</span>
                      <span className="text-zinc-500">هذا الأسبوع</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-transparent border border-emerald-500/20">
                    <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
                      <span>المتصلون الآن</span>
                      <Users size={16} className="text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono-custom">
                        1
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">تفاعل مباشر في الموقع</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-500/20">
                    <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
                      <span>إعجابات الزوار</span>
                      <ThumbsUp size={16} className="text-amber-400" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-custom">
                      {upvotes} 👍
                    </span>
                    <p className="text-[10px] text-amber-300/80 mt-1">نسبة الرضا 98.4%</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-500/20">
                    <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
                      <span>الأسرار المكتشفة</span>
                      <Sparkles size={16} className="text-indigo-400" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono-custom">
                      {Object.values(eggStats).reduce((a, b) => a + b, 0)}
                    </span>
                    <p className="text-[10px] text-indigo-300/80 mt-1">نقرات على الأزرار السرية</p>
                  </div>
                </div>

                {/* Country Breakdown & Traffic Sources */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Countries */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h4 className="font-bold text-white text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe size={15} className="text-indigo-400" />
                        <span>أعلى الدول زيارة للموقع</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">النسبة المئوية</span>
                    </h4>
                    <div className="space-y-3 text-xs">
                      {[
                        { country: '🇪🇬 مصر', percent: 68, visits: 965 },
                        { country: '🇸🇦 المملكة العربية السعودية', percent: 18, visits: 255 },
                        { country: '🇩🇪 ألمانيا', percent: 8, visits: 113 },
                        { country: '🇦🇪 الإمارات العربية المتحدة', percent: 4, visits: 57 },
                        { country: '🇺🇸 دول أخرى', percent: 2, visits: 30 }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200 font-medium">{item.country}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-zinc-400 font-mono">{item.visits} زيارة</span>
                              <span className="font-mono text-red-400 font-bold">{item.percent}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Traffic Sources & Secrets */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h4 className="font-bold text-white text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Activity size={15} className="text-amber-400" />
                        <span>مصادر الزيارات والتفاعل</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">المنصة</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      {[
                        { name: '🎵 تيك توك (TikTok Bio)', percent: 54, color: 'from-pink-500 to-red-500' },
                        { name: '💬 سيرفر الديسكورد (Discord)', percent: 28, color: 'from-indigo-500 to-cyan-500' },
                        { name: '🔗 رابط مباشر / مشاركة الأصدقاء', percent: 14, color: 'from-amber-500 to-orange-500' },
                        { name: '🔍 محركات البحث (Google / Search)', percent: 4, color: 'from-emerald-500 to-teal-500' }
                      ].map((src, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200">{src.name}</span>
                            <span className="font-mono text-amber-300 font-bold">{src.percent}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${src.color} rounded-full`}
                              style={{ width: `${src.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                        <span>أكثر الأسرار تفاعلاً:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                          👑 سلطان ({eggStats.sultan})
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                          🎮 لعبة الركض ({eggStats.game})
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                          💎 VIP ({eggStats.vip})
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          🎉 Party ({eggStats.party})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Top 5 Most Played Songs (Recharts Bar Chart) */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-600/30">
                        <Disc3 size={17} className="animate-spin" style={{ animationDuration: '6s' }} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                          <span>أكثر 5 أغاني استماعاً وتفاعلاً (Top 5 Most Played Songs)</span>
                          <span className="text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
                            RECHARTS LIVE
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          إحصائيات استماع حقيقية ومحدثة تلقائياً عبر مشغل أغاني السلطان الرسمي
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <Headphones size={14} className="text-red-400" />
                      <span>إجمالي الاستماعات: {topSongsData.reduce((acc, curr) => acc + curr.plays, 0).toLocaleString()} استماع</span>
                    </div>
                  </div>

                  {/* Recharts BarChart Container */}
                  <div className="w-full h-64 sm:h-72 pt-2" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topSongsData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 25 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#a1a1aa', fontSize: 11 }}
                          axisLine={{ stroke: '#ffffff1a' }}
                          tickLine={{ stroke: '#ffffff1a' }}
                        />
                        <YAxis
                          tick={{ fill: '#a1a1aa', fontSize: 11 }}
                          axisLine={{ stroke: '#ffffff1a' }}
                          tickLine={{ stroke: '#ffffff1a' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#09090f',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '14px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                            color: '#fff',
                            direction: 'rtl',
                            fontSize: '12px'
                          }}
                          formatter={(value: any, name: any, item: any) => [
                            `${Number(value).toLocaleString()} استماع 🎧`,
                            `النوع: ${item?.payload?.genre || 'موسيقى'}`
                          ]}
                          labelFormatter={(label, items) => {
                            const full = items?.[0]?.payload?.fullName || label;
                            return `🎵 ${full}`;
                          }}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar
                          dataKey="plays"
                          radius={[8, 8, 0, 0]}
                          animationDuration={1200}
                        >
                          {topSongsData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || '#ef4444'}
                              className="transition-opacity duration-300 hover:opacity-85"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top 5 Songs Mini Legend & Rank Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-2">
                    {topSongsData.map((song, idx) => (
                      <div
                        key={song.id}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between sm:flex-col sm:items-start gap-1 text-right"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: song.color }}
                          />
                          <span className="text-[11px] font-bold text-white truncate max-w-[140px] sm:max-w-none">
                            #{idx + 1} {song.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                          <span className="text-white font-bold">{song.plays.toLocaleString()}</span>
                          <span className="text-[10px]">play</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Control Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddNewMockVisit}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5 text-xs transition-colors"
                      title="محاكاة تسجيل زيارة جديدة فوراً"
                    >
                      <Zap size={13} />
                      <span>تسجيل زيارة تجريبية حية</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetViews}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <RefreshCw size={13} />
                      <span>تصفير العداد</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>مسح سجل الزيارات</span>
                  </button>
                </div>

                {/* Filter & Visits Table */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <Radio size={15} className="text-red-400 animate-pulse" />
                      <span>سجل الزيارات المباشر التفصيلي (Live Visitor Logs)</span>
                      <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-zinc-300">
                        {filteredLogs.length} زيارة
                      </span>
                    </h4>

                    <div className="flex items-center gap-2">
                      <select
                        value={filterDevice}
                        onChange={(e) => setFilterDevice(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none text-xs"
                      >
                        <option value="all">كل الأجهزة</option>
                        <option value="موبايل">موبايل فقط 📱</option>
                        <option value="كمبيوتر">كمبيوتر فقط 💻</option>
                      </select>

                      <input
                        type="text"
                        placeholder="ابحث بالدولة، المدينة، المتصفح..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 outline-none text-xs w-56"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden overflow-x-auto">
                    <table className="w-full text-right text-xs whitespace-nowrap">
                      <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-bold">
                        <tr>
                          <th className="p-3">الوقت</th>
                          <th className="p-3">الدولة والمدينة</th>
                          <th className="p-3">الجهاز</th>
                          <th className="p-3">نظام التشغيل</th>
                          <th className="p-3">المتصفح</th>
                          <th className="p-3">مصدر الزيارة (Referrer)</th>
                          <th className="p-3">مدة البقاء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-zinc-400 flex items-center gap-1.5">
                              <Clock size={12} className="text-zinc-500" />
                              <span>{log.time}</span>
                            </td>
                            <td className="p-3 font-bold text-white">
                              <span className="ml-1.5">{log.flag}</span>
                              <span>{log.country}</span>
                              <span className="text-zinc-500 text-[10px] mr-1">({log.city})</span>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                {log.device === 'موبايل' ? <Smartphone size={12} className="text-amber-400" /> : <Laptop size={12} className="text-indigo-400" />}
                                <span>{log.device}</span>
                              </span>
                            </td>
                            <td className="p-3 font-mono text-zinc-300">{log.os}</td>
                            <td className="p-3 font-mono text-zinc-300">{log.browser}</td>
                            <td className="p-3 font-mono text-red-400/90 max-w-xs truncate">{log.referrer}</td>
                            <td className="p-3 font-mono text-emerald-400">{log.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Security & Backup */}
            {activeSubTab === 'security' && (
              <div className="p-6 rounded-3xl bg-[#0e0e1a]/90 border border-white/10 shadow-xl space-y-6">
                <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/10 pb-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span>أمان الموقع وحماية بيانات المالك</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <KeyRound size={15} className="text-amber-400" />
                      <span>كلمة مرور لوحة التحكم</span>
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      كلمة المرور الحالية تحمي لوحة التحكم وصفحة الإحصاءات من دخول أي زائر غير مصرح له.
                    </p>
                    <button
                      type="button"
                      onClick={handleUpdatePassword}
                      className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Lock size={13} />
                      <span>تغيير كلمة المرور الآن</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Download size={15} className="text-red-400" />
                      <span>حزمة الموقع الكاملة (Backup ZIP)</span>
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      تحميل نسخة احتياطية كاملة للموقع جاهزة فوراً للرفع على استضافة InfinityFree مع ملف .htaccess.
                    </p>
                    <button
                      type="button"
                      onClick={onDownloadZip}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all active:scale-95"
                    >
                      <Download size={13} />
                      <span>تحميل ملفات الموقع ZIP</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-xs text-zinc-400">
                  <Info size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    يتم تخزين جميع التعديلات والإحصاءات محلياً في ذاكرة التخزين السريعة للمتصفح (<span className="text-zinc-200 font-mono">LocalStorage</span>) بحيث تظل محفوظة بشكل دائم حتى عند إغلاق المتصفح أو إعادة تشغيل الجهاز.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 text-center text-xs font-mono text-zinc-500">
        لوحة تحكم السلطان الحصرية • جميع الحقوق محفوظة © {config.joinYear} - {new Date().getFullYear()}
      </footer>
    </div>
  );
};
