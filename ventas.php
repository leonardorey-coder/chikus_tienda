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
                $sql = "SELECT 
                        CONVERT(DATE, fecha_venta) as fecha,
                        COUNT(DISTINCT id_venta) as total_ventas,
                        SUM(cantidad * precio_unitario) as total_dia
                    FROM ventas 
                    GROUP BY CONVERT(DATE, fecha_venta)
                    ORDER BY fecha DESC";
                $stmt = $db->prepare($sql);
                $stmt->execute();
                
            } else if ($fechaEspecifica) {
                // Convertir la fecha al formato correcto para SQL Server
                $fecha = date('Y-m-d', strtotime($fechaEspecifica));
                $sql = "SELECT v.*, p.nombre, p.descripcion, p.imagen 
                        FROM ventas v 
                        JOIN pasteles p ON v.id_pastel = p.id_pastel 
                        WHERE CONVERT(DATE, v.fecha_venta) = ?";
                $params = array($fecha);
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                
            } else if ($porDia) {
                $sql = "SELECT v.*, p.nombre, p.descripcion, p.imagen 
                        FROM ventas v 
                        JOIN pasteles p ON v.id_pastel = p.id_pastel 
                        WHERE CONVERT(DATE, v.fecha_venta) = CONVERT(DATE, GETDATE())
                        ORDER BY v.fecha_venta DESC";
                $stmt = $db->prepare($sql);
                $stmt->execute();
                
            } else if ($agrupado) {
                // Consulta para ventas agrupadas (mantener consulta existente)
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
                        GROUP BY v.id_pastel, p.nombre, p.descripcion, v.precio_unitario
                        ORDER BY cantidad_total DESC";
                $stmt = $db->prepare($sql);
                $stmt->execute();
                
            } else {
                // Consulta para todas las ventas sin agrupar
                $sql = "SELECT v.*, p.nombre, p.descripcion, p.imagen 
                        FROM ventas v 
                        JOIN pasteles p ON v.id_pastel = p.id_pastel 
                        ORDER BY v.fecha_venta DESC";
                $stmt = $db->prepare($sql);
                $stmt->execute();
            }

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Ajustar el manejo de errores
            if ($result === false || !is_array($result)) {
                throw new Exception("No se encontraron resultados");
            }

            header('Content-Type: application/json');
            echo json_encode($result);
            
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                "status" => "error",
                "message" => $e->getMessage(),
                "details" => $sql // Solo para depuración
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
