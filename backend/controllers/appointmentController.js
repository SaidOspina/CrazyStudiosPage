const { getDatabase, toObjectId } = require('../config/db');
const config = require('../config/config');
const emailService = require('../services/emailService');

/**
 * Obtiene todas las citas con paginación y filtros
 */
exports.getAppointments = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Opciones de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Filtros
        const filter = {};
        
        // Filtrar por usuario
        if (req.query.usuario) {
            filter.usuario = toObjectId(req.query.usuario);
        }
        
        // Filtrar por proyecto
        if (req.query.proyecto) {
            filter.proyecto = toObjectId(req.query.proyecto);
        }
        
        // Filtrar por tipo
        if (req.query.tipo && config.appointmentTypes.includes(req.query.tipo)) {
            filter.tipo = req.query.tipo;
        }
        
        // Filtrar por estado
        if (req.query.estado && config.appointmentStatuses.includes(req.query.estado)) {
            filter.estado = req.query.estado;
        }
        
        // Filtrar por fecha
        if (req.query.fecha) {
            const fecha = new Date(req.query.fecha);
            
            // Establecer inicio y fin del día
            const startOfDay = new Date(fecha);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(fecha);
            endOfDay.setHours(23, 59, 59, 999);
            
            filter.fecha = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        } else if (req.query.fechaInicio || req.query.fechaFin) {
            filter.fecha = {};
            
            if (req.query.fechaInicio) {
                const fechaInicio = new Date(req.query.fechaInicio);
                fechaInicio.setHours(0, 0, 0, 0);
                filter.fecha.$gte = fechaInicio;
            }
            
            if (req.query.fechaFin) {
                const fechaFin = new Date(req.query.fechaFin);
                fechaFin.setHours(23, 59, 59, 999);
                filter.fecha.$lte = fechaFin;
            }
        }
        
        // Filtrar citas futuras (desde hoy)
        if (req.query.futuras === 'true') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            filter.fecha = filter.fecha || {};
            filter.fecha.$gte = today;
        }
        
        // Ordenamiento
        const sort = {};
        
        if (req.query.sort) {
            // Ejemplo: sort=fecha:asc
            const [field, order] = req.query.sort.split(':');
            sort[field] = order === 'desc' ? -1 : 1;
        } else {
            // Por defecto, próximas citas primero
            sort.fecha = 1;
        }
        
        // Consulta de citas
        const appointments = await db.collection('appointments')
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();
        
        // Agregar detalles del usuario y proyecto a cada cita
        const appointmentsWithDetails = await Promise.all(appointments.map(async (appointment) => {
            const details = { ...appointment };
            
            // Obtener detalles del usuario
            if (appointment.usuario) {
                const user = await db.collection('users').findOne(
                    { _id: appointment.usuario },
                    { projection: { nombre: 1, apellidos: 1, correo: 1, telefono: 1, empresa: 1 } }
                );
                
                details.usuarioDetalles = user || null;
            }
            
            // Obtener detalles del proyecto
            if (appointment.proyecto) {
                const project = await db.collection('projects').findOne(
                    { _id: appointment.proyecto },
                    { projection: { nombre: 1, estado: 1, categoria: 1 } }
                );
                
                details.proyectoDetalles = project || null;
            }
            
            return details;
        }));
        
        // Total para paginación
        const total = await db.collection('appointments').countDocuments(filter);
        
        res.status(200).json({
            success: true,
            count: appointmentsWithDetails.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: appointmentsWithDetails
        });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener citas',
            error: error.message
        });
    }
};

/**
 * Obtiene una cita por su ID
 */
exports.getAppointmentById = async (req, res) => {
    try {
        const db = getDatabase();
        
        const appointment = await db.collection('appointments').findOne({ _id: toObjectId(req.params.id) });
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }
        
        // Obtener detalles del usuario si existe
        if (appointment.usuario) {
            const user = await db.collection('users').findOne(
                { _id: appointment.usuario },
                { projection: { nombre: 1, apellidos: 1, correo: 1, telefono: 1, empresa: 1 } }
            );
            
            appointment.usuarioDetalles = user || null;
        }
        
        // Obtener detalles del proyecto si existe
        if (appointment.proyecto) {
            const project = await db.collection('projects').findOne(
                { _id: appointment.proyecto },
                { projection: { nombre: 1, estado: 1, categoria: 1, porcentajeProgreso: 1 } }
            );
            
            appointment.proyectoDetalles = project || null;
        }
        
        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        console.error('Error al obtener cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cita',
            error: error.message
        });
    }
};

/**
 * Crea una nueva cita
 */
exports.createAppointment = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Validar tipo de cita
        if (!config.appointmentTypes.includes(req.body.tipo)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de cita inválido'
            });
        }
        
        // Validar estado de cita
        if (req.body.estado && !config.appointmentStatuses.includes(req.body.estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado de cita inválido'
            });
        }
        
        // Validar fecha
        const fecha = new Date(req.body.fecha);
        
        if (isNaN(fecha.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Fecha de cita inválida'
            });
        }
        
        // Validar disponibilidad de la hora
        const existingAppointment = await db.collection('appointments').findOne({
            fecha: fecha,
            hora: req.body.hora,
            estado: { $in: ['pendiente', 'confirmada'] }
        });
        
        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una cita programada para esta fecha y hora'
            });
        }
        
        // Preparar datos de la nueva cita
        const newAppointment = {
            tipo: req.body.tipo,
            fecha: fecha,
            hora: req.body.hora,
            estado: req.body.estado || 'pendiente',
            notas: req.body.notas || '',
            fechaCreacion: new Date()
        };
        
        // Si es seguimiento de proyecto, validar y asignar proyecto
        if (req.body.tipo === 'seguimiento-proyecto') {
            if (!req.body.proyecto) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere especificar un proyecto para citas de seguimiento'
                });
            }
            
            try {
                const projectId = toObjectId(req.body.proyecto);
                
                // Verificar si existe el proyecto
                const project = await db.collection('projects').findOne({ _id: projectId });
                
                if (!project) {
                    return res.status(404).json({
                        success: false,
                        message: 'Proyecto no encontrado'
                    });
                }
                
                newAppointment.proyecto = projectId;
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de proyecto inválido'
                });
            }
        }
        
        // Manejar usuario
        if (req.body.usuario) {
            try {
                const userId = toObjectId(req.body.usuario);
                
                // Verificar si existe el usuario
                const user = await db.collection('users').findOne({ _id: userId });
                
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'Usuario no encontrado'
                    });
                }
                
                newAppointment.usuario = userId;
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido'
                });
            }
        } else {
            // Si no hay usuario registrado, requerir datos de contacto
            if (!req.body.nombreContacto || !req.body.correoContacto) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere nombre y correo de contacto para citas sin usuario registrado'
                });
            }
            
            newAppointment.nombreContacto = req.body.nombreContacto;
            newAppointment.correoContacto = req.body.correoContacto;
            newAppointment.telefonoContacto = req.body.telefonoContacto || '';
        }
        
        // Insertar cita
        const result = await db.collection('appointments').insertOne(newAppointment);
        
        // Si hay usuario, actualizar su lista de citas
        if (newAppointment.usuario) {
            await db.collection('users').updateOne(
                { _id: newAppointment.usuario },
                { $push: { citas: result.insertedId } }
            );
            
            // Enviar correo de confirmación
            try {
                const user = await db.collection('users').findOne({ _id: newAppointment.usuario });
                
                if (user) {
                    await emailService.sendAppointmentConfirmationEmail(user, {
                        id: result.insertedId,
                        tipo: newAppointment.tipo,
                        fecha: newAppointment.fecha,
                        hora: newAppointment.hora,
                        estado: newAppointment.estado
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar correo de confirmación:', emailError);
            }
        } else {
            // Enviar correo a contacto no registrado
            try {
                await emailService.sendGuestAppointmentConfirmationEmail({
                    nombre: newAppointment.nombreContacto,
                    correo: newAppointment.correoContacto
                }, {
                    id: result.insertedId,
                    tipo: newAppointment.tipo,
                    fecha: newAppointment.fecha,
                    hora: newAppointment.hora,
                    estado: newAppointment.estado
                });
            } catch (emailError) {
                console.error('Error al enviar correo de confirmación a invitado:', emailError);
            }
        }
        
        // Obtener cita creada con detalles
        const createdAppointment = await db.collection('appointments').findOne({ _id: result.insertedId });
        
        // Obtener detalles adicionales
        if (createdAppointment.usuario) {
            const user = await db.collection('users').findOne(
                { _id: createdAppointment.usuario },
                { projection: { nombre: 1, apellidos: 1, correo: 1, telefono: 1 } }
            );
            
            createdAppointment.usuarioDetalles = user || null;
        }
        
        if (createdAppointment.proyecto) {
            const project = await db.collection('projects').findOne(
                { _id: createdAppointment.proyecto },
                { projection: { nombre: 1, estado: 1 } }
            );
            
            createdAppointment.proyectoDetalles = project || null;
        }
        
        // Notificar a administradores sobre nueva cita
        try {
            // Obtener administradores
            const admins = await db.collection('users')
                .find({ rol: 'admin' })
                .project({ nombre: 1, correo: 1 })
                .toArray();
            
            // Enviar notificación a cada administrador
            for (const admin of admins) {
                await emailService.sendAdminAppointmentNotificationEmail(admin, {
                    id: result.insertedId,
                    tipo: newAppointment.tipo,
                    fecha: newAppointment.fecha,
                    hora: newAppointment.hora,
                    cliente: newAppointment.usuario 
                        ? createdAppointment.usuarioDetalles.nombre + ' ' + createdAppointment.usuarioDetalles.apellidos
                        : newAppointment.nombreContacto
                });
            }
        } catch (emailError) {
            console.error('Error al notificar a administradores:', emailError);
        }
        
        res.status(201).json({
            success: true,
            message: 'Cita creada correctamente',
            data: createdAppointment
        });
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cita',
            error: error.message
        });
    }
};

/**
 * Actualiza una cita existente
 */
exports.updateAppointment = async (req, res) => {
    try {
        const db = getDatabase();
        const appointmentId = req.params.id;
        
        // Comprobar si la cita existe
        const appointment = await db.collection('appointments').findOne({ _id: toObjectId(appointmentId) });
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }
        
        // Preparar datos de actualización
        const updateData = {};
        
        // Validar tipo de cita
        if (req.body.tipo !== undefined) {
            if (config.appointmentTypes.includes(req.body.tipo)) {
                updateData.tipo = req.body.tipo;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de cita inválido'
                });
            }
        }
        
        // Validar estado de cita
        if (req.body.estado !== undefined) {
            if (config.appointmentStatuses.includes(req.body.estado)) {
                updateData.estado = req.body.estado;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Estado de cita inválido'
                });
            }
        }
        
        // Validar y actualizar fecha y hora
        let fechaCambiada = false;
        
        if (req.body.fecha !== undefined || req.body.hora !== undefined) {
            const newFecha = req.body.fecha !== undefined 
                ? new Date(req.body.fecha) 
                : appointment.fecha;
            
            const newHora = req.body.hora !== undefined
                ? req.body.hora
                : appointment.hora;
            
            // Verificar si la fecha y hora están disponibles
            if (newFecha.toString() !== appointment.fecha.toString() || newHora !== appointment.hora) {
                const existingAppointment = await db.collection('appointments').findOne({
                    _id: { $ne: toObjectId(appointmentId) },
                    fecha: newFecha,
                    hora: newHora,
                    estado: { $in: ['pendiente', 'confirmada'] }
                });
                
                if (existingAppointment) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe una cita programada para esta fecha y hora'
                    });
                }
                
                fechaCambiada = true;
            }
            
            if (req.body.fecha !== undefined) {
                if (isNaN(newFecha.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Fecha de cita inválida'
                    });
                }
                
                updateData.fecha = newFecha;
            }
            
            if (req.body.hora !== undefined) {
                updateData.hora = newHora;
            }
        }
        
        // Actualizar notas
        if (req.body.notas !== undefined) {
            updateData.notas = req.body.notas;
        }
        
        // Actualizar proyecto
        if (req.body.proyecto !== undefined) {
            if (req.body.proyecto) {
                try {
                    const projectId = toObjectId(req.body.proyecto);
                    
                    // Verificar si existe el proyecto
                    const project = await db.collection('projects').findOne({ _id: projectId });
                    
                    if (!project) {
                        return res.status(404).json({
                            success: false,
                            message: 'Proyecto no encontrado'
                        });
                    }
                    
                    updateData.proyecto = projectId;
                } catch (err) {
                    return res.status(400).json({
                        success: false,
                        message: 'ID de proyecto inválido'
                    });
                }
            } else {
                updateData.proyecto = null;
            }
        }
        
        // Manejo del usuario
        let notifyNewUser = false;
        let oldUserId = null;
        let newUserId = null;
        
        if (req.body.usuario !== undefined) {
            if (req.body.usuario) {
                try {
                    const userId = toObjectId(req.body.usuario);
                    
                    // Verificar si existe el usuario
                    const user = await db.collection('users').findOne({ _id: userId });
                    
                    if (!user) {
                        return res.status(404).json({
                            success: false,
                            message: 'Usuario no encontrado'
                        });
                    }
                    
                    // Si hay cambio de usuario, guardar IDs para actualizar referencias
                    if (!appointment.usuario || appointment.usuario.toString() !== userId.toString()) {
                        oldUserId = appointment.usuario;
                        newUserId = userId;
                        notifyNewUser = true;
                    }
                    
                    updateData.usuario = userId;
                    
                    // Si se asigna un usuario, eliminar datos de contacto de invitado
                    updateData.nombreContacto = null;
                    updateData.correoContacto = null;
                    updateData.telefonoContacto = null;
                    
                } catch (err) {
                    return res.status(400).json({
                        success: false,
                        message: 'ID de usuario inválido'
                    });
                }
            } else {
                // Si se elimina el usuario, se requieren datos de contacto
                if (!req.body.nombreContacto || !req.body.correoContacto) {
                    return res.status(400).json({
                        success: false,
                        message: 'Se requiere nombre y correo de contacto para citas sin usuario registrado'
                    });
                }
                
                // Si había un usuario, guardar ID para quitar la referencia
                if (appointment.usuario) {
                    oldUserId = appointment.usuario;
                }
                
                updateData.usuario = null;
                updateData.nombreContacto = req.body.nombreContacto;
                updateData.correoContacto = req.body.correoContacto;
                updateData.telefonoContacto = req.body.telefonoContacto || '';
            }
        } else if (!appointment.usuario) {
            // Actualizar datos de contacto si no hay usuario
            if (req.body.nombreContacto !== undefined) {
                updateData.nombreContacto = req.body.nombreContacto;
            }
            
            if (req.body.correoContacto !== undefined) {
                updateData.correoContacto = req.body.correoContacto;
            }
            
            if (req.body.telefonoContacto !== undefined) {
                updateData.telefonoContacto = req.body.telefonoContacto;
            }
        }
        
        // Actualizar cita
        await db.collection('appointments').updateOne(
            { _id: toObjectId(appointmentId) },
            { $set: updateData }
        );
        
        // Actualizar referencias de usuarios si cambió
        if (oldUserId) {
            // Quitar referencia del usuario anterior
            await db.collection('users').updateOne(
                { _id: toObjectId(oldUserId) },
                { $pull: { citas: toObjectId(appointmentId) } }
            );
        }
        
        if (newUserId) {
            // Añadir referencia al nuevo usuario
            await db.collection('users').updateOne(
                { _id: newUserId },
                { $push: { citas: toObjectId(appointmentId) } }
            );
            
            // Notificar al nuevo usuario
            if (notifyNewUser) {
                try {
                    const user = await db.collection('users').findOne({ _id: newUserId });
                    
                    if (user) {
                        await emailService.sendAppointmentAssignmentEmail(user, {
                            id: toObjectId(appointmentId),
                            tipo: updateData.tipo || appointment.tipo,
                            fecha: updateData.fecha || appointment.fecha,
                            hora: updateData.hora || appointment.hora,
                            estado: updateData.estado || appointment.estado
                        });
                    }
                } catch (emailError) {
                    console.error('Error al enviar correo de asignación:', emailError);
                }
            }
        }
        
        // Notificar sobre cambio de estado
        if (updateData.estado && appointment.estado !== updateData.estado) {
            try {
                if (appointment.usuario) {
                    // Notificar al usuario registrado
                    const user = await db.collection('users').findOne({ _id: appointment.usuario });
                    
                    if (user) {
                        await emailService.sendAppointmentStatusUpdateEmail(user, {
                            id: toObjectId(appointmentId),
                            tipo: appointment.tipo,
                            fecha: updateData.fecha || appointment.fecha,
                            hora: updateData.hora || appointment.hora,
                            estadoAnterior: appointment.estado,
                            estadoNuevo: updateData.estado
                        });
                    }
                } else if (appointment.correoContacto) {
                    // Notificar al contacto no registrado
                    await emailService.sendGuestAppointmentStatusUpdateEmail({
                        nombre: appointment.nombreContacto,
                        correo: appointment.correoContacto
                    }, {
                        id: toObjectId(appointmentId),
                        tipo: appointment.tipo,
                        fecha: updateData.fecha || appointment.fecha,
                        hora: updateData.hora || appointment.hora,
                        estadoAnterior: appointment.estado,
                        estadoNuevo: updateData.estado
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar correo de actualización de estado:', emailError);
            }
        }
        
        // Notificar sobre cambio de fecha/hora
        if (fechaCambiada && (appointment.usuario || appointment.correoContacto)) {
            try {
                if (appointment.usuario) {
                    // Notificar al usuario registrado
                    const user = await db.collection('users').findOne({ _id: appointment.usuario });
                    
                    if (user) {
                        await emailService.sendAppointmentRescheduledEmail(user, {
                            id: toObjectId(appointmentId),
                            tipo: appointment.tipo,
                            fechaAnterior: appointment.fecha,
                            horaAnterior: appointment.hora,
                            fechaNueva: updateData.fecha || appointment.fecha,
                            horaNueva: updateData.hora || appointment.hora
                        });
                    }
                } else {
                    // Notificar al contacto no registrado
                    await emailService.sendGuestAppointmentRescheduledEmail({
                        nombre: appointment.nombreContacto,
                        correo: appointment.correoContacto
                    }, {
                        id: toObjectId(appointmentId),
                        tipo: appointment.tipo,
                        fechaAnterior: appointment.fecha,
                        horaAnterior: appointment.hora,
                        fechaNueva: updateData.fecha || appointment.fecha,
                        horaNueva: updateData.hora || appointment.hora
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar correo de reprogramación:', emailError);
            }
        }
        
        // Obtener cita actualizada
        const updatedAppointment = await db.collection('appointments').findOne({ _id: toObjectId(appointmentId) });
        
        // Obtener detalles adicionales
        if (updatedAppointment.usuario) {
            const user = await db.collection('users').findOne(
                { _id: updatedAppointment.usuario },
                { projection: { nombre: 1, apellidos: 1, correo: 1, telefono: 1 } }
            );
            
            updatedAppointment.usuarioDetalles = user || null;
        }
        
        if (updatedAppointment.proyecto) {
            const project = await db.collection('projects').findOne(
                { _id: updatedAppointment.proyecto },
                { projection: { nombre: 1, estado: 1 } }
            );
            
            updatedAppointment.proyectoDetalles = project || null;
        }
        
        res.status(200).json({
            success: true,
            message: 'Cita actualizada correctamente',
            data: updatedAppointment
        });
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar cita',
            error: error.message
        });
    }
};

/**
 * Elimina una cita
 */
exports.deleteAppointment = async (req, res) => {
    try {
        const db = getDatabase();
        const appointmentId = req.params.id;
        
        // Comprobar si la cita existe
        const appointment = await db.collection('appointments').findOne({ _id: toObjectId(appointmentId) });
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }
        
        // Eliminar cita
        await db.collection('appointments').deleteOne({ _id: toObjectId(appointmentId) });
        
        // Si tiene usuario, quitar referencia
        if (appointment.usuario) {
            await db.collection('users').updateOne(
                { _id: appointment.usuario },
                { $pull: { citas: toObjectId(appointmentId) } }
            );
            
            // Notificar al usuario sobre la cancelación
            try {
                const user = await db.collection('users').findOne({ _id: appointment.usuario });
                
                if (user) {
                    await emailService.sendAppointmentCancellationEmail(user, {
                        tipo: appointment.tipo,
                        fecha: appointment.fecha,
                        hora: appointment.hora
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar correo de cancelación:', emailError);
            }
        } else if (appointment.correoContacto) {
            // Notificar al contacto no registrado
            try {
                await emailService.sendGuestAppointmentCancellationEmail({
                    nombre: appointment.nombreContacto,
                    correo: appointment.correoContacto
                }, {
                    tipo: appointment.tipo,
                    fecha: appointment.fecha,
                    hora: appointment.hora
                });
            } catch (emailError) {
                console.error('Error al enviar correo de cancelación a invitado:', emailError);
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Cita eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cita',
            error: error.message
        });
    }
};