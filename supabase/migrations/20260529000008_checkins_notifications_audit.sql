-- Check-in/out, notifications and an audit log.

create table public.check_ins (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  booking_id     uuid references public.bookings (id) on delete set null,
  member_id      uuid references public.members (id) on delete set null,
  resource_id    uuid references public.resources (id) on delete set null,
  method         public.checkin_method not null default 'manual',
  checked_in_at  timestamptz not null default now(),
  checked_out_at timestamptz,
  created_at     timestamptz not null default now()
);

create index idx_checkins_org on public.check_ins (org_id, checked_in_at desc);
create index idx_checkins_booking on public.check_ins (booking_id);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete cascade,
  member_id   uuid references public.members (id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  payload     jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id, created_at desc);
create index idx_notifications_org on public.notifications (org_id, created_at desc);

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organizations (id) on delete cascade,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  diff        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index idx_audit_org on public.audit_log (org_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.check_ins     enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log     enable row level security;

create policy "checkins_select_staff" on public.check_ins
  for select using (public.is_org_staff(org_id));
create policy "checkins_write_staff" on public.check_ins
  for all using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));

create policy "notifications_select_own" on public.notifications
  for select using (
    user_id = auth.uid()
    or public.is_org_staff(org_id)
  );
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_write_staff" on public.notifications
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "audit_select_admin" on public.audit_log
  for select using (public.is_org_admin(org_id));
