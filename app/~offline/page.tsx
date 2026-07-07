import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-saffron/10 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-12 h-12 text-saffron" />
      </div>
      <h1 className="text-3xl font-serif font-bold text-copper mb-4">You are offline</h1>
      <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
        It looks like you've lost your internet connection. GuruSeva requires an active connection for live bookings and secure payments.
      </p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-saffron text-white rounded-xl font-medium hover:bg-saffron/90 transition-colors shadow-lg shadow-saffron/20"
      >
        Try Again
      </Link>
    </div>
  );
}
