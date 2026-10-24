"use client";

import { StarIcon } from "lucide-react";
import { useState } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";

import { submitReview } from "../actions";

type Review = { rating: number; body: string | null; author_name: string };

const RATING_LABELS = ["", "Poor", "Below average", "Good", "Very good", "Excellent"];

// Review a trek after it ends, or edit the review. `review` is the saved one.
export function ReviewForm({
  bookingId,
  organizerName,
  defaultName,
  review,
}: {
  bookingId: string;
  organizerName: string;
  defaultName: string;
  review: Review | null;
}) {
  const [state, onSubmit, pending] = useFormAction(submitReview);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const shown = hovered || rating;
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="booking_id" value={bookingId} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHovered(n)}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="peer sr-only"
                />
                <StarIcon
                  aria-hidden
                  className={cn(
                    "size-7 rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                    n <= shown ? "fill-cta text-cta" : "text-muted-foreground/40",
                  )}
                />
                <span className="sr-only">
                  {n} {n === 1 ? "star" : "stars"}, {RATING_LABELS[n]}
                </span>
              </label>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{RATING_LABELS[shown]}</span>
        </div>
        {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
      </fieldset>

      <FormField
        label="Your review (optional)"
        htmlFor="review-body"
        error={errors.body}
        hint={`What was the trek like? How were the guides, food and stay with ${organizerName}?`}
      >
        <Textarea id="review-body" name="body" rows={4} maxLength={2000} defaultValue={review?.body ?? ""} />
      </FormField>

      <FormField label="Name to show" htmlFor="review-name" error={errors.author_name}>
        <Input
          id="review-name"
          name="author_name"
          maxLength={50}
          defaultValue={review?.author_name ?? defaultName}
          className="max-w-xs"
        />
      </FormField>

      <FormAlert state={state.fieldErrors ? {} : state} success="Thanks! Your review is saved." />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : review ? "Update review" : "Post review"}
      </Button>
    </form>
  );
}
