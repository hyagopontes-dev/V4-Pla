-- Dados do perfil Instagram por cliente
create table if not exists public.instagram_profile (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null unique,
  instagram_url text,
  username text,
  avatar_url text,
  seguidores int default 0,
  seguindo int default 0,
  posts int default 0,
  eng_medio numeric(6,2) default 0,
  views_totais int default 0,
  likes_totais int default 0,
  comentarios int default 0,
  updated_at timestamptz default now()
);

-- Planner de conteúdo
create table if not exists public.content_planner (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  month int not null,
  year int not null,
  day_of_week text not null check (day_of_week in ('segunda','terca','quarta','quinta','sexta','sabado','domingo')),
  title text not null,
  description text,
  format text,
  recording_url text,
  status text not null default 'roteiro' check (status in ('roteiro','gravando','gravado','publicado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Adicionar campos ao clients
alter table public.clients
  add column if not exists instagram_url text;

alter table public.instagram_profile disable row level security;
alter table public.content_planner disable row level security;
