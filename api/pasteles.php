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
                    $sql = "SELECT p.*, c.nombre as categoria_nombre 
                            FROM pasteles p 
                            JOIN categorias c ON p.id_categoria = c.id_categoria 
                            WHERE p.id_pastel = :id";
                    $stmt = $db->prepare($sql);
                    $stmt->bindParam(':id', $_GET['id']);
                } else {
                    $sql = "SELECT p.*, c.nombre as categoria_nombre 
                            FROM pasteles p 
                            JOIN categorias c ON p.id_categoria = c.id_categoria";
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
                
                // Validación de datos requeridos
                if(!isset($data->id_categoria) || !isset($data->nombre) || 
                   !isset($data->descripcion) || !isset($data->precio) || 
                   !isset($data->stock) || !isset($data->imagen)) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Datos incompletos']);
                    break;
                }

                $sql = "INSERT INTO pasteles (id_categoria, nombre, descripcion, precio, stock, imagen) 
                        VALUES (:id_categoria, :nombre, :descripcion, :precio, :stock, :imagen)";
                $stmt = $db->prepare($sql);
                
                $stmt->bindParam(':id_categoria', $data->id_categoria);
                $stmt->bindParam(':nombre', $data->nombre);
                $stmt->bindParam(':descripcion', $data->descripcion);
                $stmt->bindParam(':precio', $data->precio);
                $stmt->bindParam(':stock', $data->stock);
                $stmt->bindParam(':imagen', $data->imagen);
                
                if($stmt->execute()) {
                    http_response_code(201);
                    echo json_encode(['status' => 'success', 'message' => 'Pastel creado exitosamente']);
                }
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
            break;

        case 'PUT':
            try {
                $data = json_decode(file_get_contents("php://input"));
                
                // Validación de datos requeridos
                if(!isset($data->id_pastel) || !isset($data->id_categoria) || 
                   !isset($data->nombre) || !isset($data->descripcion) || 
                   !isset($data->precio) || !isset($data->stock) || 
                   !isset($data->imagen)) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Datos incompletos']);
                    break;
                }

                $sql = "UPDATE pasteles 
                        SET id_categoria = :id_categoria, 
                            nombre = :nombre, 
                            descripcion = :descripcion,
                            precio = :precio,
                            stock = :stock,
                            imagen = :imagen
                        WHERE id_pastel = :id";
                $stmt = $db->prepare($sql);
                
                $stmt->bindParam(':id_categoria', $data->id_categoria);
                $stmt->bindParam(':nombre', $data->nombre);
                $stmt->bindParam(':descripcion', $data->descripcion);
                $stmt->bindParam(':precio', $data->precio);
                $stmt->bindParam(':stock', $data->stock);
                $stmt->bindParam(':imagen', $data->imagen);
                $stmt->bindParam(':id', $data->id_pastel);
                
                if($stmt->execute()) {
                    http_response_code(200);
                    echo json_encode(['status' => 'success', 'message' => 'Pastel actualizado exitosamente']);
                }
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
            break;

        case 'DELETE':
            try {
                $data = json_decode(file_get_contents("php://input"));
                
                if(!isset($data->id_pastel)) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'ID de pastel no proporcionado']);
                    break;
                }

                $sql = "DELETE FROM pasteles WHERE id_pastel = :id";
                $stmt = $db->prepare($sql);
                
                $stmt->bindParam(':id', $data->id_pastel);
                
                if($stmt->execute()) {
                    http_response_code(200);
                    echo json_encode(['status' => 'success', 'message' => 'Pastel eliminado exitosamente']);
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
