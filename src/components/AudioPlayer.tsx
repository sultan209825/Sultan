import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  Shuffle,
  Repeat,
  Upload,
  FileText,
  Flame,
  Mic2,
  Sparkles,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { SongTrack } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { SultanLogo } from './SultanLogo';

interface AudioPlayerProps {
  tracks: SongTrack[];
  onTrackChange?: (track: SongTrack) => void;
  onPlayStateChange?: (isPlaying: boolean, tempo?: number) => void;
  accentColor?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  tracks,
  onTrackChange,
  onPlayStateChange,
  accentColor = '#7c5cff'
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.65);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [autoScrollLyrics, setAutoScrollLyrics] = useState<boolean>(true);
  const [customTracks, setCustomTracks] = useState<SongTrack[]>(tracks);
  const [freqBars, setFreqBars] = useState<number[]>([15, 25, 45, 70, 50, 30, 20, 40]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const activeTrack = customTracks[currentIdx] || customTracks[0];

  // Parse lyrics into structured timed lines
  const parsedLyrics = React.useMemo(() => {
    if (!activeTrack?.lyrics) return [];
    const lines = activeTrack.lyrics
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const totalDur = activeTrack.duration || 120;
    const interval = totalDur / Math.max(lines.length, 1);

    return lines.map((text, idx) => ({
      id: `line-${idx}`,
      text,
      startTime: Math.floor(idx * interval),
      endTime: Math.floor((idx + 1) * interval)
    }));
  }, [activeTrack]);

  // Determine current active lyric line index based on playback time
  const currentLyricIndex = React.useMemo(() => {
    if (parsedLyrics.length === 0) return 0;
    const idx = parsedLyrics.findIndex(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
    if (idx !== -1) return idx;
    if (currentTime >= (parsedLyrics[parsedLyrics.length - 1]?.endTime || 0)) {
      return parsedLyrics.length - 1;
    }
    return 0;
  }, [parsedLyrics, currentTime]);

  // Smoothly auto-scroll current active lyric line into center of viewport
  useEffect(() => {
    if (!showLyrics || !autoScrollLyrics) return;
    if (activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLyricIndex, showLyrics, autoScrollLyrics]);

  // Update track list when prop changes
  useEffect(() => {
    setCustomTracks(tracks);
  }, [tracks]);

  // Visualizer loop
  useEffect(() => {
    let animId: number;
    const freqArray = new Uint8Array(16);

    let phase = 0;
    const updateViz = () => {
      if (isPlaying) {
        audioEngine.getFrequencyData(freqArray);
        const bars: number[] = [];
        let hasRealFreq = false;
        for (let i = 0; i < 8; i++) {
          const val = freqArray[i * 2] || 0;
          if (val > 0) hasRealFreq = true;
          bars.push(Math.max(4, Math.floor((val / 255) * 26)));
        }
        
        // If playing an HTML5 audio file directly, provide smooth rhythmic wave animation
        if (!hasRealFreq) {
          phase += 0.15;
          const dynamicBars = [
            Math.floor(10 + Math.sin(phase) * 8),
            Math.floor(16 + Math.cos(phase * 1.2) * 10),
            Math.floor(22 + Math.sin(phase * 1.5) * 6),
            Math.floor(26 + Math.cos(phase * 0.8) * 8),
            Math.floor(20 + Math.sin(phase * 1.3) * 7),
            Math.floor(14 + Math.cos(phase * 1.6) * 9),
            Math.floor(18 + Math.sin(phase * 1.1) * 8),
            Math.floor(12 + Math.cos(phase * 1.4) * 6)
          ];
          setFreqBars(dynamicBars);
        } else {
          setFreqBars(bars);
        }
      } else {
        setFreqBars([4, 6, 8, 12, 8, 6, 5, 4]);
      }
      animId = requestAnimationFrame(updateViz);
    };

    updateViz();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Progress timer tracking (supports both real audio file and synthetic beats with 150ms precision)
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = window.setInterval(() => {
        const audioElement = audioEngine.getAudioElement();
        if (audioElement && !audioElement.paused) {
          setCurrentTime(audioElement.currentTime);
        } else {
          setCurrentTime((prev) => {
            if (prev >= (activeTrack?.duration || 120)) {
              handleNextTrack();
              return 0;
            }
            return prev + 0.2;
          });
        }
      }, 150);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, activeTrack]);

  const playTrack = (index: number) => {
    const track = customTracks[index];
    if (!track) return;

    setCurrentIdx(index);
    setCurrentTime(0);
    setIsPlaying(true);

    if (onTrackChange) onTrackChange(track);
    if (onPlayStateChange) onPlayStateChange(true, track.tempo);

    // Track song play count for Admin Top 5 analytics
    try {
      const savedPlays = localStorage.getItem('sultan_song_plays');
      const counts: Record<string, number> = savedPlays ? JSON.parse(savedPlays) : {};
      counts[track.id] = (counts[track.id] || 0) + 1;
      localStorage.setItem('sultan_song_plays', JSON.stringify(counts));
    } catch {}

    if (track.file && (track.file.startsWith('blob:') || track.file.startsWith('http') || track.file.startsWith('/'))) {
      audioEngine.playAudioFile(track.file, () => {
        if (isRepeat) {
          playTrack(index);
        } else {
          handleNextTrack();
        }
      });
    } else {
      // Determine style for synthetic beat
      const style =
        track.id === 'sultan-3'
          ? 'energy'
          : track.id === 'sultan-2'
          ? 'drill'
          : track.id === 'sultan-4'
          ? 'chill'
          : track.id === 'sultan-5'
          ? 'anthem'
          : 'heavy';
      audioEngine.playSyntheticBeat(track.id, track.tempo, style);
    }
  };

  const handleTogglePlay = () => {
    audioEngine.playClickSound();
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    } else {
      // Resume if already paused in middle of track, otherwise play from start
      const audioElement = audioEngine.getAudioElement();
      if (audioElement && audioElement.currentTime > 0 && !audioElement.ended) {
        audioEngine.resume();
        setIsPlaying(true);
        if (onPlayStateChange) onPlayStateChange(true, activeTrack?.tempo);
      } else {
        playTrack(currentIdx);
      }
    }
  };

  const handleNextTrack = () => {
    audioEngine.playClickSound();
    if (isRepeat) {
      playTrack(currentIdx);
      return;
    }

    let nextIdx = currentIdx + 1;
    if (isShuffle && customTracks.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * customTracks.length);
      } while (nextIdx === currentIdx);
    } else if (nextIdx >= customTracks.length) {
      nextIdx = 0;
    }
    playTrack(nextIdx);
  };

  const handlePrevTrack = () => {
    audioEngine.playClickSound();
    let prevIdx = currentIdx - 1;
    if (prevIdx < 0) prevIdx = customTracks.length - 1;
    playTrack(prevIdx);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const handleToggleMute = () => {
    audioEngine.playClickSound();
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const newTrack: SongTrack = {
      id: `upload-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'SULTAN (الملف المرفوع)',
      genre: 'Custom Audio',
      tempo: 90,
      duration: 180,
      file: fileUrl,
      tagline: 'ملف صوتك الخاص المرفوع من جهازك',
      lyrics: `تم تحميل الملف الصوتي: ${file.name} بنجاح ويتم تشغيله الآن عبر مشغل السلطان!`,
      isCustomUpload: true
    };

    const updated = [newTrack, ...customTracks];
    setCustomTracks(updated);
    setCurrentIdx(0);
    playTrack(0);
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPercent = activeTrack?.duration
    ? Math.min(100, (currentTime / activeTrack.duration) * 100)
    : 0;

  const trackColor = activeTrack?.coverColor || accentColor || '#ef4444';

  return (
    <div className="w-full relative group/player">
      {/* Dynamic Ambient Background Glow based on current song cover color */}
      <div
        className="absolute -inset-1.5 rounded-3xl blur-2xl opacity-40 group-hover/player:opacity-75 transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${trackColor} 0%, transparent 70%)`
        }}
      />
      <div
        className="absolute -inset-1 rounded-2xl blur-lg opacity-25 transition-all duration-700 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${trackColor} 0%, transparent 60%)`
        }}
      />

      <div
        className="w-full relative rounded-2xl bg-[#0c0c16]/90 border backdrop-blur-xl p-4 sm:p-5 shadow-2xl transition-all duration-500 overflow-hidden"
        style={{
          borderColor: isPlaying ? `${trackColor}55` : 'rgba(255, 255, 255, 0.1)',
          boxShadow: isPlaying
            ? `0 15px 35px -10px ${trackColor}40, 0 0 20px ${trackColor}20`
            : '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Soft internal gradient illumination */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
          style={{ background: trackColor }}
        />

        {/* Vinyl & Info Header */}
        <div className="flex items-center gap-3.5 sm:gap-4 relative z-10">
          {/* Animated Vinyl Disc */}
          <div
            onClick={handleTogglePlay}
            className={`relative cursor-pointer w-14 h-14 sm:w-16 sm:h-16 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 ${
              isPlaying ? 'animate-vinyl' : ''
            }`}
            style={{
              background:
                'radial-gradient(circle at center, #1e112a 0%, #100b18 45%, #050408 85%)',
              border: `2px solid ${trackColor}80`,
              boxShadow: isPlaying ? `0 0 25px ${trackColor}70` : 'none'
            }}
            title="اضغط للتشغيل أو الإيقاف"
          >
            {/* Inner groove circles */}
            <div className="absolute inset-1.5 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shadow-inner transition-colors duration-500"
              style={{ background: trackColor }}
            >
              <SultanLogo size={18} glow={false} />
            </div>
          </div>

        {/* Track details & Equalizer */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm sm:text-base font-bold text-white truncate tracking-wide flex items-center gap-1.5">
              <span>{activeTrack?.title}</span>
              {activeTrack?.isCustomUpload && (
                <span className="text-[10px] text-amber-400 font-mono-custom bg-amber-500/10 px-1.5 py-0.5 rounded">
                  ملف مخصص
                </span>
              )}
            </h4>

            {/* Equalizer Waveform */}
            <div className="flex items-end gap-0.5 h-6 px-1 flex-shrink-0">
              {freqBars.map((height, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${height}px`,
                    background:
                      i % 2 === 0
                        ? 'linear-gradient(to top, #ef4444, #f97316)'
                        : 'linear-gradient(to top, #7c5cff, #26d9ff)'
                  }}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-zinc-400 font-mono-custom truncate mt-0.5">
            {activeTrack?.artist} •{' '}
            <span className="text-red-400">{activeTrack?.genre}</span>
          </p>

          <p className="text-[11px] text-zinc-400 italic truncate mt-1 flex items-center gap-1">
            <Flame size={12} className="text-amber-400 flex-shrink-0" />
            <span>&ldquo;{activeTrack?.tagline}&rdquo;</span>
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5">
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            setCurrentTime(Math.floor(ratio * (activeTrack?.duration || 120)));
          }}
          className="relative w-full h-1.5 bg-white/10 hover:h-2 rounded-full cursor-pointer transition-all overflow-hidden"
        >
          <div
            className="absolute top-0 bottom-0 left-0 rounded-full transition-all"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, #ef4444, ${trackColor}, #ffffff)`
            }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono-custom text-zinc-400 mt-1">
          <span>{formatSec(currentTime)}</span>
          <span>{formatSec(activeTrack?.duration || 120)}</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        {/* Left actions: Shuffle, Repeat, Lyrics */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              audioEngine.playClickSound();
              setIsShuffle(!isShuffle);
            }}
            className={`p-2 rounded-lg transition-colors text-xs ${
              isShuffle ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-400 hover:text-white'
            }`}
            title="تشغيل عشوائي"
          >
            <Shuffle size={15} />
          </button>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              setIsRepeat(!isRepeat);
            }}
            className={`p-2 rounded-lg transition-colors text-xs ${
              isRepeat ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-400 hover:text-white'
            }`}
            title="تكرار الأغنية"
          >
            <Repeat size={15} />
          </button>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              setShowLyrics(!showLyrics);
            }}
            className={`px-2.5 py-1.5 rounded-xl transition-all text-xs flex items-center gap-1.5 font-bold border ${
              showLyrics
                ? 'text-red-400 bg-red-500/20 border-red-500/40 shadow-sm shadow-red-500/30'
                : 'text-zinc-300 hover:text-white bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            title="عرض كلمات التراك الحالي"
          >
            <FileText size={14} className="text-amber-400" />
            <span className="text-xs">الكلمات</span>
          </button>
        </div>

        {/* Center: Prev, Play/Pause, Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevTrack}
            className="p-2 text-zinc-300 hover:text-white transition-transform active:scale-90"
            title="السابقة"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={handleTogglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 shadow-md"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #7c5cff)'
            }}
            title={isPlaying ? 'إيقاف' : 'تشغيل'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
          </button>

          <button
            onClick={handleNextTrack}
            className="p-2 text-zinc-300 hover:text-white transition-transform active:scale-90"
            title="التالية"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Right actions: Volume & Playlist */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={handleToggleMute}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-14 h-1 accent-red-500 bg-white/10 rounded-full cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              setShowQueue(!showQueue);
            }}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              showQueue ? 'text-red-400 bg-red-400/10' : 'text-zinc-300 hover:text-white'
            }`}
            title="قائمة الأغاني"
          >
            <ListMusic size={17} />
            <span className="text-[11px] font-mono-custom hidden sm:inline">
              ({customTracks.length})
            </span>
          </button>
        </div>
      </div>

      {/* Lyrics Drawer with Synchronized Auto-Scroll */}
      {showLyrics && (
        <div className="mt-3.5 p-4 bg-[#0a0a14]/95 border border-white/10 rounded-2xl text-right animate-fadeIn shadow-2xl relative overflow-hidden">
          {/* Subtle accent glow in background */}
          <div
            className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: trackColor }}
          />

          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                style={{ background: trackColor }}
              >
                <Mic2 size={14} className={isPlaying ? 'animate-bounce' : ''} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>كلمات: {activeTrack?.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-mono-custom">
                    Live Sync
                  </span>
                </h4>
                <p className="text-[10px] text-zinc-400">
                  انقر على أي سطر للانتقال المباشر إليه في الأغنية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto Scroll Toggle */}
              <button
                type="button"
                onClick={() => {
                  audioEngine.playClickSound();
                  setAutoScrollLyrics(!autoScrollLyrics);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                  autoScrollLyrics
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                }`}
                title={autoScrollLyrics ? 'إيقاف التمرير التلقائي' : 'تشغيل التمرير التلقائي'}
              >
                <Sparkles size={11} className={autoScrollLyrics ? 'text-emerald-400 animate-spin' : ''} />
                <span>{autoScrollLyrics ? 'تمرير تلقائي: مفعّل' : 'تمرير تلقائي: معطّل'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLyrics(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                title="إغلاق الكلمات"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Synchronized Scrolling Lyrics Container */}
          <div
            ref={lyricsContainerRef}
            className="max-h-64 sm:max-h-72 overflow-y-auto space-y-2.5 pr-1 pl-1 scroll-smooth select-text relative z-10 custom-scrollbar"
            style={{
              scrollBehavior: 'smooth'
            }}
          >
            {parsedLyrics.length > 0 ? (
              parsedLyrics.map((line, idx) => {
                const isActive = idx === currentLyricIndex;
                const isPast = idx < currentLyricIndex;

                return (
                  <div
                    key={line.id}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => {
                      audioEngine.playClickSound();
                      setCurrentTime(line.startTime);
                      audioEngine.seek(line.startTime);
                    }}
                    className={`group/line p-2.5 sm:p-3 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 text-right ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600/25 via-amber-500/15 to-transparent border-r-4 border-r-amber-400 text-white font-bold scale-[1.01] shadow-lg shadow-black/40'
                        : isPast
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 opacity-85'
                        : 'text-zinc-400/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-[10px] font-mono-custom w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isActive
                            ? 'bg-amber-500 text-black font-black'
                            : 'bg-white/5 text-zinc-500 group-hover/line:text-zinc-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <p
                        className={`text-xs sm:text-sm leading-relaxed transition-all ${
                          isActive
                            ? 'text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)] font-extrabold'
                            : 'font-medium'
                        }`}
                      >
                        {line.text}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-60 group-hover/line:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono-custom text-zinc-400">
                        {formatSec(line.startTime)}
                      </span>
                      {isActive && isPlaying && (
                        <span className="flex gap-0.5 items-end h-3">
                          <span className="w-0.5 h-full bg-amber-400 animate-pulse" />
                          <span className="w-0.5 h-2 bg-amber-400 animate-pulse delay-75" />
                          <span className="w-0.5 h-3 bg-amber-400 animate-pulse delay-150" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-400 text-center py-6">
                لا توجد كلمات متوفرة لهذا التراك حالياً.
              </p>
            )}
          </div>

          {/* Quick Footer info */}
          <div className="pt-2.5 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 font-mono-custom">
            <span>السطر {currentLyricIndex + 1} من {parsedLyrics.length}</span>
            <span>{activeTrack?.genre} • {activeTrack?.tempo} BPM</span>
          </div>
        </div>
      )}

      {/* Playlist Drawer */}
      {showQueue && (
        <div className="mt-3 bg-black/60 border border-white/10 rounded-xl p-2 max-h-56 overflow-y-auto space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-zinc-400 border-b border-white/5 font-mono-custom">
            <span>قائمة أغاني السلطان الحصرية</span>
            <span>{customTracks.length} تراكات</span>
          </div>
          {customTracks.map((t, idx) => (
            <div
              key={t.id}
              onClick={() => playTrack(idx)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                idx === currentIdx
                  ? 'bg-red-500/15 border-r-4 border-red-500 text-white font-bold'
                  : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono-custom text-xs w-4 text-center opacity-60">
                  {idx + 1}
                </span>
                <div className="truncate">
                  <p className="text-xs truncate">{t.title}</p>
                  <p className="text-[10px] opacity-70 font-mono-custom truncate">
                    {t.genre} • {t.artist}
                  </p>
                </div>
              </div>

              {idx === currentIdx && isPlaying && (
                <div className="flex gap-0.5 items-end h-3 flex-shrink-0">
                  <span className="w-1 h-3 bg-red-400 rounded-full animate-bounce" />
                  <span className="w-1 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-3.5 bg-red-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};
