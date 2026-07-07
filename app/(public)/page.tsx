import Link from "next/link";
import Image from "next/image";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { ChevronRight, CalendarDays, HeartHandshake, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

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
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax effect */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-saffron to-gold">
          {settings.bannerUrl && (
            <Image
              src={settings.bannerUrl}
              alt="Temple Banner"
              fill
              className="object-cover object-center animate-pulse-glow"
              priority
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron/20 border border-saffron/30 text-saffron-foreground backdrop-blur-md mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <Sparkles size={16} className="text-gold" />
            <span className="text-sm font-medium text-white tracking-wider uppercase">Welcome to the Divine Abode</span>
            <Sparkles size={16} className="text-gold" />
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold text-white mb-6 drop-shadow-xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {settings.templeName}
          </h1>
          
          <p className="max-w-2xl text-lg sm:text-2xl text-ivory/90 mb-10 font-light drop-shadow-md animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {settings.templeDescription || "Book your sevas online and seek the divine blessings from anywhere in the world."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <Link 
              href="/donate" 
              className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-saffron to-gold px-8 py-4 text-lg font-bold text-white rounded-full overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span>Book Seva Now</span>
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Sevas Section */}
      <section className="py-20 relative z-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-saffron mb-4">Divine Offerings</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"></div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from our sacred sevas and participate in the temple's daily rituals. 
              Your offerings support the temple's spiritual and charitable activities.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {featuredSevas.map((seva, index) => (
              <div 
                key={seva._id} 
                className="group relative bg-card rounded-2xl p-6 border shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 flex flex-col h-full animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron to-gold transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-3">{seva.name}</h3>
                <p className="text-muted-foreground flex-grow mb-6">
                  {seva.description || "A sacred offering to seek divine blessings."}
                </p>
                
                <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Offering</span>
                    <span className="text-lg font-bold text-copper">
                      {seva.pricingMode === 'custom' 
                        ? `Any amount` 
                        : `₹${seva.fixedAmount || seva.suggestedAmount}`}
                    </span>
                  </div>
                  <Link 
                    href={`/donate?seva=${seva._id}`}
                    className="p-3 bg-secondary/20 rounded-full text-secondary-foreground hover:bg-saffron hover:text-white transition-colors"
                  >
                    <ChevronRight size={20} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {sevas.length > 3 && (
            <div className="mt-12 text-center">
              <Link 
                href="/donate" 
                className="inline-flex items-center gap-2 text-saffron font-medium hover:text-gold transition-colors"
              >
                View all {sevas.length} sevas <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features/Info Section */}
      <section className="py-20 relative bg-muted/30 temple-border-top temple-border-bottom">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-serif font-bold text-foreground">Why Book Online?</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-saffron/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="text-saffron" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Secure your slot instantly</h4>
                    <p className="text-muted-foreground">Book sevas from anywhere, anytime. Instant confirmation via SMS and Email.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-saffron/10 flex items-center justify-center shrink-0">
                    <HeartHandshake className="text-saffron" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">100% Transparent</h4>
                    <p className="text-muted-foreground">Direct contribution to the temple trust. Official receipts generated immediately.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-3xl p-8 border shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <h3 className="text-2xl font-serif font-bold mb-6 text-copper border-b pb-4">Temple Information</h3>
              <div className="space-y-4 text-foreground/80">
                {settings.contactNumber && (
                  <p className="flex items-start gap-3">
                    <span className="font-medium min-w-20">Contact:</span> 
                    <span>{settings.contactNumber}</span>
                  </p>
                )}
                {settings.email && (
                  <p className="flex items-start gap-3">
                    <span className="font-medium min-w-20">Email:</span> 
                    <span>{settings.email}</span>
                  </p>
                )}
                {settings.address && (
                  <p className="flex items-start gap-3">
                    <span className="font-medium min-w-20">Address:</span> 
                    <span>{settings.address}</span>
                  </p>
                )}
                {settings.templeTimings && (
                  <p className="flex items-start gap-3">
                    <span className="font-medium min-w-20">Timings:</span> 
                    <span>{settings.templeTimings}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
