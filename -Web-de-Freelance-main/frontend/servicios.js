// Módulo de Gestión de Servicios - Desarrollado por Jackeline

// Variables globales
let servicios = [];
let editando = false;
let servicioEditando = null;

// Elementos del DOM
const formulario = document.getElementById('servicio-form');
const tablaServicios = document.getElementById('cuerpo-tabla');
const mensajeDiv = document.getElementById('mensaje');
const btnCancelar = document.getElementById('btn-cancel');
const formTitle = document.getElementById('form-title');

// URL base de la API (para cuando el backend esté listo)
const API_BASE_URL = 'http://localhost:3000/api';

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de Servicios cargado');
    inicializarModulo();
});

function inicializarModulo() {
    cargarServicios();
    
    // Agregar event listeners
    if (formulario) {
        formulario.addEventListener('submit', manejarEnvioFormulario);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicion);
    }
    
    // Agregar validación en tiempo real
    const inputs = formulario.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', validarCampo);
        input.addEventListener('input', formatearPrecio);
    });
}

// ==================== FUNCIONES PRINCIPALES ====================

// Función para cargar servicios
async function cargarServicios() {
    mostrarMensaje('Cargando servicios...', 'info');
    
    try {
        // Simulamos una llamada a la API
        await simularCargaAPI();
        
        // Datos de ejemplo para desarrollo
        servicios = [
            {
                _id: '1',
                nombreServicio: 'Mantenimiento Preventivo PC',
                precioBase: 75.00,
                descripcion: 'Limpieza interna, actualización de software y optimización del sistema.',
                fechaCreacion: new Date('2024-01-10')
            },
            {
                _id: '2',
                nombreServicio: 'Formateo e Instalación SO',
                precioBase: 50.00,
                descripcion: 'Instalación limpia del sistema operativo y drivers necesarios.',
                fechaCreacion: new Date('2024-01-15')
            },
            {
                _id: '3',
                nombreServicio: 'Soporte Técnico Remoto',
                precioBase: 35.00,
                descripcion: 'Asistencia técnica por acceso remoto para resolver problemas diversos.',
                fechaCreacion: new Date('2024-01-20')
            },
            {
                _id: '4',
                nombreServicio: 'Desarrollo Web Básico',
                precioBase: 150.00,
                descripcion: 'Creación de sitios web estáticos con HTML, CSS y JavaScript.',
                fechaCreacion: new Date('2024-02-01')
            }
        ];
        
        renderizarServicios();
        mostrarMensaje(`${servicios.length} servicios cargados correctamente`, 'success');
        
    } catch (error) {
        console.error('Error cargando servicios:', error);
        mostrarMensaje('Error al cargar los servicios. Usando datos de ejemplo.', 'error');
        
        // Datos de respaldo
        servicios = [];
        renderizarServicios();
    }
}

// Función para simular llamada a API (eliminar cuando el backend esté listo)
function simularCargaAPI() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('API: Servicios cargados (simulación)');
            resolve();
        }, 1000);
    });
}

// Función para renderizar la tabla de servicios
function renderizarServicios() {
    if (!tablaServicios) return;
    
    tablaServicios.innerHTML = '';
    
    if (servicios.length === 0) {
        tablaServicios.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px;">
                    <div style="color: #6c757d; font-style: italic;">
                        No hay servicios registrados. <br>
                        <small>Usa el formulario para agregar el primer servicio.</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    servicios.forEach(servicio => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>
                <strong>${servicio.nombreServicio}</strong>
                ${servicio.descripcion ? `<br><small class="descripcion">${servicio.descripcion}</small>` : ''}
            </td>
            <td class="precio">${formatearPrecioDisplay(servicio.precioBase)}</td>
            <td>${servicio.descripcion || '<em class="descripcion">Sin descripción</em>'}</td>
            <td class="acciones">
                <button class="btn btn-warning btn-small" onclick="editarServicio('${servicio._id}')">
                    ✏️ Editar
                </button>
                <button class="btn btn-danger btn-small" onclick="eliminarServicio('${servicio._id}')">
                    🗑️ Eliminar
                </button>
            </td>
        `;
        tablaServicios.appendChild(fila);
    });
}

// ==================== MANEJO DEL FORMULARIO ====================

// Función para manejar el envío del formulario
async function manejarEnvioFormulario(e) {
    e.preventDefault();
    
    if (!validarFormulario()) {
        return;
    }
    
    const formData = new FormData(formulario);
    const servicio = {
        nombreServicio: formData.get('nombreServicio').trim(),
        precioBase: parseFloat(formData.get('precioBase')),
        descripcion: formData.get('descripcion').trim()
    };
    
    mostrarMensaje('Procesando...', 'info');
    
    try {
        if (editando) {
            // Actualizar servicio existente
            await actualizarServicio(servicioEditando, servicio);
            mostrarMensaje('✅ Servicio actualizado correctamente', 'success');
        } else {
            // Crear nuevo servicio
            await crearServicio(servicio);
            mostrarMensaje('✅ Servicio registrado correctamente', 'success');
        }
        
        limpiarFormulario();
        await cargarServicios();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

// Función para crear servicio (simulación)
async function crearServicio(servicio) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const nuevoServicio = {
                _id: Date.now().toString(),
                ...servicio,
                fechaCreacion: new Date()
            };
            servicios.unshift(nuevoServicio);
            console.log('Servicio creado:', nuevoServicio);
            resolve(nuevoServicio);
        }, 500);
    });
}

// Función para actualizar servicio (simulación)
async function actualizarServicio(id, servicioActualizado) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const index = servicios.findIndex(s => s._id === id);
            if (index !== -1) {
                servicios[index] = { ...servicios[index], ...servicioActualizado };
                console.log('Servicio actualizado:', servicios[index]);
            }
            resolve();
        }, 500);
    });
}

// ==================== VALIDACIONES ====================

// Función para validar el formulario completo
function validarFormulario() {
    let valido = true;
    limpiarErrores();
    
    const nombre = document.getElementById('nombreServicio').value.trim();
    const precio = document.getElementById('precioBase').value.trim();
    
    // Validar nombre
    if (!nombre) {
        mostrarError('error-nombre', 'El nombre del servicio es obligatorio');
        valido = false;
    } else if (nombre.length < 3) {
        mostrarError('error-nombre', 'El nombre debe tener al menos 3 caracteres');
        valido = false;
    }
    
    // Validar precio
    if (!precio) {
        mostrarError('error-precio', 'El precio base es obligatorio');
        valido = false;
    } else {
        const precioNum = parseFloat(precio);
        if (isNaN(precioNum)) {
            mostrarError('error-precio', 'El precio debe ser un número válido');
            valido = false;
        } else if (precioNum < 0) {
            mostrarError('error-precio', 'El precio base debe ser mayor o igual a 0');
            valido = false;
        } else if (precioNum > 10000) {
            mostrarError('error-precio', 'El precio base no puede ser mayor a $10,000');
            valido = false;
        }
    }
    
    return valido;
}

// Validar campo individual
function validarCampo(e) {
    const campo = e.target;
    const valor = campo.value.trim();
    const errorId = `error-${campo.name || campo.id}`;
    
    limpiarError(errorId);
    
    switch(campo.id) {
        case 'nombreServicio':
            if (!valor) {
                mostrarError(errorId, 'El nombre del servicio es obligatorio');
            } else if (valor.length < 3) {
                mostrarError(errorId, 'El nombre debe tener al menos 3 caracteres');
            }
            break;
            
        case 'precioBase':
            if (!valor) {
                mostrarError(errorId, 'El precio base es obligatorio');
            } else {
                const precioNum = parseFloat(valor);
                if (isNaN(precioNum)) {
                    mostrarError(errorId, 'El precio debe ser un número válido');
                } else if (precioNum < 0) {
                    mostrarError(errorId, 'El precio base debe ser mayor o igual a 0');
                } else if (precioNum > 10000) {
                    mostrarError(errorId, 'El precio base no puede ser mayor a $10,000');
                }
            }
            break;
    }
}

// ==================== FUNCIONES DE UTILIDAD ====================

// Función para formatear precio en tiempo real
function formatearPrecio(e) {
    const input = e.target;
    if (input.id === 'precioBase') {
        let valor = input.value.replace(/[^\d.]/g, '');
        
        // Permitir solo un punto decimal
        const puntos = valor.split('.').length - 1;
        if (puntos > 1) {
            valor = valor.substring(0, valor.lastIndexOf('.'));
        }
        
        // Limitar a 2 decimales
        if (valor.includes('.')) {
            const partes = valor.split('.');
            if (partes[1].length > 2) {
                valor = partes[0] + '.' + partes[1].substring(0, 2);
            }
        }
        
        input.value = valor;
    }
}

// Función para formatear precio para mostrar
function formatearPrecioDisplay(precio) {
    return parseFloat(precio).toFixed(2);
}

// Función para mostrar errores
function mostrarError(elementoId, mensaje) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        elemento.textContent = mensaje;
    }
}

// Función para limpiar error específico
function limpiarError(elementoId) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        elemento.textContent = '';
    }
}

// Función para limpiar todos los errores
function limpiarErrores() {
    const errores = document.querySelectorAll('.error');
    errores.forEach(error => error.textContent = '');
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo) {
    if (!mensajeDiv) return;
    
    mensajeDiv.textContent = mensaje;
    mensajeDiv.className = `mensaje ${tipo}`;
    
    // Auto-ocultar mensajes de éxito e info
    if (tipo === 'success' || tipo === 'info') {
        setTimeout(() => {
            if (mensajeDiv.textContent === mensaje) {
                mensajeDiv.textContent = '';
                mensajeDiv.className = '';
            }
        }, 5000);
    }
}

// Función para limpiar el formulario
function limpiarFormulario() {
    if (formulario) {
        formulario.reset();
    }
    document.getElementById('servicio-id').value = '';
    editando = false;
    servicioEditando = null;
    
    if (formTitle) formTitle.textContent = 'Agregar Nuevo Servicio';
    if (btnCancelar) btnCancelar.style.display = 'none';
    
    limpiarErrores();
}

// ==================== FUNCIONES GLOBALES ====================

// Función para editar servicio (debe ser global para los botones)
window.editarServicio = function(id) {
    const servicio = servicios.find(s => s._id === id);
    if (!servicio) {
        mostrarMensaje('Servicio no encontrado', 'error');
        return;
    }
    
    // Llenar el formulario con los datos del servicio
    document.getElementById('servicio-id').value = servicio._id;
    document.getElementById('nombreServicio').value = servicio.nombreServicio;
    document.getElementById('precioBase').value = servicio.precioBase;
    document.getElementById('descripcion').value = servicio.descripcion || '';
    
    // Cambiar modo a edición
    editando = true;
    servicioEditando = id;
    
    if (formTitle) formTitle.textContent = 'Editar Servicio';
    if (btnCancelar) btnCancelar.style.display = 'inline-block';
    
    // Scroll al formulario
    document.querySelector('.form-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    mostrarMensaje(`Editando servicio: ${servicio.nombreServicio}`, 'info');
};

// Función para eliminar servicio (debe ser global para los botones)
window.eliminarServicio = async function(id) {
    const servicio = servicios.find(s => s._id === id);
    if (!servicio) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el servicio:\n"${servicio.nombreServicio}"?`)) {
        return;
    }
    
    try {
        // Simular eliminación
        await new Promise(resolve => {
            setTimeout(() => {
                servicios = servicios.filter(s => s._id !== id);
                console.log('Servicio eliminado:', id);
                resolve();
            }, 500);
        });
        
        mostrarMensaje('✅ Servicio eliminado correctamente', 'success');
        renderizarServicios();
        
    } catch (error) {
        console.error('Error eliminando servicio:', error);
        mostrarMensaje('❌ Error al eliminar el servicio', 'error');
    }
};

// Función para cancelar edición
function cancelarEdicion() {
    limpiarFormulario();
    mostrarMensaje('Edición cancelada', 'info');
}

// Función para mostrar servicios en formato portafolio
function mostrarPortafolio() {
    const portafolioContainer = document.getElementById('portafolio-container');
    if (!portafolioContainer) return;
    
    if (servicios.length === 0) {
        portafolioContainer.innerHTML = '<p>No hay servicios disponibles para mostrar.</p>';
        return;
    }
    
    let html = '<div class="portafolio-grid">';
    
    servicios.forEach(servicio => {
        html += `
            <div class="servicio-card">
                <h3>${servicio.nombreServicio}</h3>
                <div class="precio">${formatearPrecioDisplay(servicio.precioBase)}</div>
                <p class="descripcion">${servicio.descripcion || 'Servicio profesional de calidad.'}</p>
            </div>
        `;
    });
    
    html += '</div>';
    portafolioContainer.innerHTML = html;
}

console.log('Módulo de servicios inicializado - Desarrollado por Jackeline');
