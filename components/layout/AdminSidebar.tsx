"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
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

  async function handleLogout() {
    const { signOut } = await import("next-auth/react");
    signOut({ callbackUrl: "/admin/login" });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 pb-3">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-saffron/10 text-saffron"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto pt-4">
        <button
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gold/20 bg-white px-4 py-3 md:hidden">
        <Brand compact />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 bg-white"
          aria-label="Open admin navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden min-h-screen w-64 flex-col border-r border-gold/20 bg-white md:flex">
        <div className="px-4 py-5">
          <Brand />
        </div>
        {nav}
      </aside>

      {/* Mobile overlay */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close admin navigation"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border"
                aria-label="Close admin navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
    </>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Image
        src="/assets/guruji.jpg"
        alt="Temple Admin"
        width={48}
        height={48}
        className={`${compact ? "h-9 w-9" : "h-12 w-12"} shrink-0 rounded-full border-2 border-gold/30 object-cover`}
      />
      <div className="min-w-0">
        <p className="truncate font-serif font-bold text-copper">GuruSeva</p>
        <p className="truncate text-xs text-muted-foreground">Admin Console</p>
      </div>
    </div>
  );
}
