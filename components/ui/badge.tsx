import * as React from "react";
import { cn } from "@/lib/utils/classNames";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" }) {
  const classes = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border bg-background"
  };

  return (
    <span
      className={cn("inline-flex rounded-md px-2 py-1 text-xs font-semibold", classes[variant], className)}
      {...props}
    />
  );
}
