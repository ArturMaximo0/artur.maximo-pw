const express = require('express');
const mysql = require('mysql2/promise');
const { randomBytes } = require('node:crypto');
const { verificarSenha } = require('./auth');

const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;
const COOKIE_SESSAO = 'sessao_funcionarios';
const ARQUIVOS_PUBLICOS = new Set(['/style.css', '/login.js', '/script.js']);

function criarApp({ banco, sessoes = new Map(), cookiesSeguros = false }) {
  if (!banco || typeof banco.execute !== 'function') {
    throw new TypeError('A conexão com o banco de dados é obrigatória.');
  }

  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  function obterSessao(req) {
    const cookie = (req.headers.cookie || '')
      .split(';')
      .map(parte => parte.trim())
      .find(parte => parte.startsWith(`${COOKIE_SESSAO}=`));

    if (!cookie) return null;

    const id = cookie.slice(COOKIE_SESSAO.length + 1);
    const sessao = sessoes.get(id);
    if (!sessao) return null;
    if (sessao.expiraEm <= Date.now()) {
      sessoes.delete(id);
      return null;
    }

    return { id, ...sessao };
  }

  function exigirAutenticacao(req, res, next) {
    const sessao = obterSessao(req);
    if (!sessao) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }
    next();
  }

  function enviarCookie(res, id) {
    const opcoes = [
      `${COOKIE_SESSAO}=${id}`,
      'HttpOnly',
      'SameSite=Lax',
      'Path=/',
      `Max-Age=${DURACAO_SESSAO_MS / 1000}`
    ];
    if (cookiesSeguros) opcoes.push('Secure');
    res.setHeader('Set-Cookie', opcoes.join('; '));
  }

  app.get('/', (req, res) => {
    res.redirect(obterSessao(req) ? '/index.html' : '/login.html');
  });

  app.get('/login.html', (req, res) => {
    if (obterSessao(req)) return res.redirect('/index.html');
    res.sendFile('login.html', { root: __dirname });
  });

  app.get('/index.html', (req, res) => {
    if (!obterSessao(req)) return res.redirect('/login.html');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile('index.html', { root: __dirname });
  });

  app.post('/api/login', async (req, res) => {
    const { login, senha } = req.body || {};
    if (
      typeof login !== 'string' ||
      !login.trim() ||
      login.trim().length > 100 ||
      typeof senha !== 'string' ||
      !senha ||
      senha.length > 1024
    ) {
      return res.status(400).json({ error: 'Informe usuário e senha válidos.' });
    }

    try {
      const [usuarios] = await banco.execute(
        'SELECT id, login, senha FROM usuarios WHERE login = ? LIMIT 1',
        [login.trim()]
      );
      const usuario = usuarios[0];
      const credencialValida = await verificarSenha(
        senha,
        usuario ? usuario.senha : ''
      );
      if (!usuario || !credencialValida) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      }

      const idSessao = randomBytes(32).toString('hex');
      const expiraEm = Date.now() + DURACAO_SESSAO_MS;
      sessoes.set(idSessao, { usuarioId: usuario.id, expiraEm });
      enviarCookie(res, idSessao);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao autenticar usuário:', error);
      res.status(500).json({ error: 'Não foi possível autenticar.' });
    }
  });

  app.post('/api/logout', (req, res) => {
    const sessao = obterSessao(req);
    if (sessao) sessoes.delete(sessao.id);
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_SESSAO}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${cookiesSeguros ? '; Secure' : ''}`
    );
    res.status(204).end();
  });

  app.get('/api/funcionarios', exigirAutenticacao, async (req, res) => {
    try {
      const [funcionarios] = await banco.execute(
        'SELECT id, nome, funcao, salario, created_at FROM funcionarios ORDER BY id DESC'
      );
      res.json(funcionarios);
    } catch (error) {
      console.error('Erro ao listar funcionários:', error);
      res.status(500).json({ error: 'Não foi possível consultar os funcionários.' });
    }
  });

  app.post('/api/funcionarios', exigirAutenticacao, async (req, res) => {
    const funcionario = validarFuncionario(req.body);
    if (!funcionario) {
      return res.status(400).json({ error: 'Informe nome, função e salário válidos.' });
    }

    try {
      const [resultado] = await banco.execute(
        'INSERT INTO funcionarios (nome, funcao, salario) VALUES (?, ?, ?)',
        [funcionario.nome, funcionario.funcao, funcionario.salario]
      );
      res.status(201).json({ id: resultado.insertId, ...funcionario });
    } catch (error) {
      console.error('Erro ao cadastrar funcionário:', error);
      res.status(500).json({ error: 'Não foi possível gravar o funcionário.' });
    }
  });

  app.put('/api/funcionarios/:id', exigirAutenticacao, async (req, res) => {
    const id = validarId(req.params.id);
    const funcionario = validarFuncionario(req.body);
    if (!id) return res.status(400).json({ error: 'ID de funcionário inválido.' });
    if (!funcionario) {
      return res.status(400).json({ error: 'Informe nome, função e salário válidos.' });
    }

    try {
      const [resultado] = await banco.execute(
        'UPDATE funcionarios SET nome = ?, funcao = ?, salario = ? WHERE id = ?',
        [funcionario.nome, funcionario.funcao, funcionario.salario, id]
      );
      if (resultado.affectedRows === 0) {
        const [existente] = await banco.execute(
          'SELECT id FROM funcionarios WHERE id = ?',
          [id]
        );
        if (existente.length === 0) {
          return res.status(404).json({ error: 'Funcionário não encontrado.' });
        }
      }
      res.json({ id, ...funcionario });
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      res.status(500).json({ error: 'Não foi possível atualizar o funcionário.' });
    }
  });

  app.delete('/api/funcionarios/:id', exigirAutenticacao, async (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de funcionário inválido.' });

    try {
      const [resultado] = await banco.execute(
        'DELETE FROM funcionarios WHERE id = ?',
        [id]
      );
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Funcionário não encontrado.' });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      res.status(500).json({ error: 'Não foi possível excluir o funcionário.' });
    }
  });

  app.get('*splat', (req, res) => {
    if (ARQUIVOS_PUBLICOS.has(req.path)) {
      return res.sendFile(req.path.slice(1), { root: __dirname });
    }
    res.status(404).send('Página não encontrada.');
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({ error: 'O corpo da requisição não contém JSON válido.' });
    }
    console.error('Erro inesperado na aplicação:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno.' });
  });

  return app;
}

function validarFuncionario(body) {
  const { nome, funcao, salario } = body || {};
  const salarioInformado =
    typeof salario === 'number' ||
    (typeof salario === 'string' && salario.trim() !== '');
  const valorSalario = Number(salario);

  if (
    typeof nome !== 'string' ||
    !nome.trim() ||
    nome.trim().length > 100 ||
    typeof funcao !== 'string' ||
    !funcao.trim() ||
    funcao.trim().length > 100 ||
    !salarioInformado ||
    !Number.isFinite(valorSalario) ||
    valorSalario < 0 ||
    valorSalario > 99999999.99
  ) {
    return null;
  }

  return { nome: nome.trim(), funcao: funcao.trim(), salario: valorSalario };
}

function validarId(id) {
  if (typeof id !== 'string' || !/^\d+$/.test(id)) return null;
  const valor = Number(id);
  return Number.isSafeInteger(valor) && valor > 0 ? valor : null;
}

async function iniciarServidor() {
  const banco = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crud_funcionarios',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    await banco.execute('SELECT 1');
    const app = criarApp({
      banco,
      cookiesSeguros: process.env.NODE_ENV === 'production'
    });
    const porta = Number(process.env.PORT || 3000);
    app.listen(porta, '127.0.0.1', () => {
      console.log(`Aplicação disponível em http://localhost:${porta}`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao MySQL. Verifique o serviço e as configurações.', error);
    await banco.end();
    process.exitCode = 1;
  }
}

if (require.main === module) iniciarServidor();

module.exports = { criarApp, validarFuncionario, validarId };
