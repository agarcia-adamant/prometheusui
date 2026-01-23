create extension if not exists "pgcrypto";

create table if not exists public.lead_batches (
  id uuid primary key default gen_random_uuid(),
  name text,
  lead_count integer not null default 0,
  device_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.call_events (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.lead_batches(id) on delete set null,
  lead_id integer,
  lead_name text,
  lead_phone text,
  lead_address text,
  lead_rating text,
  called_at timestamptz not null default now(),
  device_id text,
  created_at timestamptz not null default now()
);

create index if not exists call_events_batch_id_idx on public.call_events (batch_id);
create index if not exists call_events_lead_id_idx on public.call_events (lead_id);
create index if not exists call_events_called_at_idx on public.call_events (called_at desc);

alter table public.lead_batches enable row level security;
alter table public.call_events enable row level security;

create policy "lead_batches_select" on public.lead_batches
  for select using (true);
create policy "lead_batches_insert" on public.lead_batches
  for insert with check (true);

create policy "call_events_select" on public.call_events
  for select using (true);
create policy "call_events_insert" on public.call_events
  for insert with check (true);
create policy "call_events_delete" on public.call_events
  for delete using (true);
