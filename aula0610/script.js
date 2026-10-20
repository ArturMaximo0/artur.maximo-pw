const API_BASE = '/api/funcionarios';
const modal = document.querySelector('.modal-container');
const form = document.querySelector('#funcionario-form');
const tbody = document.querySelector('tbody');
const sNome = document.querySelector('#m-nome');
const sFuncao = document.querySelector('#m-funcao');
const sSalario = document.querySelector('#m-salario');
const mensagemErro = document.querySelector('#mensagem-erro');

let itens = [];
let funcionarioEmEdicao;

async function requestApi(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error('Não foi possível acessar a API. Verifique se o servidor está rodando em http://localhost:3000.');
  }

  const responseText = await response.text();
  let body = {};
  try {
    body = responseText ? JSON.parse(responseText) : {};
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new Error(body.error || `Erro HTTP ${response.status} ao acessar a API.`);
  }

  return body;
}

function openModal(funcionario) {
  form.reset();
  mensagemErro.textContent = '';
  funcionarioEmEdicao = funcionario?.id;

  if (funcionario) {
    sNome.value = funcionario.nome;
    sFuncao.value = funcionario.funcao;
    sSalario.value = funcionario.salario;
  }

  modal.classList.add('active');
  sNome.focus();
}

function closeModal() {
  modal.classList.remove('active');
  funcionarioEmEdicao = undefined;
}

function insertItem(funcionario) {
  const tr = document.createElement('tr');
  const nome = document.createElement('td');
  const funcao = document.createElement('td');
  const salario = document.createElement('td');
  const editar = document.createElement('td');
  const excluir = document.createElement('td');
  const botaoEditar = document.createElement('button');
  const botaoExcluir = document.createElement('button');
  const iconeEditar = document.createElement('i');
  const iconeExcluir = document.createElement('i');

  nome.textContent = funcionario.nome;
  funcao.textContent = funcionario.funcao;
  salario.textContent = `R$ ${Number(funcionario.salario).toFixed(2)}`;
  editar.className = 'acao';
  excluir.className = 'acao';
  botaoEditar.type = 'button';
  botaoExcluir.type = 'button';
  botaoEditar.setAttribute('aria-label', `Editar ${funcionario.nome}`);
  botaoExcluir.setAttribute('aria-label', `Excluir ${funcionario.nome}`);
  iconeEditar.className = 'bx bx-edit';
  iconeExcluir.className = 'bx bx-trash';

  botaoEditar.appendChild(iconeEditar);
  botaoExcluir.appendChild(iconeExcluir);
  botaoEditar.addEventListener('click', () => openModal(funcionario));
  botaoExcluir.addEventListener('click', () => deleteItem(funcionario.id));
  editar.appendChild(botaoEditar);
  excluir.appendChild(botaoExcluir);
  tr.append(nome, funcao, salario, editar, excluir);
  tbody.appendChild(tr);
}

async function loadItens() {
  try {
    itens = await requestApi(API_BASE);
    tbody.replaceChildren();
    itens.forEach(insertItem);
  } catch (error) {
    console.error('Erro ao carregar funcionários:', error);
    alert(`Erro ao carregar funcionários: ${error.message}`);
  }
}

async function deleteItem(id) {
  if (!window.confirm('Deseja realmente excluir este funcionário?')) return;

  try {
    await requestApi(`${API_BASE}/${id}`, { method: 'DELETE' });
    await loadItens();
  } catch (error) {
    console.error('Erro ao excluir funcionário:', error);
    alert(`Erro ao excluir funcionário: ${error.message}`);
  }
}

document.querySelector('#new').addEventListener('click', () => openModal());
document.querySelector('#cancelar').addEventListener('click', closeModal);
modal.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  mensagemErro.textContent = '';

  const funcionario = {
    nome: sNome.value.trim(),
    funcao: sFuncao.value.trim(),
    salario: sSalario.value
  };
  const editando = funcionarioEmEdicao !== undefined;

  try {
    await requestApi(
      editando ? `${API_BASE}/${funcionarioEmEdicao}` : API_BASE,
      {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funcionario)
      }
    );
    closeModal();
    await loadItens();
  } catch (error) {
    console.error('Erro ao salvar funcionário:', error);
    mensagemErro.textContent = error.message;
  }
});

loadItens();
