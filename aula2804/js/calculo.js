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
    Number(n1.value) / Number(n2.value);
    if (n1.value == 0 || n2.value == 0){
        resultado.innerHTML = 'Erro divisão por 0'
    }
    else {
        resultado.innerHTML = Number(n1.value) / Number(n2.value);
    }
}
function areaT() {
    resultado.innerHTML = (Number(n1.value) * Number(n2.value)) / 2;
}
function areaQ() {
    if (n1.value != n2.value){
        resultado.innerHTML = 'Os lados tem que ser iguais'
    }else{
    resultado.innerHTML = Number(n1.value) * Number(n1.value);
    }
}
function idade() {
    if(n1.value < 18){
        resultado.innerHTML = 'Menor de idade';
    }else {
        resultado.innerHTML = 'Maior de idade';
    }
}
function par() {
    if ((n1.value % 2) == 0){
        resultado.innerHTML = 'Par'
    }else{
        resultado.innerHTML = 'Impar'
    }
}