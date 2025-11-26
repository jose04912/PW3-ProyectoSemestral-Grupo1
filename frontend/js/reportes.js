/**
 * =====================================================
 * TechFix Pro - Reportes
 * =====================================================
 */

let clientes = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
    cargarReporte();
});

/**
 * Cargar lista de clientes para el filtro
 */
async function cargarClientes() {
    try {
        const result = await apiCall('clientes.php');
        if (result.success) {
            clientes = result.data;
            
            const select = document.getElementById('filtro-cliente');
            select.innerHTML = '<option value="">Todos los clientes</option>';
            clientes.forEach(cliente => {
                select.innerHTML += `<option value="${cliente.id_cliente}">${cliente.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

/**
 * Cargar reporte con filtros
 */
async function cargarReporte() {
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

/**
 * Renderizar tabla de reporte
 */
function renderReporte(data) {
    const tbody = document.getElementById('tabla-body');
    const totalesRow = document.getElementById('tabla-totales');
    
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

/**
 * Limpiar filtros
 */
function limpiarFiltros() {
    document.getElementById('filtro-cliente').value = '';
    document.getElementById('filtro-fecha-desde').value = '';
    document.getElementById('filtro-fecha-hasta').value = '';
    cargarReporte();
}

/**
 * Exportar reporte a CSV
 */
function exportarCSV() {
    const clienteId = document.getElementById('filtro-cliente')?.value || '';
    const fechaDesde = document.getElementById('filtro-fecha-desde')?.value || '';
    const fechaHasta = document.getElementById('filtro-fecha-hasta')?.value || '';
    
    let url = `${API_BASE}/exportar.php?tipo=cotizaciones`;
    if (clienteId) url += `&cliente=${clienteId}`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    
    window.location.href = url;
}
