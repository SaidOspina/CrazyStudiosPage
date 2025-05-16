/**
 * Funcionalidades para la página de planes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Animación de elementos al hacer scroll
    initScrollAnimations();
    
    // Inicializar los tabs de planes
    initPlanTabs();
    
    // Inicializar el acordeón de FAQ
    initFaqAccordion();
    
    // Inicializar el modal de reserva de cita
    initAppointmentModal();
    
    // Inicializar el calendario
    initCalendar();
});

/**
 * Inicializa las animaciones al hacer scroll
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-fade-up');
    
    // Si el navegador no soporta IntersectionObserver, mostrar todos los elementos
    if (!('IntersectionObserver' in window)) {
        animatedElements.forEach(element => {
            element.classList.add('active');
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
                entry.target.classList.add('active');
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
 * Inicializa los tabs de planes (mensual/anual)
 */
function initPlanTabs() {
    const planTabs = document.querySelectorAll('.plan-tab');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const yearlyPrices = document.querySelectorAll('.yearly-price');
    
    if (!planTabs.length) return;
    
    planTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover clase activa de todos los tabs
            planTabs.forEach(t => t.classList.remove('active'));
            
            // Agregar clase activa al tab clicado
            this.classList.add('active');
            
            // Mostrar precios correspondientes
            if (this.getAttribute('data-plan') === 'monthly') {
                monthlyPrices.forEach(price => price.style.display = 'block');
                yearlyPrices.forEach(price => price.style.display = 'none');
            } else {
                monthlyPrices.forEach(price => price.style.display = 'none');
                yearlyPrices.forEach(price => price.style.display = 'block');
            }
        });
    });
}

/**
 * Inicializa el acordeón de preguntas frecuentes
 */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (!faqItems.length) return;
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Toggle la clase activa en el item
            item.classList.toggle('active');
        });
    });
}
/**
 * Inicializa el modal de reserva de cita
 */
function initAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    if (!modal) return;
    
    const openModalBtns = document.querySelectorAll('.open-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const appointmentForm = document.getElementById('appointmentForm');
    
    // Abrir modal
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'block';
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
            
            // Bloquear scroll del body
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Cerrar modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Procesar formulario
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Aquí iría la lógica para procesar el formulario
            // Por ejemplo, enviar datos al servidor
            
            // Mostrar mensaje de éxito
            alert('¡Cita agendada con éxito! Te enviaremos un correo con la confirmación.');
            
            // Cerrar modal
            closeModal();
        });
    }
    
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Restaurar scroll del body
        document.body.style.overflow = '';
    }
}
/**
 * Inicializa el calendario para agendar citas
 */
function initCalendar() {
    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) return;
    
    // Configuración del calendario
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Renderizar calendario inicial
    renderCalendar(currentMonth, currentYear);
    
    // Event listeners para navegación
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(currentMonth, currentYear);
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(currentMonth, currentYear);
        });
    }
    
    /**
     * Renderiza el calendario para un mes y año específicos
     */
    function renderCalendar(month, year) {
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        // Actualizar el texto del mes y año
        const currentMonthElement = document.getElementById('currentMonth');
        if (currentMonthElement) {
            currentMonthElement.textContent = `${monthNames[month]} ${year}`;
        }
        
        // Obtener el primer día del mes
        const firstDay = new Date(year, month, 1).getDay();
        
        // Obtener el número de días en el mes
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Limpiar el calendario
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        
        // Agregar los días de la semana
        weekdays.forEach(day => {
            const weekdayElement = document.createElement('div');
            weekdayElement.className = 'weekday';
            weekdayElement.textContent = day;
            calendarGrid.appendChild(weekdayElement);
        });
        
        // Agregar días en blanco para completar la primera semana
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Agregar los días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const dateToCheck = new Date(year, month, day);
            const today = new Date();
            
            // Deshabilitar días anteriores a hoy
            if (dateToCheck < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                dayElement.classList.add('disabled');
            } 
            // Deshabilitar fines de semana (opcional)
            else if (dateToCheck.getDay() === 0 || dateToCheck.getDay() === 6) {
                dayElement.classList.add('disabled');
            } 
            else {
                // Agregar evento a los días disponibles
                dayElement.addEventListener('click', function() {
                    // Remover clase activa de todos los días
                    document.querySelectorAll('.calendar-day').forEach(day => {
                        day.classList.remove('active');
                    });
                    
                    // Agregar clase activa a este día
                    this.classList.add('active');
                    
                    // Actualizar fecha seleccionada en el formulario
                    const selectedDateInput = document.getElementById('appointmentDate');
                    if (selectedDateInput) {
                        selectedDateInput.value = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    }
                    
                    // Renderizar horarios disponibles
                    renderTimeSlots(year, month, day);
                });
            }
            
            calendarGrid.appendChild(dayElement);
        }
    }
    
    /**
     * Renderiza los horarios disponibles para una fecha específica
     */
    function renderTimeSlots(year, month, day) {
        const timeSlotsContainer = document.getElementById('timeSlots');
        if (!timeSlotsContainer) return;
        
        // Limpiar los horarios
        timeSlotsContainer.innerHTML = '';
        
        // Horarios disponibles (ejemplo) - En un caso real, esto vendría del servidor
        const availableSlots = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00'];
        
        // Crear elementos para cada horario
        availableSlots.forEach(slot => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = slot;
            
            // Aleatoriamente deshabilitar algunos slots para simular horarios ocupados
            if (Math.random() < 0.3) {
                timeSlot.classList.add('disabled');
            } else {
                timeSlot.addEventListener('click', function() {
                    // Remover clase activa de todos los slots
                    document.querySelectorAll('.time-slot').forEach(slot => {
                        slot.classList.remove('active');
                    });
                    
                    // Agregar clase activa a este slot
                    this.classList.add('active');
                    
                    // Actualizar hora seleccionada en el formulario
                    const selectedTimeInput = document.getElementById('appointmentTime');
                    if (selectedTimeInput) {
                        selectedTimeInput.value = slot;
                    }
                });
            }
            
            timeSlotsContainer.appendChild(timeSlot);
        });
    }
}