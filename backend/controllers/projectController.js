const { getDatabase, toObjectId } = require('../config/db').default;
const config = require('../config/config');
const emailService = require('../services/emailService');

/**
 * Obtiene todos los proyectos con paginación y filtros
 */
exports.getProjects = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Opciones de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Filtros
        const filter = {};
        
        // Filtrar por cliente
        if (req.query.cliente) {
            filter.cliente = toObjectId(req.query.cliente);
        }
        
        // Filtrar por estado
        if (req.query.estado && config.projectStatuses.includes(req.query.estado)) {
            filter.estado = req.query.estado;
        }
        
        // Filtrar por categoría
        if (req.query.categoria) {
            filter.categoria = req.query.categoria;
        }
        
        // Búsqueda por nombre o descripción
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { nombre: searchRegex },
                { descripcion: searchRegex }
            ];
        }
        
        // Ordenamiento
        const sort = {};
        
        if (req.query.sort) {
            // Ejemplo: sort=fechaCreacion:desc
            const [field, order] = req.query.sort.split(':');
            sort[field] = order === 'desc' ? -1 : 1;
        } else {
            // Por defecto, más recientes primero
            sort.fechaCreacion = -1;
        }
        
        // Consulta de proyectos
        const projects = await db.collection('projects')
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();
        
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
        
        // Total de proyectos para paginación
        const total = await db.collection('projects').countDocuments(filter);
        
        res.status(200).json({
            success: true,
            count: projectsWithClientDetails.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: projectsWithClientDetails
        });
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyectos',
            error: error.message
        });
    }
};

/**
 * Obtiene un proyecto por su ID
 */
exports.getProjectById = async (req, res) => {
    try {
        const db = getDatabase();
        
        const project = await db.collection('projects').findOne({ _id: toObjectId(req.params.id) });
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        
        // Obtener detalles del cliente si existe
        if (project.cliente) {
            const client = await db.collection('users').findOne(
                { _id: project.cliente },
                { projection: { nombre: 1, apellidos: 1, empresa: 1, correo: 1, telefono: 1 } }
            );
            
            project.clienteDetalles = client || null;
        }
        
        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Error al obtener proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyecto',
            error: error.message
        });
    }
};

/**
 * Crea un nuevo proyecto
 */
exports.createProject = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Validar estado del proyecto
        if (req.body.estado && !config.projectStatuses.includes(req.body.estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado de proyecto inválido'
            });
        }
        
        // Preparar datos del nuevo proyecto
        const newProject = {
            nombre: req.body.nombre,
            descripcion: req.body.descripcion || '',
            categoria: req.body.categoria || '',
            estado: req.body.estado || 'cotizacion',
            cliente: req.body.cliente ? toObjectId(req.body.cliente) : null,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date(),
            porcentajeProgreso: req.body.porcentajeProgreso || 0,
            costo: req.body.costo || 0,
            notas: req.body.notas || '',
            archivosAdjuntos: req.body.archivosAdjuntos || []
        };
        
        // Insertar proyecto
        const result = await db.collection('projects').insertOne(newProject);
        
        // Si hay un cliente, actualizar su lista de proyectos
        if (newProject.cliente) {
            await db.collection('users').updateOne(
                { _id: newProject.cliente },
                { $push: { proyectos: result.insertedId } }
            );
            
            // Enviar notificación por correo al cliente
            try {
                const client = await db.collection('users').findOne({ _id: newProject.cliente });
                
                if (client) {
                    await emailService.sendProjectCreationEmail(client, {
                        id: result.insertedId,
                        nombre: newProject.nombre,
                        estado: newProject.estado
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar correo de notificación:', emailError);
                // No interrumpimos el proceso si falla el envío del correo
            }
        }
        
        // Obtener proyecto creado con detalles del cliente
        const createdProject = await db.collection('projects').findOne({ _id: result.insertedId });
        
        if (createdProject.cliente) {
            const client = await db.collection('users').findOne(
                { _id: createdProject.cliente },
                { projection: { nombre: 1, apellidos: 1, empresa: 1, correo: 1 } }
            );
            
            createdProject.clienteDetalles = client || null;
        }
        
        res.status(201).json({
            success: true,
            message: 'Proyecto creado correctamente',
            data: createdProject
        });
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear proyecto',
            error: error.message
        });
    }
};

/**
 * Actualiza un proyecto existente
 */
exports.updateProject = async (req, res) => {
    try {
        const db = getDatabase();
        const projectId = req.params.id;
        
        // Comprobar si el proyecto existe
        const project = await db.collection('projects').findOne({ _id: toObjectId(projectId) });
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        
        // Preparar datos de actualización
        const updateData = {};
        
        // Solo actualizar campos proporcionados
        if (req.body.nombre !== undefined) updateData.nombre = req.body.nombre;
        if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion;
        if (req.body.categoria !== undefined) updateData.categoria = req.body.categoria;
        if (req.body.costo !== undefined) updateData.costo = req.body.costo;
        if (req.body.notas !== undefined) updateData.notas = req.body.notas;
        if (req.body.archivosAdjuntos !== undefined) updateData.archivosAdjuntos = req.body.archivosAdjuntos;
        
        // Validar estado del proyecto
        if (req.body.estado !== undefined) {
            if (config.projectStatuses.includes(req.body.estado)) {
                updateData.estado = req.body.estado;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Estado de proyecto inválido'
                });
            }
        }
        
        // Validar porcentaje de progreso
        if (req.body.porcentajeProgreso !== undefined) {
            const progress = parseFloat(req.body.porcentajeProgreso);
            
            if (isNaN(progress) || progress < 0 || progress > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Porcentaje de progreso debe ser un número entre 0 y 100'
                });
            }
            
            updateData.porcentajeProgreso = progress;
        }
        
        // Manejo del cliente
        let notifyClient = false;
        let oldClientId = null;
        let newClientId = null;
        
        if (req.body.cliente !== undefined) {
            if (req.body.cliente) {
                try {
                    updateData.cliente = toObjectId(req.body.cliente);
                    
                    // Verificar si existe el cliente
                    const clientExists = await db.collection('users').findOne({ _id: updateData.cliente });
                    
                    if (!clientExists) {
                        return res.status(404).json({
                            success: false,
                            message: 'Cliente no encontrado'
                        });
                    }
                    
                    // Si hay cambio de cliente, guardar IDs para actualizar referencias
                    if (!project.cliente || project.cliente.toString() !== updateData.cliente.toString()) {
                        oldClientId = project.cliente;
                        newClientId = updateData.cliente;
                        notifyClient = true;
                    }
                    
                } catch (err) {
                    return res.status(400).json({
                        success: false,
                        message: 'ID de cliente inválido'
                    });
                }
            } else {
                // Si se establece cliente a null, guardar el ID antiguo para quitar la referencia
                if (project.cliente) {
                    oldClientId = project.cliente;
                }
                
                updateData.cliente = null;
            }
        }
        
        // Actualizar fecha de actualización
        updateData.fechaActualizacion = new Date();
        
        // Actualizar proyecto
        await db.collection('projects').updateOne(
            { _id: toObjectId(projectId) },
            { $set: updateData }
        );
        
        // Actualizar referencias de clientes si cambió
        if (oldClientId) {
            // Quitar referencia del cliente anterior
            await db.collection('users').updateOne(
                { _id: toObjectId(oldClientId) },
                { $pull: { proyectos: toObjectId(projectId) } }
            );
        }
        
        if (newClientId) {
            // Añadir referencia al nuevo cliente
            await db.collection('users').updateOne(
                { _id: newClientId },
                { $push: { proyectos: toObjectId(projectId) } }
            );
            
            // Notificar al nuevo cliente
            if (notifyClient) {
                try {
                    const client = await db.collection('users').findOne({ _id: newClientId });
                    
                    if (client) {
                        await emailService.sendProjectAssignmentEmail(client, {
                            id: toObjectId(projectId),
                            nombre: updateData.nombre || project.nombre,
                            estado: updateData.estado || project.estado
                        });
                    }
                } catch (emailError) {
                    console.error('Error al enviar correo de asignación:', emailError);
                }
            }
        }
        
        // Notificar al cliente sobre cambio de estado
        if (updateData.estado && project.estado !== updateData.estado && project.cliente) {
            try {
                const client = await db.collection('users').findOne({ _id: project.cliente });
                
                if (client) {
                    await emailService.sendProjectStatusUpdateEmail(client, {
                        id: toObjectId(projectId),
                        nombre: project.nombre,
                        estadoAnterior: project.estado,
                        estadoNuevo: updateData.estado
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar correo de actualización de estado:', emailError);
            }
        }
        
        // Obtener proyecto actualizado
        const updatedProject = await db.collection('projects').findOne({ _id: toObjectId(projectId) });
        
        // Obtener detalles del cliente si existe
        if (updatedProject.cliente) {
            const client = await db.collection('users').findOne(
                { _id: updatedProject.cliente },
                { projection: { nombre: 1, apellidos: 1, empresa: 1, correo: 1 } }
            );
            
            updatedProject.clienteDetalles = client || null;
        }
        
        res.status(200).json({
            success: true,
            message: 'Proyecto actualizado correctamente',
            data: updatedProject
        });
    } catch (error) {
        console.error('Error al actualizar proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar proyecto',
            error: error.message
        });
    }
};

/**
 * Elimina un proyecto
 */
exports.deleteProject = async (req, res) => {
    try {
        const db = getDatabase();
        const projectId = req.params.id;
        
        // Comprobar si el proyecto existe
        const project = await db.collection('projects').findOne({ _id: toObjectId(projectId) });
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        
        // Eliminar proyecto
        await db.collection('projects').deleteOne({ _id: toObjectId(projectId) });
        
        // Si tiene cliente, quitar referencia
        if (project.cliente) {
            await db.collection('users').updateOne(
                { _id: project.cliente },
                { $pull: { proyectos: toObjectId(projectId) } }
            );
            
            // Notificar al cliente sobre la eliminación
            try {
                const client = await db.collection('users').findOne({ _id: project.cliente });
                
                if (client) {
                    await emailService.sendProjectDeletionEmail(client, {
                        nombre: project.nombre
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar correo de eliminación:', emailError);
            }
        }
        
        // Eliminar citas asociadas al proyecto
        await db.collection('appointments').deleteMany({ proyecto: toObjectId(projectId) });
        
        res.status(200).json({
            success: true,
            message: 'Proyecto eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar proyecto',
            error: error.message
        });
    }
};