import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// A 1–5 rating as filled stars, rounded to the nearest whole star.
export function Stars({ rating, className }: { rating: number; className?: string }) {
  const filled = Math.round(rating);
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          aria-hidden
          className={cn("size-4", n <= filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}
