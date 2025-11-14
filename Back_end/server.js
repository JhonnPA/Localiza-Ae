const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// *** Importa o pool (conexão com o DB) e a função seedDatabase ***
const { pool, seedDatabase } = require('./db_seeder');

const app = express();
const port = 3001;

const JWT_SECRET = 'sua-chave-secreta-aleatoria-e-longa-aqui'; 

// Middlewares 
app.use(cors());
app.use(express.json());

// Middleware de Autenticação
// Verifica se o token JWT existe e é válido
const checkAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) { return res.status(401).json({ message: 'Token de autenticação não fornecido.' }); }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) { return res.status(403).json({ message: 'Token inválido ou expirado.' }); }
    req.user = user;
    next();
  });
};

// Middleware de Gerente
// Verifica se o usuário autenticado tem a role 'gerente'
const checkManager = (req, res, next) => {
  if (req.user.role !== 'gerente') { return res.status(403).json({ message: 'Acesso negado: privilégios de gerente necessários.' }); }
  next();
};



// Rotas da API 


// Rota 1: LOGIN
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) { return res.status(400).json({ message: 'Email e senha são obrigatórios.' }); }
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) { return res.status(401).json({ message: 'Email ou senha inválidos.' }); }
    const user = userResult.rows[0];
    const isPasswordValid = (senha === user.password_plain); 
    if (!isPasswordValid) { return res.status(401).json({ message: 'Email ou senha inválidos.' }); }
    
    // Cria o token JWT com o payload do usuário e a role
    const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });
    
    res.json({ token: token, user: tokenPayload });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro de servidor' });
  }
});

// Rota 2: CRIAR NOVO FUNCIONÁRIO
app.post('/api/users', checkAuth, checkManager, async (req, res) => {
  const { name, email, senha } = req.body;
  if (!name || !email || !senha) { return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' }); }
  try {
    const queryText = `
      INSERT INTO users (name, email, password_plain, role)
      VALUES ($1, $2, $3, 'funcionario')
      RETURNING id, name, email, created_at, role;
    `;
    const values = [name, email, senha];
    const result = await pool.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar funcionário:', err);
    if (err.code === '23505') { return res.status(409).json({ message: 'Um utilizador com este email já existe.' }); }
    res.status(500).json({ message: 'Erro de servidor' });
  }
});

// Rota 3: OBTER LISTA DE CLIENTES
app.get('/api/clients', checkAuth, async (req, res) => { 
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY name');
    res.json(result.rows);
  } catch (err) { console.error('Erro ao buscar clientes:', err); res.status(500).json({ message: 'Erro de servidor' }); }
});

// Rota 4: ATUALIZAR STATUS DO CLIENTE
app.patch('/api/clients/:id/status', checkAuth, async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  if (typeof active !== 'boolean') { return res.status(400).json({ message: 'O status ativo deve ser um valor booleano.' }); }
  try {
    const queryText = 'UPDATE clients SET active = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(queryText, [active, id]);
    if (result.rows.length === 0) { return res.status(404).json({ message: 'Cliente não encontrado.' }); }
    res.status(200).json(result.rows[0]);
  } catch (err) { console.error('Erro ao atualizar status do cliente:', err); res.status(500).json({ message: 'Erro de servidor' }); }
});

// Rota 5: EXCLUIR CLIENTE
app.delete('/api/clients/:id', checkAuth, async (req, res) => { 
  const { id } = req.params;
  try {
    const clientResult = await pool.query('SELECT active FROM clients WHERE id = $1', [id]);
    if (clientResult.rows.length === 0) { return res.status(404).json({ message: 'Cliente não encontrado.' }); }
    
    const isActive = clientResult.rows[0].active;
    if (isActive) { return res.status(403).json({ message: 'Não é possível excluir um cliente ativo. Inative-o primeiro.' }); }

    // Deleta reservas antes de deletar o cliente (Foreign Key constraint)
    await pool.query('DELETE FROM reservations WHERE client_id = $1', [id]); 
    const deleteQuery = 'DELETE FROM clients WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [id]);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Erro fatal ao excluir cliente inativo:', err);
    res.status(500).json({ message: 'Erro de servidor' });
  }
});

// Rota 6: OBTER LISTA DE CATEGORIAS 
app.get('/api/categories', checkAuth, async (req, res) => { 
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    // Converte o tipo NUMERIC do postgres para float
    const categories = result.rows.map(c => ({ ...c, pricePerDay: parseFloat(c.price_per_day) }));
    res.json(categories);
  } catch (err) { console.error('Erro ao buscar categorias:', err); res.status(500).json({ message: 'Erro de servidor' }); }
});

// Rota 7: OBTER LISTA DE RESERVAS 
app.get('/api/reservations', checkAuth, async (req, res) => { 
  try {
    const result = await pool.query('SELECT * FROM reservations ORDER BY pickup_date DESC');
    // Ajusta o nome das colunas para o padrão do frontend (camelCase)
    const reservations = result.rows.map(r => ({ id: r.id, clientId: r.client_id, categoryId: r.category_id, pickupDate: r.pickup_date, returnDate: r.return_date, pickupTime: r.pickup_time, returnTime: r.return_time, pickupLocation: r.pickup_location, returnLocation: r.return_location, status: r.status }));
    res.json(reservations);
  } catch (err) { console.error('Erro ao buscar reservas:', err); res.status(500).json({ message: 'Erro de servidor' }); }
});

// Rota 8: CRIAR NOVA RESERVA
app.post('/api/reservations', checkAuth, async (req, res) => { 
  const { clientId, categoryId, pickupDate, returnDate, pickupTime, returnTime, pickupLocation, returnLocation } = req.body;
  if (!clientId || !categoryId || !pickupDate || !returnDate) { return res.status(400).json({ message: 'Campos obrigatórios faltando.' }); }
  const status = 'Ativa'; // Sempre começa como Ativa
  const queryText = `INSERT INTO reservations (client_id, category_id, pickup_date, return_date, pickup_time, return_time, pickup_location, return_location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;`;
  
  // Trata campos opcionais (TIME) como null se vazios
  const safePickupTime = pickupTime || null;
  const safeReturnTime = returnTime || null;
  const values = [ clientId, categoryId, pickupDate, returnDate, safePickupTime, safeReturnTime, pickupLocation, returnLocation, status ];
  
  try {
    const result = await pool.query(queryText, values);
    const newReservation = result.rows[0];
    const response = { id: newReservation.id, clientId: newReservation.client_id, categoryId: newReservation.category_id, pickupDate: newReservation.pickup_date, returnDate: newReservation.return_date, pickupTime: newReservation.pickup_time, returnTime: newReservation.return_time, pickupLocation: newReservation.pickup_location, returnLocation: newReservation.return_location, status: newReservation.status };
    res.status(201).json(response);
  } catch (err) { console.error('Erro ao criar reserva:', err); res.status(500).json({ message: 'Erro de servidor' }); }
});

// Rota 9: ATUALIZAR STATUS DA RESERVA (PRIVADA)
app.patch('/api/reservations/:id/status', checkAuth, async (req, res) => { 
  const { id } = req.params;
  const { status } = req.body; 
  if (!status) { return res.status(400).json({ message: 'Novo status é obrigatório.' }); }
  try {
    const queryText = 'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *';
    const values = [status, id];
    const result = await pool.query(queryText, values);
    if (result.rows.length === 0) { return res.status(404).json({ message: 'Reserva não encontrada.' }); }
    
    const updatedReservation = result.rows[0];
    const response = { id: updatedReservation.id, clientId: updatedReservation.client_id, categoryId: updatedReservation.category_id, pickupDate: updatedReservation.pickup_date, returnDate: updatedReservation.return_date, pickupTime: updatedReservation.pickup_time, returnTime: updatedReservation.return_time, pickupLocation: updatedReservation.pickup_location, returnLocation: updatedReservation.return_location, status: updatedReservation.status };
    res.status(200).json(response);
  } catch (err) { console.error('Erro ao atualizar status da reserva:', err); res.status(500).json({ message: 'Erro de servidor' }); }
});

// Rota 10: CRIAR NOVO CLIENTE (PRIVADA)
app.post('/api/clients', checkAuth, async (req, res) => { 
    const { id, name, cpf, phone, email } = req.body;
    if (!id || !name || !cpf || !phone || !email) { return res.status(400).json({ message: 'Todos os campos são obrigatórios.' }); }
    try {
        const queryText = `
            INSERT INTO clients (id, name, cpf, phone, email, active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING *;
        `;
        const values = [id, name, cpf, phone, email];
        const result = await pool.query(queryText, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar cliente:', err);
        if (err.code === '23505') { return res.status(409).json({ message: 'Cliente com este CPF ou Email já existe.' }); }
        res.status(500).json({ message: 'Erro de servidor' });
    }
});


async function startServer() {
    // Garante que o DB está pronto (tabelas e dados iniciais) antes de iniciar a API
    await seedDatabase(); 
    app.listen(port, () => {
        console.log(`Backend (API PROTEGIDA) rodando em http://localhost:${port}`);
    });
}

startServer();