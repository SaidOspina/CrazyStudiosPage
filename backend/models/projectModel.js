const { getDatabase, toObjectId } = require('../config/db');

/**
 * Obtener todos los proyectos con paginación y filtros
 * @param {Object} options - Opciones de consulta
 */
exports.getProjects = async (options = {}) => {
    const db = getDatabase();
    
    const { page = 1, limit = 10, filter = {}, sort = { fechaCreacion: -1 } } = options;
    const skip = (page - 1) * limit;
    
    // Convertir filtro de cliente a ObjectId si existe
    if (filter.cliente) {
        filter.cliente = toObjectId(filter.cliente);
    }
    
    // Aplicar búsqueda si está presente
    if (options.search) {
        const searchRegex = new RegExp(options.search, 'i');
        filter.$or = [
            { nombre: searchRegex },
            { descripcion: searchRegex }
        ];
    }
    
    // Consulta principal
    const projects = await db.collection('projects')
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
    
    // Contar total de documentos
    const total = await db.collection('projects').countDocuments(filter);
    
    // Agregar detalles del cliente a cada proyecto
    const projectsWithClientDetails = await Promise.all(projects.map(async (project) => {
        if (project.cliente) {
            const client = await db.collection('users').findOne(
                { _id: project.cliente },
                { projection: { nombre: 1, apellidos: 1, empresa: 1, correo: 1 } }
            );
            
            return {
                ...project,
                clienteDetalles: client || null
            };
        }
        
        return project;
    }));
    
    return {
        projects: projectsWithClientDetails,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Obtener un proyecto por su ID
 * @param {String} id - ID del proyecto
 */
exports.getProjectById = async (id) => {
    const db = getDatabase();
    
    const project = await db.collection('projects').findOne({ _id: toObjectId(id) });
    
    if (project && project.cliente) {
        const client = await db.collection('users').findOne(
            { _id: project.cliente },
            { projection: { nombre: 1, apellidos: 1, empresa: 1, correo: 1, telefono: 1 } }
        );
        
        project.clienteDetalles = client || null;
    }
    
    return project;
};

/**
 * Crear un nuevo proyecto
 * @param {Object} projectData - Datos del proyecto
 */
exports.createProject = async (projectData) => {
    const db = getDatabase();
    
    // Convertir cliente a ObjectId si existe
    if (projectData.cliente) {
        projectData.cliente = toObjectId(projectData.cliente);
        
        // Verificar si existe el cliente
        const client = await db.collection('users').findOne({ _id: projectData.cliente });
        
        if (!client) {
            throw new Error('Cliente no encontrado');
        }
    }
    
    // Datos del proyecto a guardar
    const newProject = {
        nombre: projectData.nombre,
        descripcion: projectData.descripcion || '',
        categoria: projectData.categoria || '',
        estado: projectData.estado || 'cotizacion',
        cliente: projectData.cliente || null,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        porcentajeProgreso: projectData.porcentajeProgreso || 0,
        costo: projectData.costo || 0,
        notas: projectData.notas || '',
        archivosAdjuntos: projectData.archivosAdjuntos || []
    };
    
    // Insertar proyecto
    const result = await db.collection('projects').insertOne(newProject);
    
    // Si hay cliente, actualizar su lista de proyectos
    if (newProject.cliente) {
        await db.collection('users').updateOne(
            { _id: newProject.cliente },
            { $push: { proyectos: result.insertedId } }
        );
    }
    
    // Obtener proyecto creado
    return exports.getProjectById(result.insertedId);
};

/**
 * Actualizar un proyecto existente
 * @param {String} id - ID del proyecto
 * @param {Object} updateData - Datos a actualizar
 */
exports.updateProject = async (id, updateData) => {
    const db = getDatabase();
    
    // Obtener proyecto actual
    const project = await exports.getProjectById(id);
    
    if (!project) {
        throw new Error('Proyecto no encontrado');
    }
    
    // Manejar cambio de cliente
    if (updateData.cliente !== undefined) {
        const oldClientId = project.cliente;
        let newClientId = null;
        
        if (updateData.cliente) {
            try {
                newClientId = toObjectId(updateData.cliente);
                
                // Verificar si existe el cliente
                const client = await db.collection('users').findOne({ _id: newClientId });
                
                if (!client) {
                    throw new Error('Cliente no encontrado');
                }
                
                updateData.cliente = newClientId;
            } catch (error) {
                throw new Error('ID de cliente inválido');
            }
        } else {
            updateData.cliente = null;
        }
        
        // Actualizar referencias en usuarios
        if (oldClientId && oldClientId.toString() !== (newClientId ? newClientId.toString() : null)) {
            // Quitar referencia del cliente anterior
            await db.collection('users').updateOne(
                { _id: oldClientId },
                { $pull: { proyectos: toObjectId(id) } }
            );
        }
        
        if (newClientId && (!oldClientId || oldClientId.toString() !== newClientId.toString())) {
            // Añadir referencia al nuevo cliente
            await db.collection('users').updateOne(
                { _id: newClientId },
                { $push: { proyectos: toObjectId(id) } }
            );
        }
    }
    
    // Actualizar fecha de modificación
    updateData.fechaActualizacion = new Date();
    
    // Actualizar proyecto
    await db.collection('projects').updateOne(
        { _id: toObjectId(id) },
        { $set: updateData }
    );
    
    // Obtener proyecto actualizado
    return exports.getProjectById(id);
};

/**
 * Eliminar un proyecto
 * @param {String} id - ID del proyecto
 */
exports.deleteProject = async (id) => {
    const db = getDatabase();
    
    // Obtener proyecto actual
    const project = await exports.getProjectById(id);
    
    if (!project) {
        throw new Error('Proyecto no encontrado');
    }
    
    // Si tiene cliente, actualizar sus referencias
    if (project.cliente) {
        await db.collection('users').updateOne(
            { _id: project.cliente },
            { $pull: { proyectos: toObjectId(id) } }
        );
    }
    
    // Eliminar citas asociadas al proyecto
    await db.collection('appointments').deleteMany({ proyecto: toObjectId(id) });
    
    // Eliminar proyecto
    const result = await db.collection('projects').deleteOne({ _id: toObjectId(id) });
    
    return result.deletedCount > 0;
};