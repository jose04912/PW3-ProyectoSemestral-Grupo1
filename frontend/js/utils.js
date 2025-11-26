/**
 * =====================================================
 * FRONTEND - Utilidades JavaScript
 * TechFix Pro - Sistema de Cotizaciones
 * =====================================================
 */

// ========== CONFIGURACIÓN ==========
// La API se accede a través del proxy de Nginx en /api/
const API_BASE = '/api';
const TAX_RATE = 8;

// ========== UTILIDADES ==========

/**
 * Mostrar notificación toast
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
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

/**
 * Formatear moneda
 */
function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2);
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-PA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Validar email
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validar teléfono
 */
function isValidPhone(phone) {
    const re = /^[0-9\-\+\s]+$/;
    return re.test(phone);
}

/**
 * Llamada a la API del backend
 */
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

/**
 * Obtener clase de badge según estado
 */
function getEstadoBadge(estado) {
    const badges = {
        'pendiente': 'warning',
        'aprobada': 'success',
        'rechazada': 'danger',
        'completada': 'info'
    };
    return badges[estado] || 'info';
}

/**
 * Cerrar modal genérico
 */
function closeModal() {
    const modal = document.getElementById('modal-form');
    if (modal) modal.classList.remove('active');
}

/**
 * Abrir modal genérico
 */
function openModalGeneric() {
    const modal = document.getElementById('modal-form');
    if (modal) modal.classList.add('active');
}

// ========== EVENT LISTENERS GLOBALES ==========

// Cerrar modal con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});
