"use client";

import { FormAlert } from "@/components/shared/FormAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/lib/use-form-action";

import { saveGroupLink } from "../actions";

// The batch's WhatsApp group invite link, shown to trekkers once their
// booking is confirmed. Saving an empty field removes it.
export function GroupLinkForm({ batchId, url }: { batchId: string; url: string | null }) {
  const [state, onSubmit, pending] = useFormAction(saveGroupLink);
  const error = state.fieldErrors?.url;

  return (
    <section className="space-y-3 rounded-xl border p-5">
      <div>
        <h2 className="type-4">WhatsApp group</h2>
        <p className="text-sm text-muted-foreground">
          Paste the group&apos;s invite link (in WhatsApp: group info → Invite via link). Trekkers see a Join button on
          their booking and in their confirmation email once their booking is confirmed.
        </p>
      </div>
      {/* Keyed on the saved link so the field shows it cleaned up after saving. */}
      <form key={url ?? ""} onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="batch_id" value={batchId} />
        <Input
          name="url"
          type="url"
          inputMode="url"
          placeholder="https://chat.whatsapp.com/…"
          defaultValue={url ?? ""}
          aria-label="WhatsApp group invite link"
          aria-invalid={!!error}
          className="sm:flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save link"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <FormAlert state={error ? {} : state} success="Link saved." />
    </section>
  );
}
