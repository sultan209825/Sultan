export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: string;
  verified?: boolean;
}

const STORAGE_KEY = 'sultan_game_leaderboard';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: '𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪', score: 450, date: 'الأسطورة 👑', verified: true },
  { id: '2', name: 'Shadow Knight', score: 320, date: 'الأمس', verified: false },
  { id: '3', name: 'CyberPhoenix', score: 265, date: 'منذ يومين', verified: false },
  { id: '4', name: 'Vortex ⚡', score: 195, date: 'منذ 3 أيام', verified: false },
  { id: '5', name: 'Specter', score: 140, date: 'منذ أسبوع', verified: false }
];

/**
 * Normalizes player name for reliable case-insensitive deduplication
 */
function normalizeName(name: string): string {
  return (name || '').trim().toLowerCase();
}

/**
 * Deduplicates leaderboard entries by player name, keeping ONLY the highest score for each player
 */
function deduplicateLeaderboard(list: LeaderboardEntry[]): LeaderboardEntry[] {
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

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Automatically clean up any existing duplicate names from localStorage
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

  if (existingIndex !== -1) {
    const existing = current[existingIndex];
    if (score > existing.score) {
      // New higher record for this player: update their score and date
      targetEntry = {
        ...existing,
        name: cleanName,
        score,
        date: 'اليوم',
        verified: existing.verified || cleanName.includes('سلطان') || cleanName.includes('Sultan')
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
      id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      score,
      date: 'اليوم',
      verified: cleanName.includes('سلطان') || cleanName.includes('Sultan')
    };
    current.push(targetEntry);
  }

  // Deduplicate and sort descending by score
  const uniqueList = deduplicateLeaderboard(current);
  const trimmed = uniqueList.slice(0, 15);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  const rank = trimmed.findIndex((e) => normalizeName(e.name) === key) + 1;

  return {
    entry: targetEntry,
    rank: rank > 0 ? rank : trimmed.length,
    isTop10: rank > 0 && rank <= 10,
    updatedLeaderboard: trimmed,
    isNewPersonalBest
  };
}

export function resetLeaderboardToDefault(): LeaderboardEntry[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
  return DEFAULT_LEADERBOARD;
}
