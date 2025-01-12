<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Activar el modo de errores de PDO para lanzar excepciones
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

if(isset($_GET['id'])) {
    try {
        // Primero verificamos si el producto existe
        $check_sql = "SELECT id_pastel FROM pasteles WHERE id_pastel = :id";
        $check_stmt = $db->prepare($check_sql);
        $id = intval($_GET['id']);
        $check_stmt->bindParam(':id', $id);
        $check_stmt->execute();

        if($check_stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                "status" => "error",
                "message" => "No se encontró el producto con ID: " . $id
            ]);
            return;
        }

        // Ejecutar la eliminación sin transacción
        $sql = "DELETE FROM pasteles WHERE id_pastel = :id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':id', $id);

        $stmt->execute();

        if($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "message" => "Producto eliminado exitosamente"
            ]);
        } else {
            // Si no se afectó ninguna fila, puede haber ocurrido un error
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Error al eliminar el producto"
            ]);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Error en la base de datos: " . $e->getMessage()
        ]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Error: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "ID del producto no proporcionado"
    ]);
}
?>
