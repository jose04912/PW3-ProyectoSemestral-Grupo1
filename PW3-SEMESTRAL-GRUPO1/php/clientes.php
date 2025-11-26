<?php
/**
 * =====================================================
 * API de Clientes
 * Sistema de Cotizaciones - Freelance Tech Support
 * =====================================================
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
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
                // Obtener un cliente específico
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
                // Listar todos los clientes activos
                $clientes = $db->fetchAll(
                    "SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre ASC"
                );
                jsonResponse(true, 'Lista de clientes', $clientes);
            }
            break;
            
        case 'POST':
            // Crear nuevo cliente
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validaciones
            if (empty($data['nombre'])) {
                jsonResponse(false, 'El nombre es obligatorio');
            }
            if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                jsonResponse(false, 'Email inválido o vacío');
            }
            if (empty($data['telefono']) || !preg_match('/^[0-9\-\+\s]+$/', $data['telefono'])) {
                jsonResponse(false, 'Teléfono inválido (solo números, guiones y espacios)');
            }
            
            // Verificar email único
            $existe = $db->fetchOne(
                "SELECT id_cliente FROM clientes WHERE email = ? AND activo = 1",
                [$data['email']]
            );
            if ($existe) {
                jsonResponse(false, 'Ya existe un cliente con este email');
            }
            
            // Insertar cliente
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
            // Actualizar cliente
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['id_cliente'])) {
                jsonResponse(false, 'ID de cliente es requerido');
            }
            
            // Validaciones
            if (empty($data['nombre'])) {
                jsonResponse(false, 'El nombre es obligatorio');
            }
            if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                jsonResponse(false, 'Email inválido o vacío');
            }
            if (empty($data['telefono']) || !preg_match('/^[0-9\-\+\s]+$/', $data['telefono'])) {
                jsonResponse(false, 'Teléfono inválido (solo números, guiones y espacios)');
            }
            
            // Verificar email único (excluyendo el cliente actual)
            $existe = $db->fetchOne(
                "SELECT id_cliente FROM clientes WHERE email = ? AND id_cliente != ? AND activo = 1",
                [$data['email'], $data['id_cliente']]
            );
            if ($existe) {
                jsonResponse(false, 'Ya existe otro cliente con este email');
            }
            
            // Actualizar
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
            jsonResponse(true, 'Cliente actualizado exitosamente', $cliente);
            break;
            
        case 'DELETE':
            // Eliminar cliente (soft delete)
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            
            if ($id <= 0) {
                jsonResponse(false, 'ID de cliente inválido');
            }
            
            // Verificar si tiene cotizaciones
            $cotizaciones = $db->fetchOne(
                "SELECT COUNT(*) as total FROM cotizaciones WHERE id_cliente = ?",
                [$id]
            );
            
            if ($cotizaciones['total'] > 0) {
                jsonResponse(false, 'No se puede eliminar: el cliente tiene cotizaciones asociadas');
            }
            
            $db->query("UPDATE clientes SET activo = 0 WHERE id_cliente = ?", [$id]);
            jsonResponse(true, 'Cliente eliminado exitosamente');
            break;
            
        default:
            jsonResponse(false, 'Método no permitido');
    }
} catch (Exception $e) {
    jsonResponse(false, 'Error: ' . $e->getMessage());
}
?>
