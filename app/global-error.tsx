"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Fatal Global Error]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-gray-50 flex items-center justify-center min-h-screen p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">Application Recovered</h1>
            <p className="text-sm text-gray-600">
              A critical rendering exception occurred. Your payment and donation status are protected.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => reset()}
              className="px-6 py-2.5 bg-amber-600 text-white font-medium rounded-full text-sm hover:bg-amber-700 transition"
            >
              Reload Page
            </button>
            <a
              href="/donate"
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-full text-sm hover:bg-gray-200 transition"
            >
              Return to Donate
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
