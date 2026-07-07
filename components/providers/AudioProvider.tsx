"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type AudioContextType = {
  isPlaying: boolean;
  togglePlay: () => void;
  setAudioUrl: (url: string) => void;
};

const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  togglePlay: () => {},
  setAudioUrl: () => {},
});

export function AudioProvider({ children, initialAudioUrl }: { children: React.ReactNode, initialAudioUrl?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl || "");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    // Only initialize audio on client side and not on admin pages
    if (typeof window !== "undefined" && !isAdmin && audioUrl) {
      if (!audioRef.current) {
        try {
          const audio = new Audio(audioUrl);
          audio.loop = true;
          audio.volume = 0.5;
          audioRef.current = audio;
          
          const playAudio = () => {
            if (audioRef.current && audioRef.current.paused) {
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                ['click', 'touchstart', 'keydown'].forEach(event => {
                  window.removeEventListener(event, playAudio);
                });
              }).catch(() => {
                // Still blocked
              });
            } else {
              ['click', 'touchstart', 'keydown'].forEach(event => {
                window.removeEventListener(event, playAudio);
              });
            }
          };

          // Attempt to autoplay
          audio.play().then(() => {
            setIsPlaying(true);
          }).catch((e) => {
            // Autoplay was prevented by browser (requires user interaction)
            console.log("Autoplay prevented by browser, waiting for interaction...");
            setIsPlaying(false);
            ['click', 'touchstart', 'keydown'].forEach(event => {
              window.addEventListener(event, playAudio, { once: true });
            });
          });
        } catch (e) {
          console.error("Failed to initialize audio", e);
        }
      } else if (audioRef.current.src !== window.location.origin + audioUrl && audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl;
        
        // Attempt to autoplay on URL change
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((e) => {
          console.log("Autoplay prevented by browser:", e);
          setIsPlaying(false);
        });
      }
    }

    return () => {
      // Cleanup on unmount only if we are leaving public area entirely
      // Actually, we want it to persist across public pages, so we don't destroy it here
    };
  }, [audioUrl, isAdmin]);

  // Handle admin route navigation
  useEffect(() => {
    if (isAdmin && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isAdmin, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error("Audio playback failed", error);
          setIsPlaying(false);
        });
    }
  };

  return (
    <AudioContext.Provider value={{ isPlaying, togglePlay, setAudioUrl }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);
