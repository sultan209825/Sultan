import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Tv,
  LogIn,
  LogOut,
  ArrowLeftRight,
  Clock,
  Trash2,
  Activity,
  Sparkles,
  ChevronDown,
  Filter
} from 'lucide-react';
import {
  ActivityEvent,
  loadTimelineEvents,
  clearTimelineEvents,
  filterEventsByAge
} from '../utils/activityTimelineTracker';

interface ActivityTimelineProps {
  maxHours?: number;
  className?: string;
  compact?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  maxHours = 1,
  className = '',
  compact = false
}) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filterHours, setFilterHours] = useState<number>(maxHours);
  const [, setTick] = useState(0);

  // Auto-refresh elapsed times every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  // Load and listen to real-time events
  useEffect(() => {
    setEvents(loadTimelineEvents());

    const handleUpdate = (e: CustomEvent<ActivityEvent[]>) => {
      setEvents(e.detail || loadTimelineEvents());
    };

    window.addEventListener('sultan_timeline_updated', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('sultan_timeline_updated', handleUpdate as EventListener);
    };
  }, []);

  const filteredEvents = filterEventsByAge(events, filterHours);

  const formatRelativeTime = (timestamp: number): string => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 15) return 'الآن للتو ✨';
    if (diffSec < 60) return `منذ ${diffSec} ثانية`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return 'منذ دقيقة واحدة';
    if (diffMin === 2) return 'منذ دقيقتين';
    if (diffMin <= 10) return `منذ ${diffMin} دقائق`;
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return 'منذ ساعة واحدة';
    if (diffHours === 2) return 'منذ ساعتين';
    return `منذ ${diffHours} ساعة`;
  };

  const formatAbsoluteTime = (timestamp: number): string => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  const getEventBadge = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'mute':
        return {
          icon: <MicOff size={14} className="text-rose-400" />,
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
          dot: 'bg-rose-500'
        };
      case 'unmute':
        return {
          icon: <Mic size={14} className="text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          dot: 'bg-emerald-500'
        };
      case 'deaf':
        return {
          icon: <Headphones size={14} className="text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          dot: 'bg-amber-500'
        };
      case 'undeaf':
        return {
          icon: <Headphones size={14} className="text-cyan-400" />,
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
          dot: 'bg-cyan-500'
        };
      case 'stream_start':
        return {
          icon: <Tv size={14} className="text-purple-400" />,
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
          dot: 'bg-purple-500 animate-ping'
        };
      case 'stream_stop':
        return {
          icon: <Tv size={14} className="text-zinc-400" />,
          bg: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-300',
          dot: 'bg-zinc-500'
        };
      case 'channel_join':
        return {
          icon: <LogIn size={14} className="text-sky-400" />,
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
          dot: 'bg-sky-500'
        };
      case 'channel_leave':
        return {
          icon: <LogOut size={14} className="text-red-400" />,
          bg: 'bg-red-500/10 border-red-500/30 text-red-300',
          dot: 'bg-red-500'
        };
      case 'channel_switch':
        return {
          icon: <ArrowLeftRight size={14} className="text-indigo-400" />,
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
          dot: 'bg-indigo-500'
        };
      default:
        return {
          icon: <Activity size={14} className="text-cyan-400" />,
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
          dot: 'bg-cyan-500'
        };
    }
  };

  return (
    <div
      className={`rounded-2xl bg-black/40 border border-white/10 p-4 sm:p-5 flex flex-col gap-3.5 text-right font-sans ${className}`}
      dir="rtl"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Activity size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="text-xs sm:text-sm font-extrabold text-white">
                المخطط الزمني لنشاط الصوت والرادار (Activity Timeline)
              </h5>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 font-mono">
                {filteredEvents.length} حدث
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              سجل لحظي بتغييرات كتم المايك، فتح الصوت، بث الشاشة، والتنقل بين الرومات
            </p>
          </div>
        </div>

        {/* Filter & Actions */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterHours(1)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterHours === 1
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              آخر ساعة ⏱️
            </button>
            <button
              type="button"
              onClick={() => setFilterHours(24)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterHours === 24
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              آخر 24 ساعة 📅
            </button>
          </div>

          {events.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('هل تريد مسح سجل النشاط الصوتي المؤقت؟')) {
                  clearTimelineEvents();
                  setEvents([]);
                }
              }}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="مسح السجل"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Events Timeline Container */}
      <div className={`space-y-2.5 overflow-y-auto pr-1 ${compact ? 'max-h-56' : 'max-h-80'}`}>
        {filteredEvents.length === 0 ? (
          <div className="py-7 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
            <Clock size={24} className="text-zinc-500" />
            <p className="text-xs text-zinc-400 font-bold">
              لا توجد تغييرات في حالة الصوت في {filterHours === 1 ? 'آخر ساعة' : 'آخر 24 ساعة'}
            </p>
            <span className="text-[10px] text-zinc-500">
              الحالة مستقرة، وسيتم تدوين أي كتم للمايك أو بدء للبث تلقائياً بالثانية والدقيقة 🎙️
            </span>
          </div>
        ) : (
          filteredEvents.map((ev, index) => {
            const badge = getEventBadge(ev.type);
            const isLatest = index === 0;

            return (
              <div
                key={ev.id}
                className={`relative flex items-start gap-3 p-2.5 sm:p-3 rounded-xl border transition-all ${
                  isLatest
                    ? 'bg-white/[0.06] border-cyan-500/40 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                }`}
              >
                {/* Visual Dot & Line */}
                <div className="flex flex-col items-center mt-1 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border ${badge.bg}`}
                  >
                    {badge.icon}
                  </div>
                </div>

                {/* Event Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-white">
                        {ev.title}
                      </span>
                      {ev.channelName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-cyan-200 border border-white/10 font-bold truncate max-w-[140px]">
                          {ev.channelName}
                        </span>
                      )}
                      {isLatest && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold animate-pulse">
                          الأحدث
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-400 font-mono shrink-0">
                      <span className="font-bold text-cyan-300">
                        {formatRelativeTime(ev.timestamp)}
                      </span>
                      <span>•</span>
                      <span className="text-zinc-500">
                        {formatAbsoluteTime(ev.timestamp)}
                      </span>
                    </div>
                  </div>

                  {ev.description && (
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      {ev.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
