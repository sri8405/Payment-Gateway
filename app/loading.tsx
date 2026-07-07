import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-saffron animate-pulse-glow">
      <Loader2 className="h-12 w-12 animate-spin text-saffron" />
      <p className="font-serif text-lg text-foreground animate-pulse">Loading GuruSeva...</p>
    </div>
  );
}
