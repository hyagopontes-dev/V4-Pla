interface Props { scope?: string; objectives?: string }

export default function ScopeView({ scope, objectives }: Props) {
  if (!scope && !objectives) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {scope && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-2 text-sm">Escopo contratado</h2>
          <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{scope}</p>
        </div>
      )}
      {objectives && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-2 text-sm">Objetivos do mês</h2>
          <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{objectives}</p>
        </div>
      )}
    </div>
  )
}
