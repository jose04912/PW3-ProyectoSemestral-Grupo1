<?php
/**
 * =====================================================
 * API de Servicios
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
                // Obtener un servicio específico
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
                // Listar todos los servicios activos
                $servicios = $db->fetchAll(
                    "SELECT * FROM servicios WHERE activo = 1 ORDER BY nombre ASC"
                );
                jsonResponse(true, 'Lista de servicios', $servicios);
            }
            break;
            
        case 'POST':
            // Crear nuevo servicio
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validaciones
            if (empty($data['nombre'])) {
                jsonResponse(false, 'El nombre del servicio es obligatorio');
            }
            if (!isset($data['precio_base']) || floatval($data['precio_base']) < 0) {
                jsonResponse(false, 'El precio debe ser mayor o igual a 0');
            }
            
            // Insertar servicio
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
            
            jsonResponse(true, 'Servicio creado exitosamente', $servicio);
            break;
            
        case 'PUT':
            // Actualizar servicio
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['id_servicio'])) {
                jsonResponse(false, 'ID de servicio es requerido');
            }
            
            // Validaciones
            if (empty($data['nombre'])) {
                jsonResponse(false, 'El nombre del servicio es obligatorio');
            }
            if (!isset($data['precio_base']) || floatval($data['precio_base']) < 0) {
                jsonResponse(false, 'El precio debe ser mayor o igual a 0');
            }
            
            // Actualizar
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
            jsonResponse(true, 'Servicio actualizado exitosamente', $servicio);
            break;
            
        case 'DELETE':
            // Eliminar servicio (soft delete)
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            
            if ($id <= 0) {
                jsonResponse(false, 'ID de servicio inválido');
            }
            
            // Verificar si está en uso en cotizaciones
            $enUso = $db->fetchOne(
                "SELECT COUNT(*) as total FROM cotizacion_items WHERE id_servicio = ?",
                [$id]
            );
            
            if ($enUso['total'] > 0) {
                jsonResponse(false, 'No se puede eliminar: el servicio está en uso en cotizaciones');
            }
            
            $db->query("UPDATE servicios SET activo = 0 WHERE id_servicio = ?", [$id]);
            jsonResponse(true, 'Servicio eliminado exitosamente');
            break;
            
        default:
            jsonResponse(false, 'Método no permitido');
    }
} catch (Exception $e) {
    jsonResponse(false, 'Error: ' . $e->getMessage());
}
?>
