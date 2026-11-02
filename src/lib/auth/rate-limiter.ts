/**
 * Login Rate Limiter (Brute-Force Protection)
 *
 * Tracks failed authentication attempts per client IP and targeted account.
 * Implements a sliding window lockout:
 * - Maximum failed attempts: 5
 * - Lockout window: 15 minutes (900,000 ms)
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const attemptStore = new Map<string, RateLimitRecord>();

/**
 * Checks whether an action for the given key is currently rate-limited.
 */
export function checkRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = attemptStore.get(key);

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      retryAfterSeconds: 0,
    };
  }

  // Check if locked
  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // Check if window has expired
  if (now - record.firstAttemptAt > WINDOW_MS) {
    attemptStore.delete(key);
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      retryAfterSeconds: 0,
    };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
    retryAfterSeconds: remaining === 0 ? Math.ceil((record.firstAttemptAt + WINDOW_MS - now) / 1000) : 0,
  };
}

/**
 * Records a failed login attempt for the key.
 */
export function recordFailedAttempt(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = attemptStore.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    attemptStore.set(key, {
      attempts: 1,
      firstAttemptAt: now,
    });
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
      retryAfterSeconds: 0,
    };
  }

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + WINDOW_MS;
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.attempts,
    retryAfterSeconds: 0,
  };
}

/**
 * Clears rate limiting for the key upon successful authentication.
 */
export function resetRateLimit(key: string): void {
  attemptStore.delete(key);
}
