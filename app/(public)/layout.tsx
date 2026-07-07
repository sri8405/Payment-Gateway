import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { DevoteeTicker } from "@/components/ui/DevoteeTicker";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { ReactNode } from "react";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await templeSettingsRepository.getCurrentOrDefault();

  return (
    <div className="flex min-h-screen flex-col flex-1 bg-[url('/assets/pattern-bg.png')] bg-fixed">
      <div className="bg-background/95 min-h-screen flex flex-col flex-1">
        <DevoteeTicker />
        <PublicHeader settings={settings} />
        <main className="flex-1 flex flex-col">{children}</main>
        <PublicFooter settings={settings} />
      </div>
    </div>
  );
}
