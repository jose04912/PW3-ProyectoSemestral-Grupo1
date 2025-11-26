<?php
/**
 * =====================================================
 * BACKEND - Configuración de Base de Datos
 * Sistema de Cotizaciones - TechFix Pro
 * =====================================================
 */

// Configuración desde variables de entorno o valores por defecto
define('DB_HOST', getenv('DB_HOST') ?: 'db');
define('DB_NAME', getenv('DB_NAME') ?: 'freelance_db');
define('DB_USER', getenv('DB_USER') ?: 'freelance_user');
define('DB_PASS', getenv('DB_PASS') ?: 'freelance123');
define('DB_CHARSET', 'utf8mb4');

// Configuración del sistema
define('TAX_PERCENTAGE', 8.00);

/**
 * Clase Singleton para conexión a BD
 */
class Database {
    private static $instance = null;
    private $conn;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['success' => false, 'message' => 'Error de conexión a BD']));
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    public function query($sql, $params = []) {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    public function fetchAll($sql, $params = []) {
        return $this->query($sql, $params)->fetchAll();
    }
    
    public function fetchOne($sql, $params = []) {
        return $this->query($sql, $params)->fetch();
    }
    
    public function lastInsertId() {
        return $this->conn->lastInsertId();
    }
    
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }
    
    public function commit() {
        return $this->conn->commit();
    }
    
    public function rollback() {
        return $this->conn->rollBack();
    }
}

/**
 * Helper: Obtener instancia de BD
 */
function getDB() {
    return Database::getInstance();
}

/**
 * Helper: Sanitizar entrada
 */
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

/**
 * Helper: Respuesta JSON
 */
function jsonResponse($success, $message, $data = null) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Helper: Generar número de cotización
 */
function generarNumeroCotizacion() {
    $db = getDB();
    $result = $db->fetchOne("SELECT COALESCE(MAX(id_cotizacion), 0) + 1 AS next_id FROM cotizaciones");
    return 'COT-' . str_pad($result['next_id'] + 1000, 4, '0', STR_PAD_LEFT);
}

// Manejar preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}
?>
