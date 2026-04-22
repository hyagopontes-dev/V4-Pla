-- Tabela separada para objetivos mensais
create table if not exists public.monthly_objectives (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  month int not null,
  year int not null,
  content text not null,
  updated_at timestamptz default now(),
  unique(client_id, month, year)
);

alter table public.monthly_objectives disable row level security;
