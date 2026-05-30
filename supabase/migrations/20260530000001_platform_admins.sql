-- Platform admins: a small allow-list of users who can access the
-- Workia super-admin panel (platform-wide, across all tenants).
--
-- Keyed by auth user id, with the email captured for readability / seeding.
-- The super-admin panel reads tenant-wide data through the service-role
-- client (bypassing RLS), so the only thing RLS must protect here is the
-- allow-list table itself.

create table public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now()
);

create index idx_platform_admins_email on public.platform_admins (email);

-- SECURITY DEFINER so it can be called from RLS policies without recursing
-- into platform_admins' own policies.
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.platform_admins a
    where a.user_id = auth.uid()
  );
$$;

alter table public.platform_admins enable row level security;

-- Only platform admins may read the allow-list. All writes go through the
-- service-role client (seeding / management), so no insert/update/delete
-- policies are granted to regular users.
create policy "platform_admins_select" on public.platform_admins
  for select using (public.is_platform_admin());
