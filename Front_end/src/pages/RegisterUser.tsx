import { useState } from 'react'
import { useAppStore } from '../store'

// Estado inicial do formulário
const initialState = {
  name: '',
  email: '',
  senha: '',
}

export default function RegisterUserPage() {
  const [form, setForm] = useState(initialState)
  const registerUser = useAppStore(s => s.registerUser)

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.senha) {
      alert('Preencha todos os campos!')
      return
    }

    try {
      await registerUser(form)
      alert('Novo funcionário cadastrado com sucesso!')
      setForm(initialState)
    } catch (error: any) {
      alert(`Erro ao cadastrar funcionário: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-brand-blue">Cadastrar Novo Funcionário</h2>
        <p className="text-gray-500">Crie um novo acesso de utilizador para o sistema.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={submit} className="card p-5 space-y-4">
          <div>
            <label className="text-sm text-gray-600">Nome Completo</label>
            <input 
              className="input" 
              value={form.name} 
              onChange={e => set('name', e.target.value)} 
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input 
              type="email"
              className="input" 
              value={form.email} 
              onChange={e => set('email', e.target.value)} 
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Senha</label>
            <input 
              type="password"
              className="input" 
              value={form.senha} 
              onChange={e => set('senha', e.target.value)} 
            />
          </div>
          <button className="btn btn-primary w-full">Cadastrar Funcionário</button>
        </form>
      </div>
    </div>
  )
}