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
            echo json_encode($result);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
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
            echo json_encode(array("message" => "Pastel creado exitosamente."));
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
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
            echo json_encode(array("message" => "Pastel actualizado exitosamente."));
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));
        
        $sql = "DELETE FROM pasteles WHERE id_pastel = :id";
        $stmt = $db->prepare($sql);
        
        $stmt->bindParam(':id', $data->id_pastel);
        
        if($stmt->execute()) {
            echo json_encode(array("message" => "Pastel eliminado exitosamente."));
        }
        break;
}
?>
