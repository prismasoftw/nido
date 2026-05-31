-- Platform admins can suspend a coworking. A non-null suspended_at blocks the
-- org's staff from accessing the app (enforced in the app layout).
alter table public.organizations
  add column if not exists suspended_at timestamptz;

comment on column public.organizations.suspended_at is
  'When set, the coworking is suspended by a platform admin and its staff cannot access the app.';
