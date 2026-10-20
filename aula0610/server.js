const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crud_funcionarios',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(express.json());
app.use(express.static(__dirname));

function validarFuncionario(body) {
  const { nome, funcao, salario } = body || {};
  const valorSalario = Number(salario);

  if (
    typeof nome !== 'string' ||
    !nome.trim() ||
    nome.trim().length > 100 ||
    typeof funcao !== 'string' ||
    !funcao.trim() ||
    funcao.trim().length > 100 ||
    salario === '' ||
    !Number.isFinite(valorSalario) ||
    valorSalario < 0 ||
    valorSalario > 99999999.99
  ) {
    return null;
  }

  return { nome: nome.trim(), funcao: funcao.trim(), salario: valorSalario };
}

function validarId(id) {
  const valor = Number(id);
  return Number.isSafeInteger(valor) && valor > 0 ? valor : null;
}

app.get('/api/funcionarios', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, nome, funcao, salario, created_at FROM funcionarios ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ error: 'Erro ao consultar o banco de dados.' });
  }
});

app.post('/api/funcionarios', async (req, res) => {
  const funcionario = validarFuncionario(req.body);
  if (!funcionario) {
    return res.status(400).json({ error: 'Informe nome, função e salário válidos.' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO funcionarios (nome, funcao, salario) VALUES (?, ?, ?)',
      [funcionario.nome, funcionario.funcao, funcionario.salario]
    );
    res.status(201).json({ id: result.insertId, ...funcionario });
  } catch (error) {
    console.error('Erro ao cadastrar funcionário:', error);
    res.status(500).json({ error: 'Erro ao gravar no banco de dados.' });
  }
});

app.put('/api/funcionarios/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const funcionario = validarFuncionario(req.body);
  if (!id) return res.status(400).json({ error: 'ID de funcionário inválido.' });
  if (!funcionario) {
    return res.status(400).json({ error: 'Informe nome, função e salário válidos.' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE funcionarios SET nome = ?, funcao = ?, salario = ? WHERE id = ?',
      [funcionario.nome, funcionario.funcao, funcionario.salario, id]
    );
    if (result.affectedRows === 0) {
      const [rows] = await db.execute('SELECT id FROM funcionarios WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Funcionário não encontrado.' });
      }
    }
    res.json({ id, ...funcionario });
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ error: 'Erro ao gravar no banco de dados.' });
  }
});

app.delete('/api/funcionarios/:id', async (req, res) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de funcionário inválido.' });

  try {
    const [result] = await db.execute('DELETE FROM funcionarios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir funcionário:', error);
    res.status(500).json({ error: 'Erro ao gravar no banco de dados.' });
  }
});

async function startServer() {
  try {
    await db.execute('SELECT 1');
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Aplicação disponível em http://localhost:${PORT}`);
      console.log(`MySQL conectado em ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao MySQL. Confira se o serviço está ativo e as credenciais configuradas.', error);
    await db.end();
    process.exitCode = 1;
  }
}

startServer();
