<?php
class Database {
    private $host = "tcp:chikustiendabd.database.windows.net,1433";
    private $database_name = "chikus_panel_bd";
    private $username = "chikustiendabd";
    private $password = "Imking120"; // Reemplaza con tu contraseña real
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "sqlsrv:server=" . $this->host . ";Database=" . $this->database_name,
                $this->username,
                $this->password
            );
            // Establecer el modo de error a excepciones
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Error de conexión: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>
