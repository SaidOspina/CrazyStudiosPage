/**
 * JavaScript para index.html
 * Incluye funcionalidades para el carrusel de proyectos y animaciones
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el carrusel de proyectos
    initProjectsCarousel();
    
    // Inicializar animaciones
    initAnimations();
});

/**
 * Inicializa el carrusel de proyectos
 */
function initProjectsCarousel() {
    const carousel = document.querySelector('.projects-carousel');
    const carouselItems = document.querySelectorAll('.project-card');
    const dotsContainer = document.querySelector('.carousel-dots');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    
    if (!carousel || !carouselItems.length) return;
    
    // Variables del carrusel
    let currentIndex = 0;
    let itemsPerView = getItemsPerView();
    let totalItems = carouselItems.length;
    let totalSlides = Math.ceil(totalItems / itemsPerView);
    
    // Crear indicadores (dots)
    createDots();
    updateDots();
    updateCarousel();
    
    // Event listeners para los botones de navegación
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateCarousel();
            updateDots();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
            updateDots();
        });
    }
    
    // Event listener para cambio de tamaño de ventana
    window.addEventListener('resize', function() {
        const newItemsPerView = getItemsPerView();
        
        if (newItemsPerView !== itemsPerView) {
            itemsPerView = newItemsPerView;
            totalSlides = Math.ceil(totalItems / itemsPerView);
            
            // Recrear los dots al cambiar el número de items por vista
            createDots();
            
            // Asegurarse de que el índice actual sea válido
            currentIndex = Math.min(currentIndex, totalSlides - 1);
            
            updateCarousel();
            updateDots();
        }
    });
    
    /**
     * Actualiza la posición del carrusel
     */
    function updateCarousel() {
        const itemWidth = carouselItems[0].offsetWidth + parseInt(window.getComputedStyle(carouselItems[0]).marginLeft) * 2;
        const offset = -currentIndex * itemWidth * itemsPerView;
        carousel.style.transform = `translateX(${offset}px)`;
    }
    
    /**
     * Actualiza el estado de los indicadores (dots)
     */
    function updateDots() {
        const dots = document.querySelectorAll('.carousel-dot');
        
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    /**
     * Crea los indicadores (dots) del carrusel
     */
    function createDots() {
        if (!dotsContainer) return;
        
        // Limpiar dots existentes
        dotsContainer.innerHTML = '';
        
        // Crear nuevos dots
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            
            dot.addEventListener('click', function() {
                currentIndex = i;
                updateCarousel();
                updateDots();
            });
            
            dotsContainer.appendChild(dot);
        }
    }
    
    /**
     * Determina cuántos items se muestran por vista según el ancho de la ventana
     */
    function getItemsPerView() {
        const windowWidth = window.innerWidth;
        
        if (windowWidth < 768) {
            return 1;
        } else if (windowWidth < 1200) {
            return 2;
        } else {
            return 3;
        }
    }
    
    // Autoplay del carrusel (opcional)
    let autoplayInterval;
    
    function startAutoplay() {
        autoplayInterval = setInterval(function() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
            updateDots();
        }, 5000); // Cambiar cada 5 segundos
    }
    
    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }
    
    // Iniciar autoplay
    startAutoplay();
    
    // Detener autoplay al pasar el ratón por encima
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    
    // También detener el autoplay al interactuar con los controles
    if (prevBtn) prevBtn.addEventListener('mouseenter', stopAutoplay);
    if (nextBtn) nextBtn.addEventListener('mouseenter', stopAutoplay);
    if (dotsContainer) dotsContainer.addEventListener('mouseenter', stopAutoplay);
}

/**
 * Inicializa las animaciones de los elementos
 */
function initAnimations() {
    // Animación de los elementos en la sección hero
    const heroElements = document.querySelectorAll('.animate');
    
    // Añadir clase para iniciar la animación
    setTimeout(() => {
        heroElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, 100);
    
    // Animación al hacer scroll
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    // Si el navegador no soporta IntersectionObserver, mostrar todos los elementos
    if (!('IntersectionObserver' in window)) {
        animatedElements.forEach(element => {
            element.classList.add('in-view');
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
                entry.target.classList.add('in-view');
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