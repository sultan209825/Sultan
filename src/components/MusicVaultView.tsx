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
  SlidersHorizontal,
  Mic2,
  ListMusic,
  Sparkles,
  ShieldCheck,
  Activity,
  Users,
  ExternalLink,
  Crown
} from 'lucide-react';
import { SongTrack, TimedLyricLine } from '../types';
import { INITIAL_TRACKS } from '../data/tracks';
import { audioEngine } from '../utils/audioEngine';
import confetti from 'canvas-confetti';

interface MusicVaultViewProps {
  tracks?: SongTrack[];
  accentColor?: string;
  isEcoMode?: boolean;
  onApplyMoodTheme?: (palette: { accent: string; secondary: string; mood: string }) => void;
  spotifyData?: {
    song?: string;
    artist?: string;
    album_art_url?: string;
    track_id?: string;
  } | null;
}

export const MusicVaultView: React.FC<MusicVaultViewProps> = ({
  tracks = INITIAL_TRACKS,
  accentColor = '#ef4444',
  isEcoMode = false,
  onApplyMoodTheme,
  spotifyData = null
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
  const [viewTab, setViewTab] = useState<'playlist' | 'lyrics'>('playlist');
  const [isSafeLockEnabled, setIsSafeLockEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sultan_safe_volume_lock') === 'true';
  });
  const [themeAppliedNotice, setThemeAppliedNotice] = useState<string | null>(null);

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const activeLyricRef = useRef<HTMLDivElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  const currentTrack = playlist[currentIndex] || playlist[0];
  const duration = currentTrack.duration || 180;
  const effectiveAccent = currentTrack.coverColor || accentColor;

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
      }, 350);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentTrack]);

  // Auto-scroll to active lyric line in Karaoke mode
  useEffect(() => {
    if (viewTab === 'lyrics' && activeLyricRef.current && lyricsContainerRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTime, viewTab]);

  const handlePlayTrack = (index: number) => {
    audioEngine.playClickSound();
    const track = playlist[index];
    if (!track) return;

    if (currentIndex === index && isPlaying) {
      audioEngine.pause();
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
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      handlePlayTrack(currentIndex);
    }
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
    const newTime = Math.min(duration, currentTime + 10);
    setCurrentTime(newTime);
    audioEngine.seek(newTime);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = Math.floor(ratio * duration);
    setCurrentTime(targetTime);
    audioEngine.seek(targetTime);
  };

  const handleVolumeChange = (newVol: number) => {
    const cappedVol = isSafeLockEnabled ? Math.min(0.75, newVol) : newVol;
    setVolume(cappedVol);
    setIsMuted(false);
    audioEngine.setVolume(cappedVol);
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleSafeLock = () => {
    audioEngine.playClickSound();
    const next = !isSafeLockEnabled;
    setIsSafeLockEnabled(next);
    localStorage.setItem('sultan_safe_volume_lock', next.toString());
    if (next && volume > 0.75) {
      setVolume(0.75);
      audioEngine.setVolume(0.75);
    }
  };

  // Generate Mood theme from song
  const handleExtractMoodTheme = () => {
    audioEngine.playRoyalFanfare();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    const moodColor = currentTrack.coverColor || '#ef4444';
    const secondaryColor = currentTrack.genre?.toLowerCase().includes('drill') ? '#b91c1c' : '#f59e0b';
    const moodName = `${currentTrack.genre} • ${currentTrack.title.slice(0, 15)}...`;

    if (onApplyMoodTheme) {
      onApplyMoodTheme({
        accent: moodColor,
        secondary: secondaryColor,
        mood: moodName
      });
    }
    setThemeAppliedNotice(`تم تطبيق طابع ومود التراك: ${currentTrack.title} 🎨`);
    setTimeout(() => setThemeAppliedNotice(null), 3500);
  };

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  // Determine active lyric line
  const timedLines: TimedLyricLine[] = currentTrack.timedLyrics || [];
  const activeLyricIndex = timedLines.findIndex(
    (line) => currentTime >= line.startTime && currentTime <= line.endTime
  );

  return (
    <div className="w-full relative space-y-4 text-right" dir="rtl">
      {/* Top Notification if Theme Applied */}
      {themeAppliedNotice && (
        <div className="p-3 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <span>{themeAppliedNotice}</span>
          </div>
          <span className="text-[10px] bg-red-500/30 px-2 py-0.5 rounded-full font-mono">LIVE THEME</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{
              backgroundColor: `${effectiveAccent}20`,
              borderColor: `${effectiveAccent}40`
            }}
          >
            <Music size={18} style={{ color: effectiveAccent }} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">مكتبة تراكات السلطان (Music Vault)</h3>
            <p className="text-xs text-zinc-400">مشغل الأغاني، كلمات الكاريوكي، والمعادل البصري 🎧</p>
          </div>
        </div>

        {/* View Switcher Tabs: Playlist vs Live Lyrics */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => {
              audioEngine.playClickSound();
              setViewTab('playlist');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              viewTab === 'playlist'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListMusic size={14} />
            <span>القائمة</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              setViewTab('lyrics');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              viewTab === 'lyrics'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic2 size={14} />
            <span>الكلمات</span>
            {timedLines.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Live Spotify Banner (if Sultan is listening to Spotify on Discord) */}
      {spotifyData && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-green-950/30 to-black/80 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {spotifyData.album_art_url ? (
              <img
                src={spotifyData.album_art_url}
                alt="Spotify Cover"
                className="w-9 h-9 rounded-xl object-cover border border-emerald-500/30 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-black">
                ♫
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  سلطان يستمع الآن على Spotify
                </span>
              </div>
              <p className="font-extrabold text-white truncate text-xs sm:text-sm">
                {spotifyData.song} - {spotifyData.artist}
              </p>
            </div>
          </div>
          {spotifyData.track_id && (
            <a
              href={`https://open.spotify.com/track/${spotifyData.track_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold shrink-0 flex items-center gap-1"
            >
              <span>فتح الأغنية</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {/* Listen Along & Concurrent Listeners Capsule */}
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
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    isListenAlong
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {isListenAlong ? 'متزامن الآن 🔴' : 'متاح للاتصال'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                استمع لنفس التراك الذي يسمعه السلطان في نفس اللحظة مع مؤثرات صوتية ملكية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleListenAlong}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 ${
                isListenAlong
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 scale-105 ring-2 ring-red-400'
                  : 'bg-white/10 hover:bg-white/20 text-zinc-200'
              }`}
            >
              <span>{isListenAlong ? 'متصل بالغرفة 👑' : 'انضمام للاستماع 🎧'}</span>
            </button>

            {/* Extract Mood Palette Button */}
            <button
              onClick={handleExtractMoodTheme}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-amber-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
              title="تطبيق ثيم ومود التراك على كامل الموقع"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span className="hidden sm:inline">ثيم المود</span>
            </button>
          </div>
        </div>

        {isListenAlong && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-[11px] font-mono text-purple-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>غرفة السلطان الصوتية: متصلان معاً (Synced Live Room)</span>
            </div>
            <span className="text-zinc-300 font-bold flex items-center gap-1">
              <Users size={13} className="text-purple-300" />
              <span>14 مستمع متزامن 👥</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Music Player Control Dashboard */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#121124] to-[#0a0a14] border border-white/10 shadow-xl space-y-4 relative overflow-hidden">
        {/* Glow ambient background */}
        <div
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-700"
          style={{ backgroundColor: effectiveAccent }}
        />

        {/* Current Track Info & Audio Visualizer Status */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Spinning Vinyl Disc */}
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/15 flex items-center justify-center shadow-lg shrink-0 relative overflow-hidden ${
                isPlaying && !isEcoMode ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '6s' }}
            >
              <Disc size={28} style={{ color: effectiveAccent }} />
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

          {/* Audio Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              <Radio size={14} className={isPlaying ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'} />
              <span>{isPlaying ? 'شغال الآن' : 'جاهز للتشغيل'}</span>
            </div>
          </div>
        </div>

        {/* Interactive Timeline / Progress Bar */}
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
                backgroundColor: effectiveAccent,
                boxShadow: `0 0 12px ${effectiveAccent}`
              }}
            />
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

        {/* Controls Buttons Bar */}
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
                backgroundColor: effectiveAccent,
                boxShadow: `0 0 20px ${effectiveAccent}60`
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

          {/* Volume Control with Safe Lock & Percentage */}
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
              max={isSafeLockEnabled ? 0.75 : 1}
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
              title="مستوى الصوت"
            />

            <span className="text-[10px] font-mono text-zinc-300 min-w-[28px] text-center">
              {Math.round(volume * 100)}%
            </span>

            {/* Safe Lock Toggle */}
            <button
              onClick={handleToggleSafeLock}
              className={`p-1 rounded-lg transition-colors ${
                isSafeLockEnabled ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={isSafeLockEnabled ? 'قفل الصوت الآمن مفعّل (أقصى حد 75%)' : 'تفعيل قفل الصوت الآمن لحماية الأذن'}
            >
              <ShieldCheck size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW TAB 1: Playlist View */}
      {viewTab === 'playlist' && (
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 animate-in fade-in">
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
                    : 'bg-black/30 hover:bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                      isSelected ? 'bg-red-600 text-white shadow-md shadow-red-600/40' : 'bg-white/5 text-zinc-400'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div className="min-w-0">
                    <h5 className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {track.title}
                    </h5>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {track.genre || 'Beat'} • {formatTime(track.duration || 180)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {track.timedLyrics && track.timedLyrics.length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono border border-emerald-500/30">
                      كلمات متزامنة 🎙️
                    </span>
                  )}
                  {isSelected && isCurrentPlaying ? (
                    <span className="text-[10px] font-mono text-red-400 font-bold animate-pulse">
                      يعمل الآن
                    </span>
                  ) : (
                    <Play size={13} className="text-zinc-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW TAB 2: Live Karaoke Synced Lyrics View */}
      {viewTab === 'lyrics' && (
        <div
          ref={lyricsContainerRef}
          className="p-5 rounded-2xl bg-black/60 border border-white/10 max-h-[350px] overflow-y-auto space-y-4 text-center animate-in fade-in relative"
        >
          {timedLines.length > 0 ? (
            timedLines.map((line, idx) => {
              const isActive = idx === activeLyricIndex;
              return (
                <div
                  key={idx}
                  ref={isActive ? activeLyricRef : null}
                  onClick={() => {
                    audioEngine.playClickSound();
                    setCurrentTime(line.startTime);
                    audioEngine.seek(line.startTime);
                  }}
                  className={`py-2 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'text-lg sm:text-xl font-black text-white bg-red-600/20 border border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.5)] scale-105'
                      : 'text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <p className="leading-relaxed">
                    {isActive && <span className="inline-block mr-1 text-amber-400 animate-bounce">👑</span>}
                    {line.text}
                  </p>
                  <span className="text-[10px] font-mono text-zinc-300 opacity-60">
                    {formatTime(line.startTime)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-8 space-y-2 text-zinc-400 text-xs">
              <p className="text-sm font-bold text-white">كلمات الأغنية الكاملة</p>
              <p className="whitespace-pre-line leading-relaxed text-zinc-300 font-medium">
                {currentTrack.lyrics || 'لا توجد كلمات مسجلة لهذا التراك بعد.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
