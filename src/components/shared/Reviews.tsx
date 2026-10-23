import { formatDate } from "@/lib/format";

import { Stars } from "./Stars";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  body: string | null;
  created_at: string;
  trekName?: string;
};

// "4.8 ★★★★★ · 12 reviews". Renders nothing when there are no reviews.
export function RatingSummary({ average, count }: { average: number | null; count: number }) {
  if (average === null) return null;
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="font-medium">{average.toFixed(1)}</span>
      <Stars rating={average} />
      <span className="text-muted-foreground">
        {count} verified {count === 1 ? "review" : "reviews"}
      </span>
    </span>
  );
}

// Reviews from trekkers who booked and went. The first `visible` are shown,
// the rest behind a "Show all" toggle.
export function ReviewList({ reviews, visible = 5 }: { reviews: Review[]; visible?: number }) {
  const item = (review: Review) => (
    <li key={review.id} className="space-y-1 py-4 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Stars rating={review.rating} />
        <span className="text-sm font-medium">{review.author_name}</span>
        <span className="text-sm text-muted-foreground">
          {review.trekName && `${review.trekName} · `}
          {formatDate(review.created_at.slice(0, 10))}
        </span>
      </div>
      {review.body && <p className="text-sm whitespace-pre-line">{review.body}</p>}
    </li>
  );

  return (
    <div>
      <ul className="divide-y">{reviews.slice(0, visible).map(item)}</ul>
      {reviews.length > visible && (
        <details className="group">
          <summary className="cursor-pointer py-2 text-sm underline underline-offset-4 group-open:hidden">
            Show all {reviews.length} reviews
          </summary>
          <ul className="divide-y border-t pt-4">{reviews.slice(visible).map(item)}</ul>
        </details>
      )}
    </div>
  );
}
