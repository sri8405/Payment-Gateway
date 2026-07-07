import type { Metadata } from "next";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuruSeva - Temple Seva Booking",
  description: "Premium temple seva booking and management platform"
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await templeSettingsRepository.getCurrentOrDefault();

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <AudioProvider initialAudioUrl={settings.audioUrl || ""}>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
