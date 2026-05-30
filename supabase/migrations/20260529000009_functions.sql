-- Read helpers used by the app and the public booking portal.

-- True when no active booking overlaps [p_start, p_end) for the resource.
create or replace function public.is_resource_available(
  p_resource uuid,
  p_start    timestamptz,
  p_end      timestamptz,
  p_exclude  uuid default null
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1
    from public.bookings b
    where b.resource_id = p_resource
      and b.status in ('pending', 'confirmed', 'checked_in')
      and (p_exclude is null or b.id <> p_exclude)
      and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_start, p_end, '[)')
  );
$$;

-- Busy ranges for a resource within a window — safe for the public portal
-- (returns only times, never customer data).
create or replace function public.resource_busy_ranges(
  p_resource uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select b.starts_at, b.ends_at
  from public.bookings b
  where b.resource_id = p_resource
    and b.status in ('pending', 'confirmed', 'checked_in')
    and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_from, p_to, '[)')
  order by b.starts_at;
$$;

-- Current resource usage for an org, used to enforce plan limits in the UI.
create or replace function public.org_usage(p_org uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'locations', (select count(*) from public.locations where org_id = p_org),
    'resources', (select count(*) from public.resources where org_id = p_org),
    'members',   (select count(*) from public.members where org_id = p_org),
    'staff',     (select count(*) from public.organization_members where org_id = p_org and status = 'active'),
    'bookings_this_month', (
      select count(*) from public.bookings
      where org_id = p_org
        and created_at >= date_trunc('month', now())
    )
  );
$$;

revoke all on function public.is_resource_available(uuid, timestamptz, timestamptz, uuid) from public;
revoke all on function public.resource_busy_ranges(uuid, timestamptz, timestamptz) from public;
revoke all on function public.org_usage(uuid) from public;

grant execute on function public.is_resource_available(uuid, timestamptz, timestamptz, uuid) to anon, authenticated;
grant execute on function public.resource_busy_ranges(uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.org_usage(uuid) to authenticated;
