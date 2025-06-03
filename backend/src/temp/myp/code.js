// Escribe o pega tu código aquí para analizarlo// Archivo: ejemploErrores.js

function calcularAreaRectangulo(base, altura) {
    var area = base * altura;
    return area;
}

function funcionInnecesaria() {
    return;
    console.log("Esta línea nunca se ejecutará");
}

eval("console.log('Uso de eval no recomendado')");

var variableSinUso;

console.log("Área del rectángulo: " + calcularAreaRectangulo(5, 3));
