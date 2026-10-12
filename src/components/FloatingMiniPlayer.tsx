import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Disc,
  Radio,
  Flame,
  ShieldCheck,
  X
} from 'lucide-react';
import { SongTrack } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { INITIAL_TRACKS } from '../data/tracks';

interface FloatingMiniPlayerProps {
  tracks?: SongTrack[];
  accentColor?: string;
  isEcoMode?: boolean;
  onExpandPlayer: () => void;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  tracks = INITIAL_TRACKS,
  accentColor = '#ef4444',
  isEcoMode = false,
  onExpandPlayer
}) => {
  const playlist = tracks && tracks.length > 0 ? tracks : INITIAL_TRACKS;
  const [isPlaying, setIsPlaying] = useState<boolean>(() => audioEngine.getIsPlaying());
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(() => audioEngine.getCurrentTrackId());
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => audioEngine.getVolume() ?? 0.6);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isSafeLockEnabled, setIsSafeLockEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sultan_safe_volume_lock') === 'true';
  });

  // Find active track
  const activeTrackIndex = Math.max(
    0,
    playlist.findIndex((t) => t.id === currentTrackId)
  );
  const currentTrack = playlist[activeTrackIndex] || playlist[0];

  // Subscribe to audio engine play state
  useEffect(() => {
    const unsub = audioEngine.subscribePlayState((playing) => {
      setIsPlaying(playing);
      setCurrentTrackId(audioEngine.getCurrentTrackId());
      if (playing) {
        setIsDismissed(false);
      }
    });
    return unsub;
  }, []);

  // Sync playback time periodically
  useEffect(() => {
    let timer: number | null = null;
    if (isPlaying) {
      timer = window.setInterval(() => {
        const time = audioEngine.getCurrentPlaybackTime();
        if (time > 0) {
          setCurrentTime(time);
        } else {
          setCurrentTime((prev) => (prev + 1) % (currentTrack.duration || 180));
        }
      }, 600);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentTrack]);

  // Don't show if dismissed or no track was ever played
  if (isDismissed || (!isPlaying && currentTime === 0 && !currentTrackId)) {
    return null;
  }

  const duration = currentTrack.duration || 180;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playClickSound();
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.resume();
      if (!audioEngine.getIsPlaying()) {
        audioEngine.playTrack(currentTrack);
      }
      setIsPlaying(true);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playClickSound();
    const nextIdx = (activeTrackIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIdx];
    setCurrentTrackId(nextTrack.id);
    audioEngine.playTrack(nextTrack);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playClickSound();
    const prevIdx = (activeTrackIndex - 1 + playlist.length) % playlist.length;
    const prevTrack = playlist[prevIdx];
    setCurrentTrackId(prevTrack.id);
    audioEngine.playTrack(prevTrack);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleSafeLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playClickSound();
    const next = !isSafeLockEnabled;
    setIsSafeLockEnabled(next);
    localStorage.setItem('sultan_safe_volume_lock', next.toString());
    if (next && volume > 0.75) {
      setVolume(0.75);
      audioEngine.setVolume(0.75);
    }
  };

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const effectiveAccent = currentTrack.coverColor || accentColor;

  return (
    <aside
      aria-label="مشغل الموسيقى المصغر"
      onClick={onExpandPlayer}
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group text-right"
      dir="rtl"
    >
      {/* Ambient glow backdrop */}
      <div
        className="absolute -inset-1 rounded-3xl blur-xl opacity-40 transition-opacity duration-500 pointer-events-none group-hover:opacity-75"
        style={{
          background: `radial-gradient(ellipse at center, ${effectiveAccent}80 0%, transparent 70%)`
        }}
      />

      {/* Glassmorphic Capsule */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/15 p-2 sm:p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Subtle top progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: effectiveAccent,
              boxShadow: `0 0 8px ${effectiveAccent}`
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Track Info & Vinyl Art */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            {/* Spinning Vinyl Album Thumbnail */}
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/20 flex items-center justify-center shadow-md shrink-0 relative overflow-hidden ${
                isPlaying && !isEcoMode ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '6s' }}
            >
              <Disc size={22} style={{ color: effectiveAccent }} />
              <div className="w-2.5 h-2.5 rounded-full bg-white/90 absolute inset-0 m-auto" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">
                  {currentTrack.genre || 'DRILL'}
                </span>
                <p className="text-xs sm:text-sm font-black text-white truncate">
                  {currentTrack.title}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                <span className="truncate">{currentTrack.artist}</span>
                <span>•</span>
                <span className="text-zinc-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Audio Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Previous */}
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="التراك السابق"
            >
              <SkipBack size={15} />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 hover:scale-105"
              style={{
                backgroundColor: effectiveAccent,
                boxShadow: `0 0 15px ${effectiveAccent}80`
              }}
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause size={17} fill="white" /> : <Play size={17} fill="white" className="mr-0.5" />}
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="التراك التالي"
            >
              <SkipForward size={15} />
            </button>

            {/* Mute Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors hidden xs:inline-flex"
              title={isMuted ? 'إلغاء الكتم' : 'كتم'}
            >
              {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} />}
            </button>

            {/* Safe Volume Lock */}
            <button
              onClick={handleToggleSafeLock}
              className={`p-1.5 rounded-xl transition-all hidden sm:inline-flex items-center gap-1 text-[10px] font-mono ${
                isSafeLockEnabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title={isSafeLockEnabled ? 'قفل الصوت الآمن مفعّل (أقصى حد 75%)' : 'تفعيل قفل الصوت الآمن لحماية الأذن'}
            >
              <ShieldCheck size={14} className={isSafeLockEnabled ? 'text-amber-400' : ''} />
              <span className="hidden md:inline font-bold">
                {Math.round(volume * 100)}%
              </span>
            </button>

            {/* Expand Modal */}
            <button
              onClick={onExpandPlayer}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="تكبير المشغل وفتح الكلمات"
            >
              <Maximize2 size={14} />
            </button>

            {/* Dismiss Mini Player */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
              title="إخفاء مؤقت"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
