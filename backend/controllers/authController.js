const { getDatabase, toObjectId } = require('../config/db').default;
const config = require('../config/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

/**
 * Registra un nuevo usuario
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        console.log('CONTROLADOR REGISTER - BODY RECIBIDO:', JSON.stringify(req.body, null, 2));
        
        const db = getDatabase();
        
        // Extraer los datos del body
        const { 
            name, lastname, email, password, confirmPassword,
            phone, company, document_type, document_number, terms 
        } = req.body;
        
        // Validaciones manuales
        if (!name || !lastname || !email || !password) {
            console.log('VALIDACIÓN EN CONTROLADOR FALLIDA: Campos obligatorios faltantes');
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporcione todos los campos obligatorios'
            });
        }
        
        // Verificar si ya existe un usuario con ese correo
        const existingUser = await db.collection('users').findOne({ correo: email });
        
        if (existingUser) {
            console.log('ERROR: Usuario ya existe:', email);
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con este correo electrónico'
            });
        }
        
        // Verificar que las contraseñas coincidan
        if (password !== confirmPassword) {
            console.log('ERROR: Las contraseñas no coinciden');
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }
        
        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Crear nuevo usuario
        const newUser = {
            nombre: name,
            apellidos: lastname,
            correo: email,
            telefono: phone || '',
            empresa: company || '',
            tipoDocumento: document_type || '',
            documento: document_number || '',
            password: hashedPassword,
            rol: 'cliente',
            fechaRegistro: new Date(),
            proyectos: [],
            citas: []
        };
        
        console.log('Nuevo usuario a crear:', {
            ...newUser,
            password: '[PROTEGIDO]'
        });
        
        // Insertar en la base de datos
        const result = await db.collection('users').insertOne(newUser);
        console.log('Usuario creado con ID:', result.insertedId);
        
        // Intentar enviar correo de bienvenida
        try {
            await emailService.sendWelcomeEmail({
                nombre: newUser.nombre,
                correo: newUser.correo
            });
            console.log(`Email de bienvenida enviado a ${newUser.correo}`);
        } catch (emailError) {
            console.error('Error al enviar correo de bienvenida:', emailError);
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
        const { password: _, ...userData } = newUser;
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado con éxito',
            token,
            data: {
                ...userData,
                _id: result.insertedId
            }
        });
    } catch (error) {
        console.error('ERROR EN CONTROLADOR:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al registrar usuario',
            error: error.message
        });
    }
};


/**
 * Inicia sesión de usuario existente
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Verificar que se proporcionaron los campos requeridos
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporcione correo electrónico y contraseña'
            });
        }

        // Normaliza el email y elimina espacios
        const email = req.body.email.toLowerCase().trim();

        // Buscar usuario por correo electrónico
        const user = await db.collection('users').findOne({ correo: email });

        // Si no se encuentra el usuario
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Correo electrónico o contraseña incorrectos'
            });
        }

        // Verificar la contraseña
        const isMatch = await bcrypt.compare(req.body.password, user.password);

        // Si la contraseña no coincide
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Correo electrónico o contraseña incorrectos'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user._id,
                nombre: user.nombre,
                apellidos: user.apellidos,
                correo: user.correo,
                rol: user.rol 
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Actualizar última conexión
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { ultimaConexion: new Date() } }
        );

        // No enviar la contraseña en la respuesta
        const { password, ...userData } = user;

        // Respuesta exitosa
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            data: userData
        });
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al iniciar sesión',
            error: error.message
        });
    }
};

/**
 * Obtiene el usuario actual a partir del token JWT
 * @route GET /api/auth/me
 */
exports.getCurrentUser = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Buscar usuario por ID (se establece en el middleware auth)
        const user = await db.collection('users').findOne(
            { _id: toObjectId(req.user.id) },
            { projection: { password: 0 } } // No devolver la contraseña
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error al obtener usuario actual:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener usuario',
            error: error.message
        });
    }
};



/**
 * Solicita restablecimiento de contraseña con código de 6 dígitos
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
    try {
        const db = getDatabase();
        
        if (!req.body.email) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporcione su correo electrónico'
            });
        }
        
        // Verificar si existe el usuario
        const user = await db.collection('users').findOne({ correo: req.body.email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No existe un usuario con este correo electrónico'
            });
        }
        
        // Generar código de 6 dígitos
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Establecer fecha de expiración (30 minutos)
        const resetCodeExpire = new Date(Date.now() + 30 * 60 * 1000);
        
        // Guardar código en la base de datos
        await db.collection('users').updateOne(
            { _id: user._id },
            { 
                $set: { 
                    resetPasswordCode: resetCode,
                    resetPasswordCodeExpire: resetCodeExpire,
                    resetPasswordCodeAttempts: 0 // Contador de intentos
                } 
            }
        );
        
        // Enviar correo con el código
        try {
            await emailService.sendPasswordResetCodeEmail({
                nombre: user.nombre,
                correo: user.correo,
                resetCode: resetCode,
                expirationTime: '30 minutos'
            });
            
            res.status(200).json({
                success: true,
                message: 'Se ha enviado un código de verificación a tu correo electrónico'
            });
        } catch (emailError) {
            console.error('Error al enviar correo de restablecimiento:', emailError);
            
            // Si falla el envío, eliminar el código
            await db.collection('users').updateOne(
                { _id: user._id },
                { 
                    $unset: { 
                        resetPasswordCode: "",
                        resetPasswordCodeExpire: "",
                        resetPasswordCodeAttempts: ""
                    } 
                }
            );
            
            return res.status(500).json({
                success: false,
                message: 'No se pudo enviar el código de verificación',
                error: emailError.message
            });
        }
    } catch (error) {
        console.error('Error al solicitar restablecimiento de contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al procesar la solicitud',
            error: error.message
        });
    }
};

/**
 * Verifica el código de restablecimiento de contraseña
 * @route POST /api/auth/verify-reset-code
 */
exports.verifyResetCode = async (req, res) => {
    try {
        const db = getDatabase();
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Correo electrónico y código son requeridos'
            });
        }
        
        // Buscar usuario con código válido
        const user = await db.collection('users').findOne({
            correo: email,
            resetPasswordCode: code,
            resetPasswordCodeExpire: { $gt: new Date() }
        });
        
        if (!user) {
            // Verificar si el usuario existe pero el código es incorrecto o expirado
            const userExists = await db.collection('users').findOne({ correo: email });
            
            if (userExists && userExists.resetPasswordCode) {
                // Incrementar contador de intentos
                await db.collection('users').updateOne(
                    { _id: userExists._id },
                    { $inc: { resetPasswordCodeAttempts: 1 } }
                );
                
                // Si hay más de 3 intentos, invalidar el código
                if ((userExists.resetPasswordCodeAttempts || 0) >= 2) {
                    await db.collection('users').updateOne(
                        { _id: userExists._id },
                        { 
                            $unset: { 
                                resetPasswordCode: "",
                                resetPasswordCodeExpire: "",
                                resetPasswordCodeAttempts: ""
                            } 
                        }
                    );
                    
                    return res.status(400).json({
                        success: false,
                        message: 'Demasiados intentos fallidos. Solicita un nuevo código.'
                    });
                }
                
                return res.status(400).json({
                    success: false,
                    message: 'Código incorrecto o expirado'
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Código de verificación inválido'
            });
        }
        
        // Generar token temporal para cambio de contraseña (válido por 10 minutos)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpire = new Date(Date.now() + 10 * 60 * 1000);
        
        // Guardar token y limpiar código
        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: resetToken,
                    resetPasswordTokenExpire: resetTokenExpire
                },
                $unset: {
                    resetPasswordCode: "",
                    resetPasswordCodeExpire: "",
                    resetPasswordCodeAttempts: ""
                }
            }
        );
        
        res.status(200).json({
            success: true,
            message: 'Código verificado correctamente',
            resetToken: resetToken
        });
        
    } catch (error) {
        console.error('Error al verificar código:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al verificar el código',
            error: error.message
        });
    }
};

/**
 * Restablece la contraseña usando el token temporal
 * @route POST /api/auth/reset-password-with-token
 */
exports.resetPasswordWithToken = async (req, res) => {
    try {
        const db = getDatabase();
        const { resetToken, password, confirmPassword } = req.body;
        
        if (!resetToken || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token, contraseña y confirmación son requeridos'
            });
        }
        
        // Verificar que las contraseñas coincidan
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }
        
        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // Buscar usuario con token válido
        const user = await db.collection('users').findOne({
            resetPasswordToken: resetToken,
            resetPasswordTokenExpire: { $gt: new Date() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token de restablecimiento inválido o expirado'
            });
        }
        
        // Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Actualizar contraseña y eliminar token
        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { 
                    resetPasswordToken: "",
                    resetPasswordTokenExpire: ""
                }
            }
        );
        
        // Enviar notificación de cambio de contraseña
        try {
            await emailService.sendPasswordChangedEmail({
                nombre: user.nombre,
                correo: user.correo
            });
        } catch (emailError) {
            console.error('Error al enviar correo de notificación:', emailError);
            // No interrumpir el proceso si falla el correo
        }
        
        res.status(200).json({
            success: true,
            message: 'Contraseña restablecida con éxito'
        });
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al restablecer contraseña',
            error: error.message
        });
    }
};

/**
 * Restablece la contraseña con token
 */
exports.resetPassword = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Buscar usuario con token válido
        const user = await db.collection('users').findOne({
            resetPasswordToken: req.params.resetToken,
            resetPasswordExpire: { $gt: new Date() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token de restablecimiento inválido o expirado'
            });
        }
        
        // Verificar que las contraseñas coincidan
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }
        
        // Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        // Actualizar contraseña y eliminar token
        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { 
                    resetPasswordToken: "",
                    resetPasswordExpire: ""
                }
            }
        );
        
        // Enviar notificación de cambio de contraseña
        try {
            await emailService.sendPasswordChangedEmail({
                nombre: user.nombre,
                correo: user.correo
            });
        } catch (emailError) {
            console.error('Error al enviar correo de notificación:', emailError);
            // No interrumpir el proceso si falla el correo
        }
        
        res.status(200).json({
            success: true,
            message: 'Contraseña restablecida con éxito'
        });
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al restablecer contraseña',
            error: error.message
        });
    }
};

/**
 * Cambia la contraseña del usuario autenticado
 */
exports.changePassword = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Buscar usuario por ID
        const user = await db.collection('users').findOne({ _id: toObjectId(req.user.id) });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }
        
        // Verificar que las nuevas contraseñas coincidan
        if (req.body.newPassword !== req.body.confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las nuevas contraseñas no coinciden'
            });
        }
        
        // Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
        
        // Actualizar contraseña
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
        );
        
        // Enviar notificación de cambio de contraseña
        try {
            await emailService.sendPasswordChangedEmail({
                nombre: user.nombre,
                correo: user.correo
            });
        } catch (emailError) {
            console.error('Error al enviar correo de notificación:', emailError);
            // No interrumpir el proceso si falla el correo
        }
        
        res.status(200).json({
            success: true,
            message: 'Contraseña cambiada con éxito'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al cambiar contraseña',
            error: error.message
        });
    }
};