<?php
/**
 * =====================================================
 * BACKEND API - Cotizaciones
 * =====================================================
 */

require_once 'config.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'getOne' && isset($_GET['id'])) {
                // Obtener cotización con items
                $id = intval($_GET['id']);
                $cotizacion = $db->fetchOne(
                    "SELECT c.*, cl.nombre as nombre_cliente, cl.email, cl.telefono 
                     FROM cotizaciones c 
                     INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente 
                     WHERE c.id_cotizacion = ?",
                    [$id]
                );
                
                if ($cotizacion) {
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
                // Reporte con filtros
                $sql = "SELECT c.id_cotizacion, c.numero_cotizacion, c.fecha_cotizacion,
                               cl.id_cliente, cl.nombre as nombre_cliente,
                               c.subtotal, c.impuesto, c.total, c.estado
                        FROM cotizaciones c
                        INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente
                        WHERE 1=1";
                $params = [];
                
                if (!empty($_GET['cliente'])) {
                    $sql .= " AND c.id_cliente = ?";
                    $params[] = intval($_GET['cliente']);
                }
                if (!empty($_GET['fecha_desde'])) {
                    $sql .= " AND c.fecha_cotizacion >= ?";
                    $params[] = $_GET['fecha_desde'];
                }
                if (!empty($_GET['fecha_hasta'])) {
                    $sql .= " AND c.fecha_cotizacion <= ?";
                    $params[] = $_GET['fecha_hasta'];
                }
                
                $sql .= " ORDER BY c.fecha_cotizacion DESC, c.id_cotizacion DESC";
                $cotizaciones = $db->fetchAll($sql, $params);
                
                $totales = ['subtotal' => 0, 'impuesto' => 0, 'total' => 0];
                foreach ($cotizaciones as $cot) {
                    $totales['subtotal'] += floatval($cot['subtotal']);
                    $totales['impuesto'] += floatval($cot['impuesto']);
                    $totales['total'] += floatval($cot['total']);
                }
                
                jsonResponse(true, 'Reporte', ['cotizaciones' => $cotizaciones, 'totales' => $totales]);
                
            } else {
                // Listar todas
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
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validaciones
            if (empty($data['id_cliente'])) {
                jsonResponse(false, 'Seleccione un cliente');
            }
            if (empty($data['fecha_cotizacion'])) {
                jsonResponse(false, 'Fecha obligatoria');
            }
            if (empty($data['items']) || count($data['items']) === 0) {
                jsonResponse(false, 'Agregue al menos un servicio');
            }
            
            // Verificar cliente
            $cliente = $db->fetchOne(
                "SELECT id_cliente FROM clientes WHERE id_cliente = ? AND activo = 1",
                [$data['id_cliente']]
            );
            if (!$cliente) {
                jsonResponse(false, 'Cliente no existe');
            }
            
            // Calcular totales
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                if (empty($item['id_servicio']) || $item['cantidad'] < 1 || $item['precio_unitario'] < 0) {
                    jsonResponse(false, 'Item inválido');
                }
                $subtotal += intval($item['cantidad']) * floatval($item['precio_unitario']);
            }
            
            $porcentaje = floatval($data['porcentaje_impuesto'] ?? TAX_PERCENTAGE);
            $impuesto = $subtotal * ($porcentaje / 100);
            $total = $subtotal + $impuesto;
            $numero = generarNumeroCotizacion();
            
            $db->beginTransaction();
            
            try {
                $db->query(
                    "INSERT INTO cotizaciones (numero_cotizacion, id_cliente, fecha_cotizacion, 
                     subtotal, porcentaje_impuesto, impuesto, total, estado, notas) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        $numero,
                        intval($data['id_cliente']),
                        $data['fecha_cotizacion'],
                        $subtotal,
                        $porcentaje,
                        $impuesto,
                        $total,
                        $data['estado'] ?? 'pendiente',
                        sanitize($data['notas'] ?? '')
                    ]
                );
                
                $idCotizacion = $db->lastInsertId();
                
                foreach ($data['items'] as $item) {
                    $cant = intval($item['cantidad']);
                    $precio = floatval($item['precio_unitario']);
                    $db->query(
                        "INSERT INTO cotizacion_items (id_cotizacion, id_servicio, cantidad, 
                         precio_unitario, subtotal_item) VALUES (?, ?, ?, ?, ?)",
                        [$idCotizacion, intval($item['id_servicio']), $cant, $precio, $cant * $precio]
                    );
                }
                
                $db->commit();
                
                $cotizacion = $db->fetchOne(
                    "SELECT c.*, cl.nombre as nombre_cliente 
                     FROM cotizaciones c 
                     INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente 
                     WHERE c.id_cotizacion = ?",
                    [$idCotizacion]
                );
                
                jsonResponse(true, 'Cotización creada', $cotizacion);
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['id_cotizacion'])) {
                jsonResponse(false, 'ID requerido');
            }
            if (empty($data['id_cliente'])) {
                jsonResponse(false, 'Seleccione un cliente');
            }
            if (empty($data['items']) || count($data['items']) === 0) {
                jsonResponse(false, 'Agregue al menos un servicio');
            }
            
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += intval($item['cantidad']) * floatval($item['precio_unitario']);
            }
            
            $porcentaje = floatval($data['porcentaje_impuesto'] ?? TAX_PERCENTAGE);
            $impuesto = $subtotal * ($porcentaje / 100);
            $total = $subtotal + $impuesto;
            
            $db->beginTransaction();
            
            try {
                $db->query(
                    "UPDATE cotizaciones SET id_cliente = ?, fecha_cotizacion = ?, 
                     subtotal = ?, porcentaje_impuesto = ?, impuesto = ?, total = ?, 
                     estado = ?, notas = ? WHERE id_cotizacion = ?",
                    [
                        intval($data['id_cliente']),
                        $data['fecha_cotizacion'],
                        $subtotal,
                        $porcentaje,
                        $impuesto,
                        $total,
                        $data['estado'] ?? 'pendiente',
                        sanitize($data['notas'] ?? ''),
                        intval($data['id_cotizacion'])
                    ]
                );
                
                $db->query("DELETE FROM cotizacion_items WHERE id_cotizacion = ?", [$data['id_cotizacion']]);
                
                foreach ($data['items'] as $item) {
                    $cant = intval($item['cantidad']);
                    $precio = floatval($item['precio_unitario']);
                    $db->query(
                        "INSERT INTO cotizacion_items (id_cotizacion, id_servicio, cantidad, 
                         precio_unitario, subtotal_item) VALUES (?, ?, ?, ?, ?)",
                        [intval($data['id_cotizacion']), intval($item['id_servicio']), $cant, $precio, $cant * $precio]
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
                
                jsonResponse(true, 'Cotización actualizada', $cotizacion);
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;
            
        case 'DELETE':
            $id = intval($_GET['id'] ?? 0);
            
            if ($id <= 0) {
                jsonResponse(false, 'ID inválido');
            }
            
            $db->beginTransaction();
            try {
                $db->query("DELETE FROM cotizacion_items WHERE id_cotizacion = ?", [$id]);
                $db->query("DELETE FROM cotizaciones WHERE id_cotizacion = ?", [$id]);
                $db->commit();
                jsonResponse(true, 'Cotización eliminada');
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
