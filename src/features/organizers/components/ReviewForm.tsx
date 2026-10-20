"use client";

import { FormAlert } from "@/components/shared/FormAlert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/lib/use-form-action";

import { reviewOrganizer } from "../actions";

export function ReviewForm({ organizerId, canApprove }: { organizerId: string; canApprove: boolean }) {
  const [state, onSubmit, pending] = useFormAction(reviewOrganizer);

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="organizer_id" value={organizerId} />
      <Textarea
        name="notes"
        rows={2}
        placeholder="Note for the organizer (required when asking for changes)"
        aria-invalid={!!state.fieldErrors?.notes}
      />
      {state.fieldErrors?.notes && (
        <p className="text-sm text-destructive">{state.fieldErrors.notes}</p>
      )}
      <FormAlert state={state} />
      {!canApprove && (
        <p className="text-sm text-muted-foreground">
          Can&apos;t approve yet: this organizer hasn&apos;t submitted KYC.
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" name="decision" value="approve" size="sm" disabled={pending || !canApprove}>
          Approve
        </Button>
        <Button type="submit" name="decision" value="reject" size="sm" variant="outline" disabled={pending}>
          Ask for changes
        </Button>
      </div>
    </form>
  );
}
