export type Role = 'admin' | 'client'

export interface Profile {
  id: string
  email: string
  name?: string
  role: Role
  client_id?: string
}

export interface Client {
  id: string
  name: string
  slug: string
  logo_url?: string
  contract_pieces: number
  active: boolean
  created_at: string
}

export interface Deliverable {
  id: string
  client_id: string
  month: number
  year: number
  delivered: number
  doc_url?: string
  notes?: string
  updated_at: string
}

export interface TrafficMetric {
  id: string
  client_id: string
  month: number
  year: number
  platform: 'meta' | 'google'
  meta_alcance?: number
  meta_impressoes?: number
  meta_cliques?: number
  meta_ctr?: number
  meta_cpm?: number
  meta_conversoes?: number
  meta_cpr?: number
  meta_investimento?: number
  real_alcance?: number
  real_impressoes?: number
  real_cliques?: number
  real_ctr?: number
  real_cpm?: number
  real_conversoes?: number
  real_cpr?: number
  real_investimento?: number
}

export const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
export const MONTH_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
