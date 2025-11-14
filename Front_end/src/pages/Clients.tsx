import { useState, useMemo } from 'react'
import { useAppStore } from '../store'
import Modal from '../components/Modal'
import dayjs from 'dayjs'

export default function Clients(){
  const { clients, reservations, deleteClient, categories, updateClientStatus, updateReservationStatus } = useAppStore(s => ({
    clients: s.clients,
    reservations: s.reservations,
    deleteClient: s.deleteClient,
    categories: s.categories,
    updateClientStatus: s.updateClientStatus,
    updateReservationStatus: s.updateReservationStatus
  }))
  
  const [q,setQ] = useState('')
  const [open,setOpen] = useState(false)
  const [sel,setSel] = useState<string|undefined>()

  const filtered = clients.filter(c => [c.name, c.cpf, c.phone, c.email].some(v=>v.toLowerCase().includes(q.toLowerCase())))
  const selected = clients.find(c=>c.id===sel)

  // Handler para Concluir a Reserva (dentro do modal)
  const handleCompleteRental = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja marcar esta reserva como "Concluída"?')) {
      try {
        await updateReservationStatus(id, 'Concluída')
      } catch (error: any) {
        alert(`Erro ao concluir reserva: ${error.message}`)
      }
    }
  }

  // Handler para Inativar/Ativar
  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'Ativar' : 'Inativar';
    
    if (window.confirm(`Tem a certeza que deseja ${action} o cliente ${name}?`)) {
        try {
            await updateClientStatus(id, newStatus);
            alert(`Cliente ${action.toLowerCase()} com sucesso!`);
        } catch (error: any) {
            alert(`Erro ao ${action.toLowerCase()} cliente: ${error.message}`);
        }
    }
  }

  // Calcula o histórico de reservas do cliente selecionado
  const selectedClientReservations = useMemo(() => {
    if (!selected) return [];
    
    const history = reservations.filter(r => r.clientId === selected.id);

    return history.map(r => {
      const cat = categories.find(x => x.id === r.categoryId);
      const pricePerDay = cat?.pricePerDay || 0;
      let totalCost = 0;
      let duration = 0;

      if (r.pickupDate && r.returnDate) {
        const start = dayjs(r.pickupDate);
        const end = dayjs(r.returnDate);
        duration = end.diff(start, 'day') + 1;
        if (duration > 0) {
          totalCost = duration * pricePerDay;
        }
      }
      
      return {
        ...r,
        categoryName: cat?.name || 'Indefinida',
        totalCost: totalCost,
        duration: duration,
        image: cat?.image,
      };
    }).sort((a, b) => dayjs(b.pickupDate).valueOf() - dayjs(a.pickupDate).valueOf());

  }, [selected, reservations, categories]);


  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem a certeza que deseja excluir ${name}? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteClient(id)
        alert('Cliente excluído com sucesso.')
      } catch (error: any) {
        alert(`Erro ao excluir cliente: ${error.message}`)
      }
    }
  }

  const clientsWithActiveRental = useMemo(() => {
    const activeClientIds = new Set(
      reservations.filter(r => r.status === 'Ativa').map(r => r.clientId)
    )
    return activeClientIds.size
  }, [reservations])


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-blue">Clientes</h2>
        <p className="text-gray-500">Busque e visualize informações</p>
      </div>
      <div className="card p-5">
        <div className="flex gap-2 mb-4">
          <input className="input" placeholder="Digite nome, CPF, telefone ou email..." value={q} onChange={e=>setQ(e.target.value)}/>
          <button className="btn btn-primary">Buscar</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">CPF</th>
                <th className="text-left px-4 py-3">Telefone</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Aluguel Ativo?</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>{
                const hasActiveRental = reservations.some(r => r.clientId === c.id && r.status === 'Ativa')
                
                return (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">{c.cpf}</td>
                    <td className="px-4 py-3">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${c.active?'badge-success':'badge-muted'}`}>{c.active?'Ativo':'Inativo'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {hasActiveRental ? (
                        <span className="badge badge-success">Sim</span>
                      ) : (
                        <span className="text-gray-500">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                      <button onClick={()=>{setSel(c.id); setOpen(true)}} className="link">Ver Detalhes</button>
                      
                      {c.active ? (
                          <button onClick={() => handleToggleStatus(c.id, c.active, c.name)} className="link text-orange-600">
                            Inativar
                          </button>
                      ) : (
                          <button onClick={() => handleToggleStatus(c.id, c.active, c.name)} className="link text-green-600">
                            Ativar
                          </button>
                      )}
                      
                      <button onClick={() => handleDelete(c.id, c.name)} className="link text-red-600">Excluir</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="card p-4"><div className="text-2xl font-bold">{clients.length}</div><div className="text-xs text-gray-500">Total Clientes</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">{clients.filter(c=>c.active).length}</div><div className="text-xs text-gray-500">Clientes Ativos</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">{clientsWithActiveRental}</div><div className="text-xs text-gray-500">Com Aluguel Ativo</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">12</div><div className="text-xs text-gray-500">Média Aluguéis</div></div>
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title="Detalhes do Cliente">
        {selected ? (
          <div className="space-y-4">
            {/* Informações Básicas do Cliente */}
            <div className="space-y-1 text-sm border-b pb-3">
              <div><b>Nome:</b> {selected.name}</div>
              <div><b>Email:</b> {selected.email}</div>
              <div><b>CPF:</b> {selected.cpf}</div>
              <div><b>Telefone:</b> {selected.phone}</div>
              <div><b>Status:</b> {selected.active?'Ativo':'Inativo'}</div>
            </div>

            {/* Histórico de Reservas */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Histórico de Reservas ({selectedClientReservations.length})</h3>
              
              {selectedClientReservations.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma reserva encontrada.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {selectedClientReservations.map((r, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-gray-50 flex gap-4">
                      <div 
                        className="w-20 h-16 bg-cover bg-center rounded-md" 
                        style={{backgroundImage: `url('${r.image}')`}}
                      />
                      <div className="text-xs flex-1 space-y-1">
                        <div className="font-medium text-brand-blue">
                          {r.categoryName}
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Retirada:</span>
                            <b>{dayjs(r.pickupDate).format('DD/MM/YYYY')}</b>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Devolução:</span>
                            <b>{dayjs(r.returnDate).format('DD/MM/YYYY')}</b>
                        </div>
                        <div className="flex justify-between items-center pt-1 font-bold text-sm">
                            <div className="flex items-center gap-2">
                                <span className={`badge ${r.status==='Concluída'?'badge-muted':'badge-success'}`}>
                                    {r.status}
                                </span>
                                {r.status === 'Ativa' && (
                                    <button 
                                        onClick={() => handleCompleteRental(r.id)} 
                                        className="text-xs link text-brand-blue font-normal"
                                    >
                                        Concluir
                                    </button>
                                )}
                            </div>
                            <span className="text-brand-dark">
                                R$ {r.totalCost.toFixed(2)}
                            </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ): <p>Nenhum cliente selecionado.</p>}
      </Modal>
    </div>
  )
}