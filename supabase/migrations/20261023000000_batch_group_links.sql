-- A WhatsApp group invite link per batch, shown to trekkers once their
-- booking is confirmed. Anyone can read batches of public treks, so the link
-- lives in its own table: the organizer manages it, and only trekkers with a
-- confirmed booking on the batch can read it.

create table public.batch_group_links (
  batch_id uuid primary key references public.batches (id) on delete cascade,
  url text not null check (url ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]{10,40}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger batch_group_links_updated_at before update on public.batch_group_links
  for each row execute function public.set_updated_at();

-- True when the current user is the organizer running this batch's trek.
create function public.owns_batch(b_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.batches ba
    join public.treks t on t.id = ba.trek_id
    join public.organizers o on o.id = t.organizer_id
    where ba.id = b_id and o.owner_user_id = (select auth.uid())
  );
$$;

-- True when the current user has a confirmed booking on this batch.
create function public.has_confirmed_booking(b_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings
    where batch_id = b_id and user_id = (select auth.uid()) and status = 'confirmed'
  );
$$;

revoke execute on function public.owns_batch(uuid) from public, anon;
revoke execute on function public.has_confirmed_booking(uuid) from public, anon;
grant execute on function public.owns_batch(uuid) to authenticated;
grant execute on function public.has_confirmed_booking(uuid) to authenticated;

alter table public.batch_group_links enable row level security;

create policy "Organizers, confirmed trekkers and admins read group links" on public.batch_group_links
  for select to authenticated
  using (public.owns_batch(batch_id) or public.has_confirmed_booking(batch_id) or public.is_admin());
create policy "Owners add group links" on public.batch_group_links
  for insert to authenticated with check (public.owns_batch(batch_id));
create policy "Owners update group links" on public.batch_group_links
  for update to authenticated
  using (public.owns_batch(batch_id))
  with check (public.owns_batch(batch_id));
create policy "Owners remove group links" on public.batch_group_links
  for delete to authenticated using (public.owns_batch(batch_id));
