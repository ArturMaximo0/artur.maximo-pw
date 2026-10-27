const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { criarHashSenha } = require('./auth');
const { criarApp } = require('./server');

test('protege o CRUD e permite acesso após login e até o logout', async () => {
  const hashSenha = await criarHashSenha('senha-de-teste-segura');
  const chamadas = [];
  const banco = {
    async execute(consulta, parametros = []) {
      chamadas.push({ consulta, parametros });
      if (consulta.startsWith('SELECT id, login, senha FROM usuarios')) {
        return [
          parametros[0] === 'administrador'
            ? [{ id: 1, login: 'administrador', senha: hashSenha }]
            : []
        ];
      }
      if (consulta.startsWith('SELECT id, nome, funcao, salario, created_at')) {
        return [[{ id: 2, nome: 'Ana', funcao: 'Analista', salario: '5000.00' }]];
      }
      if (consulta.startsWith('INSERT INTO funcionarios')) {
        return [{ insertId: 3 }];
      }
      if (consulta.startsWith('UPDATE funcionarios')) {
        return [{ affectedRows: 1 }];
      }
      if (consulta.startsWith('DELETE FROM funcionarios')) {
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Consulta inesperada: ${consulta}`);
    }
  };

  const servidor = criarApp({ banco }).listen(0);
  await once(servidor, 'listening');
  const endereco = `http://127.0.0.1:${servidor.address().port}`;

  try {
    const paginaProtegida = await fetch(`${endereco}/index.html`, { redirect: 'manual' });
    assert.equal(paginaProtegida.status, 302);
    assert.equal(paginaProtegida.headers.get('location'), '/login.html');
    assert.equal((await fetch(`${endereco}/api/funcionarios`)).status, 401);
    assert.equal((await fetch(`${endereco}/login.html`)).status, 200);
    assert.equal((await fetch(`${endereco}/style.css`)).status, 200);

    const loginInvalido = await fetch(`${endereco}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'administrador', senha: 'incorreta' })
    });
    assert.equal(loginInvalido.status, 401);
    assert.equal((await loginInvalido.json()).error, 'Usuário ou senha inválidos.');
    const loginSemCampos = await fetch(`${endereco}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: ' ', senha: '' })
    });
    assert.equal(loginSemCampos.status, 400);

    const login = await fetch(`${endereco}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'administrador', senha: 'senha-de-teste-segura' })
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];

    const paginaAutenticada = await fetch(`${endereco}/index.html`, {
      headers: { Cookie: cookie }
    });
    assert.equal(paginaAutenticada.status, 200);
    assert.equal(paginaAutenticada.headers.get('cache-control'), 'no-store');

    const lista = await fetch(`${endereco}/api/funcionarios`, {
      headers: { Cookie: cookie }
    });
    assert.equal(lista.status, 200);
    assert.equal(lista.headers.get('cache-control'), 'no-store');
    assert.equal((await lista.json())[0].nome, 'Ana');

    const consultasAntesDoCadastroInvalido = chamadas.length;
    const cadastroInvalido = await fetch(`${endereco}/api/funcionarios`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Bia', funcao: 'Designer', salario: '   ' })
    });
    assert.equal(cadastroInvalido.status, 400);
    assert.equal(chamadas.length, consultasAntesDoCadastroInvalido);

    const novo = await fetch(`${endereco}/api/funcionarios`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Bia', funcao: 'Designer', salario: '4500.50' })
    });
    assert.equal(novo.status, 201);
    assert.equal((await novo.json()).id, 3);

    const atualizacao = await fetch(`${endereco}/api/funcionarios/2`, {
      method: 'PUT',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Ana', funcao: 'Líder', salario: 6000 })
    });
    assert.equal(atualizacao.status, 200);

    const exclusao = await fetch(`${endereco}/api/funcionarios/2`, {
      method: 'DELETE',
      headers: { Cookie: cookie }
    });
    assert.equal(exclusao.status, 204);

    const logout = await fetch(`${endereco}/api/logout`, {
      method: 'POST',
      headers: { Cookie: cookie }
    });
    assert.equal(logout.status, 204);
    assert.equal(
      (await fetch(`${endereco}/api/funcionarios`, { headers: { Cookie: cookie } })).status,
      401
    );
    assert.equal(
      (await fetch(`${endereco}/database.sql`, { redirect: 'manual' })).status,
      404
    );
    assert.equal((await fetch(`${endereco}/server.js`)).status, 404);
    assert.ok(chamadas.every(({ consulta }) => !consulta.includes('administrador')));
  } finally {
    servidor.close();
    await once(servidor, 'close');
  }
});
