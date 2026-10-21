-- Public bucket for trek photos. Files live at
--   <organizer_id>/<trek_id>/<random>.webp
-- Anyone can view them (public bucket); only the trek's organizer can upload,
-- replace or delete files under that trek's folder.
-- treks.photos holds these paths in display order, the first being the cover.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trek-photos', 'trek-photos', true, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']);

-- True when `path` is inside a trek folder the current user's organizer owns.
create function public.owns_trek_photo_path(path text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  parts text[] := storage.foldername(path);
begin
  if coalesce(array_length(parts, 1), 0) <> 2 then
    return false;
  end if;
  return exists (
    select 1
    from public.treks t
    join public.organizers o on o.id = t.organizer_id
    where o.id::text = parts[1]
      and t.id::text = parts[2]
      and o.owner_user_id = (select auth.uid())
  );
end;
$$;

revoke execute on function public.owns_trek_photo_path(text) from public, anon;
grant execute on function public.owns_trek_photo_path(text) to authenticated;

create policy "Organizers upload their trek photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'trek-photos' and public.owns_trek_photo_path(name));

create policy "Organizers replace their trek photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'trek-photos' and public.owns_trek_photo_path(name))
  with check (bucket_id = 'trek-photos' and public.owns_trek_photo_path(name));

create policy "Organizers delete their trek photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'trek-photos' and public.owns_trek_photo_path(name));

-- Upserts and deletes read the row first, so owners need select too. Public
-- viewing goes through the public URL and doesn't need this.
create policy "Organizers see their trek photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'trek-photos' and public.owns_trek_photo_path(name));
