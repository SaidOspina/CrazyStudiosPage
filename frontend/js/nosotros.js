
// Script para el carrusel de testimonios
document.addEventListener('DOMContentLoaded', function() {
    const testimonials = [
        {
            content: '"Crazy Studios transformó completamente nuestra presencia digital. Su enfoque estratégico y su atención personalizada nos han ayudado a aumentar nuestras ventas en un 150% en apenas 6 meses. No podríamos estar más satisfechos."',
            author: 'María López',
            position: 'Gerente de Marketing, Empresa ABC',
            image: '/api/placeholder/60/60'
        },
        {
            content: '"El equipo de Crazy Studios ha sido fundamental en el crecimiento de nuestro negocio online. Su conocimiento técnico y su creatividad son excepcionales. Han superado todas nuestras expectativas."',
            author: 'Juan Rodríguez',
            position: 'CEO, Startup XYZ',
            image: '/api/placeholder/60/60'
        },
        {
            content: '"Elegir a Crazy Studios fue la mejor decisión para nuestro negocio. Su enfoque integral y su capacidad para entender nuestras necesidades específicas han hecho toda la diferencia. Recomendamos sus servicios sin reservas."',
            author: 'Carolina Martínez',
            position: 'Directora, Empresa 123',
            image: '/api/placeholder/60/60'
        }
    ];
    
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    const dots = document.querySelectorAll('.testimonial-dots .dot');
    let currentIndex = 0;
    
    // Establecer el primer testimonio activo
    updateTestimonial(currentIndex);
    
    // Agregar eventos a los puntos de navegación
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateTestimonial(currentIndex);
            updateDots();
        });
    });
    
    // Función para actualizar el testimonio mostrado
    function updateTestimonial(index) {
        const testimonial = testimonials[index];
        const testimonialCard = testimonialsSlider.querySelector('.testimonial-card');
        
        testimonialCard.querySelector('.testimonial-content p').textContent = testimonial.content;
        testimonialCard.querySelector('.author-info h4').textContent = testimonial.author;
        testimonialCard.querySelector('.author-info p').textContent = testimonial.position;
        testimonialCard.querySelector('.author-image img').src = testimonial.image;
    }
    
    // Función para actualizar los puntos de navegación
    function updateDots() {
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Cambio automático de testimonios cada 5 segundos
    setInterval(() => {
        currentIndex = (currentIndex + 1) % testimonials.length;
        updateTestimonial(currentIndex);
        updateDots();
    }, 5000);
});

// Script para las animaciones de desplazamiento
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Script para las animaciones en el desplazamiento
window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    
    // Animar elementos cuando aparecen en la ventana
    document.querySelectorAll('.value-card, .team-member, .achievement-card').forEach(item => {
        const itemPosition = item.getBoundingClientRect().top;
        const screenHeight = window.innerHeight;
        
        if (itemPosition < screenHeight * 0.8) {
            item.classList.add('animate');
        }
    });
});