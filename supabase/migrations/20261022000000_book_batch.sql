-- Replaces create_booking() with book_batch(), which creates the booking and
-- its participants in one transaction, so a booking never holds seats without
-- the people it's for.
--
-- Also:
--   * Starting a new booking for a batch releases the same user's earlier
--     unpaid hold on it, so one person can't block seats by retrying.
--   * "Today" is the date in India, matching the app (todayInIndia).

drop function public.create_booking(uuid, smallint, text, text, public.booking_source);

-- p_participants: [{"full_name", "age", "gender", "phone", "emergency_contact_name",
--                   "emergency_contact_phone", "medical_notes"}, ...], one per seat.
create function public.book_batch(
  p_batch_id uuid,
  p_contact_email text,
  p_contact_phone text,
  p_participants jsonb,
  p_source public.booking_source default 'organizer_link'
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

  insert into public.bookings (
    batch_id, user_id, num_people, total_paise, source,
    hold_expires_at, contact_email, contact_phone
  ) values (
    p_batch_id, v_user_id, v_num_people, v_batch.price_paise * v_num_people, p_source,
    now() + interval '10 minutes', p_contact_email, p_contact_phone
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

revoke execute on function public.book_batch(uuid, text, text, jsonb, public.booking_source) from public, anon;
grant execute on function public.book_batch(uuid, text, text, jsonb, public.booking_source) to authenticated;
