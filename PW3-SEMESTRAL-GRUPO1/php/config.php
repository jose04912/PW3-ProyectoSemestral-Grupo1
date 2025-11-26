<?php
/**
 * =====================================================
 * Configuración de Conexión a Base de Datos
 * Sistema de Cotizaciones - Freelance Tech Support
 * =====================================================
 */

// Configuración de la base de datos
define('DB_HOST', 'db');           // Nombre del servicio en Docker
define('DB_NAME', 'freelance_db');
define('DB_USER', 'freelance_user');
define('DB_PASS', 'freelance123');
define('DB_CHARSET', 'utf8mb4');

// Configuración del sistema
define('SITE_NAME', 'TechFix Pro');
define('SITE_SLOGAN', 'Soluciones Tecnológicas a tu Alcance');
define('TAX_PERCENTAGE', 8.00);  // Porcentaje de impuesto (ITBMS)

/**
 * Clase para manejar la conexión a la base de datos
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
            die("Error de conexión: " . $e->getMessage());
        }
    }
    
    /**
     * Obtener instancia única de la conexión (Singleton)
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Obtener la conexión PDO
     */
    public function getConnection() {
        return $this->conn;
    }
    
    /**
     * Ejecutar una consulta preparada
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            throw new Exception("Error en consulta: " . $e->getMessage());
        }
    }
    
    /**
     * Obtener todos los registros
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener un solo registro
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    /**
     * Obtener el último ID insertado
     */
    public function lastInsertId() {
        return $this->conn->lastInsertId();
    }
    
    /**
     * Iniciar transacción
     */
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }
    
    /**
     * Confirmar transacción
     */
    public function commit() {
        return $this->conn->commit();
    }
    
    /**
     * Revertir transacción
     */
    public function rollback() {
        return $this->conn->rollBack();
    }
}

/**
 * Función helper para obtener la conexión
 */
function getDB() {
    return Database::getInstance();
}

/**
 * Función para sanitizar entrada
 */
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

/**
 * Función para respuesta JSON
 */
function jsonResponse($success, $message, $data = null) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Generar número de cotización único
 */
function generarNumeroCotizacion() {
    $db = getDB();
    $result = $db->fetchOne("SELECT COALESCE(MAX(id_cotizacion), 0) + 1 AS next_id FROM cotizaciones");
    return 'COT-' . str_pad($result['next_id'] + 1000, 4, '0', STR_PAD_LEFT);
}
?>
