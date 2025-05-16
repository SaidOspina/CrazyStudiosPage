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
    console.log('VALIDANDO REGISTRO - BODY COMPLETO:', JSON.stringify(req.body, null, 2));
    
    // Verificar si req.body está vacío
    if (!req.body || Object.keys(req.body).length === 0) {
        console.log('ERROR: req.body está vacío o no definido');
        return res.status(400).json({
            success: false,
            message: 'No se recibieron datos del formulario'
        });
    }
    
    // Comprobar cada campo individualmente
    const { name, lastname, email, password, confirmPassword, terms } = req.body;
    
    console.log('Campos extraídos:');
    console.log('- name:', typeof name, name);
    console.log('- lastname:', typeof lastname, lastname);
    console.log('- email:', typeof email, email);
    console.log('- password:', password ? 'Definido (No se muestra por seguridad)' : 'No definido');
    console.log('- confirmPassword:', confirmPassword ? 'Definido (No se muestra por seguridad)' : 'No definido');
    console.log('- terms:', typeof terms, terms);
    
    // Desactivar temporalmente la validación y permitir continuar
    console.log('VALIDACIÓN DESACTIVADA TEMPORALMENTE - Pasando al controlador');
    return next();
    
    /* Código de validación original (comentado por ahora)
    if (!name || !lastname || !email || !password) {
        console.log('VALIDACIÓN FALLIDA: Campos obligatorios faltantes');
        return res.status(400).json({
            success: false,
            message: 'Por favor, proporcione todos los campos obligatorios'
        });
    }
    
    // Resto de validaciones...
    next();
    */
};

exports.register = async (req, res) => {
    try {
        const db = getDatabase();
        
        console.log('Datos recibidos para registro:', req.body);
        
        // Verificar si existe el usuario
        const existingUser = await db.collection('users').findOne({ correo: req.body.email });
        
        if (existingUser) {
            console.log('Usuario ya existe:', req.body.email);
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con este correo electrónico'
            });
        }
        
        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        // Preparar datos del nuevo usuario
        const newUser = {
            nombre: req.body.name,
            apellidos: req.body.lastname,
            correo: req.body.email,
            telefono: req.body.phone || '',
            empresa: req.body.company || '',
            tipoDocumento: req.body.document_type || '',
            documento: req.body.document_number || '',
            password: hashedPassword,
            rol: 'cliente', // Por defecto, todos son clientes
            fechaRegistro: new Date(),
            proyectos: [],
            citas: []
        };
        
        console.log('Nuevo usuario a crear:', {
            ...newUser,
            password: '[PROTEGIDO]' // No logueamos la contraseña hasheada
        });
        
        // Guardar usuario en la base de datos
        const result = await db.collection('users').insertOne(newUser);
        
        console.log('Usuario creado con ID:', result.insertedId);
        
        // Usuario creado exitosamente, ahora intentamos enviar el correo
        let emailSent = false;
        
        // Enviar correo de bienvenida
        try {
            if (emailService && typeof emailService.sendWelcomeEmail === 'function') {
                await emailService.sendWelcomeEmail({
                    nombre: newUser.nombre,
                    correo: newUser.correo
                });
                emailSent = true;
                console.log(`Email de bienvenida enviado a ${newUser.correo}`);
            } else {
                console.log('Servicio de email no disponible o método no encontrado');
            }
        } catch (emailError) {
            console.error('Error al enviar correo de bienvenida:', emailError.message);
            // No interrumpir el registro si falla el correo
        }
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                id: result.insertedId,
                nombre: newUser.nombre,
                apellidos: newUser.apellidos,
                correo: newUser.correo,
                rol: newUser.rol 
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
        
        // Respuesta exitosa sin devolver la contraseña
        const { password, ...userData } = newUser;
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado con éxito' + (emailSent ? ' y correo de bienvenida enviado' : ' (no se pudo enviar el correo de bienvenida)'),
            token,
            data: {
                ...userData,
                _id: result.insertedId
            }
        });
    } catch (error) {
        console.error('Error en el registro de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al registrar usuario',
            error: error.message
        });
    }
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