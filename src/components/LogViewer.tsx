import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Trash2,
  FileText,
  Download,
  Clock,
  Smartphone,
  Laptop,
  Globe,
  RotateCcw,
  Zap,
  X,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import {
  SiteLogEntry,
  getStoredLogs,
  clearStoredLogs,
  deleteSingleStoredLog,
  exportLogsToTextFile,
  recordSiteLog
} from '../utils/siteLogger';
import { audioEngine } from '../utils/audioEngine';
import confetti from 'canvas-confetti';

interface LogViewerProps {
  onRefreshParentStats?: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ onRefreshParentStats }) => {
  const [logs, setLogs] = useState<SiteLogEntry[]>(() => getStoredLogs());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterTimeRange, setFilterTimeRange] = useState<'all' | 'today' | '24h' | '7d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync with localStorage on mount & when storage updates
  useEffect(() => {
    const handleSync = () => {
      setLogs(getStoredLogs());
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  // Distinct list of event types present in logs
  const eventTypesList = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.eventType) set.add(l.eventType);
    });
    return Array.from(set);
  }, [logs]);

  // Distinct list of countries in logs
  const countriesList = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.country) set.add(l.country);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered logs computation
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();

    return logs.filter((log) => {
      // 1. Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          (log.eventType && log.eventType.toLowerCase().includes(q)) ||
          (log.action && log.action.toLowerCase().includes(q)) ||
          (log.country && log.country.toLowerCase().includes(q)) ||
          (log.city && log.city.toLowerCase().includes(q)) ||
          (log.browser && log.browser.toLowerCase().includes(q)) ||
          (log.referrer && log.referrer.toLowerCase().includes(q)) ||
          (log.os && log.os.toLowerCase().includes(q)) ||
          (log.time && log.time.toLowerCase().includes(q)) ||
          (log.details && log.details.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Event Type Filter
      if (filterEventType !== 'all' && log.eventType !== filterEventType) {
        return false;
      }

      // 3. Device Filter
      if (filterDevice !== 'all' && log.device !== filterDevice) {
        return false;
      }

      // 4. Country Filter
      if (filterCountry !== 'all' && log.country !== filterCountry) {
        return false;
      }

      // 5. Time Range Filter
      const logTs = log.timestamp || now;
      if (filterTimeRange === 'today') {
        if (logTs < todayStartTime) return false;
      } else if (filterTimeRange === '24h') {
        if (logTs < now - oneDayMs) return false;
      } else if (filterTimeRange === '7d') {
        if (logTs < now - sevenDaysMs) return false;
      } else if (filterTimeRange === 'custom') {
        if (customStartDate) {
          const startMs = new Date(customStartDate).getTime();
          if (logTs < startMs) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (logTs > end.getTime()) return false;
        }
      }

      return true;
    });
  }, [
    logs,
    searchTerm,
    filterEventType,
    filterDevice,
    filterCountry,
    filterTimeRange,
    customStartDate,
    customEndDate
  ]);

  // KPIs
  const todayCount = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ts = todayStart.getTime();
    return logs.filter((l) => (l.timestamp || 0) >= ts).length;
  }, [logs]);

  const mobileCount = useMemo(() => {
    return logs.filter((l) => l.device === 'موبايل').length;
  }, [logs]);

  const mobilePercent = logs.length > 0 ? Math.round((mobileCount / logs.length) * 100) : 0;

  // Handlers
  const handleDeleteLog = (id: string) => {
    audioEngine.playAdminDanger();
    const updated = deleteSingleStoredLog(id);
    setLogs(updated);
    if (onRefreshParentStats) onRefreshParentStats();
    showToast('تم حذف السجل بنجاح! 🗑️');
  };

  const handleClearAllLogs = () => {
    audioEngine.playAdminDanger();
    clearStoredLogs();
    setLogs([]);
    setIsClearModalOpen(false);
    if (onRefreshParentStats) onRefreshParentStats();
    showToast('تم مسح كامل سجلات اللوق من التخزين بنجاح! 🗑️');
  };

  const handleExportText = () => {
    audioEngine.playAdminSave();
    if (filteredLogs.length === 0) {
      showToast('لا توجد سجلات لتصديرها! ⚠️');
      return;
    }
    exportLogsToTextFile(filteredLogs);
    showToast(`تم تصدير ${filteredLogs.length} سجل إلى ملف نصي (.txt) بنجاح! 📄`);
  };

  const handleResetFilters = () => {
    audioEngine.playAdminClick();
    setSearchTerm('');
    setFilterEventType('all');
    setFilterDevice('all');
    setFilterCountry('all');
    setFilterTimeRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    showToast('تمت إعادة ضبط فلاتر البحث! 🔄');
  };

  const handleAddMockInteraction = () => {
    audioEngine.playNotificationPing();
    const mockEvents = [
      { type: 'زيارة الموقع 🌍', action: 'زيارة صفحة رئيسية جديدة' },
      { type: 'كشف سر سلطان 👑', action: 'كتابة كلمة سلطان واكتشاف السر' },
      { type: 'فتح لعبة الركض 🎮', action: 'تشغيل لعبة الساحر وتخطي الحواجز' },
      { type: 'الضغط على زر 🔘', action: 'تفاعل مع أزرار التنقل الرئيسية' },
      { type: 'تقييم إيجابي 👍', action: 'تسجيل إعجاب ملكي في إحصاءات الموقع' },
      { type: 'تحميل ZIP 📦', action: 'تنزيل حزمة كود الموقع الجاهزة للاستضافة' }
    ];
    const picked = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    const mockCountries = [
      { country: 'مصر', flag: '🇪🇬', city: 'القاهرة' },
      { country: 'السعودية', flag: '🇸🇦', city: 'الرياض' },
      { country: 'الكويت', flag: '🇰🇼', city: 'حولي' },
      { country: 'الإمارات', flag: '🇦🇪', city: 'دبي' },
      { country: 'المغرب', flag: '🇲🇦', city: 'كازابلانكا' }
    ];
    const pickedCountry = mockCountries[Math.floor(Math.random() * mockCountries.length)];

    const entry = recordSiteLog(picked.type, picked.action, {
      country: pickedCountry.country,
      flag: pickedCountry.flag,
      city: pickedCountry.city,
      details: 'حدث تجريبي لحظي مسجل من لوحة التحكم'
    });

    setLogs(getStoredLogs());
    if (onRefreshParentStats) onRefreshParentStats();
    confetti({ particleCount: 35, spread: 60 });
    showToast(`تم تسجيل حدث تجريبي: [${entry.eventType}] ⚡`);
  };

  // Helper for badge color by eventType
  const getBadgeClass = (eventType: string) => {
    if (eventType.includes('سر') || eventType.includes('👑')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    if (eventType.includes('لعبة') || eventType.includes('🎮')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
    if (eventType.includes('تقييم') || eventType.includes('إيجابي') || eventType.includes('👍')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (eventType.includes('تحميل') || eventType.includes('ZIP') || eventType.includes('📦')) {
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
    if (eventType.includes('مشاركة') || eventType.includes('🔗')) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
    if (eventType.includes('زر') || eventType.includes('🔘')) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  return (
    <div className="space-y-6" data-log-ignore="true">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-5 py-2.5 rounded-2xl bg-[#0e0e1a]/95 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.5)] backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600/10 to-transparent border border-red-500/20">
          <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
            <span>إجمالي السجلات المسجلة</span>
            <ClipboardList size={16} className="text-red-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono">
            {logs.length}
          </span>
          <p className="text-[10px] text-zinc-500 mt-1">سجل تفاعلي في الذاكرة</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-500/20">
          <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
            <span>النتائج المصفاة الحالية</span>
            <Search size={16} className="text-indigo-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
            {filteredLogs.length}
          </span>
          <p className="text-[10px] text-indigo-300/80 mt-1">مطابق للفلاتر المختارة</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-500/20">
          <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
            <span>نشاطات وزيارات اليوم</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {todayCount}
          </span>
          <p className="text-[10px] text-zinc-400 mt-1">منذ منتصف الليل 12:00 AM</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-transparent border border-emerald-500/20">
          <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
            <span>نسبة الهواتف الذكية</span>
            <Smartphone size={16} className="text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {mobilePercent}%
          </span>
          <p className="text-[10px] text-emerald-300/80 mt-1">{mobileCount} زيارة عبر الموبايل</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 rounded-3xl bg-[#0e0e1a]/90 border border-white/10 shadow-xl space-y-6">
        {/* Header & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600/30 to-amber-500/30 border border-red-500/30 text-amber-400 flex items-center justify-center font-bold shadow-md">
              <ClipboardList size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">سجل اللوق المباشر والنشاطات (LogViewer)</h3>
                <span className="text-xs font-mono bg-red-600/20 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/30 font-bold">
                  {filteredLogs.length} من {logs.length}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                تتبع الزيارات، الضغط على الأزرار، فتح الألعاب، كشف الأسرار، وتصدير اللوق إلى ملف نصي.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleAddMockInteraction}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="تسجيل حدث تجريبي لاختبار السجلات"
            >
              <Zap size={13} />
              <span>تسجيل حدث تجريبي ⚡</span>
            </button>

            {/* Export to text file button */}
            <button
              type="button"
              onClick={handleExportText}
              disabled={filteredLogs.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
              title="تصدير السجلات المصفاة إلى ملف نصي (.txt) مفصل ومنسق"
            >
              <FileText size={14} />
              <span>تصدير السجلات إلى ملف نصي 📄</span>
            </button>

            {/* Clear Logs Button */}
            <button
              type="button"
              onClick={() => {
                audioEngine.playAdminDanger();
                setIsClearModalOpen(true);
              }}
              disabled={logs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 disabled:opacity-40 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              title="مسح وتفريغ جميع سجلات اللوق من التخزين"
            >
              <Trash2 size={13} />
              <span>مسح السجلات (Clear Logs) 🗑️</span>
            </button>
          </div>
        </div>

        {/* Search & Filters Toolbar */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث بنوع الحدث، الإجراء، الدولة، المدينة، المتصفح، أو المصدر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-9 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 outline-none text-xs focus:border-red-500 transition-colors shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdowns Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Event Type Dropdown */}
              <div className="relative">
                <select
                  value={filterEventType}
                  onChange={(e) => setFilterEventType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="all" className="bg-[#0e0e1a] text-white">⚡ جميع أنواع الأحداث</option>
                  {eventTypesList.map((et) => (
                    <option key={et} value={et} className="bg-[#0e0e1a] text-white">
                      {et}
                    </option>
                  ))}
                </select>
              </div>

              {/* Device Selector */}
              <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playAdminTab();
                    setFilterDevice('all');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                    filterDevice === 'all' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playAdminTab();
                    setFilterDevice('موبايل');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1 ${
                    filterDevice === 'موبايل' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={12} />
                  <span>موبايل</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playAdminTab();
                    setFilterDevice('كمبيوتر');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1 ${
                    filterDevice === 'كمبيوتر' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Laptop size={12} />
                  <span>كمبيوتر</span>
                </button>
              </div>

              {/* Country Dropdown */}
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="all" className="bg-[#0e0e1a] text-white">🌍 كل الدول</option>
                {countriesList.map((c) => (
                  <option key={c} value={c} className="bg-[#0e0e1a] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 font-bold ml-1 flex items-center gap-1">
                <Clock size={12} />
                <span>تصفية الوقت:</span>
              </span>

              {[
                { id: 'all', label: 'كل الأوقات' },
                { id: 'today', label: '📅 اليوم' },
                { id: '24h', label: '⏱️ آخر 24 ساعة' },
                { id: '7d', label: '📆 آخر 7 أيام' },
                { id: 'custom', label: '🗓️ تاريخ مخصص' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    audioEngine.playClickSound();
                    setFilterTimeRange(t.id as any);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterTimeRange === t.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent hover:border-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {filterTimeRange === 'custom' && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-black/60 border border-white/15 text-white text-xs outline-none"
                    title="من تاريخ"
                  />
                  <span>➔</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-black/60 border border-white/15 text-white text-xs outline-none"
                    title="إلى تاريخ"
                  />
                </div>
              )}

              {(searchTerm ||
                filterEventType !== 'all' ||
                filterDevice !== 'all' ||
                filterCountry !== 'all' ||
                filterTimeRange !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-bold flex items-center gap-1 transition-colors"
                  title="إلغاء التصفية وإعادة ضبط الفلاتر"
                >
                  <RotateCcw size={11} />
                  <span>إلغاء الفلترة</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 text-zinc-500 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h4 className="text-white font-bold text-sm">
              {logs.length === 0 ? 'سجل اللوق فارغ حالياً' : 'لا توجد سجلات تطابق شروط التصفية الحالية'}
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {logs.length === 0
                ? 'لم يتم تسجيل أي أحداث أو زيارات في الذاكرة بعد، اضغط على زر تسجيل حدث تجريبي للبدء.'
                : 'جرب إزالة أو تغيير كلمات البحث أو الفلاتر الزمنية لعرض جميع السجلات.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              {logs.length === 0 ? (
                <button
                  type="button"
                  onClick={handleAddMockInteraction}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Zap size={13} />
                  <span>تسجيل حدث تجريبي ⚡</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw size={13} />
                  <span>إعادة ضبط الفلاتر 🔄</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden overflow-x-auto shadow-inner">
            <table className="w-full text-right text-xs whitespace-nowrap">
              <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-bold">
                <tr>
                  <th className="p-3 text-center">#</th>
                  <th className="p-3">نوع الحدث</th>
                  <th className="p-3">تفاصيل الإجراء</th>
                  <th className="p-3">الوقت والتاريخ</th>
                  <th className="p-3">الدولة والمدينة</th>
                  <th className="p-3">الجهاز</th>
                  <th className="p-3">المتصفح والنظام</th>
                  <th className="p-3">المصدر (Referrer)</th>
                  <th className="p-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-white/[0.04] transition-colors group">
                    <td className="p-3 text-center font-mono text-zinc-500 text-[11px]">
                      {index + 1}
                    </td>

                    {/* Event Type Badge */}
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeClass(
                          log.eventType
                        )}`}
                      >
                        {log.eventType}
                      </span>
                    </td>

                    {/* Action Description */}
                    <td className="p-3 font-bold text-white max-w-xs truncate" title={log.action || log.details}>
                      <span>{log.action || 'تفاعل نشط في الصفحة'}</span>
                      {log.details && (
                        <p className="text-[10px] text-zinc-400 font-normal truncate">{log.details}</p>
                      )}
                    </td>

                    {/* Time */}
                    <td className="p-3 font-mono text-zinc-300 flex items-center gap-1.5">
                      <Clock size={12} className="text-zinc-500" />
                      <span>{log.time}</span>
                    </td>

                    {/* Country & Flag */}
                    <td className="p-3">
                      <span className="ml-1.5 text-base">{log.flag}</span>
                      <span className="font-bold text-white">{log.country}</span>
                      <span className="text-zinc-500 text-[10px] mr-1">({log.city})</span>
                    </td>

                    {/* Device */}
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                        {log.device === 'موبايل' ? (
                          <Smartphone size={12} className="text-amber-400" />
                        ) : (
                          <Laptop size={12} className="text-indigo-400" />
                        )}
                        <span>{log.device}</span>
                      </span>
                    </td>

                    {/* Browser & OS */}
                    <td className="p-3 font-mono text-zinc-300">
                      <span>{log.browser}</span>
                      <span className="text-zinc-500 text-[10px] mr-1.5 font-normal">({log.os})</span>
                    </td>

                    {/* Referrer */}
                    <td className="p-3 font-mono text-red-400/90 max-w-xs truncate" title={log.referrer}>
                      {log.referrer}
                    </td>

                    {/* Delete action */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-70 group-hover:opacity-100"
                        title="حذف هذا السجل"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear Logs Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0e0e1a] border border-red-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-red-400 flex items-center gap-2">
                <Trash2 size={18} className="text-red-400" />
                <span>تأكيد مسح سجلات اللوق بالكامل</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              هل أنت متأكد من رغبتك في تفريغ ومسح جميع سجلات اللوق المخزنة ({logs.length} سجل)؟
            </p>

            <div className="p-3.5 rounded-2xl bg-black/60 border border-red-500/20 text-xs text-zinc-300">
              <p className="text-amber-300 font-bold mb-1">ملاحظة أمان:</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                سيتم مسح سجل النشاطات والزيارات من الذاكرة المحلية، ولن يؤثر ذلك على عداد المشاهدات الكلي أو إعجابات الموقع.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-colors"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={handleClearAllLogs}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:opacity-95 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-red-600/40 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>نعم، امسح كل السجلات الآن 🗑️</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
