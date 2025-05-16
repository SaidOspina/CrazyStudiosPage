const jwt = require('jsonwebtoken');
const { getDatabase, toObjectId } = require('../config/db');
const config = require('../config/config');

/**
 * Middleware para proteger rutas, verificando el token JWT
 */
exports.protect = async (req, res, next) => {
    try {
        let token;
        
        // Verificar si hay token en los headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // Obtener token del header
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            // Alternativamente, buscar en cookies
            token = req.cookies.token;
        }
        
        // Verificar si existe token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. Inicie sesión para acceder a este recurso'
            });
        }
        
        try {
            // Verificar token
            const decoded = jwt.verify(token, config.jwt.secret);
            
            // Añadir usuario a request
            req.user = decoded;
            
            // Verificar si el usuario existe en la base de datos
            const db = getDatabase();
            const user = await db.collection('users').findOne({ _id: toObjectId(decoded.id) });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'El usuario ya no existe en el sistema'
                });
            }
            
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor durante la autenticación',
            error: error.message
        });
    }
};

/**
 * Middleware para autorizar roles específicos
 * @param {...String} roles - Roles autorizados
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: `Un usuario con rol '${req.user.rol}' no tiene permiso para acceder a este recurso`
            });
        }
        
        next();
    };
};

/**
 * Middleware para verificar propiedad del recurso (usuario)
 */
exports.checkUserOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        // Los administradores pueden acceder a cualquier usuario
        if (req.user.rol === 'admin' || req.user.rol === 'superadmin') {
            return next();
        }
        
        // Para usuarios normales, verificar que sea el mismo usuario
        if (req.params.id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permiso para acceder a este recurso'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error al verificar propiedad:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor durante la verificación de permisos',
            error: error.message
        });
    }
};

/**
 * Middleware para verificar propiedad del recurso (proyecto)
 */
exports.checkProjectOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        // Los administradores pueden acceder a cualquier proyecto
        if (req.user.rol === 'admin' || req.user.rol === 'superadmin') {
            return next();
        }
        
        // Para usuarios normales, verificar que sea propietario del proyecto
        const db = getDatabase();
        const project = await db.collection('projects').findOne({ _id: toObjectId(req.params.id) });
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        
        // Verificar si el usuario es el cliente del proyecto
        if (!project.cliente || project.cliente.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permiso para acceder a este proyecto'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error al verificar propiedad del proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor durante la verificación de permisos',
            error: error.message
        });
    }
};

/**
 * Middleware para verificar propiedad del recurso (cita)
 */
exports.checkAppointmentOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        // Los administradores pueden acceder a cualquier cita
        if (req.user.rol === 'admin' || req.user.rol === 'superadmin') {
            return next();
        }
        
        // Para usuarios normales, verificar que sea propietario de la cita
        const db = getDatabase();
        const appointment = await db.collection('appointments').findOne({ _id: toObjectId(req.params.id) });
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }
        
        // Verificar si el usuario es el propietario de la cita
        if (!appointment.usuario || appointment.usuario.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permiso para acceder a esta cita'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error al verificar propiedad de la cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor durante la verificación de permisos',
            error: error.message
        });
    }
};