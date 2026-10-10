import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocFromServer,
  getDocs,
  increment,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SiteConfig } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection on boot
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'config', 'site'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
})();

const CONFIG_DOC_PATH = 'config/site';
const STATS_DOC_PATH = 'stats/live';

export interface PresenceVisitor {
  sessionId: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  flag?: string;
  city?: string;
  lastActive: number;
  joinedAt?: number;
  currentPath?: string;
}

export interface SiteLogEntry {
  id: string;
  time: string;
  timestamp: number;
  eventType: string;
  action?: string;
  country: string;
  flag: string;
  city: string;
  device: string;
  os: string;
  browser: string;
  referrer: string;
  duration?: string;
  details?: string;
}

/**
 * Real-time subscription to global site config
 * Updates immediately for all visitors when admin saves changes!
 */
export function subscribeToGlobalConfig(onConfigChange: (config: Partial<SiteConfig>) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'site');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onConfigChange(data as Partial<SiteConfig>);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, CONFIG_DOC_PATH);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, CONFIG_DOC_PATH);
    return () => {};
  }
}

/**
 * Saves global config to Cloud Firestore
 * Propagates in real-time to all connected visitors across the world
 */
export async function saveGlobalConfigToCloud(config: SiteConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'config', 'site');
    const cleanPayload: Record<string, any> = {
      username: config.username || '! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪',
      handle: config.handle || '5susu',
      bio: config.bio || '3 ثانوي 📖 + GYM 🦾',
      joinYear: config.joinYear || '2020',
      footerDomain: config.footerDomain || 'sultansusu.vercel.app',
      theme: config.theme || 'blood_royal',
      bgEffect: config.bgEffect || 'auto',
      bgStyle: config.bgStyle || 'particle',
      countdownDate: config.countdownDate || '2027-08-25T00:00',
      countdownLabel: config.countdownLabel || 'طريق الثانوية العامة والهدف 🎯',
      musicAutoPlay: config.musicAutoPlay !== undefined ? config.musicAutoPlay : false,
      defaultVolume: typeof config.defaultVolume === 'number' ? config.defaultVolume : 0.45,
      tracks: Array.isArray(config.tracks) ? config.tracks : null,
      socials: config.socials || {},
      socialsEnabled: config.socialsEnabled || {},
      gamerHub: config.gamerHub || null,
      dailyStory: config.dailyStory || null,
      discordRadar: config.discordRadar || null,
      discordWebhookUrl: config.discordWebhookUrl || '',
      discordWebhookEnabled: !!config.discordWebhookEnabled,
      discordAutoRole: config.discordAutoRole || null,
      emailNotifications: config.emailNotifications || null,
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, cleanPayload, { merge: true });
    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, CONFIG_DOC_PATH);
    return { success: false, error: err.message };
  }
}

/**
 * Real-time subscription to global aggregated stats (views, upvotes)
 */
export function subscribeToGlobalStats(
  onStatsChange: (stats: { views?: number; upvotes?: number }) => void
): () => void {
  try {
    const docRef = doc(db, 'stats', 'live');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onStatsChange({
            views: typeof data?.views === 'number' ? data.views : undefined,
            upvotes: typeof data?.upvotes === 'number' ? data.upvotes : undefined
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, STATS_DOC_PATH);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, STATS_DOC_PATH);
    return () => {};
  }
}

/**
 * Increments live global view counter in Cloud Firestore
 */
export async function incrementGlobalViews(): Promise<void> {
  try {
    const docRef = doc(db, 'stats', 'live');
    await setDoc(
      docRef,
      {
        views: increment(1),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, STATS_DOC_PATH);
  }
}

/**
 * Increments live global upvote counter in Cloud Firestore
 */
export async function incrementGlobalUpvotes(): Promise<void> {
  try {
    const docRef = doc(db, 'stats', 'live');
    await setDoc(
      docRef,
      {
        upvotes: increment(1),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, STATS_DOC_PATH);
  }
}

/**
 * Starts real-time visitor presence heartbeat
 * Keeps track of who is currently online in the website across the world!
 */
export function startVisitorPresenceHeartbeat(envInfo?: {
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  flag?: string;
  city?: string;
  currentPath?: string;
}): () => void {
  if (typeof window === 'undefined') return () => {};

  let sessionId = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  let joinedAt = Date.now();
  try {
    const saved = sessionStorage.getItem('sultan_presence_session_id');
    if (saved) {
      sessionId = saved;
    } else {
      sessionStorage.setItem('sultan_presence_session_id', sessionId);
    }
    const savedJoined = sessionStorage.getItem('sultan_presence_joined_at');
    if (savedJoined) {
      joinedAt = Number(savedJoined);
    } else {
      sessionStorage.setItem('sultan_presence_joined_at', joinedAt.toString());
    }
  } catch {}

  const presenceDocRef = doc(db, 'presence', sessionId);

  const updatePresence = async () => {
    try {
      await setDoc(
        presenceDocRef,
        {
          sessionId,
          device: (envInfo?.device || 'كمبيوتر').slice(0, 50),
          browser: (envInfo?.browser || 'Chrome').slice(0, 50),
          os: (envInfo?.os || 'Windows').slice(0, 50),
          country: (envInfo?.country || 'مصر').slice(0, 100),
          flag: (envInfo?.flag || '🇪🇬').slice(0, 20),
          city: (envInfo?.city || 'القاهرة').slice(0, 100),
          currentPath: (window.location.hash || window.location.pathname || '/').slice(0, 100),
          lastActive: Date.now(),
          joinedAt
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Presence heartbeat notice:', err);
    }
  };

  // Initial immediate pulse
  updatePresence();

  // Pulse every 20 seconds
  const intervalId = window.setInterval(updatePresence, 20000);

  const removePresence = () => {
    try {
      deleteDoc(presenceDocRef).catch(() => {});
    } catch {}
  };

  window.addEventListener('beforeunload', removePresence);
  window.addEventListener('pagehide', removePresence);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener('beforeunload', removePresence);
    window.removeEventListener('pagehide', removePresence);
    removePresence();
  };
}

/**
 * Real-time subscription to online visitors (المتصلون الآن)
 */
export function subscribeToLivePresence(
  onPresenceChange: (activeVisitors: PresenceVisitor[], onlineCount: number) => void
): () => void {
  try {
    const presenceCol = collection(db, 'presence');
    const unsubscribe = onSnapshot(
      presenceCol,
      (snapshot: QuerySnapshot) => {
        const now = Date.now();
        const activeList: PresenceVisitor[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as PresenceVisitor;
          // Active within last 60 seconds
          if (data && typeof data.lastActive === 'number' && now - data.lastActive < 60000) {
            activeList.push({
              ...data,
              sessionId: docSnap.id
            });
          }
        });
        activeList.sort((a, b) => b.lastActive - a.lastActive);
        onPresenceChange(activeList, Math.max(activeList.length, 1));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'presence');
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'presence');
    return () => {};
  }
}

/**
 * Saves a visitor action log to Cloud Firestore in real time
 */
export async function recordGlobalSiteLog(logEntry: SiteLogEntry): Promise<void> {
  try {
    const logDocRef = doc(db, 'logs', logEntry.id);
    await setDoc(logDocRef, {
      id: logEntry.id.slice(0, 128),
      time: (logEntry.time || '').slice(0, 50),
      timestamp: logEntry.timestamp || Date.now(),
      eventType: (logEntry.eventType || 'نشاط في الموقع ⚡').slice(0, 100),
      action: (logEntry.action || '').slice(0, 200),
      country: (logEntry.country || 'مصر').slice(0, 100),
      flag: (logEntry.flag || '🇪🇬').slice(0, 20),
      city: (logEntry.city || 'القاهرة').slice(0, 100),
      device: (logEntry.device || 'كمبيوتر').slice(0, 50),
      os: (logEntry.os || 'Windows').slice(0, 50),
      browser: (logEntry.browser || 'Chrome').slice(0, 50),
      referrer: (logEntry.referrer || 'رابط مباشر').slice(0, 200),
      duration: (logEntry.duration || '').slice(0, 50),
      details: (logEntry.details || '').slice(0, 500)
    });
  } catch (err) {
    console.warn('Record global log notice:', err);
  }
}

/**
 * Real-time subscription to global visitor activity logs
 */
export function subscribeToGlobalLogs(
  onLogsChange: (logs: SiteLogEntry[]) => void
): () => void {
  try {
    const logsCol = collection(db, 'logs');
    const logsQuery = query(logsCol, orderBy('timestamp', 'desc'), limit(150));
    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot: QuerySnapshot) => {
        const fetchedLogs: SiteLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          fetchedLogs.push(docSnap.data() as SiteLogEntry);
        });
        onLogsChange(fetchedLogs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'logs');
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'logs');
    return () => {};
  }
}

/**
 * Deletes a single log from Firestore
 */
export async function deleteGlobalSiteLog(logId: string): Promise<void> {
  try {
    const logDocRef = doc(db, 'logs', logId);
    await deleteDoc(logDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `logs/${logId}`);
  }
}

/**
 * Clears all logs from Firestore
 */
export async function clearAllGlobalSiteLogs(logIds: string[]): Promise<void> {
  try {
    const promises = logIds.map((id) => deleteDoc(doc(db, 'logs', id)).catch(() => {}));
    await Promise.all(promises);
  } catch (err) {
    console.warn('Clear global logs notice:', err);
  }
}

/**
 * Leaderboard Entry for Sultan Runner Game Live Competition
 */
export interface GlobalLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: string;
  timestamp?: number;
  verified?: boolean;
}

export const DEFAULT_LEADERBOARD_RECORDS: GlobalLeaderboardEntry[] = [
  { id: 'p_sultan_legend', name: '𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪', score: 450, date: 'الأسطورة 👑', verified: true, timestamp: 1728000000000 },
  { id: 'p_shadow_knight', name: 'Shadow Knight', score: 320, date: 'الأمس', verified: false, timestamp: 1728000000000 - 86400000 },
  { id: 'p_cyber_phoenix', name: 'CyberPhoenix', score: 265, date: 'منذ يومين', verified: false, timestamp: 1728000000000 - 86400000 * 2 },
  { id: 'p_vortex_pulse', name: 'Vortex ⚡', score: 195, date: 'منذ 3 أيام', verified: false, timestamp: 1728000000000 - 86400000 * 3 },
  { id: 'p_specter_runner', name: 'Specter', score: 140, date: 'منذ أسبوع', verified: false, timestamp: 1728000000000 - 86400000 * 7 }
];

/**
 * Generates deterministic safe Firestore doc ID for each unique player name
 */
export function generateLeaderboardDocId(name: string): string {
  const norm = (name || '').trim().toLowerCase();
  const encoded = encodeURIComponent(norm).replace(/%/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
  return (`p_${encoded}`).slice(0, 100) || `p_${Date.now()}`;
}

/**
 * Saves a player's high score to Cloud Firestore for live multiplayer competition
 */
export async function recordGlobalLeaderboardScore(entry: GlobalLeaderboardEntry): Promise<void> {
  try {
    const docId = generateLeaderboardDocId(entry.name);
    const scoreDocRef = doc(db, 'leaderboard', docId);

    // Save with sanitized fields conforming to firestore.rules
    await setDoc(
      scoreDocRef,
      {
        id: docId,
        name: (entry.name || 'لاعب مجهول').trim().slice(0, 100),
        score: Math.max(0, Math.min(Math.round(entry.score), 1000000)),
        date: (entry.date || 'اليوم').slice(0, 50),
        timestamp: entry.timestamp || Date.now(),
        verified: Boolean(entry.verified || entry.name.includes('سلطان') || entry.name.includes('Sultan'))
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Record global leaderboard score notice:', err);
  }
}

/**
 * Real-time subscription to global leaderboard scores across all visitors
 */
export function subscribeToGlobalLeaderboard(
  onUpdate: (entries: GlobalLeaderboardEntry[]) => void
): () => void {
  try {
    const col = collection(db, 'leaderboard');
    const q = query(col, orderBy('score', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        if (snapshot.empty) {
          // Initialize defaults in background so there's always an active board
          DEFAULT_LEADERBOARD_RECORDS.forEach((rec) => {
            setDoc(doc(db, 'leaderboard', rec.id), rec).catch(() => {});
          });
          onUpdate(DEFAULT_LEADERBOARD_RECORDS);
          return;
        }

        const list: GlobalLeaderboardEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as GlobalLeaderboardEntry;
          if (data && typeof data.score === 'number') {
            list.push(data);
          }
        });

        // Ensure sorted descending
        list.sort((a, b) => b.score - a.score);
        onUpdate(list.length > 0 ? list : DEFAULT_LEADERBOARD_RECORDS);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'leaderboard');
        // Fallback to defaults on offline/error
        onUpdate(DEFAULT_LEADERBOARD_RECORDS);
      }
    );

    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'leaderboard');
    return () => {};
  }
}

/**
 * Deletes a single score from the leaderboard
 */
export async function deleteGlobalLeaderboardScore(scoreId: string): Promise<void> {
  try {
    const safeId = scoreId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    await deleteDoc(doc(db, 'leaderboard', safeId));
  } catch (err) {
    console.warn('Delete leaderboard score notice:', err);
  }
}

/**
 * Resets the entire global leaderboard to default records in Firestore
 */
export async function clearAllGlobalLeaderboardScores(): Promise<void> {
  try {
    const col = collection(db, 'leaderboard');
    const snapshot = await getDocs(col);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref).catch(() => {}));
    await Promise.all(deletePromises);

    // Re-seed defaults
    const seedPromises = DEFAULT_LEADERBOARD_RECORDS.map((rec) =>
      setDoc(doc(db, 'leaderboard', rec.id), rec).catch(() => {})
    );
    await Promise.all(seedPromises);
  } catch (err) {
    console.warn('Clear global leaderboard notice:', err);
  }
}

