/**
 * Funcionalidades específicas para la página de servicios
 */

document.addEventListener('DOMContentLoaded', function() {
    // Animación al hacer scroll
    animateOnScroll();
    
    // Inicializar los filtros de servicios
    initServiceFilters();
    
    // Smooth scrolling para los enlaces internos
    initSmoothScroll();
    
    // Inicializar efectos hover en tarjetas de servicios
    initServiceCardEffects();
});

/**
 * Función para animar elementos al hacer scroll
 */
function animateOnScroll() {
    const animatedElements = document.querySelectorAll('.service-card, .process-step, .tech-icon');
    
    // Si el navegador no soporta IntersectionObserver, mostrar todos los elementos
    if (!('IntersectionObserver' in window)) {
        animatedElements.forEach(element => {
            element.classList.add('animate');
        });
        return;
    }
    
    // Opciones para el IntersectionObserver
    const options = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.15 // 15% del elemento visible
    };
    
    // Callback para el IntersectionObserver
    const callback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target); // Dejar de observar una vez animado
            }
        });
    };
    
    // Crear el IntersectionObserver
    const observer = new IntersectionObserver(callback, options);
    
    // Observar cada elemento
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Inicializar los filtros para los servicios
 */
function initServiceFilters() {
    const filterButtons = document.querySelectorAll('.service-filter');
    if (!filterButtons.length) return; // Si no hay botones de filtro, salir
    
    // Obtener todas las tarjetas de servicios
    const serviceCards = document.querySelectorAll('.service-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase activa de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase activa al botón clicado
            this.classList.add('active');
            
            // Obtener la categoría a filtrar
            const filterCategory = this.getAttribute('data-filter');
            
            // Filtrar servicios
            serviceCards.forEach(card => {
                if (filterCategory === 'all') {
                    // Mostrar todas las tarjetas con una animación suave
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        card.style.display = 'flex';
                        
                        // Retrasar ligeramente la animación para que se note el efecto
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    }, 300);
                } else {
                    const cardCategory = card.getAttribute('data-category');
                    
                    if (cardCategory === filterCategory) {
                        // Mostrar las tarjetas que coinciden con el filtro
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            card.style.display = 'flex';
                            
                            // Retrasar ligeramente la animación para que se note el efecto
                            setTimeout(() => {
                                card.style.opacity = '1';
                                card.style.transform = 'translateY(0)';
                            }, 50);
                        }, 300);
                    } else {
                        // Ocultar las tarjetas que no coinciden
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                }
            });
            
            // Scroll a la sección de servicios después de filtrar
            const servicesSection = document.querySelector('.services-main');
            if (servicesSection) {
                const headerOffset = 120;
                const elementPosition = servicesSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Aplicar filtro inicial 'all' si existe
    const allFilter = document.querySelector('.service-filter[data-filter="all"]');
    if (allFilter) {
        allFilter.classList.add('active');
    }
    
    // Aplicar transiciones iniciales a todas las tarjetas
    serviceCards.forEach(card => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease, display 0.3s ease';
    });
}

/**
 * Inicializar el smooth scrolling para enlaces internos
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // Si el enlace es solo "#", no hacer nada
            
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return; // Si el elemento no existe, no hacer nada
            
            // Calcular la posición y hacer el scroll
            const headerOffset = 120; // Offset para compensar headers fijos
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Si hay filtros de servicio, activar el filtro correspondiente
            if (targetId === '#marketing' || targetId === '#web' || targetId === '#analytics' || targetId === '#design') {
                const category = targetId.replace('#', '');
                const filterButton = document.querySelector(`.service-filter[data-filter="${category}"]`);
                
                if (filterButton) {
                    filterButton.click();
                }
            }
        });
    });
}

/**
 * Inicializar efectos hover en tarjetas de servicios
 */
function initServiceCardEffects() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        // Efecto de elevación y sombra en hover
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        });
        
        // Efecto zoom en la imagen al hacer hover
        const serviceImage = card.querySelector('.service-image img');
        if (serviceImage) {
            card.addEventListener('mouseenter', function() {
                serviceImage.style.transform = 'scale(1.1)';
            });
            
            card.addEventListener('mouseleave', function() {
                serviceImage.style.transform = 'scale(1)';
            });
        }
    });
}

/**
 * Función para mostrar un modal con más detalles de servicio
 * @param {string} serviceId - ID del servicio a mostrar
 */
function showServiceDetails(serviceId) {
    // Implementación actual simulada
    console.log(`Mostrando detalles del servicio: ${serviceId}`);
    
    // Aquí iría el código para mostrar un modal o redireccionar a una página de detalle
    // Por ejemplo:
    // const modal = document.getElementById('serviceModal');
    // const serviceContent = document.getElementById(`service-${serviceId}`).innerHTML;
    // document.getElementById('modalContent').innerHTML = serviceContent;
    // modal.style.display = 'block';
}

/**
 * Función para ajustar la barra de filtros al hacer scroll
 * Esta función hace que la barra de filtros se quede fija en la parte superior al hacer scroll
 */
window.addEventListener('scroll', function() {
    const filterSection = document.querySelector('.service-filters');
    const header = document.querySelector('header');
    
    if (filterSection && header) {
        const headerBottom = header.getBoundingClientRect().bottom;
        
        if (headerBottom <= 0) {
            filterSection.classList.add('fixed');
        } else {
            filterSection.classList.remove('fixed');
        }
    }
});