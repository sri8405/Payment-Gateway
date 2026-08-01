import type { Metadata, Viewport } from "next";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { PwaLifecycleProvider } from "@/components/providers/PwaLifecycleProvider";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { PwaInstallPrompt } from "@/components/ui/PwaInstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuruSeva - Temple Seva Booking",
  description: "Premium temple seva booking and management platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GuruSeva",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#c65910",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await templeSettingsRepository.getCurrentOrDefault();

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <PwaLifecycleProvider />
        <AudioProvider initialAudioUrl={settings.audioUrl || ""}>
          {children}
        </AudioProvider>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
