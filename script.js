// Funciones para manejar la visualización de secciones
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

// Modificar la función loadCategorias para el nuevo diseño
async function loadCategorias() {
    try {
        const response = await fetch('api/categorias.php');
        const categorias = await response.json();
        
        const categoriasList = document.getElementById('categoriasList');
        categoriasList.innerHTML = '';
        
        categorias.forEach(categoria => {
            const col = document.createElement('div');
            col.className = 'col-md-4';
            col.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${categoria.nombre}</h5>
                        <p class="card-text">${categoria.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div class="card-footer bg-white border-0">
                        <button onclick="editCategoria(${categoria.id_categoria})" class="btn btn-sm btn-primary">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="deleteCategoria(${categoria.id_categoria})" class="btn btn-sm btn-danger">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
            categoriasList.appendChild(col);
        });
    } catch (error) {
        showNotification('Error', 'No se pudieron cargar las categorías', 'error');
    }
}

// Cargar pasteles
// Modificar la función loadPasteles para el nuevo diseño
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

async function createCategoria(event) {
    event.preventDefault();
    
    const data = {
        nombre: document.getElementById('categoriaNombre').value,
        descripcion: document.getElementById('categoriaDescripcion').value
    };

    try {
        const response = await fetch('api/categorias.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message);
        loadCategorias();
        loadCategoriasSelect(); // Agregamos esta línea
        document.getElementById('categoriaForm').reset();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Modificar las funciones existentes para usar SweetAlert2
async function deleteCategoria(id) {
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#FF1493',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch('api/categorias.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_categoria: id })
            });

            const data = await response.json();
            showNotification('¡Éxito!', data.message);
            loadCategorias();
            loadCategoriasSelect();
            updateDashboard();
        } catch (error) {
            showNotification('Error', 'No se pudo eliminar la categoría', 'error');
        }
    }
}


async function editCategoria(id) {
    try {
        const response = await fetch(`api/categorias.php?id=${id}`);
        const categoria = await response.json();


        console.log(categoria);

        document.getElementById('categoriaNombre').value = categoria[0].nombre;
        document.getElementById('categoriaDescripcion').value = categoria[0].descripcion;
        
        // Cambiar el formulario para modo edición
        const form = document.getElementById('categoriaForm');
        form.onsubmit = (e) => updateCategoria(e, id);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function updateCategoria(event, id) {
    event.preventDefault();
    
    const data = {
        id_categoria: id,
        nombre: document.getElementById('categoriaNombre').value,
        descripcion: document.getElementById('categoriaDescripcion').value
    };

    try {
        const response = await fetch('api/categorias.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message);
        loadCategorias();
        document.getElementById('categoriaForm').reset();
        
        // Restaurar el formulario a modo creación
        const form = document.getElementById('categoriaForm');
        form.onsubmit = createCategoria;
    } catch (error) {
        console.error('Error:', error);
    }
}

// Funciones para manejar pasteles
// Modificar la función createPastel para usar el nuevo diseño y notificaciones
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
    try {
        const response = await fetch(`api/pasteles.php?id=${id}`);
        var pastel = await response.json();
        pastel = pastel[0];

        document.getElementById('pastelCategoria').value = pastel.id_categoria;
        document.getElementById('pastelNombre').value = pastel.nombre;
        document.getElementById('pastelDescripcion').value = pastel.descripcion;
        document.getElementById('pastelPrecio').value = pastel.precio;
        document.getElementById('pastelStock').value = pastel.stock;
        document.getElementById('pastelImagen').value = pastel.imagen;
        
        // Cambiar el formulario para modo edición
        const form = document.getElementById('pastelForm');
        form.onsubmit = (e) => updatePastel(e, id);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function updatePastel(event, id) {
    event.preventDefault();
    
    const data = {
        id_pastel: id,
        id_categoria: document.getElementById('pastelCategoria').value,
        nombre: document.getElementById('pastelNombre').value,
        descripcion: document.getElementById('pastelDescripcion').value,
        precio: document.getElementById('pastelPrecio').value,
        stock: document.getElementById('pastelStock').value,
        imagen: document.getElementById('pastelImagen').value
    };

    try {
        const response = await fetch('api/pasteles.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message);
        loadPasteles();
        document.getElementById('pastelForm').reset();
        
        // Restaurar el formulario a modo creación
        const form = document.getElementById('pastelForm');
        form.onsubmit = createPastel;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deletePastel(id) {
    const confirmacion = await Swal.fire({
        title: '¿Está seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
        try {
            const response = await fetch(`api/borrar_producto.php?id=${id}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("La respuesta del servidor no es JSON válido");
            }

            const result = await response.json();
            
            if (result && result.status === 'success') {
                await Swal.fire('¡Eliminado!', result.message || 'Producto eliminado con éxito', 'success');
                loadPasteles();
            } else {
                throw new Error(result.message || 'Error al eliminar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            await Swal.fire('Error', 'No se pudo eliminar el producto: ' + error.message, 'error');
        }
    }
}

// Función para cargar categorías en el select
async function loadCategoriasSelect() {
    try {
        const response = await fetch('api/categorias.php');
        const categorias = await response.json();
        
        const selectCategoria = document.getElementById('pastelCategoria');
        selectCategoria.innerHTML = '<option value="">Seleccione una categoría</option>';
        
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id_categoria;
            option.textContent = categoria.nombre;
            selectCategoria.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

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

        document.getElementById('totalPasteles').textContent = pasteles.length;
        document.getElementById('totalCategorias').textContent = categorias.length;

        const valorTotal = pasteles.reduce((acc, pastel) => {
            return acc + (pastel.precio * pastel.stock);
        }, 0);
        document.getElementById('valorInventario').textContent = `$${valorTotal.toFixed(2)}`;
    } catch (error) {
        console.error('Error:', error);
    }
}


// Función para mostrar/ocultar secciones con animación
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    const selectedSection = document.getElementById(sectionId);
    selectedSection.style.display = 'block';
    selectedSection.classList.add('fade-in');
    
    // Actualizar el dashboard si es la sección seleccionada
    if(sectionId === 'dashboard') {
        updateDashboard();
    }
}

// Función para validar formularios
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    return true;
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

// Cargar datos iniciales
// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar dashboard por defecto
    showSection('dashboard');
    
    // Cargar datos iniciales
    loadCategorias();
    loadPasteles();
    loadCategoriasSelect();
    updateDashboard();
    
    // Configurar los formularios con validación
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', event => {
            if (!validateForm(form.id)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    });
    
    // Configurar los eventos de los formularios
    document.getElementById('categoriaForm').onsubmit = createCategoria;
    document.getElementById('pastelForm').onsubmit = createPastel;
    
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

