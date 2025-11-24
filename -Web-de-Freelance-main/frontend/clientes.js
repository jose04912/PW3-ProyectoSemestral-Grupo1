// Módulo de Gestión de Clientes - Desarrollado por Bayron

// Variables globales
let clientes = [];
let editando = false;
let clienteEditando = null;

// Elementos del DOM
const formulario = document.getElementById('cliente-form');
const tablaClientes = document.getElementById('cuerpo-tabla');
const mensajeDiv = document.getElementById('mensaje');
const btnCancelar = document.getElementById('btn-cancel');
const formTitle = document.getElementById('form-title');

// URL base de la API (para cuando el backend esté listo)
const API_BASE_URL = 'http://localhost:3000/api';

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de Clientes cargado');
    inicializarModulo();
});

function inicializarModulo() {
    cargarClientes();
    
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
    });
}

// ==================== FUNCIONES PRINCIPALES ====================

// Función para cargar clientes
async function cargarClientes() {
    mostrarMensaje('Cargando clientes...', 'info');
    
    try {
        // Simulamos una llamada a la API
        await simularCargaAPI();
        
        // Datos de ejemplo para desarrollo
        clientes = [
            {
                _id: '1',
                nombreCliente: 'Empresa ABC, S.A.',
                email: 'contacto@empresaabc.com',
                telefono: '60001234',
                fechaRegistro: new Date('2024-01-15')
            },
            {
                _id: '2',
                nombreCliente: 'Juan Pérez',
                email: 'juan.perez@correo.com',
                telefono: '61112345',
                fechaRegistro: new Date('2024-01-20')
            },
            {
                _id: '3', 
                nombreCliente: 'María García',
                email: 'maria.garcia@empresa.com',
                telefono: '62223456',
                fechaRegistro: new Date('2024-02-01')
            }
        ];
        
        renderizarClientes();
        mostrarMensaje(`${clientes.length} clientes cargados correctamente`, 'success');
        
    } catch (error) {
        console.error('Error cargando clientes:', error);
        mostrarMensaje('Error al cargar los clientes. Usando datos de ejemplo.', 'error');
        
        // Datos de respaldo
        clientes = [];
        renderizarClientes();
    }
}

// Función para simular llamada a API (eliminar cuando el backend esté listo)
function simularCargaAPI() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('API: Clientes cargados (simulación)');
            resolve();
        }, 1000);
    });
}

// Función para renderizar la tabla de clientes
function renderizarClientes() {
    if (!tablaClientes) return;
    
    tablaClientes.innerHTML = '';
    
    if (clientes.length === 0) {
        tablaClientes.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <div style="color: #6c757d; font-style: italic;">
                        No hay clientes registrados. <br>
                        <small>Usa el formulario para agregar el primer cliente.</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    clientes.forEach(cliente => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${cliente.nombreCliente}</strong></td>
            <td>${cliente.email}</td>
            <td>${formatearTelefono(cliente.telefono)}</td>
            <td>${formatearFecha(cliente.fechaRegistro)}</td>
            <td class="acciones">
                <button class="btn btn-warning btn-small" onclick="editarCliente('${cliente._id}')">
                    ✏️ Editar
                </button>
                <button class="btn btn-danger btn-small" onclick="eliminarCliente('${cliente._id}')">
                    🗑️ Eliminar
                </button>
            </td>
        `;
        tablaClientes.appendChild(fila);
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
    const cliente = {
        nombreCliente: formData.get('nombreCliente').trim(),
        email: formData.get('email').trim().toLowerCase(),
        telefono: formData.get('telefono').trim()
    };
    
    mostrarMensaje('Procesando...', 'info');
    
    try {
        if (editando) {
            // Actualizar cliente existente
            await actualizarCliente(clienteEditando, cliente);
            mostrarMensaje('✅ Cliente actualizado correctamente', 'success');
        } else {
            // Crear nuevo cliente
            await crearCliente(cliente);
            mostrarMensaje('✅ Cliente registrado correctamente', 'success');
        }
        
        limpiarFormulario();
        await cargarClientes();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

// Función para crear cliente (simulación)
async function crearCliente(cliente) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const nuevoCliente = {
                _id: Date.now().toString(),
                ...cliente,
                fechaRegistro: new Date()
            };
            clientes.unshift(nuevoCliente);
            console.log('Cliente creado:', nuevoCliente);
            resolve(nuevoCliente);
        }, 500);
    });
}

// Función para actualizar cliente (simulación)
async function actualizarCliente(id, clienteActualizado) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const index = clientes.findIndex(c => c._id === id);
            if (index !== -1) {
                clientes[index] = { ...clientes[index], ...clienteActualizado };
                console.log('Cliente actualizado:', clientes[index]);
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
    
    const nombre = document.getElementById('nombreCliente').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    
    // Validar nombre
    if (!nombre) {
        mostrarError('error-nombre', 'El nombre del cliente es obligatorio');
        valido = false;
    } else if (nombre.length < 2) {
        mostrarError('error-nombre', 'El nombre debe tener al menos 2 caracteres');
        valido = false;
    }
    
    // Validar email
    if (!email) {
        mostrarError('error-email', 'El email es obligatorio');
        valido = false;
    } else if (!validarEmail(email)) {
        mostrarError('error-email', 'El formato del email no es válido');
        valido = false;
    }
    
    // Validar teléfono
    if (!telefono) {
        mostrarError('error-telefono', 'El teléfono es obligatorio');
        valido = false;
    } else if (!validarTelefono(telefono)) {
        mostrarError('error-telefono', 'El teléfono debe contener solo números (mínimo 8 dígitos)');
        valido = false;
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
        case 'nombreCliente':
            if (!valor) {
                mostrarError(errorId, 'El nombre del cliente es obligatorio');
            } else if (valor.length < 2) {
                mostrarError(errorId, 'El nombre debe tener al menos 2 caracteres');
            }
            break;
            
        case 'email':
            if (!valor) {
                mostrarError(errorId, 'El email es obligatorio');
            } else if (!validarEmail(valor)) {
                mostrarError(errorId, 'El formato del email no es válido');
            }
            break;
            
        case 'telefono':
            if (!valor) {
                mostrarError(errorId, 'El teléfono es obligatorio');
            } else if (!validarTelefono(valor)) {
                mostrarError(errorId, 'El teléfono debe contener solo números');
            }
            break;
    }
}

// Función para validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Función para validar teléfono
function validarTelefono(telefono) {
    const regex = /^\d{8,}$/; // Mínimo 8 dígitos
    return regex.test(telefono);
}

// ==================== FUNCIONES DE UTILIDAD ====================

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

// Función para formatear teléfono
function formatearTelefono(telefono) {
    if (!telefono) return '';
    // Formato: XXXX-XXXX
    return telefono.replace(/(\d{4})(\d{4})/, '$1-$2');
}

// Función para formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Función para limpiar el formulario
function limpiarFormulario() {
    if (formulario) {
        formulario.reset();
    }
    document.getElementById('cliente-id').value = '';
    editando = false;
    clienteEditando = null;
    
    if (formTitle) formTitle.textContent = 'Registrar Nuevo Cliente';
    if (btnCancelar) btnCancelar.style.display = 'none';
    
    limpiarErrores();
}

// ==================== FUNCIONES GLOBALES ====================

// Función para editar cliente (debe ser global para los botones)
window.editarCliente = function(id) {
    const cliente = clientes.find(c => c._id === id);
    if (!cliente) {
        mostrarMensaje('Cliente no encontrado', 'error');
        return;
    }
    
    // Llenar el formulario con los datos del cliente
    document.getElementById('cliente-id').value = cliente._id;
    document.getElementById('nombreCliente').value = cliente.nombreCliente;
    document.getElementById('email').value = cliente.email;
    document.getElementById('telefono').value = cliente.telefono;
    
    // Cambiar modo a edición
    editando = true;
    clienteEditando = id;
    
    if (formTitle) formTitle.textContent = 'Editar Cliente';
    if (btnCancelar) btnCancelar.style.display = 'inline-block';
    
    // Scroll al formulario
    document.querySelector('.form-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    mostrarMensaje(`Editando cliente: ${cliente.nombreCliente}`, 'info');
};

// Función para eliminar cliente (debe ser global para los botones)
window.eliminarCliente = async function(id) {
    const cliente = clientes.find(c => c._id === id);
    if (!cliente) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar al cliente:\n"${cliente.nombreCliente}"?`)) {
        return;
    }
    
    try {
        // Simular eliminación
        await new Promise(resolve => {
            setTimeout(() => {
                clientes = clientes.filter(c => c._id !== id);
                console.log('Cliente eliminado:', id);
                resolve();
            }, 500);
        });
        
        mostrarMensaje('✅ Cliente eliminado correctamente', 'success');
        renderizarClientes();
        
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        mostrarMensaje('❌ Error al eliminar el cliente', 'error');
    }
};

// Función para cancelar edición
function cancelarEdicion() {
    limpiarFormulario();
    mostrarMensaje('Edición cancelada', 'info');
}

console.log('Módulo de clientes inicializado - Desarrollado por Bayron');
