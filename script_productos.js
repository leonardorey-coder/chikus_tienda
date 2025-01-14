async function loadCategoriasSelect() {
    try {
        const response = await fetch('api/categorias.php');
        const categorias = await response.json();
        const select = document.getElementById('pastelCategoria');
        select.innerHTML = '';
        categorias.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id_categoria;
            option.textContent = c.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function createPastel(event) {
    event.preventDefault();
    const loadingButton = Swal.fire({
        title: 'Guardando producto...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Validar que los campos requeridos estén llenos
    const nombre = document.getElementById('pastelNombre').value.trim();
    const categoria = document.getElementById('pastelCategoria').value;
    const precio = document.getElementById('pastelPrecio').value;
    const stock = document.getElementById('pastelStock').value;
    const archivoInput = document.getElementById('pastelArchivo');

    if (!nombre || !categoria || !precio || !stock) {
        loadingButton.close();
        Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
        return;
    }

    try {
        // Crear FormData para enviar tanto los datos como el archivo
        const formData = new FormData();
        formData.append('id_categoria', categoria);
        formData.append('nombre', nombre);
        formData.append('descripcion', document.getElementById('pastelDescripcion').value.trim());
        formData.append('precio', precio);
        formData.append('stock', stock);

        // Agregar el archivo si existe
        if (archivoInput.files.length > 0) {
            const file = archivoInput.files[0];
            // Generar un nombre único para el archivo
            const extension = file.name.split('.').pop();
            const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
            formData.append('imagen', file, nombreArchivo);
        }

        const response = await fetch('api/pasteles.php', {
            method: 'POST',
            body: formData // No incluir Content-Type header, FormData lo establece automáticamente
        });

        const result = await response.json();
        loadingButton.close();

        if (result.status === 'success') {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: result.message,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'productos.html';
            });
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    } catch (error) {
        loadingButton.close();
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo crear el producto', 'error');
    }
}

// Modificar la función loadPasteles para usar el modal
async function editPastel(id) {
    try {
        const [categorias, producto] = await Promise.all([
            fetch('api/categorias.php').then(r => r.json()),
            fetch(`api/pasteles.php?id=${id}`).then(r => r.json())
        ]);

        // Cargar categorías en el select
        const select = document.getElementById('editPastelCategoria');
        select.innerHTML = '';
        categorias.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id_categoria;
            option.textContent = c.nombre;
            select.appendChild(option);
        });

        // Cargar datos del producto
        const pastel = producto[0];
        document.getElementById('editPastelId').value = pastel.id_pastel;
        document.getElementById('editPastelNombre').value = pastel.nombre;
        document.getElementById('editPastelCategoria').value = pastel.id_categoria;
        document.getElementById('editPastelDescripcion').value = pastel.descripcion;
        document.getElementById('editPastelPrecio').value = pastel.precio;
        document.getElementById('editPastelStock').value = pastel.stock;
        document.getElementById('editPastelImagen').value = pastel.imagen;

        // Mostrar modal
        new bootstrap.Modal(document.getElementById('editProductModal')).show();
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo cargar el producto', 'error');
    }
}

async function updatePastel() {
    // Obtener todos los datos necesarios
    const id = document.getElementById('editPastelId').value;
    const currentData = await fetch(`api/pasteles.php?id=${id}`).then(r => r.json());
    const producto = currentData[0];

    const data = {
        id_pastel: id,
        id_categoria: document.getElementById('editPastelCategoria').value,
        nombre: document.getElementById('editPastelNombre').value.trim(),
        descripcion: document.getElementById('editPastelDescripcion').value.trim(),
        precio: document.getElementById('editPastelPrecio').value,
        stock: document.getElementById('editPastelStock').value,
        imagen: document.getElementById('editPastelImagen').value.trim() || producto.imagen
    };

    // Validar datos antes de enviar
    if (!data.id_categoria || !data.nombre || !data.precio || !data.stock) {
        Swal.fire('Error', 'Todos los campos marcados con * son requeridos', 'error');
        return;
    }

    try {
        const response = await fetch('api/pasteles.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('Respuesta del servidor:', result); // Para depuración
        
        if (result.status === 'success') {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Producto actualizado correctamente',
                showConfirmButton: false,
                timer: 1500
            });
            loadPasteles(); // Recargar lista de productos
            document.getElementById('editProductModal').querySelector('.btn-close').click();
        } else {
            Swal.fire('Error', result.message || 'No se pudo actualizar el producto', 'error');
        }
    } catch (error) {
        console.error('Error completo:', error);
        Swal.fire('Error', 'No se pudo actualizar el producto', 'error');
    }
}

// Variables globales para la búsqueda
let allProducts = [];
let searchTimeout;

// Modificar la función loadPasteles para almacenar todos los productos
async function loadPasteles() {
    try {
        const response = await fetch('api/pasteles.php');
        const pasteles = await response.json();
        allProducts = pasteles; // Guardar todos los productos
        
        renderProducts(pasteles);
        
        // Configurar el buscador
        setupSearch();
    } catch (error) {
        showNotification('Error', 'No se pudieron cargar los productos', 'error');
    }
}

// Función para renderizar productos (separada de loadPasteles)
function renderProducts(products) {
    const pastelesList = document.getElementById('pastelesList');
    pastelesList.innerHTML = '';

    if (window.innerWidth <= 768) {
        // Agrupar productos por categoría
        const pastelesPorCategoria = products.reduce((acc, pastel) => {
            if (!acc[pastel.categoria_nombre]) {
                acc[pastel.categoria_nombre] = [];
            }
            acc[pastel.categoria_nombre].push(pastel);
            return acc;
        }, {});

        // Renderizar vista móvil con carruseles por categoría
        Object.entries(pastelesPorCategoria).forEach(([categoria, productos]) => {
            const categoriaSection = document.createElement('div');
            categoriaSection.className = 'categoria-section mb-4';
            categoriaSection.innerHTML = `
                <h4 class="categoria-titulo mb-3 px-3">${categoria}</h4>
                <div class="productos-scroll">
                    <div class="d-flex flex-nowrap px-2">
                        ${productos.map(pastel => `
                            <div class="producto-card me-3" style="min-width: 280px;">
                                <div class="card h-100">
                                    <img src="${pastel.imagen || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" 
                                         class="card-img-top" alt="${pastel.nombre}"
                                         style="height: 180px; object-fit: cover;">
                                    <div class="card-body">
                                        <h5 class="card-title fs-6">${pastel.nombre}</h5>
                                        <p class="card-text small mb-2">${pastel.descripcion || 'Sin descripción'}</p>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span class="badge bg-primary">$${parseFloat(pastel.precio).toFixed(2)}</span>
                                        </div>
                                        <div class="stock-control bg-light rounded p-2">
                                            <div class="d-flex align-items-center justify-content-between">
                                                <span class="badge bg-secondary me-2">Stock</span>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-danger rounded-circle d-flex align-items-center justify-content-center" 
                                                            style="width: 24px; height: 24px; padding: 0;"
                                                            onclick="updateStock(${pastel.id_pastel}, -1)">
                                                        <i class="fas fa-minus fa-xs"></i>
                                                    </button>
                                                    <span class="btn btn-light fw-bold mx-1 border-0" 
                                                          style="min-width: 35px;"
                                                          id="stock-${pastel.id_pastel}">
                                                        ${pastel.stock}
                                                    </span>
                                                    <button class="btn btn-success rounded-circle d-flex align-items-center justify-content-center" 
                                                            style="width: 24px; height: 24px; padding: 0;"
                                                            onclick="updateStock(${pastel.id_pastel}, 1)">
                                                        <i class="fas fa-plus fa-xs"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="mt-2 stock-quick-add" style="display:none;">
                                                <div class="input-group input-group-sm">
                                                    <input type="number" class="form-control form-control-sm" 
                                                           id="add-stock-${pastel.id_pastel}" 
                                                           placeholder="Cant." min="1">
                                                    <button class="btn btn-success btn-sm" 
                                                            onclick="updateStock(${pastel.id_pastel}, null, true)">
                                                        <i class="fas fa-save"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer bg-white border-0 pt-0">
                                        <div class="btn-group w-100">
                                            <button onclick="editPastel(${pastel.id_pastel})" class="btn btn-sm btn-primary">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="deletePastel(${pastel.id_pastel})" class="btn btn-sm btn-danger">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            <button onclick="abrirVenta(${pastel.id_pastel}, '${pastel.nombre}')" class="btn btn-sm btn-warning">
                                                <i class="fas fa-handshake"></i> Vender
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            pastelesList.appendChild(categoriaSection);
        });
    } else {
        // Vista desktop (grid)
        products.forEach(pastel => {
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
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-primary fs-6">$${parseFloat(pastel.precio).toFixed(2)}</span>
                            <div class="stock-control p-2 bg-light rounded shadow-sm">
                                <div class="d-flex align-items-center gap-2">
                                    <span class="badge bg-secondary fs-6">Stock:</span>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-danger rounded-circle d-flex align-items-center justify-content-center" 
                                                style="width: 24px; height: 24px; padding: 0;"
                                                onclick="updateStock(${pastel.id_pastel}, -1)">
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <span class="btn btn-sm btn-light fs-6 fw-bold mx-1 border-0" 
                                              style="min-width: 40px;"
                                              id="stock-${pastel.id_pastel}">
                                            ${pastel.stock}
                                        </span>
                                        <button class="btn btn-sm btn-success rounded-circle d-flex align-items-center justify-content-center" 
                                                style="width: 24px; height: 24px; padding: 0;"
                                                onclick="updateStock(${pastel.id_pastel}, 1)">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mt-2 stock-quick-add" style="display:none;">
                                    <div class="input-group input-group-sm">
                                        <input type="number" class="form-control" id="add-stock-${pastel.id_pastel}" 
                                               placeholder="Cant." min="1">
                                        <button class="btn btn-success" onclick="updateStock(${pastel.id_pastel}, null, true)">
                                            <i class="fas fa-save"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p class="card-text"><small class="text-muted">Categoría: ${pastel.categoria_nombre}</small></p>
                    </div>
                    <div class="card-footer bg-white border-0">
                        <div class="btn-group w-100">
                            <button onclick="editPastel(${pastel.id_pastel})" class="btn btn-primary btn-sm">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button onclick="deletePastel(${pastel.id_pastel})" class="btn btn-danger btn-sm">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                            <button onclick="abrirVenta(${pastel.id_pastel}, '${pastel.nombre}')" class="btn btn-warning btn-sm">
                                <i class="fas fa-handshake"></i> Vender
                            </button>
                        </div>
                    </div>
                </div>
            `;
            pastelesList.appendChild(col);
        });
    }

    // Configurar modo edición rápida
    const modoEdicionRapida = document.getElementById('modoEdicionRapida');
    const stockQuickAdds = document.querySelectorAll('.stock-quick-add');
    modoEdicionRapida.addEventListener('change', (e) => {
        stockQuickAdds.forEach(div => {
            div.style.display = e.target.checked ? 'block' : 'none';
        });
    });
}

// Función para configurar el buscador
function setupSearch() {
    const searchInput = document.getElementById('searchProducts');
    const clearButton = document.getElementById('clearSearch');
    
    // Función de búsqueda optimizada
    function performSearch(query) {
        query = query.toLowerCase().trim();
        clearButton.style.display = query ? 'block' : 'none';

        if (!query) {
            renderProducts(allProducts);
            return;
        }

        // Búsqueda optimizada usando indices
        const filteredProducts = allProducts.filter(product => {
            const nombreMatch = product.nombre.toLowerCase().includes(query);
            const descripcionMatch = product.descripcion && 
                                   product.descripcion.toLowerCase().includes(query);
            const categoriaMatch = product.categoria_nombre.toLowerCase().includes(query);
            const precioMatch = product.precio.toString().includes(query);
            
            return nombreMatch || descripcionMatch || categoriaMatch || precioMatch;
        });

        renderProducts(filteredProducts);

        if (filteredProducts.length === 0) {
            const pastelesList = document.getElementById('pastelesList');
            pastelesList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No se encontraron productos que coincidan con "${query}"</h4>
                </div>
            `;
        }
    }

    // Debounce mejorado
    let debounceTimeout;
    searchInput.addEventListener('input', (e) => {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }
        
        debounceTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 150); // Reducido a 150ms para mejor respuesta
    });

    // Búsqueda inmediata al presionar Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(debounceTimeout);
            performSearch(e.target.value);
        }
    });
}

function clearSearch() {
    const searchInput = document.getElementById('searchProducts');
    const clearButton = document.getElementById('clearSearch');
    
    searchInput.value = '';
    clearButton.style.display = 'none';
    renderProducts(allProducts);
    searchInput.focus(); // Mantener el foco en el input
}

// Agregar después de la función setupSearch
function toggleSearch() {
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchProducts');
    
    if (searchContainer.style.display === 'none') {
        searchContainer.style.display = 'block';
        searchInput.focus();
        
        // Agregar clase para la animación
        searchContainer.classList.add('fade-in');
    } else {
        searchContainer.style.display = 'none';
        clearSearch();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    
    // Agregar evento para el botón de búsqueda
    document.getElementById('toggleSearch').addEventListener('click', toggleSearch);
    
    // Opcional: Cerrar búsqueda con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const searchContainer = document.getElementById('searchContainer');
            if (searchContainer.style.display !== 'none') {
                toggleSearch();
            }
        }
    });
});

async function updateStock(id, cantidad, customAmount = false) {
    try {
        // Obtener datos actuales del producto
        const response = await fetch(`api/pasteles.php?id=${id}`);
        const productos = await response.json();
        const producto = productos[0];
        
        let stockActual = parseInt(document.getElementById(`stock-${id}`).textContent);
        let nuevaCantidad;

        if (customAmount) {
            const inputCantidad = document.getElementById(`add-stock-${id}`).value;
            if (!inputCantidad) return;
            nuevaCantidad = stockActual + parseInt(inputCantidad);
        } else {
            nuevaCantidad = stockActual + cantidad;
        }

        if (nuevaCantidad < 0) {
            showNotification('Error', 'El stock no puede ser negativo', 'error');
            return;
        }

        // Enviar todos los campos requeridos
        const data = {
            id_pastel: id,
            id_categoria: producto.id_categoria,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            stock: nuevaCantidad,
            imagen: producto.imagen
        };

        const updateResponse = await fetch('api/pasteles.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await updateResponse.json();
        if (result.status === 'success') {
            document.getElementById(`stock-${id}`).textContent = nuevaCantidad;
            if (customAmount) {
                document.getElementById(`add-stock-${id}`).value = '';
            }
            showNotification('¡Éxito!', 'Stock actualizado', 'success');
        } else {
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'No se pudo actualizar el stock', 'error');
    }
}

async function venderProducto(id, cantidad) {
    try {
        // Registrar la venta en la base de datos
        const ventaResponse = await fetch('api/ventas.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_pastel: id,
                cantidad: cantidad
            })
        });

        const ventaResult = await ventaResponse.json();
        
        if (ventaResult.status === 'success') {
            // Actualizar el stock
            await updateStock(id, -cantidad);
            
            // Registrar en localStorage para el ranking temporal
            const ventas = JSON.parse(localStorage.getItem('productosVendidos') || '[]');
            // Agregar una entrada por cada unidad vendida
            for (let i = 0; i < cantidad; i++) {
                ventas.push({ id: id, fecha: new Date().toISOString() });
            }
            localStorage.setItem('productosVendidos', JSON.stringify(ventas));

            // Actualizar la interfaz si estamos en el dashboard
            if (window.location.pathname.endsWith('index.html')) {
                if (typeof updateRankingVentas === 'function') {
                    updateRankingVentas();
                }
                if (typeof actualizarHistorialVentas === 'function') {
                    actualizarHistorialVentas();
                }
            }
            
            showNotification('¡Éxito!', `Venta de ${cantidad} unidad(es) registrada correctamente`, 'success');
        } else {
            throw new Error(ventaResult.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'No se pudo registrar la venta', 'error');
    }
}


async function abrirVenta(id, nombre) {
    // Obtener stock actual antes de mostrar el diálogo
    const stockActual = parseInt(document.getElementById(`stock-${id}`).textContent);
    
    const { value: cantidad } = await Swal.fire({
        title: `Vender ${nombre}`,
        input: 'number',
        inputLabel: `Cantidad (Stock disponible: ${stockActual})`,
        inputValue: 1,
        inputAttributes: {
            min: 1,
            max: stockActual, // Limitar al stock disponible
            step: 1
        },
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Vender',
        confirmButtonColor: '#ffc107',
        inputValidator: (value) => {
            const cantidad = parseInt(value);
            if (!value || cantidad < 1) {
                return 'La cantidad debe ser al menos 1';
            }
            if (cantidad > stockActual) {
                return `Solo hay ${stockActual} unidades disponibles`;
            }
        }
    });

    if (cantidad) {
        venderProducto(id, parseInt(cantidad));
    }
}
