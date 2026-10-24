import Link from "next/link";

import { ActionButton } from "@/components/shared/ActionButton";
import { Stars } from "@/components/shared/Stars";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

import { setReviewHidden } from "../actions";
import { listAllReviews } from "../queries";

// Admin: recent reviews, to hide ones that are abusive, fake or off-topic.
export async function AdminReviews() {
  const reviews = await listAllReviews();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="type-2">Reviews</h1>
        <p className="text-muted-foreground">
          Hide reviews that are abusive, fake or not about the trek. Hidden reviews stay visible to their author and
          the organizer.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No reviews yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Trekkers can review once their trek has ended.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars rating={review.rating} />
                  <span className="font-medium">{review.author_name}</span>
                  {review.hidden && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <p className="text-muted-foreground">
                  {review.organizers && review.treks ? (
                    <Link
                      href={`/o/${review.organizers.slug}/${review.treks.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {review.treks.name}
                    </Link>
                  ) : (
                    review.treks?.name
                  )}{" "}
                  · {review.organizers?.name} · {formatDateTime(review.created_at)}
                </p>
                {review.body && <p className="whitespace-pre-line">{review.body}</p>}
              </div>
              <ActionButton
                action={setReviewHidden}
                fields={{ review_id: review.id, hidden: String(!review.hidden) }}
                variant={review.hidden ? "outline" : "ghost"}
              >
                {review.hidden ? "Show" : "Hide"}
              </ActionButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
