// Visitor VIP Badges & Loyalty Streaks Tracking
// Rewards returning visitors with royal community badges and daily streaks

export interface LoyaltyTier {
  id: string;
  name: string;
  badge: string;
  minDays: number;
  perkDescription: string;
  glowColor: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'زائر جديد',
    badge: '🥉',
    minDays: 1,
    perkDescription: 'ترحيب ملكي والوصول الكامل لمشغل الأغاني والبروفايل',
    glowColor: '#cd7f32'
  },
  {
    id: 'silver',
    name: 'صديق وفيّ',
    badge: '🥈',
    minDays: 3,
    perkDescription: 'شارة فضية مضيئة مع أولوية فتح الصناديق اليومية',
    glowColor: '#c0c0c0'
  },
  {
    id: 'gold',
    name: 'حليف السلطان',
    badge: '🥇',
    minDays: 7,
    perkDescription: 'لقب الحليف الملكي، وثيمات حصرية متجددة',
    glowColor: '#f59e0b'
  },
  {
    id: 'diamond',
    name: 'بطل الديسكورد',
    badge: '💎',
    minDays: 14,
    perkDescription: 'وسام الألماس الملكي ومضاعفة نقاط الألعاب',
    glowColor: '#06b6d4'
  },
  {
    id: 'legend',
    name: 'أسطورة ملكية',
    badge: '👑',
    minDays: 30,
    perkDescription: 'التاج الملكي الأعلى، لقب الأسطورة في لوحة المتصدرين',
    glowColor: '#ef4444'
  }
];

export interface VisitorLoyaltyState {
  streakDays: number;
  totalVisits: number;
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  daysToNextTier: number;
  isStreakActiveToday: boolean;
}

const STREAK_KEY = 'sultan_loyalty_streak';
const LAST_DATE_KEY = 'sultan_loyalty_last_date';
const TOTAL_VISITS_KEY = 'sultan_loyalty_total_visits';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function recordAndGetLoyalty(): VisitorLoyaltyState {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  let streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
  const lastDate = localStorage.getItem(LAST_DATE_KEY) || '';
  let totalVisits = parseInt(localStorage.getItem(TOTAL_VISITS_KEY) || '0', 10);

  let isStreakActiveToday = false;

  if (lastDate === today) {
    // Already logged today
    isStreakActiveToday = true;
  } else if (lastDate === yesterday) {
    // Continued streak!
    streak += 1;
    totalVisits += 1;
    localStorage.setItem(STREAK_KEY, streak.toString());
    localStorage.setItem(LAST_DATE_KEY, today);
    localStorage.setItem(TOTAL_VISITS_KEY, totalVisits.toString());
    isStreakActiveToday = true;
  } else {
    // Streak reset or first visit
    streak = 1;
    totalVisits += 1;
    localStorage.setItem(STREAK_KEY, streak.toString());
    localStorage.setItem(LAST_DATE_KEY, today);
    localStorage.setItem(TOTAL_VISITS_KEY, totalVisits.toString());
    isStreakActiveToday = true;
  }

  // Determine current tier
  let currentTier = LOYALTY_TIERS[0];
  let nextTier: LoyaltyTier | null = null;

  for (let i = 0; i < LOYALTY_TIERS.length; i++) {
    if (streak >= LOYALTY_TIERS[i].minDays) {
      currentTier = LOYALTY_TIERS[i];
      nextTier = LOYALTY_TIERS[i + 1] || null;
    }
  }

  const daysToNextTier = nextTier ? Math.max(0, nextTier.minDays - streak) : 0;

  return {
    streakDays: Math.max(1, streak),
    totalVisits: Math.max(1, totalVisits),
    currentTier,
    nextTier,
    daysToNextTier,
    isStreakActiveToday
  };
}
