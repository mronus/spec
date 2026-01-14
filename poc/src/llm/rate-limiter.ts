export interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfterMs: number;
  requestsRemaining?: number;
  requestsLimit?: number;
  tokensRemaining?: number;
  tokensLimit?: number;
}

export interface RateLimitConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  onRateLimitHit?: (info: RateLimitInfo, attempt: number) => void;
  onRetryScheduled?: (delayMs: number, attempt: number) => void;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
};

/**
 * Parse rate limit information from API response headers
 */
export function parseRateLimitHeaders(headers: Headers, provider: 'anthropic' | 'openai'): RateLimitInfo {
  if (provider === 'anthropic') {
    // Anthropic headers: retry-after, x-ratelimit-limit-requests, x-ratelimit-remaining-requests, etc.
    const retryAfter = headers.get('retry-after');
    const requestsRemaining = headers.get('x-ratelimit-remaining-requests');
    const requestsLimit = headers.get('x-ratelimit-limit-requests');
    const tokensRemaining = headers.get('x-ratelimit-remaining-tokens');
    const tokensLimit = headers.get('x-ratelimit-limit-tokens');

    return {
      isRateLimited: retryAfter !== null || requestsRemaining === '0',
      retryAfterMs: retryAfter ? parseInt(retryAfter, 10) * 1000 : 0,
      requestsRemaining: requestsRemaining ? parseInt(requestsRemaining, 10) : undefined,
      requestsLimit: requestsLimit ? parseInt(requestsLimit, 10) : undefined,
      tokensRemaining: tokensRemaining ? parseInt(tokensRemaining, 10) : undefined,
      tokensLimit: tokensLimit ? parseInt(tokensLimit, 10) : undefined,
    };
  }

  if (provider === 'openai') {
    // OpenAI headers: x-ratelimit-limit-requests, x-ratelimit-remaining-requests, etc.
    const retryAfter = headers.get('retry-after');
    const requestsRemaining = headers.get('x-ratelimit-remaining-requests');
    const requestsLimit = headers.get('x-ratelimit-limit-requests');
    const tokensRemaining = headers.get('x-ratelimit-remaining-tokens');
    const tokensLimit = headers.get('x-ratelimit-limit-tokens');

    return {
      isRateLimited: retryAfter !== null || requestsRemaining === '0',
      retryAfterMs: retryAfter ? parseInt(retryAfter, 10) * 1000 : 0,
      requestsRemaining: requestsRemaining ? parseInt(requestsRemaining, 10) : undefined,
      requestsLimit: requestsLimit ? parseInt(requestsLimit, 10) : undefined,
      tokensRemaining: tokensRemaining ? parseInt(tokensRemaining, 10) : undefined,
      tokensLimit: tokensLimit ? parseInt(tokensLimit, 10) : undefined,
    };
  }

  return { isRateLimited: false, retryAfterMs: 0 };
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(status: number, errorMessage?: string): boolean {
  // HTTP 429 is the standard rate limit status
  if (status === 429) return true;

  // Some APIs return 529 for overloaded
  if (status === 529) return true;

  // Check for rate limit keywords in error message
  if (errorMessage) {
    const lowerMessage = errorMessage.toLowerCase();
    return (
      lowerMessage.includes('rate limit') ||
      lowerMessage.includes('rate_limit') ||
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('overloaded')
    );
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  retryAfterMs?: number
): number {
  // If the API provided a retry-after, use it (with a small buffer)
  if (retryAfterMs && retryAfterMs > 0) {
    return Math.min(retryAfterMs + 500, maxDelayMs);
  }

  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);

  // Add jitter (±20%) to prevent thundering herd
  const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);

  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format time duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Create a rate-limited fetch wrapper
 */
export function createRateLimitedFetch(
  config: Partial<RateLimitConfig> = {}
): (
  url: string,
  options: RequestInit,
  provider: 'anthropic' | 'openai'
) => Promise<Response> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async function rateLimitedFetch(
    url: string,
    options: RequestInit,
    provider: 'anthropic' | 'openai'
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        // Check if rate limited
        if (isRateLimitError(response.status)) {
          const rateLimitInfo = parseRateLimitHeaders(response.headers, provider);
          rateLimitInfo.isRateLimited = true;

          // Try to get retry-after from the response body if not in headers
          let retryAfterMs = rateLimitInfo.retryAfterMs;
          if (!retryAfterMs) {
            try {
              const errorData = await response.clone().json();
              if (errorData.error?.message) {
                // Extract seconds from messages like "Please retry after X seconds"
                const match = errorData.error.message.match(/(\d+)\s*seconds?/i);
                if (match) {
                  retryAfterMs = parseInt(match[1], 10) * 1000;
                }
              }
            } catch {
              // Ignore JSON parse errors
            }
          }

          finalConfig.onRateLimitHit?.(rateLimitInfo, attempt);

          if (attempt < finalConfig.maxRetries) {
            const delayMs = calculateBackoffDelay(
              attempt,
              finalConfig.baseDelayMs,
              finalConfig.maxDelayMs,
              retryAfterMs
            );

            finalConfig.onRetryScheduled?.(delayMs, attempt);
            await sleep(delayMs);
            continue;
          }
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Network errors might be transient, retry with backoff
        if (attempt < finalConfig.maxRetries) {
          const delayMs = calculateBackoffDelay(
            attempt,
            finalConfig.baseDelayMs,
            finalConfig.maxDelayMs
          );
          finalConfig.onRetryScheduled?.(delayMs, attempt);
          await sleep(delayMs);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  };
}

/**
 * Rate limit state tracker for monitoring across requests
 */
export class RateLimitTracker {
  private lastRateLimitTime: number = 0;
  private consecutiveRateLimits: number = 0;
  private totalRateLimits: number = 0;

  recordRateLimit(): void {
    this.lastRateLimitTime = Date.now();
    this.consecutiveRateLimits++;
    this.totalRateLimits++;
  }

  recordSuccess(): void {
    this.consecutiveRateLimits = 0;
  }

  getStats(): {
    lastRateLimitTime: number;
    consecutiveRateLimits: number;
    totalRateLimits: number;
    timeSinceLastRateLimit: number;
  } {
    return {
      lastRateLimitTime: this.lastRateLimitTime,
      consecutiveRateLimits: this.consecutiveRateLimits,
      totalRateLimits: this.totalRateLimits,
      timeSinceLastRateLimit: this.lastRateLimitTime
        ? Date.now() - this.lastRateLimitTime
        : Infinity,
    };
  }

  shouldBackOff(): boolean {
    // If we've hit 3+ consecutive rate limits, suggest backing off
    return this.consecutiveRateLimits >= 3;
  }
}
