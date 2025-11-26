<?php
/**
 * =====================================================
 * BACKEND API - Exportación CSV
 * =====================================================
 */

require_once 'config.php';

$db = getDB();
$tipo = $_GET['tipo'] ?? 'cotizaciones';

try {
    switch ($tipo) {
        case 'cotizaciones':
            $sql = "SELECT c.fecha_cotizacion as Fecha, 
                           c.numero_cotizacion as 'No_Cotizacion',
                           cl.nombre as Cliente,
                           c.subtotal as Subtotal,
                           c.impuesto as Impuesto,
                           c.total as Total,
                           c.estado as Estado
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
            
            $sql .= " ORDER BY c.fecha_cotizacion DESC";
            $data = $db->fetchAll($sql, $params);
            $filename = 'cotizaciones_' . date('Y-m-d_His') . '.csv';
            break;
            
        case 'clientes':
            $data = $db->fetchAll(
                "SELECT nombre as Nombre, email as Email, telefono as Telefono, 
                        direccion as Direccion, fecha_registro as 'Fecha_Registro'
                 FROM clientes WHERE activo = 1 ORDER BY nombre"
            );
            $filename = 'clientes_' . date('Y-m-d_His') . '.csv';
            break;
            
        case 'servicios':
            $data = $db->fetchAll(
                "SELECT nombre as Nombre, descripcion as Descripcion, 
                        precio_base as 'Precio_Base'
                 FROM servicios WHERE activo = 1 ORDER BY nombre"
            );
            $filename = 'servicios_' . date('Y-m-d_His') . '.csv';
            break;
            
        case 'detalle':
            if (empty($_GET['id'])) {
                die('ID requerido');
            }
            $id = intval($_GET['id']);
            
            $cotizacion = $db->fetchOne(
                "SELECT numero_cotizacion FROM cotizaciones WHERE id_cotizacion = ?",
                [$id]
            );
            if (!$cotizacion) {
                die('Cotización no encontrada');
            }
            
            $data = $db->fetchAll(
                "SELECT s.nombre as Servicio, ci.cantidad as Cantidad,
                        ci.precio_unitario as 'Precio_Unitario', 
                        ci.subtotal_item as Subtotal
                 FROM cotizacion_items ci
                 INNER JOIN servicios s ON ci.id_servicio = s.id_servicio
                 WHERE ci.id_cotizacion = ?",
                [$id]
            );
            $filename = 'cotizacion_' . $cotizacion['numero_cotizacion'] . '_detalle.csv';
            break;
            
        default:
            die('Tipo no válido');
    }
    
    // Headers para descarga
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Access-Control-Allow-Origin: *');
    
    // BOM UTF-8 para Excel
    echo "\xEF\xBB\xBF";
    
    $output = fopen('php://output', 'w');
    
    if (count($data) > 0) {
        // Encabezados
        fputcsv($output, array_keys($data[0]), ';');
        
        // Datos
        foreach ($data as $row) {
            fputcsv($output, $row, ';');
        }
        
        // Totales para cotizaciones
        if ($tipo === 'cotizaciones' && count($data) > 0) {
            $totales = ['', '', 'TOTALES:', 0, 0, 0, ''];
            foreach ($data as $row) {
                $totales[3] += floatval($row['Subtotal']);
                $totales[4] += floatval($row['Impuesto']);
                $totales[5] += floatval($row['Total']);
            }
            $totales[3] = number_format($totales[3], 2);
            $totales[4] = number_format($totales[4], 2);
            $totales[5] = number_format($totales[5], 2);
            fputcsv($output, $totales, ';');
        }
    } else {
        fputcsv($output, ['No hay datos para exportar'], ';');
    }
    
    fclose($output);
    
} catch (Exception $e) {
    die('Error: ' . $e->getMessage());
}
?>
