import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Car, LayoutDashboard, Calendar, Users, FileBarChart, Tag, LogOut, UserPlus } from 'lucide-react'
import { useAppStore } from '../store'
import { useEffect } from 'react' // Importa o useEffect

// Lista completa de todos os itens de menu
const allItems = [
  { to:'/dashboard', label:'Visão Geral', icon:<LayoutDashboard size={18}/>, role: 'any' },
  { to:'/categorias', label:'Categorias', icon:<Tag size={18}/>, role: 'any' },
  { to:'/nova-reserva', label:'Nova Reserva', icon:<Car size={18}/>, role: 'any' },
  { to:'/clientes', label:'Clientes', icon:<Users size={18}/>, role: 'any' },
  { to:'/registrar-funcionario', label:'Novo Funcionário', icon:<UserPlus size={18}/>, role: 'gerente' }, // <-- SÓ GERENTE
  { to:'/relatorios', label:'Relatórios', icon:<FileBarChart size={18}/>, role: 'gerente' }, // <-- SÓ GERENTE
  { to:'/calendario', label:'Calendário', icon:<Calendar size={18}/>, role: 'any' },
]

export default function Shell(){
  const navigate = useNavigate()
  // Pega o utilizador, a função logout, e a função loadData
  const user = useAppStore(s => s.user)
  const logout = useAppStore(s => s.logout)
  const loadData = useAppStore(s => s.loadData)

  // Filtra o menu com base na role
  const items = allItems.filter(item => {
    if (item.role === 'gerente') {
      return user?.role === 'gerente' // Mostra se a role for 'gerente'
    }
    return true // Mostra se a role for 'any'
  })

  // Função de Sair atualizada
  const handleLogout = () => {
    logout() // Limpa o store e o localStorage
    navigate('/') // Redireciona para o login
  }

  // Roda esta função UMA VEZ quando o componente é montado
  useEffect(() => {
    loadData() // Busca os dados da API
  }, [loadData])
  
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-brand-bg">
      <aside className="bg-white border-r">
        <div className="p-4 flex items-center gap-3">
          <img src="/logo.svg" className="h-9 w-9 rounded-xl" />
          <div>
            <div className="font-semibold text-brand-blue">Localiza-ae</div>
            {/* Mostra o email do utilizador logado */}
            <a className="text-xs text-brand-blue underline" href={`mailto:${user?.email}`}>{user?.email}</a>
          </div>
        </div>
        <nav className="px-2 mt-2">
          {items.map(i=> ( // Usa a lista 'items' filtrada
            <NavLink key={i.to} to={i.to}
              className={({isActive})=>`flex items-center gap-2 px-3 py-2 rounded-md mb-1 transition ${isActive?'bg-brand-blue text-white':'hover:bg-gray-100'}`}>
              {i.icon}<span>{i.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-brand-blue">
            <LogOut size={18}/> Sair
          </button>
        </div>
      </aside>
      <main className="p-6">
        <Outlet/>
      </main>
    </div>
  )
}