import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Bar, BarChart } from 'recharts'
import { useAppStore } from '../store'
import { useMemo } from 'react'
import dayjs from 'dayjs' // Usado para calcular datas e meses

// Função helper para formatar dinheiro
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Nomes dos meses para os gráficos
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Reports(){
  // Busca os dados REAIS do store
  const { reservations, clients, categories } = useAppStore(s => ({
    reservations: s.reservations,
    clients: s.clients,
    categories: s.categories
  }))

  // Calcula todas as métricas
  const {
    receitaTotal,
    totalAlugueis,
    clientesUnicos,
    ticketMedio,
    receitaMensal,
    alugueisMensal
  } = useMemo(() => {
    
    let receitaMensal = MESES.map(m => ({ mes: m, valor: 0 }))
    let alugueisMensal = MESES.map(m => ({ mes: m, qtd: 0 }))
    
    let receitaTotalCalc = 0
    let totalAlugueisCalc = 0
    let clientesUnicosCalc = clients.length

    for (const r of reservations) {
      if (r.status === 'Cancelada') {
        continue
      }
      
      totalAlugueisCalc += 1;

      const category = categories.find(c => c.id === r.categoryId)
      const pricePerDay = category?.pricePerDay || 0

      const start = dayjs(r.pickupDate)
      const end = dayjs(r.returnDate)
      const duration = end.diff(start, 'day') + 1 
      
      const totalCost = (duration > 0 ? duration * pricePerDay : 0)

      receitaTotalCalc += totalCost

      const monthIndex = start.month()
      if (receitaMensal[monthIndex]) {
        receitaMensal[monthIndex].valor += totalCost
      }
      if (alugueisMensal[monthIndex]) {
        alugueisMensal[monthIndex].qtd += 1
      }
    }

    const ticketMedioCalc = totalAlugueisCalc > 0 ? (receitaTotalCalc / totalAlugueisCalc) : 0

    return {
      receitaTotal: receitaTotalCalc,
      totalAlugueis: totalAlugueisCalc,
      clientesUnicos: clientesUnicosCalc,
      ticketMedio: ticketMedioCalc,
      receitaMensal,
      alugueisMensal
    }

  }, [reservations, clients, categories])


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-blue">Relatórios</h2>
        <p className="text-gray-500">Análise detalhada do desempenho</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">Receita Total</div>
          <div className="text-2xl font-bold">{formatCurrency(receitaTotal)}</div>
          <div className="text-xs text-gray-400">Total faturado</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Total de Aluguéis</div>
          <div className="text-2xl font-bold">{totalAlugueis}</div>
          <div className="text-xs text-gray-400">Reservas (não canceladas)</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Clientes Únicos</div>
          <div className="text-2xl font-bold">{clientesUnicos}</div>
          <div className="text-xs text-gray-400">Total na base</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Ticket Médio</div>
          <div className="text-2xl font-bold">{formatCurrency(ticketMedio)}</div>
          <div className="text-xs text-gray-400">Receita / Aluguel</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-medium mb-3">Receita Mensal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={receitaMensal}> 
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="valor" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-medium mb-3">Número de Aluguéis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alugueisMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qtd" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}