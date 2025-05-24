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
        console.log('=== CREAR PROYECTO ===');
        console.log('Body recibido:', JSON.stringify(req.body, null, 2));
        
        const db = getDatabase();
        
        // Extraer y validar datos del body
        const {
            nombre,
            descripcion,
            categoria,
            estado,
            cliente,
            costo,
            porcentajeProgreso,
            notas
        } = req.body;
        
        console.log('Datos extraídos:', {
            nombre,
            descripcion,
            categoria,
            estado,
            cliente,
            costo,
            porcentajeProgreso,
            notas
        });
        
        // Validaciones básicas
        if (!nombre || !descripcion || !categoria || !cliente) {
            console.log('Error de validación - Campos faltantes:', {
                nombre: !!nombre,
                descripcion: !!descripcion,
                categoria: !!categoria,
                cliente: !!cliente
            });
            
            return res.status(400).json({
                success: false,
                message: 'Nombre, descripción, categoría y cliente son obligatorios',
                received: {
                    nombre: !!nombre,
                    descripcion: !!descripcion,
                    categoria: !!categoria,
                    cliente: !!cliente
                }
            });
        }
        
        // Validar estado del proyecto
        const validStates = ['cotizacion', 'pago procesado', 'iniciado', 'desarrollo inicial', 'desarrollo medio', 'finalizado'];
        const projectState = estado || 'cotizacion';
        
        if (!validStates.includes(projectState)) {
            return res.status(400).json({
                success: false,
                message: 'Estado de proyecto inválido',
                validStates: validStates
            });
        }
        
        // Verificar que el cliente existe
        let clienteObjectId;
        try {
            clienteObjectId = toObjectId(cliente);
            const clienteExists = await db.collection('users').findOne({ 
                _id: clienteObjectId,
                rol: 'cliente' // Asegurar que es un cliente
            });
            
            if (!clienteExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado o no es un cliente válido'
                });
            }
            
            console.log('Cliente encontrado:', clienteExists.nombre, clienteExists.apellidos);
            
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente inválido'
            });
        }
        
        // Preparar datos del nuevo proyecto
        const newProject = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            categoria: categoria,
            estado: projectState,
            cliente: clienteObjectId,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date(),
            porcentajeProgreso: Math.max(0, Math.min(100, parseInt(porcentajeProgreso) || 0)),
            costo: parseFloat(costo) || 0,
            notas: (notas || '').trim(),
            archivosAdjuntos: []
        };
        
        console.log('Proyecto a crear:', newProject);
        
        // Insertar proyecto
        const result = await db.collection('projects').insertOne(newProject);
        console.log('Proyecto insertado con ID:', result.insertedId);
        
        // Actualizar el array de proyectos del cliente
        await db.collection('users').updateOne(
            { _id: clienteObjectId },
            { $push: { proyectos: result.insertedId } }
        );
        
        console.log('Array de proyectos del cliente actualizado');
        
        // Obtener proyecto creado con detalles del cliente
        const createdProject = await db.collection('projects').findOne({ _id: result.insertedId });
        
        if (createdProject.cliente) {
            const client = await db.collection('users').findOne(
                { _id: createdProject.cliente },
                { projection: { nombre: 1, apellidos: 1, empresa: 1, correo: 1 } }
            );
            
            createdProject.clienteDetalles = client || null;
        }
        
        // Enviar notificación por correo al cliente (opcional)
        try {
            if (createdProject.clienteDetalles) {
                await emailService.sendProjectCreationEmail(createdProject.clienteDetalles, {
                    id: result.insertedId,
                    nombre: createdProject.nombre,
                    estado: createdProject.estado
                });
                console.log('Email de notificación enviado al cliente');
            }
        } catch (emailError) {
            console.error('Error al enviar correo de notificación:', emailError);
            // No interrumpimos el proceso si falla el correo
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
        if (req.body.nombre !== undefined) updateData.nombre = req.body.nombre.trim();
        if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion.trim();
        if (req.body.categoria !== undefined) updateData.categoria = req.body.categoria;
        if (req.body.costo !== undefined) updateData.costo = parseFloat(req.body.costo) || 0;
        if (req.body.notas !== undefined) updateData.notas = req.body.notas.trim();
        
        // Validar estado del proyecto
        if (req.body.estado !== undefined) {
            const validStates = ['cotizacion', 'pago procesado', 'iniciado', 'desarrollo inicial', 'desarrollo medio', 'finalizado'];
            if (validStates.includes(req.body.estado)) {
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
            const progress = parseInt(req.body.porcentajeProgreso);
            
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
                    const clientExists = await db.collection('users').findOne({ 
                        _id: updateData.cliente,
                        rol: 'cliente'
                    });
                    
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
                { _id: oldClientId },
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