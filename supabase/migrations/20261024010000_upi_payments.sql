-- Paying the organizer by UPI, until online payment (Razorpay) is live.
--
--   * organizers.upi_id is shown on the trekker's booking page, with a QR
--     code and an "open UPI app" link. Public, like the rest of the profile.
--   * After paying, the trekker sends a payment proof: the amount, the UPI
--     transaction ID (UTR) and optionally a screenshot. Sending one keeps the
--     seats held for 24 hours while the organizer checks their bank.
--   * The organizer accepts it, which records the money through
--     record_offline_payment() and confirms the booking, or rejects it with a
--     reason, which gives the trekker an hour to send a corrected one.
-- Proofs also work for the balance on a confirmed booking.
--
-- Screenshots go in the private payment-proofs bucket at
--   <booking_id>/<random>.webp
-- readable only by the trekker, the trek's organizer and admins.

alter table public.organizers
  add column upi_id text check (upi_id ~ '^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9]{1,63}$');

create type public.payment_proof_status as enum ('submitted', 'accepted', 'rejected');

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  amount_paise integer not null check (amount_paise > 0),
  utr text not null check (utr ~ '^[A-Za-z0-9]{6,35}$'),
  screenshot_path text,
  status public.payment_proof_status not null default 'submitted',
  reject_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index payment_proofs_booking_id_idx on public.payment_proofs (booking_id);
-- One proof waiting to be checked per booking at a time.
create unique index payment_proofs_one_submitted_idx on public.payment_proofs (booking_id)
  where status = 'submitted';

-- Written only through the functions below.
alter table public.payment_proofs enable row level security;

create policy "Trekkers, organizers and admins read payment proofs" on public.payment_proofs
  for select to authenticated
  using (public.owns_booking(booking_id) or public.organizes_booking(booking_id) or public.is_admin());

-- Trekker sends proof of a UPI payment for their booking.
create function public.submit_payment_proof(
  p_booking_id uuid,
  p_amount_paise integer,
  p_utr text,
  p_screenshot_path text default null
)
returns public.payment_proofs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_batch public.batches;
  v_proof public.payment_proofs;
begin
  if not public.owns_booking(p_booking_id) then
    raise exception 'Booking not found';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  -- Lock the batch, as book_batch does, so seats are counted one at a time.
  select * into v_batch from public.batches where id = v_booking.batch_id for update;
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'This booking is not active';
  end if;
  if v_batch.status = 'cancelled' then
    raise exception 'This batch was cancelled';
  end if;
  if p_amount_paise < 1 or p_amount_paise > v_booking.total_paise - v_booking.paid_paise then
    raise exception 'Amount must be between 1 and what is still due';
  end if;
  if p_screenshot_path is not null and p_screenshot_path not like p_booking_id::text || '/%' then
    raise exception 'Invalid screenshot';
  end if;
  if exists (
    select 1 from public.payment_proofs where booking_id = p_booking_id and status = 'submitted'
  ) then
    raise exception 'A payment is already waiting for the organizer to check';
  end if;

  if v_booking.status = 'pending' then
    -- A hold that ran out can be picked up again only while seats are free.
    if v_booking.hold_expires_at <= now()
       and public.seats_taken(v_batch.id) + v_booking.num_people > v_batch.total_seats then
      raise exception 'Not enough seats left';
    end if;
    update public.bookings
    set hold_expires_at = greatest(hold_expires_at, now() + interval '24 hours')
    where id = p_booking_id;
  end if;

  insert into public.payment_proofs (booking_id, amount_paise, utr, screenshot_path)
  values (p_booking_id, p_amount_paise, upper(p_utr), p_screenshot_path)
  returning * into v_proof;

  return v_proof;
end;
$$;

revoke execute on function public.submit_payment_proof(uuid, integer, text, text) from public, anon;
grant execute on function public.submit_payment_proof(uuid, integer, text, text) to authenticated;

-- Organizer accepts or rejects a payment proof on their trek.
create function public.review_payment_proof(p_proof_id uuid, p_accept boolean, p_reason text default null)
returns public.payment_proofs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proof public.payment_proofs;
  v_booking public.bookings;
begin
  select * into v_proof from public.payment_proofs where id = p_proof_id for update;
  if not found or not public.organizes_booking(v_proof.booking_id) then
    raise exception 'Payment not found';
  end if;
  if v_proof.status <> 'submitted' then
    raise exception 'This payment was already checked';
  end if;

  if p_accept then
    select * into v_booking from public.bookings where id = v_proof.booking_id;
    -- Checks the booking and seats, confirms it and records the money.
    perform public.record_offline_payment(
      v_booking.id,
      least(v_booking.paid_paise + v_proof.amount_paise, v_booking.total_paise)
    );
  else
    if coalesce(trim(p_reason), '') = '' then
      raise exception 'Give a reason for rejecting';
    end if;
    -- An hour to send a corrected proof before the seats go back on sale.
    update public.bookings
    set hold_expires_at = least(hold_expires_at, now() + interval '1 hour')
    where id = v_proof.booking_id and status = 'pending';
  end if;

  update public.payment_proofs
  set status = case when p_accept then 'accepted' else 'rejected' end::public.payment_proof_status,
      reject_reason = case when p_accept then null else trim(p_reason) end,
      reviewed_at = now()
  where id = p_proof_id
  returning * into v_proof;

  return v_proof;
end;
$$;

revoke execute on function public.review_payment_proof(uuid, boolean, text) from public, anon;
grant execute on function public.review_payment_proof(uuid, boolean, text) to authenticated;

-- ─── Screenshot storage ─────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']);

-- The booking a payment-proof path belongs to, or null for any other shape.
create function public.payment_proof_booking(path text)
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  parts text[] := storage.foldername(path);
begin
  if coalesce(array_length(parts, 1), 0) <> 1
     or parts[1] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return parts[1]::uuid;
end;
$$;

create policy "Trekkers upload payment screenshots" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-proofs' and public.owns_booking(public.payment_proof_booking(name)));

create policy "Trekkers, organizers and admins see payment screenshots" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (
      public.owns_booking(public.payment_proof_booking(name))
      or public.organizes_booking(public.payment_proof_booking(name))
      or public.is_admin()
    )
  );
