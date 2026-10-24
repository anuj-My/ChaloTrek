"use client";

import { startTransition, useActionState, useState } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resizeImage } from "@/lib/resize-image";
import { createClient } from "@/lib/supabase/client";

import { submitPaymentProof } from "../actions";
import { PAYMENT_PROOFS_BUCKET } from "../upi";

type Props = { bookingId: string; amountPaise: number; maxPaise: number };

// Amount, UTR and an optional screenshot. The screenshot goes straight from
// the browser to private storage (only this booking's folder is allowed),
// then the Server Action records the proof with its path.
export function PaymentProofForm({ bookingId, amountPaise, maxPaise }: Props) {
  const [state, formAction, pending] = useActionState(submitPaymentProof, {});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const errors = state.fieldErrors ?? {};
  const busy = uploading || pending;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);
    const formData = new FormData(event.currentTarget);
    const file = formData.get("screenshot");
    formData.delete("screenshot");

    if (file instanceof File && file.size > 0) {
      setUploading(true);
      try {
        const blob = await resizeImage(file);
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        const path = `${bookingId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await createClient()
          .storage.from(PAYMENT_PROOFS_BUCKET)
          .upload(path, blob, { contentType: blob.type });
        if (error) throw error;
        formData.set("screenshot_path", path);
      } catch (error) {
        console.error("Payment screenshot upload failed:", error);
        setUploadError("Couldn't upload the screenshot. Try again, or send just the transaction ID.");
        return;
      } finally {
        setUploading(false);
      }
    }
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Amount paid (₹)" htmlFor="proof-amount" error={errors.amount}>
          <Input
            id="proof-amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={maxPaise / 100}
            defaultValue={amountPaise / 100}
            required
            aria-invalid={!!errors.amount}
          />
        </FormField>
        <FormField
          label="UPI transaction ID"
          htmlFor="proof-utr"
          error={errors.utr}
          hint="The 12-digit UTR or reference number"
        >
          <Input
            id="proof-utr"
            name="utr"
            autoComplete="off"
            placeholder="412345678901"
            required
            aria-invalid={!!errors.utr}
          />
        </FormField>
      </div>
      <FormField label="Payment screenshot" htmlFor="proof-screenshot" hint="Optional, but helps the organizer find it">
        <Input
          id="proof-screenshot"
          name="screenshot"
          type="file"
          // No HEIC here: leaving it out makes iPhones convert to JPEG.
          accept="image/jpeg,image/png,image/webp"
        />
      </FormField>
      {uploadError ? (
        <p role="alert" className="text-sm text-destructive">
          {uploadError}
        </p>
      ) : (
        <FormAlert state={state.fieldErrors ? {} : state} />
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {uploading ? "Uploading screenshot…" : pending ? "Sending…" : "I've paid, send details"}
      </Button>
    </form>
  );
}
