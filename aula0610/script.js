const modal = document.querySelector('.modal-container')
const tbody = document.querySelector('tbody')
const sNome = document.querySelector('#m-funcao')
const sFuncao = document.querySelector('#m-funcao')
const sSalario = document.querySelector('#m-salario')
const btnSalvar = document.querySelector('#btnSalvar')

let itens
let id

function openModal(edit = false, index = 0) {
    modal.classList.add('active')

    modal.onclick = e => {
        if (e.target.className.indexOf('modal-container') !== -1) {
            modal.classList.remove('active')
        }
    }

    if(edit) {
        sNome.value = itens[index].nome
        sFuncao.value = itens[index].funcao
        sSalario.value = itens[index].salario
        id = index
    } else {
        sNome.value = ''
        sFuncao.value = ''
        sSalario.value = ''
    }
}

function editItem(index) {
    id = itens[index].id //armazena ID para update
    openModal(true, index);
}

async function deleteItem(index) {
    if (!itens[index]?.id) return;
    try {
        await fetch(`${API_BASE}/${itens[index].id}`, { method: 'DELETE' });
        loadItens();
    } catch (error) {
        console.error('Erro ao deletar', error);
    }
}

function insertItem(item, index) { 
  let tr = document.createElement('tr') 
 
  tr.innerHTML = ` 
    <td>${item.nome}</td> 
    <td>${item.funcao}</td> 
    <td>R$ ${item.salario}</td> 
    <td class="acao"> 
      <button onclick="editItem(${index})"><i class='bx bx-edit' 
></i></button> 
    </td> 
    <td class="acao"> 
      <button onclick="deleteItem(${index})"><i class='bx bx
trash'></i></button> 
    </td> 
  ` 
  tbody.appendChild(tr) 
} 
 
btnSalvar.onclick = async e => { 
   
  if (sNome.value == '' || sFuncao.value == '' || sSalario.value == '') { 
    return 
  } 
 
  e.preventDefault(); 
 
  try { 
    if (id !== undefined && itens[id]?.id) { 
      // UPDATE 
      await fetch(`${API_BASE}/${itens[id].id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          nome: sNome.value, 
          funcao: sFuncao.value, 
          salario: sSalario.value 
        }) 
      }); 
    } else { 
      // CREATE 
      await fetch(API_BASE, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          nome: sNome.value, 
          funcao: sFuncao.value, 
          salario: sSalario.value 
        })
 }); 
    } 
    modal.classList.remove('active'); 
    loadItens(); 
    id = undefined; 
  } catch (error) { 
    console.error('Erro ao salvar:', error); 
    alert('Erro ao salvar. Verifique se servidor está rodando.'); 
  } 
} 
 
async function loadItens() { 
  itens = await getItensBD(); 
  tbody.innerHTML = ''; 
  itens.forEach((item, index) => { 
    insertItem(item, index); 
  }); 
} 
 
// Carrega ao iniciar 
loadItens(); 
 
const API_BASE = 'http://localhost:3000/api/funcionarios'; 
 
const getItensBD = async () => { 
  try { 
    const response = await fetch(API_BASE); 
    if (!response.ok) throw new Error('Erro ao carregar'); 
    return await response.json(); 
  } catch (error) { 
    console.error('Erro API:', error); 
    return []; 
  } 
}; 
 
const setItensBD = () => {}; // Não mais necessário 
 
loadItens()

const express = require('express'); 
const mysql = require('mysql2/promise'); 
const cors = require('cors'); 
const app = express(); 
 
app.use(cors()); 
app.use(express.json()); 
 
const dbConfig = { 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'crud_funcionarios' 
}; 
 
const db = mysql.createPool(dbConfig); 
 
// GET /api/funcionarios 
app.get('/api/funcionarios', async (req, res) => { 
    try { 
        const [rows] = await db.execute('SELECT * FROM funcionarios ORDER BY id DESC'); 
        res.json(rows); 
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    } 
}); 
 
// POST /api/funcionarios 
app.post('/api/funcionarios', async (req, res) => { 
    try { 
        const { nome, funcao, salario } = req.body; 
        if (!nome || !funcao || !salario) { 
            return res.status(400).json({ error: 'Campos obrigatórios' 
}); 
        } 
        const [result] = await db.execute( 
            'INSERT INTO funcionarios (nome, funcao, salario) VALUES (?, ?, ?)', 
            [nome, funcao, parseFloat(salario)] 
        ); 
        res.json({ success: true, id: result.insertId }); 
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    } 
}); 
 
// PUT /api/funcionarios/:id 
app.put('/api/funcionarios/:id', async (req, res) => {
    try { 
        const { nome, funcao, salario } = req.body; 
        const id = req.params.id; 
        await db.execute( 
            'UPDATE funcionarios SET nome = ?, funcao = ?, salario = ? WHERE id = ?', 
            [nome, funcao, parseFloat(salario), id] 
        ); 
        res.json({ success: true }); 
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    } 
}); 
 
// DELETE /api/funcionarios/:id 
app.delete('/api/funcionarios/:id', async (req, res) => { 
    try { 
        const id = req.params.id; 
        await db.execute('DELETE FROM funcionarios WHERE id = ?', 
[id]); 
        res.json({ success: true }); 
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    } 
}); 
 
const PORT = 3000; 
app.listen(PORT, () => { 
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`); 
    console.log('Endpoints: /api/funcionarios (GET/POST/PUT/:id/DELETE/:id)');
}); 