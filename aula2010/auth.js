const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(scryptCallback);

async function criarHashSenha(senha) {
  if (typeof senha !== 'string' || !senha) {
    throw new TypeError('A senha deve ser uma string não vazia.');
  }

  const sal = randomBytes(16);
  const hash = await scrypt(senha, sal, 64);
  return `$scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}

async function verificarSenha(senha, hashArmazenado) {
  if (typeof senha !== 'string' || typeof hashArmazenado !== 'string') {
    return false;
  }

  const partes = hashArmazenado.split('$');
  if (
    partes.length !== 4 ||
    partes[1] !== 'scrypt' ||
    !/^[a-f\d]{32}$/i.test(partes[2]) ||
    !/^[a-f\d]{128}$/i.test(partes[3])
  ) {
    return false;
  }

  const sal = Buffer.from(partes[2], 'hex');
  const hashEsperado = Buffer.from(partes[3], 'hex');
  const hashRecebido = await scrypt(senha, sal, hashEsperado.length);
  return timingSafeEqual(hashEsperado, hashRecebido);
}

module.exports = { criarHashSenha, verificarSenha };
