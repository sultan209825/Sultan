import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Gamepad2,
  Share2,
  Check,
  Flame,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Settings,
  Music,
  ExternalLink,
  Crown,
  Download,
  Package,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SiteConfig, SongTrack } from './types';
import { SultanLogo } from './components/SultanLogo';
import { DiscordProfileCard } from './components/DiscordProfileCard';
import { CornerMusicPlayer } from './components/CornerMusicPlayer';
import { DiscordSecretRoleModal, getRoleClaimStatus } from './components/DiscordSecretRoleModal';
import { SultanGame } from './components/SultanGame';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { AdminModal } from './components/AdminModal';
import { AdminPage } from './components/AdminPage';
import { CustomContextMenu } from './components/CustomContextMenu';
import { CustomCursorEffects } from './components/CustomCursorEffects';
import { GlobalCustomTooltip } from './components/GlobalCustomTooltip';
import { LoadingScreen } from './components/LoadingScreen';
import { GamerHub } from './components/GamerHub';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { defaultGamerHub } from './data/defaultGamerHub';
import { defaultDailyStory, defaultDiscordRadar } from './data/defaultDailyStory';
import { getTheme } from './utils/themeSystem';
import { ThemeId } from './types';
import { setupMidnightReportTimer } from './utils/discordWebhook';
import { audioEngine } from './utils/audioEngine';
import { generateFullApplicationSourceZip } from './utils/exactAppBuilder';
import { recordSiteLog, getCurrentClientEnv } from './utils/siteLogger';
import { sendEmailNotification } from './utils/emailNotifier';
import {
  subscribeToGlobalConfig,
  saveGlobalConfigToCloud,
  incrementGlobalViews,
  incrementGlobalUpvotes,
  startVisitorPresenceHeartbeat
} from './services/firebase';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // Only show loading screen once per session
    return !sessionStorage.getItem('sultan_session_loaded');
  });
  const [config, setConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem('sultan_site_config');
    const localTheme = (localStorage.getItem('sultan_theme') as ThemeId) || null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.footerDomain === 'sultan.kesug.com') {
          parsed.footerDomain = 'sultansusu.vercel.app';
        }
        if (!parsed.gamerHub) {
          parsed.gamerHub = defaultGamerHub;
        }
        if (!parsed.dailyStory) {
          parsed.dailyStory = defaultDailyStory;
        }
        if (!parsed.discordRadar) {
          parsed.discordRadar = defaultDiscordRadar;
        }
        if (localTheme) {
          parsed.theme = localTheme;
        }
        return parsed;
      } catch {}
    }
    return {
      username: '! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪',
      handle: '5susu',
      bio: '3 ثانوي 📖 + GYM 🦾',
      joinYear: '2020',
      footerDomain: 'sultansusu.vercel.app',
      theme: localTheme || 'blood_royal',
      gamerHub: defaultGamerHub,
      dailyStory: defaultDailyStory,
      discordRadar: defaultDiscordRadar,
      bgEffect: 'auto',
      bgStyle: (localStorage.getItem('sultan_bg_style') as 'particle' | 'static' | 'glow') || 'particle',
      countdownDate: '2027-08-25T00:00',
      countdownLabel: 'طريق الثانوية العامة والهدف 🎯',
      socials: {
        tiktok: 'https://www.tiktok.com/@mohamed0_0hamdy',
        discord: 'https://discord.gg/TUU6EeC6pb'
      },
      socialsEnabled: {
        tiktok: true,
        discord: true
      },
      emailNotifications: {
        enabled: true,
        email: 'sultan209825@gmail.com',
        notifyOnAdminLogin: true,
        notifyOnVipRoleClaim: true
      }
    };
  });

  const [isSecretRoleModalOpen, setIsSecretRoleModalOpen] = useState<boolean>(false);
  const [isDiscordRoleClaimed, setIsDiscordRoleClaimed] = useState<boolean>(() => {
    return getRoleClaimStatus().isClaimed;
  });

  // Real-time synchronization with Cloud Firestore
  // When Sultan updates anything in Admin, it updates for everyone in real time!
  useEffect(() => {
    const unsubscribe = subscribeToGlobalConfig((cloudConfig) => {
      if (cloudConfig && typeof cloudConfig === 'object') {
        setConfig((prev) => {
          const merged = { ...prev, ...cloudConfig };
          try {
            localStorage.setItem('sultan_site_config', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });

    // Increment global live views once per visitor session
    if (!sessionStorage.getItem('sultan_view_logged')) {
      sessionStorage.setItem('sultan_view_logged', 'true');
      incrementGlobalViews();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-Time Online Presence Heartbeat for Active Visitors Tracking
  useEffect(() => {
    const env = getCurrentClientEnv();
    const cleanup = startVisitorPresenceHeartbeat({
      device: env.device,
      browser: env.browser,
      os: env.os,
      currentPath: window.location.hash || '/'
    });
    return () => cleanup();
  }, []);

  // Periodically check 1-hour expiration so button reactivates on the hour
  useEffect(() => {
    const timer = setInterval(() => {
      const claimInfo = getRoleClaimStatus();
      if (claimInfo.isClaimed !== isDiscordRoleClaimed) {
        setIsDiscordRoleClaimed(claimInfo.isClaimed);
      }
    }, 20000);
    return () => clearInterval(timer);
  }, [isDiscordRoleClaimed]);

  // Secret codewords listeners (only Sultan knows):
  // 1. "susu" or "admin" -> Opens Admin Panel
  // 2. "vip" or "sultan" or "king" -> Opens Sultan's Secret VIP Role Modal
  useEffect(() => {
    let keyBuffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > 12) {
        keyBuffer = keyBuffer.slice(-12);
      }

      // Check Admin secret keywords: "susu" or "admin"
      if (keyBuffer.endsWith('susu') || keyBuffer.endsWith('admin')) {
        keyBuffer = '';
        audioEngine.playRoyalFanfare();
        confetti({ particleCount: 90, spread: 85, origin: { y: 0.5 } });
        setEasterEggBanner({
          title: '👑 تم فتح لوحة الإدارة بالكلمة السرية!',
          subtitle: 'مرحباً بك يا سلطان في لوحة التحكم والإحصاءات',
          emoji: '🔓'
        });
        setTimeout(() => setEasterEggBanner(null), 3500);
        window.location.hash = 'admin';
        setCurrentPage('admin');
        recordSiteLog('دخول الأدمن 🔐', 'فتح لوحة الإدارة عبر الكلمة السرية (SuSu)');
        sendEmailNotification({
          eventType: 'admin_login',
          title: '🚨 تنبيه أمني: دخول شخص إلى لوحة الإدارة',
          details: 'تم الدخول إلى لوحة إدارة بروفايل السلطان باستخدام الكلمة السرية (SuSu).'
        });
        return;
      }

      // Check VIP Role secret keywords: "vip" or "sultan" or "king"
      if (keyBuffer.endsWith('vip') || keyBuffer.endsWith('sultan') || keyBuffer.endsWith('king')) {
        keyBuffer = '';
        audioEngine.playRoyalFanfare();
        confetti({ particleCount: 110, spread: 95, origin: { y: 0.5 } });
        setEasterEggBanner({
          title: '👑 تم تفعيل مفاجأة السلطان السرية!',
          subtitle: 'جارٍ فتح نافذة رتبة VIP بالديسكورد الخاصة بك',
          emoji: '✨'
        });
        setTimeout(() => setEasterEggBanner(null), 3500);
        setIsSecretRoleModalOpen(true);
        recordSiteLog('مفاجأة VIP 👑', 'فتح نافذة رتبة VIP بالديسكورد عبر الكلمة السرية');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [activeTab, setActiveTab] = useState<'profile' | 'lyrics'>('profile');
  const [currentPage, setCurrentPage] = useState<'home' | 'admin'>(() => {
    return window.location.hash === '#admin' || window.location.pathname === '/admin' ? 'admin' : 'home';
  });
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isGameOpen, setIsGameOpen] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<'up' | 'down' | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [typedBio, setTypedBio] = useState<string>('');
  const [easterEggBanner, setEasterEggBanner] = useState<{ title: string; subtitle: string; emoji: string } | null>(null);
  const [countdownString, setCountdownString] = useState<string>('');
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [musicTempo, setMusicTempo] = useState<number>(128);
  // Dispatch visitor entry and persist live stats safely
  useEffect(() => {
    // Record real visit once per user session
    const visitLoggedKey = 'sultan_session_visit_logged';
    if (!sessionStorage.getItem(visitLoggedKey)) {
      sessionStorage.setItem(visitLoggedKey, 'true');
      try {
        const savedViews = localStorage.getItem('sultan_site_views');
        const currentViews = savedViews !== null ? parseInt(savedViews, 10) : 0;
        localStorage.setItem('sultan_site_views', (currentViews + 1).toString());

        recordSiteLog('زيارة الموقع 🌍', 'دخول زائر حقيقي إلى الصفحة الرئيسية', {
          duration: 'جلسة نشطة'
        });
      } catch {}
    }
  }, []);

  // Setup automated 12:00 AM Midnight Daily Report Scheduler
  useEffect(() => {
    if (config.discordWebhookEnabled && config.discordWebhookUrl) {
      const cleanup = setupMidnightReportTimer();
      return () => cleanup();
    }
  }, [config.discordWebhookEnabled, config.discordWebhookUrl]);

  const handleDownloadInfinityFreeZip = async () => {
    try {
      setIsGeneratingZip(true);
      audioEngine.playClickSound();
      recordSiteLog('تحميل ZIP 📦', 'تحميل حزمة كود وبناء المشروع الكاملة للاستضافة');
      const zipBlob = await generateFullApplicationSourceZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sultan-infinityfree-htdocs.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      audioEngine.playRoyalFanfare();
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      setEasterEggBanner({
        title: '📦 تم تجهيز وتحميل ملف الـ ZIP بنجاح!',
        subtitle: 'افتح ملف sultan-infinityfree-htdocs.zip وارفع محتوياته إلى htdocs',
        emoji: '✅'
      });
      setTimeout(() => setEasterEggBanner(null), 4500);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تجميع ملف الـ ZIP');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // 3D Card Tilt State
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Typewriter bio effect
  useEffect(() => {
    let currentIdx = 0;
    const fullText = config.bio;
    setTypedBio('');

    const interval = setInterval(() => {
      if (currentIdx < fullText.length) {
        setTypedBio(fullText.slice(0, currentIdx + 1));
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [config.bio]);

  // Hash change and saved rating initialization
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentPage('admin');
        sendEmailNotification({
          eventType: 'admin_login',
          title: '🚨 تنبيه أمني: دخول شخص إلى لوحة الإدارة',
          details: 'تم الدخول إلى لوحة إدارة بروفايل السلطان عبر رابط مباشر (#admin).'
        });
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    const savedRating = localStorage.getItem('sultan_site_rating') as 'up' | 'down' | null;
    if (savedRating) setHasRated(savedRating);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Countdown calculations
  useEffect(() => {
    const updateCountdown = () => {
      if (!config.countdownDate) {
        setCountdownString('');
        return;
      }
      const target = new Date(config.countdownDate).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setCountdownString('وصلنا للهدف! 🎉');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setCountdownString(`${days} يوم و ${hours} ساعة و ${minutes} دقيقة`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [config.countdownDate]);

  // Secret Easter Egg words: 'sultan', 'vip', 'party', 'game'
  useEffect(() => {
    let keyBuffer = '';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.length === 1) {
        keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-10);

        if (keyBuffer.endsWith('sultan')) {
          triggerSecret('sultan');
          keyBuffer = '';
        } else if (keyBuffer.endsWith('vip')) {
          triggerSecret('vip');
          keyBuffer = '';
        } else if (keyBuffer.endsWith('party')) {
          triggerSecret('party');
          keyBuffer = '';
        } else if (keyBuffer.endsWith('game')) {
          triggerSecret('game');
          keyBuffer = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerSecret = (type: 'sultan' | 'vip' | 'party' | 'game') => {
    audioEngine.playRoyalFanfare();

    // Persist stats in localStorage for live analytics
    let currentSecretCount = 1;
    try {
      const saved = localStorage.getItem('sultan_egg_triggers');
      const parsed = saved ? JSON.parse(saved) : { sultan: 0, game: 0 };
      parsed[type] = (parsed[type] || 0) + 1;
      currentSecretCount = parsed[type];
      localStorage.setItem('sultan_egg_triggers', JSON.stringify(parsed));
    } catch {}

    if (type === 'sultan') {
      recordSiteLog('كشف سر سلطان 👑', 'كتابة كلمة سلطان الملكية أو النقر على التاج الملكي');
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      setEasterEggBanner({
        title: '👑 وصل السلطان!',
        subtitle: 'صاحب الساحة والكلمة المسموعة في كل مكان',
        emoji: '👑'
      });
    } else if (type === 'game') {
      recordSiteLog('فتح لعبة 🎮', 'تشغيل لعبة الركض وتخطي الحواجز الخاصة بالسلطان');
      setIsGameOpen(true);
      return;
    } else if (type === 'vip') {
      recordSiteLog('كشف سر 🌟', 'تفعيل سر الـ VIP الملكي');
    } else if (type === 'party') {
      recordSiteLog('كشف سر 🎉', 'تفعيل احتفال الألوان الملكي');
    }

    setTimeout(() => setEasterEggBanner(null), 3000);
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 8, y: -y * 8 });
  };

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleRate = (choice: 'up' | 'down') => {
    audioEngine.playClickSound();
    setHasRated(choice);
    localStorage.setItem('sultan_site_rating', choice);
    if (choice === 'up') {
      recordSiteLog('تقييم إيجابي 👍', 'تصويت إيجابي وإبداء الإعجاب بالموقع الملكي');
      audioEngine.playNotificationPing();
      confetti({ particleCount: 60, spread: 75, origin: { y: 0.8 } });
      incrementGlobalUpvotes();
      try {
        const currentUpvotes = parseInt(localStorage.getItem('sultan_site_upvotes') || '0', 10);
        localStorage.setItem('sultan_site_upvotes', (currentUpvotes + 1).toString());
      } catch {}
      setEasterEggBanner({
        title: '👑 تسلم يا غالي على تقييمك الملكي!',
        subtitle: 'تم تسجيل إعجابك في إحصائيات الموقع بنجاح',
        emoji: '👍'
      });
      setTimeout(() => setEasterEggBanner(null), 3000);
    } else {
      recordSiteLog('ملاحظة تطويرية 💡', 'تسجيل ملاحظة تطويرية للموقع');
      setEasterEggBanner({
        title: '🤝 شكراً لرأيك الصريح!',
        subtitle: 'تم تسجيل ملاحظتك ودايماً بنطور الموقع لعيونك',
        emoji: '💡'
      });
      setTimeout(() => setEasterEggBanner(null), 3000);
    }
  };

  const handleSharePage = async () => {
    audioEngine.playClickSound();
    recordSiteLog('مشاركة رابط 🔗', 'النقر على زر مشاركة رابط الموقع أو نسخه');
    const shareUrl = window.location.origin;

    let shared = false;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪 - الموقع الرسمي',
          text: 'الموقع الرسمي لـ سلطان: أحدث الأغاني الملكية، الديسكورد والأسرار',
          url: shareUrl
        });
        shared = true;
      } catch {
        shared = false;
      }
    }

    if (!shared) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          throw new Error('Fallback needed');
        }
      } catch {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      audioEngine.playRoyalFanfare();
      setEasterEggBanner({
        title: '📋 تم نسخ رابط الموقع بنجاح!',
        subtitle: 'شاركه الآن مع أصدقائك في ديسكورد وواتساب',
        emoji: '🔗'
      });
      setTimeout(() => {
        setCopiedLink(false);
        setEasterEggBanner(null);
      }, 3000);
    }
  };

  const activeTheme = getTheme(config.theme);
  const themeAccent = activeTheme.accentHex;

  // Standalone dedicated page for Settings & Analytics
  if (currentPage === 'admin') {
    return (
      <AdminPage
        config={config}
        onSaveConfig={(newCfg) => {
          setConfig(newCfg);
          try {
            localStorage.setItem('sultan_site_config', JSON.stringify(newCfg));
          } catch {}
          saveGlobalConfigToCloud(newCfg);
        }}
        onBackToHome={() => {
          window.location.hash = '';
          setCurrentPage('home');
        }}
        onDownloadZip={handleDownloadInfinityFreeZip}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#06060a] text-zinc-100 flex flex-col justify-between selection:bg-red-500/30 selection:text-white relative overflow-hidden">
      {/* Background Interactive Particles */}
      <BackgroundCanvas effect={config.bgEffect} accentColor={themeAccent} />

      {/* Ambient background glows */}
      <div
        className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-25 pointer-events-none z-0 transition-colors duration-700"
        style={{ background: themeAccent }}
      />
      <div
        className="fixed bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full blur-[140px] opacity-20 pointer-events-none z-0 transition-colors duration-700"
        style={{ background: activeTheme.secondaryHex }}
      />

      {/* Top Banner: Elegant Sultan Branding with Theme Switcher */}
      <header className="relative z-20 w-full border-b border-white/5 bg-black/60 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white hidden sm:inline">سلطان • SULTAN</span>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-300 font-mono-custom truncate">{config.footerDomain || 'sultansusu.vercel.app'}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeSwitcher
              currentTheme={config.theme}
              onThemeChange={(newTh) => {
                setConfig((prev) => {
                  const updated = { ...prev, theme: newTh };
                  localStorage.setItem('sultan_site_config', JSON.stringify(updated));
                  return updated;
                });
              }}
            />
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
              <span className="text-zinc-300 font-bold">𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪</span>
            </div>
          </div>
        </div>
      </header>

      {/* Secret Easter Egg Pop Banner */}
      {easterEggBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-6 py-3 rounded-2xl bg-black/90 border border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.6)] backdrop-blur-xl flex items-center gap-3">
            <span className="text-3xl">{easterEggBanner.emoji}</span>
            <div>
              <p className="font-bold text-white text-base">{easterEggBanner.title}</p>
              <p className="text-xs text-zinc-400">{easterEggBanner.subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col items-center justify-center gap-6">
        <DiscordProfileCard
          config={config}
          typedBio={typedBio}
          countdownString={countdownString}
          isMusicPlaying={isMusicPlaying}
          musicTempo={musicTempo}
          tilt={tilt}
          onAvatarClick={() => triggerSecret('sultan')}
          onShare={handleSharePage}
          copiedLink={copiedLink}
          hasRated={hasRated}
          onRate={handleRate}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          cardRef={cardRef}
        />

        {/* Gamer Showcase Card (Feature 5) */}
        <GamerHub config={config.gamerHub || defaultGamerHub} theme={activeTheme} />
      </main>

      {/* Floating Corner Music Player (Dedicated in corner, perfectly styled) */}
      <CornerMusicPlayer
        accentColor={themeAccent}
        onPlayStateChange={(playing) => setIsMusicPlaying(playing)}
      />

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs font-mono-custom text-zinc-400 border-t border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2">
          <span>{config.footerDomain}</span>
          <span>•</span>
          <span className="text-red-400 font-bold">𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪</span>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {isLoading && (
        <LoadingScreen
          onFinish={() => {
            sessionStorage.setItem('sultan_session_loaded', 'true');
            setIsLoading(false);
          }}
        />
      )}
      <CustomCursorEffects />
      <GlobalCustomTooltip />
      <CustomContextMenu
        onOpenGame={() => {
          audioEngine.playClickSound();
          setIsGameOpen(true);
          recordSiteLog('تشغيل لعبة السلطان 🎮', 'بدء لعبة الركض من القائمة السريعة');
        }}
        onShare={handleSharePage}
        discordUrl={config.socials?.discord || 'https://discord.gg/TUU6EeC6pb'}
      />
      <DiscordSecretRoleModal
        isOpen={isSecretRoleModalOpen}
        onClose={() => setIsSecretRoleModalOpen(false)}
        discordUrl={config.discordAutoRole?.inviteUrl || config.socials?.discord || 'https://discord.gg/TUU6EeC6pb'}
        roleName={config.discordAutoRole?.roleName || '𓆩𝑺𝒖𝒍𝒕𝒂𝒏 VIP𓆪'}
        isRoleClaimed={isDiscordRoleClaimed}
        onRoleClaimed={() => setIsDiscordRoleClaimed(true)}
      />
      <SultanGame isOpen={isGameOpen} onClose={() => setIsGameOpen(false)} />
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onSaveConfig={(newCfg) => {
          setConfig(newCfg);
          if (newCfg.bgStyle) {
            localStorage.setItem('sultan_bg_style', newCfg.bgStyle);
          }
        }}
      />
    </div>
  );
}
