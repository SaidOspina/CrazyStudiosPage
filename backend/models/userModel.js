const { getDatabase, toObjectId } = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Obtener todos los usuarios con paginación y filtros
 * @param {Object} options - Opciones de consulta
 */
exports.getUsers = async (options = {}) => {
    const db = getDatabase();
    
    const { page = 1, limit = 10, filter = {}, sort = { fechaRegistro: -1 } } = options;
    const skip = (page - 1) * limit;
    
    // Aplicar búsqueda si está presente
    if (options.search) {
        const searchRegex = new RegExp(options.search, 'i');
        filter.$or = [
            { nombre: searchRegex },
            { apellidos: searchRegex },
            { correo: searchRegex },
            { empresa: searchRegex }
        ];
    }
    
    // Consulta principal
    const users = await db.collection('users')
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .project({ password: 0 }) // No devolver contraseñas
        .toArray();
    
    // Contar total de documentos
    const total = await db.collection('users').countDocuments(filter);
    
    return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Obtener un usuario por su ID
 * @param {String} id - ID del usuario
 */
exports.getUserById = async (id) => {
    const db = getDatabase();
    
    return db.collection('users').findOne(
        { _id: toObjectId(id) },
        { projection: { password: 0 } } // No devolver la contraseña
    );
};

/**
 * Obtener un usuario por su correo electrónico
 * @param {String} email - Correo electrónico del usuario
 */
exports.getUserByEmail = async (email) => {
    const db = getDatabase();
    
    return db.collection('users').findOne({ correo: email });
};

/**
 * Crear un nuevo usuario
 * @param {Object} userData - Datos del usuario
 */
exports.createUser = async (userData) => {
    const db = getDatabase();
    
    // Verificar si el correo ya existe
    const existingUser = await exports.getUserByEmail(userData.correo);
    
    if (existingUser) {
        throw new Error('Este correo electrónico ya está registrado');
    }
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Datos del usuario a guardar
    const newUser = {
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        correo: userData.correo,
        telefono: userData.telefono || '',
        empresa: userData.empresa || '',
        tipoDocumento: userData.tipoDocumento || '',
        documento: userData.documento || '',
        password: hashedPassword,
        rol: userData.rol || 'cliente',
        fechaRegistro: new Date(),
        proyectos: [],
        citas: []
    };
    
    // Insertar usuario
    const result = await db.collection('users').insertOne(newUser);
    
    // Obtener usuario creado sin contraseña
    return getUserById(result.insertedId);
};

/**
 * Actualizar un usuario existente
 * @param {String} id - ID del usuario
 * @param {Object} updateData - Datos a actualizar
 */
exports.updateUser = async (id, updateData) => {
    const db = getDatabase();
    
    // Verificar si el usuario existe
    const user = await exports.getUserById(id);
    
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    
    // Verificar si se intenta actualizar el correo
    if (updateData.correo && updateData.correo !== user.correo) {
        const existingUser = await exports.getUserByEmail(updateData.correo);
        
        if (existingUser) {
            throw new Error('Este correo electrónico ya está asociado a otro usuario');
        }
    }
    
    // Si hay contraseña, hashearla
    if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    
    // Actualizar usuario
    await db.collection('users').updateOne(
        { _id: toObjectId(id) },
        { $set: updateData }
    );
    
    // Obtener usuario actualizado
    return exports.getUserById(id);
};

/**
 * Eliminar un usuario
 * @param {String} id - ID del usuario
 */
exports.deleteUser = async (id) => {
    const db = getDatabase();
    
    // Verificar si el usuario existe
    const user = await exports.getUserById(id);
    
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    
    // Actualizar proyectos asociados
    await db.collection('projects').updateMany(
        { cliente: toObjectId(id) },
        { $set: { cliente: null } }
    );
    
    // Eliminar citas asociadas
    await db.collection('appointments').deleteMany({ usuario: toObjectId(id) });
    
    // Eliminar usuario
    const result = await db.collection('users').deleteOne({ _id: toObjectId(id) });
    
    return result.deletedCount > 0;
};