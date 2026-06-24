import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";

type Props = {
  settings: TempleSettingsPlain;
};

export function PublicHeader({ settings }: Props) {
  const gurujiImage = settings.logoUrl || "/assets/guruji.jpg";

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
        <Link href="/" className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src={gurujiImage}
              alt="Sri Padmananda Guruji"
              width={48}
              height={48}
              className="h-9 w-9 shrink-0 rounded-full border-2 border-primary/20 object-cover sm:h-12 sm:w-12"
              priority
            />
            <div>
              <p className="text-lg font-bold leading-tight text-primary sm:text-xl">{settings.templeName}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">{settings.templeDescription || "Donations & Seva Management"}</p>
            </div>
          </div>
        </Link>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/donate">Donate Now</Link>
        </Button>
      </div>
    </header>
  );
}
