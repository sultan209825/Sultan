import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Music, ChevronDown, ChevronUp, Crown, Disc } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { recordSiteLog } from '../utils/siteLogger';

interface CornerMusicPlayerProps {
  onPlayStateChange?: (isPlaying: boolean) => void;
  accentColor?: string;
}

export const CornerMusicPlayer: React.FC<CornerMusicPlayerProps> = ({
  onPlayStateChange,
  accentColor = '#ef4444'
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.55);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleMusic = () => {
    audioEngine.playClickSound();
    const newState = audioEngine.toggleCalmLoFi((playing) => {
      setIsPlaying(playing);
      if (onPlayStateChange) onPlayStateChange(playing);
    });

    setIsPlaying(newState);
    if (onPlayStateChange) onPlayStateChange(newState);

    if (newState) {
      recordSiteLog('تشغيل موسيقى السلطان 👑', 'تشغيل المعزوفة الملكية المهيبة في الزاوية');
    } else {
      recordSiteLog('إيقاف الموسيقى ⏸️', 'إيقاف المعزوفة مؤقتاً');
    }
  };

  const toggleMute = () => {
    audioEngine.playClickSound();
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
    recordSiteLog('كتم الصوت 🔇', muted ? 'تفعيل كتم الصوت' : 'إلغاء كتم الصوت');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  return (
    <div
      className="fixed bottom-5 left-5 z-40 select-none animate-in fade-in slide-in-from-bottom-4 duration-300"
      dir="rtl"
    >
      {!isExpanded ? (
        /* Minimized Floating Pill */
        <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#0d0d18]/90 border border-red-500/40 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(239,68,68,0.25)] hover:border-red-400 transition-all group">
          <button
            onClick={toggleMusic}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-gradient-to-tr from-red-600 via-amber-600 to-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-white/10 text-zinc-300 hover:bg-white/20'
            }`}
            title={isPlaying ? 'إيقاف المعزوفة الملكية' : 'تشغيل المعزوفة الملكية'}
          >
            {isPlaying ? (
              <Pause size={14} />
            ) : (
              <Play size={14} className="translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 text-right py-1 hover:opacity-90"
            title="توسيع مشغل الزاوية"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Crown size={12} className="text-amber-400" />
                <span className="text-xs font-bold text-white font-display-custom">
                  أجواء هادئة (Chill Ambience)
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-0.5 h-2.5">
                    <span className="w-1 h-2 bg-red-400 animate-pulse rounded-full" />
                    <span className="w-1 h-3 bg-red-400 animate-pulse delay-75 rounded-full" />
                    <span className="w-1 h-1.5 bg-red-400 animate-pulse delay-150 rounded-full" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-400">
                {isPlaying ? 'معزوفة هادئة ومريحة تعمل 🎵' : 'انقر للتشغيل والاسترخاء 🎧'}
              </span>
            </div>
            <ChevronUp size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      ) : (
        /* Expanded Floating Card */
        <div className="w-72 rounded-2xl bg-[#0c0c16]/95 border border-red-500/40 p-4 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(239,68,68,0.25)] space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '6s' }}
              >
                <Disc size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-display-custom flex items-center gap-1">
                  <span>أجواء السلطان • Chill Ambience</span>
                  <Crown size={11} className="text-amber-400" />
                </h4>
                <p className="text-[10px] text-zinc-400">معزوفة هادئة متناغمة مع حركات وتصميم الموقع</p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="تصغير إلى الزاوية"
            >
              <ChevronDown size={15} />
            </button>
          </div>

          {/* Center Play Button & Equalizer */}
          <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-2.5">
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleMusic}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md ${
                  isPlaying
                    ? 'bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-red-600/30 scale-105'
                    : 'bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10'
                }`}
              >
                {isPlaying ? <Pause size={17} /> : <Play size={17} className="translate-x-0.5" />}
              </button>

              <div>
                <span className="text-xs font-bold text-white block">
                  {isPlaying ? 'معزوفة الملوك تعمل' : 'المعزوفة متوقفة'}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {isPlaying ? 'استرخاء ملكي هادئ 🌙' : 'انقر لتشغيل الصوت'}
                </span>
              </div>
            </div>

            {isPlaying && (
              <div className="flex items-end gap-1 h-5 px-2">
                <span className="w-1 bg-red-500 h-3 animate-pulse rounded-full" />
                <span className="w-1 bg-amber-400 h-5 animate-pulse delay-75 rounded-full" />
                <span className="w-1 bg-red-400 h-4 animate-pulse delay-150 rounded-full" />
                <span className="w-1 bg-amber-500 h-2 animate-pulse delay-100 rounded-full" />
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} />}
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

            <span className="text-[10px] font-mono text-zinc-400 w-8 text-left">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
