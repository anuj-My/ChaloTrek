-- Where bookings come from.
--
-- Organizers share tagged links like chalotrek.in/o/himalayan-hikers?src=insta-bio.
-- The tag is kept in a cookie for 30 days (last tag wins), and
--   * every trek page view is counted per day and tag in trek_views,
--     recorded from the browser so most bots aren't counted;
--   * each booking saves the tag in bookings.source_tag.
-- Links from Chalo Trek's own pages (explore, destinations, home) carry the
-- tag "chalotrek", and those bookings get source = 'marketplace', which
-- decides the commission later (docs/plan.md, Phase 4).

alter table public.bookings
  add column source_tag text check (source_tag ~ '^[a-z0-9_-]{1,40}$');

create table public.trek_views (
  trek_id uuid not null references public.treks (id) on delete cascade,
  day date not null,
  -- '' when the visitor came without a tag.
  source_tag text not null default '' check (source_tag ~ '^[a-z0-9_-]{0,40}$'),
  views integer not null default 0,
  primary key (trek_id, day, source_tag)
);

-- Written only through record_trek_view().
alter table public.trek_views enable row level security;

create policy "Organizers and admins read trek views" on public.trek_views
  for select to authenticated
  using (public.owns_trek(trek_id) or public.is_admin());

-- Counts one view of a public trek's page, for today in India. Views by the
-- trek's own organizer aren't counted.
create function public.record_trek_view(p_trek_id uuid, p_source_tag text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tag text := coalesce(lower(p_source_tag), '');
begin
  if v_tag !~ '^[a-z0-9_-]{0,40}$' then
    v_tag := '';
  end if;
  -- The organizer checking their own page isn't a visitor.
  if not public.trek_is_public(p_trek_id) or public.owns_trek(p_trek_id) then
    return;
  end if;
  insert into public.trek_views (trek_id, day, source_tag, views)
  values (p_trek_id, (now() at time zone 'Asia/Kolkata')::date, v_tag, 1)
  on conflict (trek_id, day, source_tag) do update set views = public.trek_views.views + 1;
end;
$$;

revoke execute on function public.record_trek_view(uuid, text) from public;
grant execute on function public.record_trek_view(uuid, text) to anon, authenticated;

-- book_batch() gains p_source_tag. Otherwise unchanged from
-- 20261024020000_participant_self_details.sql.
drop function public.book_batch(uuid, text, text, jsonb, public.booking_source, text);

create function public.book_batch(
  p_batch_id uuid,
  p_contact_email text,
  p_contact_phone text,
  p_participants jsonb,
  p_source public.booking_source default 'organizer_link',
  p_coupon_code text default null,
  p_source_tag text default null
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
    batch_id, user_id, num_people, total_paise, discount_paise, coupon_id, source, source_tag,
    hold_expires_at, contact_email, contact_phone
  ) values (
    p_batch_id, v_user_id, v_num_people, v_batch.price_paise * v_num_people - v_discount, v_discount,
    v_coupon.id, p_source,
    case when lower(p_source_tag) ~ '^[a-z0-9_-]{1,40}$' then lower(p_source_tag) end,
    now() + interval '10 minutes', p_contact_email, p_contact_phone
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

revoke execute on function public.book_batch(uuid, text, text, jsonb, public.booking_source, text, text) from public, anon;
grant execute on function public.book_batch(uuid, text, text, jsonb, public.booking_source, text, text) to authenticated;
