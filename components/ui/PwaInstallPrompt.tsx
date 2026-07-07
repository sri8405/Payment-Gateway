"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "./button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user already dismissed
    const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
    
    // Check if already running as standalone (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (hasDismissed === "true" || isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-gold/30 shadow-2xl rounded-2xl p-4 z-50 animate-fade-in-up flex items-start gap-4">
      <div className="w-12 h-12 bg-saffron/10 rounded-xl flex items-center justify-center shrink-0">
        <Download className="w-6 h-6 text-saffron" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-foreground">Install GuruSeva App</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Install our app for quick access to booking sevas directly from your home screen.
        </p>
        <div className="flex gap-2">
          <Button onClick={handleInstallClick} className="bg-saffron hover:bg-saffron/90 text-white flex-1">
            Install
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="px-3">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
