/**
 * =====================================================
 * TechFix Pro - Gestión de Servicios
 * =====================================================
 */

let servicios = [];
let editingId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarServicios();
});

/**
 * Cargar lista de servicios
 */
async function cargarServicios() {
    try {
        const result = await apiCall('servicios.php');
        if (result.success) {
            servicios = result.data;
            renderTabla();
        }
    } catch (error) {
        showToast('Error al cargar servicios', 'error');
    }
}

/**
 * Renderizar tabla de servicios
 */
function renderTabla() {
    const tbody = document.getElementById('tabla-body');
    if (!tbody) return;
    
    if (servicios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-tools"></i>
                    <h3>No hay servicios registrados</h3>
                    <p>Agrega servicios para poder crear cotizaciones</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = servicios.map(servicio => `
        <tr>
            <td><strong>${servicio.nombre}</strong></td>
            <td>${servicio.descripcion || '-'}</td>
            <td class="mono">$${formatCurrency(servicio.precio_base)}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-icon" onclick="editar(${servicio.id_servicio})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="eliminar(${servicio.id_servicio})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Abrir modal para nuevo/editar servicio
 */
function openModal(id = null) {
    editingId = id;
    const modal = document.getElementById('modal-form');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('form-data');
    
    form.reset();
    title.innerHTML = id 
        ? '<i class="fas fa-cog"></i> Editar Servicio' 
        : '<i class="fas fa-cog"></i> Nuevo Servicio';
    
    if (id) {
        const servicio = servicios.find(s => s.id_servicio == id);
        if (servicio) {
            document.getElementById('nombre').value = servicio.nombre;
            document.getElementById('descripcion').value = servicio.descripcion || '';
            document.getElementById('precio_base').value = servicio.precio_base;
        }
    }
    
    modal.classList.add('active');
}

/**
 * Editar servicio
 */
function editar(id) {
    openModal(id);
}

/**
 * Guardar servicio (crear o actualizar)
 */
async function guardar() {
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precio_base = parseFloat(document.getElementById('precio_base').value) || 0;
    
    // Validaciones
    if (!nombre) {
        showToast('El nombre del servicio es obligatorio', 'error');
        return;
    }
    
    if (precio_base < 0) {
        showToast('El precio debe ser mayor o igual a 0', 'error');
        return;
    }
    
    const data = { nombre, descripcion, precio_base };
    
    try {
        let result;
        if (editingId) {
            data.id_servicio = editingId;
            result = await apiCall('servicios.php', 'PUT', data);
        } else {
            result = await apiCall('servicios.php', 'POST', data);
        }
        
        if (result.success) {
            showToast(result.message);
            closeModal();
            await cargarServicios();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al guardar servicio', 'error');
    }
}

/**
 * Eliminar servicio
 */
async function eliminar(id) {
    if (!confirm('¿Está seguro de eliminar este servicio?')) return;
    
    try {
        const result = await apiCall(`servicios.php?id=${id}`, 'DELETE');
        if (result.success) {
            showToast(result.message);
            await cargarServicios();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al eliminar servicio', 'error');
    }
}

/**
 * Exportar servicios a CSV
 */
function exportarServicios() {
    window.location.href = `${API_BASE}/exportar.php?tipo=servicios`;
}
