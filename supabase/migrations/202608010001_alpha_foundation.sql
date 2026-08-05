begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  reading_motto text not null default '' check (char_length(reading_motto) <= 20000),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  author text not null default 'Unknown hand' check (char_length(author) <= 300),
  format text not null default 'Softcover'
    check (format in ('Hardcover', 'Softcover', 'Digital', 'PDF', 'Audio')),
  status text not null default 'horizon'
    check (status in ('essential', 'reading', 'horizon', 'finished')),
  shelf_position bigint not null default 1000 check (shelf_position >= 0),
  added_at timestamptz not null default now(),
  finished_at timestamptz,
  essential_why text not null default '' check (char_length(essential_why) <= 20000),
  essential_when text not null default '' check (char_length(essential_when) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null,
  user_id uuid not null,
  body text not null check (char_length(trim(body)) between 1 and 20000),
  shareable boolean not null default false,
  written_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (book_id, user_id) references public.books(id, user_id) on delete cascade
);

create table public.book_images (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null,
  user_id uuid not null,
  storage_path text not null unique,
  kind text not null default 'cover'
    check (kind in ('cover', 'back_cover', 'contents', 'dust_jacket', 'other')),
  sort_position smallint not null default 0 check (sort_position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (book_id, user_id) references public.books(id, user_id) on delete cascade,
  unique (book_id, kind, sort_position)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(trim(email)) and char_length(email) <= 320),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  claimed_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index invitations_one_pending_per_email
  on public.invitations (email)
  where status = 'pending';

create index books_shelf_order
  on public.books (user_id, status, shelf_position, added_at desc);

create index reflections_book_timeline
  on public.reflections (book_id, written_at desc);

create index book_images_book_order
  on public.book_images (book_id, sort_position);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger books_set_updated_at
before update on public.books
for each row execute function public.set_updated_at();

create trigger reflections_set_updated_at
before update on public.reflections
for each row execute function public.set_updated_at();

create trigger book_images_set_updated_at
before update on public.book_images
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, reading_motto)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(new.raw_user_meta_data ->> 'reading_motto', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.reflections enable row level security;
alter table public.book_images enable row level security;
alter table public.invitations enable row level security;

create policy "Readers can view their profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Readers can update their profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Readers can view their books"
on public.books for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Readers can add their books"
on public.books for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Readers can update their books"
on public.books for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Readers can delete their books"
on public.books for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Readers can view their reflections"
on public.reflections for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Readers can add their reflections"
on public.reflections for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Readers can update their reflections"
on public.reflections for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Readers can delete their reflections"
on public.reflections for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Readers can view their image records"
on public.book_images for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Readers can add their image records"
on public.book_images for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Readers can update their image records"
on public.book_images for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Readers can delete their image records"
on public.book_images for delete
to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.books to authenticated;
grant select, insert, update, delete on public.reflections to authenticated;
grant select, insert, update, delete on public.book_images to authenticated;
revoke all on public.invitations from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-images',
  'book-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Readers can view their private book images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'book-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Readers can upload their private book images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'book-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Readers can replace their private book images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'book-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'book-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Readers can delete their private book images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'book-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
