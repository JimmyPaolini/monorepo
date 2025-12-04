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
    (data: { text: string; dialect?: "classical" | "ecclesiastical" }) => data,
  )
  .handler(async ({ data }): Promise<PronunciationResult | null> => {
    const supabase = getSupabaseServerClient();

    const response = await supabase.functions.invoke<PronunciationResult>(
      "pronunciation",
      {
        body: {
          text: data.text,
          dialect: data.dialect ?? "classical",
        },
      },
    );

    if (response.error) {
      console.error("Pronunciation error:", response.error);
      return null;
    }

    return response.data;
  });
