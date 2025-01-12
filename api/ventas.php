<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $agrupado = isset($_GET['agrupado']) && $_GET['agrupado'] === 'true';
        $porDia = isset($_GET['dia']) && $_GET['dia'] === 'true';
        $historialDias = isset($_GET['historialDias']) && $_GET['historialDias'] === 'true';
        $fechaEspecifica = isset($_GET['fecha']) ? $_GET['fecha'] : null;
        
        try {
            if ($historialDias) {
                // Consulta para obtener días únicos con ventas
                $sql = "SELECT 
                        CAST(fecha_venta AS DATE) as fecha,
                        COUNT(DISTINCT id_venta) as total_ventas,
                        SUM(cantidad * precio_unitario) as total_dia
                    FROM ventas 
                    GROUP BY CAST(fecha_venta AS DATE)
                    ORDER BY fecha DESC";
                $stmt = $db->prepare($sql);
                $stmt->execute();
                
            } else if ($fechaEspecifica) {
              // Asegurarse de que la fecha está en formato correcto
$fecha = date('Y-m-d', strtotime($fechaEspecifica));

$sql = "SELECT v.*, p.nombre, p.descripcion, p.imagen 
        FROM ventas v 
        JOIN pasteles p ON v.id_pastel = p.id_pastel 
        WHERE CAST(v.fecha_venta AS DATE) = :fecha
        ORDER BY v.fecha_venta DESC";

$stmt = $db->prepare($sql);
$stmt->bindParam(':fecha', $fecha);
$stmt->execute();
                
            } else if ($porDia) {
                $sql = "SELECT v.*, p.nombre, p.descripcion, p.imagen 
                        FROM ventas v 
                        JOIN pasteles p ON v.id_pastel = p.id_pastel 
                        WHERE CAST(v.fecha_venta AS DATE) = CAST(GETDATE() AS DATE)
                        ORDER BY v.fecha_venta DESC";
                $stmt = $db->prepare($sql);
                $stmt->execute();
                
            } else if ($agrupado) {
                $sql = "SELECT 
    v.id_pastel,
    p.nombre,
    p.descripcion,
    p.imagen,
    MIN(v.fecha_venta) as primera_venta,
    MAX(v.fecha_venta) as ultima_venta,
    SUM(v.cantidad) as cantidad_total,
    v.precio_unitario,
    COUNT(*) as total_ventas
FROM ventas v 
JOIN pasteles p ON v.id_pastel = p.id_pastel 
GROUP BY 
    v.id_pastel, 
    p.nombre, 
    p.descripcion, 
    p.imagen,
    v.precio_unitario
ORDER BY cantidad_total DESC";
                $stmt = $db->prepare($sql);
                $stmt->execute();
                
            } else {
                $sql = "SELECT v.*, p.nombre, p.descripcion, p.imagen 
                        FROM ventas v 
                        JOIN pasteles p ON v.id_pastel = p.id_pastel 
                        ORDER BY v.fecha_venta DESC";
                $stmt = $db->prepare($sql);
                $stmt->execute();
            }

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($result === false) {
                throw new Exception("Error al ejecutar la consulta");
            }
            
            echo json_encode($result);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => $e->getMessage()
            ]);
        }
        break;

case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if(isset($data->id_pastel)) {
            // Primero obtener el precio actual del producto
            $sql = "SELECT precio FROM pasteles WHERE id_pastel = :id_pastel";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':id_pastel', $data->id_pastel);
            $stmt->execute();
            $producto = $stmt->fetch(PDO::FETCH_ASSOC);

            if($producto) {
                // Registrar la venta
                $sql = "INSERT INTO ventas (id_pastel, cantidad, precio_unitario) 
                        VALUES (:id_pastel, :cantidad, :precio_unitario)";
                $stmt = $db->prepare($sql);
                
                $cantidad = $data->cantidad ?? 1;
                $stmt->bindParam(':id_pastel', $data->id_pastel);
                $stmt->bindParam(':cantidad', $cantidad);
                $stmt->bindParam(':precio_unitario', $producto['precio']);
                
                if($stmt->execute()) {
                    echo json_encode([
                        "status" => "success",
                        "message" => "Venta registrada exitosamente"
                    ]);
                } else {
                    echo json_encode([
                        "status" => "error",
                        "message" => "Error al registrar la venta"
                    ]);
                }
            } else {
                echo json_encode([
                    "status" => "error",
                    "message" => "Producto no encontrado"
                ]);
            }
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Datos incompletos"
            ]);
        }
        break;
}
?>
