-- Extensions, enums and tenant-aware helper functions.
-- These helpers are SECURITY DEFINER so RLS policies can call them without
-- recursing back into the same table they protect.

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'admin', 'manager', 'reception');
create type public.member_status as enum ('active', 'inactive', 'suspended', 'invited');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create type public.plan_code as enum ('free', 'lite', 'premium');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'paused');

create type public.resource_kind as enum (
  'private_office',
  'dedicated_desk',
  'hot_desk',
  'meeting_room',
  'event_space',
  'locker'
);

create type public.price_unit as enum ('hour', 'day', 'week', 'month');

create type public.booking_status as enum (
  'pending',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'no_show'
);

create type public.payment_provider as enum ('mercadopago', 'cash', 'transfer', 'other');
create type public.payment_status as enum ('pending', 'approved', 'rejected', 'refunded', 'cancelled', 'in_process');
create type public.invoice_status as enum ('draft', 'issued', 'paid', 'void');
create type public.checkin_method as enum ('qr', 'manual', 'kiosk');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tenant membership helpers are defined in the tenancy migration, after the
-- organization_members table exists (SQL function bodies are validated at
-- creation time).
