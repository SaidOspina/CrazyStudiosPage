/**
 * Funcionalidades para la recuperación de contraseña con código de 6 dígitos
 */

let currentStep = 1;
let userEmail = '';
let resetToken = '';
let codeTimer = null;
let resendTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    initForgotPasswordFlow();
});

function initForgotPasswordFlow() {
    // Inicializar formularios
    initEmailForm();
    initCodeForm();
    initPasswordForm();
    initPasswordToggle();
}

/**
 * Inicializa el formulario de email
 */
function initEmailForm() {
    const emailForm = document.getElementById('emailForm');
    
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const email = emailInput.value.trim();
            
            if (!email) {
                showError('Por favor, ingresa tu correo electrónico');
                return;
            }
            
            if (!isValidEmail(email)) {
                showError('Por favor, ingresa un correo electrónico válido');
                return;
            }
            
            sendVerificationCode(email);
        });
    }
}

/**
 * Inicializa el formulario de código
 */
function initCodeForm() {
    const codeInputs = document.querySelectorAll('.code-input');
    const codeForm = document.getElementById('codeForm');
    const resendBtn = document.getElementById('resendBtn');
    
    // Manejo de inputs de código
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            const value = e.target.value;
            
            // Solo permitir números
            if (!/^\d$/.test(value) && value !== '') {
                e.target.value = '';
                return;
            }
            
            // Agregar clase filled si tiene valor
            if (value) {
                e.target.classList.add('filled');
                // Mover al siguiente input
                if (index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }
            
            // Auto-submit cuando se completen todos los dígitos
            const code = getCodeFromInputs();
            if (code.length === 6) {
                setTimeout(() => verifyCode(code), 100);
            }
        });
        
        input.addEventListener('keydown', function(e) {
            // Permitir backspace para moverse al anterior
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                codeInputs[index - 1].focus();
                codeInputs[index - 1].value = '';
                codeInputs[index - 1].classList.remove('filled');
            }
        });
        
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text');
            const digits = pastedData.replace(/\D/g, '').slice(0, 6);
            
            digits.split('').forEach((digit, i) => {
                if (i < codeInputs.length) {
                    codeInputs[i].value = digit;
                    codeInputs[i].classList.add('filled');
                }
            });
            
            if (digits.length === 6) {
                setTimeout(() => verifyCode(digits), 100);
            }
        });
    });
    
    // Envío manual del formulario
    if (codeForm) {
        codeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const code = getCodeFromInputs();
            if (code.length === 6) {
                verifyCode(code);
            } else {
                showError('Por favor, ingresa el código completo de 6 dígitos');
            }
        });
    }
    
    // Botón de reenvío
    if (resendBtn) {
        resendBtn.addEventListener('click', function() {
            if (!this.disabled) {
                sendVerificationCode(userEmail);
            }
        });
    }
}

/**
 * Inicializa el formulario de nueva contraseña
 */
function initPasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!newPassword || !confirmPassword) {
                showError('Por favor, completa todos los campos');
                return;
            }
            
            if (newPassword.length < 6) {
                showError('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showError('Las contraseñas no coinciden');
                return;
            }
            
            resetPassword(newPassword, confirmPassword);
        });
    }
}

/**
 * Inicializa los toggles de visibilidad de contraseña
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
 * Envía el código de verificación al email
 */
async function sendVerificationCode(email) {
    const submitBtn = document.querySelector('#emailForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            userEmail = email;
            showStep(2);
            displayEmail(email);
            startCodeTimer();
            startResendTimer();
            showSuccess('Código enviado correctamente a tu correo electrónico');
        } else {
            throw new Error(data.message || 'Error al enviar el código');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Verifica el código ingresado
 */
async function verifyCode(code) {
    const submitBtn = document.querySelector('#codeForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/auth/verify-reset-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: userEmail, 
                code: code 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resetToken = data.resetToken;
            clearTimers();
            showStep(3);
            showSuccess('Código verificado correctamente');
        } else {
            throw new Error(data.message || 'Código incorrecto');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        clearCodeInputs();
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Restablece la contraseña
 */
async function resetPassword(password, confirmPassword) {
    const submitBtn = document.querySelector('#passwordForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/auth/reset-password-with-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                resetToken: resetToken,
                password: password,
                confirmPassword: confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStep(4);
            showSuccess('Contraseña restablecida exitosamente');
        } else {
            throw new Error(data.message || 'Error al cambiar la contraseña');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Muestra un paso específico
 */
function showStep(stepNumber) {
    // Ocultar todos los pasos
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Mostrar el paso actual
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    // Actualizar indicadores
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
        if (index < stepNumber) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    currentStep = stepNumber;
}

/**
 * Inicia el timer del código (30 minutos)
 */
function startCodeTimer() {
    let timeLeft = 30 * 60; // 30 minutos en segundos
    const timerElement = document.getElementById('timer');
    
    codeTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        timerElement.textContent = `Código válido por: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(codeTimer);
            timerElement.textContent = 'Código expirado';
            timerElement.style.color = '#ff3b30';
            disableCodeInputs();
        }
        
        timeLeft--;
    }, 1000);
}

/**
 * Inicia el timer para reenvío (60 segundos)
 */
function startResendTimer() {
    let timeLeft = 60;
    const resendBtn = document.getElementById('resendBtn');
    const resendTimerElement = document.getElementById('resendTimer');
    
    resendBtn.disabled = true;
    
    resendTimer = setInterval(() => {
        resendTimerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(resendTimer);
            resendBtn.disabled = false;
            resendBtn.innerHTML = 'Reenviar código';
        }
        
        timeLeft--;
    }, 1000);
}

/**
 * Limpia todos los timers
 */
function clearTimers() {
    if (codeTimer) {
        clearInterval(codeTimer);
        codeTimer = null;
    }
    
    if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
    }
}

/**
 * Obtiene el código de los inputs
 */
function getCodeFromInputs() {
    const codeInputs = document.querySelectorAll('.code-input');
    return Array.from(codeInputs).map(input => input.value).join('');
}

/**
 * Limpia los inputs de código
 */
function clearCodeInputs() {
    const codeInputs = document.querySelectorAll('.code-input');
    codeInputs.forEach(input => {
        input.value = '';
        input.classList.remove('filled');
    });
    codeInputs[0].focus();
}

/**
 * Deshabilita los inputs de código
 */
function disableCodeInputs() {
    const codeInputs = document.querySelectorAll('.code-input');
    codeInputs.forEach(input => {
        input.disabled = true;
    });
}

/**
 * Muestra el email oculto
 */
function displayEmail(email) {
    const emailDisplay = document.getElementById('emailDisplay');
    const [localPart, domain] = email.split('@');
    const hiddenLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.slice(-1);
    const hiddenEmail = hiddenLocal + '@' + domain;
    emailDisplay.textContent = hiddenEmail;
}

/**
 * Valida formato de email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Muestra mensaje de error
 */
function showError(message) {
    // Eliminar errores anteriores
    const previousErrors = document.querySelectorAll('.error-message');
    previousErrors.forEach(el => el.remove());
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.cssText = `
        background-color: rgba(255, 59, 48, 0.1);
        border: 1px solid #ff3b30;
        color: #ff3b30;
        padding: 12px;
        border-radius: 5px;
        margin: 15px 0;
        text-align: center;
        font-size: 14px;
    `;
    errorElement.textContent = message;
    
    // Insertar en el paso actual
    const currentStepElement = document.querySelector('.step.active .auth-form');
    if (currentStepElement) {
        currentStepElement.appendChild(errorElement);
    }
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}

/**
 * Muestra mensaje de éxito
 */
function showSuccess(message) {
    // Eliminar mensajes anteriores
    const previousMessages = document.querySelectorAll('.success-message-temp');
    previousMessages.forEach(el => el.remove());
    
    const successElement = document.createElement('div');
    successElement.className = 'success-message-temp';
    successElement.style.cssText = `
        background-color: rgba(90, 204, 201, 0.1);
        border: 1px solid var(--primary-color);
        color: var(--primary-color);
        padding: 12px;
        border-radius: 5px;
        margin: 15px 0;
        text-align: center;
        font-size: 14px;
    `;
    successElement.textContent = message;
    
    // Insertar en el paso actual
    const currentStepElement = document.querySelector('.step.active .auth-form');
    if (currentStepElement) {
        currentStepElement.appendChild(successElement);
    }
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        successElement.remove();
    }, 3000);
}