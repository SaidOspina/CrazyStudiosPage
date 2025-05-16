/**
 * Middleware para validar datos de usuario
 */
exports.validateUser = (req, res, next) => {
    // Validar campos obligatorios
    if (!req.body.nombre || !req.body.apellidos || !req.body.correo) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione nombre, apellidos y correo electrónico'
        });
    }
    
    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.correo)) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione un correo electrónico válido'
        });
    }
    
    // Validar contraseña en caso de crear nuevo usuario
    if (req.method === 'POST' && !req.body.password) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña es obligatoria'
        });
    }
    
    // Si hay contraseña, validar su longitud
    if (req.body.password && req.body.password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
        });
    }
    
    next();
};

/**
 * Middleware para validar datos de registro
 */
exports.validateRegister = (req, res, next) => {
    // Validar campos obligatorios
    if (!req.body.name || !req.body.lastname || !req.body.email || !req.body.password) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione todos los campos obligatorios'
        });
    }
    
    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione un correo electrónico válido'
        });
    }
    
    // Validar longitud de la contraseña
    if (req.body.password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
        });
    }
    
    // Validar confirmación de contraseña
    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Las contraseñas no coinciden'
        });
    }
    
    // Validar aceptación de términos
    if (!req.body.terms) {
        return res.status(400).json({
            success: false,
            message: 'Debe aceptar los términos y condiciones'
        });
    }
    
    next();
};

/**
 * Middleware para validar datos de inicio de sesión
 */
exports.validateLogin = (req, res, next) => {
    // Validar campos obligatorios
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione correo electrónico y contraseña'
        });
    }
    
    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione un correo electrónico válido'
        });
    }
    
    next();
};

/**
 * Middleware para validar datos de proyecto
 */
exports.validateProject = (req, res, next) => {
    // Validar nombre del proyecto (obligatorio)
    if (!req.body.nombre) {
        return res.status(400).json({
            success: false,
            message: 'El nombre del proyecto es obligatorio'
        });
    }
    
    next();
};

/**
 * Middleware para validar datos de cita
 */
exports.validateAppointment = (req, res, next) => {
    // Validar tipo de cita (obligatorio)
    if (!req.body.tipo) {
        return res.status(400).json({
            success: false,
            message: 'El tipo de cita es obligatorio'
        });
    }
    
    // Validar fecha y hora (obligatorios)
    if (!req.body.fecha || !req.body.hora) {
        return res.status(400).json({
            success: false,
            message: 'Fecha y hora son obligatorios'
        });
    }
    
    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(req.body.fecha)) {
        return res.status(400).json({
            success: false,
            message: 'Formato de fecha inválido. Use YYYY-MM-DD'
        });
    }
    
    // Validar que la fecha no sea en el pasado
    const fechaSolicitada = new Date(req.body.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSolicitada < hoy) {
        return res.status(400).json({
            success: false,
            message: 'No se pueden agendar citas en fechas pasadas'
        });
    }
    
    next();
};

/**
 * Middleware para validar solicitud de restablecimiento de contraseña
 */
exports.validateForgotPassword = (req, res, next) => {
    // Validar correo electrónico (obligatorio)
    if (!req.body.email) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione su correo electrónico'
        });
    }
    
    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione un correo electrónico válido'
        });
    }
    
    next();
};

/**
 * Middleware para validar restablecimiento de contraseña
 */
exports.validateResetPassword = (req, res, next) => {
    // Validar campos obligatorios
    if (!req.body.password || !req.body.confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione una nueva contraseña y su confirmación'
        });
    }
    
    // Validar longitud de la contraseña
    if (req.body.password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
        });
    }
    
    // Validar coincidencia de contraseñas
    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Las contraseñas no coinciden'
        });
    }
    
    next();
};

/**
 * Middleware para validar cambio de contraseña
 */
exports.validateChangePassword = (req, res, next) => {
    // Validar campos obligatorios
    if (!req.body.currentPassword || !req.body.newPassword || !req.body.confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione todos los campos obligatorios'
        });
    }
    
    // Validar longitud de la nueva contraseña
    if (req.body.newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
    }
    
    // Validar coincidencia de contraseñas
    if (req.body.newPassword !== req.body.confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Las nuevas contraseñas no coinciden'
        });
    }
    
    next();
};