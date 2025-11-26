/**
 * =====================================================
 * TechFix Pro - Gestión de Clientes
 * =====================================================
 */

let clientes = [];
let editingId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
});

/**
 * Cargar lista de clientes
 */
async function cargarClientes() {
    try {
        const result = await apiCall('clientes.php');
        if (result.success) {
            clientes = result.data;
            renderTabla();
        }
    } catch (error) {
        showToast('Error al cargar clientes', 'error');
    }
}

/**
 * Renderizar tabla de clientes
 */
function renderTabla() {
    const tbody = document.getElementById('tabla-body');
    if (!tbody) return;
    
    if (clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No hay clientes registrados</h3>
                    <p>Agrega tu primer cliente para comenzar</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = clientes.map(cliente => `
        <tr>
            <td><strong>${cliente.nombre}</strong></td>
            <td>${cliente.email}</td>
            <td class="mono">${cliente.telefono}</td>
            <td>${cliente.direccion || '-'}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-icon" onclick="editar(${cliente.id_cliente})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="eliminar(${cliente.id_cliente})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Abrir modal para nuevo/editar cliente
 */
function openModal(id = null) {
    editingId = id;
    const modal = document.getElementById('modal-form');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('form-data');
    
    form.reset();
    title.innerHTML = id 
        ? '<i class="fas fa-user-edit"></i> Editar Cliente' 
        : '<i class="fas fa-user-plus"></i> Nuevo Cliente';
    
    if (id) {
        const cliente = clientes.find(c => c.id_cliente == id);
        if (cliente) {
            document.getElementById('nombre').value = cliente.nombre;
            document.getElementById('email').value = cliente.email;
            document.getElementById('telefono').value = cliente.telefono;
            document.getElementById('direccion').value = cliente.direccion || '';
        }
    }
    
    modal.classList.add('active');
}

/**
 * Editar cliente
 */
function editar(id) {
    openModal(id);
}

/**
 * Guardar cliente (crear o actualizar)
 */
async function guardar() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    
    // Validaciones
    if (!nombre) {
        showToast('El nombre es obligatorio', 'error');
        return;
    }
    
    if (!email || !isValidEmail(email)) {
        showToast('Ingrese un email válido', 'error');
        return;
    }
    
    if (!telefono || !isValidPhone(telefono)) {
        showToast('Ingrese un teléfono válido (solo números y guiones)', 'error');
        return;
    }
    
    const data = { nombre, email, telefono, direccion };
    
    try {
        let result;
        if (editingId) {
            data.id_cliente = editingId;
            result = await apiCall('clientes.php', 'PUT', data);
        } else {
            result = await apiCall('clientes.php', 'POST', data);
        }
        
        if (result.success) {
            showToast(result.message);
            closeModal();
            await cargarClientes();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al guardar cliente', 'error');
    }
}

/**
 * Eliminar cliente
 */
async function eliminar(id) {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;
    
    try {
        const result = await apiCall(`clientes.php?id=${id}`, 'DELETE');
        if (result.success) {
            showToast(result.message);
            await cargarClientes();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al eliminar cliente', 'error');
    }
}

/**
 * Exportar clientes a CSV
 */
function exportarClientes() {
    window.location.href = `${API_BASE}/exportar.php?tipo=clientes`;
}
