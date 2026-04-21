interface Props { clientName: string; userEmail: string }

export default function ClientNav({ clientName }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">v4</span>
          </div>
          <span className="font-medium text-gray-900 text-sm">{clientName}</span>
        </div>
      </div>
    </header>
  )
}
