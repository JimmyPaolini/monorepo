import { Loader2, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@monorepo/lexico-components";

import { getPronunciation } from "../lib/pronunciation";

import type { ReactNode } from "react";

/**
 * Properties for PronunciationButton component that plays Latin audio.
 */
interface PronunciationButtonProperties {
  /** Additional class names */
  className?: string;
  /** Pronunciation dialect (classical or ecclesiastical) */
  dialect?: "classical" | "ecclesiastical";
  /** The Latin text to pronounce */
  text: string;
}

/**
 * Button component that plays pronunciation audio for Latin text.
 */
export function PronunciationButton({
  className,
  dialect = "classical",
  text,
}: PronunciationButtonProperties): ReactNode {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPronunciation({
        data: { dialect, text },
      });

      if (result?.audio) {
        // Decode base64 audio and play
        const audioData = atob(result.audio);
        const audioArray = new Uint8Array(audioData.length);
        for (let index = 0; index < audioData.length; index++) {
          audioArray[index] = audioData.codePointAt(index) ?? 0;
        }

        const blob = new Blob([audioArray], { type: result.contentType });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.addEventListener("ended", () => {
          URL.revokeObjectURL(url);
        });

        await audio.play();
      }
    } catch (error) {
      console.error("Failed to play pronunciation:", error);
    } finally {
      setIsLoading(false);
    }
  }, [text, dialect]);

  return (
    <Button
      className={className}
      disabled={isLoading}
      onClick={() => void handlePlay()}
      size="icon"
      title={`Play ${dialect} pronunciation`}
      variant="ghost"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
