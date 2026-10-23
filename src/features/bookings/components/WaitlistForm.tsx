"use client";

import { FormAlert } from "@/components/shared/FormAlert";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/lib/use-form-action";

import { joinWaitlist } from "../actions";
import { MAX_PEOPLE_PER_BOOKING } from "../schema";

// Join a full batch's waitlist, or change the group size when already on it.
export function WaitlistForm({ batchId, numPeople }: { batchId: string; numPeople?: number }) {
  const [state, onSubmit, pending] = useFormAction(joinWaitlist);
  const joined = numPeople !== undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="batch_id" value={batchId} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <label htmlFor="waitlist-people" className="text-sm">
          People
        </label>
        <select
          id="waitlist-people"
          name="num_people"
          defaultValue={numPeople ?? 1}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          {Array.from({ length: MAX_PEOPLE_PER_BOOKING }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <Button type="submit" variant={joined ? "outline" : "default"} disabled={pending}>
          {pending ? "Saving…" : joined ? "Update" : "Join the waitlist"}
        </Button>
      </div>
      <FormAlert state={state} />
    </form>
  );
}
