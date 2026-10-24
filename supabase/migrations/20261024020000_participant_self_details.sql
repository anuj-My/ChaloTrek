-- Co-travellers fill in their own details.
--
-- When booking, the lead trekker can give just a name (and optionally a
-- phone) for someone else in the group. That participant gets a
-- details_token, and the lead shares their personal link
-- (chalotrek.in/details/<token>) on WhatsApp. Opening it needs no login: the
-- token is the key. They fill in age, gender, emergency contact and medical
-- notes, and can come back to change them until the trek starts.
--
-- Until then, those columns are empty, so they become nullable, with a
-- check that only participants with a link can have them missing.

alter table public.participants
  alter column age drop not null,
  alter column gender drop not null,
  alter column emergency_contact_name drop not null,
  alter column emergency_contact_phone drop not null,
  add column details_token uuid unique,
  add constraint participants_details_complete check (
    details_token is not null
    or (age is not null and gender is not null
        and emergency_contact_name is not null and emergency_contact_phone is not null)
  );

-- book_batch(): a participant with "self_fill": true is saved with just the
-- name and phone, and gets a details_token. Otherwise unchanged from
-- 20261023040000_coupons.sql.
-- p_participants: [{"full_name", "age", "gender", "phone", "emergency_contact_name",
--                   "emergency_contact_phone", "medical_notes", "self_fill"}, ...]
create or replace function public.book_batch(
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
    emergency_contact_name, emergency_contact_phone, medical_notes, details_token
  )
  select
    v_booking.id, p.full_name,
    case when p.self_fill then null else p.age end,
    case when p.self_fill then null else p.gender end,
    nullif(p.phone, ''),
    case when p.self_fill then null else p.emergency_contact_name end,
    case when p.self_fill then null else p.emergency_contact_phone end,
    case when p.self_fill then null else nullif(p.medical_notes, '') end,
    case when p.self_fill then gen_random_uuid() end
  from jsonb_to_recordset(p_participants) as p(
    full_name text, age smallint, gender public.gender, phone text,
    emergency_contact_name text, emergency_contact_phone text, medical_notes text,
    self_fill boolean
  );

  return v_booking;
end;
$$;

-- True while a participant's details can still be filled in or changed by
-- link: the booking is held or confirmed and the trek hasn't started.
create function public.participant_details_open(p public.participants)
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
    where bk.id = p.booking_id
      and (bk.status = 'confirmed' or (bk.status = 'pending' and bk.hold_expires_at > now()))
      and ba.status <> 'cancelled'
      and ba.start_date > (now() at time zone 'Asia/Kolkata')::date
  );
$$;

revoke execute on function public.participant_details_open(public.participants) from public, anon, authenticated;

-- What the details page shows for a link: who it's for, the trek, and what
-- they've filled in so far. No rows for an unknown token.
create function public.get_participant_by_token(p_token uuid)
returns table (
  full_name text,
  age smallint,
  gender public.gender,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,
  trek_name text,
  organizer_name text,
  start_date date,
  end_date date,
  booking_number bigint,
  can_edit boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.full_name, p.age, p.gender, p.phone, p.emergency_contact_name, p.emergency_contact_phone,
    p.medical_notes, t.name, o.name, ba.start_date, ba.end_date, bk.booking_number,
    public.participant_details_open(p)
  from public.participants p
  join public.bookings bk on bk.id = p.booking_id
  join public.batches ba on ba.id = bk.batch_id
  join public.treks t on t.id = ba.trek_id
  join public.organizers o on o.id = t.organizer_id
  where p.details_token = p_token;
$$;

revoke execute on function public.get_participant_by_token(uuid) from public;
grant execute on function public.get_participant_by_token(uuid) to anon, authenticated;

-- Saves the details sent from a participant's link.
create function public.save_participant_details(
  p_token uuid,
  p_age smallint,
  p_gender public.gender,
  p_phone text,
  p_emergency_contact_name text,
  p_emergency_contact_phone text,
  p_medical_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.participants;
begin
  select * into v_participant from public.participants where details_token = p_token for update;
  if not found then
    raise exception 'Link not found';
  end if;
  if not public.participant_details_open(v_participant) then
    raise exception 'This booking can no longer be changed';
  end if;

  update public.participants
  set age = p_age,
      gender = p_gender,
      phone = nullif(trim(p_phone), ''),
      emergency_contact_name = trim(p_emergency_contact_name),
      emergency_contact_phone = trim(p_emergency_contact_phone),
      medical_notes = nullif(trim(p_medical_notes), '')
  where id = v_participant.id;
end;
$$;

revoke execute on function public.save_participant_details(uuid, smallint, public.gender, text, text, text, text)
  from public;
grant execute on function public.save_participant_details(uuid, smallint, public.gender, text, text, text, text)
  to anon, authenticated;
