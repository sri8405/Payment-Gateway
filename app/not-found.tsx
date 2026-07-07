import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="font-serif text-6xl font-bold text-copper">404</h1>
        <h2 className="font-serif text-2xl font-bold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link href="/">
        <Button className="bg-saffron hover:bg-saffron/90 text-white rounded-full px-8 py-6 text-lg shadow-lg">
          Return to Temple
        </Button>
      </Link>
    </div>
  );
}
