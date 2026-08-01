"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to console/monitoring tool
    console.error("[Application Boundary Error]:", error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-20 flex items-center justify-center min-h-[60vh]">
      <div className="w-full bg-white border border-amber-200 shadow-xl rounded-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            An unexpected application error occurred. Don't worry—your payments and donation data remain safe and intact.
          </p>
        </div>

        <div className="flex gap-4 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-6 py-2.5 bg-saffron text-white rounded-full hover:bg-saffron/90 transition-colors font-medium text-sm shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-2.5 bg-secondary/20 text-secondary-foreground rounded-full hover:bg-secondary/30 transition-colors font-medium text-sm"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
