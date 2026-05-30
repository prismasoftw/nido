-- Payments and invoices (end-customer payments to a coworking, and SaaS billing).

create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references public.organizations (id) on delete cascade,
  member_id             uuid references public.members (id) on delete set null,
  booking_id            uuid references public.bookings (id) on delete set null,
  kind                  text not null default 'booking',  -- booking | membership | saas_subscription | other
  amount                integer not null,
  currency              text not null default 'MXN',
  status                public.payment_status not null default 'pending',
  provider              public.payment_provider not null default 'mercadopago',
  provider_payment_id   text,
  provider_preference_id text,
  metadata              jsonb not null default '{}'::jsonb,
  paid_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Idempotency for webhook upserts.
create unique index idx_payments_provider_payment_id
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;
create index idx_payments_org on public.payments (org_id, created_at desc);
create index idx_payments_booking on public.payments (booking_id);

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create table public.invoices (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  member_id   uuid references public.members (id) on delete set null,
  payment_id  uuid references public.payments (id) on delete set null,
  number      text not null,
  status      public.invoice_status not null default 'issued',
  subtotal    integer not null default 0,
  tax         integer not null default 0,
  total       integer not null default 0,
  currency    text not null default 'MXN',
  items       jsonb not null default '[]'::jsonb,
  issued_at   timestamptz not null default now(),
  due_at      timestamptz,
  pdf_url     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, number)
);

create index idx_invoices_org on public.invoices (org_id, issued_at desc);

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;
alter table public.invoices enable row level security;

create policy "payments_select_staff" on public.payments
  for select using (public.is_org_staff(org_id));
create policy "payments_select_self" on public.payments
  for select using (
    exists (select 1 from public.members m where m.id = payments.member_id and m.user_id = auth.uid())
  );
create policy "payments_write_admin" on public.payments
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "invoices_select_staff" on public.invoices
  for select using (public.is_org_staff(org_id));
create policy "invoices_select_self" on public.invoices
  for select using (
    exists (select 1 from public.members m where m.id = invoices.member_id and m.user_id = auth.uid())
  );
create policy "invoices_write_admin" on public.invoices
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
