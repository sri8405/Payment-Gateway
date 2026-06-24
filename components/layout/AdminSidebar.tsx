"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { HandCoins, LayoutDashboard, ListChecks, Menu, Settings2, X } from "lucide-react";

const items = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/donations", label: "Seva Bookings", icon: HandCoins },
  { href: "/admin/sevas", label: "Sevas", icon: ListChecks },
  { href: "/admin/settings", label: "Settings", icon: Settings2 }
];

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 px-3 pb-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <Brand compact />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white"
          aria-label="Open admin navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <aside className="hidden border-r bg-white md:block md:min-h-screen md:w-64">
        <div className="px-4 py-5">
          <Brand />
        </div>
        {nav}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close admin navigation"
          />
          <aside className="relative h-full w-72 max-w-[85vw] border-r bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border"
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
        alt="Sri Padmananda Guruji"
        width={48}
        height={48}
        className={`${compact ? "h-9 w-9" : "h-12 w-12"} shrink-0 rounded-full border-2 border-primary/20 object-cover`}
      />
      <div className="min-w-0">
        <p className="truncate font-bold text-primary">Temple Admin</p>
        <p className="truncate text-sm text-muted-foreground">Seva Booking Management</p>
      </div>
    </div>
  );
}
