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
  Eye,
  Settings,
  Music,
  ExternalLink,
  Crown,
  Download,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SiteConfig, SongTrack } from './types';
import { INITIAL_TRACKS } from './data/tracks';
import { SultanLogo } from './components/SultanLogo';
import { AudioPlayer } from './components/AudioPlayer';
import { DiscordCard } from './components/DiscordCard';
import { SultanGame } from './components/SultanGame';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { AdminModal } from './components/AdminModal';
import { AdminPage } from './components/AdminPage';
import { CustomContextMenu } from './components/CustomContextMenu';
import { CustomCursorEffects } from './components/CustomCursorEffects';
import { LoadingScreen } from './components/LoadingScreen';
import { sendVisitorNotificationToDiscord, VisitorInfo } from './utils/discordWebhook';
import { audioEngine } from './utils/audioEngine';
import { generateFullApplicationSourceZip } from './utils/exactAppBuilder';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // Only show loading screen once per session
    return !sessionStorage.getItem('sultan_session_loaded');
  });
  const [config, setConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem('sultan_site_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      username: '! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪',
      handle: '5susu',
      bio: '3 ثانوي 📖 + GYM 🦾',
      joinYear: '2020',
      footerDomain: 'sultan.kesug.com',
      theme: 'royal',
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
      }
    };
  });

  const [tracks, setTracks] = useState<SongTrack[]>(INITIAL_TRACKS);
  const [activeTab, setActiveTab] = useState<'profile' | 'lyrics'>('profile');
  const [currentPage, setCurrentPage] = useState<'home' | 'admin'>(() => {
    return window.location.hash === '#admin' || window.location.pathname === '/admin' ? 'admin' : 'home';
  });
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isGameOpen, setIsGameOpen] = useState<boolean>(false);
  const [viewCount, setViewCount] = useState<number>(1420);
  const [hasRated, setHasRated] = useState<'up' | 'down' | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [typedBio, setTypedBio] = useState<string>('');
  const [easterEggBanner, setEasterEggBanner] = useState<{ title: string; subtitle: string; emoji: string } | null>(null);
  const [countdownString, setCountdownString] = useState<string>('');
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [musicTempo, setMusicTempo] = useState<number>(128);
  // Dispatch visitor entry notification to Discord Webhook when enabled
  useEffect(() => {
    if (!config.discordWebhookEnabled || !config.discordWebhookUrl) return;

    // Detect visitor browser and device info
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const deviceType = isMobile ? (/iPhone|iPad|iPod/i.test(ua) ? '📱 iPhone / Apple' : '📱 Android Mobile') : '💻 PC / Desktop';
    const browser = /Edg/i.test(ua)
      ? 'Edge'
      : /Chrome/i.test(ua)
      ? 'Chrome'
      : /Safari/i.test(ua)
      ? 'Safari'
      : /Firefox/i.test(ua)
      ? 'Firefox'
      : 'Browser';

    // Only send once per session to avoid spamming the Discord channel
    const sessionKey = 'sultan_webhook_notified';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      
      const visitor: VisitorInfo = {
        name: 'زائر حقيقي جديد',
        country: 'مصر والشرق الأوسط',
        flag: '🌍',
        device: deviceType,
        browser: browser
      };

      sendVisitorNotificationToDiscord(config.discordWebhookUrl, visitor, viewCount);
    }
  }, [config.discordWebhookEnabled, config.discordWebhookUrl, viewCount]);

  const handleDownloadInfinityFreeZip = async () => {
    try {
      setIsGeneratingZip(true);
      audioEngine.playClickSound();
      const zipBlob = await generateFullApplicationSourceZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sultan-exact-studio-app.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      audioEngine.playRoyalFanfare();
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      setEasterEggBanner({
        title: '📦 تم تجهيز وتحميل ملف الـ ZIP بنجاح!',
        subtitle: 'افتح ملف sultan-exact-studio-app.zip وارفع محتوياته إلى htdocs',
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

  // Animated view counter
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    const saved = localStorage.getItem('sultan_site_views');
    const base = saved ? parseInt(saved, 10) : 1420;
    const nextViews = base + 1;
    localStorage.setItem('sultan_site_views', nextViews.toString());
    setViewCount(nextViews);

    const savedRating = localStorage.getItem('sultan_site_rating') as 'up' | 'down' | null;
    if (savedRating) setHasRated(savedRating);
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

    if (type === 'sultan') {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      setEasterEggBanner({
        title: '👑 وصل السلطان!',
        subtitle: 'صاحب الساحة والكلمة المسموعة',
        emoji: '👑'
      });
    } else if (type === 'vip') {
      confetti({ particleCount: 80, spread: 100, colors: ['#ffd700', '#26d9ff'] });
      setEasterEggBanner({
        title: '💎 رتبة VIP الملكية!',
        subtitle: 'أهلاً بك في دائرة السلطان الخاصة',
        emoji: '💎'
      });
    } else if (type === 'party') {
      confetti({ particleCount: 150, spread: 120, colors: ['#ef4444', '#7c5cff', '#26d9ff', '#ffd700'] });
      setEasterEggBanner({
        title: '🎉 ولّعت مع السلطان!',
        subtitle: 'احتفال واكتساح كامل في الساحة',
        emoji: '🔥'
      });
    } else if (type === 'game') {
      setIsGameOpen(true);
      return;
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
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
  };

  const handleSharePage = () => {
    audioEngine.playClickSound();
    if (navigator.share) {
      navigator.share({
        title: 'SULTAN - 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪',
        text: 'موقع السلطان الرسمي: أحدث الأغاني، الديسكورد والأسرار',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  const themeAccent = '#ef4444';

  // Standalone dedicated page for Settings & Analytics
  if (currentPage === 'admin') {
    return (
      <AdminPage
        config={config}
        onSaveConfig={(newCfg) => {
          setConfig(newCfg);
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
        className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-25 pointer-events-none z-0"
        style={{ background: themeAccent }}
      />
      <div
        className="fixed bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full blur-[140px] opacity-20 pointer-events-none z-0"
        style={{ background: '#26d9ff' }}
      />

      {/* Top Banner: Site Security & Auditor Alert */}
      <header className="relative z-20 w-full border-b border-white/5 bg-black/60 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white hidden sm:inline">سلطان • SULTAN</span>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-300 font-mono-custom truncate">sultan.kesug.com</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadInfinityFreeZip}
              disabled={isGeneratingZip}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all active:scale-95 text-[11px]"
              title="تحميل الموقع بالكامل كملف ZIP جاهز للرفع المباشر على استضافة InfinityFree"
            >
              {isGeneratingZip ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>تحميل ملفات الموقع ZIP</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playClickSound();
                window.location.hash = 'admin';
                setCurrentPage('admin');
              }}
              className="px-3.5 py-1.5 rounded-full bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 text-red-300 hover:text-white font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 text-[11px] shadow-sm shadow-red-500/20"
              title="صفحة التعديلات والإحصاءات المخصصة للسلطان"
            >
              <Settings size={13} className="text-red-400" />
              <span>صفحة الإدارة والإحصاءات 👑</span>
            </button>
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
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col items-center justify-center">
        {/* Main Royal Card containing Profile + Discord + Music Player */}
        <div
          ref={cardRef}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
            transition: 'transform 0.15s ease-out'
          }}
          className="w-full relative rounded-3xl bg-[#0c0c16]/85 border border-white/10 hover:border-red-500/40 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl shadow-black/80 space-y-6 transition-all duration-300"
        >
          {/* Top Laser Border Glow */}
          <div className="absolute -top-[1px] left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />

          {/* Section 1: Avatar & Crown Emblem Zone with Real ELSULTAN image with Rhythm Pulse */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`relative mb-3 group cursor-pointer transition-all duration-300 ${
                isMusicPlaying ? 'animate-beat-pulse' : ''
              }`}
              style={{
                '--pulse-speed': `${Math.max(0.38, Math.min(0.9, 60 / (musicTempo || 128)))}s`
              } as React.CSSProperties}
              onClick={() => triggerSecret('sultan')}
            >
              {/* Rotating Laser Ring */}
              <div className="absolute -inset-2 rounded-full border border-red-500/40 animate-laser pointer-events-none" />
              <div
                className={`relative w-28 h-28 rounded-full overflow-hidden bg-gradient-to-b from-[#1c1424] to-[#0e0a13] p-1 border-2 border-red-500/50 shadow-2xl flex items-center justify-center transition-all ${
                  isMusicPlaying
                    ? 'shadow-[0_0_35px_rgba(239,68,68,0.7)] border-red-500'
                    : 'shadow-red-600/30 group-hover:scale-105'
                }`}
              >
                <img
                  src="/og-image.png"
                  alt="ELSULTAN Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {/* Status Dot */}
              <span className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0c0c16] shadow-[0_0_10px_#10b981]" />
            </div>

            {/* Username & Verified Badge */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-display-custom drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                {config.username}
              </h1>
              <span
                title="موثّق رسميًا"
                className="w-5 h-5 rounded-full bg-gradient-to-r from-red-600 to-amber-500 flex items-center justify-center text-white text-[11px] shadow-md shadow-red-500/30"
              >
                ✓
              </span>
            </div>

            {/* Handle & Share */}
            <div className="flex items-center gap-2 text-xs font-mono-custom text-zinc-400 mb-3">
              <span>@{config.handle}</span>
              <span className="text-zinc-600">•</span>
              <button
                onClick={handleSharePage}
                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                title="مشاركة رابط الصفحة"
              >
                {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
                <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة'}</span>
              </button>
            </div>

            {/* Bio with typewriter cursor */}
            <div className="min-h-[30px] text-sm sm:text-base text-zinc-200 font-bold px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 inline-flex items-center justify-center gap-1 mb-4">
              <span>{typedBio}</span>
              <span className="w-1.5 h-4 bg-red-500 animate-pulse inline-block" />
            </div>

            {/* Countdown Milestone Banner */}
            {countdownString && (
              <div className="w-full mb-2 p-3 rounded-2xl bg-gradient-to-r from-red-950/40 via-purple-950/20 to-red-950/40 border border-red-500/25 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
                  <Calendar size={14} />
                  <span>{config.countdownLabel}</span>
                </div>
                <p className="text-xs font-mono-custom text-zinc-300 font-bold tracking-wide">
                  {countdownString}
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Integrated Live Discord Card inside Royal Card */}
          <div className="w-full">
            <DiscordCard onCopySuccess={() => audioEngine.playRoyalFanfare()} />
          </div>

          {/* Section 3: Integrated Full Audio Player inside Royal Card */}
          <div className="w-full">
            <AudioPlayer
              tracks={tracks}
              accentColor={themeAccent}
              onPlayStateChange={(playing, tempo) => {
                setIsMusicPlaying(playing);
                if (tempo) setMusicTempo(tempo);
              }}
            />
          </div>

          {/* Section 4: Social Channels */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            <a
              href={config.socials?.tiktok || 'https://www.tiktok.com/@mohamed0_0hamdy'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => audioEngine.playClickSound()}
              className="p-3.5 rounded-2xl bg-black/60 hover:bg-black/95 border border-white/10 hover:border-red-500/70 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1 shadow-md hover:shadow-[0_10px_25px_rgba(239,68,68,0.4)] active:scale-95 group"
            >
              <span className="text-base transition-transform duration-300 group-hover:scale-125">🎵</span>
              <span className="group-hover:text-red-300 transition-colors">تيك توك (@mohamed0_0hamdy)</span>
            </a>

            <a
              href={config.socials?.discord || 'https://discord.gg/TUU6EeC6pb'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => audioEngine.playClickSound()}
              className="p-3.5 rounded-2xl bg-[#5865F2]/20 hover:bg-[#5865F2]/40 border border-[#5865F2]/40 hover:border-[#5865F2] flex items-center justify-center gap-2 text-xs font-bold text-indigo-200 hover:text-white transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1 shadow-md hover:shadow-[0_10px_25px_rgba(88,101,242,0.45)] active:scale-95 group"
            >
              <span className="text-base transition-transform duration-300 group-hover:scale-125">💬</span>
              <span className="group-hover:text-indigo-100 transition-colors">سيرفر الديسكورد الرسمي</span>
            </a>
          </div>

          {/* Section 5: Statistics & Meta row */}
          <div className="w-full flex items-center justify-around py-3 border-y border-white/5 text-[11px] font-mono-custom text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Eye size={13} className="text-zinc-500" />
              <span>
                <b className="text-white">{viewCount.toLocaleString()}</b> مشاهدة
              </span>
            </div>
            <span>•</span>
            <div>
              سنة الانضمام: <b className="text-white">{config.joinYear}</b>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>السلطان في الساحة</span>
            </div>
          </div>

          {/* Section 6: Rating Section */}
          <div className="flex items-center justify-center gap-3 text-xs text-zinc-400">
            <span>رأيك في الموقع والتراكات؟</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleRate('up')}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${
                  hasRated === 'up'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                }`}
                title="عجبني جداً"
              >
                <ThumbsUp size={14} />
                <span className="font-mono-custom text-[11px]">عجبني</span>
              </button>

              <button
                onClick={() => handleRate('down')}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${
                  hasRated === 'down'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                }`}
                title="محتاج تطوير"
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Secret Easter Egg Pills for Mobile / Fast trigger */}
        <div className="w-full mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-[11px] text-zinc-400 font-mono-custom">الأسرار السريعة:</span>
          <button
            onClick={() => triggerSecret('sultan')}
            className="px-2.5 py-1 rounded-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-300 transition-transform active:scale-95"
          >
            👑 كلمة سلطان
          </button>
          <button
            onClick={() => triggerSecret('vip')}
            className="px-2.5 py-1 rounded-full bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/20 text-cyan-300 transition-transform active:scale-95"
          >
            💎 كلمة VIP
          </button>
          <button
            onClick={() => triggerSecret('party')}
            className="px-2.5 py-1 rounded-full bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-300 transition-transform active:scale-95"
          >
            🎉 كلمة Party
          </button>
          <button
            onClick={() => setIsGameOpen(true)}
            className="px-2.5 py-1 rounded-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 transition-transform active:scale-95 flex items-center gap-1"
          >
            <Gamepad2 size={13} />
            <span>لعبة الركض (Game)</span>
          </button>
        </div>
      </main>

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
      <CustomContextMenu
        onOpenSurprise={() => triggerSecret('sultan')}
        onShare={handleSharePage}
        onOpenAdmin={() => {
          window.location.hash = 'admin';
          setCurrentPage('admin');
        }}
        discordUrl={config.socials?.discord || 'https://discord.gg/TUU6EeC6pb'}
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
