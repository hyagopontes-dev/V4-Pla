-- Add new kickoff fields
alter table public.kickoff_responses
  add column if not exists sobre_empresa text,
  add column if not exists swot_forcas text,
  add column if not exists swot_fraquezas text,
  add column if not exists swot_oportunidades text,
  add column if not exists swot_ameacas text,
  add column if not exists publico_1 text,
  add column if not exists publico_2 text,
  add column if not exists publico_3 text,
  add column if not exists puv text,
  add column if not exists objetivo_v4 text,
  add column if not exists reuniao_horario text;

-- Handoff table
create table if not exists public.client_handoff (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null unique,
  o_que_foi_vendido text,
  expectativa_cliente text,
  promessa_feita text,
  prazo_acordado text,
  perfil_cliente text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.client_handoff disable row level security;

alter table public.client_handoff
  add column if not exists link_reuniao text,
  add column if not exists transcricao_reuniao text;
