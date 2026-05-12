'use client'
import { useState, useMemo } from 'react'
import React from 'react'
import { createClient } from '@/lib/supabase'
import { Task } from '@/types'
import { Plus, X, Check, ChevronDown, Calendar, User, Flag, Search, Filter, Bold, Italic, List, ChevronUp } from 'lucide-react'

interface Client { id: string; name: string; slug: string }
interface Props { clients: Client[]; initialTasks: Task[] }

const PDCA = {
  plan: { label: 'PLAN', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', desc: 'Planejar — meta e método definidos' },
  do:   { label: 'DO',   color: '#F5C518', bg: 'rgba(245,197,24,0.12)',  border: 'rgba(245,197,24,0.3)',  desc: 'Executar — tarefa em andamento' },
  check:{ label: 'CHECK',color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', desc: 'Verificar — aguardando revisão' },
  act:  { label: 'ACT',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  desc: 'Agir — ajustes finais ou validado' },
}

const PRIORITY = {
  baixa:   { label: 'Baixa',   color: '#888' },
  media:   { label: 'Média',   color: '#F5C518' },
  alta:    { label: 'Alta',    color: '#f97316' },
  urgente: { label: 'Urgente', color: '#ef4444' },
}

function PDCABadge({ pdca }: { pdca: Task['pdca'] }) {
  const p = PDCA[pdca]
  return (
    <span style={{
      fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em',
      padding: '3px 8px', borderRadius: '2px',
      background: p.bg, border: `1px solid ${p.border}`, color: p.color,
    }}>{p.label}</span>
  )
}

function PDCAStepper({ value, onChange }: { value: Task['pdca']; onChange: (v: Task['pdca']) => void }) {
  const steps: Task['pdca'][] = ['plan', 'do', 'check', 'act']
  const curIdx = steps.indexOf(value)
  return (
    <div style={{ display: 'flex', gap: '0' }}>
      {steps.map((step, i) => {
        const p = PDCA[step]
        const active = step === value
        const done = i < curIdx
        return (
          <button key={step} onClick={() => onChange(step)} title={p.desc}
            style={{
              padding: '4px 10px', fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.12em', cursor: 'pointer', transition: 'all 0.15s',
              background: active ? p.bg : done ? 'rgba(255,255,255,0.04)' : 'transparent',
              color: active ? p.color : done ? 'rgba(255,255,255,0.3)' : 'var(--text-secondary)',
              borderTop: `1px solid ${active ? p.border : 'var(--border)'}`,
              borderBottom: `1px solid ${active ? p.border : 'var(--border)'}`,
              borderLeft: i === 0 ? `1px solid ${active ? p.border : 'var(--border)'}` : 'none',
              borderRight: `1px solid ${active ? p.border : 'var(--border)'}`,
              borderRadius: i === 0 ? '2px 0 0 2px' : i === steps.length - 1 ? '0 2px 2px 0' : '0',
            }}>
            {active && <span style={{ marginRight: '3px' }}>●</span>}
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

function RichEditor({ value, onChange, placeholder = 'Descrição...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '26px', height: '26px', borderRadius: '2px',
    border: '1px solid transparent', background: 'transparent',
    color: 'var(--text-secondary)', cursor: 'pointer',
  }
  function exec(cmd: string, val?: string) {
    ref.current?.focus()
    document.execCommand(cmd, false, val)
    if (ref.current) onChange(ref.current.innerHTML)
  }
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '2px', padding: '4px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('bold') }} style={btnBase} title="Negrito"><Bold size={12} /></button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('italic') }} style={btnBase} title="Itálico"><Italic size={12} /></button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList') }} style={btnBase} title="Lista"><List size={12} /></button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={() => { if (ref.current) onChange(ref.current.innerHTML) }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        data-placeholder={placeholder}
        style={{ minHeight: '80px', padding: '10px 12px', background: 'var(--bg-input)', color: 'var(--text)', fontSize: '12px', lineHeight: 1.7, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:var(--text-secondary);opacity:.5;pointer-events:none}[contenteditable] b,[contenteditable] strong{font-weight:700}[contenteditable] i,[contenteditable] em{font-style:italic}[contenteditable] ul{padding-left:18px;margin:4px 0}[contenteditable] li{margin:2px 0}[contenteditable] p{margin:4px 0}`}</style>
    </div>
  )
}

function TaskCard({ task, clientName, onUpdate, onDelete }: {
  task: Task; clientName: string
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [showDesc, setShowDesc] = useState(false)
  const [form, setForm] = useState({ title: task.title, description: task.description ?? '', responsible: task.responsible ?? '', due_date: task.due_date ?? '', priority: task.priority })
  const overdue = task.due_date && !task.completed && new Date(task.due_date) < new Date()
  const pr = PRIORITY[task.priority]

  function saveEdit() {
    onUpdate(task.id, { ...form, updated_at: new Date().toISOString() })
    setEditing(false)
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '2px',
      padding: '14px 16px', transition: 'border-color 0.15s',
      opacity: task.completed ? 0.55 : 1,
      borderLeft: `3px solid ${PDCA[task.pdca].color}`,
    }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input className="input" style={{ fontSize: '13px' }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="input" style={{ fontSize: '12px', minHeight: '60px', resize: 'vertical' }} placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label className="label">Responsável</label>
              <input className="input" style={{ fontSize: '12px' }} value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} />
            </div>
            <div>
              <label className="label">Prazo</label>
              <input type="date" className="input" style={{ fontSize: '12px' }} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select className="input" style={{ fontSize: '12px' }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}>
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveEdit} className="btn-primary" style={{ padding: '6px 14px', fontSize: '11px' }}>Salvar</button>
            <button onClick={() => setEditing(false)} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '11px' }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
            {/* Complete checkbox */}
            <button onClick={() => onUpdate(task.id, { completed: !task.completed, completed_at: !task.completed ? new Date().toISOString() : undefined })}
              style={{
                width: '18px', height: '18px', borderRadius: '2px', flexShrink: 0, marginTop: '1px',
                border: `1.5px solid ${task.completed ? '#22c55e' : 'var(--border)'}`,
                background: task.completed ? '#22c55e' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {task.completed && <Check size={11} color="#0A0A0A" strokeWidth={3} />}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4,
                textDecoration: task.completed ? 'line-through' : 'none',
              }}>{task.title}</p>
              {task.description && (
                <button onClick={() => setShowDesc(s => !s)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', padding: 0 }}>
                  {showDesc ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {showDesc ? 'Ocultar descrição' : 'Ver descrição'}
                </button>
              )}
              {task.description && showDesc && (
                <div dangerouslySetInnerHTML={{ __html: task.description }}
                  style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.7,
                    padding: '8px 12px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '2px' }} />
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => setEditing(true)} style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Editar</button>
              <button onClick={() => onDelete(task.id)} style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                <X size={13} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <PDCAStepper value={task.pdca} onChange={v => onUpdate(task.id, { pdca: v, updated_at: new Date().toISOString() })} />
            
            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
              {task.responsible && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '2px' }}>
                  <User size={10} /> {task.responsible}
                </span>
              )}
              {task.due_date && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: overdue ? '#ef4444' : 'var(--text-secondary)', background: overdue ? 'rgba(239,68,68,0.08)' : 'var(--bg-hover)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, padding: '2px 8px', borderRadius: '2px' }}>
                  <Calendar size={10} /> {new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  {overdue && ' ⚠️'}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: pr.color, background: `${pr.color}15`, border: `1px solid ${pr.color}40`, padding: '2px 8px', borderRadius: '2px', fontWeight: 600, letterSpacing: '0.08em' }}>
                <Flag size={9} /> {pr.label}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function TaskBoard({ clients, initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filterClient, setFilterClient] = useState('')
  const [filterResponsible, setFilterResponsible] = useState('')
  const [filterPdca, setFilterPdca] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ client_id: '', title: '', description: '', responsible: '', due_date: '', priority: 'media' as Task['priority'], pdca: 'plan' as Task['pdca'] })
  const supabase = createClient()

  // All responsibles for filter
  const responsibles = useMemo(() => {
    const set = new Set(tasks.map(t => t.responsible).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [tasks])

  // Filter tasks
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filterClient && t.client_id !== filterClient) return false
      if (filterResponsible && t.responsible !== filterResponsible) return false
      if (filterPdca && t.pdca !== filterPdca) return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.responsible?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tasks, filterClient, filterResponsible, filterPdca, filterPriority, search])

  // Group by client
  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {}
    filtered.forEach(t => {
      if (!map[t.client_id]) map[t.client_id] = []
      map[t.client_id].push(t)
    })
    return map
  }, [filtered])

  // Stats
  const stats = useMemo(() => ({
    total: filtered.length,
    completed: filtered.filter(t => t.completed).length,
    overdue: filtered.filter(t => t.due_date && !t.completed && new Date(t.due_date) < new Date()).length,
    byPdca: { plan: 0, do: 0, check: 0, act: 0, ...Object.fromEntries((['plan','do','check','act'] as Task['pdca'][]).map(p => [p, filtered.filter(t => t.pdca === p && !t.completed).length])) },
  }), [filtered])

  async function createTask() {
    if (!newForm.client_id || !newForm.title.trim()) return
    const { data } = await supabase.from('tasks').insert({
      ...newForm, completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).select().single()
    if (data) {
      setTasks(prev => [data, ...prev])
      setNewForm(f => ({ ...f, title: '', description: '', due_date: '' }))
      setShowNew(false)
    }
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    await supabase.from('tasks').update(updates).eq('id', id)
  }

  async function deleteTask(id: string) {
    if (!confirm('Excluir tarefa?')) return
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Gestão Interna</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '34px', letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 }}>GESTÃO DE TAREFAS</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 300 }}>Ciclo PDCA — Plan · Do · Check · Act</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus size={13} /> Nova tarefa
        </button>
      </div>

      {/* PDCA Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--text)' },
          { label: 'Concluídas', value: stats.completed, color: '#22c55e' },
          { label: 'Atrasadas', value: stats.overdue, color: '#ef4444' },
          ...(['plan','do','check','act'] as Task['pdca'][]).map(p => ({ label: PDCA[p].label, value: stats.byPdca[p], color: PDCA[p].color })),
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', letterSpacing: '0.04em', color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            <input className="input" style={{ paddingLeft: '32px', fontSize: '12px' }} placeholder="Buscar tarefa ou responsável..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ fontSize: '12px', width: 'auto', minWidth: '160px' }} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="">Todos os clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" style={{ fontSize: '12px', width: 'auto', minWidth: '160px' }} value={filterResponsible} onChange={e => setFilterResponsible(e.target.value)}>
            <option value="">Todos os responsáveis</option>
            {responsibles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="input" style={{ fontSize: '12px', width: 'auto' }} value={filterPdca} onChange={e => setFilterPdca(e.target.value)}>
            <option value="">Todos os status</option>
            {Object.entries(PDCA).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.desc.split('—')[0].trim()}</option>)}
          </select>
          <select className="input" style={{ fontSize: '12px', width: 'auto' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">Todas as prioridades</option>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(filterClient || filterResponsible || filterPdca || filterPriority || search) && (
            <button onClick={() => { setFilterClient(''); setFilterResponsible(''); setFilterPdca(''); setFilterPriority(''); setSearch('') }}
              className="btn-ghost" style={{ padding: '8px 12px', fontSize: '11px', flexShrink: 0 }}>
              <X size={12} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* New task form */}
      {showNew && (
        <div className="card" style={{ marginBottom: '20px', borderColor: 'var(--yellow)', borderWidth: '1px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--yellow)', fontWeight: 600, marginBottom: '14px' }}>Nova Tarefa</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="label">Cliente *</label>
                <select className="input" value={newForm.client_id} onChange={e => setNewForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Selecionar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Título *</label>
                <input className="input" placeholder="Descrição da tarefa..." value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} />
              </div>
            </div>
            <RichEditor value={newForm.description} onChange={v => setNewForm(f => ({ ...f, description: v }))} placeholder="Descrição adicional (opcional)..." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <label className="label">Responsável</label>
                <input className="input" placeholder="Nome..." value={newForm.responsible} onChange={e => setNewForm(f => ({ ...f, responsible: e.target.value }))} />
              </div>
              <div>
                <label className="label">Prazo</label>
                <input type="date" className="input" value={newForm.due_date} onChange={e => setNewForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Prioridade</label>
                <select className="input" value={newForm.priority} onChange={e => setNewForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}>
                  {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status PDCA</label>
                <select className="input" value={newForm.pdca} onChange={e => setNewForm(f => ({ ...f, pdca: e.target.value as Task['pdca'] }))}>
                  {Object.entries(PDCA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={createTask} className="btn-primary" style={{ padding: '8px 20px' }}>Criar tarefa</button>
              <button onClick={() => setShowNew(false)} className="btn-ghost" style={{ padding: '8px 16px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Task groups */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '8px' }}>NENHUMA TAREFA</div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Crie sua primeira tarefa clicando em "Nova tarefa".</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {Object.entries(grouped).map(([clientId, clientTasks]) => {
            const client = clientMap[clientId]
            const done = clientTasks.filter(t => t.completed).length
            const total = clientTasks.length
            const pct = Math.round((done / total) * 100)
            return (
              <div key={clientId}>
                {/* Client header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '8px', height: '8px', background: 'var(--yellow)', borderRadius: '1px', flexShrink: 0 }} />
                  <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '0.06em', color: 'var(--text)', lineHeight: 1 }}>
                    {client?.name ?? clientId}
                  </h2>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                    {done}/{total} concluídas
                  </span>
                  <div style={{ flex: 1, height: '3px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden', maxWidth: '120px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--yellow)', borderRadius: '2px', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--yellow)', fontWeight: 700 }}>{pct}%</span>
                </div>

                {/* Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Sort: incomplete first, then by pdca order, then completed last */}
                  {[...clientTasks]
                    .sort((a, b) => {
                      if (a.completed !== b.completed) return a.completed ? 1 : -1
                      const pdcaOrder = { plan: 0, do: 1, check: 2, act: 3 }
                      if (pdcaOrder[a.pdca] !== pdcaOrder[b.pdca]) return pdcaOrder[a.pdca] - pdcaOrder[b.pdca]
                      const prioOrder = { urgente: 0, alta: 1, media: 2, baixa: 3 }
                      return prioOrder[a.priority] - prioOrder[b.priority]
                    })
                    .map(task => (
                      <TaskCard key={task.id} task={task} clientName={client?.name ?? ''} onUpdate={updateTask} onDelete={deleteTask} />
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
