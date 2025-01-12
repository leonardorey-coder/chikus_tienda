<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if(isset($_GET['id'])) {
    try {
        // Primero verificamos si el pastel existe
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

        // Iniciar transacción
        $db->beginTransaction();

        $sql = "DELETE FROM pasteles WHERE id_pastel = :id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':id', $id);
        
        if($stmt->execute()) {
            $db->commit();
            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "message" => "Producto eliminado exitosamente"
            ]);
        } else {
            $db->rollBack();
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Error al eliminar el producto"
            ]);
        }
    } catch(PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Error en la base de datos: " . $e->getMessage()
        ]);
    } catch(Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
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
