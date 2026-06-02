function mudarQ (produto, valor) {
    let qtd = document.getElementById("qtd" + produto);
    let preco = document.getElementById("preco" + produto);
    let total = document.getElementById("tatal" + produto);

    let quantidade = Number(qtd.textContent);

    quantidade += valor;

    if(quantidade < 0) {
        quantidade = 0;
    }
    
    qtd.textContent = quantidade;

    let precoUnitario = Number(preco.textContent);
    let totalProduto = quantidade * precoUnitario;

    total.textContent = Number(preco.textContent);
    
    atualizarSubtotaol();
}

function atualizarSubtotal() {

    let total1 = Number(document.getElementById("total1").textContent);
    let total2 = Number(document.getElementById("total2").textContent);
    let total3 = Number(document.getElementById("total3").textContent);

    let subtotal = total + total2 + total3;

    document.getElementById("subtotal").textContent = subtotal;
}