'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { AdsIntegration } from '@/types'
import { Save, Zap, Eye, EyeOff } from 'lucide-react'

interface Props { clientId: string; integrations: AdsIntegration[] }

export default function AdsIntegrationManager({ clientId, integrations: initial }: Props) {
  const supabase = createClient()

  const initPlatform = (platform: 'meta' | 'google') => {
    const existing = initial.find(i => i.platform === platform)
    return {
      access_token: existing?.access_token ?? '',
      account_id: existing?.account_id ?? '',
      refresh_token: existing?.refresh_token ?? '',
      mcc_id: existing?.mcc_id ?? '',
      property_id: existing?.property_id ?? '',
      n8n_webhook_url: existing?.n8n_webhook_url ?? '',
      active: existing?.active ?? true,
      exists: !!existing,
    }
  }

  const [meta, setMeta] = useState(initPlatform('meta'))
  const [google, setGoogle] = useState(initPlatform('google'))
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [showMeta, setShowMeta] = useState(false)
  const [showGoogle, setShowGoogle] = useState(false)

  async function savePlatform(platform: 'meta' | 'google', data: typeof meta) {
    setSaving(platform)
    const payload = {
      client_id: clientId, platform,
      access_token: data.access_token,
      account_id: data.account_id,
      refresh_token: data.refresh_token || null,
      mcc_id: data.mcc_id || null,
      property_id: data.property_id || null,
      n8n_webhook_url: data.n8n_webhook_url || null,
      active: data.active,
      updated_at: new Date().toISOString(),
    }
    if (data.exists) {
      await supabase.from('ads_integrations').update(payload).eq('client_id', clientId).eq('platform', platform)
    } else {
      await supabase.from('ads_integrations').insert(payload)
      if (platform === 'meta') setMeta(m => ({ ...m, exists: true }))
      else setGoogle(g => ({ ...g, exists: true }))
    }
    setSaving(null)
    setSaved(platform)
    setTimeout(() => setSaved(null), 2000)
  }

  const PlatformCard = ({
    platform, label, logo, state, setState, showToken, setShowToken,
    tokenLabel, accountLabel, accountPlaceholder, helpUrl, helpText, extraField, mccField, ga4Field, webhookField
  }: any) => (
    <div className="border border-gray-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{logo}</span>
          <span className="font-medium text-sm text-gray-900">{label}</span>
          {state.exists && state.access_token && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap size={10} /> Conectado
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-gray-500">Ativo</span>
          <div
            onClick={() => setState((s: any) => ({ ...s, active: !s.active }))}
            className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${state.active ? 'bg-red-500' : 'bg-gray-200'}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${state.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      <div>
        <label className="label">{accountLabel}</label>
        <input className="input font-mono text-xs" placeholder={accountPlaceholder}
          value={state.account_id}
          onChange={e => setState((s: any) => ({ ...s, account_id: e.target.value }))} />
      </div>

      <div>
        <label className="label">{tokenLabel}</label>
        <div className="relative">
          <input
            className="input font-mono text-xs pr-9"
            type={showToken ? 'text' : 'password'}
            placeholder="Cole o token aqui..."
            value={state.access_token}
            onChange={e => setState((s: any) => ({ ...s, access_token: e.target.value }))}
          />
          <button type="button" onClick={() => setShowToken(!showToken)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <a href={helpUrl} target="_blank" rel="noopener" className="text-xs text-red-500 hover:underline mt-1 inline-block">
          {helpText}
        </a>
      </div>

      {extraField && (
        <div>
          <label className="label">{extraField.label}</label>
          <input
            className="input font-mono text-xs"
            type="password"
            placeholder={extraField.placeholder}
            value={extraField.value}
            onChange={e => extraField.onChange(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Com o refresh token o sistema renova o access token automaticamente quando expirar.
          </p>
        </div>
      )}

      {mccField && (
        <div>
          <label className="label">{mccField.label}</label>
          <input
            className="input font-mono text-xs"
            type="text"
            placeholder={mccField.placeholder}
            value={mccField.value}
            onChange={e => mccField.onChange(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            ID da conta MCC (gerenciadora). Permite acessar todas as contas filhas com um único token.
          </p>
        </div>
      )}

      {ga4Field && (
        <div>
          <label className="label">{ga4Field.label}</label>
          <input
            className="input font-mono text-xs"
            type="text"
            placeholder={ga4Field.placeholder}
            value={ga4Field.value}
            onChange={e => ga4Field.onChange(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Property ID do GA4 (somente números). Encontre em: GA4 → Admin → Property Settings.
          </p>
        </div>
      )}

      {webhookField && (
        <div>
          <label className="label">{webhookField.label}</label>
          <input
            className="input font-mono text-xs"
            type="url"
            placeholder={webhookField.placeholder}
            value={webhookField.value}
            onChange={e => webhookField.onChange(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            URL do webhook N8N para buscar dados do Google Ads em tempo real.
          </p>
        </div>
      )}

      <button
        onClick={() => savePlatform(platform, state)}
        disabled={saving === platform}
        className="btn-primary text-xs py-1.5 flex items-center gap-2 disabled:opacity-60"
      >
        <Save size={13} />
        {saved === platform ? '✓ Salvo!' : saving === platform ? 'Salvando...' : 'Salvar integração'}
      </button>
    </div>
  )

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Zap size={15} className="text-red-500" />
        <h2 className="font-medium text-gray-900">Integrações de Anúncios</h2>
        <span className="text-xs text-gray-400 ml-auto">dados em tempo real</span>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
          Configure os tokens de acesso para puxar métricas em tempo real do Meta Ads e Google Ads. Os dados serão exibidos automaticamente no dashboard do cliente.
        </p>

        <PlatformCard
          platform="meta" label="Meta Ads" logo="📘" state={meta} setState={setMeta}
          showToken={showMeta} setShowToken={setShowMeta}
          tokenLabel="Access Token (longa duração)"
          accountLabel="Ad Account ID"
          accountPlaceholder="Ex: 123456789 ou act_123456789"
          helpUrl="https://developers.facebook.com/tools/explorer/"
          helpText="→ Gerar token no Meta Graph Explorer"
        />

        <PlatformCard
          platform="google" label="Google Ads" logo="🔵" state={google} setState={setGoogle}
          showToken={showGoogle} setShowToken={setShowGoogle}
          tokenLabel="Access Token (OAuth2)"
          accountLabel="Customer ID"
          accountPlaceholder="Ex: 123-456-7890"
          helpUrl="https://developers.google.com/oauthplayground"
          helpText="→ Gerar token no OAuth2 Playground"
          extraField={{
            label: 'Refresh Token (renovação automática)',
            placeholder: 'Cole o refresh_token aqui...',
            value: google.refresh_token,
            onChange: (v: string) => setGoogle(g => ({ ...g, refresh_token: v }))
          }}
          mccField={{
            label: 'MCC ID (Conta Gerenciadora)',
            placeholder: '123-456-7890 (opcional, recomendado)',
            value: google.mcc_id,
            onChange: (v: string) => setGoogle(g => ({ ...g, mcc_id: v }))
          }}
          ga4Field={{
            label: 'GA4 Property ID (opcional)',
            placeholder: '123456789',
            value: google.property_id,
            onChange: (v: string) => setGoogle(g => ({ ...g, property_id: v }))
          }}
          webhookField={{
            label: '🔗 N8N Webhook URL (Google Ads)',
            placeholder: 'https://seu-n8n.cloud/webhook/xxxxx',
            value: google.n8n_webhook_url,
            onChange: (v: string) => setGoogle(g => ({ ...g, n8n_webhook_url: v }))
          }}
        />
      </div>
    </div>
  )
}
