const mysql = require('mysql2/promise');
const readline = require('node:readline');
const { criarHashSenha } = require('./auth');

function perguntar(mensagem) {
  const interfaceLeitura = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    interfaceLeitura.question(mensagem, resposta => {
      interfaceLeitura.close();
      resolve(resposta.trim());
    });
  });
}

function perguntarSenha(mensagem) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Execute este comando em um terminal interativo para digitar a senha com segurança.');
  }

  return new Promise((resolve, reject) => {
    let senha = '';
    const entrada = process.stdin;

    function finalizar(erro) {
      entrada.removeListener('data', receberTecla);
      entrada.setRawMode(false);
      entrada.pause();
      process.stdout.write('\n');
      if (erro) reject(erro);
      else resolve(senha);
    }

    function receberTecla(dados) {
      for (const caractere of dados.toString('utf8')) {
        if (caractere === '\u0003') return finalizar(new Error('Operação cancelada.'));
        if (caractere === '\r' || caractere === '\n') return finalizar();
        if (caractere === '\u0008' || caractere === '\u007f') {
          senha = Array.from(senha).slice(0, -1).join('');
          continue;
        }
        if (caractere >= ' ' && senha.length < 1024) senha += caractere;
      }
    }

    process.stdout.write(mensagem);
    entrada.setRawMode(true);
    entrada.resume();
    entrada.on('data', receberTecla);
  });
}

async function criarUsuario() {
  const login = await perguntar('Usuário: ');
  if (!login || login.length > 100) {
    throw new Error('O usuário é obrigatório e deve ter até 100 caracteres.');
  }

  const senha = await perguntarSenha('Senha (não será exibida): ');
  if (!senha) throw new Error('A senha não pode ficar vazia.');

  const banco = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crud_funcionarios',
    waitForConnections: true,
    connectionLimit: 1
  });

  try {
    const hash = await criarHashSenha(senha);
    await banco.execute(
      'INSERT INTO usuarios (login, senha) VALUES (?, ?)',
      [login, hash]
    );
    console.log(`Usuário "${login}" criado.`);
  } finally {
    await banco.end();
  }
}

if (require.main === module) {
  criarUsuario().catch(error => {
    console.error(`Não foi possível criar o usuário: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { perguntarSenha };
