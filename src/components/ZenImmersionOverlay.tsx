import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize,
  Minimize,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc,
  Sparkles,
  Crown,
  CloudRain,
  Flame,
  Radio
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { INITIAL_TRACKS } from '../data/tracks';
import { SongTrack } from '../types';

interface ZenImmersionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
  tracks?: SongTrack[];
  countdownDate?: string;
  countdownLabel?: string;
}

const SULTAN_ZEN_QUOTES = [
  '« القمة ليست مكاناً نصل إليه ونستريح، بل موقع نبدأ منه معاركنا القادمة. » — سلطان 👑',
  '« في الجيم كما في الحياة: الألم مؤقت، والانتصار الملكي يدوم للأبد. » — 🦾',
  '« الثقة بالنفس والتركيز على الهدف هما السلاح الأقوى في كل ساحة. » — 🎯',
  '« الموسيقى ليست مجرد إيقاع، بل هي نبض المعركة ووقود الإصرار. » — 🎵',
  '« من سار على درب الهدف بقلب أسد، انحنت له كل الصعاب. » — 🦁'
];

export const ZenImmersionOverlay: React.FC<ZenImmersionOverlayProps> = ({
  isOpen,
  onClose,
  accentColor = '#ef4444',
  tracks = INITIAL_TRACKS,
  countdownDate = '2027-08-25T00:00',
  countdownLabel = 'طريق الثانوية العامة والهدف 🎯'
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => audioEngine.getIsPlaying());
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [timeString, setTimeString] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => Boolean(document.fullscreenElement));
  const [isCalmLoFi, setIsCalmLoFi] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => audioEngine.getVolume() ?? 0.6);

  const playlist = tracks && tracks.length > 0 ? tracks : INITIAL_TRACKS;
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Rotate quotes every 8 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % SULTAN_ZEN_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Live Clock updater
  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut listener (ESC to close, F to fullscreen, Space to play/pause)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTogglePlay = () => {
    audioEngine.playClickSound();
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      audioEngine.playTrack(currentTrack, () => {
        handleNextTrack();
      });
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    audioEngine.playClickSound();
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIdx);
    audioEngine.playTrack(playlist[nextIdx], () => handleNextTrack());
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    audioEngine.playClickSound();
    const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    setCurrentTrackIndex(prevIdx);
    audioEngine.playTrack(playlist[prevIdx], () => handleNextTrack());
    setIsPlaying(true);
  };

  const handleToggleCalmLoFi = () => {
    audioEngine.playClickSound();
    if (isCalmLoFi) {
      audioEngine.stopCalmLoFiAmbience();
      setIsCalmLoFi(false);
    } else {
      audioEngine.playCalmLoFiAmbience((active) => setIsCalmLoFi(active));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#040408]/95 backdrop-blur-2xl text-white flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-300 select-none overflow-hidden"
      dir="rtl"
    >
      {/* Ambient background glows */}
      <div
        className="fixed top-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-15 pointer-events-none animate-pulse"
        style={{ backgroundColor: accentColor }}
      />
      <div className="fixed bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full blur-[160px] opacity-10 bg-indigo-600 pointer-events-none" />

      {/* Top Bar: Title, Live Clock, Fullscreen & Exit */}
      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
            <Crown size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-wide text-white font-display-custom">
              وضع المسرح والاسترخاء الملكي (Zen Immersion)
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              عالم السلطان الهادئ • اضغط ESC للخروج
            </p>
          </div>
        </div>

        {/* Clock & Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{timeString}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold active:scale-95"
            title="تبديل ملء الشاشة (F)"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span className="hidden sm:inline">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              onClose();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-200 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md shadow-red-600/20"
            title="خروج من وضع المسرح (ESC)"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Centerpiece: Spinning Royal Disc + Rotating Quote + Visualizer */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 max-w-2xl mx-auto w-full py-6">
        {/* Vinyl Disc with Royal Crest */}
        <div className="relative group cursor-pointer" onClick={handleTogglePlay}>
          {/* Subtle Outer Glow */}
          <div
            className={`absolute -inset-4 rounded-full blur-2xl transition-opacity duration-700 ${
              isPlaying ? 'opacity-40 animate-pulse' : 'opacity-10'
            }`}
            style={{ backgroundColor: accentColor }}
          />

          <div
            className={`w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-zinc-950 via-zinc-900 to-black border-4 border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex items-center justify-center relative overflow-hidden transition-transform ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '9s' }}
          >
            {/* Vinyl grooves pattern */}
            <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-16 rounded-full border border-white/5 pointer-events-none" />

            {/* Disc Center Label */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-inner border-2 border-white/20 relative"
              style={{ backgroundColor: `${accentColor}40` }}
            >
              <Crown size={28} style={{ color: accentColor }} />
              <div className="w-3.5 h-3.5 rounded-full bg-white absolute inset-0 m-auto shadow" />
            </div>
          </div>
        </div>

        {/* Current Track Display */}
        <div className="space-y-1.5">
          <span className="text-[11px] px-3 py-1 rounded-full bg-white/10 text-zinc-300 font-mono font-bold border border-white/15">
            {currentTrack.genre || 'SULTAN ROYAL MUSIC'}
          </span>
          <h1 className="text-xl sm:text-3xl font-black text-white font-display-custom tracking-wide">
            {currentTrack.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            {currentTrack.artist} • {currentTrack.tagline || 'تراك ملكي ممتع'}
          </p>
        </div>

        {/* Audio Spectrum Bars */}
        <div className="flex items-end justify-center gap-1.5 h-10 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10">
          {[4, 8, 12, 16, 20, 24, 28, 24, 18, 14, 10, 6].map((height, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-all duration-200 ${
                isPlaying ? 'bg-red-500 animate-pulse' : 'bg-zinc-700 h-2'
              }`}
              style={{
                height: isPlaying ? `${Math.max(4, height + Math.sin(i) * 6)}px` : '4px',
                animationDelay: `${i * 90}ms`,
                backgroundColor: isPlaying ? (i % 2 === 0 ? accentColor : '#fbbf24') : undefined
              }}
            />
          ))}
        </div>

        {/* Rotating Lyrical Quote */}
        <div className="min-h-[50px] flex items-center justify-center px-4">
          <p className="text-xs sm:text-sm font-bold text-amber-200/90 italic tracking-wide transition-opacity duration-500 animate-in fade-in">
            {SULTAN_ZEN_QUOTES[currentQuoteIndex]}
          </p>
        </div>
      </div>

      {/* Bottom Bar: Interactive Controls Capsule */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4 max-w-4xl mx-auto w-full">
        {/* Calm Lo-Fi Soundscape Switcher */}
        <button
          onClick={handleToggleCalmLoFi}
          className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
            isCalmLoFi
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
          }`}
          title="تشغيل موسيقى الاسترخاء والهدوء Lo-Fi"
        >
          <CloudRain size={15} className={isCalmLoFi ? 'animate-pulse text-amber-400' : ''} />
          <span>{isCalmLoFi ? 'الهدوء الملكي: نشط 🌧️' : 'موسيقى هادئة (Lo-Fi) 🧘‍♂️'}</span>
        </button>

        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevTrack}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer"
            title="التراك السابق"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={handleTogglePlay}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-90 hover:scale-105 cursor-pointer"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 30px ${accentColor}80`
            }}
            title={isPlaying ? 'إيقاف مؤقت (Space)' : 'تشغيل (Space)'}
          >
            {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="mr-0.5" />}
          </button>

          <button
            onClick={handleNextTrack}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer"
            title="التراك التالي"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Volume & Shortcuts Hint */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Volume2 size={16} className="text-zinc-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              audioEngine.setVolume(v);
            }}
            className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
            title="مستوى الصوت"
          />
        </div>
      </div>
    </div>
  );
};
