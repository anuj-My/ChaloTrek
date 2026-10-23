-- Waitlist for full batches. Trekkers join with how many people they want to
-- book for; when seats free up, the server emails everyone whose group fits
-- (first come, first served) and records notified_at.
--
-- The email must be the one the trekker logs in with, so the list can't be
-- used to send emails to someone else. The organizer can see and remove
-- entries on their batches.

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  num_people smallint not null check (num_people between 1 and 20),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (batch_id, user_id)
);

create index waitlist_entries_batch_id_created_at_idx on public.waitlist_entries (batch_id, created_at);

alter table public.waitlist_entries enable row level security;

create policy "Trekkers, organizers and admins read waitlist entries" on public.waitlist_entries
  for select to authenticated
  using (user_id = (select auth.uid()) or public.owns_batch(batch_id) or public.is_admin());
create policy "Trekkers join waitlists of open public batches" on public.waitlist_entries
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and email = (select auth.jwt() ->> 'email')
    and exists (
      select 1 from public.batches b
      where b.id = batch_id and b.status = 'open' and public.trek_is_public(b.trek_id)
    )
  );
create policy "Trekkers update their waitlist entries" on public.waitlist_entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and email = (select auth.jwt() ->> 'email'));
create policy "Trekkers and organizers remove waitlist entries" on public.waitlist_entries
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.owns_batch(batch_id));
