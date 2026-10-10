import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, X } from 'lucide-react';
import { THEME_LIST, ThemeDefinition, getTheme } from '../utils/themeSystem';
import { audioEngine } from '../utils/audioEngine';
import { ThemeId } from '../types';
import { safeLocalStorage } from '../utils/safeStorage';
import { CustomThemeModal } from './CustomThemeModal';

interface ThemeSwitcherProps {
  currentTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const activeTheme = getTheme(currentTheme);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectTheme = (theme: ThemeDefinition) => {
    audioEngine.playPowerUpSound();
    onThemeChange(theme.id);
    safeLocalStorage.setItem('sultan_theme', theme.id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => {
          audioEngine.playClickSound();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-300 backdrop-blur-md active:scale-95 group ${
          isOpen
            ? 'bg-white/20 border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            : 'bg-black/60 border-white/10 hover:border-white/30 text-zinc-300 hover:text-white'
        }`}
        title="تغيير ثيم ومظهر الموقع الفاخر"
      >
        <span className="text-sm group-hover:scale-110 transition-transform">{activeTheme.emoji}</span>
        <span className="hidden sm:inline font-mono-custom text-[11px]">{activeTheme.name}</span>
        <Palette size={13} style={{ color: activeTheme.accentHex }} className="transition-transform group-hover:rotate-45" />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2.5 w-72 sm:w-80 p-3.5 rounded-2xl bg-[#09090f]/95 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: activeTheme.accentHex }} />
              <span className="text-xs font-bold text-white">اختر ثيم السلطان الفاخر 🎨</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1.5">
            {THEME_LIST.map((theme) => {
              const isSelected = theme.id === activeTheme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-3 group ${
                    isSelected
                      ? `${theme.activeBorder} bg-white/10 text-white`
                      : 'border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0 group-hover:scale-125 transition-transform">
                      {theme.emoji}
                    </span>
                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">{theme.name}</span>
                        <span className="text-[10px] font-mono-custom text-zinc-400">({theme.nameEn})</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{theme.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: theme.accentHex }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: theme.secondaryHex }}
                      />
                    </div>
                    {isSelected && <Check size={14} style={{ color: theme.accentHex }} className="animate-bounce" />}
                  </div>
                </button>
              );
            })}

            {/* Custom Theme Creator Button */}
            <button
              onClick={() => {
                audioEngine.playPowerUpSound();
                setIsCustomModalOpen(true);
                setIsOpen(false);
              }}
              className="w-full mt-2 p-2.5 rounded-xl border border-dashed border-amber-500/50 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Palette size={15} />
              <span>مصمم الثيمات المخصص 🎨</span>
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 text-center">
            <span className="text-[10px] font-mono-custom text-zinc-400">
              يتم حفظ ثيمك المفضل تلقائياً في جهازك ⚡
            </span>
          </div>
        </div>
      )}

      {/* Custom Theme Creator Modal */}
      <CustomThemeModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onApplyTheme={() => {
          onThemeChange('custom');
          safeLocalStorage.setItem('sultan_theme', 'custom');
        }}
      />
    </div>
  );
};
