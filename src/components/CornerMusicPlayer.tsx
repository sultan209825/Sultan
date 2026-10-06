import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  ChevronDown,
  ChevronUp,
  Crown,
  Disc,
  ListMusic,
  Sparkles,
  Radio,
  X
} from 'lucide-react';
import { SongTrack } from '../types';
import { INITIAL_TRACKS } from '../data/tracks';
import { audioEngine } from '../utils/audioEngine';
import { recordSiteLog } from '../utils/siteLogger';

interface CornerMusicPlayerProps {
  tracks?: SongTrack[];
  autoPlay?: boolean;
  defaultVolume?: number;
  accentColor?: string;
  onPlayStateChange?: (isPlaying: boolean, currentTrack?: SongTrack) => void;
}

export const CornerMusicPlayer: React.FC<CornerMusicPlayerProps> = ({
  tracks = INITIAL_TRACKS,
  autoPlay = true,
  defaultVolume = 0.45,
  accentColor = '#ef4444',
  onPlayStateChange
}) => {
  const playlist = tracks && tracks.length > 0 ? tracks : INITIAL_TRACKS;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('sultan_player_volume');
    return saved !== null ? parseFloat(saved) : defaultVolume;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isPlaylistDrawerOpen, setIsPlaylistDrawerOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showAutoplayPrompt, setShowAutoplayPrompt] = useState<boolean>(false);

  const activeTrack = playlist[currentIndex] || playlist[0];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync volume with audioEngine
  useEffect(() => {
    audioEngine.setVolume(isMuted ? 0 : volume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle Play Track
  const playTrackAtIndex = (index: number, isAutoAttempt: boolean = false) => {
    const targetTrack = playlist[index] || playlist[0];
    setCurrentIndex(index);

    if (targetTrack.file) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';
      }
      const audio = audioRef.current;
      audio.src = targetTrack.file;
      audio.volume = isMuted ? 0 : volume;

      audio.onended = () => {
        handleNextTrack();
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration || targetTrack.duration || 60);
      };

      const promise = audio.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true);
            setShowAutoplayPrompt(false);
            if (onPlayStateChange) onPlayStateChange(true, targetTrack);
            if (!isAutoAttempt) {
              recordSiteLog('تشغيل تراك 🎵', `تشغيل: ${targetTrack.title}`);
            }
          })
          .catch((err) => {
            // Browser autoplay policy blocked unmuted sound
            if (isAutoAttempt) {
              setShowAutoplayPrompt(true);
              setIsPlaying(false);
            }
          });
      }
    } else {
      // Fallback to synthetic royal beat
      audioEngine.playTrack(targetTrack, () => {
        handleNextTrack();
      });
      setIsPlaying(true);
      setShowAutoplayPrompt(false);
      if (onPlayStateChange) onPlayStateChange(true, targetTrack);
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    audioEngine.playClickSound();
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioEngine.stop();
      setIsPlaying(false);
      setShowAutoplayPrompt(false);
      if (onPlayStateChange) onPlayStateChange(false, activeTrack);
      recordSiteLog('إيقاف الموسيقى ⏸️', `إيقاف: ${activeTrack.title}`);
    } else {
      playTrackAtIndex(currentIndex);
    }
  };

  // Next Track
  const handleNextTrack = () => {
    audioEngine.playClickSound();
    const nextIdx = (currentIndex + 1) % playlist.length;
    playTrackAtIndex(nextIdx);
  };

  // Previous Track
  const handlePrevTrack = () => {
    audioEngine.playClickSound();
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrackAtIndex(prevIdx);
  };

  // Auto-Play initialization on mount
  useEffect(() => {
    if (autoPlay) {
      // 1. Try immediate playback
      playTrackAtIndex(0, true);

      // 2. Set up one-time user gesture listener in case browser blocked unconditional autoplay
      const handleUserGesture = () => {
        if (!isPlaying && autoPlay) {
          playTrackAtIndex(0, false);
          setShowAutoplayPrompt(false);
        }
      };

      window.addEventListener('pointerdown', handleUserGesture, { once: true });
      window.addEventListener('keydown', handleUserGesture, { once: true });
      window.addEventListener('touchstart', handleUserGesture, { once: true });

      return () => {
        window.removeEventListener('pointerdown', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
        window.removeEventListener('touchstart', handleUserGesture);
      };
    }
  }, [autoPlay]);

  // Volume slider handler
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    localStorage.setItem('sultan_player_volume', val.toString());
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    audioEngine.playClickSound();
    setIsMuted(!isMuted);
  };

  // Scrub progress
  const handleProgressScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSeconds = parseFloat(e.target.value);
    setCurrentTime(targetSeconds);
    if (audioRef.current) {
      audioRef.current.currentTime = targetSeconds;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <>
      {/* Floating Auto-Play Click Prompt (Appears ONLY if browser blocked initial silent autoplay) */}
      {showAutoplayPrompt && !isPlaying && (
        <div
          onClick={() => playTrackAtIndex(currentIndex)}
          className="fixed bottom-20 left-5 z-50 cursor-pointer animate-bounce"
        >
          <div className="px-4 py-2.5 rounded-2xl bg-[#0a0a14]/95 border border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.5)] backdrop-blur-xl flex items-center gap-2.5 text-xs text-white font-bold hover:scale-105 transition-transform">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>🎵 اضغط هنا لتشغيل تراك السلطان تلقائياً!</span>
          </div>
        </div>
      )}

      {/* Main Corner Floating Widget */}
      <div
        className="fixed bottom-5 left-5 z-40 select-none animate-in fade-in slide-in-from-bottom-4 duration-300"
        dir="rtl"
      >
        {!isExpanded ? (
          /* Minimized Floating Pill */
          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#0d0d18]/90 border border-red-500/40 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(239,68,68,0.25)] hover:border-red-400 transition-all group">
            {/* Play / Pause Toggle Button */}
            <button
              onClick={togglePlay}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isPlaying
                  ? 'bg-gradient-to-tr from-red-600 via-amber-600 to-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white/10 text-zinc-300 hover:bg-white/20'
              }`}
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الموسيقى'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-0.5" />}
            </button>

            {/* Next Track Button */}
            <button
              onClick={handleNextTrack}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="تخطي للأغنية التالية (⏭️)"
            >
              <SkipForward size={14} />
            </button>

            {/* Click to Expand Info */}
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 text-right py-1 hover:opacity-90 max-w-[170px] sm:max-w-[210px]"
              title="فتح مشغل الموسيقى وقائمة الأغاني"
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <Crown size={12} className="text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate font-display-custom">
                    {activeTrack.title}
                  </span>
                  {isPlaying && (
                    <span className="flex items-center gap-0.5 h-2.5 shrink-0">
                      <span className="w-1 h-2 bg-red-400 animate-pulse rounded-full" />
                      <span className="w-1 h-3 bg-red-400 animate-pulse delay-75 rounded-full" />
                      <span className="w-1 h-1.5 bg-red-400 animate-pulse delay-150 rounded-full" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 truncate">
                  {isPlaying ? `${activeTrack.artist} • شغال الآن 🎵` : 'انقر للتشغيل أو تغيير التراك 🎧'}
                </span>
              </div>
              <ChevronUp size={14} className="text-zinc-400 group-hover:text-white transition-colors shrink-0" />
            </button>
          </div>
        ) : (
          /* Expanded Full Floating Player Card */
          <div className="w-80 sm:w-88 rounded-3xl bg-[#0c0c16]/95 border border-red-500/40 p-4 sm:p-5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(239,68,68,0.3)] space-y-4">
            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md ${
                    isPlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '6s' }}
                >
                  <Disc size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white font-display-custom flex items-center gap-1">
                    <span>مشغل موسيقى السلطان</span>
                    <Crown size={12} className="text-amber-400" />
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono-custom">
                    {currentIndex + 1} من {playlist.length} تراكات
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsPlaylistDrawerOpen(!isPlaylistDrawerOpen)}
                  className={`p-1.5 rounded-xl border text-xs transition-colors flex items-center gap-1 ${
                    isPlaylistDrawerOpen
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="قائمة الأغاني (Playlist)"
                >
                  <ListMusic size={14} />
                  <span className="text-[10px] font-bold">القائمة</span>
                </button>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  title="تصغير إلى الزاوية"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Currently Playing Track Info Banner */}
            <div className="p-3 rounded-2xl bg-black/50 border border-white/5 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border shadow-inner"
                style={{
                  backgroundColor: `${activeTrack.coverColor || accentColor}20`,
                  borderColor: `${activeTrack.coverColor || accentColor}50`
                }}
              >
                🎵
              </div>

              <div className="min-w-0 flex-1">
                <h5 className="text-xs sm:text-sm font-extrabold text-white truncate">
                  {activeTrack.title}
                </h5>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {activeTrack.artist} • <span className="text-amber-400 font-mono">{activeTrack.genre}</span>
                </p>
                {activeTrack.tagline && (
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 italic">
                    «{activeTrack.tagline}»
                  </p>
                )}
              </div>
            </div>

            {/* Audio Progress Bar & Time */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration > 0 ? duration : activeTrack.duration || 60}
                step="0.5"
                value={currentTime}
                onChange={handleProgressScrub}
                className="w-full accent-red-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
              />
              <div className="flex items-center justify-between text-[10px] font-mono-custom text-zinc-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration > 0 ? duration : activeTrack.duration || 60)}</span>
              </div>
            </div>

            {/* Core Playback Controls (Previous, Play/Pause, Next) */}
            <div className="flex items-center justify-center gap-4 py-1">
              <button
                onClick={handlePrevTrack}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all active:scale-90"
                title="الأغنية السابقة (⏮️)"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 hover:opacity-95 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-all hover:scale-105 active:scale-95"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} className="translate-x-0.5" />}
              </button>

              <button
                onClick={handleNextTrack}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all active:scale-90"
                title="الأغنية التالية (⏭️)"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Volume Control Slider */}
            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-white/5">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1 accent-red-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                title={`مستوى الصوت: ${Math.round(volume * 100)}%`}
              />

              <span className="text-[11px] font-mono-custom text-zinc-400 w-10 text-left font-bold">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            {/* Playlist Drawer (When toggled) */}
            {isPlaylistDrawerOpen && (
              <div className="pt-2 border-t border-white/10 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-zinc-400">
                  <span>تراكات الألبوم ({playlist.length}):</span>
                  <span className="text-[10px] text-zinc-400">اختر أي تراك للتشغيل</span>
                </div>
                {playlist.map((track, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={track.id || idx}
                      onClick={() => playTrackAtIndex(idx)}
                      className={`w-full p-2 rounded-xl text-right transition-all flex items-center justify-between gap-2 text-xs ${
                        isCurrent
                          ? 'bg-red-500/20 border border-red-500/40 text-white font-bold'
                          : 'bg-white/[0.02] hover:bg-white/[0.08] text-zinc-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-zinc-500 w-4">
                          {idx + 1}
                        </span>
                        <span className="truncate">{track.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-zinc-400">
                        {isCurrent && isPlaying ? (
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                        ) : null}
                        <span>{formatTime(track.duration || 60)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
