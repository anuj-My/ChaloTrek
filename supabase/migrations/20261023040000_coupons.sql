-- Coupon codes. An organizer creates codes for their treks: a percentage off
-- the booking, or a flat amount off per person, optionally limited to one
-- trek, a number of uses, or a last date. Codes aren't readable by the
-- public; check_coupon() looks one up, and book_batch() applies it, so the
-- price is always worked out in the database.
--
-- A use is a confirmed booking, or one still holding seats, with the coupon.

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers (id) on delete cascade,
  -- Null means every trek by the organizer.
  trek_id uuid references public.treks (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9]{3,20}$'),
  percent_off smallint check (percent_off between 1 and 90),
  -- Per person, in paise.
  amount_off_paise integer check (amount_off_paise > 0),
  max_uses integer check (max_uses > 0),
  valid_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((percent_off is null) <> (amount_off_paise is null)),
  unique (organizer_id, code)
);

create trigger coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

alter table public.bookings
  add column coupon_id uuid references public.coupons (id) on delete set null,
  add column discount_paise integer not null default 0 check (discount_paise >= 0);

alter table public.coupons enable row level security;

create policy "Owners read coupons" on public.coupons
  for select to authenticated using (public.owns_organizer(organizer_id) or public.is_admin());
create policy "Owners create coupons" on public.coupons
  for insert to authenticated with check (public.owns_organizer(organizer_id));
create policy "Owners update coupons" on public.coupons
  for update to authenticated
  using (public.owns_organizer(organizer_id))
  with check (public.owns_organizer(organizer_id));
create policy "Owners delete coupons" on public.coupons
  for delete to authenticated using (public.owns_organizer(organizer_id));

-- Uses so far: confirmed bookings, and pending ones still holding seats.
create function public.coupon_uses(c_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.bookings
  where coupon_id = c_id
    and (status = 'confirmed' or (status = 'pending' and hold_expires_at > now()));
$$;

-- The coupon a code gives on a batch, or an exception saying why it can't
-- be used. Codes are matched case-insensitively.
create function public.find_coupon(p_batch_id uuid, p_code text)
returns public.coupons
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_batch public.batches;
  v_trek public.treks;
  v_coupon public.coupons;
begin
  select * into v_batch from public.batches where id = p_batch_id;
  select * into v_trek from public.treks where id = v_batch.trek_id;

  select * into v_coupon from public.coupons
  where organizer_id = v_trek.organizer_id and code = upper(trim(p_code));
  if not found or not v_coupon.active or (v_coupon.trek_id is not null and v_coupon.trek_id <> v_trek.id) then
    raise exception 'This coupon code isn''t valid for this trek';
  end if;
  if v_coupon.valid_until < (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'This coupon has expired';
  end if;
  if v_coupon.max_uses is not null and public.coupon_uses(v_coupon.id) >= v_coupon.max_uses then
    raise exception 'This coupon has been used up';
  end if;
  return v_coupon;
end;
$$;

-- Discount in paise for a number of people, rounded down to whole rupees,
-- and always leaving at least ₹1 to pay.
create function public.coupon_discount(c public.coupons, p_price_paise integer, p_num_people integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select least(
    case
      -- bigint: price × people × percent can pass the integer limit.
      when c.percent_off is not null then (p_price_paise::bigint * p_num_people * c.percent_off / 10000)::integer * 100
      else c.amount_off_paise * p_num_people
    end,
    p_price_paise * p_num_people - 100
  );
$$;

-- For the booking form: what a code takes off, before booking.
create function public.check_coupon(p_batch_id uuid, p_code text)
returns table (code text, percent_off smallint, amount_off_paise integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_coupon public.coupons;
begin
  if not exists (
    select 1 from public.batches b where b.id = p_batch_id and public.trek_is_public(b.trek_id)
  ) then
    raise exception 'Batch not found';
  end if;
  v_coupon := public.find_coupon(p_batch_id, p_code);
  return query select v_coupon.code, v_coupon.percent_off, v_coupon.amount_off_paise;
end;
$$;

-- book_batch() gains p_coupon_code. Otherwise unchanged from
-- 20261022000000_book_batch.sql.
drop function public.book_batch(uuid, text, text, jsonb, public.booking_source);

create function public.book_batch(
  p_batch_id uuid,
  p_contact_email text,
  p_contact_phone text,
  p_participants jsonb,
  p_source public.booking_source default 'organizer_link',
  p_coupon_code text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_num_people integer := jsonb_array_length(p_participants);
  v_batch public.batches;
  v_coupon public.coupons;
  v_discount integer := 0;
  v_booking public.bookings;
begin
  if v_user_id is null then
    raise exception 'You must be logged in to book';
  end if;
  if v_num_people not between 1 and 20 then
    raise exception 'Book between 1 and 20 people';
  end if;

  -- Locks the batch so two people can't both take the last seat.
  select * into v_batch from public.batches where id = p_batch_id for update;

  if not found or not public.trek_is_public(v_batch.trek_id) then
    raise exception 'Batch not found';
  end if;
  if v_batch.status <> 'open' or v_batch.start_date <= (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'This batch is not taking bookings';
  end if;

  update public.bookings
  set status = 'expired'
  where batch_id = p_batch_id and user_id = v_user_id
    and status = 'pending' and paid_paise = 0;

  if public.seats_taken(p_batch_id) + v_num_people > v_batch.total_seats then
    raise exception 'Not enough seats left';
  end if;

  if nullif(trim(p_coupon_code), '') is not null then
    -- Lock the coupon so two bookings can't both take its last use.
    v_coupon := public.find_coupon(p_batch_id, p_coupon_code);
    perform 1 from public.coupons where id = v_coupon.id for update;
    v_coupon := public.find_coupon(p_batch_id, p_coupon_code);
    v_discount := public.coupon_discount(v_coupon, v_batch.price_paise, v_num_people);
  end if;

  insert into public.bookings (
    batch_id, user_id, num_people, total_paise, discount_paise, coupon_id, source,
    hold_expires_at, contact_email, contact_phone
  ) values (
    p_batch_id, v_user_id, v_num_people, v_batch.price_paise * v_num_people - v_discount, v_discount,
    v_coupon.id, p_source, now() + interval '10 minutes', p_contact_email, p_contact_phone
  )
  returning * into v_booking;

  insert into public.participants (
    booking_id, full_name, age, gender, phone,
    emergency_contact_name, emergency_contact_phone, medical_notes
  )
  select
    v_booking.id, p.full_name, p.age, p.gender, nullif(p.phone, ''),
    p.emergency_contact_name, p.emergency_contact_phone, nullif(p.medical_notes, '')
  from jsonb_to_recordset(p_participants) as p(
    full_name text, age smallint, gender public.gender, phone text,
    emergency_contact_name text, emergency_contact_phone text, medical_notes text
  );

  return v_booking;
end;
$$;

revoke execute on function public.coupon_uses(uuid) from public, anon, authenticated;
revoke execute on function public.find_coupon(uuid, text) from public, anon, authenticated;
revoke execute on function public.coupon_discount(public.coupons, integer, integer) from public, anon, authenticated;
revoke execute on function public.check_coupon(uuid, text) from public, anon;
revoke execute on function public.book_batch(uuid, text, text, jsonb, public.booking_source, text) from public, anon;
grant execute on function public.check_coupon(uuid, text) to authenticated;
grant execute on function public.book_batch(uuid, text, text, jsonb, public.booking_source, text) to authenticated;
