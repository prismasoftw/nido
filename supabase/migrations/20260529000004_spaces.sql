-- Locations and bookable resources (offices, desks, meeting rooms, lockers...).

create table public.locations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  address     text,
  city        text,
  timezone    text not null default 'America/Mexico_City',
  -- weekly opening hours, e.g. {"mon":["09:00","20:00"], ...}
  opening_hours jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_locations_org on public.locations (org_id);

create trigger trg_locations_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

create table public.resources (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  location_id   uuid not null references public.locations (id) on delete cascade,
  name          text not null,
  kind          public.resource_kind not null,
  description   text,
  capacity      integer not null default 1 check (capacity >= 1),
  -- pricing: at least one rate; null = not offered at that unit
  price_hour    integer,
  price_day     integer,
  price_week    integer,
  price_month   integer,
  currency      text not null default 'MXN',
  -- booking rules
  min_minutes   integer not null default 30 check (min_minutes > 0),
  max_minutes   integer,
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  requires_approval boolean not null default false,
  amenities     jsonb not null default '[]'::jsonb,
  photos        jsonb not null default '[]'::jsonb,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_resources_org on public.resources (org_id);
create index idx_resources_location on public.resources (location_id);
create index idx_resources_kind on public.resources (org_id, kind);

create trigger trg_resources_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.locations enable row level security;
alter table public.resources enable row level security;

-- Staff manage their org's locations/resources.
create policy "locations_select_member" on public.locations
  for select using (public.is_org_member(org_id));
create policy "locations_write_admin" on public.locations
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "resources_select_member" on public.resources
  for select using (public.is_org_member(org_id));
create policy "resources_write_admin" on public.resources
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

-- Public read for the booking portal: active resources of active locations are
-- visible to anonymous visitors (used by /p/[slug]). Reads are scoped by the
-- API to a single org, but the data itself is non-sensitive catalog info.
create policy "locations_public_read" on public.locations
  for select using (is_active = true);
create policy "resources_public_read" on public.resources
  for select using (is_active = true);
