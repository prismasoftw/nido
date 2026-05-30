-- Mercado Pago wallet model: central collection + per-org balance + payouts.
-- Money for bookings is collected into the platform (Espazio) MP account.
-- Each org accrues a balance (sale minus commission) and can request payouts.

-- Commission per plan, in basis points (500 = 5.00%). Pricier plan -> lower fee.
alter table public.plans
  add column if not exists commission_bps integer not null default 0;

update public.plans set commission_bps = 0   where code = 'free';
update public.plans set commission_bps = 500 where code = 'lite';
update public.plans set commission_bps = 250 where code = 'premium';

-- Payout requests: a coworking asks to withdraw its balance to its own account.
create table public.payouts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  amount        integer not null check (amount > 0),
  status        text not null default 'requested', -- requested | paid | rejected
  destination   text,                               -- CLABE / bank / MP alias note
  note          text,
  requested_by  uuid references auth.users (id) on delete set null,
  processed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_payouts_org on public.payouts (org_id, created_at desc);
create index idx_payouts_status on public.payouts (status);

create trigger trg_payouts_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

-- Append-only ledger. Balance = sum(amount). Credits are +, debits are -.
create table public.wallet_ledger (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  entry_type  text not null,                 -- sale_net | commission | payout | payout_reversal | adjustment
  amount      integer not null,              -- signed, whole pesos
  payment_id  uuid references public.payments (id) on delete set null,
  payout_id   uuid references public.payouts (id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

create index idx_wallet_ledger_org on public.wallet_ledger (org_id, created_at desc);

-- Available balance for an org (sum of all ledger entries).
create or replace function public.org_wallet_balance(p_org uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::integer
  from public.wallet_ledger
  where org_id = p_org;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.payouts       enable row level security;
alter table public.wallet_ledger enable row level security;

-- Staff can see their org's payouts; admins can create requests.
create policy "payouts_select_staff" on public.payouts
  for select using (public.is_org_staff(org_id));
create policy "payouts_insert_admin" on public.payouts
  for insert with check (public.is_org_admin(org_id));

-- Ledger is read-only for org members; writes happen via service role (webhook).
create policy "wallet_ledger_select_staff" on public.wallet_ledger
  for select using (public.is_org_staff(org_id));
