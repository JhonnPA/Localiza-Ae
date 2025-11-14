import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { useMemo } from 'react';

export default function Categories(){
  const nav = useNavigate()
  const categories = useAppStore(s=>s.categories)
  const reservations = useAppStore(s=>s.reservations) // Pega as reservas ativas
  const setSel = useAppStore(s=>s.setSelectedCategory)

  // 1. Calcula o stock disponível por categoria
  const availableStockMap = useMemo(() => {
    // Conta quantas reservas ativas existem por categoryId
    const activeRentals = reservations.filter(r => r.status === 'Ativa');
    const rentalCounts = activeRentals.reduce((acc, r) => {
        acc[r.categoryId] = (acc[r.categoryId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calcula o stock final para cada categoria
    return categories.reduce((acc, cat) => {
        const rented = rentalCounts[cat.id] || 0;
        acc[cat.id] = cat.stock - rented;
        return acc;
    }, {} as Record<string, number>);
  }, [categories, reservations]);


  // 2. Cria a lista ordenada por preço
  const sortedCategories = [...categories].sort((a, b) => a.pricePerDay - b.pricePerDay);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-brand-blue mb-2">Categorias</h2>
      <p className="text-gray-500 mb-6">Escolha a categoria ideal</p>
      <div className="grid lg:grid-cols-3 gap-6">
        
        {sortedCategories.map(c=> (
          <div key={c.id} className="card overflow-hidden">
            
            <div 
              className="h-48 bg-cover bg-center" 
              style={{backgroundImage:`url('${c.image}')`}}
            />

            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{c.name}</h3>
                
                <span className="text-sm bg-brand-yellow/30 text-brand-dark px-2 py-1 rounded-md">
                    {availableStockMap[c.id]} disponíveis
                </span>
                
              </div>
              <div className="text-2xl font-bold">R$ {c.pricePerDay}</div>
              <div className="text-sm text-gray-600">por dia</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {c.features.map(f=><span key={f} className="badge bg-gray-100">{f}</span>)}
              </div>
              <button onClick={()=>{ setSel(c.id); nav('/nova-reserva') }} className="btn btn-primary w-full mt-2">Selecionar Categoria</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}