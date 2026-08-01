import Link from "next/link";
import Image from "next/image";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { ChevronRight, CalendarDays, HeartHandshake, Sparkles, MapPin, Phone, Mail } from "lucide-react";

export const revalidate = 300;

export default async function HomePage() {
  const settings = await templeSettingsRepository.getCurrentOrDefault();
  let sevas: Awaited<ReturnType<typeof sevaRepository.findActive>> = [];

  try {
    sevas = await sevaRepository.findActive();
  } catch (error) {
    console.error("Failed to load active sevas:", error);
  }

  const featuredSevas = sevas.slice(0, 3);

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section - Heritage Premium */}
      <section className="relative min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] w-full flex flex-col justify-end items-center overflow-hidden pb-8 sm:pb-20">
        
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 bg-black">
          <Image
            src="/hero-banner.png"
            alt="Divine Abode"
            fill
            /* 
              Aggressive Focal Point Positioning:
              Prioritize Guruji's face across all devices.
            */
            className="object-cover object-[25%_0%] sm:object-[20%_5%] md:object-[25%_10%] lg:object-[20%_15%]"
            priority
          />
          {/* 
            Soft Bottom Gradient:
            Provides contrast only for the bottom-centered text.
          */}
          <div className="absolute inset-x-0 bottom-0 h-[65%] sm:h-[50%] bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"></div>
        </div>

        {/* Hero Content Area - Bottom Centered */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 w-full flex flex-col items-center text-center animate-fade-in-up">
          
          <div className="max-w-4xl w-full flex flex-col items-center">
            
            {/* Spiritual Motif */}
            <div className="inline-flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <span className="w-8 sm:w-16 h-[1px] bg-saffron drop-shadow-md"></span>
              <span className="text-[10px] sm:text-sm font-semibold text-saffron tracking-[0.2em] sm:tracking-[0.25em] uppercase font-serif drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Seek Divine Grace
              </span>
              <span className="w-8 sm:w-16 h-[1px] bg-saffron drop-shadow-md"></span>
            </div>
            
            {/* Heading - Cinematic, Centered, Constrained to 2 lines */}
            <h1 className="text-[2.5rem] leading-[1.05] sm:text-6xl lg:text-[5rem] font-serif font-medium text-white mb-3 sm:mb-6 tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] max-w-3xl line-clamp-2">
              {settings.templeName}
            </h1>
            
            {/* Devotional Subtitle */}
            <p className="text-base sm:text-xl md:text-2xl text-white/95 mb-6 sm:mb-10 font-light leading-relaxed sm:leading-[1.6] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] font-sans max-w-2xl px-2">
              Experience the profound peace of His presence. Participate in sacred sevas and receive abundant blessings.
            </p>
            
            {/* Buttons - Centered */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 w-full sm:w-auto justify-center">
              <Link 
                href="/donate" 
                className="group relative inline-flex items-center justify-center gap-3 bg-saffron hover:bg-saffron/90 px-8 py-3.5 sm:px-10 sm:py-5 text-base sm:text-lg font-medium text-white rounded-full overflow-hidden shadow-[0_8px_24px_rgba(249,115,22,0.4)] transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto min-h-[44px]"
              >
                <span>Book Seva</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/find-my-receipts" 
                className="group relative inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-8 py-3.5 sm:px-10 sm:py-5 text-base sm:text-lg font-medium text-white rounded-full transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)] w-full sm:w-auto min-h-[44px]"
              >
                <span>Find My Receipts</span>
              </Link>
            </div>
            
          </div>
        </div>
      </section>

      {/* Featured Sevas Section */}
      <section className="py-16 sm:py-24 relative z-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start sm:items-end mb-10 sm:mb-16 gap-4 sm:gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-3 sm:mb-4">Sacred Offerings</h2>
              <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
                Choose from our sacred sevas and participate in the temple's daily rituals. 
                Your offerings support the temple's spiritual and charitable activities.
              </p>
            </div>
            {sevas.length > 3 && (
              <Link 
                href="/donate" 
                className="hidden md:inline-flex items-center gap-2 text-saffron font-semibold hover:text-saffron/80 transition-colors"
              >
                View All Offerings <ChevronRight size={18} />
              </Link>
            )}
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {featuredSevas.map((seva, index) => (
              <div 
                key={seva._id} 
                className="group relative bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/50 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-saffron/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl"></div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-3 sm:mb-4 relative z-10">{seva.name}</h3>
                <p className="text-muted-foreground flex-grow mb-6 sm:mb-8 relative z-10 leading-relaxed text-sm sm:text-base">
                  {seva.description || "A sacred offering to seek divine blessings."}
                </p>
                
                <div className="pt-5 sm:pt-6 border-t border-border/50 flex items-center justify-between mt-auto relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Offering</span>
                    <span className="text-lg sm:text-xl font-bold text-saffron">
                      {seva.pricingMode === 'custom' 
                        ? `Any amount` 
                        : `₹${seva.fixedAmount || seva.suggestedAmount}`}
                    </span>
                  </div>
                  <Link 
                    href={`/donate?seva=${seva._id}`}
                    className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center bg-saffron/10 rounded-full text-saffron group-hover:bg-saffron group-hover:text-white transition-colors"
                  >
                    <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {sevas.length > 3 && (
            <div className="mt-10 text-center md:hidden">
              <Link 
                href="/donate" 
                className="inline-flex items-center justify-center gap-2 text-saffron font-semibold border border-saffron/20 rounded-full px-6 py-3 min-h-[44px] w-full"
              >
                View All Offerings <ChevronRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features/Info Section */}
      <section className="py-16 sm:py-24 relative bg-card border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div className="space-y-8 sm:space-y-10">
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 sm:mb-6">Why Book Online?</h2>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  We've made it simple and secure to participate in temple sevas from anywhere in the world.
                </p>
              </div>
              
              <div className="space-y-6 sm:space-y-8">
                <div className="flex gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-saffron/10 flex items-center justify-center shrink-0 text-saffron">
                    <CalendarDays size={24} className="sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold font-serif mb-1 sm:mb-2">Secure your slot instantly</h4>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">Book sevas from anywhere, anytime. Instant confirmation via SMS and Email.</p>
                  </div>
                </div>
                <div className="flex gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-saffron/10 flex items-center justify-center shrink-0 text-saffron">
                    <HeartHandshake size={24} className="sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold font-serif mb-1 sm:mb-2">100% Transparent</h4>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">Direct contribution to the temple trust. Official receipts generated immediately.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-background rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-border/50 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold mb-6 sm:mb-8 text-foreground">Temple Information</h3>
              <div className="space-y-5 sm:space-y-6 text-muted-foreground relative z-10">
                {settings.contactNumber && (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="mt-1 p-2 bg-card rounded-lg text-saffron"><Phone size={18} className="sm:w-5 sm:h-5" /></div>
                    <div>
                      <span className="block text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1">Contact</span>
                      <span className="text-foreground text-base sm:text-lg">{settings.contactNumber}</span>
                    </div>
                  </div>
                )}
                {settings.email && (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="mt-1 p-2 bg-card rounded-lg text-saffron"><Mail size={18} className="sm:w-5 sm:h-5" /></div>
                    <div>
                      <span className="block text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1">Email</span>
                      <span className="text-foreground text-base sm:text-lg">{settings.email}</span>
                    </div>
                  </div>
                )}
                {settings.address && (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="mt-1 p-2 bg-card rounded-lg text-saffron"><MapPin size={18} className="sm:w-5 sm:h-5" /></div>
                    <div>
                      <span className="block text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1">Address</span>
                      <span className="text-foreground text-base sm:text-lg leading-relaxed">{settings.address}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
