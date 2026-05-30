-- Bookings engine. A GiST exclusion constraint guarantees that two active
-- bookings can never overlap on the same resource (hard double-booking guard).

create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  location_id  uuid not null references public.locations (id) on delete cascade,
  resource_id  uuid not null references public.resources (id) on delete cascade,
  member_id    uuid references public.members (id) on delete set null,
  -- guest details for portal bookings without a member record
  guest_name   text,
  guest_email  text,
  guest_phone  text,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  status       public.booking_status not null default 'pending',
  price        integer not null default 0,
  currency     text not null default 'MXN',
  title        text,
  notes        text,
  source       text not null default 'admin',   -- 'admin' | 'portal'
  created_by   uuid references auth.users (id) on delete set null,
  cancelled_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint bookings_time_valid check (ends_at > starts_at),
  constraint bookings_identity check (member_id is not null or guest_email is not null),
  -- No two active bookings may overlap on the same resource.
  constraint bookings_no_overlap exclude using gist (
    resource_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed', 'checked_in'))
);

create index idx_bookings_org_time on public.bookings (org_id, starts_at);
create index idx_bookings_resource_time on public.bookings (resource_id, starts_at);
create index idx_bookings_member on public.bookings (member_id);
create index idx_bookings_status on public.bookings (org_id, status);

create trigger trg_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.bookings enable row level security;

create policy "bookings_select_staff" on public.bookings
  for select using (public.is_org_staff(org_id));
create policy "bookings_select_self" on public.bookings
  for select using (
    exists (
      select 1 from public.members m
      where m.id = bookings.member_id and m.user_id = auth.uid()
    )
  );
create policy "bookings_write_staff" on public.bookings
  for all using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));
-- Portal/guest bookings are created server-side via the service role, which
-- bypasses RLS after validating availability and plan limits.
