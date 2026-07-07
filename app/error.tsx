"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("GuruSeva App Error:", error);
  }, [error]);

  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-bold text-foreground">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-md">
          We apologize for the inconvenience. An unexpected error occurred while processing your request.
        </p>
      </div>
      <Button 
        onClick={() => reset()}
        className="mt-4 bg-saffron hover:bg-saffron/90"
      >
        Try Again
      </Button>
    </div>
  );
}
