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
        if (!form) return; // Verificar que el formulario existe
        
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
    if (!input){
        console.error('Input no encontrado');// Verificar que el input existe
        return false;
    }// Verificar que el input existe
    
    const formGroup = input.closest('.form-group');
    if (!formGroup) {
        console.error('Input no encontrado');
        return false; // Verificar que el grupo de formulario existe
    }
    
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
        if (input.value.length < 6) {
            isValid = false;
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
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
        if (!button) return; // Verificar que el botón existe
        
        button.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            if (!passwordInput) return; // Verificar que el input existe
            
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
            
            // Eliminar mensajes de error anteriores
            const previousErrors = document.querySelectorAll('.auth-error');
            previousErrors.forEach(el => el.remove());
            
            // Validar todos los campos antes de enviar
            const inputs = this.querySelectorAll('input');
            let isFormValid = true;
            inputs.forEach(input => {
                console.log("Este error"+validateInput(input)+"    "+input);
                if (!validateInput(input)) {
                    isFormValid = false;
                    
                }
            });
            
            if (isFormValid) {
                authenticateUser(this);
                console.log("Valido");
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
                    console.log(isFormValid);
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
function authenticateUser(form) {
    if (!form) return; // Verificar que el formulario existe
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return; // Verificar que el botón existe
    
    const originalText = submitBtn.textContent;
    
    // Cambiar el texto del botón para indicar carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    
    // Recopilar los datos del formulario
    const emailInput = form.querySelector('#email');
    const passwordInput = form.querySelector('#password');
    const rememberMeInput = form.querySelector('#remember');
    
    if (!emailInput || !passwordInput) {
        // Restaurar el botón si faltan campos
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        showErrorMessage(form, 'Faltan campos requeridos');
        return;
    }
    
    const formData = {
        email: emailInput.value,
        password: passwordInput.value,
        remember: rememberMeInput ? rememberMeInput.checked : false
    };
    
    console.log('Intentando iniciar sesión con:', formData.email);
    
    // Enviar datos a la API
    const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : '';

    fetch(`${API_BASE}/api/auth/login`, {
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
        if (data.data && (data.data.rol === 'admin' || data.data.rol === 'superadmin')) {
            window.location.href = 'html/dashboardAdministrador.html';
        } else {
            window.location.href = 'html/dashboard.html';
        }
    })
    .catch(error => {
        console.error('Error en la autenticación:', error);
        showErrorMessage(form, error.message || 'Correo electrónico o contraseña incorrectos');
        
        // Restaurar el botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

/**
 * Muestra un mensaje de error en el formulario
 * @param {HTMLFormElement} form - El formulario donde mostrar el error
 * @param {string} message - El mensaje de error a mostrar
 */
function showErrorMessage(form, message) {
    // Crear elemento de error
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message auth-error';
    errorMessage.textContent = message;
    
    // Insertar después del último grupo de formulario
    const formGroup = form.querySelector('.form-group:last-of-type');
    if (formGroup) {
        formGroup.insertAdjacentElement('afterend', errorMessage);
    } else {
        form.appendChild(errorMessage);
    }
    
    // Eliminar mensaje de error después de 5 segundos
    setTimeout(() => {
        const errorElements = document.querySelectorAll('.auth-error');
        errorElements.forEach(el => el.remove());
    }, 5000);
}

function simulateRegistration(form) {
    if (!form) return; // Verificar que el formulario existe
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return; // Verificar que el botón existe
    
    const originalText = submitBtn.textContent;
    
    // Cambiar el texto del botón
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    
    // Recopilar datos manualmente
    const nameInput = form.querySelector('#name');
    const lastnameInput = form.querySelector('#lastname');
    const emailInput = form.querySelector('#email');
    const passwordInput = form.querySelector('#password');
    const confirmPasswordInput = form.querySelector('#confirmPassword');
    const phoneInput = form.querySelector('#phone');
    const companyInput = form.querySelector('#company');
    const documentTypeInput = form.querySelector('#document_type');
    const documentNumberInput = form.querySelector('#document_number');
    const termsInput = form.querySelector('#terms');
    
    if (!nameInput || !lastnameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        // Restaurar el botón si faltan campos esenciales
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    const userData = {
        name: nameInput.value,
        lastname: lastnameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value,
        phone: phoneInput ? phoneInput.value : '',
        company: companyInput ? companyInput.value : '',
        document_type: documentTypeInput ? documentTypeInput.value : '',
        document_number: documentNumberInput ? documentNumberInput.value : '',
        terms: termsInput ? termsInput.checked : false
    };
    
    console.log('Datos a enviar:', userData);
    
    // Verificar manualmente campos obligatorios
    if (!userData.name || !userData.lastname || !userData.email || !userData.password) {
        alert('Por favor, complete todos los campos obligatorios');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    // Verificar que las contraseñas coincidan
    if (userData.password !== userData.confirmPassword) {
        alert('Las contraseñas no coinciden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    // Verificar términos y condiciones
    if (!userData.terms) {
        alert('Debe aceptar los términos y condiciones');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    // Enviar datos como JSON
    fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        console.log('Estado de respuesta:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Respuesta del servidor:', data);
        
        if (data.success) {
            alert('¡Registro exitoso! Por favor, inicia sesión con tus nuevas credenciales.');
            window.location.href = 'login.html';
        } else {
            throw new Error(data.message || 'Error en el registro');
        }
    })
    .catch(error => {
        console.error('Error en el registro:', error);
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
    if (!form) return; // Verificar que el formulario existe
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return; // Verificar que el botón existe
    
    const originalText = submitBtn.textContent;
    
    // Cambiar el texto del botón para indicar carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    
    // Recopilar los datos del formulario
    const emailInput = form.querySelector('#email');
    if (!emailInput) {
        // Restaurar el botón si falta el campo de email
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    const formData = {
        email: emailInput.value
    };
    
    console.log('Solicitando restablecimiento para:', formData.email);
    
    // Enviar datos a la API
    fetch(`${API_BASE}/api/auth/forgot-password`, {
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
        if (formGroup) {
            formGroup.insertAdjacentElement('afterend', errorMessage);
        } else {
            form.appendChild(errorMessage);
        }
        
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