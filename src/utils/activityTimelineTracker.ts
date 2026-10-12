export interface ActivityEvent {
  id: string;
  type:
    | 'mute'
    | 'unmute'
    | 'deaf'
    | 'undeaf'
    | 'stream_start'
    | 'stream_stop'
    | 'channel_join'
    | 'channel_leave'
    | 'channel_switch'
    | 'companion_join'
    | 'companion_leave'
    | 'custom';
  title: string;
  description?: string;
  timestamp: number; // Unix epoch ms
  channelName?: string;
  channelId?: string;
  actor?: string;
}

const STORAGE_KEY = 'sultan_discord_radar_timeline';
const MAX_STORAGE_EVENTS = 100;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

export function loadTimelineEvents(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - ONE_DAY_MS;
    return parsed.filter((e) => typeof e?.timestamp === 'number' && e.timestamp > cutoff);
  } catch {
    return [];
  }
}

export function saveTimelineEvents(events: ActivityEvent[]): void {
  try {
    const trimmed = events.slice(0, MAX_STORAGE_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    // Dispatch custom event so multiple components (AdminPage & Modal) sync in real-time
    window.dispatchEvent(new CustomEvent('sultan_timeline_updated', { detail: trimmed }));
  } catch {}
}

export function recordTimelineEvent(
  event: Omit<ActivityEvent, 'id' | 'timestamp'> & { timestamp?: number }
): ActivityEvent[] {
  const current = loadTimelineEvents();
  const timestamp = event.timestamp || Date.now();
  
  // Avoid duplicate identical event within 4 seconds
  const last = current[0];
  if (
    last &&
    last.type === event.type &&
    last.channelName === event.channelName &&
    timestamp - last.timestamp < 4000
  ) {
    return current;
  }

  const newEvent: ActivityEvent = {
    ...event,
    id: `ev_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp
  };

  const updated = [newEvent, ...current].slice(0, MAX_STORAGE_EVENTS);
  saveTimelineEvents(updated);
  return updated;
}

export function clearTimelineEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('sultan_timeline_updated', { detail: [] }));
  } catch {}
}

export function filterEventsByAge(events: ActivityEvent[], hours: number = 1): ActivityEvent[] {
  const cutoff = Date.now() - hours * ONE_HOUR_MS;
  return events.filter((e) => e.timestamp >= cutoff);
}

/**
 * Compares old voice state with new voice state and generates timeline events
 */
export function diffVoiceStates(
  prev: {
    inVoice?: boolean;
    channelId?: string | null;
    channelName?: string;
    isMuted?: boolean;
    isDeafened?: boolean;
    isStreaming?: boolean;
    companions?: Array<{ id?: string; username: string }>;
  } | null,
  next: {
    inVoice?: boolean;
    channelId?: string | null;
    channelName?: string;
    isMuted?: boolean;
    isDeafened?: boolean;
    isStreaming?: boolean;
    companions?: Array<{ id?: string; username: string }>;
  } | null
): ActivityEvent[] {
  if (!next) return [];
  if (!prev) {
    // Initial load: if user is currently in voice, add an initial baseline event if history is empty
    const existing = loadTimelineEvents();
    if (existing.length === 0 && next.inVoice) {
      recordTimelineEvent({
        type: 'channel_join',
        title: `متصل بروم "${next.channelName || 'صوتي'}" 🎙️`,
        description: 'تم رصد سلطان متصلاً بالروم الصوتي',
        channelName: next.channelName || 'غرفة صوتية',
        channelId: next.channelId || undefined,
        actor: 'سلطان'
      });
      if (next.isMuted) {
        recordTimelineEvent({
          type: 'mute',
          title: 'المايك مكتوم حالياً 🔇',
          description: 'تم رصد كتم المايك',
          channelName: next.channelName || 'غرفة صوتية',
          actor: 'سلطان'
        });
      }
      if (next.isStreaming) {
        recordTimelineEvent({
          type: 'stream_start',
          title: 'بث الشاشة نشط 📺',
          description: 'تم رصد بث شاشة مباشر من سلطان',
          channelName: next.channelName || 'غرفة صوتية',
          actor: 'سلطان'
        });
      }
    }
    return loadTimelineEvents();
  }

  // 1. Channel join / leave / switch
  if (!prev.inVoice && next.inVoice) {
    recordTimelineEvent({
      type: 'channel_join',
      title: `دخول الروم الصوتي (${next.channelName || 'غرفة صوتية'}) 🚪🎙️`,
      description: `انضم سلطان إلى الروم الصوتي "${next.channelName}"`,
      channelName: next.channelName,
      channelId: next.channelId || undefined,
      actor: 'سلطان'
    });
  } else if (prev.inVoice && !next.inVoice) {
    recordTimelineEvent({
      type: 'channel_leave',
      title: `مغادرة الروم الصوتي (${prev.channelName || 'غرفة صوتية'}) 🚪`,
      description: `خرج سلطان من الروم الصوتي "${prev.channelName}"`,
      channelName: prev.channelName,
      actor: 'سلطان'
    });
  } else if (prev.inVoice && next.inVoice && prev.channelId && next.channelId && prev.channelId !== next.channelId) {
    recordTimelineEvent({
      type: 'channel_switch',
      title: `الانتقال إلى روم "${next.channelName}" 🔄`,
      description: `انتقل من "${prev.channelName}" إلى "${next.channelName}"`,
      channelName: next.channelName,
      channelId: next.channelId,
      actor: 'سلطان'
    });
  }

  // 2. Microphone Mute / Unmute
  if (next.inVoice) {
    if (!prev.isMuted && next.isMuted) {
      recordTimelineEvent({
        type: 'mute',
        title: 'كتم المايك (Muted) 🔇',
        description: `قام سلطان بكتم المايك في "${next.channelName || 'الروم'}"`,
        channelName: next.channelName,
        actor: 'سلطان'
      });
    } else if (prev.isMuted && !next.isMuted) {
      recordTimelineEvent({
        type: 'unmute',
        title: 'فتح المايك والتحدث (Unmuted) 🎙️🔊',
        description: `قام سلطان بفتح المايك وهو جاهز للتحدث في "${next.channelName || 'الروم'}"`,
        channelName: next.channelName,
        actor: 'سلطان'
      });
    }

    // 3. Deafened / Undeafened
    if (!prev.isDeafened && next.isDeafened) {
      recordTimelineEvent({
        type: 'deaf',
        title: 'كتم الصوت العام (Deafened) 🎧🚫',
        description: 'قام سلطان بتفعيل كتم سماع الصوت العام (Deafen)',
        channelName: next.channelName,
        actor: 'سلطان'
      });
    } else if (prev.isDeafened && !next.isDeafened) {
      recordTimelineEvent({
        type: 'undeaf',
        title: 'إلغاء كتم الصوت العام (Undeafened) 🎧✨',
        description: 'قام سلطان بإلغاء كتم الصوت ويستمع للروم الآن',
        channelName: next.channelName,
        actor: 'سلطان'
      });
    }

    // 4. Screen Sharing / Streaming
    if (!prev.isStreaming && next.isStreaming) {
      recordTimelineEvent({
        type: 'stream_start',
        title: 'بدء بث الشاشة المباشر (Live Stream) 📺🔴',
        description: `بدأ سلطان مشاركة شاشته أو كاميرته في "${next.channelName || 'الروم'}"`,
        channelName: next.channelName,
        actor: 'سلطان'
      });
    } else if (prev.isStreaming && !next.isStreaming) {
      recordTimelineEvent({
        type: 'stream_stop',
        title: 'إيقاف بث الشاشة (Stream Ended) ⏹️',
        description: `توقف بث الشاشة في "${next.channelName || 'الروم'}"`,
        channelName: next.channelName,
        actor: 'سلطان'
      });
    }
  }

  return loadTimelineEvents();
}
