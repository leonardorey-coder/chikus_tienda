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
        // Leer datos JSON de la solicitud
        $data = json_decode(file_get_contents("php://input"));
        
        if(isset($data->id_categoria) && isset($data->nombre) && 
           isset($data->precio) && isset($data->stock)) {
            
            $sql = "INSERT INTO pasteles (id_categoria, nombre, descripcion, precio, stock, imagen) 
                    VALUES (:id_categoria, :nombre, :descripcion, :precio, :stock, :imagen)";
            $stmt = $db->prepare($sql);
            
            // Convertir valores a los tipos correctos
            $id_categoria = intval($data->id_categoria);
            $nombre = $data->nombre;
            $descripcion = $data->descripcion ?? '';
            $precio = floatval($data->precio);
            $stock = intval($data->stock);
            $imagen = $data->imagen ?? '';
            
            $stmt->bindParam(':id_categoria', $id_categoria);
            $stmt->bindParam(':nombre', $nombre);
            $stmt->bindParam(':descripcion', $descripcion);
            $stmt->bindParam(':precio', $precio);
            $stmt->bindParam(':stock', $stock);
            $stmt->bindParam(':imagen', $imagen);
            
            if($stmt->execute()) {
                echo json_encode(array(
                    "status" => "success",
                    "message" => "Producto creado exitosamente"
                ));
            } else {
                echo json_encode(array(
                    "status" => "error",
                    "message" => "Error al crear el producto"
                ));
            }
        } else {
            echo json_encode(array(
                "status" => "error",
                "message" => "Datos incompletos"
            ));
        }
        break;

    case 'PUT':
        // Leer datos JSON de la solicitud
        $data = json_decode(file_get_contents("php://input"));
        
        if(isset($data->id_pastel) && isset($data->id_categoria) && 
           isset($data->nombre) && isset($data->precio) && 
           isset($data->stock)) {
            
            $sql = "UPDATE pasteles SET 
                    id_categoria = :id_categoria, 
                    nombre = :nombre, 
                    descripcion = :descripcion,
                    precio = :precio,
                    stock = :stock,
                    imagen = :imagen
                    WHERE id_pastel = :id";
            
            $stmt = $db->prepare($sql);
            
            // Convertir valores a los tipos correctos
            $id_categoria = intval($data->id_categoria);
            $nombre = $data->nombre;
            $descripcion = $data->descripcion ?? '';
            $precio = floatval($data->precio);
            $stock = intval($data->stock);
            $imagen = $data->imagen ?? '';
            
            $stmt->bindParam(':id_categoria', $id_categoria);
            $stmt->bindParam(':nombre', $nombre);
            $stmt->bindParam(':descripcion', $descripcion);
            $stmt->bindParam(':precio', $precio);
            $stmt->bindParam(':stock', $stock);
            $stmt->bindParam(':imagen', $imagen);
            $stmt->bindParam(':id', $data->id_pastel);
            
            if($stmt->execute()) {
                echo json_encode(array(
                    "status" => "success",
                    "message" => "Producto actualizado exitosamente"
                ));
            } else {
                echo json_encode(array(
                    "status" => "error",
                    "message" => "Error al actualizar el producto"
                ));
            }
        } else {
            echo json_encode(array(
                "status" => "error",
                "message" => "Datos incompletos para la actualización"
            ));
        }
        break;

    case 'DELETE':
        if(isset($_POST['id_pastel'])) {
            $sql = "DELETE FROM pasteles WHERE id_pastel = :id";
            $stmt = $db->prepare($sql);
            
            $stmt->bindParam(':id', $_POST['id_pastel']);
            
            if($stmt->execute()) {
                echo json_encode(array(
                    "status" => "success",
                    "message" => "Pastel eliminado exitosamente."
                ));
            } else {
                echo json_encode(array(
                    "status" => "error",
                    "message" => "Error al eliminar el pastel."
                ));
            }
        } else {
            echo json_encode(array(
                "status" => "error",
                "message" => "ID del pastel no proporcionado."
            ));
        }
        break;
}
?>
