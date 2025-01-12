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
            // Manejar la subida de archivos
            $uploadDir = '../uploads/';
            
            // Verificar y crear directorio con manejo de errores
            if (!file_exists($uploadDir)) {
                if (!mkdir($uploadDir, 0777, true)) {
                    echo json_encode([
                        "status" => "error",
                        "message" => "No se pudo crear el directorio de uploads"
                    ]);
                    exit;
                }
            }
    
            $rutaImagen = null;
            if (isset($_FILES['imagen'])) {
                // Verificar errores específicos de la subida
                switch ($_FILES['imagen']['error']) {
                    case UPLOAD_ERR_OK:
                        break;
                    case UPLOAD_ERR_INI_SIZE:
                        echo json_encode(["status" => "error", "message" => "El archivo excede el tamaño máximo permitido"]);
                        exit;
                    case UPLOAD_ERR_FORM_SIZE:
                        echo json_encode(["status" => "error", "message" => "El archivo excede el tamaño máximo del formulario"]);
                        exit;
                    case UPLOAD_ERR_PARTIAL:
                        echo json_encode(["status" => "error", "message" => "El archivo se subió parcialmente"]);
                        exit;
                    case UPLOAD_ERR_NO_FILE:
                        echo json_encode(["status" => "error", "message" => "No se seleccionó ningún archivo"]);
                        exit;
                    default:
                        echo json_encode(["status" => "error", "message" => "Error desconocido al subir el archivo"]);
                        exit;
                }
    
                $extension = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
                
                // Verificar extensión permitida
                $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
                if (!in_array($extension, $allowedTypes)) {
                    echo json_encode([
                        "status" => "error",
                        "message" => "Tipo de archivo no permitido. Solo se permiten: " . implode(', ', $allowedTypes)
                    ]);
                    exit;
                }
    
                $nombreArchivo = uniqid() . '_' . time() . '.' . $extension;
                $rutaImagen = 'uploads/' . $nombreArchivo;
                $rutaCompletaArchivo = $uploadDir . $nombreArchivo;
    
                // Intentar mover el archivo con manejo de errores específicos
                if (!is_writable($uploadDir)) {
                    echo json_encode([
                        "status" => "error",
                        "message" => "El directorio de uploads no tiene permisos de escritura"
                    ]);
                    exit;
                }
    
                if (!move_uploaded_file($_FILES['imagen']['tmp_name'], $rutaCompletaArchivo)) {
                    echo json_encode([
                        "status" => "error",
                        "message" => "Error al mover el archivo. Error: " . error_get_last()['message']
                    ]);
                    exit;
                }
            }
    
            // Resto del código POST igual...
            if(isset($_POST['id_categoria']) && isset($_POST['nombre']) && 
               isset($_POST['precio']) && isset($_POST['stock'])) {
                
                $sql = "INSERT INTO pasteles (id_categoria, nombre, descripcion, precio, stock, imagen) 
                        VALUES (:id_categoria, :nombre, :descripcion, :precio, :stock, :imagen)";
                $stmt = $db->prepare($sql);
                
                // Convertir valores a los tipos correctos
                $id_categoria = intval($_POST['id_categoria']);
                $nombre = $_POST['nombre'];
                $descripcion = $_POST['descripcion'] ?? '';
                $precio = floatval($_POST['precio']);
                $stock = intval($_POST['stock']);
                
                $stmt->bindParam(':id_categoria', $id_categoria);
                $stmt->bindParam(':nombre', $nombre);
                $stmt->bindParam(':descripcion', $descripcion);
                $stmt->bindParam(':precio', $precio);
                $stmt->bindParam(':stock', $stock);
                $stmt->bindParam(':imagen', $rutaImagen);
                
                if($stmt->execute()) {
                    echo json_encode([
                        "status" => "success",
                        "message" => "Producto creado exitosamente",
                        "rutaImagen" => $rutaImagen
                    ]);
                } else {
                    echo json_encode([
                        "status" => "error",
                        "message" => "Error al crear el producto en la base de datos"
                    ]);
                }
            } else {
                echo json_encode([
                    "status" => "error",
                    "message" => "Datos incompletos en el formulario"
                ]);
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
                        "message" => "No se encontró el pastel con ID: " . $id
                    ]);
                    break;
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
                        "message" => "Pastel eliminado exitosamente"
                    ]);
                } else {
                    throw new Exception("Error al ejecutar la consulta");
                }
            } catch(PDOException $e) {
                $db->rollBack();
                http_response_code(500);
                echo json_encode([
                    "status" => "error",
                    "message" => "Error en la base de datos: " . $e->getMessage()
                ]);
            } catch(Exception $e) {
                $db->rollBack();
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
                "message" => "ID del pastel no proporcionado"
            ]);
        }
        break;
}
?>
