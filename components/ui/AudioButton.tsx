"use client";

import { useAudio } from "@/components/providers/AudioProvider";
import { Volume2, VolumeX } from "lucide-react";

export function AudioButton() {
  const { isPlaying, togglePlay } = useAudio();

  return (
    <button
      onClick={togglePlay}
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-saffron text-white shadow-lg hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center animate-pulse-glow"
      aria-label={isPlaying ? "Mute audio" : "Play audio"}
    >
      {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
    </button>
  );
}
