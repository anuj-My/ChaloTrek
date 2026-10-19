-- Chalo Trek: initial schema (Phase 2 MVP).
--
-- Conventions
--   * Money is stored as integer paise (₹1 = 100 paise), the unit Razorpay uses.
--   * Every table has row-level security on. Anything without a policy is
--     reachable only by the service-role key (webhooks, admin scripts).
--   * Seats are not stored as a counter. Seats taken = confirmed bookings plus
--     pending bookings whose 10-minute hold hasn't expired, so an abandoned
--     checkout frees its seats on its own.

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type public.kyc_status as enum ('pending', 'approved', 'rejected');
create type public.trek_difficulty as enum ('easy', 'moderate', 'difficult', 'challenging');
create type public.trek_status as enum ('draft', 'published', 'archived');
create type public.batch_status as enum ('open', 'closed', 'cancelled');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'expired', 'refunded');
create type public.booking_source as enum ('organizer_link', 'marketplace');
create type public.payment_kind as enum ('full', 'deposit', 'balance');
create type public.payment_status as enum ('created', 'paid', 'failed', 'refunded');
create type public.refund_status as enum ('requested', 'processed', 'failed');
create type public.gender as enum ('male', 'female', 'other');

-- ─── Shared helpers ─────────────────────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Users ──────────────────────────────────────────────────────────────────

-- One row per auth user, created by the trigger below on sign-up.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Platform admins. No policies, so it can only be changed from the SQL editor
-- or with the service-role key, never from the app.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- True when the request comes from the app (anon or logged-in user) rather
-- than the service-role key or the SQL editor.
create function public.is_app_user()
returns boolean
language sql
stable
as $$
  select current_user in ('anon', 'authenticated');
$$;

-- ─── Organizers ─────────────────────────────────────────────────────────────

-- Public profile of a trek company. Shown on booking pages once approved.
create table public.organizers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  bio text,
  logo_url text,
  instagram_handle text,
  phone text,
  email text,
  kyc_status public.kyc_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizers_updated_at before update on public.organizers
  for each row execute function public.set_updated_at();

-- Private KYC and payout details. Only the owner and admins can read these.
create table public.organizer_kyc (
  organizer_id uuid primary key references public.organizers (id) on delete cascade,
  legal_name text,
  pan text check (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  gstin text check (gstin ~ '^[0-9]{2}[A-Z0-9]{13}$'),
  tourism_reg_no text,
  razorpay_account_id text,
  review_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizer_kyc_updated_at before update on public.organizer_kyc
  for each row execute function public.set_updated_at();

create function public.owns_organizer(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizers
    where id = org_id and owner_user_id = (select auth.uid())
  );
$$;

-- Organizers can't approve themselves or link their own payout account.
create function public.protect_organizer_fields()
returns trigger
language plpgsql
as $$
begin
  if public.is_app_user() and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.kyc_status = 'pending';
    elsif new.kyc_status is distinct from old.kyc_status
       or new.owner_user_id is distinct from old.owner_user_id then
      raise exception 'Only an admin can change kyc_status or owner_user_id';
    end if;
  end if;
  return new;
end;
$$;

create trigger organizers_protect before insert or update on public.organizers
  for each row execute function public.protect_organizer_fields();

create function public.protect_organizer_kyc_fields()
returns trigger
language plpgsql
as $$
begin
  if public.is_app_user() and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.razorpay_account_id = null;
      new.review_notes = null;
      new.reviewed_at = null;
    elsif new.razorpay_account_id is distinct from old.razorpay_account_id
       or new.review_notes is distinct from old.review_notes
       or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'Only an admin can change payout or review fields';
    end if;
  end if;
  return new;
end;
$$;

create trigger organizer_kyc_protect before insert or update on public.organizer_kyc
  for each row execute function public.protect_organizer_kyc_fields();

-- ─── Treks and batches ──────────────────────────────────────────────────────

-- The three standard templates organizers pick from. `rules` holds the refund
-- tiers, e.g. [{"days_before": 30, "refund_percent": 90}, ...].
create table public.cancellation_policies (
  id smallint primary key,
  name text not null unique,
  description text not null,
  rules jsonb not null
);

insert into public.cancellation_policies (id, name, description, rules) values
  (1, 'Flexible',
   'Full refund up to 15 days before departure, 50% up to 7 days before.',
   '[{"days_before": 15, "refund_percent": 100}, {"days_before": 7, "refund_percent": 50}]'),
  (2, 'Moderate',
   '75% refund up to 30 days before departure, 50% up to 15 days before.',
   '[{"days_before": 30, "refund_percent": 75}, {"days_before": 15, "refund_percent": 50}]'),
  (3, 'Strict',
   '50% refund up to 30 days before departure, no refund after that.',
   '[{"days_before": 30, "refund_percent": 50}]');

create table public.treks (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  region text not null,
  difficulty public.trek_difficulty not null,
  duration_days smallint not null check (duration_days between 1 and 60),
  max_altitude_m integer check (max_altitude_m > 0),
  summary text,
  -- [{"day": 1, "title": "...", "description": "..."}, ...]
  itinerary jsonb not null default '[]',
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  photos text[] not null default '{}',
  cancellation_policy_id smallint not null references public.cancellation_policies (id),
  status public.trek_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizer_id, slug)
);

create index treks_organizer_id_idx on public.treks (organizer_id);

create trigger treks_updated_at before update on public.treks
  for each row execute function public.set_updated_at();

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  trek_id uuid not null references public.treks (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  price_paise integer not null check (price_paise > 0),
  -- Per person. Null means the full price is paid upfront.
  deposit_paise integer check (deposit_paise > 0),
  total_seats smallint not null check (total_seats > 0),
  status public.batch_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (deposit_paise is null or deposit_paise < price_paise)
);

create index batches_trek_id_start_date_idx on public.batches (trek_id, start_date);

create trigger batches_updated_at before update on public.batches
  for each row execute function public.set_updated_at();

-- True when a trek is visible to the public: published, by an approved organizer.
create function public.trek_is_public(t_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.treks t
    join public.organizers o on o.id = t.organizer_id
    where t.id = t_id and t.status = 'published' and o.kyc_status = 'approved'
  );
$$;

create function public.owns_trek(t_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.treks t
    join public.organizers o on o.id = t.organizer_id
    where t.id = t_id and o.owner_user_id = (select auth.uid())
  );
$$;

-- ─── Bookings ───────────────────────────────────────────────────────────────

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  -- Short number shown to people as the booking ID, e.g. CT-10001.
  booking_number bigint generated always as identity (start with 10001) unique,
  batch_id uuid not null references public.batches (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  num_people smallint not null check (num_people between 1 and 20),
  total_paise integer not null check (total_paise > 0),
  paid_paise integer not null default 0 check (paid_paise >= 0),
  status public.booking_status not null default 'pending',
  source public.booking_source not null default 'organizer_link',
  -- Seats stay reserved for a pending booking until this time.
  hold_expires_at timestamptz,
  contact_email text not null,
  contact_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_batch_id_status_idx on public.bookings (batch_id, status);
create index bookings_user_id_idx on public.bookings (user_id);

create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create function public.seats_taken(b_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(num_people), 0)::integer
  from public.bookings
  where batch_id = b_id
    and (status = 'confirmed' or (status = 'pending' and hold_expires_at > now()));
$$;

-- Computed column: `select=*,seats_left` on batches returns this per row.
create function public.seats_left(b public.batches)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(b.total_seats - public.seats_taken(b.id), 0);
$$;

create function public.owns_booking(bk_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings where id = bk_id and user_id = (select auth.uid())
  );
$$;

-- True when the current user is the organizer running this booking's trek.
create function public.organizes_booking(bk_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings bk
    join public.batches ba on ba.id = bk.batch_id
    join public.treks t on t.id = ba.trek_id
    join public.organizers o on o.id = t.organizer_id
    where bk.id = bk_id and o.owner_user_id = (select auth.uid())
  );
$$;

-- Reserves seats for 10 minutes and creates a pending booking. The batch row
-- is locked so two people can't both take the last seat. The Razorpay webhook
-- later marks the booking confirmed.
create function public.create_booking(
  p_batch_id uuid,
  p_num_people smallint,
  p_contact_email text,
  p_contact_phone text,
  p_source public.booking_source default 'organizer_link'
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_batch public.batches;
  v_booking public.bookings;
begin
  if v_user_id is null then
    raise exception 'You must be logged in to book';
  end if;

  select * into v_batch from public.batches where id = p_batch_id for update;

  if not found or not public.trek_is_public(v_batch.trek_id) then
    raise exception 'Batch not found';
  end if;
  if v_batch.status <> 'open' or v_batch.start_date <= current_date then
    raise exception 'This batch is not taking bookings';
  end if;
  if public.seats_taken(p_batch_id) + p_num_people > v_batch.total_seats then
    raise exception 'Not enough seats left';
  end if;

  insert into public.bookings (
    batch_id, user_id, num_people, total_paise, source,
    hold_expires_at, contact_email, contact_phone
  ) values (
    p_batch_id, v_user_id, p_num_people, v_batch.price_paise * p_num_people, p_source,
    now() + interval '10 minutes', p_contact_email, p_contact_phone
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  full_name text not null,
  age smallint not null check (age between 1 and 100),
  gender public.gender not null,
  phone text,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  medical_notes text,
  -- Path in the private `id-proofs` storage bucket.
  id_proof_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index participants_booking_id_idx on public.participants (booking_id);

create trigger participants_updated_at before update on public.participants
  for each row execute function public.set_updated_at();

-- ─── Payments and refunds ───────────────────────────────────────────────────

-- Written only by server code with the service-role key.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete restrict,
  kind public.payment_kind not null,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  amount_paise integer not null check (amount_paise > 0),
  platform_fee_paise integer not null default 0 check (platform_fee_paise >= 0),
  status public.payment_status not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_booking_id_idx on public.payments (booking_id);

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete restrict,
  razorpay_refund_id text unique,
  amount_paise integer not null check (amount_paise > 0),
  reason text not null,
  status public.refund_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index refunds_payment_id_idx on public.refunds (payment_id);

create trigger refunds_updated_at before update on public.refunds
  for each row execute function public.set_updated_at();

-- ─── Row-level security ─────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.organizers enable row level security;
alter table public.organizer_kyc enable row level security;
alter table public.cancellation_policies enable row level security;
alter table public.treks enable row level security;
alter table public.batches enable row level security;
alter table public.bookings enable row level security;
alter table public.participants enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;

-- profiles
create policy "Users read their own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "Users update their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid()));

-- organizers
create policy "Anyone reads approved organizers" on public.organizers
  for select to anon, authenticated
  using (kyc_status = 'approved' or owner_user_id = (select auth.uid()) or public.is_admin());
create policy "Users create their own organizer" on public.organizers
  for insert to authenticated with check (owner_user_id = (select auth.uid()));
create policy "Owners and admins update organizers" on public.organizers
  for update to authenticated
  using (owner_user_id = (select auth.uid()) or public.is_admin());

-- organizer_kyc
create policy "Owners and admins read KYC" on public.organizer_kyc
  for select to authenticated
  using (public.owns_organizer(organizer_id) or public.is_admin());
create policy "Owners submit KYC" on public.organizer_kyc
  for insert to authenticated with check (public.owns_organizer(organizer_id));
create policy "Owners and admins update KYC" on public.organizer_kyc
  for update to authenticated
  using (public.owns_organizer(organizer_id) or public.is_admin());

-- cancellation_policies
create policy "Anyone reads cancellation policies" on public.cancellation_policies
  for select to anon, authenticated using (true);

-- treks
create policy "Anyone reads public treks" on public.treks
  for select to anon, authenticated
  using (public.trek_is_public(id) or public.owns_organizer(organizer_id) or public.is_admin());
create policy "Owners create treks" on public.treks
  for insert to authenticated with check (public.owns_organizer(organizer_id));
create policy "Owners update treks" on public.treks
  for update to authenticated
  using (public.owns_organizer(organizer_id))
  with check (public.owns_organizer(organizer_id));
create policy "Owners delete treks" on public.treks
  for delete to authenticated using (public.owns_organizer(organizer_id));

-- batches
create policy "Anyone reads batches of public treks" on public.batches
  for select to anon, authenticated
  using (public.trek_is_public(trek_id) or public.owns_trek(trek_id) or public.is_admin());
create policy "Owners create batches" on public.batches
  for insert to authenticated with check (public.owns_trek(trek_id));
create policy "Owners update batches" on public.batches
  for update to authenticated
  using (public.owns_trek(trek_id))
  with check (public.owns_trek(trek_id));
create policy "Owners delete batches" on public.batches
  for delete to authenticated using (public.owns_trek(trek_id));

-- bookings: created only through create_booking(), updated only by the server.
create policy "Trekkers, organizers and admins read bookings" on public.bookings
  for select to authenticated
  using (user_id = (select auth.uid()) or public.organizes_booking(id) or public.is_admin());

-- participants
create policy "Trekkers, organizers and admins read participants" on public.participants
  for select to authenticated
  using (public.owns_booking(booking_id) or public.organizes_booking(booking_id) or public.is_admin());
create policy "Trekkers add participants to their bookings" on public.participants
  for insert to authenticated with check (public.owns_booking(booking_id));
create policy "Trekkers update their participants" on public.participants
  for update to authenticated
  using (public.owns_booking(booking_id))
  with check (public.owns_booking(booking_id));

-- payments
create policy "Trekkers, organizers and admins read payments" on public.payments
  for select to authenticated
  using (public.owns_booking(booking_id) or public.organizes_booking(booking_id) or public.is_admin());

-- refunds
create policy "Trekkers, organizers and admins read refunds" on public.refunds
  for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and (public.owns_booking(p.booking_id) or public.organizes_booking(p.booking_id))
    )
    or public.is_admin()
  );

-- ─── Function permissions ───────────────────────────────────────────────────

-- Postgres lets everyone execute new functions by default. Only create_booking
-- and seats_left are meant to be called from the app.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.create_booking(uuid, smallint, text, text, public.booking_source) to authenticated;
grant execute on function public.seats_left(public.batches) to anon, authenticated;
-- RLS policies and triggers call these as the requesting user.
grant execute on function
  public.is_admin(),
  public.is_app_user(),
  public.owns_organizer(uuid),
  public.owns_trek(uuid),
  public.trek_is_public(uuid),
  public.owns_booking(uuid),
  public.organizes_booking(uuid)
to anon, authenticated;
