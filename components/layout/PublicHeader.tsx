import Link from "next/link";
import Image from "next/image";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";
import { AudioButton } from "@/components/ui/AudioButton";
import { MobileNav } from "./MobileNav";

type Props = {
  settings: TempleSettingsPlain;
};

export function PublicHeader({ settings }: Props) {
  const logoImage = settings.logoUrl || "/assets/guruji.jpg";
  const showAudio = settings.audioEnabled !== false;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 temple-border-bottom shadow-sm">
        <div className="container mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-2 sm:px-6">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group transition-transform hover:scale-[1.02] flex-shrink shrink min-w-0 pr-2">
            <div className="relative h-9 w-9 sm:h-14 sm:w-14 overflow-hidden rounded-full border border-gold sm:border-2 shadow-md flex-shrink-0">
              <Image
                src={logoImage}
                alt={settings.templeName}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-[13px] sm:text-2xl font-bold text-saffron tracking-tight group-hover:text-gold transition-colors leading-tight line-clamp-2 break-words">
                {settings.templeName}
              </span>
              <span className="hidden sm:block text-xs sm:text-sm text-copper font-medium italic truncate">
                {settings.templeDescription || "Seva Booking & Management"}
              </span>
            </div>
          </Link>
          
          <nav className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link 
              href="/find-my-receipts" 
              className="hidden sm:flex text-saffron hover:text-gold font-medium text-[11px] sm:text-base transition-colors whitespace-nowrap min-h-[44px] items-center px-1"
            >
              Find My Receipts
            </Link>
            <Link 
              href="/donate" 
              className="bg-gradient-to-r from-saffron to-gold hover:from-gold hover:to-saffron text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 text-[13px] sm:text-base animate-pulse-glow whitespace-nowrap min-h-[44px] flex items-center justify-center"
            >
              Book Seva
            </Link>
            <MobileNav />
          </nav>
        </div>
      </header>
      {showAudio && <AudioButton />}
    </>
  );
}
