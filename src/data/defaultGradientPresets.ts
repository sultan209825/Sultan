import { GradientPreset } from '../types';

export const CURATED_GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'sultan_royal_crimson',
    name: 'سلطان رويال كريمزون 👑',
    css: 'linear-gradient(135deg, #070305 0%, #200810 45%, #050508 100%)',
    type: 'linear',
    category: 'royal',
    isCustom: false
  },
  {
    id: 'midnight_cyberpunk',
    name: 'ميدنايت سايبربانك 🌌',
    css: 'linear-gradient(135deg, #050510 0%, #150d30 50%, #030712 100%)',
    type: 'linear',
    category: 'neon',
    isCustom: false
  },
  {
    id: 'neon_cyan_matrix',
    name: 'نيون ماتريكس سايان ⚡',
    css: 'linear-gradient(135deg, #02131b 0%, #062b44 50%, #020617 100%)',
    type: 'linear',
    category: 'cyber',
    isCustom: false
  },
  {
    id: 'blood_moon_eclipse',
    name: 'كسوف القمر الدموي 🩸',
    css: 'radial-gradient(circle at 50% 20%, #3f0909 0%, #140305 50%, #050508 100%)',
    type: 'radial',
    category: 'dark',
    isCustom: false
  },
  {
    id: 'amethyst_royal_aura',
    name: 'أورا جمشت ملكية 🔮',
    css: 'linear-gradient(160deg, #130620 0%, #2e0854 45%, #07020d 100%)',
    type: 'linear',
    category: 'royal',
    isCustom: false
  },
  {
    id: 'emerald_mirage',
    name: 'سراب الزمرد العميق 🌲',
    css: 'linear-gradient(140deg, #021a14 0%, #064030 40%, #010805 100%)',
    type: 'linear',
    category: 'nature',
    isCustom: false
  },
  {
    id: 'golden_sultan_ember',
    name: 'جمر الذهب الإمبراطوري 🪙',
    css: 'linear-gradient(135deg, #1a1203 0%, #3d2905 45%, #0a0702 100%)',
    type: 'linear',
    category: 'gold',
    isCustom: false
  },
  {
    id: 'deep_obsidian_void',
    name: 'فراغ الأوبسيديان الدامس 🪐',
    css: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #030712 60%, #000000 100%)',
    type: 'radial',
    category: 'dark',
    isCustom: false
  },
  {
    id: 'cosmic_supernova',
    name: 'سوبرنوفا فلكية 🌠',
    css: 'conic-gradient(from 180deg at 50% 50%, #0a0314 0deg, #280a3e 90deg, #081a2e 180deg, #2b0818 270deg, #0a0314 360deg)',
    type: 'conic',
    category: 'cosmic',
    isCustom: false
  }
];

export function validateCssGradient(cssString: string): boolean {
  if (!cssString || typeof cssString !== 'string') return false;
  const trimmed = cssString.trim().toLowerCase();
  return (
    trimmed.startsWith('linear-gradient') ||
    trimmed.startsWith('radial-gradient') ||
    trimmed.startsWith('conic-gradient') ||
    trimmed.startsWith('repeating-linear-gradient') ||
    trimmed.startsWith('repeating-radial-gradient')
  );
}
