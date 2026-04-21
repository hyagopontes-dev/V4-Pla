-- ============================================================
-- PHARMA SAAS — Schema completo
-- Cole e execute no SQL Editor do Supabase
-- ============================================================

-- Perfis de usuário (admin ou viewer de cliente)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  client_id uuid,
  created_at timestamptz default now()
);

-- Clientes da agência
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  contract_pieces int not null default 8,
  active boolean default true,
  created_at timestamptz default now()
);

-- Entregas orgânicas por mês/ano
create table public.deliverables (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients on delete cascade not null,
  month int not null check (month between 1 and 12),
  year int not null,
  delivered int not null default 0,
  doc_url text,
  notes text,
  updated_at timestamptz default now(),
  unique(client_id, month, year)
);

-- Métricas de tráfego pago por mês/ano
create table public.traffic_metrics (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients on delete cascade not null,
  month int not null check (month between 1 and 12),
  year int not null,
  platform text not null check (platform in ('meta', 'google')),
  -- metas
  meta_alcance int,
  meta_impressoes int,
  meta_cliques int,
  meta_ctr numeric(6,4),
  meta_cpm numeric(8,2),
  meta_conversoes int,
  meta_cpr numeric(8,2),
  meta_investimento numeric(10,2),
  -- realizados
  real_alcance int,
  real_impressoes int,
  real_cliques int,
  real_ctr numeric(6,4),
  real_cpm numeric(8,2),
  real_conversoes int,
  real_cpr numeric(8,2),
  real_investimento numeric(10,2),
  updated_at timestamptz default now(),
  unique(client_id, month, year, platform)
);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.deliverables enable row level security;
alter table public.traffic_metrics enable row level security;

-- Políticas: admin vê tudo
create policy "Admin full access profiles" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admin full access clients" on public.clients
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admin full access deliverables" on public.deliverables
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admin full access metrics" on public.traffic_metrics
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Políticas: cliente vê apenas seus dados
create policy "Client read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Client read own client" on public.clients
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.client_id = clients.id)
  );

create policy "Client read own deliverables" on public.deliverables
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.client_id = deliverables.client_id)
  );

create policy "Client read own metrics" on public.traffic_metrics
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.client_id = traffic_metrics.client_id)
  );

-- Trigger: cria perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'client'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ATENÇÃO: Para funcionar SEM login, execute também isso:
-- Desabilita RLS temporariamente para acesso público
-- ============================================================
alter table public.profiles disable row level security;
alter table public.clients disable row level security;
alter table public.deliverables disable row level security;
alter table public.traffic_metrics disable row level security;
