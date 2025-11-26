<?php
/**
 * =====================================================
 * API de Exportación CSV
 * Sistema de Cotizaciones - Freelance Tech Support
 * =====================================================
 */

require_once 'config.php';

$db = getDB();
$tipo = isset($_GET['tipo']) ? $_GET['tipo'] : 'cotizaciones';

try {
    switch ($tipo) {
        case 'cotizaciones':
            // Exportar cotizaciones
            $sql = "SELECT c.fecha_cotizacion as Fecha, 
                           c.numero_cotizacion as 'Nº Cotización',
                           cl.nombre as Cliente,
                           c.subtotal as Subtotal,
                           c.impuesto as Impuesto,
                           c.total as Total,
                           c.estado as Estado
                    FROM cotizaciones c
                    INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente
                    WHERE 1=1";
            $params = [];
            
            // Aplicar filtros
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
            // Exportar clientes
            $data = $db->fetchAll(
                "SELECT nombre as Nombre, email as Email, telefono as Teléfono, 
                        direccion as Dirección, fecha_registro as 'Fecha Registro'
                 FROM clientes WHERE activo = 1 ORDER BY nombre"
            );
            $filename = 'clientes_' . date('Y-m-d_His') . '.csv';
            break;
            
        case 'servicios':
            // Exportar servicios
            $data = $db->fetchAll(
                "SELECT nombre as Nombre, descripcion as Descripción, 
                        precio_base as 'Precio Base'
                 FROM servicios WHERE activo = 1 ORDER BY nombre"
            );
            $filename = 'servicios_' . date('Y-m-d_His') . '.csv';
            break;
            
        case 'detalle':
            // Exportar detalle de una cotización
            if (empty($_GET['id'])) {
                die('ID de cotización requerido');
            }
            
            $id = intval($_GET['id']);
            
            // Obtener info de la cotización
            $cotizacion = $db->fetchOne(
                "SELECT c.numero_cotizacion, c.fecha_cotizacion, cl.nombre as cliente
                 FROM cotizaciones c
                 INNER JOIN clientes cl ON c.id_cliente = cl.id_cliente
                 WHERE c.id_cotizacion = ?",
                [$id]
            );
            
            if (!$cotizacion) {
                die('Cotización no encontrada');
            }
            
            $data = $db->fetchAll(
                "SELECT s.nombre as Servicio, ci.cantidad as Cantidad,
                        ci.precio_unitario as 'Precio Unitario', 
                        ci.subtotal_item as Subtotal
                 FROM cotizacion_items ci
                 INNER JOIN servicios s ON ci.id_servicio = s.id_servicio
                 WHERE ci.id_cotizacion = ?",
                [$id]
            );
            
            $filename = 'cotizacion_' . $cotizacion['numero_cotizacion'] . '_detalle.csv';
            break;
            
        default:
            die('Tipo de exportación no válido');
    }
    
    // Generar CSV
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // BOM para Excel
    echo "\xEF\xBB\xBF";
    
    $output = fopen('php://output', 'w');
    
    if (count($data) > 0) {
        // Encabezados
        fputcsv($output, array_keys($data[0]), ';');
        
        // Datos
        foreach ($data as $row) {
            fputcsv($output, $row, ';');
        }
        
        // Si es cotizaciones, agregar totales
        if ($tipo === 'cotizaciones') {
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
