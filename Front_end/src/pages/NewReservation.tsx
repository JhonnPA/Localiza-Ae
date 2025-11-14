import { useAppStore } from '../store'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import dayjs from 'dayjs'

// Tipo para o formulário do novo cliente
const newClientFormInitial = {
  id: '',
  name: '',
  cpf: '',
  phone: '',
  email: ''
}

export default function NewReservation(){
  const nav = useNavigate()
  const { clients, categories, addReservation, addClient } = useAppStore(s => ({
    clients: s.clients,
    categories: s.categories,
    addReservation: s.addReservation,
    addClient: s.addClient,
  }))
  const selectedCategoryId = useAppStore(s=>s.selectedCategoryId)

  // --- Estados do formulário principal ---
  const [cpfInput, setCpfInput] = useState('')
  const [clientName, setClientName] = useState('')
  const [form, setForm] = useState({
    categoryId: selectedCategoryId || '',
    pickupDate: '', returnDate:'',
    pickupTime: '', returnTime:'',
    pickupLocation:'Matriz', returnLocation:'Matriz',
    clientId: '',
  })
  
  // --- Estados do Modal de Novo Cliente ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newClientForm, setNewClientForm] = useState(newClientFormInitial)
  
  const set = (k: string, v: string)=> setForm(prev=>({...prev, [k]: v}))

  // --- Lógica de busca automática por CPF ---
  const [clientFound, setClientFound] = useState(false)
  
  useEffect(() => {
    const cleanCpf = cpfInput.replace(/[.-]/g, '')
    const foundClient = clients.find(c => 
      c.cpf.replace(/[.-]/g, '') === cleanCpf
    )

    if (foundClient) {
      setClientName(foundClient.name)
      set('clientId', foundClient.id)
      setClientFound(true)
    } else {
      setClientName('')
      set('clientId', '')
      setClientFound(false)
    }
  }, [cpfInput, clients])
  

  // --- Funções do Modal ---
  const openNewClientModal = () => {
    setNewClientForm({
      ...newClientFormInitial,
      cpf: cpfInput,
      id: crypto.randomUUID().slice(0, 8)
    })
    setIsModalOpen(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newClient = await addClient(newClientForm);
      alert('Cliente salvo com sucesso!');
      setIsModalOpen(false);
      
      // Atualização direta
      setCpfInput(newClient.cpf);
      setClientName(newClient.name);
      set('clientId', newClient.id);
      setClientFound(true);

    } catch (error: any) {
      alert(`Erro ao salvar cliente: ${error.message}`);
    }
  }

  // --- Submissão do Formulário Principal ---
  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    if(!form.categoryId || !form.pickupDate || !form.returnDate || !form.clientId){ 
      alert('Preencha os campos obrigatórios (Categoria, Data Retirada, Data Devolução) e verifique se o CPF do cliente é válido.'); 
      return 
    }
    
    try {
      await addReservation(form) 
      alert('Reserva criada com sucesso!')
      nav('/dashboard')
    } catch (error) {
      alert('Falha ao criar reserva. Tente novamente.')
      console.error(error)
    }
  }

  // Lógica de cálculo de custo
  const { dailyPrice, totalDays, totalPrice } = useMemo(() => {
    const selectedCategory = categories.find(c => c.id === form.categoryId);
    const dailyPrice = selectedCategory ? selectedCategory.pricePerDay : 0;

    let totalDays = 0;
    if (form.pickupDate && form.returnDate) {
      const start = dayjs(form.pickupDate);
      const end = dayjs(form.returnDate);

      if (start.isValid() && end.isValid() && !end.isBefore(start, 'day')) {
        totalDays = end.diff(start, 'day') + 1;
      }
    }
    
    const totalPrice = dailyPrice * totalDays;
    return { dailyPrice, totalDays, totalPrice };

  }, [form.categoryId, form.pickupDate, form.returnDate, categories]);


  return (
    <>
      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-blue">Nova Reserva</h2>
          <form onSubmit={submit} className="card p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Categoria</label>
                <select className="input" value={form.categoryId} onChange={e=>set('categoryId', e.target.value)}>
                  <option value="">Selecione</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">CPF do Cliente</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="input"
                    placeholder="Digite o CPF..."
                    value={cpfInput}
                    onChange={e => setCpfInput(e.target.value)}
                  />
                  {!clientFound && cpfInput.length > 5 && (
                    <button 
                      type="button"
                      onClick={openNewClientModal} 
                      className="btn btn-primary text-sm whitespace-nowrap"
                    >
                      Novo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Nome do Cliente</label>
                <input 
                  type="text"
                  className="input bg-gray-100"
                  placeholder="-"
                  value={clientName}
                  disabled
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Data de Retirada</label>
                <input type="date" className="input" value={form.pickupDate} onChange={e=>set('pickupDate', e.target.value)}/>
              </div>
              <div>
                <label className="text-sm text-gray-600">Data de Devolução</label>
                <input type="date" className="input" value={form.returnDate} onChange={e=>set('returnDate', e.target.value)}/>
              </div>
              <div>
                <label className="text-sm text-gray-600">Horário de Retirada</label>
                <input type="time" className="input" value={form.pickupTime} onChange={e=>set('pickupTime', e.target.value)}/>
              </div>
              <div>
                <label className="text-sm text-gray-600">Horário de Devolução</label>
                <input type="time" className="input" value={form.returnTime} onChange={e=>set('returnTime', e.target.value)}/>
              </div>
              <div>
                <label className="text-sm text-gray-600">Local de Retirada</label>
                <select className="input" value={form.pickupLocation} onChange={e=>set('pickupLocation', e.target.value)}>
                  <option>Matriz</option><option>Aeroporto</option><option>Centro</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Local de Devolução</label>
                <select className="input" value={form.returnLocation} onChange={e=>set('returnLocation', e.target.value)}>
                  <option>Matriz</option><option>Aeroporto</option><option>Centro</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-accent w-full">Criar Reserva</button>
          </form>
        </div>
        
        <div className="space-y-4">
          
          {/* Resumo dos Custos atualizado */}
          <div className="card p-5">
            <h3 className="font-medium mb-3">Resumo dos Custos</h3>
            {!dailyPrice ? (
              <p className="text-sm text-gray-500">Selecione a categoria e as datas para ver os custos.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Diária da categoria</span>
                  <b>R$ {dailyPrice.toFixed(2)}</b>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total de dias</span>
                  <b>{totalDays > 0 ? totalDays : '-'}</b>
                </div>
                
                {totalDays > 0 && (
                  <>
                    <hr className="my-1"/>
                    <div className="flex justify-between font-bold text-lg text-brand-blue">
                      <span>Valor Total</span>
                      <b>R$ {totalPrice.toFixed(2)}</b>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-medium mb-2">Informações Importantes</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>⏰ Horário: Seg-Sex 7h–22h | Sáb-Dom 8h–20h</li>
              <li>🪪 Documentos: CNH válida e cartão de crédito</li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- Modal de Novo Cliente --- */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Novo Cliente">
        <form onSubmit={handleSaveClient} className="space-y-4">
          <input type="hidden" value={newClientForm.id} />
          <div>
            <label className="text-sm text-gray-600">CPF</label>
            <input 
              className="input bg-gray-100" 
              value={newClientForm.cpf} 
              disabled 
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Nome Completo</label>
            <input 
              className="input" 
              value={newClientForm.name} 
              onChange={e => setNewClientForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input 
              type="email"
              className="input" 
              value={newClientForm.email} 
              onChange={e => setNewClientForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Telefone</label>
            <input 
              className="input" 
              value={newClientForm.phone} 
              onChange={e => setNewClientForm(f => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">Salvar Cliente</button>
        </form>
      </Modal>
    </>
  )
}