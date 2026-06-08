import { createServerFn } from "@tanstack/react-start";

import { getSupabaseServerClient } from "./supabase-server";

interface PronunciationResult {
  audio: string;
  contentType: string;
}

/**
 * Get pronunciation audio for a Latin text
 */
export const getPronunciation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { dialect?: "classical" | "ecclesiastical"; text: string }) => data,
  )
  .handler(async ({ data }): Promise<null | PronunciationResult> => {
    const supabase = getSupabaseServerClient();

    const response = await supabase.functions.invoke<PronunciationResult>(
      "pronunciation",
      {
        body: {
          dialect: data.dialect ?? "classical",
          text: data.text,
        },
      },
    );

    if (response.error) {
      console.error("Pronunciation error:", response.error);
      return null;
    }

    return response.data;
  });
