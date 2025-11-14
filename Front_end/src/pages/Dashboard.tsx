import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { Car, Users, DollarSign, Boxes } from 'lucide-react'
import dayjs from 'dayjs'

// Define um tipo para os nossos cartões
type CardData = {
  t: string;
  v: string | number;
  sub: string;
  icon: JSX.Element;
}

export default function Dashboard(){
  const nav = useNavigate()
  
  const { reservations, clients, categories, updateReservationStatus, user } = useAppStore(s => ({
    reservations: s.reservations,
    clients: s.clients,
    categories: s.categories,
    updateReservationStatus: s.updateReservationStatus,
    user: s.user
  }))

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

  // Cálculo do Total de Carros Disponíveis
  const totalInventory = categories.reduce((a,c)=>a+c.stock,0);
  const totalActiveRentals = reservations.filter(r => r.status === 'Ativa').length;
  const totalCarsAvailable = totalInventory - totalActiveRentals;

  // Cálculo da Receita Mensal
  const totalReceitaMensal = (user?.role === 'gerente') ? reservations.reduce((acc, r) => {
    if (r.status === 'Cancelada') return acc;
    const cat = categories.find(c => c.id === r.categoryId);
    const pricePerDay = cat?.pricePerDay || 0;
    const start = dayjs(r.pickupDate);
    const end = dayjs(r.returnDate);
    const duration = end.diff(start, 'day') + 1;
    const totalCost = (duration > 0 ? duration * pricePerDay : 0);
    return acc + totalCost;
  }, 0) : 0;
  
  // --- Monta a lista de cards ---
  const cards: CardData[] = [
    { t:'Reservas Ativas', v: reservations.filter(r=>r.status==='Ativa').length, sub:'+12% vs mês anterior', icon:<Boxes/> },
    { t:'Clientes Ativos', v: clients.filter(c=>c.active).length, sub:'+8% vs mês anterior', icon:<Users/> },
  ];

  if (user?.role === 'gerente') {
    cards.push({ 
      t:'Receita Mensal', 
      v: totalReceitaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
      sub:'+20% vs mês anterior', 
      icon:<DollarSign/> 
    });
  }

  cards.push({ 
    t:'Carros Disponíveis', 
    v: totalCarsAvailable, // Usa o valor calculado
    sub:'Disponível para aluguel', // Altera a legenda
    icon:<Car/> 
  });


  const recent = reservations.slice(-3).reverse()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-brand-blue">Bem-vindo ao Localiza-ae</h2>
          <p className="text-gray-500">Sistema completo de aluguel de carros para funcionários</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>nav('/nova-reserva')} className="btn btn-accent">Nova Reserva</button>
          <button onClick={()=>nav('/calendario')} className="btn btn-primary">Ver Calendário</button>
        </div>
      </div>

      <div className={`grid md:grid-cols-${user?.role === 'gerente' ? '4' : '3'} gap-6`}>
        {cards.map((c,i)=>(
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{c.t}</div>
                <div className="text-2xl font-bold mt-1">{c.v}</div>
                <div className="text-xs text-green-600 mt-1">{c.sub}</div>
              </div>
              <div className="text-brand-blue">{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-medium mb-3">Reservas Recentes</h3>
          {recent.length===0 && <p className="text-sm text-gray-500">Sem reservas ainda.</p>}
          <ul className="space-y-3">
            {recent.map(r=>{
              const c = useAppStore.getState().clients.find(x=>x.id===r.clientId)
              const cat = useAppStore.getState().categories.find(x=>x.id===r.categoryId)

              const pricePerDay = cat?.pricePerDay || 0;
              let totalCost = 0;
              if (r.pickupDate && r.returnDate) {
                const start = dayjs(r.pickupDate);
                const end = dayjs(r.returnDate);
                const duration = end.diff(start, 'day') + 1;
                if (duration > 0) {
                  totalCost = duration * pricePerDay;
                }
              }

              return (
                <li key={r.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <div className="font-medium">{c?.name}</div>
                    <div className="text-xs text-gray-500">{cat?.name} - {dayjs(r.pickupDate).format('DD/MM/YYYY')}</div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {totalCost > 0 && (
                      <b className="text-sm text-brand-blue">
                        {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </b>
                    )}
                    
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
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        
        <div className="card p-5">
          <h3 className="font-medium mb-3">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>nav('/nova-reserva')} className="btn btn-accent">Nova Reserva</button>
            <button onClick={()=>nav('/clientes')} className="btn border">Buscar Cliente</button>
            <button onClick={()=>nav('/categorias')} className="btn border">Categorias</button>
            
            {user?.role === 'gerente' && (
              <button onClick={()=>nav('/relatorios')} className="btn border">Relatórios</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}