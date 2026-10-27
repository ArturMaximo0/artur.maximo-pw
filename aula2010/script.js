const API_BASE = '/api/funcionarios';
const modal = document.querySelector('.modal-container');
const formulario = document.querySelector('#funcionario-form');
const corpoTabela = document.querySelector('tbody');
const campoNome = document.querySelector('#m-nome');
const campoFuncao = document.querySelector('#m-funcao');
const campoSalario = document.querySelector('#m-salario');
const mensagemErro = document.querySelector('#mensagem-erro');
const mensagemStatus = document.querySelector('#mensagem-status');

let funcionarioEmEdicao;

async function requisitarApi(url, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(url, opcoes);
  } catch {
    throw new Error('Não foi possível acessar o servidor. Verifique se ele está ativo.');
  }

  if (resposta.status === 401) {
    window.location.replace('/login.html');
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  if (resposta.status === 204) return null;
  const resultado = await resposta.json();
  if (!resposta.ok) {
    throw new Error(resultado.error || `Erro HTTP ${resposta.status}.`);
  }
  return resultado;
}

function abrirModal(funcionario) {
  formulario.reset();
  mensagemErro.textContent = '';
  funcionarioEmEdicao = funcionario?.id;

  if (funcionario) {
    campoNome.value = funcionario.nome;
    campoFuncao.value = funcionario.funcao;
    campoSalario.value = funcionario.salario;
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  campoNome.focus();
}

function fecharModal() {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  funcionarioEmEdicao = undefined;
}

function criarCelula(texto) {
  const celula = document.createElement('td');
  celula.textContent = texto;
  return celula;
}

function inserirFuncionario(funcionario) {
  const linha = document.createElement('tr');
  const celulaEditar = document.createElement('td');
  const celulaExcluir = document.createElement('td');
  const botaoEditar = document.createElement('button');
  const botaoExcluir = document.createElement('button');

  linha.append(
    criarCelula(funcionario.nome),
    criarCelula(funcionario.funcao),
    criarCelula(
      Number(funcionario.salario).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    )
  );
  celulaEditar.className = 'acao';
  celulaExcluir.className = 'acao';
  botaoEditar.type = 'button';
  botaoExcluir.type = 'button';
  botaoEditar.setAttribute('aria-label', `Editar ${funcionario.nome}`);
  botaoExcluir.setAttribute('aria-label', `Excluir ${funcionario.nome}`);
  botaoEditar.innerHTML = '<i class="bx bx-edit" aria-hidden="true"></i>';
  botaoExcluir.innerHTML = '<i class="bx bx-trash" aria-hidden="true"></i>';
  botaoEditar.addEventListener('click', () => abrirModal(funcionario));
  botaoExcluir.addEventListener('click', () => excluirFuncionario(funcionario.id));
  celulaEditar.appendChild(botaoEditar);
  celulaExcluir.appendChild(botaoExcluir);
  linha.append(celulaEditar, celulaExcluir);
  corpoTabela.appendChild(linha);
}

async function carregarFuncionarios() {
  try {
    const funcionarios = await requisitarApi(API_BASE);
    corpoTabela.replaceChildren();
    funcionarios.forEach(inserirFuncionario);
    mensagemStatus.textContent = funcionarios.length
      ? `${funcionarios.length} funcionário(s) cadastrado(s).`
      : 'Nenhum funcionário cadastrado.';
  } catch (erro) {
    console.error('Erro ao carregar funcionários:', erro);
    mensagemStatus.textContent = erro.message;
  }
}

async function excluirFuncionario(id) {
  if (!window.confirm('Deseja realmente excluir este funcionário?')) return;

  try {
    await requisitarApi(`${API_BASE}/${id}`, { method: 'DELETE' });
    await carregarFuncionarios();
  } catch (erro) {
    console.error('Erro ao excluir funcionário:', erro);
    mensagemStatus.textContent = erro.message;
  }
}

document.querySelector('#new').addEventListener('click', () => abrirModal());
document.querySelector('#cancelar').addEventListener('click', fecharModal);
document.querySelector('#sair').addEventListener('click', async () => {
  try {
    await requisitarApi('/api/logout', { method: 'POST' });
    window.location.replace('/login.html');
  } catch (erro) {
    mensagemStatus.textContent = erro.message;
  }
});

modal.addEventListener('click', evento => {
  if (evento.target === modal) fecharModal();
});

formulario.addEventListener('submit', async evento => {
  evento.preventDefault();
  mensagemErro.textContent = '';

  const funcionario = {
    nome: campoNome.value.trim(),
    funcao: campoFuncao.value.trim(),
    salario: campoSalario.value
  };
  const editando = funcionarioEmEdicao !== undefined;

  try {
    await requisitarApi(
      editando ? `${API_BASE}/${funcionarioEmEdicao}` : API_BASE,
      {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funcionario)
      }
    );
    fecharModal();
    await carregarFuncionarios();
  } catch (erro) {
    console.error('Erro ao salvar funcionário:', erro);
    mensagemErro.textContent = erro.message;
  }
});

carregarFuncionarios();
