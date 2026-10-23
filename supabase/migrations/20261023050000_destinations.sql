-- Destinations group the same trek run by different organizers, e.g. every
-- organizer's Kedarkantha, for comparison pages at /treks/<slug>. Admins
-- manage the list; organizers pick one for each trek (optional).

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  region text not null,
  summary text check (char_length(summary) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger destinations_updated_at before update on public.destinations
  for each row execute function public.set_updated_at();

alter table public.treks
  add column destination_id uuid references public.destinations (id) on delete set null;

create index treks_destination_id_idx on public.treks (destination_id);

alter table public.destinations enable row level security;

create policy "Anyone reads destinations" on public.destinations
  for select to anon, authenticated using (true);
create policy "Admins create destinations" on public.destinations
  for insert to authenticated with check (public.is_admin());
create policy "Admins update destinations" on public.destinations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete destinations" on public.destinations
  for delete to authenticated using (public.is_admin());

-- Popular treks to start with; admins can add more.
insert into public.destinations (name, slug, region) values
  ('Kedarkantha', 'kedarkantha', 'Uttarakhand'),
  ('Brahmatal', 'brahmatal', 'Uttarakhand'),
  ('Dayara Bugyal', 'dayara-bugyal', 'Uttarakhand'),
  ('Har Ki Dun', 'har-ki-dun', 'Uttarakhand'),
  ('Valley of Flowers', 'valley-of-flowers', 'Uttarakhand'),
  ('Kuari Pass', 'kuari-pass', 'Uttarakhand'),
  ('Roopkund', 'roopkund', 'Uttarakhand'),
  ('Tungnath Chandrashila', 'tungnath-chandrashila', 'Uttarakhand'),
  ('Nag Tibba', 'nag-tibba', 'Uttarakhand'),
  ('Pangarchulla', 'pangarchulla', 'Uttarakhand'),
  ('Phulara Ridge', 'phulara-ridge', 'Uttarakhand'),
  ('Ali Bedni Bugyal', 'ali-bedni-bugyal', 'Uttarakhand'),
  ('Kedartal', 'kedartal', 'Uttarakhand'),
  ('Triund', 'triund', 'Himachal Pradesh'),
  ('Hampta Pass', 'hampta-pass', 'Himachal Pradesh'),
  ('Kheerganga', 'kheerganga', 'Himachal Pradesh'),
  ('Bhrigu Lake', 'bhrigu-lake', 'Himachal Pradesh'),
  ('Beas Kund', 'beas-kund', 'Himachal Pradesh'),
  ('Prashar Lake', 'prashar-lake', 'Himachal Pradesh'),
  ('Pin Parvati Pass', 'pin-parvati-pass', 'Himachal Pradesh'),
  ('Buran Ghati', 'buran-ghati', 'Himachal Pradesh'),
  ('Sar Pass', 'sar-pass', 'Himachal Pradesh'),
  ('Indrahar Pass', 'indrahar-pass', 'Himachal Pradesh'),
  ('Kashmir Great Lakes', 'kashmir-great-lakes', 'Jammu & Kashmir'),
  ('Tarsar Marsar', 'tarsar-marsar', 'Jammu & Kashmir'),
  ('Markha Valley', 'markha-valley', 'Ladakh'),
  ('Chadar', 'chadar', 'Ladakh'),
  ('Goechala', 'goechala', 'Sikkim'),
  ('Dzongri', 'dzongri', 'Sikkim');
