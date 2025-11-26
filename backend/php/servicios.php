<?php
/**
 * =====================================================
 * BACKEND API - Servicios
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
                $id = intval($_GET['id']);
                $servicio = $db->fetchOne(
                    "SELECT * FROM servicios WHERE id_servicio = ? AND activo = 1",
                    [$id]
                );
                if ($servicio) {
                    jsonResponse(true, 'Servicio encontrado', $servicio);
                } else {
                    jsonResponse(false, 'Servicio no encontrado');
                }
            } else {
                $servicios = $db->fetchAll(
                    "SELECT * FROM servicios WHERE activo = 1 ORDER BY nombre ASC"
                );
                jsonResponse(true, 'Lista de servicios', $servicios);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['nombre'])) {
                jsonResponse(false, 'El nombre es obligatorio');
            }
            if (!isset($data['precio_base']) || floatval($data['precio_base']) < 0) {
                jsonResponse(false, 'El precio debe ser >= 0');
            }
            
            $db->query(
                "INSERT INTO servicios (nombre, descripcion, precio_base) VALUES (?, ?, ?)",
                [
                    sanitize($data['nombre']),
                    sanitize($data['descripcion'] ?? ''),
                    floatval($data['precio_base'])
                ]
            );
            
            $newId = $db->lastInsertId();
            $servicio = $db->fetchOne("SELECT * FROM servicios WHERE id_servicio = ?", [$newId]);
            jsonResponse(true, 'Servicio creado', $servicio);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['id_servicio'])) {
                jsonResponse(false, 'ID requerido');
            }
            if (empty($data['nombre'])) {
                jsonResponse(false, 'El nombre es obligatorio');
            }
            if (!isset($data['precio_base']) || floatval($data['precio_base']) < 0) {
                jsonResponse(false, 'El precio debe ser >= 0');
            }
            
            $db->query(
                "UPDATE servicios SET nombre = ?, descripcion = ?, precio_base = ? WHERE id_servicio = ?",
                [
                    sanitize($data['nombre']),
                    sanitize($data['descripcion'] ?? ''),
                    floatval($data['precio_base']),
                    intval($data['id_servicio'])
                ]
            );
            
            $servicio = $db->fetchOne("SELECT * FROM servicios WHERE id_servicio = ?", [$data['id_servicio']]);
            jsonResponse(true, 'Servicio actualizado', $servicio);
            break;
            
        case 'DELETE':
            $id = intval($_GET['id'] ?? 0);
            
            if ($id <= 0) {
                jsonResponse(false, 'ID inválido');
            }
            
            $enUso = $db->fetchOne(
                "SELECT COUNT(*) as total FROM cotizacion_items WHERE id_servicio = ?",
                [$id]
            );
            if ($enUso['total'] > 0) {
                jsonResponse(false, 'No se puede eliminar: está en uso');
            }
            
            $db->query("UPDATE servicios SET activo = 0 WHERE id_servicio = ?", [$id]);
            jsonResponse(true, 'Servicio eliminado');
            break;
            
        default:
            jsonResponse(false, 'Método no permitido');
    }
} catch (Exception $e) {
    jsonResponse(false, 'Error: ' . $e->getMessage());
}
?>
