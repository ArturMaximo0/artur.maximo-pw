// config inicial chamar o express vai procurar o módulo
const express = require('express')
const app = express() // inicializar as apps

// forma de ler JSON UTILIZAR MIDDLEWARES
app.use( // criando o MIDDLEWARES
    express.urlencoded({
        extended: true,
    })
)

app.use(express.json())

// rota inicial  GET pegar algo do servidor endpoit
app.get('/', (req, res) => {

    //mostrar requisição mostrar a resposta que vai ser JSON
    res.json({ message: 'oi Express'})
})
//23 minutos 12
  //entregar a porta
app.listen(3000)