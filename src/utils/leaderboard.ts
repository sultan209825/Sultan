import {
  GlobalLeaderboardEntry,
  recordGlobalLeaderboardScore,
  subscribeToGlobalLeaderboard,
  clearAllGlobalLeaderboardScores,
  generateLeaderboardDocId,
  DEFAULT_LEADERBOARD_RECORDS
} from '../services/firebase';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: string;
  timestamp?: number;
  verified?: boolean;
}

const STORAGE_KEY = 'sultan_game_leaderboard';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = DEFAULT_LEADERBOARD_RECORDS;

/**
 * Normalizes player name for reliable case-insensitive deduplication
 */
export function normalizeName(name: string): string {
  return (name || '').trim().toLowerCase();
}

/**
 * Deduplicates leaderboard entries by player name, keeping ONLY the highest score for each player
 */
export function deduplicateLeaderboard(list: LeaderboardEntry[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();

  for (const item of list) {
    const key = normalizeName(item.name);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing || item.score > existing.score) {
      map.set(key, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

/**
 * Reads currently cached leaderboard from localStorage
 */
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const unique = deduplicateLeaderboard(parsed);
        if (unique.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
        }
        return unique;
      }
    }
  } catch {}

  // Fallback to default records and store
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
  return DEFAULT_LEADERBOARD;
}

/**
 * Subscribes to real-time Cloud Firestore leaderboard updates across all visitors
 */
export function subscribeLeaderboard(
  onUpdate: (leaderboard: LeaderboardEntry[]) => void
): () => void {
  // 1. Immediately emit current cached leaderboard
  onUpdate(getLeaderboard());

  // 2. Subscribe to live Firestore updates
  const unsubscribe = subscribeToGlobalLeaderboard((cloudEntries) => {
    try {
      const merged = deduplicateLeaderboard(cloudEntries);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      onUpdate(merged);
    } catch {
      onUpdate(cloudEntries);
    }
  });

  return unsubscribe;
}

/**
 * Saves a player's score to both local cache and Cloud Firestore for global multiplayer competition
 */
export function saveLeaderboardScore(name: string, score: number): {
  entry: LeaderboardEntry;
  rank: number;
  isTop10: boolean;
  updatedLeaderboard: LeaderboardEntry[];
  isNewPersonalBest: boolean;
} {
  const current = getLeaderboard();
  const cleanName = (name || '').trim() || 'لاعب مجهول';
  const key = normalizeName(cleanName);

  // Check if player already exists in the leaderboard
  const existingIndex = current.findIndex((item) => normalizeName(item.name) === key);
  let isNewPersonalBest = true;
  let targetEntry: LeaderboardEntry;

  const nowMs = Date.now();
  const isSultan = cleanName.includes('سلطان') || cleanName.includes('Sultan');

  if (existingIndex !== -1) {
    const existing = current[existingIndex];
    if (score > existing.score) {
      // New higher record for this player: update their score and date
      targetEntry = {
        ...existing,
        id: generateLeaderboardDocId(cleanName),
        name: cleanName,
        score,
        date: 'اليوم 🔥',
        timestamp: nowMs,
        verified: existing.verified || isSultan
      };
      current[existingIndex] = targetEntry;
      isNewPersonalBest = true;
    } else {
      // Player already has a higher or equal score: keep their best score!
      targetEntry = existing;
      isNewPersonalBest = false;
    }
  } else {
    // Brand new player entry
    targetEntry = {
      id: generateLeaderboardDocId(cleanName),
      name: cleanName,
      score,
      date: 'اليوم 🔥',
      timestamp: nowMs,
      verified: isSultan
    };
    current.push(targetEntry);
  }

  // Deduplicate and sort descending by score
  const uniqueList = deduplicateLeaderboard(current);
  const trimmed = uniqueList.slice(0, 25);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  // Sync to Cloud Firestore in the background for all players worldwide!
  if (isNewPersonalBest) {
    recordGlobalLeaderboardScore({
      id: targetEntry.id,
      name: targetEntry.name,
      score: targetEntry.score,
      date: targetEntry.date,
      timestamp: nowMs,
      verified: targetEntry.verified
    }).catch((err) => {
      console.warn('Sync score to cloud warning:', err);
    });
  }

  const rank = trimmed.findIndex((e) => normalizeName(e.name) === key) + 1;

  return {
    entry: targetEntry,
    rank: rank > 0 ? rank : trimmed.length,
    isTop10: rank > 0 && rank <= 10,
    updatedLeaderboard: trimmed,
    isNewPersonalBest
  };
}

/**
 * Resets the leaderboard locally and in Cloud Firestore
 */
export async function resetLeaderboardToDefault(): Promise<LeaderboardEntry[]> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
  try {
    await clearAllGlobalLeaderboardScores();
  } catch {}
  return DEFAULT_LEADERBOARD;
}
