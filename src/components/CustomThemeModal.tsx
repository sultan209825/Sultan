import React, { useState } from 'react';
import { X, Palette, Check, Sparkles, RefreshCw, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioEngine';
import {
  CustomThemeColors,
  getCustomThemeColors,
  saveCustomThemeColors,
  createCustomThemeDefinition
} from '../utils/themeSystem';

interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTheme: () => void;
}

const PRESET_COMBOS: { name: string; accent: string; secondary: string }[] = [
  { name: 'وردي نيون ولافندر 🌸', accent: '#ec4899', secondary: '#8b5cf6' },
  { name: 'أزرق كهربائي وسماوي ⚡', accent: '#0284c7', secondary: '#38bdf8' },
  { name: 'برتقالي لاهب وياقوتي 🔥', accent: '#f97316', secondary: '#e11d48' },
  { name: 'بنفسجي ملكي وكوزميك 🌌', accent: '#9333ea', secondary: '#ec4899' },
  { name: 'أخضر ليزري وزمرّد 🧪', accent: '#22c55e', secondary: '#14b8a6' },
  { name: 'ذهبي نيون وكريستال 🪙', accent: '#eab308', secondary: '#f97316' }
];

export const CustomThemeModal: React.FC<CustomThemeModalProps> = ({
  isOpen,
  onClose,
  onApplyTheme
}) => {
  const [colors, setColors] = useState<CustomThemeColors>(() => getCustomThemeColors());
  const [themeName, setThemeName] = useState<string>(colors.name || 'ثيمي الملكي الخاص');

  if (!isOpen) return null;

  const handleSelectPreset = (p: typeof PRESET_COMBOS[0]) => {
    audioEngine.playClickSound();
    setColors({ accentHex: p.accent, secondaryHex: p.secondary, name: p.name });
    setThemeName(p.name);
  };

  const handleSaveAndApply = () => {
    const updated: CustomThemeColors = {
      accentHex: colors.accentHex,
      secondaryHex: colors.secondaryHex,
      name: themeName.trim() || 'الثيم المخصص'
    };
    saveCustomThemeColors(updated);
    audioEngine.playRoyalFanfare();
    confetti({ particleCount: 60, spread: 60 });
    onApplyTheme();
    onClose();
  };

  const handleClose = () => {
    audioEngine.playClickSound();
    onClose();
  };

  const previewTheme = createCustomThemeDefinition(colors);

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0e0e18] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-4 animate-modal-slide-up max-h-[92vh] overflow-y-auto"
        style={{
          boxShadow: `0 0 40px ${colors.accentHex}35, 0 20px 40px rgba(0,0,0,0.8)`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md border"
              style={{
                background: `linear-gradient(135deg, ${colors.accentHex}, ${colors.secondaryHex})`,
                borderColor: `${colors.accentHex}80`
              }}
            >
              <Palette size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-display-custom">
                مصمم الثيمات الملكي الحي (Custom Theme)
              </h3>
              <p className="text-[11px] text-zinc-400">
                اختر ألوانك الخاصة ونسّق بروفايلك على مزاجك
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Preview Box */}
        <div
          className="p-4 rounded-2xl border text-center space-y-2.5 transition-all duration-300 shadow-inner"
          style={{
            background: `linear-gradient(135deg, ${colors.accentHex}15, ${colors.secondaryHex}10, #0a0a14)`,
            borderColor: `${colors.accentHex}50`
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <Eye size={12} /> معاينة حية للمظهر:
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{
                backgroundColor: `${colors.accentHex}20`,
                borderColor: `${colors.accentHex}60`,
                color: colors.accentHex
              }}
            >
              {themeName || 'ثيم مخصص'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-transform"
              style={{
                background: `linear-gradient(to right, ${colors.accentHex}, ${colors.secondaryHex})`,
                boxShadow: `0 0 15px ${colors.accentHex}60`
              }}
            >
              زر ملكي مخصص 👑
            </button>
          </div>
        </div>

        {/* Color Pickers */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              اسم الثيم:
            </label>
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="مثال: الوردي الملكي"
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                اللون الأساسي (Accent):
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10">
                <input
                  type="color"
                  value={colors.accentHex}
                  onChange={(e) => setColors((prev) => ({ ...prev, accentHex: e.target.value }))}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-zinc-300 uppercase">
                  {colors.accentHex}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                اللون الثانوي (Secondary):
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10">
                <input
                  type="color"
                  value={colors.secondaryHex}
                  onChange={(e) => setColors((prev) => ({ ...prev, secondaryHex: e.target.value }))}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-zinc-300 uppercase">
                  {colors.secondaryHex}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] text-zinc-400 font-bold block">
            أو اختر تشكيلة جاهزة وسريعة:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_COMBOS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-right flex items-center justify-between text-xs transition-all cursor-pointer active:scale-95"
              >
                <span className="truncate text-[11px] font-bold text-zinc-200">{p.name}</span>
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${p.accent}, ${p.secondary})`
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSaveAndApply}
          className="w-full py-3 rounded-2xl font-black text-xs text-white shadow-lg transition-transform active:scale-95 cursor-pointer mt-2"
          style={{
            background: `linear-gradient(to right, ${colors.accentHex}, ${colors.secondaryHex})`,
            boxShadow: `0 0 20px ${colors.accentHex}50`
          }}
        >
          حفظ وتطبيق الثيم الملكي فوراً 🎨
        </button>
      </div>
    </div>
  );
};
