<?php
class Database {
    private $database_url;
    public $conn;

    public function __construct() {
        $this->database_url = getenv('DATABASE_URL');
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO($this->database_url);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Error de conexión: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>
