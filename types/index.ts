export type Role = 'admin' | 'client'

export interface Profile {
  id: string; email: string; name?: string; role: Role; client_id?: string
}

export interface Client {
  id: string; name: string; slug: string; logo_url?: string; about?: string
  contract_pieces: number; active: boolean
  scope_description?: string; monthly_objectives?: string; dashboard_type?: string; created_at: string
}

export interface Deliverable {
  id: string; client_id: string; month: number; year: number
  delivered: number; doc_url?: string; notes?: string; updated_at: string
}

export interface TrafficMetric {
  id: string; client_id: string; month: number; year: number; platform: 'meta' | 'google'
  meta_alcance?: number; meta_impressoes?: number; meta_cliques?: number
  meta_ctr?: number; meta_cpm?: number; meta_conversoes?: number
  meta_cpr?: number; meta_investimento?: number
  real_alcance?: number; real_impressoes?: number; real_cliques?: number
  real_ctr?: number; real_cpm?: number; real_conversoes?: number
  real_cpr?: number; real_investimento?: number
}

export interface CommLog {
  id: string; client_id: string; month: number; year: number
  content?: string; updated_at: string
}

export interface Blocker {
  id: string; client_id: string; month: number; year: number
  description: string; evidence_url?: string; resolved: boolean; created_at: string
}

export interface Highlight {
  id: string; client_id: string; month: number; year: number
  content?: string; updated_at: string
}

export interface OrganicAnalysis {
  id: string; client_id: string; month: number; year: number
  video_url?: string; analysis?: string; created_at: string
}

export const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
export const MONTH_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export interface MonthlyObjective {
  id: string
  client_id: string
  month: number
  year: number
  content: string
  updated_at: string
}

export interface OtherDeliverable {
  id: string
  client_id: string
  month: number
  year: number
  description: string
  status: 'pendente' | 'entregue' | 'concluido'
  doc_url?: string
  created_at: string
  updated_at: string
}

export interface ClientReference {
  id: string
  client_id: string
  name: string
  url?: string
  type: 'visual' | 'concorrente' | 'referencia'
  notes?: string
  created_at: string
}

export interface InstagramProfile {
  id: string
  client_id: string
  instagram_url?: string
  username?: string
  avatar_url?: string
  seguidores: number
  seguindo: number
  posts: number
  eng_medio: number
  views_totais: number
  likes_totais: number
  comentarios: number
  updated_at: string
}

export interface ContentPlanner {
  id: string
  client_id: string
  month: number
  year: number
  day_of_week: 'segunda'|'terca'|'quarta'|'quinta'|'sexta'|'sabado'|'domingo'
  title: string
  description?: string
  format?: string
  recording_url?: string
  status: 'roteiro'|'gravando'|'gravado'|'publicado'
  created_at: string
  updated_at: string
}

export interface AdsIntegration {
  id: string
  client_id: string
  platform: 'meta' | 'google'
  access_token?: string
  account_id?: string
  refresh_token?: string
  token_expires_at?: string
  mcc_id?: string
  property_id?: string
  n8n_webhook_url?: string
  active: boolean
  updated_at: string
}

export interface AdsMetrics {
  platform: 'meta' | 'google'
  period: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpm: number
  conversions: number
  cpr: number
  reach?: number
}

export interface KickoffResponse {
  id: string
  client_id: string
  submitted_at: string
  alma_negocio?: string
  comeco_tudo?: string
  jeito_ser?: string
  valores?: string
  inspiracao?: string
  o_que_vende?: string
  cliente_ideal?: string
  problema_resolve?: string
  perguntas_frequentes?: string
  quem_sao_concorrentes?: string
  por_que_voce?: string
  o_que_evitar?: string
  fotos_videos?: string
  quem_aprova?: string
  o_que_ja_foi_feito?: string
  sonho_curto_prazo?: string
  o_que_medir?: string
  dinheiro_anuncios?: string
  faturamento_atual?: string
  meta_faturamento?: string
  ticket_medio?: string
  produto_mais_vende?: string
  produto_mais_lucro?: string
  margem_lucro?: string
  cac?: string
  cpl?: string
  taxa_conversao?: string
  tempo_fechamento?: string
  recorrencia?: string
  investimento_marketing?: string
  canal_principal?: string
  principal_gargalo?: string
  reunioes?: string
  whatsapp?: string
  contatos?: string
  acessos?: string
  materiais?: string
}

export interface ClientHandoff {
  id: string
  client_id: string
  o_que_foi_vendido?: string
  expectativa_cliente?: string
  promessa_feita?: string
  prazo_acordado?: string
  perfil_cliente?: string
  link_reuniao?: string
  transcricao_reuniao?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  client_id: string
  title: string
  description?: string
  responsible?: string
  due_date?: string
  priority: 'baixa' | 'media' | 'alta' | 'urgente'
  pdca: 'plan' | 'do' | 'check' | 'act'
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}
