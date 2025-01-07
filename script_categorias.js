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

async function createCategoria(event) {
    event.preventDefault();
    
    console.log(document.getElementById('categoriaNombre').value)
    console.log(document.getElementById('categoriaDescripcion').value)

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
        
        if(result.status === "success") {
            showNotification('¡Éxito!', result.message);
            loadCategorias();
            document.getElementById('categoriaForm').reset();
        } else {
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Ocurrió un error al crear la categoría.', 'error');
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
            
            // Verificar si la operación fue exitosa basándonos en el mensaje
            if (data.message && data.message.includes("exitosamente")) {
                showNotification('¡Éxito!', data.message, 'success');
                loadCategorias();
                // Actualizar otros elementos si es necesario
                if (typeof updateDashboard === 'function') {
                    updateDashboard();
                }
            } else {
                showNotification('Error', 'No se pudo eliminar la categoría', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error', 'Ocurrió un error al eliminar la categoría', 'error');
        }
    }
}

// Agregar variable global para controlar el estado del formulario
let isEditing = false;
let editingId = null;

async function editCategoria(id) {
    try {
        const response = await fetch(`api/categorias.php?id=${id}`);
        const categoria = await response.json();

        document.getElementById('categoriaNombre').value = categoria[0].nombre;
        document.getElementById('categoriaDescripcion').value = categoria[0].descripcion;
        
        // Marcar que estamos en modo edición
        isEditing = true;
        editingId = id;
        
        // Cambiar el texto del botón
        const submitButton = document.querySelector('#categoriaForm button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Actualizar Categoría';
    } catch (error) {
        console.error('Error:', error);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    console.log('Entra a la funcion handleFormSubmit')

    if (isEditing) {
        await updateCategoria(event, editingId);
    } else {
        await createCategoria(event);
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
        showNotification('¡Éxito!', result.message);
        resetForm();
        loadCategorias();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'No se pudo actualizar la categoría', 'error');
    }
}

function resetForm() {
    // Restablecer el formulario y el estado
    document.getElementById('categoriaForm').reset();
    isEditing = false;
    editingId = null;
    
    // Restablecer el texto del botón
    const submitButton = document.querySelector('#categoriaForm button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Categoría';
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
    if (confirm('¿Está seguro de eliminar este pastel?')) {
        try {
            const response = await fetch('api/pasteles.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_pastel: id })
            });

            const result = await response.json();
            alert(result.message);
            loadPasteles();
        } catch (error) {
            console.error('Error:', error);
        }
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
    
    // Cargar datos iniciales
    loadCategorias();
    // Cambiar el listener del formulario para usar la nueva función handleFormSubmit
    console.log('Entra a la funcion handleFormSubmit')
    document.getElementById('categoriaForm').addEventListener('submit', handleFormSubmit);
    

});