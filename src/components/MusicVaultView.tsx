import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Disc,
  Flame,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { SongTrack } from '../types';
import { INITIAL_TRACKS } from '../data/tracks';
import { audioEngine } from '../utils/audioEngine';

interface MusicVaultViewProps {
  tracks?: SongTrack[];
  accentColor?: string;
  isEcoMode?: boolean;
}

export const MusicVaultView: React.FC<MusicVaultViewProps> = ({
  tracks = INITIAL_TRACKS,
  accentColor = '#ef4444',
  isEcoMode = false
}) => {
  const playlist = tracks && tracks.length > 0 ? tracks : INITIAL_TRACKS;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => audioEngine.getIsPlaying());
  const [volume, setVolume] = useState<number>(() => audioEngine.getVolume() ?? 0.6);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isListenAlong, setIsListenAlong] = useState<boolean>(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const currentTrack = playlist[currentIndex] || playlist[0];

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
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentTrack]);

  const handlePlayTrack = (index: number) => {
    audioEngine.playClickSound();
    const track = playlist[index];
    if (!track) return;

    if (currentIndex === index && isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      setCurrentIndex(index);
      audioEngine.playTrack(track, () => {
        handleTrackEnd();
      });
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const handleTrackEnd = () => {
    if (isLooping) {
      const track = playlist[currentIndex];
      audioEngine.playTrack(track, () => handleTrackEnd());
      setIsPlaying(true);
      setCurrentTime(0);
    } else if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * playlist.length);
      setCurrentIndex(randomIdx);
      audioEngine.playTrack(playlist[randomIdx], () => handleTrackEnd());
      setIsPlaying(true);
      setCurrentTime(0);
    } else {
      handleNext();
    }
  };

  const handleTogglePlay = () => {
    handlePlayTrack(currentIndex);
  };

  const handleToggleListenAlong = () => {
    audioEngine.playPowerUpSound();
    setIsListenAlong((prev) => {
      const next = !prev;
      if (next && !isPlaying) {
        handlePlayTrack(currentIndex);
      }
      return next;
    });
  };

  const handleNext = () => {
    audioEngine.playClickSound();
    let nextIdx = (currentIndex + 1) % playlist.length;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * playlist.length);
    }
    setCurrentIndex(nextIdx);
    audioEngine.playTrack(playlist[nextIdx], () => handleTrackEnd());
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handlePrev = () => {
    audioEngine.playClickSound();
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prevIdx);
    audioEngine.playTrack(playlist[prevIdx], () => handleTrackEnd());
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handleRewind10 = () => {
    audioEngine.playClickSound();
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    audioEngine.seek(newTime);
  };

  const handleForward10 = () => {
    audioEngine.playClickSound();
    const duration = currentTrack.duration || 180;
    const newTime = Math.min(duration, currentTime + 10);
    setCurrentTime(newTime);
    audioEngine.seek(newTime);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const duration = currentTrack.duration || 180;
    const targetTime = Math.floor(ratio * duration);
    setCurrentTime(targetTime);
    audioEngine.seek(targetTime);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(false);
    audioEngine.setVolume(newVol);
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const duration = currentTrack.duration || 180;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  return (
    <div className="w-full relative space-y-4 text-right" dir="rtl">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{
              backgroundColor: `${accentColor}20`,
              borderColor: `${accentColor}40`
            }}
          >
            <Music size={18} style={{ color: accentColor }} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">مكتبة تراكات السلطان (Music Vault)</h3>
            <p className="text-xs text-zinc-400">تحكم كامل بالمشغل مع تراكبات حصرية بجودة عالية 🎧</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/5 border border-white/10 text-zinc-300">
          {playlist.length} تراكات
        </span>
      </div>

      {/* Feature 4: نمط الاستماع المتزامن مع السلطان (Listen Along with Sultan) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-red-950/30 to-black/80 border border-purple-500/30 shadow-lg space-y-2.5 relative overflow-hidden">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
              <Radio size={18} className={isListenAlong ? 'animate-pulse text-red-400' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  استماع متزامن مع السلطان (Listen Along) 🎧
                </h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isListenAlong
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>
                  {isListenAlong ? 'متزامن الآن 🔴' : 'متاح للاتصال'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                استمع لنفس التراك الذي يسمعه السلطان في نفس اللحظة مع مؤثرات صوتية ملكية
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleListenAlong}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 shrink-0 ${
              isListenAlong
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 scale-105 ring-2 ring-red-400'
                : 'bg-white/10 hover:bg-white/20 text-zinc-200'
            }`}
          >
            <span>{isListenAlong ? 'متصل بالغرفة 👑' : 'انضمام للاستماع 🎧'}</span>
          </button>
        </div>

        {isListenAlong && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-[11px] font-mono text-purple-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>غرفة السلطان الصوتية: متصلان معاً (Synced Live Room)</span>
            </div>
            <span className="text-zinc-300 font-bold">12 مستمع متزامن 👥</span>
          </div>
        )}
      </div>

      {/* Main Music Player Control Dashboard (كنترول المشغل الملكي المتطور) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#121124] to-[#0a0a14] border border-white/10 shadow-xl space-y-4 relative overflow-hidden">
        {/* Glow ambient background */}
        <div
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: accentColor }}
        />

        {/* Current Track Info & Audio Visualizer */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Spinning Vinyl Disc */}
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/15 flex items-center justify-center shadow-lg shrink-0 relative overflow-hidden ${
                isPlaying && !isEcoMode ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '6s' }}
            >
              <Disc size={28} style={{ color: accentColor }} />
              <div className="w-3 h-3 rounded-full bg-white/80 absolute inset-0 m-auto" />
            </div>

            <div className="min-w-0">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono font-bold border border-red-500/30">
                {currentTrack.genre || 'DRILL / PHONK'}
              </span>
              <h4 className="text-sm sm:text-base font-black text-white truncate mt-1">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-zinc-400 truncate font-medium">
                {currentTrack.artist} • {currentTrack.tagline || 'تراك ملكي حصري'}
              </p>
            </div>
          </div>

          {/* Live Visualizer Waves & Status */}
          <div className="flex items-center gap-2">
            {/* Audio Wave Visualizer Bars */}
            <div className="hidden xs:flex items-end gap-1 h-6 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
              <span className={`w-1 bg-red-500 rounded-full transition-all ${isPlaying && !isEcoMode ? 'h-5 animate-pulse' : 'h-1.5'}`} />
              <span className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying && !isEcoMode ? 'h-3 animate-pulse delay-75' : 'h-2'}`} />
              <span className={`w-1 bg-red-400 rounded-full transition-all ${isPlaying && !isEcoMode ? 'h-6 animate-pulse delay-150' : 'h-1'}`} />
              <span className={`w-1 bg-rose-500 rounded-full transition-all ${isPlaying && !isEcoMode ? 'h-4 animate-pulse delay-100' : 'h-2.5'}`} />
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              <Radio size={14} className={isPlaying ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'} />
              <span>{isPlaying ? 'شغال الآن' : 'جاهز للتشغيل'}</span>
            </div>
          </div>
        </div>

        {/* Interactive Timeline / Progress Bar (مع إمكانية النقر والتقديم والتأخير) */}
        <div className="space-y-1.5 relative z-10">
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="w-full bg-white/10 hover:bg-white/15 h-2.5 rounded-full overflow-hidden cursor-pointer relative group/timeline transition-all"
            title="انقر في أي مكان للتنقل في التراك"
          >
            <div
              className="h-full rounded-full transition-all duration-150 relative"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: accentColor,
                boxShadow: `0 0 12px ${accentColor}`
              }}
            />
            {/* Scrub head indicator on hover */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover/timeline:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls Buttons Bar (کنترول التبديل، التقديم، الإعادة، والتحكم بالصوت) */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-1 border-t border-white/5 relative z-10">
          {/* Playback & Seek Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrev}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer"
              title="التراك السابق"
            >
              <SkipBack size={15} />
            </button>

            <button
              onClick={handleRewind10}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer text-[10px] font-mono font-bold"
              title="تأخير 10 ثوانٍ"
            >
              <RotateCcw size={13} />
            </button>

            <button
              onClick={handleTogglePlay}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95 hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}60`
              }}
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="mr-0.5" />}
            </button>

            <button
              onClick={handleForward10}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer text-[10px] font-mono font-bold"
              title="تقديم 10 ثوانٍ"
            >
              <RotateCw size={13} />
            </button>

            <button
              onClick={handleNext}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer"
              title="التراك التالي"
            >
              <SkipForward size={15} />
            </button>
          </div>

          {/* Repeat & Shuffle toggles */}
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => {
                audioEngine.playClickSound();
                setIsLooping(!isLooping);
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isLooping ? 'bg-red-600/40 text-red-300 border border-red-500/50' : 'text-zinc-400 hover:text-white'
              }`}
              title={isLooping ? 'إلغاء تكرار التراك' : 'تكرار التراك الحالي'}
            >
              <Repeat size={14} />
            </button>

            <button
              onClick={() => {
                audioEngine.playClickSound();
                setIsShuffle(!isShuffle);
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isShuffle ? 'bg-red-600/40 text-red-300 border border-red-500/50' : 'text-zinc-400 hover:text-white'
              }`}
              title={isShuffle ? 'إلغاء التشغيل العشوائي' : 'تشغيل عشوائي'}
            >
              <Shuffle size={14} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-black/40 px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/5">
            <button
              onClick={handleToggleMute}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
            >
              {isMuted || volume === 0 ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
              title="مستوى الصوت"
            />
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {playlist.map((track, idx) => {
          const isSelected = currentIndex === idx;
          const isCurrentPlaying = isSelected && isPlaying;

          return (
            <div
              key={track.id || idx}
              onClick={() => handlePlayTrack(idx)}
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    isCurrentPlaying
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white'
                  }`}
                >
                  {isCurrentPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-xs sm:text-sm truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                      {track.title}
                    </p>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {track.artist} {track.genre ? `• ${track.genre}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-zinc-400">
                  {formatTime(track.duration || 180)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
