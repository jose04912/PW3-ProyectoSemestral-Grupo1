/**
 * =====================================================
 * TechFix Pro - Página de Inicio
 * =====================================================
 */

let servicios = [];
let clientes = [];
let cotizaciones = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});

/**
 * Cargar todos los datos
 */
async function cargarDatos() {
    try {
        // Cargar en paralelo
        const [resServicios, resClientes, resCotizaciones] = await Promise.all([
            apiCall('servicios.php'),
            apiCall('clientes.php'),
            apiCall('cotizaciones.php')
        ]);
        
        if (resServicios.success) servicios = resServicios.data;
        if (resClientes.success) clientes = resClientes.data;
        if (resCotizaciones.success) cotizaciones = resCotizaciones.data;
        
        renderServicios();
        actualizarEstadisticas();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error al cargar datos', 'error');
    }
}

/**
 * Renderizar grid de servicios
 */
function renderServicios() {
    const grid = document.getElementById('servicios-grid');
    if (!grid) return;
    
    const icons = [
        'fa-desktop', 'fa-hdd', 'fa-shield-virus', 'fa-headset', 
        'fa-microchip', 'fa-database', 'fa-network-wired', 'fa-cloud-upload-alt'
    ];
    
    if (servicios.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-tools"></i>
                <h3>No hay servicios disponibles</h3>
                <p>Agrega servicios desde el panel de administración</p>
            </div>
        `;
        return;
    }
    
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

/**
 * Actualizar estadísticas
 */
function actualizarEstadisticas() {
    // Total cotizaciones
    const statCot = document.getElementById('stat-cotizaciones');
    if (statCot) statCot.textContent = cotizaciones.length;
    
    // Total clientes
    const statCli = document.getElementById('stat-clientes');
    if (statCli) statCli.textContent = clientes.length;
    
    // Total facturado
    const statFact = document.getElementById('stat-facturado');
    if (statFact) {
        const total = cotizaciones.reduce((sum, cot) => sum + parseFloat(cot.total || 0), 0);
        statFact.textContent = `$${formatCurrency(total)}`;
    }
    
    // Total servicios
    const statServ = document.getElementById('stat-servicios');
    if (statServ) statServ.textContent = servicios.length;
}
