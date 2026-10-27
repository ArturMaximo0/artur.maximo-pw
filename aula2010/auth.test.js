const test = require('node:test');
const assert = require('node:assert/strict');
const { criarHashSenha, verificarSenha } = require('./auth');

test('hash valida a senha original sem armazená-la diretamente', async () => {
  const senha = 'senha-de-teste-segura';
  const hash = await criarHashSenha(senha);

  assert.notEqual(hash, senha);
  assert.match(hash, /^\$scrypt\$[a-f\d]{32}\$[a-f\d]{128}$/i);
  assert.equal(await verificarSenha(senha, hash), true);
  assert.equal(await verificarSenha('senha-incorreta', hash), false);
});

test('hash inválido ou senha ausente não autentica', async () => {
  assert.equal(await verificarSenha('qualquer', ''), false);
  assert.equal(await verificarSenha('', '$scrypt$' + 'a'.repeat(32) + '$' + 'b'.repeat(128)), false);
  await assert.rejects(() => criarHashSenha(''), TypeError);
});
