/**
 * Funcionalidades para las páginas de login y recuperación de contraseña
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar validación de formularios
    initFormValidation();
    
    // Toggle de visibilidad de contraseña
    initPasswordToggle();
    
    // Manejar envío de formularios
    initFormSubmission();
});

/**
 * Inicializa la validación de formularios
 */
function initFormValidation() {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            // Validar en tiempo real mientras el usuario escribe
            input.addEventListener('input', function() {
                validateInput(this);
            });
            
            // Validar cuando el input pierde el foco
            input.addEventListener('blur', function() {
                validateInput(this);
            });
        });
    });
}

/**
 * Valida un campo de entrada específico
 * @param {HTMLElement} input - El elemento input a validar
 * @returns {boolean} - Retorna true si el input es válido, false en caso contrario
 */
function validateInput(input) {
    const formGroup = input.closest('.form-group');
    let isValid = true;
    let errorMessage = '';
    
    // Eliminar mensaje de error existente
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Eliminar clase de error
    formGroup.classList.remove('error');
    
    // Validación según el tipo de input
    if (input.required && input.value.trim() === '') {
        isValid = false;
        errorMessage = 'Este campo es obligatorio';
    } else if (input.type === 'email' && input.value.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
            isValid = false;
            errorMessage = 'Por favor, introduce un email válido';
        }
    } else if (input.id === 'password' && input.value.trim() !== '') {
        if (input.value.length < 8) {
            isValid = false;
            errorMessage = 'La contraseña debe tener al menos 8 caracteres';
        }
    } else if (input.id === 'confirmPassword' && input.value.trim() !== '') {
        const password = document.getElementById('password');
        if (password && input.value !== password.value) {
            isValid = false;
            errorMessage = 'Las contraseñas no coinciden';
        }
    }
    
    // Mostrar error si el input no es válido
    if (!isValid) {
        formGroup.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = errorMessage;
        
        formGroup.appendChild(errorElement);
    }
    
    return isValid;
}

/**
 * Inicializa el toggle de visibilidad de contraseña
 */
function initPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
}

/**
 * Inicializa el manejo de envío de formularios
 */
function initFormSubmission() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    // Formulario de login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar todos los campos antes de enviar
            const inputs = this.querySelectorAll('input');
            let isFormValid = true;
            
            inputs.forEach(input => {
                if (!validateInput(input)) {
                    isFormValid = false;
                }
            });
            
            if (isFormValid) {
                // Aquí iría la lógica para enviar las credenciales al servidor
                // Por ejemplo, usando fetch API para el backend
                
                // Simulación de autenticación (eliminar en implementación real)
                simulateAuthentication(this);
            }
        });
    }
    
    // Formulario de registro
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar todos los campos antes de enviar
            const inputs = this.querySelectorAll('input');
            let isFormValid = true;
            
            inputs.forEach(input => {
                if (!validateInput(input)) {
                    isFormValid = false;
                }
            });
            
            if (isFormValid) {
                // Aquí iría la lógica para enviar los datos de registro al servidor
                
                // Simulación de registro (eliminar en implementación real)
                simulateRegistration(this);
            }
        });
    }
    
    // Formulario de restablecimiento de contraseña
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar todos los campos antes de enviar
            const inputs = this.querySelectorAll('input');
            let isFormValid = true;
            
            inputs.forEach(input => {
                if (!validateInput(input)) {
                    isFormValid = false;
                }
            });
            
            if (isFormValid) {
                // Aquí iría la lógica para enviar la solicitud de recuperación
                
                // Simulación de recuperación (eliminar en implementación real)
                simulatePasswordReset(this);
            }
        });
    }
}

/**
 * Conecta con la API para autenticar al usuario
 * @param {HTMLFormElement} form - El formulario de login
 */
function simulateAuthentication(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Cambiar el texto del botón para indicar carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    
    // Recopilar los datos del formulario
    const formData = {
        email: form.querySelector('#email').value,
        password: form.querySelector('#password').value
    };
    
    console.log('Intentando iniciar sesión con:', formData.email);
    
    // Enviar datos a la API
    fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Error en la autenticación');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Inicio de sesión exitoso:', data);
        
        // Guardar el token en localStorage para usarlo en futuras peticiones
        localStorage.setItem('authToken', data.token);
        
        // Guardar datos del usuario sin la contraseña
        if (data.data) {
            localStorage.setItem('userData', JSON.stringify(data.data));
        }
        
        // Redirigir según el rol del usuario
        if (data.data && data.data.rol === 'admin') {
            window.location.href = 'html/dashboardAdministrador.html';
        } else {
            window.location.href = 'html/dashboard.html';
        }
    })
    .catch(error => {
        console.error('Error en la autenticación:', error);
        
        // Mostrar mensaje de error
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message auth-error';
        errorMessage.textContent = error.message || 'Correo electrónico o contraseña incorrectos';
        
        // Eliminar mensajes de error anteriores
        const previousErrors = form.querySelectorAll('.auth-error');
        previousErrors.forEach(el => el.remove());
        
        const formGroup = form.querySelector('.form-group:last-of-type');
        formGroup.insertAdjacentElement('afterend', errorMessage);
        
        // Restaurar el botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        // Eliminar mensaje de error después de 5 segundos
        setTimeout(() => {
            const errorElements = document.querySelectorAll('.auth-error');
            errorElements.forEach(el => el.remove());
        }, 5000);
    });
}

function simulateRegistration(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Cambiar el texto del botón para indicar carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    
    // Recopilar los datos del formulario
    const formData = {
        name: form.querySelector('#name').value,
        lastname: form.querySelector('#lastname').value,
        email: form.querySelector('#email').value,
        phone: form.querySelector('#phone').value,
        company: form.querySelector('#company').value || '',
        document_type: form.querySelector('#document_type').value,
        document_number: form.querySelector('#document_number').value,
        password: form.querySelector('#password').value,
        confirmPassword: form.querySelector('#confirmPassword').value,
        terms: form.querySelector('#terms').checked
    };
    
    console.log('Datos del formulario que se están enviando:', formData);
    
    // Enviar datos a la API
    fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        console.log('Estado de la respuesta:', response.status);
        return response.json().then(data => {
            console.log('Respuesta completa del servidor:', data);
            if (!response.ok) {
                throw new Error(data.message || 'Error en el registro');
            }
            return data;
        });
    })
    .then(data => {
        console.log('Registro exitoso:', data);
        // Mostrar mensaje de éxito y redirigir
        alert('¡Registro exitoso! Por favor, inicia sesión con tus nuevas credenciales.');
        window.location.href = 'login.html';
    })
    .catch(error => {
        console.error('Error en el registro:', error);
        // Mostrar mensaje de error
        alert('Error en el registro: ' + error.message);
        // Restaurar el botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

/**
 * Conecta con la API para solicitar el restablecimiento de contraseña
 * @param {HTMLFormElement} form - El formulario de recuperación
 */
function simulatePasswordReset(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Cambiar el texto del botón para indicar carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    
    // Recopilar los datos del formulario
    const formData = {
        email: form.querySelector('#email').value
    };
    
    console.log('Solicitando restablecimiento para:', formData.email);
    
    // Enviar datos a la API
    fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Error al solicitar restablecimiento');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Solicitud de restablecimiento exitosa');
        
        // Ocultar el formulario
        form.style.display = 'none';
        
        // Mostrar mensaje de éxito
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>Correo enviado</h3>
            <p>Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada.</p>
        `;
        
        form.parentNode.insertBefore(successMessage, form);
        
        // Agregar botón para volver al login
        const backButton = document.createElement('a');
        backButton.href = 'login.html';
        backButton.className = 'auth-btn';
        backButton.textContent = 'Volver al Inicio de Sesión';
        
        form.parentNode.insertBefore(backButton, form.nextSibling);
    })
    .catch(error => {
        console.error('Error en la solicitud de restablecimiento:', error);
        // Mostrar mensaje de error
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message auth-error';
        errorMessage.textContent = error.message || 'No se pudo procesar la solicitud';
        
        const formGroup = form.querySelector('.form-group:last-of-type');
        formGroup.insertAdjacentElement('afterend', errorMessage);
        
        // Restaurar el botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        // Eliminar mensaje de error después de 5 segundos
        setTimeout(() => {
            const errorElements = document.querySelectorAll('.auth-error');
            errorElements.forEach(el => el.remove());
        }, 5000);
    });
}