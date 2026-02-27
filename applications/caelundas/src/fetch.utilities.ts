const MAX_RETRIES = Number.parseInt(process.env["MAX_RETRIES"] || "5", 10);
const INITIAL_DELAY_MS = Number.parseInt(
  process.env["INITIAL_DELAY_MS"] || "1000",
  10,
);
const MAX_DELAY_MS = Number.parseInt(
  process.env["MAX_DELAY_MS"] || "30000",
  10,
);
const BACKOFF_MULTIPLIER = Number.parseFloat(
  process.env["BACKOFF_MULTIPLIER"] || "2",
);

const RETRYABLE_ERROR_CODES = new Set([
  "UND_ERR_SOCKET",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    const cause = err["cause"] as Record<string, unknown> | undefined;
    const code = cause?.["code"] || err["code"];
    return typeof code === "string" ? code : "UNKNOWN";
  }
  return "UNKNOWN";
}

function isRetryableError(error: unknown): boolean {
  const errorCode = getErrorCode(error);
  return (
    RETRYABLE_ERROR_CODES.has(errorCode) ||
    (error instanceof TypeError && error.message.includes("fetch failed"))
  );
}

function calculateDelay(attempt: number): number {
  const exponentialDelay =
    INITIAL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
  return Math.min(exponentialDelay, MAX_DELAY_MS);
}

/**
 * Fetches a URL with exponential backoff retry logic.
 *
 * Automatically retries transient network errors (socket closures, timeouts,
 * connection resets) using exponential backoff. Uses "Connection: close" header
 * to prevent HTTP connection reuse issues that can cause socket errors.
 *
 * @param url - The URL to fetch
 * @returns Promise resolving to the response body text
 * @throws For non-retryable errors or after max retries exceeded
 *
 * @remarks
 * Configuration via environment variables:
 * - MAX_RETRIES: Maximum retry attempts (default: 5)
 * - INITIAL_DELAY_MS: Starting delay in milliseconds (default: 1000)
 * - MAX_DELAY_MS: Maximum delay cap (default: 30000)
 * - BACKOFF_MULTIPLIER: Exponential growth factor (default: 2)
 *
 * Retryable error codes:
 * - UND_ERR_SOCKET, ECONNRESET, ETIMEDOUT, ENOTFOUND
 * - UND_ERR_CONNECT_TIMEOUT, UND_ERR_HEADERS_TIMEOUT, UND_ERR_BODY_TIMEOUT
 *
 * @example
 * ```typescript
 * const data = await fetchWithRetry('https://api.example.com/data');
 * // Automatically retries on socket errors with exponential backoff:
 * // Attempt 1: immediate
 * // Attempt 2: wait 1s
 * // Attempt 3: wait 2s
 * // Attempt 4: wait 4s
 * // etc.
 * ```
 */
export async function fetchWithRetry(url: string): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Connection: "close" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`❌ Non-retryable error: ${message}`);
        throw error;
      }

      if (attempt > MAX_RETRIES) {
        console.log(`❌ Max retries (${MAX_RETRIES}) exceeded`);
        break;
      }

      const delayMs = calculateDelay(attempt);
      const errorCode = getErrorCode(error);
      console.log(
        `⚠️  Retry ${attempt}/${MAX_RETRIES}: ${errorCode} - waiting ${delayMs}ms`,
      );

      await delay(delayMs);
    }
  }

  throw lastError;
}
