'use client'
import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { CommLog, MONTH_FULL } from '@/types'
import { Save, Plus, Bold, Italic, List, Link2, AlignLeft } from 'lucide-react'

interface Props { clientId: string; logs: CommLog[] }

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function handleInput() {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function handleLink() {
    const url = prompt('Cole a URL do link:')
    if (url) exec('createLink', url)
  }

  const tools = [
    { icon: Bold, cmd: 'bold', title: 'Negrito (Ctrl+B)' },
    { icon: Italic, cmd: 'italic', title: 'Itálico (Ctrl+I)' },
    { icon: List, cmd: 'insertUnorderedList', title: 'Lista' },
    { icon: AlignLeft, cmd: 'formatBlock', val: '<p>', title: 'Parágrafo' },
  ]

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        padding: '6px 10px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-hover)', flexWrap: 'wrap'
      }}>
        {tools.map(({ icon: Icon, cmd, val, title }) => (
          <button key={cmd} title={title}
            onMouseDown={e => { e.preventDefault(); exec(cmd, val) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '2px',
              border: '1px solid transparent', background: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.1s'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-input)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
          >
            <Icon size={14} />
          </button>
        ))}
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
        <button title="Inserir link"
          onMouseDown={e => { e.preventDefault(); handleLink() }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '2px',
            border: '1px solid transparent', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer'
          }}>
          <Link2 size={14} />
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          Ctrl+B = negrito · Enter = novo parágrafo
        </span>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        style={{
          minHeight: '200px', padding: '14px 16px',
          background: 'var(--bg-input)', color: 'var(--text)',
          fontSize: '13px', lineHeight: 1.8, outline: 'none',
          fontFamily: "'DM Sans', sans-serif",
        }}
        data-placeholder="Registre conversas, reuniões, decisões importantes..."
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-secondary);
          opacity: 0.5;
          pointer-events: none;
        }
        [contenteditable] b, [contenteditable] strong { font-weight: 700; color: var(--text); }
        [contenteditable] i, [contenteditable] em { font-style: italic; }
        [contenteditable] ul { padding-left: 20px; margin: 8px 0; }
        [contenteditable] li { margin: 4px 0; }
        [contenteditable] a { color: var(--yellow); text-decoration: underline; }
        [contenteditable] p { margin: 6px 0; }
      `}</style>
    </div>
  )
}

export default function CommLogManager({ clientId, logs: initial }: Props) {
  const [logs, setLogs] = useState<CommLog[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ month: String(new Date().getMonth() + 1), year: String(CURRENT_YEAR) })
  const [saving, setSaving] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(logs[0]?.id ?? null)
  const supabase = createClient()

  async function addLog() {
    const exists = logs.find(l => l.month === parseInt(form.month) && l.year === parseInt(form.year))
    if (exists) { setActiveId(exists.id); setShowForm(false); return }
    const { data } = await supabase.from('comm_logs').insert({
      client_id: clientId, month: parseInt(form.month), year: parseInt(form.year), content: ''
    }).select().single()
    if (data) { setLogs(prev => [...prev, data]); setActiveId(data.id); setShowForm(false) }
  }

  async function saveLog(log: CommLog) {
    setSaving(log.id)
    await supabase.from('comm_logs').update({ content: log.content, updated_at: new Date().toISOString() }).eq('id', log.id)
    setSaving(null)
  }

  function updateContent(id: string, content: string) {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, content } : l))
  }

  const sorted = [...logs].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  const active = sorted.find(l => l.id === activeId)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Comunicação & Histórico</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '11px' }}>
          <Plus size={12} /> Novo mês
        </button>
      </div>

      {showForm && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
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
          <button onClick={addLog} className="btn-primary" style={{ padding: '8px 16px', fontSize: '11px' }}>Criar</button>
          <button onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: '8px 16px', fontSize: '11px' }}>Cancelar</button>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        {sorted.length > 0 && (
          <div style={{ width: '120px', borderRight: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-hover)' }}>
            {sorted.map(l => (
              <button key={l.id} onClick={() => setActiveId(l.id)} style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                fontSize: '12px', borderBottom: '1px solid var(--border)',
                background: activeId === l.id ? 'var(--bg-card)' : 'transparent',
                color: activeId === l.id ? 'var(--yellow)' : 'var(--text-secondary)',
                fontWeight: activeId === l.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
                borderTop: 'none', borderRight: 'none',
                borderBottom: '1px solid var(--border)',
                borderLeft: activeId === l.id ? '2px solid var(--yellow)' : '2px solid transparent',
              }}>
                {MONTH_FULL[l.month - 1].slice(0, 3)} {l.year}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, padding: '16px' }}>
          {!active ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
              Nenhum log criado ainda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--yellow)', fontWeight: 600 }}>
                {MONTH_FULL[active.month - 1]} {active.year}
              </p>
              <RichEditor
                value={active.content ?? ''}
                onChange={v => updateContent(active.id, v)}
              />
              <button onClick={() => saveLog(active)} className="btn-primary" style={{ padding: '8px 20px', fontSize: '11px', alignSelf: 'flex-start' }}>
                <Save size={13} /> {saving === active.id ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
