-- Members = the end-customers of each coworking, plus membership offerings.

create table public.membership_plans (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  name          text not null,
  description   text,
  price         integer not null default 0,
  currency      text not null default 'MXN',
  billing_unit  public.price_unit not null default 'month',
  included_hours integer,             -- hour credits granted each period; null = none
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_membership_plans_org on public.membership_plans (org_id);

create trigger trg_membership_plans_updated_at
  before update on public.membership_plans
  for each row execute function public.set_updated_at();

create table public.members (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations (id) on delete cascade,
  user_id            uuid references auth.users (id) on delete set null,
  full_name          text not null,
  email              text,
  phone              text,
  company            text,
  status             public.member_status not null default 'active',
  membership_plan_id uuid references public.membership_plans (id) on delete set null,
  credit_minutes     integer not null default 0,   -- remaining bookable minutes
  notes              text,
  mp_customer_id     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (org_id, email)
);

create index idx_members_org on public.members (org_id);
create index idx_members_user on public.members (user_id);

create trigger trg_members_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.membership_plans enable row level security;
alter table public.members          enable row level security;

create policy "membership_plans_select_member" on public.membership_plans
  for select using (public.is_org_member(org_id));
create policy "membership_plans_write_admin" on public.membership_plans
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
-- active membership plans are visible publicly for the portal
create policy "membership_plans_public_read" on public.membership_plans
  for select using (is_active = true);

-- Staff can read/manage all members; a linked end-user can read their own record.
create policy "members_select_staff" on public.members
  for select using (public.is_org_staff(org_id));
create policy "members_select_self" on public.members
  for select using (user_id = auth.uid());
create policy "members_write_staff" on public.members
  for all using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));
