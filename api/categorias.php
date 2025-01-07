<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
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
            echo json_encode($result);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents("php://input"));

        if (isset($input->nombre) && isset($input->descripcion)) {
            $sql = "INSERT INTO categorias (nombre, descripcion) VALUES (:nombre, :descripcion)";
            $stmt = $db->prepare($sql);
            
            $stmt->bindParam(':nombre', $input->nombre);
            $stmt->bindParam(':descripcion', $input->descripcion);
            
            if($stmt->execute()) {
                echo json_encode(array(
                    "status" => "success",
                    "message" => "Categoría creada exitosamente.",
                    "data" => array(
                        "nombre" => $nombre,
                        "descripcion" => $descripcion
                    )
                ));
            } else {
                echo json_encode(array(
                    "status" => "error",
                    "message" => "Error al crear la categoría."
                ));
            }
        } else {
            echo json_encode(array(
                "status" => "error",
                "message" => "Datos incompletos. Se requiere nombre y descripción."
            ));
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        $sql = "UPDATE categorias SET nombre = :nombre, descripcion = :descripcion 
                WHERE id_categoria = :id";
        $stmt = $db->prepare($sql);
        
        $stmt->bindParam(':nombre', $data->nombre);
        $stmt->bindParam(':descripcion', $data->descripcion);
        $stmt->bindParam(':id', $data->id_categoria);
        
        if($stmt->execute()) {
            echo json_encode(array("message" => "Categoría actualizada exitosamente."));
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));
        
        $sql = "DELETE FROM categorias WHERE id_categoria = :id";
        $stmt = $db->prepare($sql);
        
        $stmt->bindParam(':id', $data->id_categoria);
        
        if($stmt->execute()) {
            echo json_encode(array("message" => "Categoría eliminada exitosamente."));
        }
        break;
}
?>
