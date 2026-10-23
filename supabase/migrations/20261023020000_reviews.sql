-- Verified reviews: only a trekker with a confirmed booking can review, once
-- the trek has ended, and only once per booking (they can edit it later).
-- Reviews are written only through submit_review(), which checks all that
-- and fills in the trek and organizer from the booking.
-- Admins can hide a review; hidden reviews stay visible to their author,
-- the organizer and admins, but not the public.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  trek_id uuid not null references public.treks (id) on delete cascade,
  organizer_id uuid not null references public.organizers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 50),
  rating smallint not null check (rating between 1 and 5),
  body text check (char_length(body) <= 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_trek_id_created_at_idx on public.reviews (trek_id, created_at desc);
create index reviews_organizer_id_created_at_idx on public.reviews (organizer_id, created_at desc);

create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

create function public.submit_review(
  p_booking_id uuid,
  p_rating smallint,
  p_body text,
  p_author_name text
)
returns public.reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_batch public.batches;
  v_trek public.treks;
  v_review public.reviews;
begin
  select * into v_booking from public.bookings
  where id = p_booking_id and user_id = (select auth.uid());
  if not found then
    raise exception 'Booking not found';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'Only confirmed bookings can be reviewed';
  end if;

  select * into v_batch from public.batches where id = v_booking.batch_id;
  if v_batch.end_date >= (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'You can review once the trek has ended';
  end if;
  select * into v_trek from public.treks where id = v_batch.trek_id;

  insert into public.reviews (booking_id, trek_id, organizer_id, user_id, author_name, rating, body)
  values (v_booking.id, v_trek.id, v_trek.organizer_id, v_booking.user_id,
          trim(p_author_name), p_rating, nullif(trim(p_body), ''))
  on conflict (booking_id) do update
    set author_name = excluded.author_name,
        rating = excluded.rating,
        body = excluded.body
  returning * into v_review;

  return v_review;
end;
$$;

revoke execute on function public.submit_review(uuid, smallint, text, text) from public, anon;
grant execute on function public.submit_review(uuid, smallint, text, text) to authenticated;

alter table public.reviews enable row level security;

create policy "Anyone reads visible reviews of public treks" on public.reviews
  for select to anon, authenticated
  using (
    (not hidden and public.trek_is_public(trek_id))
    or user_id = (select auth.uid())
    or public.owns_organizer(organizer_id)
    or public.is_admin()
  );
-- Only admins update directly, to hide or show a review.
create policy "Admins update reviews" on public.reviews
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
