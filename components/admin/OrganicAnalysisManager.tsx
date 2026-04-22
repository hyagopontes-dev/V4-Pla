'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { OrganicAnalysis, MONTH_FULL } from '@/types'
import { Plus, Trash2, ExternalLink, Instagram, Save } from 'lucide-react'

interface Props { clientId: string; analyses: OrganicAnalysis[] }

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

function getInstagramEmbedUrl(url: string): string | null {
  if (!url) return null
  const match = url.match(/instagram\.com\/(p|reel|reels)\/([A-Za-z0-9_-]+)/)
  if (!match) return null
  return `https://www.instagram.com/${match[1]}/${match[2]}/embed/`
}

export default function OrganicAnalysisManager({ clientId, analyses: initial }: Props) {
  const [items, setItems] = useState<OrganicAnalysis[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1))
  const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR))
  const [form, setForm] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(CURRENT_YEAR),
    video_url: '',
    analysis: '',
  })
  const supabase = createClient()

  async function add() {
    const { data } = await supabase.from('organic_analysis').insert({
      client_id: clientId,
      month: parseInt(form.month),
      year: parseInt(form.year),
      video_url: form.video_url || null,
      analysis: form.analysis || null,
    }).select().single()
    if (data) {
      setItems(prev => [data, ...prev])
      setForm(f => ({ ...f, video_url: '', analysis: '' }))
      setShowForm(false)
    }
  }

  async function saveItem(item: OrganicAnalysis) {
    setSaving(item.id)
    await supabase.from('organic_analysis').update({
      video_url: item.video_url,
      analysis: item.analysis,
    }).eq('id', item.id)
    setSaving(null)
  }

  async function remove(id: string) {
    if (!confirm('Remover esta análise?')) return
    await supabase.from('organic_analysis').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function update(id: string, field: 'video_url' | 'analysis', value: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const filtered = items
    .filter(i => i.month === parseInt(filterMonth) && i.year === parseInt(filterYear))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Instagram size={16} className="text-pink-500" />
          <h2 className="font-medium text-gray-900">Análise de Orgânico (Instagram)</h2>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Adicionar vídeo
        </button>
      </div>

      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
        <span className="text-xs text-gray-500">Filtrar:</span>
        <select className="input w-32 text-xs py-1" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          {MONTH_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input w-24 text-xs py-1" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} vídeo(s)</span>
      </div>

      {showForm && (
        <div className="p-5 bg-pink-50 border-b border-pink-100 space-y-3">
          <p className="text-xs font-medium text-pink-800">Novo vídeo para análise</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mês</label>
              <select className="input" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                {MONTH_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ano</label>
              <select className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Link do vídeo (Instagram Reel ou Post)</label>
            <input
              className="input"
              type="url"
              placeholder="https://www.instagram.com/reel/ABC123..."
              value={form.video_url}
              onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
            />
            {form.video_url && getInstagramEmbedUrl(form.video_url) && (
              <div className="mt-3 flex justify-center">
                <iframe
                  src={getInstagramEmbedUrl(form.video_url)!}
                  width="280" height="380"
                  frameBorder="0" scrolling="no"
                  className="rounded-xl border border-pink-200"
                  title="Preview"
                />
              </div>
            )}
          </div>
          <div>
            <label className="label">Análise crítica</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Desempenho, pontos fortes, oportunidades de melhoria..."
              value={form.analysis}
              onChange={e => setForm(f => ({ ...f, analysis: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="btn-primary text-xs py-1.5">Adicionar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Nenhum vídeo em {MONTH_FULL[parseInt(filterMonth) - 1]} {filterYear}.
        </p>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((item, idx) => {
            const embedUrl = item.video_url ? getInstagramEmbedUrl(item.video_url) : null
            return (
              <div key={item.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">Vídeo #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => saveItem(item)} className="text-brand-500 hover:text-brand-700">
                      {saving === item.id ? <span className="text-xs text-gray-400">...</span> : <Save size={13} />}
                    </button>
                    <button onClick={() => remove(item.id)} className="text-red-300 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        className="input text-xs py-1.5 flex-1"
                        placeholder="Link do Instagram..."
                        value={item.video_url ?? ''}
                        onChange={e => update(item.id, 'video_url', e.target.value)}
                      />
                      {item.video_url && (
                        <a href={item.video_url} target="_blank" rel="noopener" className="text-pink-500 hover:text-pink-700">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    {embedUrl && (
                      <div className="flex justify-center pt-1">
                        <iframe
                          src={embedUrl}
                          width="280" height="380"
                          frameBorder="0" scrolling="no"
                          className="rounded-xl border border-gray-200"
                          title={`Video ${idx + 1}`}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label">Análise crítica</label>
                    <textarea
                      className="input text-xs py-1.5 min-h-[180px] resize-y w-full"
                      placeholder="Análise crítica do vídeo..."
                      value={item.analysis ?? ''}
                      onChange={e => update(item.id, 'analysis', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
