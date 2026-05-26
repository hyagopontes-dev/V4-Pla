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

-- Dashboard template per client
alter table public.clients
  add column if not exists dashboard_type text default 'inside_sales' 
  check (dashboard_type in ('ecommerce', 'inside_sales'));

-- Strategic Planning System
create table if not exists public.strategic_planning (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null unique,
  
  -- Phase completion (0-100 score each)
  phase1_score int default 0,
  phase2_score int default 0,
  phase3_score int default 0,
  phase4_score int default 0,
  phase5_score int default 0,
  phase6_score int default 0,
  phase7_score int default 0,
  phase9_score int default 0,
  phase10_score int default 0,
  
  -- Phase 1: Diagnóstico
  p1_quem_compra text, p1_por_que_compra text, p1_de_quem_compra text,
  p1_quanto_paga text, p1_onde_esta text, p1_como_escalar text,
  p1_responsavel text, p1_prazo text, p1_observacoes text,
  p1_concluido boolean default false,
  
  -- Phase 2: Análise de Mercado
  p2_concorrentes_diretos text, p2_concorrentes_indiretos text,
  p2_posicionamento text, p2_oferta text, p2_ticket_medio text,
  p2_autoridade text, p2_trafego text, p2_anuncios text,
  p2_redes_sociais text, p2_paginas text, p2_diferenciais text,
  p2_reclamacoes text, p2_reputacao text, p2_processo_comercial text,
  p2_responsavel text, p2_prazo text, p2_pontos_criticos text,
  p2_concluido boolean default false,
  
  -- Phase 3: ICP e Grid
  p3_quem_e_publico text, p3_dores text, p3_desejos text,
  p3_objecoes text, p3_gatilhos text, p3_onde_esta text,
  p3_como_comunicar text, p3_validado boolean default false,
  p3_responsavel text, p3_prazo text,
  p3_concluido boolean default false,
  
  -- Phase 4: Checklist Operacional
  p4_instagram text, p4_facebook text, p4_dominio text,
  p4_youtube text, p4_conta_anuncio text, p4_hospedagem text,
  p4_whatsapp text, p4_crm text, p4_landing_pages text,
  p4_responsavel text, p4_prazo text,
  p4_concluido boolean default false,
  
  -- Phase 5: Fast Traffic
  p5_criativos text, p5_provas_sociais text, p5_verba text,
  p5_responsavel text, p5_prazo text,
  p5_concluido boolean default false,
  
  -- Phase 6: Acessos
  p6_link_planilha text,
  p6_responsavel text, p6_prazo text,
  p6_concluido boolean default false,
  
  -- Phase 7: Identidade Visual
  p7_logo boolean default false, p7_manual boolean default false,
  p7_paleta boolean default false, p7_fontes boolean default false,
  p7_criativos_anteriores boolean default false,
  p7_videos boolean default false, p7_fotos boolean default false,
  p7_materiais boolean default false,
  p7_responsavel text, p7_prazo text,
  p7_concluido boolean default false,
  
  -- Phase 9: Budget
  p9_verba_mensal text, p9_verba_diaria text, p9_canais text,
  p9_divisao_canal text, p9_divisao_campanha text,
  p9_responsavel text, p9_prazo text,
  p9_concluido boolean default false,
  
  -- Phase 10: Metas
  p10_meta_leads text, p10_meta_vendas text, p10_meta_faturamento text,
  p10_kpi_principal text, p10_kpi_secundario text,
  p10_apresentacao text, p10_proximas_reunioes text,
  p10_pendencias text, p10_aprovacoes text,
  p10_responsavel text, p10_prazo text,
  p10_concluido boolean default false,
  
  -- Global
  gargalo_atual text,
  proximo_passo text,
  updated_at timestamptz default now()
);
alter table public.strategic_planning disable row level security;

-- Add benchmark phase columns (p3b)
alter table public.strategic_planning
  add column if not exists p3b_concorrentes_diretos text,
  add column if not exists p3b_concorrentes_indiretos text,
  add column if not exists p3b_oferta text,
  add column if not exists p3b_ticket_medio text,
  add column if not exists p3b_diferenciais text,
  add column if not exists p3b_reclamacoes text,
  add column if not exists p3b_oportunidade text,
  add column if not exists p3b_responsavel text,
  add column if not exists p3b_prazo text,
  add column if not exists p3b_concluido boolean default false,
  add column if not exists phase3b_score int default 0,
  -- Rename market analysis fields for p2 (new fields)
  add column if not exists p2_reputacao text,
  add column if not exists p2_processo_comercial text;

alter table public.strategic_planning
  add column if not exists p7_link_logo text,
  add column if not exists p7_link_manual text,
  add column if not exists p7_link_criativos text,
  add column if not exists p7_link_videos text,
  add column if not exists p7_link_fotos text,
  add column if not exists p7_link_materiais text,
  add column if not exists p7_observacoes_vi text;

-- Task management with PDCA
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text not null,
  description text,
  responsible text,
  due_date date,
  priority text default 'media' check (priority in ('baixa','media','alta','urgente')),
  pdca text default 'plan' check (pdca in ('plan','do','check','act')),
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.tasks disable row level security;
create index if not exists tasks_client_id_idx on public.tasks(client_id);

-- Add GA4 and MCC support to ads_integrations
alter table public.ads_integrations
  add column if not exists mcc_id text,
  add column if not exists property_id text;

-- Add GA4 as a platform option
-- Note: platform check constraint needs updating if it exists
-- Run this if you get constraint error:
-- alter table public.ads_integrations drop constraint if exists ads_integrations_platform_check;
-- alter table public.ads_integrations add constraint ads_integrations_platform_check check (platform in ('meta','google','ga4'));

-- Cache table for N8N webhook data
create table if not exists public.ads_cache (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  platform text not null,
  date_preset text not null default 'this_month',
  data jsonb not null,
  fetched_at timestamptz default now(),
  unique(client_id, platform, date_preset)
);
alter table public.ads_cache disable row level security;

alter table public.ads_integrations
  add column if not exists n8n_webhook_url text;

-- Team members table
create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  role text,
  avatar_color text default '#F5C518',
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.team_members disable row level security;

-- Client team assignments
create table if not exists public.client_team (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  team_member_id uuid references public.team_members(id) on delete cascade not null,
  role_in_client text, -- ex: "Gestor", "Tráfego"
  created_at timestamptz default now(),
  unique(client_id, team_member_id)
);
alter table public.client_team disable row level security;

-- ═══════════════════════════════════════════
-- COMMERCIAL PANEL
-- ═══════════════════════════════════════════

-- Deals / pipeline
create table if not exists public.deals (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company text,
  contact_name text,
  contact_email text,
  responsible text, -- team member name
  responsible_id uuid references public.team_members(id),
  stage text not null default 'lead' check (stage in ('lead','qualified','proposal','negotiation','closed_won','closed_lost')),
  value numeric(12,2) default 0,
  probability int default 0 check (probability between 0 and 100),
  origin text default 'inbound' check (origin in ('inbound','referral','outbound','event','other')),
  service_type text, -- gestao_midia, social_media, seo, branding, etc
  first_contact_at date,
  proposal_sent_at date,
  closed_at date,
  expected_close_date date,
  lost_reason text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.deals disable row level security;

-- Sales activities
create table if not exists public.sales_activities (
  id uuid default gen_random_uuid() primary key,
  deal_id uuid references public.deals(id) on delete cascade,
  responsible_id uuid references public.team_members(id),
  responsible text,
  type text not null check (type in ('call','email','meeting','follow_up','proposal','other')),
  notes text,
  done boolean default true,
  scheduled_for timestamptz,
  done_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.sales_activities disable row level security;

-- Sales goals (per member per month)
create table if not exists public.sales_goals (
  id uuid default gen_random_uuid() primary key,
  team_member_id uuid references public.team_members(id) on delete cascade,
  month int not null,
  year int not null,
  goal_revenue numeric(12,2) default 0,
  goal_deals int default 0,
  unique(team_member_id, month, year)
);
alter table public.sales_goals disable row level security;

-- ═══════════════════════════════════════════
-- CUSTOMER SUCCESS PANEL
-- ═══════════════════════════════════════════

-- Client CS stage & health
create table if not exists public.client_cs (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null unique,
  cs_owner_id uuid references public.team_members(id),
  cs_owner text,
  stage text not null default 'estruturacao' check (stage in ('estruturacao','estavel','escala','alerta')),
  stage_changed_at timestamptz default now(),
  health_score int default 100 check (health_score between 0 and 100),
  health_updated_at timestamptz default now(),
  nps_score int check (nps_score between 0 and 10),
  nps_updated_at timestamptz,
  last_contact_at timestamptz,
  last_meeting_at timestamptz,
  mrr numeric(12,2) default 0,
  churn_risk boolean default false,
  upsell_opportunity boolean default false,
  upsell_value numeric(12,2) default 0,
  payment_on_time boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.client_cs disable row level security;

-- CS stage history log
create table if not exists public.client_cs_history (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  changed_by text,
  from_stage text,
  to_stage text,
  reason text,
  created_at timestamptz default now()
);
alter table public.client_cs_history disable row level security;

-- NPS responses
create table if not exists public.nps_responses (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  score int not null check (score between 0 and 10),
  comment text,
  responded_at timestamptz default now()
);
alter table public.nps_responses disable row level security;

-- CS activities / tickets
create table if not exists public.cs_activities (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  cs_owner_id uuid references public.team_members(id),
  cs_owner text,
  type text not null check (type in ('meeting','call','email','ticket','checkin','other')),
  notes text,
  done boolean default true,
  scheduled_for timestamptz,
  done_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.cs_activities disable row level security;

-- Health score history (for trend)
create table if not exists public.health_score_history (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  score int not null,
  recorded_at timestamptz default now()
);
alter table public.health_score_history disable row level security;
