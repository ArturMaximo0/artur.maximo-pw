const formularioLogin = document.querySelector('#login-form');
const campoLogin = document.querySelector('#login');
const campoSenha = document.querySelector('#senha');
const mensagemErroLogin = document.querySelector('#mensagem-erro');
const botaoEntrar = document.querySelector('#btnEntrar');

formularioLogin.addEventListener('submit', async evento => {
  evento.preventDefault();
  mensagemErroLogin.textContent = '';
  botaoEntrar.disabled = true;

  try {
    const resposta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: campoLogin.value.trim(),
        senha: campoSenha.value
      })
    });
    const resultado = await resposta.json();
    if (!resposta.ok) {
      throw new Error(resultado.error || 'Não foi possível entrar.');
    }

    window.location.assign('/index.html');
  } catch (erro) {
    mensagemErroLogin.textContent = erro.message;
    botaoEntrar.disabled = false;
  }
});
