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
        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground hover:bg-black/5 rounded-full transition-colors active:scale-95"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative w-64 h-full bg-card shadow-2xl border-l border-border p-6 flex flex-col gap-6 animate-fade-in-up">
            <nav className="flex flex-col gap-4 mt-4">
              <Link 
                href="/find-my-receipts"
                className="flex items-center gap-3 text-foreground hover:text-saffron font-medium text-lg min-h-[44px] transition-colors p-2 rounded-lg hover:bg-saffron/5"
              >
                <Receipt size={24} className="text-saffron" />
                Find My Receipts
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
