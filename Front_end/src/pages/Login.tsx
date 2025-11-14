import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store' 

export default function Login(){
  const nav = useNavigate()
  const [email,setEmail] = useState('funcionario@empresa.com')
  const [senha,setSenha] = useState('123456')
  const setUser = useAppStore(s => s.setUser) 

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    
    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      })

      if (!response.ok) {
        alert('Email ou senha inválidos!')
        return
      }

      const data = await response.json()

      localStorage.setItem('token', data.token)
      setUser(data.user)
      nav('/dashboard')

    } catch (error) {
      console.error('Falha ao fazer login:', error)
      alert('Erro ao conectar com o servidor. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(ellipse_at_top,_#E6F1FF,_#F6FAFF)]">
      <div className="grid md:grid-cols-2 gap-0 card overflow-hidden w-[1000px]">
        <div className="h-[560px] bg-cover bg-center"
          style={{backgroundImage:"url('https://images.unsplash.com/photo-1549921296-3ecf9f2c3860?q=80&w=1600&auto=format&fit=crop')"}}/>
        <div className="p-10">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.svg" className="h-10 w-10 rounded-xl"/>
            <h1 className="text-3xl font-extrabold text-brand-blue">Localiza-ae</h1>
          </div>
          <p className="text-gray-600 mb-6">Sistema de Aluguel de Carros para Funcionários</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} type="email"/>
            </div>
            <div>
              <label className="text-sm text-gray-600">Senha</label>
              <input className="input" value={senha} onChange={e=>setSenha(e.target.value)} type="password"/>
            </div>
            <button className="btn btn-accent w-full">Entrar</button>
          </form>
          <p className="text-xs text-gray-500 mt-6">Use qualquer email e senha para acessar o sistema</p>
        </div>
      </div>
    </div>
  )
}