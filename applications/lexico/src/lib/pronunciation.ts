import { createServerFn as createServerFunction } from "@tanstack/react-start";

interface PronunciationResult {
  audio: string;
  contentType: string;
}

/**
 * Get pronunciation audio for a Latin text
 */
export const getPronunciation = createServerFunction({ method: "POST" })
  .inputValidator(
    (data: { dialect?: "classical" | "ecclesiastical"; text: string }) => data,
  )
  .handler(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<null | PronunciationResult> => {
      return null;
    },
  );
