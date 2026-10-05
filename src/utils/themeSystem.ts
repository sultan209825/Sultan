import { ThemeId } from '../types';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  nameEn: string;
  emoji: string;
  accentHex: string;
  secondaryHex: string;
  glowColor: string;
  gradientBadge: string;
  gradientText: string;
  buttonClass: string;
  activeBorder: string;
  cardGlow: string;
  tagline: string;
}

export const THEMES: Record<string, ThemeDefinition> = {
  blood_royal: {
    id: 'blood_royal',
    name: 'الأحمر الملكي',
    nameEn: 'Blood Royal',
    emoji: '👑',
    accentHex: '#ef4444',
    secondaryHex: '#f43f5e',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    gradientBadge: 'from-red-600/30 to-rose-600/20 text-red-200 border-red-500/40',
    gradientText: 'from-red-400 via-rose-300 to-amber-300',
    buttonClass: 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    activeBorder: 'border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.25)]',
    cardGlow: 'hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    tagline: 'الطابع الملكي الأصلي للسلطان باللون القرمزي والدموي الفاخر'
  },
  imperial_gold: {
    id: 'imperial_gold',
    name: 'الذهب الإمبراطوري',
    nameEn: 'Imperial Gold',
    emoji: '🪙',
    accentHex: '#f59e0b',
    secondaryHex: '#eab308',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    gradientBadge: 'from-amber-600/30 to-yellow-600/20 text-amber-200 border-amber-500/40',
    gradientText: 'from-amber-300 via-yellow-200 to-orange-300',
    buttonClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    activeBorder: 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    cardGlow: 'hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    tagline: 'بريق الذهب الخالص عيار 24 مع الفخامة الإمبراطورية'
  },
  cyber_neon: {
    id: 'cyber_neon',
    name: 'السايبربنك النيون',
    nameEn: 'Cyber Neon',
    emoji: '🌌',
    accentHex: '#06b6d4',
    secondaryHex: '#a855f7',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    gradientBadge: 'from-cyan-600/30 to-purple-600/20 text-cyan-200 border-cyan-500/40',
    gradientText: 'from-cyan-300 via-sky-200 to-fuchsia-400',
    buttonClass: 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    activeBorder: 'border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.25)]',
    cardGlow: 'hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]',
    tagline: 'أضواء النيون الكهربائية وموجات السايبربنك المستقبلية'
  },
  stealth_black: {
    id: 'stealth_black',
    name: 'الأسود الشبحي',
    nameEn: 'Stealth Black',
    emoji: '🖤',
    accentHex: '#94a3b8',
    secondaryHex: '#ffffff',
    glowColor: 'rgba(255, 255, 255, 0.35)',
    gradientBadge: 'from-zinc-700/40 to-slate-800/30 text-zinc-200 border-white/20',
    gradientText: 'from-white via-zinc-300 to-slate-400',
    buttonClass: 'bg-white hover:bg-zinc-200 text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.3)]',
    activeBorder: 'border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.15)]',
    cardGlow: 'hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]',
    tagline: 'الهدوء الشبحي، ألياف الكربون الداكنة والأناقة التيتانيوم الفاحمة'
  },
  emerald_dynasty: {
    id: 'emerald_dynasty',
    name: 'الزمرد الملكي',
    nameEn: 'Emerald Dynasty',
    emoji: '💎',
    accentHex: '#10b981',
    secondaryHex: '#14b8a6',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    gradientBadge: 'from-emerald-600/30 to-teal-600/20 text-emerald-200 border-emerald-500/40',
    gradientText: 'from-emerald-300 via-teal-200 to-cyan-300',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    activeBorder: 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    cardGlow: 'hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    tagline: 'الأخضر الزمردي الأنيق مع إشعاع الجواهر النفيسة'
  }
};

// Aliases for legacy config values
THEMES['royal'] = THEMES.blood_royal;
THEMES['default'] = THEMES.blood_royal;
THEMES['emerald'] = THEMES.emerald_dynasty;
THEMES['rose'] = THEMES.blood_royal;

export function getTheme(themeId?: string): ThemeDefinition {
  if (themeId && THEMES[themeId]) {
    return THEMES[themeId];
  }
  return THEMES.blood_royal;
}

export const THEME_LIST = [
  THEMES.blood_royal,
  THEMES.imperial_gold,
  THEMES.cyber_neon,
  THEMES.stealth_black,
  THEMES.emerald_dynasty
];
