-- SaaS plans (Free / Lite / Premium) and per-tenant subscriptions to our SaaS.

create table public.plans (
  code          public.plan_code primary key,
  name          text not null,
  description   text,
  price_mxn     integer not null default 0,        -- monthly price in MXN (cents-free, whole pesos)
  sort_order    integer not null default 0,
  is_public     boolean not null default true,
  -- numeric limits; -1 means unlimited
  limits        jsonb not null default '{}'::jsonb,
  -- boolean feature flags
  features      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

-- Per-tenant subscription to the SaaS itself (billed through Mercado Pago).
create table public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null unique references public.organizations (id) on delete cascade,
  plan_code           public.plan_code not null default 'free',
  status              public.subscription_status not null default 'active',
  mp_subscription_id  text,
  mp_payer_id         text,
  current_period_end  timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Keep organizations.plan in sync with the active subscription.
create or replace function public.sync_org_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.organizations
     set plan = new.plan_code
   where id = new.org_id;
  return new;
end;
$$;

create trigger trg_sync_org_plan
  after insert or update of plan_code, status on public.subscriptions
  for each row execute function public.sync_org_plan();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.plans         enable row level security;
alter table public.subscriptions enable row level security;

-- Plans are public catalog data (readable by anyone, even anon, for pricing page).
create policy "plans_select_all" on public.plans
  for select using (true);

create policy "subscriptions_select_member" on public.subscriptions
  for select using (public.is_org_member(org_id));
create policy "subscriptions_write_admin" on public.subscriptions
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

-- ---------------------------------------------------------------------------
-- Seed the three plans
-- ---------------------------------------------------------------------------
insert into public.plans (code, name, description, price_mxn, sort_order, limits, features) values
(
  'free',
  'Free',
  'Para empezar y probar la plataforma.',
  0,
  1,
  jsonb_build_object(
    'locations', 1,
    'resources', 3,
    'members', 25,
    'staff', 2,
    'bookings_per_month', 50
  ),
  jsonb_build_object(
    'online_payments', false,
    'public_portal', true,
    'qr_checkin', false,
    'email_notifications', false,
    'recurring_bookings', false,
    'advanced_analytics', false,
    'custom_branding', false,
    'multi_location', false,
    'api_access', false,
    'priority_support', false
  )
),
(
  'lite',
  'Lite',
  'Para coworkings en crecimiento que cobran en línea.',
  499,
  2,
  jsonb_build_object(
    'locations', 2,
    'resources', 25,
    'members', 250,
    'staff', 8,
    'bookings_per_month', -1
  ),
  jsonb_build_object(
    'online_payments', true,
    'public_portal', true,
    'qr_checkin', true,
    'email_notifications', true,
    'recurring_bookings', false,
    'advanced_analytics', false,
    'custom_branding', false,
    'multi_location', true,
    'api_access', false,
    'priority_support', false
  )
),
(
  'premium',
  'Premium',
  'Operación completa, multi-sede y analítica avanzada.',
  1299,
  3,
  jsonb_build_object(
    'locations', -1,
    'resources', -1,
    'members', -1,
    'staff', -1,
    'bookings_per_month', -1
  ),
  jsonb_build_object(
    'online_payments', true,
    'public_portal', true,
    'qr_checkin', true,
    'email_notifications', true,
    'recurring_bookings', true,
    'advanced_analytics', true,
    'custom_branding', true,
    'multi_location', true,
    'api_access', true,
    'priority_support', true
  )
);
