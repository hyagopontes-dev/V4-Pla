-- Tokens de integração por cliente
create table if not exists public.ads_integrations (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  platform text not null check (platform in ('meta', 'google')),
  access_token text,
  account_id text,
  refresh_token text,
  token_expires_at timestamptz,
  active boolean default true,
  updated_at timestamptz default now(),
  unique(client_id, platform)
);
alter table public.ads_integrations disable row level security;
