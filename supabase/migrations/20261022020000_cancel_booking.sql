-- Cancelling bookings.
--   * The trek's organizer can cancel any booking that's awaiting payment or
--     confirmed (no-shows, refunds settled outside Chalo Trek).
--   * A trekker can cancel their own booking while it's unpaid, which
--     releases the held seats straight away.
-- Bookings with an online (Razorpay) payment can't be cancelled here: those
-- need a refund through Razorpay, which comes with online payments.
-- Cancelling frees the seats, since seats_taken counts only confirmed and
-- held bookings.

create type public.booking_canceller as enum ('organizer', 'trekker');

alter table public.bookings
  add column cancelled_at timestamptz,
  add column cancelled_by public.booking_canceller;

create function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_by public.booking_canceller;
begin
  if public.organizes_booking(p_booking_id) then
    v_by := 'organizer';
  elsif public.owns_booking(p_booking_id) then
    v_by := 'trekker';
  else
    raise exception 'Booking not found';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'This booking is not active';
  end if;
  if v_by = 'trekker' and (v_booking.status <> 'pending' or v_booking.paid_paise > 0) then
    raise exception 'Contact the organizer to cancel a paid booking';
  end if;
  if v_booking.paid_paise > 0 and not v_booking.paid_offline then
    raise exception 'Online payments must be refunded through Razorpay';
  end if;

  update public.bookings
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = v_by,
      hold_expires_at = null
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke execute on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;
