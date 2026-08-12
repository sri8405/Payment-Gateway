import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { PwaLifecycleProvider } from "@/components/providers/PwaLifecycleProvider";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-background text-foreground">
        <PwaLifecycleProvider />
        <AudioProvider initialAudioUrl={settings.audioUrl || ""}>
          {children}
        </AudioProvider>
        <Analytics />
      </body>
    </html>
  );
}
