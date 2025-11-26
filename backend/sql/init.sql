-- =====================================================
-- Base de Datos: Sistema de Cotizaciones - Freelance
-- Soporte Técnico de Computadoras
-- =====================================================

-- Usar la base de datos
USE freelance_db;

-- =====================================================
-- TABLA: clientes
-- Almacena información de los clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    direccion VARCHAR(255),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    INDEX idx_nombre (nombre),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: servicios
-- Catálogo de servicios ofrecidos
-- =====================================================
CREATE TABLE IF NOT EXISTS servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nombre_servicio (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cotizaciones
-- Encabezado de las cotizaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
    id_cotizacion INT AUTO_INCREMENT PRIMARY KEY,
    numero_cotizacion VARCHAR(20) NOT NULL UNIQUE,
    id_cliente INT NOT NULL,
    fecha_cotizacion DATE NOT NULL,
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    porcentaje_impuesto DECIMAL(5,2) DEFAULT 8.00,
    impuesto DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    estado ENUM('pendiente', 'aprobada', 'rechazada', 'completada') DEFAULT 'pendiente',
    notas TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE RESTRICT,
    INDEX idx_numero (numero_cotizacion),
    INDEX idx_fecha (fecha_cotizacion),
    INDEX idx_cliente (id_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cotizacion_items
-- Detalle/ítems de cada cotización
-- =====================================================
CREATE TABLE IF NOT EXISTS cotizacion_items (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_cotizacion INT NOT NULL,
    id_servicio INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal_item DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id_cotizacion) ON DELETE CASCADE,
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON DELETE RESTRICT,
    INDEX idx_cotizacion (id_cotizacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS DE PRUEBA (Demo Data)
-- =====================================================

-- Insertar servicios demo
INSERT INTO servicios (nombre, descripcion, precio_base) VALUES
('Mantenimiento Preventivo PC', 'Limpieza física, actualización de software, optimización del sistema operativo y revisión de componentes.', 35.00),
('Formateo e Instalación SO', 'Formateo completo del disco, instalación del sistema operativo, drivers y programas básicos.', 50.00),
('Remoción de Malware', 'Análisis completo del sistema, eliminación de virus, malware, spyware y optimización de seguridad.', 45.00),
('Soporte Remoto (por hora)', 'Asistencia técnica remota para resolver problemas de software, configuración y consultas.', 20.00),
('Instalación de Hardware', 'Instalación y configuración de componentes como RAM, disco duro, tarjeta gráfica, etc.', 25.00),
('Recuperación de Datos', 'Recuperación de archivos de discos dañados o formateados accidentalmente.', 75.00),
('Configuración de Red', 'Configuración de router, red WiFi, compartir archivos e impresoras en red.', 40.00),
('Backup y Respaldo', 'Configuración de sistema de respaldo automático en la nube o disco externo.', 30.00);

-- Insertar clientes demo
INSERT INTO clientes (nombre, email, telefono, direccion) VALUES
('ACME, S.A.', 'acme@ejemplo.com', '6000-0000', 'Ciudad de Panamá, Calle 50'),
('Juan Pérez', 'jperez@correo.com', '6123-4567', 'San Miguelito, Panamá'),
('María González', 'mgonzalez@email.com', '6234-5678', 'Colón, Calle Principal'),
('Tech Solutions Inc.', 'info@techsolutions.com', '6345-6789', 'Panamá Pacífico, Edificio A');

-- Insertar cotización demo 1
INSERT INTO cotizaciones (numero_cotizacion, id_cliente, fecha_cotizacion, subtotal, impuesto, total, estado, notas) VALUES
('COT-1001', 1, '2025-11-15', 130.00, 10.40, 140.40, 'pendiente', 'Cotización para mantenimiento mensual de equipos de oficina.');

-- Insertar items de cotización demo 1
INSERT INTO cotizacion_items (id_cotizacion, id_servicio, cantidad, precio_unitario, subtotal_item) VALUES
(1, 1, 2, 35.00, 70.00),  -- 2 x Mantenimiento Preventivo
(1, 4, 3, 20.00, 60.00);  -- 3 x Soporte Remoto

-- Insertar cotización demo 2
INSERT INTO cotizaciones (numero_cotizacion, id_cliente, fecha_cotizacion, subtotal, impuesto, total, estado, notas) VALUES
('COT-1002', 2, '2025-11-15', 80.00, 6.40, 86.40, 'aprobada', 'Formateo de laptop personal.');

-- Insertar items de cotización demo 2
INSERT INTO cotizacion_items (id_cotizacion, id_servicio, cantidad, precio_unitario, subtotal_item) VALUES
(2, 2, 1, 50.00, 50.00),  -- 1 x Formateo
(2, 8, 1, 30.00, 30.00);  -- 1 x Backup

-- Insertar cotización demo 3
INSERT INTO cotizaciones (numero_cotizacion, id_cliente, fecha_cotizacion, subtotal, impuesto, total, estado, notas) VALUES
('COT-1003', 3, '2025-11-18', 120.00, 9.60, 129.60, 'pendiente', 'Remoción de virus y configuración de red.');

-- Insertar items de cotización demo 3
INSERT INTO cotizacion_items (id_cotizacion, id_servicio, cantidad, precio_unitario, subtotal_item) VALUES
(3, 3, 1, 45.00, 45.00),  -- 1 x Remoción Malware
(3, 6, 1, 75.00, 75.00);  -- 1 x Recuperación de Datos

-- =====================================================
-- VISTA: Reporte de Cotizaciones
-- =====================================================
CREATE OR REPLACE VIEW vista_cotizaciones AS
SELECT 
    c.id_cotizacion,
    c.numero_cotizacion,
    c.fecha_cotizacion,
    cl.id_cliente,
    cl.nombre AS nombre_cliente,
    cl.email AS email_cliente,
    c.subtotal,
    c.porcentaje_impuesto,
    c.impuesto,
    c.total,
    c.estado,
    c.notas
FROM cotizaciones c
INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente
ORDER BY c.fecha_cotizacion DESC, c.id_cotizacion DESC;

-- =====================================================
-- VISTA: Detalle de Cotizaciones con Items
-- =====================================================
CREATE OR REPLACE VIEW vista_cotizacion_detalle AS
SELECT 
    ci.id_item,
    ci.id_cotizacion,
    c.numero_cotizacion,
    s.id_servicio,
    s.nombre AS nombre_servicio,
    ci.cantidad,
    ci.precio_unitario,
    ci.subtotal_item
FROM cotizacion_items ci
INNER JOIN cotizaciones c ON ci.id_cotizacion = c.id_cotizacion
INNER JOIN servicios s ON ci.id_servicio = s.id_servicio;

-- =====================================================
-- PROCEDIMIENTO: Generar número de cotización
-- =====================================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generar_numero_cotizacion(OUT nuevo_numero VARCHAR(20))
BEGIN
    DECLARE ultimo_id INT;
    SELECT COALESCE(MAX(id_cotizacion), 0) + 1 INTO ultimo_id FROM cotizaciones;
    SET nuevo_numero = CONCAT('COT-', LPAD(ultimo_id + 1000, 4, '0'));
END //
DELIMITER ;

-- =====================================================
-- PROCEDIMIENTO: Actualizar totales de cotización
-- =====================================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS actualizar_totales_cotizacion(IN p_id_cotizacion INT)
BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_porcentaje DECIMAL(5,2);
    DECLARE v_impuesto DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    
    -- Calcular subtotal de items
    SELECT COALESCE(SUM(subtotal_item), 0) INTO v_subtotal 
    FROM cotizacion_items 
    WHERE id_cotizacion = p_id_cotizacion;
    
    -- Obtener porcentaje de impuesto
    SELECT porcentaje_impuesto INTO v_porcentaje 
    FROM cotizaciones 
    WHERE id_cotizacion = p_id_cotizacion;
    
    -- Calcular impuesto y total
    SET v_impuesto = v_subtotal * (v_porcentaje / 100);
    SET v_total = v_subtotal + v_impuesto;
    
    -- Actualizar cotización
    UPDATE cotizaciones 
    SET subtotal = v_subtotal, 
        impuesto = v_impuesto, 
        total = v_total 
    WHERE id_cotizacion = p_id_cotizacion;
END //
DELIMITER ;
