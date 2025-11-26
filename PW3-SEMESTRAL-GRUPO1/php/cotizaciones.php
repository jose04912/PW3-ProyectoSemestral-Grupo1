<?php
/**
 * =====================================================
 * API de Cotizaciones
 * Sistema de Cotizaciones - Freelance Tech Support
 * =====================================================
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'getOne' && isset($_GET['id'])) {
                // Obtener una cotización específica con sus items
                $id = intval($_GET['id']);
                $cotizacion = $db->fetchOne(
                    "SELECT c.*, cl.nombre as nombre_cliente, cl.email, cl.telefono 
                     FROM cotizaciones c 
                     INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente 
                     WHERE c.id_cotizacion = ?",
                    [$id]
                );
                
                if ($cotizacion) {
                    // Obtener items
                    $items = $db->fetchAll(
                        "SELECT ci.*, s.nombre as nombre_servicio 
                         FROM cotizacion_items ci 
                         INNER JOIN servicios s ON ci.id_servicio = s.id_servicio 
                         WHERE ci.id_cotizacion = ?",
                        [$id]
                    );
                    $cotizacion['items'] = $items;
                    jsonResponse(true, 'Cotización encontrada', $cotizacion);
                } else {
                    jsonResponse(false, 'Cotización no encontrada');
                }
                
            } elseif ($action === 'reporte') {
                // Reporte de cotizaciones con filtros
                $sql = "SELECT c.id_cotizacion, c.numero_cotizacion, c.fecha_cotizacion,
                               cl.id_cliente, cl.nombre as nombre_cliente,
                               c.subtotal, c.impuesto, c.total, c.estado
                        FROM cotizaciones c
                        INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente
                        WHERE 1=1";
                $params = [];
                
                // Filtro por cliente
                if (!empty($_GET['cliente'])) {
                    $sql .= " AND c.id_cliente = ?";
                    $params[] = intval($_GET['cliente']);
                }
                
                // Filtro por fecha desde
                if (!empty($_GET['fecha_desde'])) {
                    $sql .= " AND c.fecha_cotizacion >= ?";
                    $params[] = $_GET['fecha_desde'];
                }
                
                // Filtro por fecha hasta
                if (!empty($_GET['fecha_hasta'])) {
                    $sql .= " AND c.fecha_cotizacion <= ?";
                    $params[] = $_GET['fecha_hasta'];
                }
                
                $sql .= " ORDER BY c.fecha_cotizacion DESC, c.id_cotizacion DESC";
                
                $cotizaciones = $db->fetchAll($sql, $params);
                
                // Calcular totales
                $totales = [
                    'subtotal' => 0,
                    'impuesto' => 0,
                    'total' => 0
                ];
                foreach ($cotizaciones as $cot) {
                    $totales['subtotal'] += floatval($cot['subtotal']);
                    $totales['impuesto'] += floatval($cot['impuesto']);
                    $totales['total'] += floatval($cot['total']);
                }
                
                jsonResponse(true, 'Reporte de cotizaciones', [
                    'cotizaciones' => $cotizaciones,
                    'totales' => $totales
                ]);
                
            } elseif ($action === 'nuevo_numero') {
                // Generar nuevo número de cotización
                $numero = generarNumeroCotizacion();
                jsonResponse(true, 'Número generado', ['numero' => $numero]);
                
            } else {
                // Listar todas las cotizaciones
                $cotizaciones = $db->fetchAll(
                    "SELECT c.*, cl.nombre as nombre_cliente 
                     FROM cotizaciones c 
                     INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente 
                     ORDER BY c.fecha_cotizacion DESC, c.id_cotizacion DESC"
                );
                jsonResponse(true, 'Lista de cotizaciones', $cotizaciones);
            }
            break;
            
        case 'POST':
            // Crear nueva cotización
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validaciones
            if (empty($data['id_cliente'])) {
                jsonResponse(false, 'Debe seleccionar un cliente');
            }
            if (empty($data['fecha_cotizacion'])) {
                jsonResponse(false, 'La fecha es obligatoria');
            }
            if (empty($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
                jsonResponse(false, 'Debe agregar al menos un servicio a la cotización');
            }
            
            // Verificar que el cliente existe
            $cliente = $db->fetchOne(
                "SELECT id_cliente FROM clientes WHERE id_cliente = ? AND activo = 1",
                [$data['id_cliente']]
            );
            if (!$cliente) {
                jsonResponse(false, 'El cliente seleccionado no existe o está inactivo');
            }
            
            // Validar items
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                if (empty($item['id_servicio'])) {
                    jsonResponse(false, 'Servicio inválido en uno de los items');
                }
                if (!isset($item['cantidad']) || intval($item['cantidad']) < 1) {
                    jsonResponse(false, 'La cantidad debe ser al menos 1');
                }
                if (!isset($item['precio_unitario']) || floatval($item['precio_unitario']) < 0) {
                    jsonResponse(false, 'El precio unitario debe ser mayor o igual a 0');
                }
                
                // Verificar servicio existe
                $servicio = $db->fetchOne(
                    "SELECT id_servicio FROM servicios WHERE id_servicio = ? AND activo = 1",
                    [$item['id_servicio']]
                );
                if (!$servicio) {
                    jsonResponse(false, 'Uno de los servicios no existe o está inactivo');
                }
                
                $subtotal += intval($item['cantidad']) * floatval($item['precio_unitario']);
            }
            
            // Calcular impuesto y total
            $porcentajeImpuesto = floatval($data['porcentaje_impuesto'] ?? TAX_PERCENTAGE);
            $impuesto = $subtotal * ($porcentajeImpuesto / 100);
            $total = $subtotal + $impuesto;
            
            // Generar número de cotización
            $numeroCotizacion = generarNumeroCotizacion();
            
            // Iniciar transacción
            $db->beginTransaction();
            
            try {
                // Insertar cotización
                $db->query(
                    "INSERT INTO cotizaciones (numero_cotizacion, id_cliente, fecha_cotizacion, 
                     subtotal, porcentaje_impuesto, impuesto, total, estado, notas) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        $numeroCotizacion,
                        intval($data['id_cliente']),
                        $data['fecha_cotizacion'],
                        $subtotal,
                        $porcentajeImpuesto,
                        $impuesto,
                        $total,
                        $data['estado'] ?? 'pendiente',
                        sanitize($data['notas'] ?? '')
                    ]
                );
                
                $idCotizacion = $db->lastInsertId();
                
                // Insertar items
                foreach ($data['items'] as $item) {
                    $cantidad = intval($item['cantidad']);
                    $precioUnitario = floatval($item['precio_unitario']);
                    $subtotalItem = $cantidad * $precioUnitario;
                    
                    $db->query(
                        "INSERT INTO cotizacion_items (id_cotizacion, id_servicio, cantidad, 
                         precio_unitario, subtotal_item) VALUES (?, ?, ?, ?, ?)",
                        [
                            $idCotizacion,
                            intval($item['id_servicio']),
                            $cantidad,
                            $precioUnitario,
                            $subtotalItem
                        ]
                    );
                }
                
                $db->commit();
                
                // Obtener cotización completa
                $cotizacion = $db->fetchOne(
                    "SELECT c.*, cl.nombre as nombre_cliente 
                     FROM cotizaciones c 
                     INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente 
                     WHERE c.id_cotizacion = ?",
                    [$idCotizacion]
                );
                
                jsonResponse(true, 'Cotización creada exitosamente', $cotizacion);
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;
            
        case 'PUT':
            // Actualizar cotización
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['id_cotizacion'])) {
                jsonResponse(false, 'ID de cotización es requerido');
            }
            
            // Validaciones
            if (empty($data['id_cliente'])) {
                jsonResponse(false, 'Debe seleccionar un cliente');
            }
            if (empty($data['fecha_cotizacion'])) {
                jsonResponse(false, 'La fecha es obligatoria');
            }
            if (empty($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
                jsonResponse(false, 'Debe agregar al menos un servicio a la cotización');
            }
            
            // Calcular subtotal
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                if (!isset($item['cantidad']) || intval($item['cantidad']) < 1) {
                    jsonResponse(false, 'La cantidad debe ser al menos 1');
                }
                if (!isset($item['precio_unitario']) || floatval($item['precio_unitario']) < 0) {
                    jsonResponse(false, 'El precio unitario debe ser mayor o igual a 0');
                }
                $subtotal += intval($item['cantidad']) * floatval($item['precio_unitario']);
            }
            
            $porcentajeImpuesto = floatval($data['porcentaje_impuesto'] ?? TAX_PERCENTAGE);
            $impuesto = $subtotal * ($porcentajeImpuesto / 100);
            $total = $subtotal + $impuesto;
            
            $db->beginTransaction();
            
            try {
                // Actualizar cotización
                $db->query(
                    "UPDATE cotizaciones SET id_cliente = ?, fecha_cotizacion = ?, 
                     subtotal = ?, porcentaje_impuesto = ?, impuesto = ?, total = ?, 
                     estado = ?, notas = ? WHERE id_cotizacion = ?",
                    [
                        intval($data['id_cliente']),
                        $data['fecha_cotizacion'],
                        $subtotal,
                        $porcentajeImpuesto,
                        $impuesto,
                        $total,
                        $data['estado'] ?? 'pendiente',
                        sanitize($data['notas'] ?? ''),
                        intval($data['id_cotizacion'])
                    ]
                );
                
                // Eliminar items anteriores
                $db->query(
                    "DELETE FROM cotizacion_items WHERE id_cotizacion = ?",
                    [$data['id_cotizacion']]
                );
                
                // Insertar nuevos items
                foreach ($data['items'] as $item) {
                    $cantidad = intval($item['cantidad']);
                    $precioUnitario = floatval($item['precio_unitario']);
                    $subtotalItem = $cantidad * $precioUnitario;
                    
                    $db->query(
                        "INSERT INTO cotizacion_items (id_cotizacion, id_servicio, cantidad, 
                         precio_unitario, subtotal_item) VALUES (?, ?, ?, ?, ?)",
                        [
                            intval($data['id_cotizacion']),
                            intval($item['id_servicio']),
                            $cantidad,
                            $precioUnitario,
                            $subtotalItem
                        ]
                    );
                }
                
                $db->commit();
                
                $cotizacion = $db->fetchOne(
                    "SELECT c.*, cl.nombre as nombre_cliente 
                     FROM cotizaciones c 
                     INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente 
                     WHERE c.id_cotizacion = ?",
                    [$data['id_cotizacion']]
                );
                
                jsonResponse(true, 'Cotización actualizada exitosamente', $cotizacion);
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;
            
        case 'DELETE':
            // Eliminar cotización
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            
            if ($id <= 0) {
                jsonResponse(false, 'ID de cotización inválido');
            }
            
            $db->beginTransaction();
            
            try {
                // Eliminar items primero (aunque hay CASCADE, mejor ser explícito)
                $db->query("DELETE FROM cotizacion_items WHERE id_cotizacion = ?", [$id]);
                
                // Eliminar cotización
                $db->query("DELETE FROM cotizaciones WHERE id_cotizacion = ?", [$id]);
                
                $db->commit();
                jsonResponse(true, 'Cotización eliminada exitosamente');
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;
            
        default:
            jsonResponse(false, 'Método no permitido');
    }
} catch (Exception $e) {
    jsonResponse(false, 'Error: ' . $e->getMessage());
}
?>
