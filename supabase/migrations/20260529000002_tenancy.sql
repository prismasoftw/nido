-- Tenancy: organizations (tenants), user profiles, staff membership, invites.

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- organizations (tenants = coworking businesses)
-- ---------------------------------------------------------------------------
create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  logo_url        text,
  brand_color     text default '#4f46e5',
  timezone        text not null default 'America/Mexico_City',
  currency        text not null default 'MXN',
  country         text not null default 'MX',
  plan            public.plan_code not null default 'free',
  trial_ends_at   timestamptz,
  mp_customer_id  text,
  settings        jsonb not null default '{}'::jsonb,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_organizations_slug on public.organizations (slug);

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- organization_members (staff/operators of a tenant)
-- ---------------------------------------------------------------------------
create table public.organization_members (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.member_role not null default 'reception',
  status     public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index idx_org_members_user on public.organization_members (user_id);

-- ---------------------------------------------------------------------------
-- Membership helper functions (now that organization_members exists)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(p_org uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function public.org_role(p_org uuid)
returns public.member_role language sql security definer set search_path = public stable as $$
  select m.role from public.organization_members m
  where m.org_id = p_org and m.user_id = auth.uid() and m.status = 'active'
  limit 1;
$$;

create or replace function public.is_org_admin(p_org uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.org_role(p_org) in ('owner', 'admin');
$$;

create or replace function public.is_org_staff(p_org uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.org_role(p_org) in ('owner', 'admin', 'manager', 'reception');
$$;

-- ---------------------------------------------------------------------------
-- invitations (invite staff to a tenant by email)
-- ---------------------------------------------------------------------------
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  email       text not null,
  role        public.member_role not null default 'reception',
  status      public.invitation_status not null default 'pending',
  token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by  uuid references auth.users (id) on delete set null,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now(),
  unique (org_id, email)
);

create index idx_invitations_token on public.invitations (token);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.organizations          enable row level security;
alter table public.organization_members   enable row level security;
alter table public.invitations            enable row level security;

-- profiles: a user can see & edit their own; staff can read profiles of
-- co-members within their orgs.
create policy "profiles_select_own_or_comember" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.organization_members me
      join public.organization_members them on them.org_id = me.org_id
      where me.user_id = auth.uid() and me.status = 'active'
        and them.user_id = profiles.id
    )
  );
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- organizations: members can read; admins can update; any authenticated user
-- can create one (becomes the owner via app logic / trigger below).
create policy "orgs_select_member" on public.organizations
  for select using (public.is_org_member(id));
create policy "orgs_insert_authenticated" on public.organizations
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "orgs_update_admin" on public.organizations
  for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));
create policy "orgs_delete_owner" on public.organizations
  for delete using (public.org_role(id) = 'owner');

-- organization_members
create policy "members_select" on public.organization_members
  for select using (public.is_org_member(org_id));
create policy "members_insert_admin" on public.organization_members
  for insert with check (public.is_org_admin(org_id));
create policy "members_update_admin" on public.organization_members
  for update using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy "members_delete_admin" on public.organization_members
  for delete using (public.is_org_admin(org_id));

-- invitations
create policy "invitations_select_admin" on public.invitations
  for select using (public.is_org_admin(org_id));
create policy "invitations_write_admin" on public.invitations
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

-- ---------------------------------------------------------------------------
-- When an org is created, make the creator its owner.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (org_id, user_id, role, status)
  values (new.id, new.created_by, 'owner', 'active')
  on conflict (org_id, user_id) do update set role = 'owner', status = 'active';
  return new;
end;
$$;

create trigger trg_on_org_created
  after insert on public.organizations
  for each row
  when (new.created_by is not null)
  execute function public.handle_new_organization();
