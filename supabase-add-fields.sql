-- Adicionar novos campos na tabela clients (escopo contratado e objetivos mensais)
alter table public.clients 
  add column if not exists scope_description text,
  add column if not exists monthly_objectives text;

-- Nova tabela: logs de comunicação/histórico
create table if not exists public.comm_logs (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  month int not null,
  year int not null,
  content text,
  updated_at timestamptz default now(),
  unique(client_id, month, year)
);

-- Nova tabela: pontos de atenção/bloqueadores
create table if not exists public.blockers (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  month int not null,
  year int not null,
  description text not null,
  evidence_url text,
  resolved boolean default false,
  created_at timestamptz default now()
);

-- Nova tabela: destaques positivos
create table if not exists public.highlights (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  month int not null,
  year int not null,
  content text,
  updated_at timestamptz default now(),
  unique(client_id, month, year)
);

-- Nova tabela: análise de orgânico (instagram)
create table if not exists public.organic_analysis (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  month int not null,
  year int not null,
  video_url text,
  analysis text,
  created_at timestamptz default now()
);

-- Desabilitar RLS nas novas tabelas
alter table public.comm_logs disable row level security;
alter table public.blockers disable row level security;
alter table public.highlights disable row level security;
alter table public.organic_analysis disable row level security;
