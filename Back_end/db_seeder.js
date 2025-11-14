const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'localiza_ae',
  password: 'minhasenha', 
  port: 5433, 
});

async function seedDatabase() {
    console.log('Verificando e Inserindo Dados Iniciais');
    try {
        // 1. Criação das Tabelas (Estrutura de Segurança)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories ( id TEXT PRIMARY KEY, name TEXT NOT NULL, price_per_day NUMERIC(10, 2) NOT NULL, stock INTEGER NOT NULL, features TEXT[] NOT NULL, image TEXT NOT NULL );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clients ( id TEXT PRIMARY KEY, name TEXT NOT NULL, cpf TEXT NOT NULL UNIQUE, phone TEXT NOT NULL, email TEXT NOT NULL UNIQUE, active BOOLEAN NOT NULL DEFAULT true );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_plain TEXT NOT NULL, role TEXT DEFAULT 'funcionario', created_at TIMESTAMPTZ DEFAULT now() );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reservations ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_id TEXT NOT NULL REFERENCES clients(id), category_id TEXT NOT NULL REFERENCES categories(id), pickup_date DATE NOT NULL, return_date DATE NOT NULL, pickup_time TIME, return_time TIME, pickup_location TEXT NOT NULL, return_location TEXT NOT NULL, status TEXT NOT NULL );
        `);

        // 2. Inserção dos Dados Iniciais
        
        const categoriesSQL = `
            INSERT INTO categories (id, name, price_per_day, stock, features, image)
            VALUES
            ('eco', 'Econômico', 89, 8, '{"5 pessoas", "Manual", "Flex"}', 'https://imgs.search.brave.com/6bUzddDtnOUx8hm4ykaP65rgm9LfbtW3RYY9yymIwH4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGlt/Zy5jYXJkZWtoby5j/b20vaW1hZ2VzL2Nh/cmV4dGVyaW9yaW1h/Z2VzLzkzMHg2MjAv/RmlhdC9GaWF0LUFy/Z28vNTg1MC8xNTUw/ODM2Njc4Njc2L2Zy/b250LWxlZnQtc2lk/ZS00Ny5qcGc_aW13/aWR0aD04OTAmaW1w/b2xpY3k9cmVzaXpl'),
            ('int', 'Intermediário', 129, 12, '{"5 pessoas", "Automático", "Flex"}', 'https://imgs.search.brave.com/CTdFm8ze2qEjE_84nJBA5fGCkt1rhyfpgm6KRanL1Yk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wMi50/cnJzZi5jb20vaW1h/Z2UvZmdldC9jZi83/NzQvMC9pbWFnZXMu/dGVycmEuY29tLzIw/MjQvMDgvMTMvbmlz/c2FuLXZlcnNhLWV4/Y2x1c2l2ZS0yMDI1/LTFodjJyeG8wbjFk/Z2wuanBn'),
            ('exe', 'Executivo', 189, 6, '{"Couro", "GPS", "Som premium"}', 'https://imgs.search.brave.com/7HyAyQhpqm6WxC_WkWp9QjGTAxfVohMonq_g2tWVZLk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9ibG9n/Z2VyLmdvb2dsZXVz/ZXJjb250ZW50LmNv/bS9pbWcvYi9SMjl2/WjJ4bC9BVnZYc0Vp/bXVOWWZIQm5UcnJa/QTZid25Qb29SUjc0/Nzl1Nkt6OERvaGpH/WXRDSlBCa2kzOENf/QW9JVGdHNjdIOHNL/UDRkMkI3R1dPVjBx/MjNRQ3YwOWpCcy00/S21aSG5ZSzZIQ3hU/aGhDeGptcU9PMHJU/U3hPa3hLdkp5b2s4/QndKZ0dRNERhUW14/dzN1NnJ1SUFYaGZD/clFnZHZrcUdrbzNV/bUV4R2k4SUF6N2NP/aFR0WVIwb2RuaDh5/bjlKdG9qdy9zNjAw/LXJ3L05vdm8tSG9u/ZGEtQ2l2aWMtMjAy/My1IJUMzJUFEYnJp/ZG8lMjAoNikuanBn'),
            ('suv', 'SUV', 159, 5, '{"Espaçoso", "Automático", "Flex"}', 'https://imgs.search.brave.com/iH4wCgKE1yOciVK2Tj50IZ9HFPEYbEd0WnlbbbxJx4c/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/bWl0c3ViaXNoaS1t/b3RvcnMuY29tL2Vu/L3Byb2R1Y3RzL2lt/Zy9hc3guanBn')
            ON CONFLICT (id) DO UPDATE SET 
                image = EXCLUDED.image, name = EXCLUDED.name, 
                price_per_day = EXCLUDED.price_per_day, stock = EXCLUDED.stock, features = EXCLUDED.features;
        `;
        await pool.query(categoriesSQL);

        // Usuários (Gerente e Funcionário)
        const userSQL = `
            INSERT INTO users (name, email, password_plain, role) 
            VALUES ('Gerente Principal', 'gerente@empresa.com', '654321', 'gerente'),
                   ('Funcionário Padrão', 'funcionario@empresa.com', '123456', 'funcionario') 
            ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_plain = EXCLUDED.password_plain;
        `;
        await pool.query(userSQL);
        
        const clientsSQL = `
            INSERT INTO clients (id, name, cpf, phone, email, active) 
            VALUES
            ('c1', 'João Silva Santos', '123.456.789-01', '(11) 99999-1234', 'joao@empresa.com', true),
            ('c2', 'Maria Oliveira Costa', '987.654.321-02', '(11) 98888-5678', 'maria@empresa.com', true),
            ('c3', 'Ana Carolina Souza', '321.654.987-04', '(11) 96666-3456', 'ana@empresa.com', false),
            ('c4', 'Marcos Rocha Silva', '444.555.666-77', '(21) 97777-1111', 'marcos.rocha@corp.com', true),
            ('c5', 'Fernanda Lima Costa', '555.444.333-22', '(11) 95555-2222', 'fernanda.lima@corp.com', true),
            ('c6', 'Ricardo Alves Moura', '666.777.888-99', '(31) 94444-3333', 'ricardo.alves@corp.com', false),
            ('c7', 'Sofia Nunes Pereira', '777.888.999-00', '(41) 93333-4444', 'sofia.nunes@corp.com', true),
            ('c8', 'Miguel Costa Oliveira', '888.777.666-55', '(51) 92222-5555', 'miguel.costa@corp.com', true),
            ('c9', 'Helena Sousa Mendes', '999.000.111-22', '(61) 91111-6666', 'helena.mendes@corp.com', true),
            ('c10', 'Alice Rocha', '100.100.100-10', '(11) 91010-1010', 'alice@ex.com', true),
            ('c11', 'Bruno Santos', '111.111.111-11', '(11) 91111-1111', 'bruno@ex.com', true),
            ('c12', 'Carla Mendes', '122.222.222-22', '(21) 91212-1212', 'carla@ex.com', true),
            ('c13', 'Daniel Costa', '133.333.333-33', '(21) 91313-1313', 'daniel@ex.com', true),
            ('c14', 'Erica Alves', '144.444.444-44', '(31) 91414-1414', 'erica@ex.com', false),
            ('c15', 'Fernando Lima', '155.555.555-55', '(31) 91515-1515', 'fernando@ex.com', true),
            ('c16', 'Gabriela Souza', '166.666.666-66', '(41) 91616-1616', 'gabriela@ex.com', true),
            ('c17', 'Hugo Oliveira', '177.777.777-77', '(41) 91717-1717', 'hugo@ex.com', true),
            ('c18', 'Ingrid Pereira', '188.888.888-88', '(51) 91818-1818', 'ingrid@ex.com', false),
            ('c19', 'João Ribeiro', '199.999.999-99', '(51) 91919-1919', 'joao@ex.com', true),
            ('c20', 'Karen Gomes', '200.200.200-20', '(61) 92020-2020', 'karen@ex.com', true),
            ('c21', 'Lucas Martins', '211.211.211-21', '(61) 92121-2121', 'lucas@ex.com', true),
            ('c22', 'Mariana Nunes', '222.222.222-22', '(71) 92222-2222', 'mariana@ex.com', true),
            ('c23', 'Nelson Rocha', '233.333.333-33', '(71) 92323-2323', 'nelson@ex.com', false),
            ('c24', 'Olivia Santos', '244.444.444-44', '(81) 92424-2424', 'olivia@ex.com', true),
            ('c25', 'Paulo Torres', '255.555.555-55', '(81) 92525-2525', 'paulo@ex.com', true),
            ('c26', 'Rita Vieira', '266.666.666-66', '(91) 92626-2626', 'rita@ex.com', true),
            ('c27', 'Samuel Ferreira', '277.777.777-77', '(91) 92727-2727', 'samuel@ex.com', true),
            ('c28', 'Tânia Barbosa', '288.888.888-88', '(11) 92828-2828', 'tania@ex.com', false),
            ('c29', 'Victor Almeida', '299.999.999-99', '(11) 92929-2929', 'victor@ex.com', true)
            ON CONFLICT (id) DO NOTHING;
        `;
        await pool.query(clientsSQL);

        const reservationsSQL = `
            INSERT INTO reservations (client_id, category_id, pickup_date, return_date, pickup_time, return_time, pickup_location, return_location, status) 
            VALUES
            ('c4', 'suv', '2025-11-14', '2025-11-28', '10:00', '16:00', 'Matriz', 'Matriz', 'Ativa'),
            ('c5', 'int', '2025-11-13', '2025-11-15', '09:00', '09:00', 'Aeroporto', 'Matriz', 'Ativa'),
            ('c4', 'exe', '2025-10-10', '2025-10-15', '14:00', '14:00', 'Matriz', 'Centro', 'Concluída'),
            ('c6', 'eco', '2025-11-25', '2025-11-26', '11:00', '11:00', 'Centro', 'Centro', 'Cancelada'),
            ('c7', 'suv', '2025-12-05', '2025-12-15', '12:00', '12:00', 'Matriz', 'Matriz', 'Ativa'),
            ('c8', 'eco', '2025-01-20', '2025-01-22', '10:00', '10:00', 'Centro', 'Centro', 'Concluída'),
            ('c9', 'eco', '2025-11-20', '2025-11-22', '15:00', '15:00', 'Aeroporto', 'Aeroporto', 'Ativa'),
            ('c7', 'exe', '2025-11-28', '2025-11-30', '08:00', '08:00', 'Matriz', 'Centro', 'Cancelada'),
            
            ('c10', 'eco', '2025-10-01', '2025-10-03', '10:00', '16:00', 'Matriz', 'Matriz', 'Concluída'),
            ('c11', 'int', '2025-10-05', '2025-10-10', '09:00', '09:00', 'Centro', 'Centro', 'Concluída'),
            ('c12', 'exe', '2025-10-12', '2025-10-15', '14:00', '14:00', 'Aeroporto', 'Aeroporto', 'Concluída'),
            ('c13', 'suv', '2025-10-18', '2025-10-25', '11:00', '11:00', 'Matriz', 'Centro', 'Concluída'),
            ('c14', 'eco', '2025-10-28', '2025-10-29', '15:00', '15:00', 'Centro', 'Centro', 'Cancelada'),
            ('c15', 'int', '2025-10-30', '2025-11-03', '13:00', '13:00', 'Aeroporto', 'Matriz', 'Concluída'),
            ('c16', 'exe', '2025-10-15', '2025-10-17', '08:00', '08:00', 'Matriz', 'Matriz', 'Concluída'),
            ('c17', 'suv', '2025-10-20', '2025-10-22', '16:00', '16:00', 'Centro', 'Aeroporto', 'Concluída'),
            
            ('c19', 'exe', '2025-11-06', '2025-11-12', '10:00', '10:00', 'Centro', 'Centro', 'Concluída'),
            ('c20', 'eco', '2025-11-13', '2025-11-15', '09:00', '09:00', 'Matriz', 'Matriz', 'Ativa'),
            ('c21', 'int', '2025-11-15', '2025-11-20', '11:00', '11:00', 'Aeroporto', 'Aeroporto', 'Ativa'),
            ('c22', 'exe', '2025-11-18', '2025-11-28', '14:00', '14:00', 'Centro', 'Matriz', 'Ativa'),
            ('c24', 'suv', '2025-11-20', '2025-11-22', '12:00', '12:00', 'Matriz', 'Centro', 'Concluída'),
            ('c25', 'eco', '2025-11-25', '2025-11-29', '09:00', '09:00', 'Aeroporto', 'Aeroporto', 'Ativa'),
            ('c28', 'int', '2025-11-26', '2025-11-29', '13:00', '13:00', 'Centro', 'Matriz', 'Cancelada'),
            ('c29', 'exe', '2025-11-01', '2025-11-02', '16:00', '16:00', 'Matriz', 'Aeroporto', 'Concluída'),
            ('c17', 'eco', '2025-11-09', '2025-11-11', '10:00', '10:00', 'Matriz', 'Matriz', 'Concluída'),
            ('c18', 'suv', '2025-11-10', '2025-11-14', '08:00', '08:00', 'Centro', 'Centro', 'Cancelada'),
            
            ('c26', 'int', '2025-12-01', '2025-12-07', '09:00', '09:00', 'Centro', 'Centro', 'Ativa'),
            ('c27', 'exe', '2025-12-05', '2025-12-10', '10:00', '10:00', 'Matriz', 'Matriz', 'Ativa'),
            ('c29', 'suv', '2025-12-10', '2025-12-15', '14:00', '14:00', 'Aeroporto', 'Aeroporto', 'Ativa'),
            ('c10', 'int', '2025-12-18', '2025-12-20', '15:00', '15:00', 'Matriz', 'Centro', 'Ativa'),
            ('c11', 'eco', '2025-12-22', '2025-12-26', '12:00', '12:00', 'Centro', 'Aeroporto', 'Ativa'),
            ('c12', 'suv', '2025-12-28', '2025-12-30', '08:00', '08:00', 'Aeroporto', 'Matriz', 'Ativa');
        `;
        await pool.query(reservationsSQL);

        console.log('--- Dados iniciais e estrutura verificados com sucesso! ---');

    } catch (error) {
        console.error('ERRO FATAL NO SETUP DO BANCO DE DADOS (Verifique o servidor Postgres):', error);
        throw error;
    }
}

module.exports = {
    pool,
    seedDatabase
};