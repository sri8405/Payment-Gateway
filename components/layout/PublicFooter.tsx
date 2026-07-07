import Link from "next/link";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";

export function PublicFooter({ settings }: { settings: TempleSettingsPlain }) {
  const currentYear = new Date().getFullYear();
  const links = settings.socialMediaLinks || {};
  const hasSocialLinks = Object.values(links).some(v => !!v);

  return (
    <footer className="mt-auto border-t-2 border-saffron/20 bg-background pt-12 pb-8">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-2xl font-bold text-saffron">{settings.templeName}</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {settings.websiteFooter || "Dedicated to preserving our traditions and serving the community."}
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className="font-serif text-xl font-semibold text-copper">Contact Us</h4>
            <div className="flex flex-col gap-2 text-sm text-foreground/80">
              {settings.address && <p>📍 {settings.address}</p>}
              {settings.contactNumber && <p>📞 {settings.contactNumber}</p>}
              {settings.email && <p>✉️ {settings.email}</p>}
              {settings.supportContact && <p>ℹ️ {settings.supportContact}</p>}
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className="font-serif text-xl font-semibold text-copper">Timings & Links</h4>
            {settings.templeTimings && (
              <p className="text-sm text-foreground/80 mb-2">⏱️ {settings.templeTimings}</p>
            )}
            
            {hasSocialLinks && (
              <div className="flex flex-wrap gap-4 mt-2">
                {links.facebook && (
                  <a href={links.facebook} target="_blank" rel="noreferrer" className="text-foreground/70 hover:text-saffron transition-colors">
                    Facebook
                  </a>
                )}
                {links.instagram && (
                  <a href={links.instagram} target="_blank" rel="noreferrer" className="text-foreground/70 hover:text-saffron transition-colors">
                    Instagram
                  </a>
                )}
                {links.youtube && (
                  <a href={links.youtube} target="_blank" rel="noreferrer" className="text-foreground/70 hover:text-saffron transition-colors">
                    YouTube
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row text-xs text-foreground/60">
          <p>© {currentYear} {settings.templeName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-saffron">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-saffron">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
