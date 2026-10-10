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
  Loader2,
  Maximize2,
  Bot,
  Swords
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SiteConfig, SongTrack } from './types';
import { SultanLogo } from './components/SultanLogo';
import { DiscordProfileCard } from './components/DiscordProfileCard';
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
import { RoyalTicTacToeModal } from './components/RoyalTicTacToeModal';
import { SultanAICompanionModal } from './components/SultanAICompanionModal';
import { VisitorLoyaltyModal } from './components/VisitorLoyaltyModal';
import { ZenImmersionOverlay } from './components/ZenImmersionOverlay';
import { recordAndGetLoyalty, VisitorLoyaltyState } from './utils/visitorLoyalty';
import { defaultGamerHub } from './data/defaultGamerHub';
import { defaultDailyStory, defaultDiscordRadar } from './data/defaultDailyStory';
import { getTheme } from './utils/themeSystem';
import { ThemeId } from './types';
import { setupMidnightReportTimer } from './utils/discordWebhook';
import { audioEngine } from './utils/audioEngine';
import { generateFullApplicationSourceZip } from './utils/exactAppBuilder';
import { recordSiteLog, getCurrentClientEnv } from './utils/siteLogger';
import { sendEmailNotification } from './utils/emailNotifier';
import { useEcoMode } from './hooks/useEcoMode';
import { EcoModeToggle } from './components/EcoModeToggle';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MusicVaultView } from './components/MusicVaultView';
import { SecretsMinigamesView } from './components/SecretsMinigamesView';
import { SectionModal } from './components/SectionModal';
import { safeLocalStorage, safeSessionStorage } from './utils/safeStorage';
import {
  subscribeToGlobalConfig,
  saveGlobalConfigToCloud,
  incrementGlobalViews,
  incrementGlobalUpvotes,
  startVisitorPresenceHeartbeat
} from './services/firebase';

export default function App() {
  const { isEcoMode, toggleEcoMode, battery } = useEcoMode();
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // Only show loading screen once per session
    return !safeSessionStorage.getItem('sultan_session_loaded');
  });
  const [config, setConfig] = useState<SiteConfig>(() => {
    const saved = safeLocalStorage.getItem('sultan_site_config');
    const localTheme = (safeLocalStorage.getItem('sultan_theme') as ThemeId) || null;
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
      bgStyle: (safeLocalStorage.getItem('sultan_bg_style') as 'particle' | 'static' | 'glow') || 'particle',
      countdownDate: '2027-08-25T00:00',
      countdownLabel: 'طريق الثانوية العامة والهدف 🎯',
      musicAutoPlay: false,
      defaultVolume: 0.45,
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

  // Features States:
  const [isTicTacToeOpen, setIsTicTacToeOpen] = useState<boolean>(false);
  const [isAICompanionOpen, setIsAICompanionOpen] = useState<boolean>(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [visitorLoyalty, setVisitorLoyalty] = useState<VisitorLoyaltyState>(() => recordAndGetLoyalty());

  const toggleZenMode = () => {
    audioEngine.playPowerUpSound();
    setIsZenMode((prev) => !prev);
  };

  // Keyboard shortcut: Z key toggles Zen Immersion mode
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.key === 'z' || e.key === 'Z') && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleZenMode();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Real-time synchronization with Cloud Firestore
  // When Sultan updates anything in Admin, it updates for everyone in real time!
  useEffect(() => {
    const unsubscribe = subscribeToGlobalConfig((cloudConfig) => {
      if (cloudConfig && typeof cloudConfig === 'object') {
        setConfig((prev) => {
          const merged = { ...prev, ...cloudConfig };
          try {
            safeLocalStorage.setItem('sultan_site_config', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });

    // Increment global live views once per visitor session
    if (!safeSessionStorage.getItem('sultan_view_logged')) {
      safeSessionStorage.setItem('sultan_view_logged', 'true');
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

      // Check Secret VIP Role keyword: ONLY "sultan" (as requested: only when told in real life)
      if (keyBuffer.endsWith('sultan')) {
        keyBuffer = '';
        audioEngine.playRoyalFanfare();
        confetti({ particleCount: 110, spread: 95, origin: { y: 0.5 } });
        setEasterEggBanner({
          title: '👑 مفاجأة السلطان السرية!',
          subtitle: 'تم فتح رتبة الـ VIP بالديسكورد الخاصة بك',
          emoji: '💎'
        });
        setTimeout(() => setEasterEggBanner(null), 3500);
        setIsSecretRoleModalOpen(true);
        recordSiteLog('كشف رتبة السلطان 👑', 'فتح نافذة رتبة VIP بالديسكورد عبر كتابة كلمة sultan');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [currentPage, setCurrentPage] = useState<'home' | 'admin'>(() => {
    return window.location.hash === '#admin' || window.location.pathname === '/admin' ? 'admin' : 'home';
  });
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [activeModalSection, setActiveModalSection] = useState<'music' | 'gaming' | 'secrets' | null>(null);
  const [isGameOpen, setIsGameOpen] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<'up' | 'down' | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [typedBio, setTypedBio] = useState<string>('');
  const [easterEggBanner, setEasterEggBanner] = useState<{ title: string; subtitle: string; emoji: string } | null>(null);
  const [countdownString, setCountdownString] = useState<string>('');
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [musicTempo, setMusicTempo] = useState<number>(128);

  // Sync music playing state globally from audioEngine
  useEffect(() => {
    return audioEngine.subscribePlayState((playing) => {
      setIsMusicPlaying(playing);
    });
  }, []);
  // Dispatch visitor entry and persist live stats safely
  useEffect(() => {
    // Record real visit once per user session
    const visitLoggedKey = 'sultan_session_visit_logged';
    if (!safeSessionStorage.getItem(visitLoggedKey)) {
      safeSessionStorage.setItem(visitLoggedKey, 'true');
      try {
        const savedViews = safeLocalStorage.getItem('sultan_site_views');
        const currentViews = savedViews !== null ? parseInt(savedViews, 10) : 0;
        safeLocalStorage.setItem('sultan_site_views', (currentViews + 1).toString());

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

    const savedRating = safeLocalStorage.getItem('sultan_site_rating') as 'up' | 'down' | null;
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

  const handleAvatarCelebration = () => {
    audioEngine.playRoyalFanfare();
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    setEasterEggBanner({
      title: '👑 سلطان • SULTAN',
      subtitle: 'العرش الملكي والساحة الحصرية 🦾',
      emoji: '👑'
    });
    setTimeout(() => setEasterEggBanner(null), 2500);
  };

  const handleCardMouseMove = (_e: React.MouseEvent<HTMLDivElement>) => {
    // 3D Parallax tilt disabled as requested
  };

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleRate = (choice: 'up' | 'down') => {
    audioEngine.playClickSound();
    setHasRated(choice);
    safeLocalStorage.setItem('sultan_site_rating', choice);
    if (choice === 'up') {
      recordSiteLog('تقييم إيجابي 👍', 'تصويت إيجابي وإبداء الإعجاب بالموقع الملكي');
      audioEngine.playNotificationPing();
      confetti({ particleCount: 60, spread: 75, origin: { y: 0.8 } });
      incrementGlobalUpvotes();
      try {
        const currentUpvotes = parseInt(safeLocalStorage.getItem('sultan_site_upvotes') || '0', 10);
        safeLocalStorage.setItem('sultan_site_upvotes', (currentUpvotes + 1).toString());
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
      <BackgroundCanvas effect={config.bgEffect} accentColor={themeAccent} ecoMode={isEcoMode} />

      {/* Ambient background glows */}
      <div
        className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-25 pointer-events-none z-0 transition-colors duration-700"
        style={{ background: themeAccent }}
      />
      <div
        className="fixed bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full blur-[140px] opacity-20 pointer-events-none z-0 transition-colors duration-700"
        style={{ background: activeTheme.secondaryHex }}
      />

      {/* Top Banner: Unified Control Capsule + Royal Brand (Feature 3) */}
      <header className="relative z-20 w-full border-b border-white/5 bg-black/75 backdrop-blur-xl px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4 text-xs">
          {/* Brand & Live status */}
          <div className="flex items-center gap-2 text-zinc-300 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_#10b981]" />
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="font-black text-white text-xs sm:text-sm tracking-wide">سلطان • SULTAN</span>
              <span className="text-zinc-300 font-mono text-[10px] sm:text-xs hidden xs:inline font-medium">
                {config.footerDomain || 'sultansusu.vercel.app'}
              </span>
            </div>
          </div>

          {/* Unified Quick Controls Capsule (Feature 3) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-inner shrink-0">
            {/* Eco Mode / Performance Mode Switcher */}
            <EcoModeToggle
              isEcoMode={isEcoMode}
              onToggle={toggleEcoMode}
              battery={battery}
            />

            {/* In-App PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Feature 9: Zen Immersion Mode Switcher */}
            <button
              onClick={toggleZenMode}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                isZenMode
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 border-white/10 hover:bg-white/15 text-zinc-300 hover:text-white'
              }`}
              title="وضع المسرح والاسترخاء الملكي (اضغط Z)"
            >
              <Maximize2 size={13} />
              <span className="hidden sm:inline font-mono text-[10px]">Zen</span>
            </button>

            {/* Theme Picker */}
            <ThemeSwitcher
              currentTheme={config.theme}
              onThemeChange={(newTh) => {
                setConfig((prev) => {
                  const updated = { ...prev, theme: newTh };
                  safeLocalStorage.setItem('sultan_site_config', JSON.stringify(updated));
                  return updated;
                });
              }}
            />

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-600/15 border border-red-500/20 text-red-300 font-bold text-[10px] sm:text-[11px] font-mono shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
              <span>𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪</span>
            </div>
          </div>
        </div>
      </header>

      {/* Secret Easter Egg Pop Banner */}
      {easterEggBanner && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce px-3 max-w-sm w-full">
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-black/90 border border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.6)] backdrop-blur-xl flex items-center gap-3">
            <span className="text-2xl sm:text-3xl shrink-0">{easterEggBanner.emoji}</span>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm sm:text-base truncate">{easterEggBanner.title}</p>
              <p className="text-[11px] sm:text-xs text-zinc-300 truncate">{easterEggBanner.subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-3.5 sm:px-4 md:px-6 py-3 sm:py-5 flex flex-col items-center justify-start gap-4 sm:gap-5 pb-12 sm:pb-14">
        {/* Core Profile Card with Interactive Capsules inside */}
        <DiscordProfileCard
          config={config}
          typedBio={typedBio}
          countdownString={countdownString}
          isMusicPlaying={isMusicPlaying}
          musicTempo={musicTempo}
          tilt={isEcoMode ? { x: 0, y: 0 } : tilt}
          onAvatarClick={handleAvatarCelebration}
          onShare={handleSharePage}
          copiedLink={copiedLink}
          hasRated={hasRated}
          onRate={handleRate}
          onMouseMove={isEcoMode ? () => {} : handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          cardRef={cardRef}
          isEcoMode={isEcoMode}
          onOpenMusic={() => setActiveModalSection('music')}
          onOpenGaming={() => setActiveModalSection('gaming')}
          onOpenSecrets={() => setActiveModalSection('secrets')}
          visitorLoyalty={visitorLoyalty}
          onOpenLoyaltyModal={() => setIsLoyaltyModalOpen(true)}
          onOpenAICompanion={() => setIsAICompanionOpen(true)}
        />
      </main>

      {/* Floating Action Button: Feature 12 - Sultan's AI Persona Companion */}
      <button
        onClick={() => {
          audioEngine.playPowerUpSound();
          setIsAICompanionOpen(true);
        }}
        className="fixed bottom-5 right-5 z-40 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-2xl shadow-red-600/50 flex items-center gap-2 border border-red-400/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
        title="تحدث مع مساعد السلطان الذكي (AI Persona)"
      >
        <div className="relative">
          <Bot size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 border border-black absolute -top-0.5 -right-0.5 animate-ping" />
        </div>
        <span className="font-display-custom tracking-wide">مساعد السلطان 🤖</span>
      </button>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs font-mono-custom text-zinc-400 border-t border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2">
          <span>{config.footerDomain}</span>
          <span>•</span>
          <span className="text-red-400 font-bold">𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪</span>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {/* Interactive Section Modals (مربعات ومستطيلات المحتوى زي الرادار) */}
      <SectionModal
        isOpen={activeModalSection === 'music'}
        onClose={() => setActiveModalSection(null)}
        title="مكتبة الموسيقى والأغاني الملكية 🎵"
        subtitle="تصفح مشغل الأغاني، الكلمات الحصرية، والتحكم بالصوت"
        icon={<Music size={20} />}
        accentColor={themeAccent}
      >
        <MusicVaultView tracks={config.tracks} accentColor={themeAccent} isEcoMode={isEcoMode} />
      </SectionModal>

      <SectionModal
        isOpen={activeModalSection === 'gaming'}
        onClose={() => setActiveModalSection(null)}
        title="منصة وبطولات الجيمنج 🎮"
        subtitle="حسابات وإعدادات ألعاب السلطان ومواصفات جهاز الكمبيوتر"
        icon={<Gamepad2 size={20} />}
        accentColor={themeAccent}
      >
        <GamerHub config={config.gamerHub || defaultGamerHub} theme={activeTheme} />
      </SectionModal>

      <SectionModal
        isOpen={activeModalSection === 'secrets'}
        onClose={() => setActiveModalSection(null)}
        title="لعبة وتحديات السلطان 👑"
        subtitle="لعبة ركض حصرية وتحدي تحطيم الأرقام القياسية"
        icon={<Sparkles size={20} />}
        accentColor={themeAccent}
      >
        <SecretsMinigamesView
          onOpenGame={() => {
            setActiveModalSection(null);
            audioEngine.playPowerUpSound();
            setIsGameOpen(true);
            recordSiteLog('تشغيل لعبة السلطان 🎮', 'بدء لعبة الركض من النافذة المنبثقة');
          }}
          onOpenTicTacToe={() => {
            setActiveModalSection(null);
            setIsTicTacToeOpen(true);
          }}
          accentColor={themeAccent}
        />
      </SectionModal>

      {isLoading && (
        <LoadingScreen
          onFinish={() => {
            safeSessionStorage.setItem('sultan_session_loaded', 'true');
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
        onRoleClaimed={() => {
          setIsDiscordRoleClaimed(true);
        }}
      />
      <SultanGame isOpen={isGameOpen} onClose={() => setIsGameOpen(false)} />
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onSaveConfig={(newCfg) => {
          setConfig(newCfg);
          if (newCfg.bgStyle) {
            safeLocalStorage.setItem('sultan_bg_style', newCfg.bgStyle);
          }
        }}
      />
      <RoyalTicTacToeModal
        isOpen={isTicTacToeOpen}
        onClose={() => setIsTicTacToeOpen(false)}
      />
      <SultanAICompanionModal
        isOpen={isAICompanionOpen}
        onClose={() => setIsAICompanionOpen(false)}
        onOpenMusicModal={() => setActiveModalSection('music')}
        onOpenGameModal={() => setIsGameOpen(true)}
      />
      <VisitorLoyaltyModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        loyalty={visitorLoyalty}
      />
      <ZenImmersionOverlay
        isOpen={isZenMode}
        onClose={() => setIsZenMode(false)}
        accentColor={themeAccent}
        tracks={config.tracks}
        countdownDate={config.countdownDate}
        countdownLabel={config.countdownLabel}
      />
      <OfflineIndicator />
    </div>
  );
}
