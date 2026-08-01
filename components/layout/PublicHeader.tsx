import Link from "next/link";
import Image from "next/image";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";
import { AudioButton } from "@/components/ui/AudioButton";

type Props = {
  settings: TempleSettingsPlain;
};

export function PublicHeader({ settings }: Props) {
  const logoImage = settings.logoUrl || "/assets/guruji.jpg";
  const showAudio = settings.audioEnabled !== false;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 temple-border-bottom shadow-sm">
        <div className="container mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border-2 border-gold shadow-md">
              <Image
                src={logoImage}
                alt={settings.templeName}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-2xl font-bold text-saffron tracking-tight group-hover:text-gold transition-colors">
                {settings.templeName}
              </span>
              <span className="text-xs sm:text-sm text-copper font-medium italic">
                {settings.templeDescription || "Seva Booking & Management"}
              </span>
            </div>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link 
              href="/find-my-receipts" 
              className="text-saffron hover:text-gold font-medium text-sm sm:text-base transition-colors"
            >
              Find My Receipts
            </Link>
            <Link 
              href="/donate" 
              className="bg-gradient-to-r from-saffron to-gold hover:from-gold hover:to-saffron text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 text-sm sm:text-base animate-pulse-glow"
            >
              Book Seva
            </Link>
          </nav>
        </div>
      </header>
      {showAudio && <AudioButton />}
    </>
  );
}
