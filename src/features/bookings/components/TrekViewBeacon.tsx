"use client";

import { useEffect } from "react";

import { recordTrekView } from "../actions";

// Counts one view of a trek page per browser session. Runs in the browser,
// so most bots and link previews aren't counted.
export function TrekViewBeacon({ trekId }: { trekId: string }) {
  useEffect(() => {
    const key = `viewed:${trekId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked (private mode): count it anyway.
    }
    void recordTrekView(trekId);
  }, [trekId]);

  return null;
}
