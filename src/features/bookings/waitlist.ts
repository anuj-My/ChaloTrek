import "server-only";

import { sendEmail } from "@/lib/email";
import { formatDateRange, todayInIndia } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

// Someone who was emailed isn't emailed again for the same batch for this
// long, so a batch whose seats keep changing doesn't flood their inbox.
const RENOTIFY_AFTER_MS = 6 * 60 * 60 * 1000;

// Emails everyone on the batch's waitlist whose group fits in the seats left.
// Call through after() whenever seats may have freed up: a cancellation,
// more seats, or a batch reopening. Reads with the admin client, since the
// person whose action freed the seats can't read the waitlist.
export async function notifyWaitlist(batchId: string, origin: string) {
  try {
    const admin = createAdminClient();
    const { data: batch, error } = await admin
      .from("batches")
      .select("id, start_date, end_date, status, seats_left, treks!inner(name, slug, organizers!inner(name, slug))")
      .eq("id", batchId)
      .single();
    if (error) throw error;
    const seatsLeft = batch.seats_left ?? 0;
    if (batch.status !== "open" || seatsLeft === 0 || batch.start_date <= todayInIndia()) return;

    const notifiedBefore = new Date(Date.now() - RENOTIFY_AFTER_MS).toISOString();
    const { data: entries, error: entriesError } = await admin
      .from("waitlist_entries")
      .select("id, email, num_people")
      .eq("batch_id", batchId)
      .lte("num_people", seatsLeft)
      .or(`notified_at.is.null,notified_at.lt.${notifiedBefore}`)
      .order("created_at");
    if (entriesError) throw entriesError;
    if (entries.length === 0) return;

    const trek = batch.treks;
    const dates = formatDateRange(batch.start_date, batch.end_date);
    const bookUrl = `${origin}/o/${trek.organizers.slug}/${trek.slug}/book/${batch.id}`;
    const seats = `${seatsLeft} ${seatsLeft === 1 ? "seat" : "seats"}`;

    await Promise.all(
      entries.map((entry) =>
        sendEmail({
          to: entry.email,
          subject: `Seats open on ${trek.name}, ${dates}`,
          content: {
            heading: `${seats} opened up on ${trek.name}`,
            paragraphs: [
              `You're on the waitlist for ${trek.organizers.name}'s ${dates} batch, and ${seats} just became free.`,
              "Everyone on the waitlist whose group fits gets this email, so the seats go to whoever books first.",
            ],
            buttons: [{ label: "Book now", url: bookUrl }],
          },
        }),
      ),
    );

    const { error: updateError } = await admin
      .from("waitlist_entries")
      .update({ notified_at: new Date().toISOString() })
      .in(
        "id",
        entries.map((e) => e.id),
      );
    if (updateError) throw updateError;
  } catch (error) {
    console.error(`notifyWaitlist failed for batch ${batchId}:`, error);
  }
}
