-- "Notify me about new batches": a logged-in trekker follows one
-- organizer's trek, or a destination (every organizer's Kedarkantha). When a
-- new batch goes up, or a trek with upcoming batches is published, they get
-- an email listing the new dates.
--
-- Alerts are emailed to the address the trekker logs in with, so nobody can
-- sign someone else up. batch_alert_emails remembers which batches each
-- alert was already emailed about, so no batch is announced twice.

create table public.batch_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  trek_id uuid references public.treks (id) on delete cascade,
  destination_id uuid references public.destinations (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((trek_id is null) <> (destination_id is null))
);

create unique index batch_alerts_user_trek_idx on public.batch_alerts (user_id, trek_id)
  where trek_id is not null;
create unique index batch_alerts_user_destination_idx on public.batch_alerts (user_id, destination_id)
  where destination_id is not null;
create index batch_alerts_trek_id_idx on public.batch_alerts (trek_id);
create index batch_alerts_destination_id_idx on public.batch_alerts (destination_id);

alter table public.batch_alerts enable row level security;

create policy "Trekkers read their alerts" on public.batch_alerts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Trekkers create alerts for themselves" on public.batch_alerts
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and email = (select auth.jwt() ->> 'email')
    and (trek_id is null or public.trek_is_public(trek_id))
  );
create policy "Trekkers remove their alerts" on public.batch_alerts
  for delete to authenticated using (user_id = (select auth.uid()));

-- Written and read only by the server with the secret key.
create table public.batch_alert_emails (
  alert_id uuid not null references public.batch_alerts (id) on delete cascade,
  batch_id uuid not null references public.batches (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (alert_id, batch_id)
);

alter table public.batch_alert_emails enable row level security;

-- Batches already public when someone follows count as announced, so the
-- first email is only about batches added after that.
create function public.seed_batch_alert_emails()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.batch_alert_emails (alert_id, batch_id)
  select new.id, ba.id
  from public.batches ba
  join public.treks t on t.id = ba.trek_id
  where (t.id = new.trek_id or t.destination_id = new.destination_id)
    and public.trek_is_public(t.id);
  return new;
end;
$$;

revoke execute on function public.seed_batch_alert_emails() from public, anon, authenticated;

create trigger batch_alerts_seed_emails after insert on public.batch_alerts
  for each row execute function public.seed_batch_alert_emails();
