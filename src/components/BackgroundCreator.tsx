import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Upload,
  Download,
  Plus,
  Trash2,
  Check,
  Copy,
  RefreshCw,
  Sliders,
  Eye,
  SlidersHorizontal,
  FileCode,
  Layers,
  Wand2,
  Maximize2,
  Minimize2,
  Flame,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GradientPreset, SiteConfig } from '../types';
import { CURATED_GRADIENT_PRESETS, validateCssGradient } from '../data/defaultGradientPresets';
import { audioEngine } from '../utils/audioEngine';

interface BackgroundCreatorProps {
  config: SiteConfig;
  onUpdateConfig: (updated: Partial<SiteConfig>) => void;
  showToast: (msg: string) => void;
}

interface ColorStop {
  id: string;
  color: string;
  position: number; // 0 to 100
}

export const BackgroundCreator: React.FC<BackgroundCreatorProps> = ({
  config,
  onUpdateConfig,
  showToast
}) => {
  // Saved presets from config or default curated
  const [presets, setPresets] = useState<GradientPreset[]>(() => {
    const custom = Array.isArray(config.gradientPresets) ? config.gradientPresets : [];
    // Combine curated with custom (avoid duplicate IDs)
    const curatedIds = new Set(CURATED_GRADIENT_PRESETS.map((p) => p.id));
    const uniqueCustom = custom.filter((p) => !curatedIds.has(p.id));
    return [...CURATED_GRADIENT_PRESETS, ...uniqueCustom];
  });

  const [activePresetId, setActivePresetId] = useState<string>(
    config.activeGradientPresetId || ''
  );
  const [appliedGradient, setAppliedGradient] = useState<string>(
    config.customGradient || ''
  );

  // Studio Builder State
  const [gradientType, setGradientType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [angle, setAngle] = useState<number>(135);
  const [radialShape, setRadialShape] = useState<'circle' | 'ellipse'>('circle');
  const [radialPosition, setRadialPosition] = useState<string>('center');
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: '1', color: '#070305', position: 0 },
    { id: '2', color: '#200810', position: 45 },
    { id: '3', color: '#050508', position: 100 }
  ]);

  // Raw CSS Code Mode
  const [rawCssInput, setRawCssInput] = useState<string>('');
  const [cssParseError, setCssParseError] = useState<string | null>(null);

  // New Preset Modal / Form
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [previewWithParticles, setPreviewWithParticles] = useState<boolean>(true);
  const [copiedPresetId, setCopiedPresetId] = useState<string | null>(null);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Build current gradient string from Studio State
  const buildCurrentGradientCss = (): string => {
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
    const stopsString = sortedStops
      .map((s) => `${s.color} ${s.position}%`)
      .join(', ');

    if (gradientType === 'linear') {
      return `linear-gradient(${angle}deg, ${stopsString})`;
    } else if (gradientType === 'radial') {
      const posMap: Record<string, string> = {
        center: '50% 50%',
        top: '50% 20%',
        bottom: '50% 80%',
        top_left: '20% 20%',
        top_right: '80% 20%'
      };
      const pos = posMap[radialPosition] || '50% 50%';
      return `radial-gradient(${radialShape} at ${pos}, ${stopsString})`;
    } else {
      const conicStops = sortedStops
        .map((s) => `${s.color} ${(s.position / 100) * 360}deg`)
        .join(', ');
      return `conic-gradient(from ${angle}deg at 50% 50%, ${conicStops})`;
    }
  };

  const currentStudioCss = buildCurrentGradientCss();

  // Particle effect on interactive preview card
  useEffect(() => {
    if (!previewWithParticles) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = canvas.parentElement?.clientHeight || 240;

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.5 - 0.2,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.7 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444'
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.04;
        if (p.y < 0) p.y = canvas.height;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.sin(p.pulse) * 0.5 + 0.5);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [previewWithParticles, isFullscreenPreview]);

  // Color stop helpers
  const handleAddColorStop = () => {
    audioEngine.playAdminClick();
    if (colorStops.length >= 8) {
      showToast('الحد الأقصى لمحطات الألوان هو 8 محطات.');
      return;
    }
    const lastStop = colorStops[colorStops.length - 1];
    const newPos = Math.min(95, (lastStop ? lastStop.position : 50) + 15);
    const newStop: ColorStop = {
      id: `stop_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      color: '#3b82f6',
      position: newPos
    };
    setColorStops([...colorStops, newStop]);
  };

  const handleRemoveColorStop = (id: string) => {
    audioEngine.playAdminClick();
    if (colorStops.length <= 2) {
      showToast('يجب أن يحتوي التدرج على محطتين لونيتين على الأقل.');
      return;
    }
    setColorStops(colorStops.filter((s) => s.id !== id));
  };

  const handleUpdateStopColor = (id: string, color: string) => {
    setColorStops(colorStops.map((s) => (s.id === id ? { ...s, color } : s)));
  };

  const handleUpdateStopPosition = (id: string, position: number) => {
    setColorStops(colorStops.map((s) => (s.id === id ? { ...s, position } : s)));
  };

  // Apply gradient directly to site
  const handleApplyGradient = (cssString: string, presetId: string = '') => {
    audioEngine.playPowerUpSound();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    setAppliedGradient(cssString);
    setActivePresetId(presetId);
    onUpdateConfig({
      customGradient: cssString,
      activeGradientPresetId: presetId
    });
    showToast('✨ تم تطبيق التدرج المخصص على خلفية الموقع بنجاح!');
  };

  // Disable custom gradient and revert to default theme background
  const handleResetToDefault = () => {
    audioEngine.playAdminClick();
    setAppliedGradient('');
    setActivePresetId('');
    onUpdateConfig({
      customGradient: '',
      activeGradientPresetId: ''
    });
    showToast('🔄 تم إلغاء التدرج المخصص والعودة للخلفية الأساسية.');
  };

  // Save current studio design as a new preset
  const handleSaveCurrentAsPreset = () => {
    if (!presetNameInput.trim()) {
      showToast('يرجى كتابة اسم للبريسيت أولاً!');
      return;
    }
    audioEngine.playAdminSave();
    const newPreset: GradientPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: presetNameInput.trim(),
      css: currentStudioCss,
      type: gradientType,
      category: 'custom',
      createdAt: new Date().toISOString(),
      isCustom: true
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    onUpdateConfig({ gradientPresets: updatedPresets });
    setPresetNameInput('');
    setIsSavingPreset(false);
    confetti({ particleCount: 35, spread: 50 });
    showToast(`✅ تم حفظ البريسيت "${newPreset.name}" في مكتبتك بنجاح!`);
  };

  // Delete custom preset
  const handleDeletePreset = (id: string, name: string) => {
    audioEngine.playAdminClick();
    const filtered = presets.filter((p) => p.id !== id);
    setPresets(filtered);
    onUpdateConfig({ gradientPresets: filtered });
    if (activePresetId === id) {
      handleResetToDefault();
    }
    showToast(`🗑️ تم حذف البريسيت "${name}" من المكتبة.`);
  };

  // Load a preset into Studio Editor
  const handleLoadPresetIntoStudio = (preset: GradientPreset) => {
    audioEngine.playAdminClick();
    // Parse preset CSS if possible
    setRawCssInput(preset.css);
    showToast(`🎨 تم تحميل بريسيت "${preset.name}" إلى استوديو التصميم.`);
  };

  // Copy CSS to clipboard
  const handleCopyCss = async (css: string, id: string) => {
    audioEngine.playClickSound();
    try {
      await navigator.clipboard.writeText(css);
      setCopiedPresetId(id);
      setTimeout(() => setCopiedPresetId(null), 2500);
      showToast('📋 تم نسخ كود CSS إلى الحافظة!');
    } catch {
      showToast('تعذر النسخ تلقائياً.');
    }
  };

  // Parse Raw CSS string into applied studio
  const handleParseAndApplyRawCss = () => {
    if (!rawCssInput.trim()) {
      setCssParseError('يرجى كتابة أو لصق كود التدرج أولاً.');
      return;
    }
    if (!validateCssGradient(rawCssInput)) {
      setCssParseError('كود CSS غير صالح! يجب أن يبدأ بـ linear-gradient أو radial-gradient أو conic-gradient.');
      return;
    }
    setCssParseError(null);
    audioEngine.playAdminSave();
    handleApplyGradient(rawCssInput.trim(), 'custom_raw');
  };

  // Export all presets to a downloadable JSON file
  const handleExportPresetsJson = () => {
    audioEngine.playClickSound();
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(presets, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'sultan-gradient-presets.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      audioEngine.playRoyalFanfare();
      showToast('📥 تم تصدير ملف البريسيتات بنجاح!');
    } catch {
      showToast('فشل تصدير ملف البريسيتات.');
    }
  };

  // Upload Presets File (.json or .css)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) return;

        // Try JSON format
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter((item) => item?.css && validateCssGradient(item.css));
            if (valid.length === 0) {
              showToast('الملف لا يحتوي على بريسيتات صالحة.');
              return;
            }
            const normalized: GradientPreset[] = valid.map((v, i) => ({
              id: v.id || `uploaded_${Date.now()}_${i}`,
              name: v.name || `بريسيت مستورد ${i + 1}`,
              css: v.css,
              type: v.type || 'linear',
              category: 'uploaded',
              createdAt: new Date().toISOString(),
              isCustom: true
            }));

            // Merge with existing
            const existingIds = new Set(presets.map((p) => p.id));
            const newOnes = normalized.filter((n) => !existingIds.has(n.id));
            const combined = [...presets, ...newOnes];
            setPresets(combined);
            onUpdateConfig({ gradientPresets: combined });
            audioEngine.playRoyalFanfare();
            confetti({ particleCount: 60, spread: 70 });
            showToast(`🎉 تم استيراد ${newOnes.length} بريسيت بنجاح من ملف JSON!`);
            return;
          }
        }

        // Try raw CSS text
        const trimmed = content.trim();
        if (validateCssGradient(trimmed)) {
          setRawCssInput(trimmed);
          handleApplyGradient(trimmed, 'uploaded_raw');
          showToast('✅ تم استيراد وتطبيق كود التدرج من الملف بنجاح!');
          return;
        }

        // Search for gradient inside CSS file
        const match = trimmed.match(/(?:linear|radial|conic)-gradient\([^;]+\)/i);
        if (match && match[0]) {
          setRawCssInput(match[0]);
          handleApplyGradient(match[0], 'uploaded_match');
          showToast('✅ تم استخراج كود التدرج من ملف CSS وتطبيقه بنجاح!');
          return;
        }

        showToast('تعذر العثور على تدرج CSS صالح في الملف المرفوع.');
      } catch (err: any) {
        showToast(`فشل قراءة الملف: ${err.message || 'خطأ في التنسيق'}`);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredPresets = presets.filter((p) => {
    if (selectedFilterCategory === 'all') return true;
    if (selectedFilterCategory === 'custom') return p.isCustom;
    return p.category === selectedFilterCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* Hidden File Input for Preset Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json,.css,.txt"
        className="hidden"
      />

      {/* Header Banner & Active Status Capsule */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-red-950/30 to-black/80 border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-md">
                <Palette size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>صانع ومصمم الخلفيات الملكية (Background Creator)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono">
                    PRO
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  صمم تدرجات CSS لونية فاخرة، ارفع بريسيتات مخصصة، وطبقها فوراً على خلفية الموقع وBackgroundCanvas!
                </p>
              </div>
            </div>

            {/* Current Active Status Indicator */}
            <div className="flex items-center gap-2.5 pt-2 flex-wrap text-xs">
              <span className="text-zinc-400 font-bold">الخلفية النشطة الآن:</span>
              {appliedGradient ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-900/40 border border-purple-400/40 text-purple-200">
                  <span
                    className="w-4 h-4 rounded-full border border-white/30 shrink-0 shadow-sm"
                    style={{ background: appliedGradient }}
                  />
                  <span className="font-bold truncate max-w-[180px] sm:max-w-[260px]">
                    {presets.find((p) => p.id === activePresetId)?.name || 'تدرج CSS مخصص'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-400 font-mono text-[11px]">
                  <span>خلفية الثيم الأساسية (Default Dark)</span>
                </span>
              )}

              {appliedGradient && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                  title="العودة للخلفية الأساسية"
                >
                  إلغاء التدرج 🔄
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              title="رفع ملف بريسيتات من جهازك (.json أو .css)"
            >
              <Upload size={14} className="text-cyan-400" />
              <span>رفع بريسيتات 📥</span>
            </button>

            <button
              type="button"
              onClick={handleExportPresetsJson}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              title="تصدير جميع البريسيتات كملف JSON"
            >
              <Download size={14} className="text-amber-400" />
              <span>تصدير JSON 📤</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace: Visual Builder + Live Canvas Particle Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Live Interactive Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0c0d18] border border-white/10 shadow-xl space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Eye size={15} className="text-cyan-400" />
                <span>معاينة حية فورية (Live Canvas Preview)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewWithParticles(!previewWithParticles)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    previewWithParticles
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                  title="تشغيل/إيقاف محاكاة جزيئات وشهب BackgroundCanvas"
                >
                  <Sparkles size={11} />
                  <span>{previewWithParticles ? 'الشهب مفعلة ✨' : 'بدون شهب'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="تكبير المعاينة"
                >
                  {isFullscreenPreview ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              </div>
            </div>

            {/* The Actual Rendered Preview Swatch */}
            <div
              className={`relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-300 flex items-center justify-center ${
                isFullscreenPreview ? 'h-96' : 'h-64 sm:h-72'
              }`}
              style={{ background: currentStudioCss }}
            >
              {/* Particle simulation canvas */}
              {previewWithParticles && (
                <canvas
                  ref={previewCanvasRef}
                  className="absolute inset-0 pointer-events-none w-full h-full"
                />
              )}

              {/* Watermark badge inside preview */}
              <div className="relative z-10 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-center shadow-lg pointer-events-none">
                <span className="text-xs font-black text-white block">𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪</span>
                <span className="text-[10px] text-zinc-300 font-mono">BackgroundCanvas Ready</span>
              </div>
            </div>

            {/* CSS String Code Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold">
                <span>كود الـ CSS المولد:</span>
                <button
                  type="button"
                  onClick={() => handleCopyCss(currentStudioCss, 'studio_preview')}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedPresetId === 'studio_preview' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedPresetId === 'studio_preview' ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-black/70 border border-white/10 text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all select-all">
                {currentStudioCss}
              </pre>
            </div>

            {/* Primary Action Buttons for Studio */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleApplyGradient(currentStudioCss, 'studio_active')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>تطبيق على الموقع 🚀</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSavingPreset(true)}
                className="w-full py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>حفظ في المكتبة 💾</span>
              </button>
            </div>

            {/* Save Preset Inline Input */}
            {isSavingPreset && (
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2.5 animate-fadeIn">
                <span className="text-xs font-bold text-purple-200 block">
                  اسم البريسيت الجديد:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    placeholder="مثال: سلطان البنفسجي الإمبراطوري 👑"
                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsPreset}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSavingPreset(false)}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs shrink-0 cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Studio Controls & Color Stops */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0c0d18] border border-white/10 shadow-xl space-y-5">
            {/* 1. Gradient Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Layers size={14} className="text-purple-400" />
                <span>نوع التدرج (Gradient Type)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'linear', label: 'خطي (Linear)', icon: '↔️' },
                  { id: 'radial', label: 'دائري (Radial)', icon: '🎯' },
                  { id: 'conic', label: 'مخروطي (Conic)', icon: '🔄' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      audioEngine.playAdminClick();
                      setGradientType(type.id as any);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      gradientType === type.id
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Angle Slider or Radial Positioning */}
            {gradientType === 'linear' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <SlidersHorizontal size={14} className="text-cyan-400" />
                    <span>زاوية التدرج (Angle):</span>
                  </span>
                  <span className="font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30">
                    {angle}°
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={angle}
                    onChange={(e) => setAngle(Number(e.target.value))}
                    className="flex-1 accent-cyan-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                  />
                </div>
                {/* Quick Angle Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setAngle(deg)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        angle === deg
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>
            )}

            {gradientType === 'radial' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">الشكل (Shape):</label>
                  <select
                    value={radialShape}
                    onChange={(e) => setRadialShape(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                  >
                    <option value="circle">دائري متساوي (Circle)</option>
                    <option value="ellipse">بيضاوي ممتد (Ellipse)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">نقطة المركز (Origin):</label>
                  <select
                    value={radialPosition}
                    onChange={(e) => setRadialPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                  >
                    <option value="center">في المنتصف (Center)</option>
                    <option value="top">في الأعلى (Top Center)</option>
                    <option value="bottom">في الأسفل (Bottom Center)</option>
                    <option value="top_left">أعلى اليسار (Top Left)</option>
                    <option value="top_right">أعلى اليمين (Top Right)</option>
                  </select>
                </div>
              </div>
            )}

            {gradientType === 'conic' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-300">زاوية البدء (Start Angle):</span>
                  <span className="font-mono text-purple-300">{angle}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                />
              </div>
            )}

            {/* 3. Color Stops Manager */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Palette size={14} className="text-amber-400" />
                  <span>محطات الألوان والنسب (Color Stops & Positions)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddColorStop}
                  disabled={colorStops.length >= 8}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Plus size={13} />
                  <span>إضافة لون</span>
                </button>
              </div>

              {/* Visual Gradient Bar with interactive stops */}
              <div
                className="h-5 rounded-xl border border-white/20 shadow-inner w-full relative"
                style={{
                  background: `linear-gradient(90deg, ${[...colorStops]
                    .sort((a, b) => a.position - b.position)
                    .map((s) => `${s.color} ${s.position}%`)
                    .join(', ')})`
                }}
              />

              {/* Color Stops List */}
              <div className="space-y-2">
                {colorStops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3 text-xs"
                  >
                    <span className="text-zinc-400 font-mono font-bold w-4 text-center">
                      #{index + 1}
                    </span>

                    {/* Color Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => handleUpdateStopColor(stop.id, e.target.value)}
                        className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={stop.color}
                        onChange={(e) => handleUpdateStopColor(stop.id, e.target.value)}
                        className="w-20 px-2 py-1 rounded-lg bg-zinc-900 border border-white/10 text-[11px] font-mono text-zinc-200 text-center uppercase"
                      />
                    </div>

                    {/* Position Slider */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={stop.position}
                        onChange={(e) => handleUpdateStopPosition(stop.id, Number(e.target.value))}
                        className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                      />
                      <span className="font-mono text-zinc-400 w-9 text-left text-[11px]">
                        {stop.position}%
                      </span>
                    </div>

                    {/* Remove Stop */}
                    <button
                      type="button"
                      onClick={() => handleRemoveColorStop(stop.id)}
                      disabled={colorStops.length <= 2}
                      className="p-1 rounded-lg text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-20 cursor-pointer"
                      title="حذف هذا اللون"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Raw CSS Paste Mode Tab */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <FileCode size={14} className="text-emerald-400" />
                <span>لصق كود CSS يدوي (Direct CSS Paste)</span>
              </label>
              <div className="space-y-1.5">
                <textarea
                  value={rawCssInput}
                  onChange={(e) => {
                    setRawCssInput(e.target.value);
                    setCssParseError(null);
                  }}
                  placeholder="linear-gradient(135deg, #090b14 0%, #1e1b4b 50%, #0f172a 100%)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-zinc-600"
                />
                {cssParseError && (
                  <p className="text-[11px] text-red-400 font-bold">{cssParseError}</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-zinc-500">
                    يمكنك نسخ أي تدرج من Figma أو Coolors أو CSSGradient ولصقه هنا مباشرة.
                  </span>
                  <button
                    type="button"
                    onClick={handleParseAndApplyRawCss}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Wand2 size={13} />
                    <span>تطبيق الكود فوراً</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Presets Library Vault Section */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0c0d18] border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h4 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>مكتبة البريسيتات الجاهزة والمحفوظة ({filteredPresets.length})</span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              اختر أي تدرج لتطبيقه على خلفية الموقع بلمسة واحدة
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'royal', label: 'ملكي 👑' },
              { id: 'dark', label: 'داكن 🖤' },
              { id: 'cyber', label: 'سايبر ⚡' },
              { id: 'custom', label: 'تدرجاتك المخصصة 🎨' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  selectedFilterCategory === cat.id
                    ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                    : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredPresets.map((preset) => {
            const isCurrentlyActive = appliedGradient === preset.css;

            return (
              <div
                key={preset.id}
                className={`group relative rounded-2xl border p-3 flex flex-col justify-between gap-3 transition-all duration-200 ${
                  isCurrentlyActive
                    ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/40 shadow-xl'
                    : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                }`}
              >
                {/* Visual Swatch */}
                <div
                  className="h-24 rounded-xl border border-white/15 shadow-inner relative overflow-hidden group-hover:scale-[1.02] transition-transform flex items-center justify-center cursor-pointer"
                  style={{ background: preset.css }}
                  onClick={() => handleApplyGradient(preset.css, preset.id)}
                  title="انقر للتطبيق فوراً"
                >
                  {isCurrentlyActive && (
                    <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-emerald-400/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shadow-lg">
                      <Check size={11} className="text-emerald-400" />
                      <span>مفعل حالياً</span>
                    </span>
                  )}
                </div>

                {/* Preset Metadata & Actions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold text-xs text-white truncate">{preset.name}</p>
                    {preset.isCustom && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        مخصص
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleApplyGradient(preset.css, preset.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isCurrentlyActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                      }`}
                    >
                      {isCurrentlyActive ? <Check size={12} /> : null}
                      <span>{isCurrentlyActive ? 'مطبق' : 'تطبيق'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoadPresetIntoStudio(preset)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="فتح في استوديو التصميم للتعديل"
                    >
                      <Sliders size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyCss(preset.css, preset.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="نسخ كود الـ CSS"
                    >
                      {copiedPresetId === preset.id ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>

                    {preset.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(preset.id, preset.name)}
                        className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 transition-colors cursor-pointer"
                        title="حذف هذا البريسيت"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
