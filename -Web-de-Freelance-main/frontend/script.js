// Archivo principal de JavaScript
console.log('Web de Freelance cargada correctamente');

// Función para navegar entre páginas
function navegarA(pagina) {
    window.location.href = pagina;
}

// Función para mostrar/ocultar elementos
function toggleElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
}

// Cargar datos iniciales cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página cargada completamente');
});
