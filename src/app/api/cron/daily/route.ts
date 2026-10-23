import { timingSafeEqual } from "node:crypto";

import { runDailyJobs } from "@/features/bookings/reminders";

// Daily reminders and review requests. Vercel Cron calls this (vercel.json)
// with "Authorization: Bearer <CRON_SECRET>". Anyone else gets a 401.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await runDailyJobs(new URL(request.url).origin);
    console.info("Daily jobs done:", sent);
    return Response.json(sent);
  } catch (error) {
    console.error("Daily jobs failed:", error);
    return Response.json({ error: "Daily jobs failed" }, { status: 500 });
  }
}
