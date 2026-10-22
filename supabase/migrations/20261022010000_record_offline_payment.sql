-- Lets organizers record money they received outside Chalo Trek (UPI, cash),
-- until online payment is live and afterwards for balances paid on the trek.
--
-- record_offline_payment(booking, total received so far):
--   * an unpaid booking (held, or whose hold ran out) becomes confirmed. If
--     its hold ran out, it's confirmed only while enough seats are still free;
--   * on a confirmed booking it updates the amount received, e.g. when the
--     balance comes in.
-- bookings.paid_offline marks bookings with money taken outside Razorpay, so
-- reports can tell them apart from online payments.

alter table public.bookings add column paid_offline boolean not null default false;

create function public.record_offline_payment(p_booking_id uuid, p_paid_paise integer)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_batch public.batches;
  v_holds_seats boolean;
begin
  if not public.organizes_booking(p_booking_id) then
    raise exception 'Booking not found';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  -- Lock the batch, as book_batch does, so seats are counted one at a time.
  select * into v_batch from public.batches where id = v_booking.batch_id for update;
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if v_booking.status not in ('pending', 'expired', 'confirmed') then
    raise exception 'This booking was cancelled';
  end if;
  if v_batch.status = 'cancelled' then
    raise exception 'This batch was cancelled';
  end if;
  if p_paid_paise < 1 or p_paid_paise > v_booking.total_paise then
    raise exception 'Amount must be between 1 and the booking total';
  end if;

  v_holds_seats := v_booking.status = 'confirmed'
    or (v_booking.status = 'pending' and v_booking.hold_expires_at > now());
  if not v_holds_seats
     and public.seats_taken(v_batch.id) + v_booking.num_people > v_batch.total_seats then
    raise exception 'Not enough seats left';
  end if;

  update public.bookings
  set status = 'confirmed',
      paid_paise = p_paid_paise,
      paid_offline = true,
      hold_expires_at = null
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke execute on function public.record_offline_payment(uuid, integer) from public, anon;
grant execute on function public.record_offline_payment(uuid, integer) to authenticated;
