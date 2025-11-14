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