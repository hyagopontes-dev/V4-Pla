'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface Props { clientId: string; clientName: string }

export default function DeleteClientButton({ clientId, clientName }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('clients').delete().eq('id', clientId)
    router.push('/admin')
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <span className="text-xs text-red-600 font-medium">Confirmar exclusão de "{clientName}"?</span>
        <button onClick={handleDelete} disabled={deleting}
          className="text-xs bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 disabled:opacity-60">
          {deleting ? 'Excluindo...' : 'Sim, excluir'}
        </button>
        <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-2 rounded-lg transition-colors">
      <Trash2 size={13} /> Excluir cliente
    </button>
  )
}
