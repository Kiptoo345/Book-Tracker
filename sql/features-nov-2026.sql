-- =====================================================================
-- Book-Tracker: categories, covers and history
-- Run in Supabase → SQL Editor, ONE SECTION AT A TIME, before merging
-- the feature/categories-covers-history branch.
--
-- NOTE: this assumes people.id and books.id are bigint (int8), which is
-- the Supabase table-editor default. If yours are uuid, change the two
-- "bigint" types in section 3 to uuid.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. CATEGORIES
-- A plain text column. The list of choices lives in src/constants.js,
-- so adding a new category later needs no database change.
-- ---------------------------------------------------------------------
alter table public.books add column if not exists category text;


-- ---------------------------------------------------------------------
-- 2. COVERS
-- cover_url holds either an Open Library image link or the public link
-- of a photo uploaded to the "covers" storage bucket.
-- ---------------------------------------------------------------------
alter table public.books add column if not exists cover_url text;

-- Public bucket = anyone with the exact link can VIEW an image
-- (fine for book covers). Uploading still needs a login (policy below).
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "Signed-in users can upload covers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'covers');


-- ---------------------------------------------------------------------
-- 3. HISTORY
-- One row every time a book's holder or location changes.
-- A trigger writes the rows automatically, so the app can't forget to,
-- and nobody can edit or fake history from the browser (no insert/
-- update/delete policies = those actions are blocked by RLS).
-- ---------------------------------------------------------------------
create table if not exists public.book_history (
  id          bigint generated always as identity primary key,
  book_id     uuid not null references public.books(id) on delete cascade,
  holder_id   uuid references public.people(id) on delete set null,
  location    text,
  changed_at  timestamptz not null default now(),
  changed_by  uuid default auth.uid()      -- the login that made the change
);

create index if not exists book_history_book_id_idx
  on public.book_history (book_id, changed_at);

alter table public.book_history enable row level security;

create policy "Signed-in users can read history"
on public.book_history for select
to authenticated
using (true);

-- The trigger function. "security definer" lets it insert even though
-- normal users have no insert policy on book_history.
create or replace function public.log_book_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into book_history (book_id, holder_id, location)
    values (new.id, new.current_holder_id, new.current_location);
  elsif new.current_holder_id is distinct from old.current_holder_id
     or new.current_location  is distinct from old.current_location then
    insert into book_history (book_id, holder_id, location)
    values (new.id, new.current_holder_id, new.current_location);
  end if;
  return new;
end;
$$;

drop trigger if exists books_log_history on public.books;
create trigger books_log_history
after insert or update on public.books
for each row execute function public.log_book_history();

-- Give every EXISTING book a starting history row (its current state),
-- dated from its last update. Run once only.
insert into public.book_history (book_id, holder_id, location, changed_at, changed_by)
select id, current_holder_id, current_location,
       coalesce(last_updated, created_at, now()), null
from public.books
where not exists (
  select 1 from public.book_history h where h.book_id = books.id
);
