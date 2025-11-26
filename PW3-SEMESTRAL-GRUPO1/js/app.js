/**
 * =====================================================
 * TechFix Pro - Sistema de Cotizaciones
 * JavaScript Principal
 * =====================================================
 */

// ========== CONFIGURACIÓN ==========
const API_BASE = './php';
const TAX_RATE = 8; // Porcentaje de impuesto

// ========== ESTADO GLOBAL ==========
let clientes = [];
let servicios = [];
let cotizaciones = [];
let cotizacionItems = [];
let editingId = null;

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Cargar datos iniciales
    await Promise.all([
        loadClientes(),
        loadServicios(),
        loadCotizaciones()
    ]);
    
    // Inicializar eventos
    initEventListeners();
    
    // Mostrar servicios en portafolio
    renderServiciosPortafolio();
    
    // Actualizar estadísticas
    updateStats();
}

// ========== EVENT LISTENERS ==========
function initEventListeners() {
    // Tabs de navegación
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // Cerrar modales con click fuera
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeAllModals();
            }
        });
    });
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Filtros de cotizaciones
    const filtroCliente = document.getElementById('filtro-cliente');
    const filtroDesde = document.getElementById('filtro-fecha-desde');
    const filtroHasta = document.getElementById('filtro-fecha-hasta');
    
    if (filtroCliente) filtroCliente.addEventListener('change', filterCotizaciones);
    if (filtroDesde) filtroDesde.addEventListener('change', filterCotizaciones);
    if (filtroHasta) filtroHasta.addEventListener('change', filterCotizaciones);
}

// ========== TABS ==========
function switchTab(tabId) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
    
    // Cargar datos según la pestaña
    switch(tabId) {
        case 'tab-clientes':
            renderClientesTable();
            break;
        case 'tab-servicios':
            renderServiciosTable();
            break;
        case 'tab-cotizaciones':
            renderCotizacionesTable();
            break;
        case 'tab-reportes':
            loadReporte();
            break;
    }
}

// ========== UTILIDADES ==========
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-times-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon} toast-icon"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-PA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    editingId = null;
}

// ========== API CALLS ==========
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ========== CLIENTES ==========
async function loadClientes() {
    try {
        const result = await apiCall('clientes.php');
        if (result.success) {
            clientes = result.data;
            updateClienteSelects();
        }
    } catch (error) {
        showToast('Error al cargar clientes', 'error');
    }
}

function updateClienteSelects() {
    const selects = document.querySelectorAll('.cliente-select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccione un cliente</option>';
        clientes.forEach(cliente => {
            select.innerHTML += `<option value="${cliente.id_cliente}">${cliente.nombre}</option>`;
        });
        if (currentValue) select.value = currentValue;
    });
}

function renderClientesTable() {
    const tbody = document.getElementById('clientes-tbody');
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
                <button class="btn btn-secondary btn-icon" onclick="editCliente(${cliente.id_cliente})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteCliente(${cliente.id_cliente})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openClienteModal(id = null) {
    editingId = id;
    const modal = document.getElementById('modal-cliente');
    const title = document.getElementById('modal-cliente-title');
    const form = document.getElementById('form-cliente');
    
    form.reset();
    title.textContent = id ? 'Editar Cliente' : 'Nuevo Cliente';
    
    if (id) {
        const cliente = clientes.find(c => c.id_cliente == id);
        if (cliente) {
            document.getElementById('cliente-nombre').value = cliente.nombre;
            document.getElementById('cliente-email').value = cliente.email;
            document.getElementById('cliente-telefono').value = cliente.telefono;
            document.getElementById('cliente-direccion').value = cliente.direccion || '';
        }
    }
    
    modal.classList.add('active');
}

async function editCliente(id) {
    openClienteModal(id);
}

async function saveCliente() {
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const email = document.getElementById('cliente-email').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const direccion = document.getElementById('cliente-direccion').value.trim();
    
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
            closeAllModals();
            await loadClientes();
            renderClientesTable();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al guardar cliente', 'error');
    }
}

async function deleteCliente(id) {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;
    
    try {
        const result = await apiCall(`clientes.php?id=${id}`, 'DELETE');
        if (result.success) {
            showToast(result.message);
            await loadClientes();
            renderClientesTable();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al eliminar cliente', 'error');
    }
}

// ========== SERVICIOS ==========
async function loadServicios() {
    try {
        const result = await apiCall('servicios.php');
        if (result.success) {
            servicios = result.data;
            updateServicioSelects();
        }
    } catch (error) {
        showToast('Error al cargar servicios', 'error');
    }
}

function updateServicioSelects() {
    const selects = document.querySelectorAll('.servicio-select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccione un servicio</option>';
        servicios.forEach(servicio => {
            select.innerHTML += `<option value="${servicio.id_servicio}" data-precio="${servicio.precio_base}">${servicio.nombre} - $${formatCurrency(servicio.precio_base)}</option>`;
        });
        if (currentValue) select.value = currentValue;
    });
}

function renderServiciosPortafolio() {
    const grid = document.getElementById('servicios-grid');
    if (!grid) return;
    
    const icons = ['fa-desktop', 'fa-hdd', 'fa-shield-virus', 'fa-headset', 'fa-microchip', 'fa-database', 'fa-network-wired', 'fa-cloud-upload-alt'];
    
    grid.innerHTML = servicios.map((servicio, index) => `
        <div class="service-card">
            <div class="service-icon">
                <i class="fas ${icons[index % icons.length]}"></i>
            </div>
            <h3>${servicio.nombre}</h3>
            <p>${servicio.descripcion || 'Servicio profesional de soporte técnico'}</p>
            <div class="service-price">
                $${formatCurrency(servicio.precio_base)} <span>/ servicio</span>
            </div>
        </div>
    `).join('');
}

function renderServiciosTable() {
    const tbody = document.getElementById('servicios-tbody');
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
                <button class="btn btn-secondary btn-icon" onclick="editServicio(${servicio.id_servicio})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteServicio(${servicio.id_servicio})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openServicioModal(id = null) {
    editingId = id;
    const modal = document.getElementById('modal-servicio');
    const title = document.getElementById('modal-servicio-title');
    const form = document.getElementById('form-servicio');
    
    form.reset();
    title.textContent = id ? 'Editar Servicio' : 'Nuevo Servicio';
    
    if (id) {
        const servicio = servicios.find(s => s.id_servicio == id);
        if (servicio) {
            document.getElementById('servicio-nombre').value = servicio.nombre;
            document.getElementById('servicio-descripcion').value = servicio.descripcion || '';
            document.getElementById('servicio-precio').value = servicio.precio_base;
        }
    }
    
    modal.classList.add('active');
}

async function editServicio(id) {
    openServicioModal(id);
}

async function saveServicio() {
    const nombre = document.getElementById('servicio-nombre').value.trim();
    const descripcion = document.getElementById('servicio-descripcion').value.trim();
    const precio_base = parseFloat(document.getElementById('servicio-precio').value) || 0;
    
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
            closeAllModals();
            await loadServicios();
            renderServiciosTable();
            renderServiciosPortafolio();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al guardar servicio', 'error');
    }
}

async function deleteServicio(id) {
    if (!confirm('¿Está seguro de eliminar este servicio?')) return;
    
    try {
        const result = await apiCall(`servicios.php?id=${id}`, 'DELETE');
        if (result.success) {
            showToast(result.message);
            await loadServicios();
            renderServiciosTable();
            renderServiciosPortafolio();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al eliminar servicio', 'error');
    }
}

// ========== COTIZACIONES ==========
async function loadCotizaciones() {
    try {
        const result = await apiCall('cotizaciones.php');
        if (result.success) {
            cotizaciones = result.data;
        }
    } catch (error) {
        showToast('Error al cargar cotizaciones', 'error');
    }
}

function renderCotizacionesTable() {
    const tbody = document.getElementById('cotizaciones-tbody');
    if (!tbody) return;
    
    if (cotizaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <h3>No hay cotizaciones</h3>
                    <p>Crea tu primera cotización</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = cotizaciones.map(cot => `
        <tr>
            <td><span class="quote-number">${cot.numero_cotizacion}</span></td>
            <td>${formatDate(cot.fecha_cotizacion)}</td>
            <td><strong>${cot.nombre_cliente}</strong></td>
            <td class="mono">$${formatCurrency(cot.subtotal)}</td>
            <td class="mono">$${formatCurrency(cot.impuesto)}</td>
            <td class="mono"><strong>$${formatCurrency(cot.total)}</strong></td>
            <td>
                <span class="badge badge-${getEstadoBadge(cot.estado)}">${cot.estado}</span>
            </td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-icon" onclick="viewCotizacion(${cot.id_cotizacion})" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-secondary btn-icon" onclick="editCotizacion(${cot.id_cotizacion})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteCotizacion(${cot.id_cotizacion})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getEstadoBadge(estado) {
    const badges = {
        'pendiente': 'warning',
        'aprobada': 'success',
        'rechazada': 'danger',
        'completada': 'info'
    };
    return badges[estado] || 'info';
}

async function openCotizacionModal(id = null) {
    editingId = id;
    cotizacionItems = [];
    
    const modal = document.getElementById('modal-cotizacion');
    const title = document.getElementById('modal-cotizacion-title');
    const form = document.getElementById('form-cotizacion');
    
    form.reset();
    title.textContent = id ? 'Editar Cotización' : 'Nueva Cotización';
    
    // Actualizar selects
    updateClienteSelects();
    
    // Fecha por defecto
    document.getElementById('cotizacion-fecha').value = new Date().toISOString().split('T')[0];
    
    if (id) {
        // Cargar datos de cotización existente
        try {
            const result = await apiCall(`cotizaciones.php?action=getOne&id=${id}`);
            if (result.success) {
                const cot = result.data;
                document.getElementById('cotizacion-cliente').value = cot.id_cliente;
                document.getElementById('cotizacion-fecha').value = cot.fecha_cotizacion;
                document.getElementById('cotizacion-estado').value = cot.estado;
                document.getElementById('cotizacion-notas').value = cot.notas || '';
                
                cotizacionItems = cot.items.map(item => ({
                    id_servicio: item.id_servicio,
                    nombre_servicio: item.nombre_servicio,
                    cantidad: parseInt(item.cantidad),
                    precio_unitario: parseFloat(item.precio_unitario)
                }));
            }
        } catch (error) {
            showToast('Error al cargar cotización', 'error');
        }
    } else {
        // Agregar un item vacío por defecto
        cotizacionItems = [];
    }
    
    renderCotizacionItems();
    calculateTotals();
    modal.classList.add('active');
}

function renderCotizacionItems() {
    const container = document.getElementById('cotizacion-items');
    
    if (cotizacionItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 2rem;">
                <p>Agrega servicios a la cotización</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = cotizacionItems.map((item, index) => `
        <div class="quote-item" data-index="${index}">
            <div class="form-group">
                <label class="form-label">Servicio</label>
                <select class="form-control servicio-select" onchange="updateItemServicio(${index}, this)">
                    <option value="">Seleccione...</option>
                    ${servicios.map(s => `
                        <option value="${s.id_servicio}" data-precio="${s.precio_base}" ${s.id_servicio == item.id_servicio ? 'selected' : ''}>
                            ${s.nombre}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Cantidad</label>
                <input type="number" class="form-control" value="${item.cantidad}" min="1" 
                    onchange="updateItemCantidad(${index}, this.value)">
            </div>
            <div class="form-group">
                <label class="form-label">Precio Unit.</label>
                <input type="number" class="form-control" value="${item.precio_unitario}" min="0" step="0.01"
                    onchange="updateItemPrecio(${index}, this.value)">
            </div>
            <div class="form-group">
                <label class="form-label">Subtotal</label>
                <input type="text" class="form-control mono" value="$${formatCurrency(item.cantidad * item.precio_unitario)}" readonly>
            </div>
            <button type="button" class="btn btn-danger btn-icon" onclick="removeItem(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function addItem() {
    cotizacionItems.push({
        id_servicio: '',
        nombre_servicio: '',
        cantidad: 1,
        precio_unitario: 0
    });
    renderCotizacionItems();
}

function removeItem(index) {
    cotizacionItems.splice(index, 1);
    renderCotizacionItems();
    calculateTotals();
}

function updateItemServicio(index, select) {
    const option = select.options[select.selectedIndex];
    cotizacionItems[index].id_servicio = select.value;
    cotizacionItems[index].nombre_servicio = option.text;
    cotizacionItems[index].precio_unitario = parseFloat(option.dataset.precio) || 0;
    renderCotizacionItems();
    calculateTotals();
}

function updateItemCantidad(index, value) {
    cotizacionItems[index].cantidad = Math.max(1, parseInt(value) || 1);
    renderCotizacionItems();
    calculateTotals();
}

function updateItemPrecio(index, value) {
    cotizacionItems[index].precio_unitario = Math.max(0, parseFloat(value) || 0);
    renderCotizacionItems();
    calculateTotals();
}

function calculateTotals() {
    let subtotal = 0;
    cotizacionItems.forEach(item => {
        subtotal += item.cantidad * item.precio_unitario;
    });
    
    const impuesto = subtotal * (TAX_RATE / 100);
    const total = subtotal + impuesto;
    
    document.getElementById('cotizacion-subtotal').textContent = `$${formatCurrency(subtotal)}`;
    document.getElementById('cotizacion-impuesto').textContent = `$${formatCurrency(impuesto)}`;
    document.getElementById('cotizacion-total').textContent = `$${formatCurrency(total)}`;
}

async function saveCotizacion() {
    const id_cliente = document.getElementById('cotizacion-cliente').value;
    const fecha_cotizacion = document.getElementById('cotizacion-fecha').value;
    const estado = document.getElementById('cotizacion-estado').value;
    const notas = document.getElementById('cotizacion-notas').value.trim();
    
    // Validaciones
    if (!id_cliente) {
        showToast('Debe seleccionar un cliente', 'error');
        return;
    }
    
    if (!fecha_cotizacion) {
        showToast('La fecha es obligatoria', 'error');
        return;
    }
    
    // Validar items
    const validItems = cotizacionItems.filter(item => item.id_servicio && item.cantidad > 0);
    
    if (validItems.length === 0) {
        showToast('Debe agregar al menos un servicio', 'error');
        return;
    }
    
    const data = {
        id_cliente: parseInt(id_cliente),
        fecha_cotizacion,
        estado,
        notas,
        porcentaje_impuesto: TAX_RATE,
        items: validItems.map(item => ({
            id_servicio: parseInt(item.id_servicio),
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario
        }))
    };
    
    try {
        let result;
        if (editingId) {
            data.id_cotizacion = editingId;
            result = await apiCall('cotizaciones.php', 'PUT', data);
        } else {
            result = await apiCall('cotizaciones.php', 'POST', data);
        }
        
        if (result.success) {
            showToast(result.message);
            closeAllModals();
            await loadCotizaciones();
            renderCotizacionesTable();
            updateStats();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al guardar cotización', 'error');
    }
}

async function editCotizacion(id) {
    await openCotizacionModal(id);
}

async function viewCotizacion(id) {
    try {
        const result = await apiCall(`cotizaciones.php?action=getOne&id=${id}`);
        if (result.success) {
            const cot = result.data;
            
            // Crear modal de vista
            const modalHtml = `
                <div class="modal-overlay active" id="modal-view-cot" onclick="if(event.target===this)this.remove()">
                    <div class="modal">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                <i class="fas fa-file-invoice"></i>
                                Cotización ${cot.numero_cotizacion}
                            </h3>
                            <button class="modal-close" onclick="document.getElementById('modal-view-cot').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="form-row" style="margin-bottom: 1.5rem;">
                                <div>
                                    <strong>Cliente:</strong><br>
                                    ${cot.nombre_cliente}<br>
                                    <small>${cot.email} | ${cot.telefono}</small>
                                </div>
                                <div>
                                    <strong>Fecha:</strong><br>
                                    ${formatDate(cot.fecha_cotizacion)}
                                </div>
                                <div>
                                    <strong>Estado:</strong><br>
                                    <span class="badge badge-${getEstadoBadge(cot.estado)}">${cot.estado}</span>
                                </div>
                            </div>
                            
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Servicio</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unit.</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${cot.items.map(item => `
                                            <tr>
                                                <td>${item.nombre_servicio}</td>
                                                <td class="mono">${item.cantidad}</td>
                                                <td class="mono">$${formatCurrency(item.precio_unitario)}</td>
                                                <td class="mono">$${formatCurrency(item.subtotal_item)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="quote-totals">
                                <div class="quote-total-row">
                                    <span>Subtotal:</span>
                                    <span class="mono">$${formatCurrency(cot.subtotal)}</span>
                                </div>
                                <div class="quote-total-row">
                                    <span>ITBMS (${cot.porcentaje_impuesto}%):</span>
                                    <span class="mono">$${formatCurrency(cot.impuesto)}</span>
                                </div>
                                <div class="quote-total-row grand-total">
                                    <span>Total:</span>
                                    <span>$${formatCurrency(cot.total)}</span>
                                </div>
                            </div>
                            
                            ${cot.notas ? `
                                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md);">
                                    <strong>Notas:</strong><br>
                                    ${cot.notas}
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="exportarDetalle(${cot.id_cotizacion})">
                                <i class="fas fa-download"></i> Exportar CSV
                            </button>
                            <button class="btn btn-primary" onclick="document.getElementById('modal-view-cot').remove()">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    } catch (error) {
        showToast('Error al cargar cotización', 'error');
    }
}

async function deleteCotizacion(id) {
    if (!confirm('¿Está seguro de eliminar esta cotización? Esta acción no se puede deshacer.')) return;
    
    try {
        const result = await apiCall(`cotizaciones.php?id=${id}`, 'DELETE');
        if (result.success) {
            showToast(result.message);
            await loadCotizaciones();
            renderCotizacionesTable();
            updateStats();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al eliminar cotización', 'error');
    }
}

// ========== REPORTES ==========
async function loadReporte() {
    const clienteId = document.getElementById('filtro-cliente')?.value || '';
    const fechaDesde = document.getElementById('filtro-fecha-desde')?.value || '';
    const fechaHasta = document.getElementById('filtro-fecha-hasta')?.value || '';
    
    let url = 'cotizaciones.php?action=reporte';
    if (clienteId) url += `&cliente=${clienteId}`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    
    try {
        const result = await apiCall(url);
        if (result.success) {
            renderReporte(result.data);
        }
    } catch (error) {
        showToast('Error al cargar reporte', 'error');
    }
}

function renderReporte(data) {
    const tbody = document.getElementById('reporte-tbody');
    const totalesRow = document.getElementById('reporte-totales');
    
    if (!tbody) return;
    
    if (data.cotizaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No hay resultados</h3>
                    <p>Ajusta los filtros para ver cotizaciones</p>
                </td>
            </tr>
        `;
        totalesRow.innerHTML = '';
        return;
    }
    
    tbody.innerHTML = data.cotizaciones.map(cot => `
        <tr>
            <td>${formatDate(cot.fecha_cotizacion)}</td>
            <td><span class="quote-number">${cot.numero_cotizacion}</span></td>
            <td><strong>${cot.nombre_cliente}</strong></td>
            <td class="mono">$${formatCurrency(cot.subtotal)}</td>
            <td class="mono">$${formatCurrency(cot.impuesto)}</td>
            <td class="mono"><strong>$${formatCurrency(cot.total)}</strong></td>
        </tr>
    `).join('');
    
    totalesRow.innerHTML = `
        <td colspan="3" style="text-align: right;"><strong>TOTALES:</strong></td>
        <td class="mono"><strong>$${formatCurrency(data.totales.subtotal)}</strong></td>
        <td class="mono"><strong>$${formatCurrency(data.totales.impuesto)}</strong></td>
        <td class="mono" style="color: var(--primary);"><strong>$${formatCurrency(data.totales.total)}</strong></td>
    `;
}

function filterCotizaciones() {
    loadReporte();
}

function limpiarFiltros() {
    document.getElementById('filtro-cliente').value = '';
    document.getElementById('filtro-fecha-desde').value = '';
    document.getElementById('filtro-fecha-hasta').value = '';
    loadReporte();
}

// ========== EXPORTACIÓN CSV ==========
function exportarCotizaciones() {
    const clienteId = document.getElementById('filtro-cliente')?.value || '';
    const fechaDesde = document.getElementById('filtro-fecha-desde')?.value || '';
    const fechaHasta = document.getElementById('filtro-fecha-hasta')?.value || '';
    
    let url = `${API_BASE}/exportar.php?tipo=cotizaciones`;
    if (clienteId) url += `&cliente=${clienteId}`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    
    window.location.href = url;
}

function exportarClientes() {
    window.location.href = `${API_BASE}/exportar.php?tipo=clientes`;
}

function exportarServicios() {
    window.location.href = `${API_BASE}/exportar.php?tipo=servicios`;
}

function exportarDetalle(id) {
    window.location.href = `${API_BASE}/exportar.php?tipo=detalle&id=${id}`;
}

// ========== ESTADÍSTICAS ==========
function updateStats() {
    // Total cotizaciones
    const totalCot = document.getElementById('stat-cotizaciones');
    if (totalCot) totalCot.textContent = cotizaciones.length;
    
    // Total clientes
    const totalCli = document.getElementById('stat-clientes');
    if (totalCli) totalCli.textContent = clientes.length;
    
    // Total facturado
    const totalFact = document.getElementById('stat-facturado');
    if (totalFact) {
        const total = cotizaciones.reduce((sum, cot) => sum + parseFloat(cot.total), 0);
        totalFact.textContent = `$${formatCurrency(total)}`;
    }
    
    // Servicios activos
    const totalServ = document.getElementById('stat-servicios');
    if (totalServ) totalServ.textContent = servicios.length;
}

// ========== VALIDACIONES ==========
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^[0-9\-\+\s]+$/;
    return re.test(phone);
}

// ========== NAVEGACIÓN DESDE INICIO ==========
function irACotizar() {
    if (clientes.length === 0) {
        showToast('Primero debe registrar un cliente', 'warning');
        switchTab('tab-clientes');
        setTimeout(() => openClienteModal(), 300);
        return;
    }
    switchTab('tab-cotizaciones');
    setTimeout(() => openCotizacionModal(), 300);
}

function irARegistrarse() {
    switchTab('tab-clientes');
    setTimeout(() => openClienteModal(), 300);
}
