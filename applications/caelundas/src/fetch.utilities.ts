const MAX_RETRIES = parseInt(process.env["MAX_RETRIES"] || "5", 10);
const INITIAL_DELAY_MS = parseInt(
  process.env["INITIAL_DELAY_MS"] || "1000",
  10
);
const MAX_DELAY_MS = parseInt(process.env["MAX_DELAY_MS"] || "30000", 10);
const BACKOFF_MULTIPLIER = parseFloat(process.env["BACKOFF_MULTIPLIER"] || "2");

const RETRYABLE_ERROR_CODES = [
  "UND_ERR_SOCKET",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
];

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
    RETRYABLE_ERROR_CODES.includes(errorCode) ||
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
 * Handles transient network errors like socket closures, timeouts, and connection resets.
 * Uses Connection: close header to prevent connection reuse issues.
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
        `⚠️  Retry ${attempt}/${MAX_RETRIES}: ${errorCode} - waiting ${delayMs}ms`
      );

      await delay(delayMs);
    }
  }

  throw lastError;
}
