// Smart Rate-Limiting & Spam Shield for Sultan Bio & Music Vault
// Protects against rapid bot/user spamming with royal cooldown reminders

interface ActionCooldown {
  lastAttempt: number;
  count: number;
}

const actionTimestamps = new Map<string, ActionCooldown>();

export interface ShieldCheckResult {
  allowed: boolean;
  remainingSeconds: number;
  message?: string;
}

/**
 * Checks if an action is allowed based on cooldown in seconds and burst allowance
 * @param actionKey unique identifier for action (e.g. 'rate_like', 'score_submit', 'mystery_box', 'ai_chat')
 * @param cooldownSeconds required cooldown between consecutive operations
 * @param maxBurst maximum allowed consecutive operations before cooldown is enforced (default 1)
 */
export function checkSpamShield(
  actionKey: string,
  cooldownSeconds: number = 3,
  maxBurst: number = 1
): ShieldCheckResult {
  const now = Date.now();
  const record = actionTimestamps.get(actionKey) || { lastAttempt: 0, count: 0 };
  const diffSec = (now - record.lastAttempt) / 1000;

  if (diffSec < cooldownSeconds) {
    if (record.count >= maxBurst) {
      const remainingSeconds = Math.ceil(cooldownSeconds - diffSec);
      return {
        allowed: false,
        remainingSeconds,
        message: `تمهل قليلاً يا بطل! 🛡️ انتظر ${remainingSeconds} ثانية قبل المحاولة مجدداً للحفاظ على استقرار السيرفر.`
      };
    } else {
      record.count += 1;
      actionTimestamps.set(actionKey, record);
      return { allowed: true, remainingSeconds: 0 };
    }
  }

  // Cooldown passed, reset
  actionTimestamps.set(actionKey, { lastAttempt: now, count: 1 });
  return { allowed: true, remainingSeconds: 0 };
}
