/**
 * =====================================================
 * TechFix Pro - Gestión de Cotizaciones
 * =====================================================
 */

let cotizaciones = [];
let clientes = [];
let servicios = [];
let items = [];
let editingId = null;
let viewingId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});

/**
 * Cargar todos los datos necesarios
 */
async function cargarDatos() {
    try {
        const [resCot, resCli, resServ] = await Promise.all([
            apiCall('cotizaciones.php'),
            apiCall('clientes.php'),
            apiCall('servicios.php')
        ]);
        
        if (resCot.success) cotizaciones = resCot.data;
        if (resCli.success) clientes = resCli.data;
        if (resServ.success) servicios = resServ.data;
        
        renderTabla();
        cargarSelectClientes();
        
    } catch (error) {
        showToast('Error al cargar datos', 'error');
    }
}

/**
 * Cargar select de clientes
 */
function cargarSelectClientes() {
    const select = document.getElementById('id_cliente');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione un cliente</option>';
    clientes.forEach(cliente => {
        select.innerHTML += `<option value="${cliente.id_cliente}">${cliente.nombre}</option>`;
    });
}

/**
 * Renderizar tabla de cotizaciones
 */
function renderTabla() {
    const tbody = document.getElementById('tabla-body');
    if (!tbody) return;
    
    if (cotizaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
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
            <td><span class="badge badge-${getEstadoBadge(cot.estado)}">${cot.estado}</span></td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-icon" onclick="ver(${cot.id_cotizacion})" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-secondary btn-icon" onclick="editar(${cot.id_cotizacion})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="eliminar(${cot.id_cotizacion})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Abrir modal para nueva cotización
 */
function openModal(id = null) {
    editingId = id;
    items = [];
    
    const modal = document.getElementById('modal-form');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('form-data');
    
    form.reset();
    title.innerHTML = id 
        ? '<i class="fas fa-file-invoice-dollar"></i> Editar Cotización' 
        : '<i class="fas fa-file-invoice-dollar"></i> Nueva Cotización';
    
    // Fecha por defecto
    document.getElementById('fecha_cotizacion').value = new Date().toISOString().split('T')[0];
    
    if (id) {
        cargarCotizacionParaEditar(id);
    } else {
        renderItems();
        calcularTotales();
    }
    
    modal.classList.add('active');
}

/**
 * Cargar cotización para editar
 */
async function cargarCotizacionParaEditar(id) {
    try {
        const result = await apiCall(`cotizaciones.php?action=getOne&id=${id}`);
        if (result.success) {
            const cot = result.data;
            document.getElementById('id_cliente').value = cot.id_cliente;
            document.getElementById('fecha_cotizacion').value = cot.fecha_cotizacion;
            document.getElementById('estado').value = cot.estado;
            document.getElementById('notas').value = cot.notas || '';
            
            items = cot.items.map(item => ({
                id_servicio: item.id_servicio,
                nombre_servicio: item.nombre_servicio,
                cantidad: parseInt(item.cantidad),
                precio_unitario: parseFloat(item.precio_unitario)
            }));
            
            renderItems();
            calcularTotales();
        }
    } catch (error) {
        showToast('Error al cargar cotización', 'error');
    }
}

/**
 * Editar cotización
 */
function editar(id) {
    openModal(id);
}

/**
 * Agregar item a la cotización
 */
function agregarItem() {
    items.push({
        id_servicio: '',
        nombre_servicio: '',
        cantidad: 1,
        precio_unitario: 0
    });
    renderItems();
}

/**
 * Eliminar item
 */
function eliminarItem(index) {
    items.splice(index, 1);
    renderItems();
    calcularTotales();
}

/**
 * Renderizar items de la cotización
 */
function renderItems() {
    const container = document.getElementById('items-container');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 2rem;">
                <p>Agrega servicios a la cotización</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map((item, index) => `
        <div class="quote-item" data-index="${index}">
            <div class="form-group">
                <label class="form-label">Servicio</label>
                <select class="form-control" onchange="actualizarItemServicio(${index}, this)">
                    <option value="">Seleccione...</option>
                    ${servicios.map(s => `
                        <option value="${s.id_servicio}" data-precio="${s.precio_base}" 
                            ${s.id_servicio == item.id_servicio ? 'selected' : ''}>
                            ${s.nombre}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Cantidad</label>
                <input type="number" class="form-control" value="${item.cantidad}" min="1" 
                    onchange="actualizarItemCantidad(${index}, this.value)">
            </div>
            <div class="form-group">
                <label class="form-label">Precio Unit.</label>
                <input type="number" class="form-control" value="${item.precio_unitario}" min="0" step="0.01"
                    onchange="actualizarItemPrecio(${index}, this.value)">
            </div>
            <div class="form-group">
                <label class="form-label">Subtotal</label>
                <input type="text" class="form-control mono" 
                    value="$${formatCurrency(item.cantidad * item.precio_unitario)}" readonly>
            </div>
            <button type="button" class="btn btn-danger btn-icon" onclick="eliminarItem(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

/**
 * Actualizar servicio del item
 */
function actualizarItemServicio(index, select) {
    const option = select.options[select.selectedIndex];
    items[index].id_servicio = select.value;
    items[index].nombre_servicio = option.text;
    items[index].precio_unitario = parseFloat(option.dataset.precio) || 0;
    renderItems();
    calcularTotales();
}

/**
 * Actualizar cantidad del item
 */
function actualizarItemCantidad(index, value) {
    items[index].cantidad = Math.max(1, parseInt(value) || 1);
    renderItems();
    calcularTotales();
}

/**
 * Actualizar precio del item
 */
function actualizarItemPrecio(index, value) {
    items[index].precio_unitario = Math.max(0, parseFloat(value) || 0);
    renderItems();
    calcularTotales();
}

/**
 * Calcular totales
 */
function calcularTotales() {
    let subtotal = 0;
    items.forEach(item => {
        subtotal += item.cantidad * item.precio_unitario;
    });
    
    const impuesto = subtotal * (TAX_RATE / 100);
    const total = subtotal + impuesto;
    
    document.getElementById('total-subtotal').textContent = `$${formatCurrency(subtotal)}`;
    document.getElementById('total-impuesto').textContent = `$${formatCurrency(impuesto)}`;
    document.getElementById('total-total').textContent = `$${formatCurrency(total)}`;
}

/**
 * Guardar cotización
 */
async function guardar() {
    const id_cliente = document.getElementById('id_cliente').value;
    const fecha_cotizacion = document.getElementById('fecha_cotizacion').value;
    const estado = document.getElementById('estado').value;
    const notas = document.getElementById('notas').value.trim();
    
    // Validaciones
    if (!id_cliente) {
        showToast('Debe seleccionar un cliente', 'error');
        return;
    }
    
    if (!fecha_cotizacion) {
        showToast('La fecha es obligatoria', 'error');
        return;
    }
    
    const validItems = items.filter(item => item.id_servicio && item.cantidad > 0);
    
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
            closeModal();
            await cargarDatos();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al guardar cotización', 'error');
    }
}

/**
 * Ver detalle de cotización
 */
async function ver(id) {
    viewingId = id;
    
    try {
        const result = await apiCall(`cotizaciones.php?action=getOne&id=${id}`);
        if (result.success) {
            const cot = result.data;
            
            const modal = document.getElementById('modal-ver');
            const title = document.getElementById('modal-ver-title');
            const body = document.getElementById('modal-ver-body');
            
            title.innerHTML = `<i class="fas fa-file-invoice"></i> Cotización ${cot.numero_cotizacion}`;
            
            body.innerHTML = `
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
            `;
            
            modal.classList.add('active');
        }
    } catch (error) {
        showToast('Error al cargar cotización', 'error');
    }
}

/**
 * Cerrar modal de ver
 */
function closeModalVer() {
    const modal = document.getElementById('modal-ver');
    if (modal) modal.classList.remove('active');
    viewingId = null;
}

/**
 * Eliminar cotización
 */
async function eliminar(id) {
    if (!confirm('¿Está seguro de eliminar esta cotización? Esta acción no se puede deshacer.')) return;
    
    try {
        const result = await apiCall(`cotizaciones.php?id=${id}`, 'DELETE');
        if (result.success) {
            showToast(result.message);
            await cargarDatos();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error al eliminar cotización', 'error');
    }
}

/**
 * Exportar detalle a CSV
 */
function exportarDetalle() {
    if (viewingId) {
        window.location.href = `${API_BASE}/exportar.php?tipo=detalle&id=${viewingId}`;
    }
}
