# Localiza-Ae
# 🚗 Localiza-ae: Sistema de Aluguel de Carros para Funcionários

Sistema completo de gestão de aluguel de carros desenvolvido em React (Frontend) e Node.js com PostgreSQL (Backend). Inclui autenticação, controle de acesso e cálculo de estoque em tempo real.

## ✨ Funcionalidades Destaque

* **Controle de Acesso (RBAC):** Restrição de acesso (menu e rotas) para o perfil **Gerente** (acesso a Relatórios e Cadastro de Funcionários).
* **Inventário Dinâmico:** Cálculo de carros disponíveis em tempo real (`Estoque - Reservas Ativas`).
* **Gestão de Clientes:** Busca por CPF, histórico de reservas no modal e opção de **inativação/exclusão** (Exclusão só permitida para clientes inativos).
* **Gestão Operacional:** Encerramento de reservas ("Concluir") no Dashboard e Calendário.

## 🛠️ Tecnologias Utilizadas

| Componente | Tecnologias |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Zustand (State Management), Tailwind CSS, dayjs |
| **Backend** | Node.js, Express (API), **PostgreSQL** (DB), **pg** (Driver), **jsonwebtoken** (JWT) |

## ⚙️ Configuração e Execução

O projeto é dividido em dois serviços que comunicam via API REST.

### 1. Configuração do Banco de Dados (PostgreSQL)

O projeto usa o PostgreSQL e assume que a estrutura e as credenciais são as seguintes:

| Credencial | Valor |
| :--- | :--- |
| **Porta** | `5433` |
| **Database** | `localiza_ae` |
| **Usuário** | `postgres` |
| **Senha** | `minhasenha` |

**Instruções de Setup:**

1.  Crie um banco de dados vazio chamado `localiza_ae`.
2.  O servidor **Backend** (ao ser iniciado) irá rodar automaticamente o script (`db_seeder.js`) para:
    * Criar todas as tabelas (`clients`, `reservations`, `users`, `categories`).
    * Inserir os dados iniciais, categorias e usuários de teste.

**Caso sua senha seja diferente**, edite o ficheiro `Back_end/db_seeder.js` e altere a `password` no bloco de configuração do `Pool`.

### 2. Inicialização do Backend (`Porta 3001`)

O backend deve ser iniciado primeiro:

```bash
# 1. Navega para o backend
cd Back_end

# 2. Instala as dependências
npm install

# 3. Inicia o servidor (Executa o DB Setup)
node server.js

# 1. Navega para o frontend
cd Front_end

# 2. Instala as dependências
npm install

# 3. Inicia a aplicação
npm run dev
```

| Perfil | Email | Senha | Acesso |
| :--- | :--- | :--- | :--- |
| Gerente | gerente@empresa.com| 654321 | Completo |(acesso a Relatórios e Cadastro de Funcionários)
| Funcionário| funcionario@empresa.com| 123456| Operacional | (acesso limitado)
