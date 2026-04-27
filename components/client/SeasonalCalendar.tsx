'use client'
import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const SEASONAL: Record<string, { emoji: string; label: string; color: string }[]> = {
  '01-01': [{ emoji: '🎉', label: 'Ano Novo', color: 'text-yellow-400' }],
  '01-06': [{ emoji: '👑', label: 'Dia de Reis', color: 'text-purple-400' }],
  '01-15': [{ emoji: '🌊', label: 'Dia do Consumidor (ES)', color: 'text-blue-400' }],
  '02-14': [{ emoji: '❤️', label: 'Dia dos Namorados (BR: 12/06)', color: 'text-pink-400' }],
  '03-08': [{ emoji: '👩', label: 'Dia da Mulher', color: 'text-pink-400' }],
  '03-15': [{ emoji: '🛡️', label: 'Dia do Consumidor', color: 'text-blue-400' }],
  '04-01': [{ emoji: '🃏', label: 'Dia da Mentira', color: 'text-gray-400' }],
  '04-21': [{ emoji: '⛪', label: 'Tiradentes', color: 'text-yellow-400' }],
  '05-01': [{ emoji: '👷', label: 'Dia do Trabalho', color: 'text-red-400' }],
  '05-11': [{ emoji: '👩‍👦', label: 'Dia das Mães', color: 'text-pink-400' }],
  '05-15': [{ emoji: '🌸', label: 'Dia das Mães', color: 'text-pink-400' }],
  '06-12': [{ emoji: '💕', label: 'Dia dos Namorados', color: 'text-red-400' }],
  '06-15': [{ emoji: '💕', label: 'Dia dos Namorados', color: 'text-red-400' }],
  '06-24': [{ emoji: '🎆', label: 'São João', color: 'text-orange-400' }],
  '07-04': [{ emoji: '🦅', label: 'Independência EUA', color: 'text-blue-400' }],
  '08-11': [{ emoji: '👨', label: 'Dia dos Pais', color: 'text-blue-400' }],
  '08-15': [{ emoji: '👨', label: 'Dia dos Pais', color: 'text-blue-400' }],
  '09-07': [{ emoji: '🇧🇷', label: 'Independência do Brasil', color: 'text-green-400' }],
  '10-04': [{ emoji: '🍂', label: 'Dia dos Animais', color: 'text-orange-400' }],
  '10-12': [{ emoji: '🏛️', label: 'Nossa Sra. Aparecida', color: 'text-blue-400' }],
  '10-15': [{ emoji: '🎓', label: 'Dia do Professor', color: 'text-yellow-400' }],
  '10-31': [{ emoji: '🎃', label: 'Halloween', color: 'text-orange-400' }],
  '11-02': [{ emoji: '🕯️', label: 'Finados', color: 'text-gray-400' }],
  '11-15': [{ emoji: '🇧🇷', label: 'Proclamação da República', color: 'text-green-400' }],
  '11-20': [{ emoji: '✊', label: 'Consciência Negra', color: 'text-yellow-400' }],
  '11-28': [{ emoji: '🛍️', label: 'Black Friday', color: 'text-gray-100' }],
  '11-29': [{ emoji: '💻', label: 'Cyber Monday', color: 'text-blue-400' }],
  '12-01': [{ emoji: '❤️‍🔥', label: 'Dia Mundial da AIDS', color: 'text-red-400' }],
  '12-08': [{ emoji: '🙏', label: 'Imaculada Conceição', color: 'text-blue-400' }],
  '12-24': [{ emoji: '🎄', label: 'Véspera de Natal', color: 'text-green-400' }],
  '12-25': [{ emoji: '🎅', label: 'Natal', color: 'text-red-400' }],
  '12-31': [{ emoji: '🥂', label: 'Réveillon', color: 'text-yellow-400' }],
}

// Datas móveis aproximadas
function getMobileHolidays(year: number): Record<string, { emoji: string; label: string; color: string }[]> {
  return {
    [`${year}-11-28`]: [{ emoji: '🛍️', label: 'Black Friday', color: 'text-white' }],
  }
}

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export default function SeasonalCalendar() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function getDayEvents(day: number) {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const key = `${mm}-${dd}`
    return SEASONAL[key] ?? []
  }

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null) }

  const selectedEvents = selectedDay ? getDayEvents(parseInt(selectedDay)) : []

  // Collect all events this month
  const monthEvents: { day: number; events: typeof SEASONAL[string] }[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const evs = getDayEvents(d)
    if (evs.length) monthEvents.push({ day: d, events: evs })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <CalendarDays size={15} className="text-red-500" />
        <h2 className="font-medium text-gray-900 text-sm">Datas Sazonais</h2>
      </div>

      <div className="p-5">
        {/* Nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <h3 className="font-semibold text-gray-900 text-sm">{MONTHS_PT[month]} {year}</h3>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Days header */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_PT.map(d => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const events = getDayEvents(day)
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const isSelected = selectedDay === String(day)
            const hasEvent = events.length > 0

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : String(day))}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors
                  ${isSelected ? 'bg-red-600 text-white' : isToday ? 'bg-red-100 text-red-700' : hasEvent ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-gray-50 text-gray-600'}
                `}
              >
                {day}
                {hasEvent && !isSelected && (
                  <div className="flex gap-0.5 mt-0.5">
                    {events.slice(0,3).map((_, ei) => (
                      <div key={ei} className="w-1 h-1 rounded-full bg-red-500" />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day events */}
        {selectedDay && selectedEvents.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-600">
              {String(selectedDay).padStart(2,'0')}/{String(month+1).padStart(2,'0')} — Datas comemorativas
            </p>
            {selectedEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-lg">{ev.emoji}</span>
                <span className={`text-sm font-medium ${ev.color}`}>{ev.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Month summary */}
        {monthEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Datas do mês
            </p>
            <div className="space-y-1.5">
              {monthEvents.map(({ day, events }) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-8 font-mono">
                    {String(day).padStart(2,'0')}/{String(month+1).padStart(2,'0')}
                  </span>
                  {events.map((ev, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span>{ev.emoji}</span>
                      <span className="text-xs text-gray-600">{ev.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {monthEvents.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">Nenhuma data comemorativa relevante neste mês.</p>
        )}
      </div>
    </div>
  )
}
