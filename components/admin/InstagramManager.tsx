'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { InstagramProfile } from '@/types'
import { Save, Instagram } from 'lucide-react'

interface Props { clientId: string; profile: InstagramProfile | null }

const EMPTY: Omit<InstagramProfile, 'id'|'client_id'|'updated_at'> = {
  instagram_url: '', username: '', avatar_url: '',
  seguidores: 0, seguindo: 0, posts: 0,
  eng_medio: 0, views_totais: 0, likes_totais: 0, comentarios: 0
}

export default function InstagramManager({ clientId, profile: initial }: Props) {
  const [data, setData] = useState(initial ? { ...initial } : { ...EMPTY, client_id: clientId })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  function set(field: string, value: string | number) {
    setData(d => ({ ...d, [field]: value }))
  }

  async function save() {
    setSaving(true)
    if (initial) {
      await supabase.from('instagram_profile').update({ ...data, updated_at: new Date().toISOString() }).eq('client_id', clientId)
    } else {
      await supabase.from('instagram_profile').insert({ ...data, client_id: clientId })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Instagram size={15} className="text-pink-500" />
        <h2 className="font-medium text-gray-900">Dados do Instagram</h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Link do perfil</label>
            <input className="input" placeholder="https://instagram.com/usuario"
              value={data.instagram_url ?? ''} onChange={e => set('instagram_url', e.target.value)} />
          </div>
          <div>
            <label className="label">@ Username</label>
            <input className="input" placeholder="@usuario"
              value={data.username ?? ''} onChange={e => set('username', e.target.value)} />
          </div>
          <div>
            <label className="label">URL da foto de perfil</label>
            <input className="input" placeholder="https://..."
              value={data.avatar_url ?? ''} onChange={e => set('avatar_url', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Seguidores</label>
            <input className="input" type="number" value={data.seguidores} onChange={e => set('seguidores', parseInt(e.target.value)||0)} />
          </div>
          <div>
            <label className="label">Posts</label>
            <input className="input" type="number" value={data.posts} onChange={e => set('posts', parseInt(e.target.value)||0)} />
          </div>
          <div>
            <label className="label">Seguindo</label>
            <input className="input" type="number" value={data.seguindo} onChange={e => set('seguindo', parseInt(e.target.value)||0)} />
          </div>
          <div>
            <label className="label">Eng. Médio (%)</label>
            <input className="input" type="number" step="0.01" value={data.eng_medio} onChange={e => set('eng_medio', parseFloat(e.target.value)||0)} />
          </div>
          <div>
            <label className="label">Views totais</label>
            <input className="input" type="number" value={data.views_totais} onChange={e => set('views_totais', parseInt(e.target.value)||0)} />
          </div>
          <div>
            <label className="label">Likes totais</label>
            <input className="input" type="number" value={data.likes_totais} onChange={e => set('likes_totais', parseInt(e.target.value)||0)} />
          </div>
          <div>
            <label className="label">Comentários</label>
            <input className="input" type="number" value={data.comentarios} onChange={e => set('comentarios', parseInt(e.target.value)||0)} />
          </div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          <Save size={14} /> {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar dados'}
        </button>
      </div>
    </div>
  )
}
