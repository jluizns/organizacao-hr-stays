import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do pool de conexões correta para a Aiven (com SSL)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Teste de conexão inicial para ver nos logs do Render
async function testarConexao() {
  try {
    const conexao = await pool.getConnection();
    console.log('✅ CONEXÃO COM O MYSQL ESTABELECIDA COM SUCESSO!');
    conexao.release();
  } catch (error) {
    console.error('❌ ERRO CRÍTICO AO CONECTAR NO MYSQL:', error.message);
  }
}
testarConexao();

// 1. ROTA GET
app.get('/api/reservas', async (req, res) => {
  try {
    const [linhas] = await pool.query('SELECT * FROM reservas ORDER BY id DESC');
    res.json(linhas);
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    res.status(500).json({ erro: 'Erro interno ao buscar do banco de dados' });
  }
});

// 2. ROTA POST
app.post('/api/reservas', async (req, res) => {
  console.log('--- Nova requisição recebida no Back-end ---');
  console.log('Dados do corpo (req.body):', req.body);

  const { hospede, quarto, origem, valor, checkIn, checkOut } = req.body;

  if (!hospede || !quarto || !origem || !valor || !checkIn || !checkOut) {
    console.log('❌ Falha na validação: Campos obrigatórios ausentes.');
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  }

  try {
    const query = 'INSERT INTO reservas (hospede, quarto, origem, valor, check_in, check_out) VALUES (?, ?, ?, ?, ?, ?)';
    const [resultado] = await pool.query(query, [hospede, quarto, origem, valor, checkIn, checkOut]);
    
    console.log('✅ Sucesso! Reserva salva no MySQL com ID:', resultado.insertId);

    res.status(201).json({
      id: resultado.insertId,
      hospede,
      quarto,
      origem,
      valor,
      checkIn,
      checkOut,
      status: 'Hoje'
    });
  } catch (error) {
    console.error('❌ ERRO REAL DO BANCO DE DADOS:', error.message);
    res.status(500).json({ erro: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor do backend completo rodando na porta ${PORT}`);
});