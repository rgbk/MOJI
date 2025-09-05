/**
 * Error rate limiting utility to prevent excessive error logging and UI spam
 * Particularly important for Safari which can generate rapid-fire error events
 */

interface ErrorEntry {
  timestamp: number
  count: number
}

export class ErrorRateLimiter {
  private errors = new Map<string, ErrorEntry>()
  private readonly windowMs: number
  private readonly maxErrors: number
  private readonly cooldownMs: number

  constructor(
    windowMs: number = 5000,  // 5 second window
    maxErrors: number = 3,    // Max 3 errors per window
    cooldownMs: number = 10000 // 10 second cooldown after limit reached
  ) {
    this.windowMs = windowMs
    this.maxErrors = maxErrors
    this.cooldownMs = cooldownMs
  }

  /**
   * Check if an error should be processed or rate limited
   * @param errorKey Unique identifier for the error type
   * @param currentTime Current timestamp (defaults to Date.now())
   * @returns true if error should be processed, false if rate limited
   */
  shouldProcess(errorKey: string, currentTime: number = Date.now()): boolean {
    const entry = this.errors.get(errorKey)
    
    if (!entry) {
      // First occurrence of this error
      this.errors.set(errorKey, { timestamp: currentTime, count: 1 })
      return true
    }

    const timeSinceFirst = currentTime - entry.timestamp

    // If we're outside the window, reset the counter
    if (timeSinceFirst > this.windowMs) {
      this.errors.set(errorKey, { timestamp: currentTime, count: 1 })
      return true
    }

    // If we've hit the max errors, check if we're still in cooldown
    if (entry.count >= this.maxErrors) {
      const timeSinceLast = currentTime - (entry.timestamp + this.windowMs)
      if (timeSinceLast < this.cooldownMs) {
        // Still in cooldown period
        return false
      } else {
        // Cooldown period is over, reset
        this.errors.set(errorKey, { timestamp: currentTime, count: 1 })
        return true
      }
    }

    // Increment count and allow processing
    entry.count++
    return true
  }

  /**
   * Get error count for a specific error key
   */
  getErrorCount(errorKey: string): number {
    return this.errors.get(errorKey)?.count || 0
  }

  /**
   * Check if an error is currently in cooldown
   */
  isInCooldown(errorKey: string, currentTime: number = Date.now()): boolean {
    const entry = this.errors.get(errorKey)
    if (!entry || entry.count < this.maxErrors) {
      return false
    }

    const timeSinceLast = currentTime - (entry.timestamp + this.windowMs)
    return timeSinceLast < this.cooldownMs
  }

  /**
   * Get time remaining in cooldown (in milliseconds)
   */
  getCooldownRemaining(errorKey: string, currentTime: number = Date.now()): number {
    const entry = this.errors.get(errorKey)
    if (!entry || entry.count < this.maxErrors) {
      return 0
    }

    const timeSinceLast = currentTime - (entry.timestamp + this.windowMs)
    const remaining = this.cooldownMs - timeSinceLast
    return Math.max(0, remaining)
  }

  /**
   * Clear all errors (reset rate limiter)
   */
  clear(): void {
    this.errors.clear()
  }

  /**
   * Clear a specific error key
   */
  clearError(errorKey: string): void {
    this.errors.delete(errorKey)
  }

  /**
   * Clean up old entries that are no longer relevant
   */
  cleanup(currentTime: number = Date.now()): void {
    const cutoff = currentTime - Math.max(this.windowMs, this.cooldownMs) - 60000 // Extra 1 minute buffer
    
    for (const [key, entry] of this.errors) {
      if (entry.timestamp < cutoff) {
        this.errors.delete(key)
      }
    }
  }
}

/**
 * Safari-specific error rate limiter with more aggressive limiting
 */
export class SafariErrorRateLimiter extends ErrorRateLimiter {
  constructor() {
    super(
      3000,  // 3 second window (shorter than default)
      2,     // Max 2 errors per window (more restrictive)
      15000  // 15 second cooldown (longer than default)
    )
  }
}

/**
 * Global error rate limiters - use these for voice recognition errors
 */
export const voiceErrorRateLimiter = new ErrorRateLimiter()
export const safariVoiceErrorRateLimiter = new SafariErrorRateLimiter()

/**
 * Helper function to create a rate-limited error handler
 */
export function createRateLimitedErrorHandler(
  rateLimiter: ErrorRateLimiter,
  onError: (error: string, count: number) => void,
  onRateLimited?: (errorKey: string, cooldownMs: number) => void
) {
  return (errorKey: string, errorMessage: string) => {
    if (rateLimiter.shouldProcess(errorKey)) {
      const count = rateLimiter.getErrorCount(errorKey)
      onError(errorMessage, count)
      
      // Log rate limiting info for debugging
      if (count > 1) {
        console.warn(`🚦 Error "${errorKey}" occurred ${count} times`)
      }
    } else {
      // Error is rate limited
      const cooldownMs = rateLimiter.getCooldownRemaining(errorKey)
      console.warn(`🚦 Error "${errorKey}" is rate limited (${Math.round(cooldownMs/1000)}s cooldown remaining)`)
      
      if (onRateLimited) {
        onRateLimited(errorKey, cooldownMs)
      }
    }
  }
}

/**
 * Specific error keys for voice recognition
 */
export const VoiceErrorKeys = {
  NOT_ALLOWED: 'voice-not-allowed',
  NO_SPEECH: 'voice-no-speech',
  AUDIO_CAPTURE: 'voice-audio-capture',
  NETWORK: 'voice-network',
  SERVICE_NOT_ALLOWED: 'voice-service-not-allowed',
  ABORTED: 'voice-aborted',
  PERMISSION_DENIED: 'voice-permission-denied',
  INIT_FAILED: 'voice-init-failed',
  START_FAILED: 'voice-start-failed',
  INVALID_STATE: 'voice-invalid-state'
} as const

/**
 * Get appropriate error key for a speech recognition error
 */
export function getVoiceErrorKey(error: string): string {
  switch (error) {
    case 'not-allowed':
      return VoiceErrorKeys.NOT_ALLOWED
    case 'no-speech':
      return VoiceErrorKeys.NO_SPEECH
    case 'audio-capture':
      return VoiceErrorKeys.AUDIO_CAPTURE
    case 'network':
      return VoiceErrorKeys.NETWORK
    case 'service-not-allowed':
      return VoiceErrorKeys.SERVICE_NOT_ALLOWED
    case 'aborted':
      return VoiceErrorKeys.ABORTED
    default:
      return `voice-${error}`
  }
}