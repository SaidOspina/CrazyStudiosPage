const { getDatabase, toObjectId } = require('../config/db').default;
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const emailService = require('../services/emailService');

/**
 * Obtiene todos los usuarios con paginación y filtros
 */
exports.getUsers = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Opciones de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Filtros
        const filter = {};
        
        if (req.query.rol) {
            filter.rol = req.query.rol;
        }
        
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { nombre: searchRegex },
                { apellidos: searchRegex },
                { correo: searchRegex },
                { empresa: searchRegex }
            ];
        }
        
        // Ordenamiento
        const sort = { fechaRegistro: -1 }; // Por defecto, más recientes primero
        
        // Consulta
        const users = await db.collection('users')
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .project({ password: 0 }) // No devolver la contraseña
            .toArray();
        
        const total = await db.collection('users').countDocuments(filter);
        
        res.status(200).json({
            success: true,
            count: users.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: users
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

/**
 * Obtiene un usuario por su ID
 */
exports.getUserById = async (req, res) => {
    try {
        const db = getDatabase();
        
        const user = await db.collection('users').findOne(
            { _id: toObjectId(req.params.id) },
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
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

/**
 * Crea un nuevo usuario
 */
exports.createUser = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Comprobar si el correo ya existe
        const existingUser = await db.collection('users').findOne({ correo: req.body.correo });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con este correo electrónico'
            });
        }
        
        // Validar el rol
        if (req.body.rol && !config.userRoles.includes(req.body.rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol de usuario inválido'
            });
        }
        
        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        // Crear nuevo usuario
        const newUser = {
            nombre: req.body.nombre,
            apellidos: req.body.apellidos,
            correo: req.body.correo,
            telefono: req.body.telefono || '',
            empresa: req.body.empresa || '',
            tipoDocumento: req.body.tipoDocumento || '',
            documento: req.body.documento || '',
            password: hashedPassword,
            rol: req.body.rol || 'cliente',
            fechaRegistro: new Date(),
            proyectos: [],
            citas: []
        };
        
        const result = await db.collection('users').insertOne(newUser);
        
        // Enviar correo de bienvenida si se ha activado
        if (req.body.sendWelcomeEmail) {
            try {
                await emailService.sendWelcomeEmail(newUser);
            } catch (emailError) {
                console.error('Error al enviar correo de bienvenida:', emailError);
                // No interrumpimos el proceso si falla el envío del correo
            }
        }
        
        // Obtener usuario creado sin la contraseña
        const createdUser = await db.collection('users').findOne(
            { _id: result.insertedId },
            { projection: { password: 0 } }
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario creado correctamente',
            data: createdUser
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario',
            error: error.message
        });
    }
};

/**
 * Actualiza un usuario existente
 */
exports.updateUser = async (req, res) => {
    try {
        const db = getDatabase();
        const userId = req.params.id;
        
        // Comprobar si el usuario existe
        const user = await db.collection('users').findOne({ _id: toObjectId(userId) });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Comprobar si se intenta actualizar el correo y si ya existe
        if (req.body.correo && req.body.correo !== user.correo) {
            const existingUser = await db.collection('users').findOne({ correo: req.body.correo });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un usuario con este correo electrónico'
                });
            }
        }
        
        // Preparar datos de actualización
        const updateData = {};
        
        // Solo actualizar campos proporcionados
        if (req.body.nombre) updateData.nombre = req.body.nombre;
        if (req.body.apellidos) updateData.apellidos = req.body.apellidos;
        if (req.body.correo) updateData.correo = req.body.correo;
        if (req.body.telefono) updateData.telefono = req.body.telefono;
        if (req.body.empresa) updateData.empresa = req.body.empresa;
        if (req.body.tipoDocumento) updateData.tipoDocumento = req.body.tipoDocumento;
        if (req.body.documento) updateData.documento = req.body.documento;
        
        // Si se proporciona nueva contraseña, hashearla
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }
        
        // Solo los administradores pueden cambiar el rol
        if (req.body.rol && req.user.rol === 'admin' && config.userRoles.includes(req.body.rol)) {
            updateData.rol = req.body.rol;
        }
        
        // Actualizar usuario
        await db.collection('users').updateOne(
            { _id: toObjectId(userId) },
            { $set: updateData }
        );
        
        // Obtener usuario actualizado
        const updatedUser = await db.collection('users').findOne(
            { _id: toObjectId(userId) },
            { projection: { password: 0 } }
        );
        
        res.status(200).json({
            success: true,
            message: 'Usuario actualizado correctamente',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

/**
 * Elimina un usuario
 */
exports.deleteUser = async (req, res) => {
    try {
        const db = getDatabase();
        const userId = req.params.id;
        
        // Comprobar si el usuario existe
        const user = await db.collection('users').findOne({ _id: toObjectId(userId) });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Eliminar usuario
        await db.collection('users').deleteOne({ _id: toObjectId(userId) });
        
        // Actualizar proyectos asociados
        await db.collection('projects').updateMany(
            { cliente: toObjectId(userId) },
            { $set: { cliente: null } }
        );
        
        // Eliminar citas asociadas
        await db.collection('appointments').deleteMany({ usuario: toObjectId(userId) });
        
        res.status(200).json({
            success: true,
            message: 'Usuario eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
};