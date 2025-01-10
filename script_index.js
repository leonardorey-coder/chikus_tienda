// Funciones para manejar la visualización de secciones
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

// Cargar pasteles
async function loadPasteles() {
    try {
        const response = await fetch('api/pasteles.php');
        const pasteles = await response.json();
        
        const pastelesList = document.getElementById('pastelesList');
        pastelesList.innerHTML = '';
        
        pasteles.forEach(pastel => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';
            col.innerHTML = `
                <div class="card h-100 pastel-card">
                    <img src="${pastel.imagen || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" 
                         class="card-img-top pastel-image" 
                         alt="${pastel.nombre}">
                    <div class="card-body">
                        <h5 class="card-title">${pastel.nombre}</h5>
                        <p class="card-text">${pastel.descripcion || 'Sin descripción'}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-primary">$${parseFloat(pastel.precio).toFixed(2)}</span>
                            <span class="badge bg-secondary">Stock: ${pastel.stock}</span>
                        </div>
                        <p class="card-text"><small class="text-muted">Categoría: ${pastel.categoria_nombre}</small></p>
                    </div>
                    <div class="card-footer bg-white border-0">
                        <div class="btn-group w-100">
                            <button onclick="editPastel(${pastel.id_pastel})" class="btn btn-primary">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button onclick="deletePastel(${pastel.id_pastel})" class="btn btn-danger">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            pastelesList.appendChild(col);
        });
    } catch (error) {
        showNotification('Error', 'No se pudieron cargar los pasteles', 'error');
    }
}

// Funciones para manejar pasteles
async function createPastel(event) {
    event.preventDefault();
    
    const loadingButton = Swal.fire({
        title: 'Guardando producto...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    const data = {
        id_categoria: document.getElementById('pastelCategoria').value,
        nombre: document.getElementById('pastelNombre').value,
        descripcion: document.getElementById('pastelDescripcion').value,
        precio: document.getElementById('pastelPrecio').value,
        stock: document.getElementById('pastelStock').value,
        imagen: document.getElementById('pastelImagen').value
    };

    try {
        const response = await fetch('api/pasteles.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        loadingButton.close();
        showNotification('¡Éxito!', result.message);
        loadPasteles();
        updateDashboard();
        document.getElementById('pastelForm').reset();
    } catch (error) {
        loadingButton.close();
        showNotification('Error', 'No se pudo crear el pastel', 'error');
    }
}

async function editPastel(id) {
    // ...existing code...
}

async function updatePastel(event, id) {
    // ...existing code...
}

async function deletePastel(id) {
    // ...existing code...
}

// Función para cargar categorías en el select
async function loadCategoriasSelect() {
    // ...existing code...
}

// Función para mostrar notificaciones
function showNotification(title, message, type = 'success') {
    // ...existing code...
}

// Función para actualizar el dashboard
async function updateDashboard() {
    try {
        const [pasteles, categorias] = await Promise.all([
            fetch('api/pasteles.php').then(r => r.json()),
            fetch('api/categorias.php').then(r => r.json())
        ]);

        // Continúa con la actualización del dashboard
        console.log('Pasteles:', pasteles);
        console.log('Categorías:', categorias);
        
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

// Función para mostrar/ocultar secciones con animación
function showSection(sectionId) {
    // ...existing code...
}

// Función para validar formularios
function validateForm(formId) {
    // ...existing code...
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

// Función para actualizar el ranking de ventas
async function updateRankingVentas() {
    const ventas = JSON.parse(localStorage.getItem('productosVendidos') || '{}');
    const idsVendidos = Object.keys(ventas);
    
    if(idsVendidos.length === 0) {
        document.getElementById('rankingVentas').innerHTML = '<p class="text-muted mb-0">No hay datos de ventas.</p>';
        return;
    }

    try {
        // Obtener detalles de todos los productos vendidos
        const response = await fetch('api/pasteles.php');
        const productos = await response.json();
        
        // Filtrar solo los productos que han sido vendidos
        const productosVendidos = productos.filter(pastel => idsVendidos.includes(pastel.id_pastel.toString()));
        
        // Mapear ventas con detalles de productos
        const ventasDetalladas = productosVendidos.map(pastel => ({
            id: pastel.id_pastel,
            nombre: pastel.nombre,
            imagen: pastel.imagen || 'https://via.placeholder.com/100x100?text=Sin+Imagen',
            ventas: ventas[pastel.id_pastel]
        }));
        
        // Ordenar de mayor a menor ventas
        ventasDetalladas.sort((a, b) => b.ventas - a.ventas);
        
        const top3 = ventasDetalladas.slice(0, 3);
        const least3 = ventasDetalladas.slice(-3).reverse();
        
        let html = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6>Más Vendidos</h6>
                    ${top3.map(producto => `
                        <div class="d-flex align-items-center mb-2">
                            <img src="${producto.imagen}" alt="${producto.nombre}" width="50" height="50" class="me-3 rounded">
                            <div>
                                <strong>${producto.nombre}</strong>
                                <div>Ventas: ${producto.ventas}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="col-md-6">
                    <h6>Menos Vendidos</h6>
                    ${least3.map(producto => `
                        <div class="d-flex align-items-center mb-2">
                            <img src="${producto.imagen}" alt="${producto.nombre}" width="50" height="50" class="me-3 rounded">
                            <div>
                                <strong>${producto.nombre}</strong>
                                <div>Ventas: ${producto.ventas}</div>
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

// ...existing code...

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

        // ...existing code...
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

// Cargar datos iniciales para index
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    updateRankingVentas();
    // Mostrar dashboard por defecto

    updateDashboard();
    updateRankingVentas();

    
    // Configurar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    if(document.getElementById('dashboard')) {
        showSection('dashboard');
        updateDashboard();
    }
    if(document.getElementById('pastelesList')) {
        loadPasteles();
    }
    if(document.getElementById('pastelForm')) {
        loadCategoriasSelect();
    }
});
