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
            
            // Deshabilitar el botón de envío y mostrar estado de carga
            const submitBtn = this.querySelector('.submit-btn');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            
            // Recopilar datos del formulario
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const phone = formData.get('phone');
            const company = formData.get('company') || 'No especificada';
            const needs = formData.get('needs');
            const appointmentDate = formData.get('appointmentDate');
            const appointmentTime = formData.get('appointmentTime');
            
            // Validar que se hayan seleccionado fecha y hora
            if (!appointmentDate || !appointmentTime) {
                showErrorMessage('Por favor selecciona una fecha y hora para la consulta');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                return;
            }
            
            // Formatear la fecha para mejor presentación
            const dateObj = new Date(appointmentDate);
            const formattedDate = dateObj.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Crear el asunto del correo
            const subject = `Nueva Consulta Gratuita Agendada - ${name}`;
            
            // Crear el mensaje detallado
            const message = `
NUEVA SOLICITUD DE CONSULTA GRATUITA

=== INFORMACIÓN DEL CLIENTE ===
Nombre: ${name}
Email: ${email}
Teléfono: ${phone}
Empresa: ${company}

=== FECHA Y HORA SOLICITADA ===
Fecha: ${formattedDate}
Hora: ${appointmentTime}

=== NECESIDADES DEL CLIENTE ===
${needs}

=== INFORMACIÓN ADICIONAL ===
Tipo de consulta: Plan Personalizado
Estado: Pendiente de confirmación
Fecha de solicitud: ${new Date().toLocaleString('es-ES')}

Por favor, confirmar disponibilidad y contactar al cliente para confirmar la cita.
            `;
            
            // Preparar parámetros para EmailJS
            const templateParams = {
                from_name: name,
                from_email: email,
                phone_number: phone,
                company_name: company,
                subject: subject,
                message: message,
                reply_to: email,
                to_name: "Crazy Studios",
                // Campos específicos para la plantilla
                appointment_date: formattedDate,
                appointment_time: appointmentTime,
                client_needs: needs,
                detailed_message: message
            };
            
            // Enviar el correo usando EmailJS (usando los mismos IDs que el formulario de contacto)
            emailjs.send('service_8dq6atk', 'template_7m02u1c', templateParams)
                .then(function(response) {
                    console.log('ÉXITO!', response.status, response.text);
                    
                    // Mostrar mensaje de éxito
                    showSuccessMessage('¡Solicitud de consulta enviada con éxito! Te contactaremos pronto para confirmar la fecha y hora.');
                    
                    // Limpiar formulario
                    appointmentForm.reset();
                    
                    // Limpiar selecciones del calendario
                    clearCalendarSelections();
                    
                    // Cerrar modal después de un breve delay
                    setTimeout(() => {
                        closeModal();
                    }, 2000);
                    
                }, function(error) {
                    console.log('FALLÓ...', error);
                    showErrorMessage('Error al enviar la solicitud. Por favor, intenta nuevamente o contáctanos directamente por teléfono.');
                })
                .finally(function() {
                    // Restaurar el botón
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                });
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
 * Muestra un mensaje de éxito
 */
function showSuccessMessage(message) {
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            z-index: 10000;
            max-width: 400px;
            font-weight: 500;
        ">
            <i class="fas fa-check-circle" style="margin-right: 10px;"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remover mensaje después de 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

/**
 * Muestra un mensaje de error
 */
function showErrorMessage(message) {
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc3545, #e83e8c);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
            z-index: 10000;
            max-width: 400px;
            font-weight: 500;
        ">
            <i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remover mensaje después de 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

/**
 * Limpia las selecciones del calendario
 */
function clearCalendarSelections() {
    // Remover clase activa de días seleccionados
    document.querySelectorAll('.calendar-day.active').forEach(day => {
        day.classList.remove('active');
    });
    
    // Remover clase activa de horarios seleccionados
    document.querySelectorAll('.time-slot.active').forEach(slot => {
        slot.classList.remove('active');
    });
    
    // Limpiar campos ocultos
    const appointmentDate = document.getElementById('appointmentDate');
    const appointmentTime = document.getElementById('appointmentTime');
    
    if (appointmentDate) appointmentDate.value = '';
    if (appointmentTime) appointmentTime.value = '';
    
    // Limpiar contenedor de horarios
    const timeSlotsContainer = document.getElementById('timeSlots');
    if (timeSlotsContainer) {
        timeSlotsContainer.innerHTML = '';
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
        
        // Horarios disponibles para consultas (9 AM a 5 PM, excluyendo almuerzo 12-1 PM)
        const availableSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
        
        // Crear elementos para cada horario
        availableSlots.forEach(slot => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = slot;
            
            // Simular algunos slots ocupados aleatoriamente
            if (Math.random() < 0.2) {
                timeSlot.classList.add('disabled');
                timeSlot.title = 'Horario no disponible';
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