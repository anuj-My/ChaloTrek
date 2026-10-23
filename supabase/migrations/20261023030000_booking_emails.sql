-- A log of one-off emails sent about a booking (reminders, review requests),
-- so the daily job sends each kind only once per booking. The job claims a
-- row before sending; the unique key stops a second run from sending again.
-- Written and read only by the server with the secret key, so RLS is on with
-- no policies.

create type public.booking_email_kind as enum ('balance_reminder', 'trek_reminder', 'review_request');

create table public.booking_emails (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  kind public.booking_email_kind not null,
  sent_at timestamptz not null default now(),
  primary key (booking_id, kind)
);

alter table public.booking_emails enable row level security;
