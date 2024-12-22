<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];

    switch($method) {
        case 'GET':
            try {
                if(isset($_GET['id'])) {
                    $sql = "SELECT * FROM categorias WHERE id_categoria = :id";
                    $stmt = $db->prepare($sql);
                    $stmt->bindParam(':id', $_GET['id']);
                } else {
                    $sql = "SELECT * FROM categorias";
                    $stmt = $db->prepare($sql);
                }
                
                if($stmt->execute()) {
                    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    http_response_code(200);
                    echo json_encode(['status' => 'success', 'data' => $result]);
                }
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
            break;

        case 'POST':
            try {
                $data = json_decode(file_get_contents("php://input"));
                
                if(!isset($data->nombre) || !isset($data->descripcion)) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Datos incompletos']);
                    break;
                }

                $sql = "INSERT INTO categorias (nombre, descripcion) VALUES (:nombre, :descripcion)";
                $stmt = $db->prepare($sql);
                
                $stmt->bindParam(':nombre', $data->nombre);
                $stmt->bindParam(':descripcion', $data->descripcion);
                
                if($stmt->execute()) {
                    http_response_code(201);
                    echo json_encode(['status' => 'success', 'message' => 'Categoría creada exitosamente']);
                }
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
            break;

        case 'PUT':
            try {
                $data = json_decode(file_get_contents("php://input"));
                
                if(!isset($data->id_categoria) || !isset($data->nombre) || !isset($data->descripcion)) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Datos incompletos']);
                    break;
                }

                $sql = "UPDATE categorias SET nombre = :nombre, descripcion = :descripcion 
                        WHERE id_categoria = :id";
                $stmt = $db->prepare($sql);
                
                $stmt->bindParam(':nombre', $data->nombre);
                $stmt->bindParam(':descripcion', $data->descripcion);
                $stmt->bindParam(':id', $data->id_categoria);
                
                if($stmt->execute()) {
                    http_response_code(200);
                    echo json_encode(['status' => 'success', 'message' => 'Categoría actualizada exitosamente']);
                }
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
            break;

        case 'DELETE':
            try {
                $data = json_decode(file_get_contents("php://input"));
                
                if(!isset($data->id_categoria)) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'ID de categoría no proporcionado']);
                    break;
                }

                $sql = "DELETE FROM categorias WHERE id_categoria = :id";
                $stmt = $db->prepare($sql);
                
                $stmt->bindParam(':id', $data->id_categoria);
                
                if($stmt->execute()) {
                    http_response_code(200);
                    echo json_encode(['status' => 'success', 'message' => 'Categoría eliminada exitosamente']);
                }
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
            break;
    }

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error en el servidor: ' . $e->getMessage()]);
}
?>
