import { describe, expect, it, vi } from "vitest";

import { fetchWithRetry } from "./fetch.utilities";

describe("fetch.utilities", () => {
  describe(
    "fetchWithRetry",
    () => {
      it("should return response text on successful fetch", async () => {
        const mockResponse = "test response data";
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: vi.fn().mockResolvedValue(mockResponse),
        });

        const result = await fetchWithRetry("https://example.com/api");

        expect(result).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith("https://example.com/api", {
          headers: { Connection: "close" },
        });
      });

      it("should throw on non-OK HTTP response without retrying", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });

        await expect(fetchWithRetry("https://example.com/api")).rejects.toThrow(
          "HTTP 404: Not Found"
        );
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      it("should throw on 500 server error without retrying", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        await expect(fetchWithRetry("https://example.com/api")).rejects.toThrow(
          "HTTP 500: Internal Server Error"
        );
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      it("should retry on ECONNRESET error", async () => {
        expect.assertions(2);
        const mockResponse = "success after retry";
        const retryableError = new Error("Connection reset");
        (retryableError as any).code = "ECONNRESET";

        global.fetch = vi
          .fn()
          .mockRejectedValueOnce(retryableError)
          .mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValue(mockResponse),
          });

        const result = await fetchWithRetry("https://example.com/api");

        expect(result).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      it("should retry on ETIMEDOUT error", async () => {
        expect.assertions(2);
        const mockResponse = "success after timeout retry";
        const retryableError = new Error("Connection timed out");
        (retryableError as any).code = "ETIMEDOUT";

        global.fetch = vi
          .fn()
          .mockRejectedValueOnce(retryableError)
          .mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValue(mockResponse),
          });

        const result = await fetchWithRetry("https://example.com/api");

        expect(result).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      it("should retry on UND_ERR_SOCKET error with cause", async () => {
        const mockResponse = "success after socket retry";
        const retryableError = new Error("Socket error");
        (retryableError as any).cause = { code: "UND_ERR_SOCKET" };

        global.fetch = vi
          .fn()
          .mockRejectedValueOnce(retryableError)
          .mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValue(mockResponse),
          });

        const result = await fetchWithRetry("https://example.com/api");

        expect(result).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      it("should retry on TypeError with 'fetch failed' message", async () => {
        const mockResponse = "success after fetch failed retry";
        const retryableError = new TypeError("fetch failed");

        global.fetch = vi
          .fn()
          .mockRejectedValueOnce(retryableError)
          .mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValue(mockResponse),
          });

        const result = await fetchWithRetry("https://example.com/api");

        expect(result).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      it("should not retry on non-retryable errors", async () => {
        const nonRetryableError = new Error("Some other error");

        global.fetch = vi.fn().mockRejectedValue(nonRetryableError);

        await expect(fetchWithRetry("https://example.com/api")).rejects.toThrow(
          "Some other error"
        );
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      it("should exhaust retries and throw last error", async () => {
        const retryableError = new Error("Connection reset");
        (retryableError as any).code = "ECONNRESET";

        // Mock to always fail with retryable error
        global.fetch = vi.fn().mockRejectedValue(retryableError);

        await expect(fetchWithRetry("https://example.com/api")).rejects.toThrow(
          "Connection reset"
        );
        // Default MAX_RETRIES is 5, so 6 total attempts (initial + 5 retries)
        expect(fetch).toHaveBeenCalledTimes(6);
      });

      it("should handle ENOTFOUND error with retry", async () => {
        const mockResponse = "success";
        const retryableError = new Error("DNS lookup failed");
        (retryableError as any).code = "ENOTFOUND";

        global.fetch = vi
          .fn()
          .mockRejectedValueOnce(retryableError)
          .mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValue(mockResponse),
          });

        const result = await fetchWithRetry("https://example.com/api");

        expect(result).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      it("should handle UND_ERR_CONNECT_TIMEOUT error", async () => {
        const mockResponse = "success";
        const retryableError = new Error("Connect timeout");
        (retryableError as any).code = "UND_ERR_CONNECT_TIMEOUT";

        global.fetch = vi
          .fn()
          .mockRejectedValueOnce(retryableError)
          .mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValue(mockResponse),
          });

        const result = await fetchWithRetry("https://example.com/api");

        expect(result).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      it("should handle UND_ERR_HEADERS_TIMEOUT error", async () => {
        const mockResponse = "success";
        const retryableError = new Error("Headers timeout");
        (retryableError as any).code = "UND_ERR_HEADERS_TIMEOUT";

        global.fetch = vi
          .fn()
          .mockRejectedValueOnce(retryableError)
          .mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValue(mockResponse),
          });

        const result = await fetchWithRetry("https://example.com/api");

        expect(result).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      it("should handle UND_ERR_BODY_TIMEOUT error", async () => {
        const mockResponse = "success";
        const retryableError = new Error("Body timeout");
        (retryableError as any).code = "UND_ERR_BODY_TIMEOUT";

        global.fetch = vi
          .fn()
          .mockRejectedValueOnce(retryableError)
          .mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValue(mockResponse),
          });

        const result = await fetchWithRetry("https://example.com/api");

        expect(result).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    },
    { timeout: 40000 } // Retry tests with delays need longer timeout
  );
});
