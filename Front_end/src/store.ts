import create from 'zustand'

// Helper para "ler" o token
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// --- Tipos (Types) ---
export type Category = { id: string; name: string; pricePerDay: number; stock: number; features: string[]; image: string }
export type Client = { id: string; name: string; cpf: string; phone: string; email: string; active: boolean }
export type Reservation = {
  id: string; clientId: string; categoryId: string;
  pickupDate: string; returnDate: string;
  pickupTime: string; returnTime: string;
  pickupLocation: string; returnLocation: string;
  status: 'Ativa' | 'Concluída' | 'Cancelada'
}
type User = {
  id: string;
  name: string;
  email: string;
  role: 'gerente' | 'funcionario';
}
type ReservationForm = Omit<Reservation, 'id' | 'status'>
type NewClientForm = Omit<Client, 'active'>
type RegisterUserForm = { name: string; email: string; senha: string; }

// --- Estado da Aplicação (AppState) ---
type AppState = {
  user: User | null;
  categories: Category[]
  clients: Client[]
  reservations: Reservation[]
  selectedCategoryId?: string
  setSelectedCategory(id?: string): void
  setUser(user: User): void;
  logout(): void;
  loadData(): Promise<void>
  addReservation(r: ReservationForm): Promise<void>
  addClient(c: NewClientForm): Promise<Client>
  deleteClient(id: string): Promise<void>
  updateReservationStatus(id: string, status: Reservation['status']): Promise<void>
  updateClientStatus(id: string, active: boolean): Promise<void>;
  registerUser(u: RegisterUserForm): Promise<void>
}

// Inicialização
const token = localStorage.getItem('token');
const initialUser = token ? parseJwt(token) : null;
const defaultState = {
  categories: [], clients: [], reservations: [], user: initialUser, selectedCategoryId: undefined,
}

const API_URL = 'http://localhost:3001/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  ...defaultState,
  
  setSelectedCategory(id){ set({ selectedCategoryId: id }) },
  setUser(user) { set({ user }); },
  logout() {
    localStorage.removeItem('token');
    set({ ...defaultState, user: null, categories: [], clients: [], reservations: [] });
  },

  loadData: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; 
      const headers = getAuthHeaders();
      const [catRes, cliRes, resRes] = await Promise.all([
        fetch(`${API_URL}/categories`, { headers }),
        fetch(`${API_URL}/clients`, { headers }),
        fetch(`${API_URL}/reservations`, { headers })
      ]);
      if (!catRes.ok || !cliRes.ok || !resRes.ok) { get().logout(); throw new Error('Falha ao buscar dados da API ou token expirado'); }
      const categories = await catRes.json();
      const clients = await cliRes.json();
      const reservations = await resRes.json();
      set({ categories, clients, reservations });
    } catch (error) { console.error("Falha ao carregar dados:", error); }
  },

  addReservation: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/reservations`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(formData) });
      if (!response.ok) throw new Error('Falha ao criar reserva no backend');
      const newReservation = await response.json();
      set({ reservations: [...get().reservations, newReservation] });
    } catch (error) { console.error("Falha ao adicionar reserva:", error); throw error; }
  },

  addClient: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/clients`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(formData) });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Falha ao criar cliente no backend'); }
      const newClient = await response.json();
      set({ clients: [...get().clients, newClient] });
      return newClient;
    } catch (error) { console.error("Falha ao adicionar cliente:", error); throw error; }
  },


  deleteClient: async (id) => {
    try {
      const response = await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Falha ao excluir cliente'); }
      
      // Sucesso: remove o cliente E as reservas do estado local
      set(state => ({ 
        clients: state.clients.filter(c => c.id !== id),
        reservations: state.reservations.filter(r => r.clientId !== id) // <-- FILTRA AS RESERVAS
      }));
    } catch (error) { console.error("Falha ao excluir cliente:", error); throw error; }
  },

  updateReservationStatus: async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/reservations/${id}/status`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ status: status }) });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Falha ao atualizar status'); }
      const updatedReservation = await response.json();
      set({ reservations: get().reservations.map(r => r.id === id ? { ...r, status: updatedReservation.status } : r) });
    } catch (error) { console.error("Falha ao atualizar status da reserva:", error); throw error; }
  },

  updateClientStatus: async (id, active) => {
    try {
        const response = await fetch(`${API_URL}/clients/${id}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ active })
        });
        if (!response.ok) { 
            const err = await response.json(); 
            throw new Error(err.message || 'Falha ao atualizar status do cliente.'); 
        }
        const updatedClient = await response.json();
        set({ clients: get().clients.map(c => c.id === id ? { ...c, active: updatedClient.active } : c) });
    } catch (error) {
        console.error("Falha ao atualizar status do cliente:", error);
        throw error;
    }
  },

  registerUser: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/users`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(formData) });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Falha ao cadastrar utilizador'); }
      await response.json(); 
    } catch (error) {
      console.error("Falha ao cadastrar utilizador:", error);
      throw error;
    }
  }
}))