async function loadHeader() {
    try {
        const response = await fetch('components/header.html');
        const html = await response.text();
        document.getElementById('header').innerHTML = html;
        
        // Activar el enlace actual basado en la URL
        const currentPage = window.location.pathname.split("/").pop();
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    } catch (error) {
        console.error('Error cargando el heqader:', error);
    }
}
