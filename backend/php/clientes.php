<?php
/**
 * =====================================================
 * BACKEND API - Clientes
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
                $cliente = $db->fetchOne(
                    "SELECT * FROM clientes WHERE id_cliente = ? AND activo = 1",
                    [$id]
                );
                if ($cliente) {
                    jsonResponse(true, 'Cliente encontrado', $cliente);
                } else {
                    jsonResponse(false, 'Cliente no encontrado');
                }
            } else {
                $clientes = $db->fetchAll(
                    "SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre ASC"
                );
                jsonResponse(true, 'Lista de clientes', $clientes);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validaciones
            if (empty($data['nombre'])) {
                jsonResponse(false, 'El nombre es obligatorio');
            }
            if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                jsonResponse(false, 'Email inválido o vacío');
            }
            if (empty($data['telefono']) || !preg_match('/^[0-9\-\+\s]+$/', $data['telefono'])) {
                jsonResponse(false, 'Teléfono inválido');
            }
            
            // Verificar email único
            $existe = $db->fetchOne(
                "SELECT id_cliente FROM clientes WHERE email = ? AND activo = 1",
                [$data['email']]
            );
            if ($existe) {
                jsonResponse(false, 'Ya existe un cliente con este email');
            }
            
            $db->query(
                "INSERT INTO clientes (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)",
                [
                    sanitize($data['nombre']),
                    sanitize($data['email']),
                    sanitize($data['telefono']),
                    sanitize($data['direccion'] ?? '')
                ]
            );
            
            $newId = $db->lastInsertId();
            $cliente = $db->fetchOne("SELECT * FROM clientes WHERE id_cliente = ?", [$newId]);
            jsonResponse(true, 'Cliente creado exitosamente', $cliente);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['id_cliente'])) {
                jsonResponse(false, 'ID de cliente requerido');
            }
            if (empty($data['nombre'])) {
                jsonResponse(false, 'El nombre es obligatorio');
            }
            if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                jsonResponse(false, 'Email inválido');
            }
            if (empty($data['telefono']) || !preg_match('/^[0-9\-\+\s]+$/', $data['telefono'])) {
                jsonResponse(false, 'Teléfono inválido');
            }
            
            // Verificar email único excluyendo el actual
            $existe = $db->fetchOne(
                "SELECT id_cliente FROM clientes WHERE email = ? AND id_cliente != ? AND activo = 1",
                [$data['email'], $data['id_cliente']]
            );
            if ($existe) {
                jsonResponse(false, 'Ya existe otro cliente con este email');
            }
            
            $db->query(
                "UPDATE clientes SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id_cliente = ?",
                [
                    sanitize($data['nombre']),
                    sanitize($data['email']),
                    sanitize($data['telefono']),
                    sanitize($data['direccion'] ?? ''),
                    intval($data['id_cliente'])
                ]
            );
            
            $cliente = $db->fetchOne("SELECT * FROM clientes WHERE id_cliente = ?", [$data['id_cliente']]);
            jsonResponse(true, 'Cliente actualizado', $cliente);
            break;
            
        case 'DELETE':
            $id = intval($_GET['id'] ?? 0);
            
            if ($id <= 0) {
                jsonResponse(false, 'ID inválido');
            }
            
            // Verificar cotizaciones
            $cotizaciones = $db->fetchOne(
                "SELECT COUNT(*) as total FROM cotizaciones WHERE id_cliente = ?",
                [$id]
            );
            if ($cotizaciones['total'] > 0) {
                jsonResponse(false, 'No se puede eliminar: tiene cotizaciones asociadas');
            }
            
            $db->query("UPDATE clientes SET activo = 0 WHERE id_cliente = ?", [$id]);
            jsonResponse(true, 'Cliente eliminado');
            break;
            
        default:
            jsonResponse(false, 'Método no permitido');
    }
} catch (Exception $e) {
    jsonResponse(false, 'Error: ' . $e->getMessage());
}
?>
