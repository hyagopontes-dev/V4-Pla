create table if not exists public.client_references (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  url text,
  type text not null default 'referencia' check (type in ('visual', 'concorrente', 'referencia')),
  notes text,
  created_at timestamptz default now()
);
alter table public.client_references disable row level security;
