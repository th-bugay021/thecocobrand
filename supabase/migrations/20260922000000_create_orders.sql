create table if not exists public.orders (
  reference text primary key,
  status text not null,
  amount integer not null check (amount >= 0),
  currency text not null default 'NGN',
  created_at timestamptz not null default now(),
  customer_first_name text not null,
  customer_last_name text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  items jsonb not null,
  transfer jsonb not null,
  paid_at timestamptz,
  paystack_transaction_id bigint
);

create index if not exists orders_status_created_at_idx on public.orders (status, created_at desc);

alter table public.orders enable row level security;

-- The backend uses Supabase's server-only secret key, which maps to
-- service_role and bypasses RLS. Grant table access explicitly for projects
-- whose default privileges do not include service_role.
grant usage on schema public to service_role;
grant select, insert, update on table public.orders to service_role;
