import { Button } from "@monorepo/lexico-components";
import { Loader2, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";

import { getPronunciation } from "../lib/pronunciation";

import type { ReactNode } from "react";

interface PronunciationButtonProps {
  text: string;
  dialect?: "classical" | "ecclesiastical";
  className?: string;
}

export function PronunciationButton({
  text,
  dialect = "classical",
  className,
}: PronunciationButtonProps): ReactNode {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPronunciation({
        data: { text, dialect },
      });

      if (result?.audio) {
        // Decode base64 audio and play
        const audioData = atob(result.audio);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }

        const blob = new Blob([audioArray], { type: result.contentType });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onended = () => {
          URL.revokeObjectURL(url);
        };

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
      variant="ghost"
      size="icon"
      onClick={() => void handlePlay()}
      disabled={isLoading}
      className={className}
      title={`Play ${dialect} pronunciation`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
