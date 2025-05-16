/**
 * Validadores para diferentes entidades y datos
 */
const config = require('../config/config');

/**
 * Valida un formato de correo electrónico
 * @param {String} email - Correo electrónico a validar
 * @returns {Boolean} True si es válido, false si no
 */
exports.isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Valida que una contraseña cumpla con requisitos mínimos
 * @param {String} password - Contraseña a validar
 * @returns {Boolean} True si es válida, false si no
 */
exports.isValidPassword = (password) => {
    // Mínimo 6 caracteres
    return password && password.length >= 6;
};

/**
 * Valida un número de teléfono (formato básico)
 * @param {String} phone - Teléfono a validar
 * @returns {Boolean} True si es válido, false si no
 */
exports.isValidPhone = (phone) => {
    // Eliminar espacios y caracteres especiales
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // Verificar longitud y que solo contenga números
    return /^\d{7,15}$/.test(cleanPhone);
};

/**
 * Valida un formato de hora (HH:MM)
 * @param {String} time - Hora a validar
 * @returns {Boolean} True si es válido, false si no
 */
exports.isValidTime = (time) => {
    // Formato HH:MM (24 horas)
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
};

/**
 * Valida si un estado de proyecto es válido
 * @param {String} status - Estado a validar
 * @returns {Boolean} True si es válido, false si no
 */
exports.isValidProjectStatus = (status) => {
    return config.projectStatuses.includes(status);
};

/**
 * Valida si un tipo de cita es válido
 * @param {String} type - Tipo de cita a validar
 * @returns {Boolean} True si es válido, false si no
 */
exports.isValidAppointmentType = (type) => {
    return config.appointmentTypes.includes(type);
};

/**
 * Valida si un estado de cita es válido
 * @param {String} status - Estado a validar
 * @returns {Boolean} True si es válido, false si no
 */
exports.isValidAppointmentStatus = (status) => {
    return config.appointmentStatuses.includes(status);
};

/**
 * Valida si un rol de usuario es válido
 * @param {String} role - Rol a validar
 * @returns {Boolean} True si es válido, false si no
 */
exports.isValidUserRole = (role) => {
    return config.userRoles.includes(role);
};

/**
 * Valida un objeto de usuario
 * @param {Object} userData - Datos de usuario a validar
 * @returns {Object} Resultado de validación
 */
exports.validateUserData = (userData) => {
    const errors = {};
    
    // Validar campos obligatorios
    if (!userData.nombre) {
        errors.nombre = 'El nombre es obligatorio';
    }
    
    if (!userData.apellidos) {
        errors.apellidos = 'Los apellidos son obligatorios';
    }
    
    if (!userData.correo) {
        errors.correo = 'El correo electrónico es obligatorio';
    } else if (!exports.isValidEmail(userData.correo)) {
        errors.correo = 'El formato del correo electrónico no es válido';
    }
    
    // Validar contraseña si está presente
    if (userData.password) {
        if (userData.password.length < 6) {
            errors.password = 'La contraseña debe tener al menos 6 caracteres';
        }
    }
    
    // Validar teléfono si está presente
    if (userData.telefono && !exports.isValidPhone(userData.telefono)) {
        errors.telefono = 'El formato del teléfono no es válido';
    }
    
    // Validar rol si está presente
    if (userData.rol && !exports.isValidUserRole(userData.rol)) {
        errors.rol = 'El rol especificado no es válido';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida un objeto de proyecto
 * @param {Object} projectData - Datos de proyecto a validar
 * @returns {Object} Resultado de validación
 */
exports.validateProjectData = (projectData) => {
    const errors = {};
    
    // Validar campos obligatorios
    if (!projectData.nombre) {
        errors.nombre = 'El nombre del proyecto es obligatorio';
    }
    
    // Validar estado si está presente
    if (projectData.estado && !exports.isValidProjectStatus(projectData.estado)) {
        errors.estado = 'El estado especificado no es válido';
    }
    
    // Validar porcentaje de progreso si está presente
    if (projectData.porcentajeProgreso !== undefined) {
        const progress = parseFloat(projectData.porcentajeProgreso);
        
        if (isNaN(progress) || progress < 0 || progress > 100) {
            errors.porcentajeProgreso = 'El porcentaje de progreso debe ser un número entre 0 y 100';
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida un objeto de cita
 * @param {Object} appointmentData - Datos de cita a validar
 * @returns {Object} Resultado de validación
 */
exports.validateAppointmentData = (appointmentData) => {
    const errors = {};
    
    // Validar tipo de cita
    if (!appointmentData.tipo) {
        errors.tipo = 'El tipo de cita es obligatorio';
    } else if (!exports.isValidAppointmentType(appointmentData.tipo)) {
        errors.tipo = 'El tipo de cita especificado no es válido';
    }
    
    // Validar fecha y hora
    if (!appointmentData.fecha) {
        errors.fecha = 'La fecha de la cita es obligatoria';
    } else {
        const appointmentDate = new Date(appointmentData.fecha);
        
        if (isNaN(appointmentDate.getTime())) {
            errors.fecha = 'La fecha proporcionada no es válida';
        } else {
            // Verificar que no sea una fecha pasada
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (appointmentDate < today) {
                errors.fecha = 'No se pueden agendar citas en fechas pasadas';
            }
        }
    }
    
    if (!appointmentData.hora) {
        errors.hora = 'La hora de la cita es obligatoria';
    } else if (!exports.isValidTime(appointmentData.hora)) {
        errors.hora = 'El formato de la hora no es válido. Use el formato HH:MM';
    }
    
    // Validar estado si está presente
    if (appointmentData.estado && !exports.isValidAppointmentStatus(appointmentData.estado)) {
        errors.estado = 'El estado especificado no es válido';
    }
    
    // Validar datos de contacto si no hay usuario
    if (!appointmentData.usuario) {
        if (!appointmentData.nombreContacto) {
            errors.nombreContacto = 'El nombre de contacto es obligatorio para citas sin usuario registrado';
        }
        
        if (!appointmentData.correoContacto) {
            errors.correoContacto = 'El correo de contacto es obligatorio para citas sin usuario registrado';
        } else if (!exports.isValidEmail(appointmentData.correoContacto)) {
            errors.correoContacto = 'El formato del correo de contacto no es válido';
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida un formulario de registro
 * @param {Object} registerData - Datos de registro a validar
 * @returns {Object} Resultado de validación
 */
exports.validateRegisterData = (registerData) => {
    const errors = {};
    
    // Validar campos obligatorios
    if (!registerData.name) {
        errors.name = 'El nombre es obligatorio';
    }
    
    if (!registerData.lastname) {
        errors.lastname = 'Los apellidos son obligatorios';
    }
    
    if (!registerData.email) {
        errors.email = 'El correo electrónico es obligatorio';
    } else if (!exports.isValidEmail(registerData.email)) {
        errors.email = 'El formato del correo electrónico no es válido';
    }
    
    if (!registerData.password) {
        errors.password = 'La contraseña es obligatoria';
    } else if (registerData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!registerData.confirmPassword) {
        errors.confirmPassword = 'La confirmación de contraseña es obligatoria';
    } else if (registerData.password !== registerData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (!registerData.terms) {
        errors.terms = 'Debe aceptar los términos y condiciones';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida un formulario de inicio de sesión
 * @param {Object} loginData - Datos de inicio de sesión
 * @returns {Object} Resultado de validación
 */
exports.validateLoginData = (loginData) => {
    const errors = {};
    
    if (!loginData.email) {
        errors.email = 'El correo electrónico es obligatorio';
    } else if (!exports.isValidEmail(loginData.email)) {
        errors.email = 'El formato del correo electrónico no es válido';
    }
    
    if (!loginData.password) {
        errors.password = 'La contraseña es obligatoria';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida un formulario de restablecimiento de contraseña
 * @param {Object} resetData - Datos de restablecimiento
 * @returns {Object} Resultado de validación
 */
exports.validateResetPasswordData = (resetData) => {
    const errors = {};
    
    if (!resetData.password) {
        errors.password = 'La nueva contraseña es obligatoria';
    } else if (resetData.password.length < 6) {
        errors.password = 'La nueva contraseña debe tener al menos 6 caracteres';
    }
    
    if (!resetData.confirmPassword) {
        errors.confirmPassword = 'La confirmación de contraseña es obligatoria';
    } else if (resetData.password !== resetData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida un formulario de cambio de contraseña
 * @param {Object} passwordData - Datos de cambio de contraseña
 * @returns {Object} Resultado de validación
 */
exports.validateChangePasswordData = (passwordData) => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
        errors.currentPassword = 'La contraseña actual es obligatoria';
    }
    
    if (!passwordData.newPassword) {
        errors.newPassword = 'La nueva contraseña es obligatoria';
    } else if (passwordData.newPassword.length < 6) {
        errors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    }
    
    if (!passwordData.confirmPassword) {
        errors.confirmPassword = 'La confirmación de contraseña es obligatoria';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};