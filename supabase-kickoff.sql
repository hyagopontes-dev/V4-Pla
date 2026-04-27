create table if not exists public.kickoff_responses (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null unique,
  submitted_at timestamptz default now(),
  -- Seção 1: Empresa e marca
  alma_negocio text,
  comeco_tudo text,
  jeito_ser text,
  valores text,
  inspiracao text,
  -- Seção 2: Produto e clientes
  o_que_vende text,
  cliente_ideal text,
  problema_resolve text,
  perguntas_frequentes text,
  -- Seção 3: Concorrência
  quem_sao_concorrentes text,
  por_que_voce text,
  o_que_evitar text,
  -- Seção 4: Produção de conteúdo
  fotos_videos text,
  quem_aprova text,
  o_que_ja_foi_feito text,
  -- Seção 5: Objetivos
  sonho_curto_prazo text,
  o_que_medir text,
  dinheiro_anuncios text,
  -- Seção 6: Métricas e financeiro
  faturamento_atual text,
  meta_faturamento text,
  ticket_medio text,
  produto_mais_vende text,
  produto_mais_lucro text,
  margem_lucro text,
  cac text,
  cpl text,
  taxa_conversao text,
  tempo_fechamento text,
  recorrencia text,
  investimento_marketing text,
  canal_principal text,
  principal_gargalo text,
  -- Seção 7: Combinados
  reunioes text,
  whatsapp text,
  contatos text,
  acessos text,
  materiais text
);
alter table public.kickoff_responses disable row level security;
