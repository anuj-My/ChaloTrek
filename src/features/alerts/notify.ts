import "server-only";

import { sendEmail } from "@/lib/email";
import { formatDateRange, formatRupees, todayInIndia } from "@/lib/format";
import { marketplaceHref } from "@/lib/source-tag";
import { createAdminClient } from "@/lib/supabase/admin";

// Emails everyone following a trek, or its destination, about its open
// upcoming batches they haven't been told about yet. Call through after()
// when batches are added or a trek is published. Each person gets one email,
// however many batches or alerts it covers. Reads with the admin client,
// since the organizer can't read trekkers' alerts.
export async function notifyNewBatches(trekId: string, origin: string) {
  try {
    const admin = createAdminClient();
    const { data: trek, error } = await admin
      .from("treks")
      .select(
        `id, name, slug, status, destination_id, destinations(name),
         organizers!inner(name, slug, kyc_status, owner_user_id),
         batches(id, start_date, end_date, price_paise, status)`,
      )
      .eq("id", trekId)
      .single();
    if (error) throw error;
    const organizer = trek.organizers;
    if (trek.status !== "published" || organizer.kyc_status !== "approved") return;

    const today = todayInIndia();
    const batches = trek.batches
      .filter((b) => b.status === "open" && b.start_date > today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (!batches.length) return;

    const following = trek.destination_id
      ? `trek_id.eq.${trek.id},destination_id.eq.${trek.destination_id}`
      : `trek_id.eq.${trek.id}`;
    const { data: alerts, error: alertsError } = await admin
      .from("batch_alerts")
      .select("id, user_id, email, trek_id, batch_alert_emails(batch_id)")
      .or(following)
      .neq("user_id", organizer.owner_user_id);
    if (alertsError) throw alertsError;

    // Per person: the batches none of their alerts has announced yet.
    const byUser = new Map<string, { email: string; alertIds: string[]; sent: Set<string>; viaDestination: boolean }>();
    for (const alert of alerts) {
      const entry = byUser.get(alert.user_id) ?? {
        email: alert.email,
        alertIds: [],
        sent: new Set<string>(),
        viaDestination: true,
      };
      entry.alertIds.push(alert.id);
      for (const e of alert.batch_alert_emails) entry.sent.add(e.batch_id);
      if (alert.trek_id) entry.viaDestination = false;
      byUser.set(alert.user_id, entry);
    }

    const trekUrl = `${origin}${marketplaceHref(`/o/${organizer.slug}/${trek.slug}`)}`;
    // One at a time, to stay inside the email provider's rate limit.
    for (const entry of byUser.values()) {
      const fresh = batches.filter((b) => !entry.sent.has(b.id));
      if (!fresh.length) continue;

      const following = entry.viaDestination && trek.destinations ? trek.destinations.name : trek.name;
      await sendEmail({
        to: entry.email,
        subject: `New ${trek.name} ${fresh.length === 1 ? "batch" : "batches"} by ${organizer.name}`,
        content: {
          heading: `New ${fresh.length === 1 ? "batch" : "batches"} on ${trek.name}`,
          paragraphs: [
            `${organizer.name} just opened ${fresh.length === 1 ? "a new batch" : `${fresh.length} new batches`}. You asked to hear about new batches for ${following}.`,
            "Seats go to whoever books first.",
          ],
          rows: fresh
            .slice(0, 10)
            .map((b) => [formatDateRange(b.start_date, b.end_date), `${formatRupees(b.price_paise)} per person`]),
          buttons: [
            { label: "See batches", url: trekUrl },
            { label: "Manage alerts", url: `${origin}/my-bookings/alerts` },
          ],
        },
      });

      // Every alert of theirs counts these batches as announced.
      const { error: logError } = await admin.from("batch_alert_emails").upsert(
        entry.alertIds.flatMap((alert_id) => fresh.map((b) => ({ alert_id, batch_id: b.id }))),
        { onConflict: "alert_id,batch_id", ignoreDuplicates: true },
      );
      if (logError) throw logError;
    }
  } catch (error) {
    console.error(`notifyNewBatches failed for trek ${trekId}:`, error);
  }
}
