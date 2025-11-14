import { useState } from 'react'
import { useAppStore } from '../store'

function daysInMonth(year:number, month:number){
  return new Date(year, month+1, 0).getDate()
}

export default function CalendarPage(){
  // Pega a nova função
  const { res, clients, categories, updateReservationStatus } = useAppStore(s => ({
    res: s.reservations,
    clients: s.clients,
    categories: s.categories,
    updateReservationStatus: s.updateReservationStatus
  }))

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selDay, setSelDay] = useState<number|undefined>()

  const totalDays = daysInMonth(year, month)
  const days = [...Array(totalDays)].map((_,i)=>i+1)
  const isoMonth = String(month+1).padStart(2,'0')

  // Handler para o botão
  const handleCompleteRental = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja marcar esta reserva como "Concluída"?')) {
      try {
        await updateReservationStatus(id, 'Concluída')
        alert('Reserva concluída com sucesso.')
      } catch (error: any) {
        alert(`Erro ao concluir reserva: ${error.message}`)
      }
    }
  }

  // Correção da data
  const reservationsByDay = (d:number) => {
    const searchDate = `${year}-${isoMonth}-${String(d).padStart(2,'0')}`
    return res.filter(r => r.pickupDate.startsWith(searchDate))
  }
  
  const onPrev=()=> setMonth(m=> m===0 ? (setYear(y=>y-1), 11) : m-1)
  const onNext=()=> setMonth(m=> m===11 ? (setYear(y=>y+1), 0) : m+1)

  const selectedList = selDay ? reservationsByDay(selDay) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-brand-blue">Calendário de Reservas</h2>
        <div className="flex gap-2">
          <button className="btn border" onClick={onPrev}>‹</button>
          <div className="px-3 py-2 bg-white rounded-lg">{new Date(year,month).toLocaleString('pt-BR', { month:'long', year:'numeric' })}</div>
          <button className="btn border" onClick={onNext}>›</button>
        </div>
      </div>
      <div className="card p-5">
        <div className="grid grid-cols-7 gap-2">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(h => <div key={h} className="text-xs text-gray-500">{h}</div>)}
          {days.map(d => {
            const count = reservationsByDay(d).length
            return (
              <button key={d} onClick={()=>setSelDay(d)}
                className={`h-20 rounded-lg border flex items-center justify-center relative ${count>0?'bg-brand-yellow/20 border-brand-yellow':'bg-white hover:bg-gray-50'}`}>
                {d}
                {count>0 && <span className="absolute top-1 right-1 text-[10px] px-1 rounded bg-brand-blue text-white">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>
      <div className="card p-5">
        <h3 className="font-medium mb-2">{selDay? `Reservas em ${String(selDay).padStart(2,'0')}/${String(month+1).padStart(2,'0')}/${year}` : 'Selecione um dia'}</h3>
        {selectedList.length===0 ? <p className="text-sm text-gray-500">Nenhuma reserva neste dia.</p> : (
          <ul className="space-y-2">
            {selectedList.map(r=>{
              const c = clients.find(x=>x.id===r.clientId)
              const cat = categories.find(x=>x.id===r.categoryId)
              return (
                <li key={r.id} className="border p-3 rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c?.name}</div>
                    <div className="text-xs text-gray-500">{cat?.name} • Retirada {r.pickupTime || ''} • {r.pickupLocation}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${r.status==='Ativa'?'badge-success':'badge-muted'}`}>{r.status}</span>
                    {r.status === 'Ativa' && (
                      <button 
                        onClick={() => handleCompleteRental(r.id)}
                        className="text-xs link"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}