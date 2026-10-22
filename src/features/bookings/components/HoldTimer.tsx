"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Counts down the seat hold. When it runs out, the page re-renders from the
// server, which then shows the booking as expired.
export function HoldTimer({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const end = Date.parse(expiresAt);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= end) {
        clearInterval(timer);
        router.refresh();
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [end, router]);

  // Nothing until mounted, so server and browser render the same HTML.
  if (now === null) return null;
  const seconds = Math.max(0, Math.ceil((end - now) / 1000));
  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <p className="text-sm text-muted-foreground">
      Seats held for <span className="font-medium text-foreground tabular-nums">{mmss}</span>
    </p>
  );
}
