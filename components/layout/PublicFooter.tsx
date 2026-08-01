import Link from "next/link";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";

export function PublicFooter({ settings }: { settings: TempleSettingsPlain }) {
  const currentYear = new Date().getFullYear();
  const links = settings.socialMediaLinks || {};
  const hasSocialLinks = Object.values(links).some(v => !!v);

  return (
    <footer className="mt-auto bg-card border-t border-border/50 pt-16 pb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron via-gold to-saffron opacity-50"></div>
      
      <div className="container mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid gap-12 md:grid-cols-3 lg:grid-cols-4 mb-16">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div>
              <h3 className="font-serif text-3xl font-bold text-foreground mb-2">{settings.templeName}</h3>
              <div className="w-12 h-1 bg-saffron rounded-full"></div>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
              {settings.websiteFooter || "Dedicated to preserving our traditions, serving the community, and spreading divine grace."}
            </p>
          </div>
          
          <div className="flex flex-col gap-6">
            <h4 className="font-serif text-xl font-bold text-foreground">Contact Details</h4>
            <div className="flex flex-col gap-4 text-sm text-muted-foreground">
              {settings.address && (
                <div className="flex items-start gap-3 hover:text-saffron transition-colors">
                  <MapPin size={18} className="shrink-0 mt-0.5 text-saffron" />
                  <p className="leading-relaxed">{settings.address}</p>
                </div>
              )}
              {settings.contactNumber && (
                <div className="flex items-center gap-3 hover:text-saffron transition-colors">
                  <Phone size={18} className="shrink-0 text-saffron" />
                  <p>{settings.contactNumber}</p>
                </div>
              )}
              {settings.email && (
                <div className="flex items-center gap-3 hover:text-saffron transition-colors">
                  <Mail size={18} className="shrink-0 text-saffron" />
                  <p>{settings.email}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <h4 className="font-serif text-xl font-bold text-foreground">Connect</h4>
            {settings.templeTimings && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
                <span className="block font-semibold text-foreground mb-1">Temple Timings</span>
                {settings.templeTimings}
              </div>
            )}
            
            {hasSocialLinks && (
              <div className="flex gap-4 mt-2">
                {links.facebook && (
                  <a href={links.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-foreground hover:bg-saffron hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                    <Facebook size={18} />
                  </a>
                )}
                {links.instagram && (
                  <a href={links.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-foreground hover:bg-saffron hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                    <Instagram size={18} />
                  </a>
                )}
                {links.youtube && (
                  <a href={links.youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-foreground hover:bg-saffron hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                    <Youtube size={18} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-between gap-6 border-t border-border/50 pt-8 md:flex-row text-sm text-muted-foreground">
          <p className="font-medium">© {currentYear} {settings.templeName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-saffron transition-colors font-medium">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-saffron transition-colors font-medium">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
