-- Supabase's type generator only adds a function to a table's Row type when its
-- single row argument is unnamed, so seats_left takes `public.batches` without
-- a name. That lets `select("*, seats_left")` type-check in the app.

drop function public.seats_left(public.batches);

create function public.seats_left(public.batches)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest($1.total_seats - public.seats_taken($1.id), 0);
$$;

revoke execute on function public.seats_left(public.batches) from public;
grant execute on function public.seats_left(public.batches) to anon, authenticated;
