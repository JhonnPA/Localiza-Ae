import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store'
import Login from './pages/Login'
import Shell from './components/Shell'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import NewReservation from './pages/NewReservation'
import Clients from './pages/Clients'
import Reports from './pages/Reports'
import CalendarPage from './pages/Calendar'
import RegisterUserPage from './pages/RegisterUser' // Página de Registo

const isAuth = () => !!localStorage.getItem('token')

function Private({ children }: { children: JSX.Element }){
  return isAuth() ? children : <Navigate to="/" replace />
}

// Componente de Rota de Gestor
function ManagerRoute({ children }: { children: JSX.Element }){
  const user = useAppStore(s => s.user)
  
  // Está autenticado E tem a role 'gerente'?
  const isManager = isAuth() && user?.role === 'gerente';
  
  // Se for gestor, mostra a página. Se não, volta para o dashboard.
  return isManager ? children : <Navigate to="/dashboard" replace />
}

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route element={<Private><Shell/></Private>}>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/categorias" element={<Categories/>}/>
          <Route path="/nova-reserva" element={<NewReservation/>}/>
          <Route path="/clientes" element={<Clients/>}/>
          <Route path="/calendario" element={<CalendarPage/>}/>
          
          {/* Rotas protegidas pelo ManagerRoute */}
          <Route 
            path="/relatorios" 
            element={<ManagerRoute><Reports/></ManagerRoute>}
          />
          <Route 
            path="/registrar-funcionario" 
            element={<ManagerRoute><RegisterUserPage/></ManagerRoute>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}