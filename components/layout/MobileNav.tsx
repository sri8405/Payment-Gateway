"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Receipt } from "lucide-react";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <div className="sm:hidden flex items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground hover:bg-black/5 rounded-full transition-colors active:scale-95 relative z-50"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <>
          {/* Backdrop - Absolute positioned relative to header to bypass backdrop-filter context bug */}
          <div 
            className="absolute top-full left-0 w-[100vw] h-[100vh] bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 w-full bg-card shadow-2xl border-b border-border z-50 flex flex-col overflow-hidden animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
            <nav className="flex flex-col p-4 gap-3">
              <Link 
                href="/donate"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-saffron to-gold hover:from-gold hover:to-saffron text-white font-semibold text-lg py-3 px-4 rounded-xl shadow-md transition-all active:scale-95"
                onClick={() => setIsOpen(false)}
              >
                Book Seva
              </Link>
              <Link 
                href="/find-my-receipts"
                className="flex items-center gap-3 text-foreground hover:text-saffron font-medium text-lg min-h-[44px] transition-colors p-3 rounded-xl hover:bg-saffron/5 border border-transparent hover:border-saffron/20"
                onClick={() => setIsOpen(false)}
              >
                <Receipt size={24} className="text-saffron" />
                Find My Receipts
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
