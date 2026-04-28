var n1 = document.getElementById("n1");
var n2 = document.getElementById("n2");
var resultado = document.getElementById("resultado");

function somar() {
    resultado.innerHTML = Number(n1.value) + Number(n2.value);
}

function subtrair() {
    resultado.innerHTML = Number(n1.value) - Number(n2.value);
}
function multiplicar() {
    resultado.innerHTML = Number(n1.value) * Number(n2.value);
}
function dividir() {
    resultado.innerHTML = Number(n1.value) / Number(n2.value);
}

