// Función para mostrar notificaciones
function showNotification(title, message, type = 'success') {
    Swal.fire({
        title: title,
        text: message,
        icon: type,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
}

// Función para actualizar el dashboard
async function updateDashboard() {
    try {
        const [pasteles, categorias] = await Promise.all([
            fetch('api/pasteles.php').then(r => r.json()),
            fetch('api/categorias.php').then(r => r.json())
        ]);
        
        // Actualizar contadores principales
        document.getElementById('totalPasteles').textContent = pasteles.length;
        document.getElementById('totalCategorias').textContent = categorias.length;

        const valorTotal = pasteles.reduce((acc, pastel) => {
            return acc + (pastel.precio * pastel.stock);
        }, 0);
        document.getElementById('valorInventario').textContent = `$${valorTotal.toFixed(2)}`;

        // Gráfico de productos por categoría
        const productosPorCategoria = pasteles.reduce((acc, pastel) => {
            if (!acc[pastel.categoria_nombre]) {
                acc[pastel.categoria_nombre] = 0;
            }
            acc[pastel.categoria_nombre]++;
            return acc;
        }, {});

        new Chart(document.getElementById('categoriaChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(productosPorCategoria),
                datasets: [{
                    data: Object.values(productosPorCategoria),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                    ]
                }]
            }
        });

        // Lista de productos con stock bajo (menos de 5 unidades)
        const stockBajo = pasteles.filter(p => p.stock < 5)
            .sort((a, b) => a.stock - b.stock);
        
        const stockBajoHTML = stockBajo.map(p => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${p.nombre}</h6>
                    <small class="text-muted">${p.categoria_nombre}</small>
                </div>
                <span class="badge bg-danger rounded-pill">${p.stock}</span>
            </div>
        `).join('');
        
        document.getElementById('stockBajo').innerHTML = stockBajoHTML || 
            '<p class="text-center text-muted my-3">No hay productos con stock bajo</p>';

        // Gráfico de valor por categoría
        const valorPorCategoria = pasteles.reduce((acc, pastel) => {
            if (!acc[pastel.categoria_nombre]) {
                acc[pastel.categoria_nombre] = 0;
            }
            acc[pastel.categoria_nombre] += pastel.precio * pastel.stock;
            return acc;
        }, {});

        new Chart(document.getElementById('valorChart'), {
            type: 'bar',
            data: {
                labels: Object.keys(valorPorCategoria),
                datasets: [{
                    label: 'Valor del inventario',
                    data: Object.values(valorPorCategoria),
                    backgroundColor: '#36A2EB'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });

        // Top productos por valor total
        const topProductos = pasteles
            .map(p => ({
                ...p,
                valorTotal: p.precio * p.stock
            }))
            .sort((a, b) => b.valorTotal - a.valorTotal)
            .slice(0, 5);

        const topProductosHTML = topProductos.map(p => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${p.nombre}</h6>
                    <small class="text-muted">Stock: ${p.stock}</small>
                </div>
                <span class="badge bg-success">$${p.valorTotal.toFixed(2)}</span>
            </div>
        `).join('');
        
        document.getElementById('topProductos').innerHTML = topProductosHTML;

    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'No se pudo actualizar el dashboard', 'error');
    }
}

// Función para previsualizar imágenes
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const file = input.files[0];
    const reader = new FileReader();

    reader.onloadend = function () {
        preview.src = reader.result;
        preview.style.display = 'block';
    }

    if (file) {
        reader.readAsDataURL(file);
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
}

// Función para actualizar el ranking de ventas (agrupado)
async function updateRankingVentas() {
    try {
        const response = await fetch('api/ventas.php?agrupado=true');
        const ventas = await response.json();

        if (ventas.length === 0) {
            document.getElementById('rankingVentas').innerHTML = '<p class="text-muted text-center mb-0">No hay datos de ventas.</p>';
            return;
        }

        // Ordenar por cantidad total de ventas
        const ventasOrdenadas = [...ventas].sort((a, b) => b.cantidad_total - a.cantidad_total);
        const top3 = ventasOrdenadas.slice(0, 3);
        const least3 = ventasOrdenadas.slice(-3).reverse();

        let html = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6>Más Vendidos</h6>
                    ${top3.map(producto => `
                        <div class="d-flex align-items-center mb-2">
                            <img src="${producto.imagen || 'https://via.placeholder.com/100x100?text=Sin+Imagen'}" 
                                 alt="${producto.nombre}" 
                                 width="50" height="50" 
                                 class="me-3 rounded">
                            <div>
                                <strong>${producto.nombre}</strong>
                                <div class="text-muted small">
                                    Total vendidos: ${producto.cantidad_total}
                                    <br>
                                    <small>(${producto.total_ventas} ventas)</small>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="col-md-6">
                    <h6>Menos Vendidos</h6>
                    ${least3.map(producto => `
                        <div class="d-flex align-items-center mb-2">
                            <img src="${producto.imagen || 'https://via.placeholder.com/100x100?text=Sin+Imagen'}" 
                                 alt="${producto.nombre}" 
                                 width="50" height="50" 
                                 class="me-3 rounded">
                            <div>
                                <strong>${producto.nombre}</strong>
                                <div class="text-muted small">
                                    Total vendidos: ${producto.cantidad_total}
                                    <br>
                                    <small>(${producto.total_ventas} ventas)</small>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('rankingVentas').innerHTML = html;

    } catch (error) {
        console.error('Error al actualizar el ranking de ventas:', error);
        document.getElementById('rankingVentas').innerHTML = '<p class="text-danger mb-0">Error al cargar el ranking de ventas.</p>';
    }
}

// Función para actualizar el historial de ventas (no agrupado)
async function actualizarHistorialVentas() {
    const historialVentasBody = document.getElementById('historialVentasBody');
    historialVentasBody.innerHTML = '';

    try {
        const response = await fetch('api/ventas.php?dia=true');
        const ventas = await response.json();

        if (ventas.length === 0) {
            historialVentasBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fas fa-receipt fa-2x mb-3 d-block text-muted"></i>
                        <span class="text-muted">No hay ventas hoy</span>
                    </td>
                </tr>
            `;
            return;
        }

        // Agrupar ventas por hora
        const ventasPorHora = ventas.reduce((grupos, venta) => {
            const hora = new Date(venta.fecha_venta).getHours();
            if (!grupos[hora]) {
                grupos[hora] = [];
            }
            grupos[hora].push(venta);
            return grupos;
        }, {});

        // Convertir a array y ordenar las horas de mayor a menor
        const horasOrdenadas = Object.entries(ventasPorHora)
            .sort(([horaA], [horaB]) => parseInt(horaB) - parseInt(horaA));

        const html = horasOrdenadas.map(([hora, ventasHora]) => {
            // Formatear hora con padding de ceros
            const horaFormateada = hora.toString().padStart(2, '0') + ':00';
            
            return `
                <tr class="table-light">
                    <td colspan="5" class="fw-bold text-primary">
                        ${horaFormateada}
                    </td>
                </tr>
                ${ventasHora.map(venta => `
                    <tr>
                        <td class="text-nowrap text-muted">${formatDate(venta.fecha_venta)}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${venta.imagen || 'https://via.placeholder.com/40x40?text=Sin+Imagen'}" 
                                     alt="${venta.nombre}"
                                     class="rounded me-2"
                                     style="width: 40px; height: 40px; object-fit: cover;">
                                <div class="fw-medium">${venta.nombre}</div>
                            </div>
                        </td>
                        <td class=" d-md-table-cell text-muted">
                            <small>${venta.descripcion || 'Sin descripción'}</small>
                        </td>
                        <td class="text-center">
                            <span class="badge bg-secondary">${venta.cantidad}</span>
                        </td>
                        <td class="text-end">
                            <span class="badge bg-success">$${(venta.precio_unitario * venta.cantidad).toFixed(2)}</span>
                        </td>
                    </tr>
                `).join('')}
            `;
        }).join('');
        
        historialVentasBody.innerHTML = html;

        // Calcular y mostrar el total del día
        const totalDia = ventas.reduce((total, venta) => 
            total + (venta.precio_unitario * venta.cantidad), 0
        );

        historialVentasBody.innerHTML += `
            <tr>
                <td colspan="4" class="text-end">Total:</td>
                <td class="text-end">
                    <span class="badge bg-primary fs-6">$${totalDia.toFixed(2)}</span>
                </td>
            </tr>
        `;
        
    } catch (error) {
        console.error('Error:', error);
        historialVentasBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-exclamation-circle fa-2x mb-3 d-block text-danger"></i>
                    <span class="text-danger">Error al cargar el historial</span>
                </td>
            </tr>
        `;
    }
}

// Agregar función para actualización automática a medianoche
function programarActualizacionMedianoche() {
    const ahora = new Date();
    const medianoche = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() + 1, // siguiente día
        0, 0, 0 // 00:00:00
    );
    
    const tiempoHastaMedianoche = medianoche - ahora;

    // Programar la actualización para medianoche
    setTimeout(() => {
        actualizarHistorialVentas();
        // Reprogramar para la siguiente medianoche
        programarActualizacionMedianoche();
    }, tiempoHastaMedianoche);
}

async function loadDashboardData() {
    try {
        const response = await fetch('api/pasteles.php');
        const productos = await response.json();

        // Verificar que 'productos' es un arreglo y contiene la propiedad 'stock'
        if (Array.isArray(productos)) {
            document.getElementById('totalPasteles').innerText = productos.length;
            document.getElementById('totalCategorias').innerText = await getTotalCategorias();
            document.getElementById('valorInventario').innerText = calcularValorInventario(productos);
            document.getElementById('totalStock').innerText = calcularStockTotal(productos);
        } else {
            console.error('La respuesta del API no es un arreglo:', productos);
            document.getElementById('totalStock').innerText = '0';
        }

    } catch (error) {
        console.error('Error al cargar los datos del dashboard:', error);
    }
}

async function getTotalCategorias() {
    try {
        const response = await fetch('api/categorias.php'); // Ajusta la ruta según tu API de categorías
        const categorias = await response.json();
        return Array.isArray(categorias) ? categorias.length : 0;
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        return 0;
    }
}

function calcularStockTotal(productos) {
    // Asegurarse de que cada producto tiene la propiedad 'stock' y es un número
    return productos.reduce((total, producto) => {
        const stock = parseInt(producto.stock, 10);
        return total + (isNaN(stock) ? 0 : stock);
    }, 0);
}

function calcularValorInventario(productos) {
    // Calcular el valor total del inventario sumando (precio * stock) de cada producto
    return productos.reduce((total, producto) => {
        const precio = parseFloat(producto.precio);
        const stock = parseInt(producto.stock, 10);
        return total + (isNaN(precio) || isNaN(stock) ? 0 : precio * stock);
    }, 0).toFixed(2);
}

const formatDate = (isoString) => {
    const date = new Date(isoString);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    return date.toLocaleString('es-ES', options).replace(',', '');
};

async function toggleHistorialCompleto() {
    const contenedor = document.getElementById('historialCompletoDias');
    const accordion = document.getElementById('accordionHistorial');
    
    if (contenedor.style.display === 'none') {
        contenedor.style.display = 'block';
        try {
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/api/ventas?historialDias=true`);
            if (!response.ok) throw new Error('Error al cargar el historial');
            const dias = await response.json();
            
            accordion.innerHTML = dias.map((dia, index) => `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" 
                                data-bs-toggle="collapse" 
                                data-bs-target="#collapse${index}">
                            <div class="d-flex justify-content-between w-100 me-3">
                                <span>${formatearFecha(dia.fecha)}</span>
                                <span class="badge bg-success ms-2">$${parseFloat(dia.total_dia).toFixed(2)}</span>
                                <span class="badge bg-primary ms-2">${dia.total_ventas} ventas</span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse" 
                         data-bs-parent="#accordionHistorial">
                        <div class="accordion-body">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Hora</th>
                                            <th>Producto</th>
                                            <th class="d-md-table-cell">Descripción</th>
                                            <th class="text-center">Cant.</th>
                                            <th class="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody id="historialDia${index}">
                                        <tr>
                                            <td colspan="5" class="text-center">
                                                <div class="spinner-border text-primary" role="status">
                                                    <span class="visually-hidden">Cargando...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            // Agregar evento para cargar datos cuando se abra cada acordeón
            document.querySelectorAll('.accordion-button').forEach((btn, index) => {
                btn.addEventListener('click', async () => {
                    if (!btn.classList.contains('loaded')) {
                        const fecha = dias[index].fecha;
                        await cargarVentasPorDia(fecha, `historialDia${index}`);
                        btn.classList.add('loaded');
                    }
                });
            });

        } catch (error) {
            console.error('Error:', error);
            accordion.innerHTML = '<div class="alert alert-danger">Error al cargar el historial</div>';
        }
    } else {
        contenedor.style.display = 'none';
    }
}

async function cargarVentasPorDia(fecha, targetId) {
    try {
        // Ajustar la ruta para Azure
        const baseUrl = window.location.origin; // Obtiene la URL base del sitio
        const response = await fetch(`${baseUrl}/api/ventas?fecha=${fecha}`); // Eliminar .php
        
        if (!response.ok) {
            throw new Error(`Error al cargar las ventas: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(data.message);
        }

        const tbody = document.getElementById(targetId);
        
        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No hay ventas registradas para este día
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(venta => `
            <tr>
                <td class="text-nowrap">${formatearHora(venta.fecha_venta)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${venta.imagen || 'https://via.placeholder.com/40x40?text=Sin+Imagen'}" 
                             alt="${venta.nombre}"
                             class="rounded me-2"
                             style="width: 40px; height: 40px; object-fit: cover;">
                        <div class="fw-medium">${venta.nombre}</div>
                    </div>
                </td>
                <td class="d-md-table-cell">
                    <small class="text-muted">${venta.descripcion || 'Sin descripción'}</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-secondary">${venta.cantidad}</span>
                </td>
                <td class="text-end">
                    <span class="badge bg-success">$${(venta.cantidad * venta.precio_unitario).toFixed(2)}</span>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error completo:', error);
        document.getElementById(targetId).innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Error al cargar las ventas. Por favor, intente nuevamente.
                </td>
            </tr>
        `;
    }
}

function formatearFecha(fecha) {
    // Asegurarse de que sea tratada como fecha local
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day); // Mes en JavaScript es 0-indexado

    return fechaLocal.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatearHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Cargar datos iniciales para index
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadDashboardData();
    // Mostrar dashboard por defecto

    updateRankingVentas();
    actualizarHistorialVentas();
    
    // Configurar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    if(document.getElementById('dashboard')) {
        updateDashboard();
    }

    // Agregar programación de actualización a medianoche
    programarActualizacionMedianoche();
    
    // Actualizar cada 5 minutos por si acaso
    setInterval(actualizarHistorialVentas, 300000);
});
