"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  HandCoins,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  CreditCard,
  Settings2,
  X,
  ChevronRight,
} from "lucide-react";

const items = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/offline-bookings", label: "Offline Bookings", icon: HandCoins },
  { href: "/admin/donations", label: "Bookings", icon: HandCoins },
  { href: "/admin/sevas", label: "Sevas", icon: ListChecks },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/payments", label: "Payment History", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change on mobile
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const { signOut } = await import("next-auth/react");
    signOut({ callbackUrl: "/admin/login" });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-2">
      <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        Overview
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-saffron text-white shadow-md shadow-saffron/20"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`} />
            {item.label}
            {isActive && (
              <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
            )}
          </Link>
        );
      })}
      
      <div className="mt-auto pt-6">
        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Account
        </div>
        <button
          onClick={handleLogout}
          className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 transition-colors group-hover:text-destructive" />
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile header - Premium sticky bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-white/80 backdrop-blur-md px-4 py-3 md:hidden shadow-sm">
        <Brand compact />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 transition-colors hover:bg-muted active:scale-95"
          aria-label="Open admin navigation"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden min-h-screen w-72 flex-col border-r border-border/50 bg-white md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
        <div className="px-6 py-8">
          <Brand />
        </div>
        {nav}
      </aside>

      {/* Mobile overlay and drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setOpen(false)}
            aria-label="Close admin navigation"
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-white shadow-2xl animate-in slide-in-from-left-full duration-300">
            <div className="flex items-center justify-between px-6 py-6 border-b border-border/50">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 transition-colors hover:bg-muted active:scale-95"
                aria-label="Close admin navigation"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto py-4">
              {nav}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3.5">
      <div className={`relative flex items-center justify-center rounded-xl bg-saffron/10 text-saffron shrink-0 shadow-inner ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
        <Image
          src="/assets/guruji.jpg"
          alt="Temple Admin"
          fill
          className="rounded-xl object-cover p-0.5"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-serif text-lg font-bold text-foreground leading-tight">GuruSeva</p>
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Admin Console</p>
      </div>
    </div>
  );
}
