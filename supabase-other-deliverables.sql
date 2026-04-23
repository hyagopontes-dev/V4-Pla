create table if not exists public.other_deliverables (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  month int not null,
  year int not null,
  description text not null,
  status text not null default 'pendente' check (status in ('pendente', 'entregue', 'concluido')),
  doc_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.other_deliverables disable row level security;
