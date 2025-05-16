const { getDatabase, toObjectId } = require('../config/db');

/**
 * Obtener todas las citas con paginación y filtros
 * @param {Object} options - Opciones de consulta
 */
exports.getAppointments = async (options = {}) => {
    const db = getDatabase();
    
    const { page = 1, limit = 10, filter = {}, sort = { fecha: 1 } } = options;
    const skip = (page - 1) * limit;
    
    // Convertir filtros de IDs a ObjectId
    if (filter.usuario) {
        filter.usuario = toObjectId(filter.usuario);
    }
    
    if (filter.proyecto) {
        filter.proyecto = toObjectId(filter.proyecto);
    }
    
    // Filtro por fecha
    if (options.fecha) {
        const fecha = new Date(options.fecha);
        const startOfDay = new Date(fecha);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(fecha);
        endOfDay.setHours(23, 59, 59, 999);
        
        filter.fecha = {
            $gte: startOfDay,
            $lte: endOfDay
        };
    } else if (options.fechaInicio || options.fechaFin) {
        filter.fecha = {};
        
        if (options.fechaInicio) {
            filter.fecha.$gte = new Date(options.fechaInicio);
        }
        
        if (options.fechaFin) {
            filter.fecha.$lte = new Date(options.fechaFin);
        }
    }
    
    // Filtrar citas futuras
    if (options.futuras) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filter.fecha = filter.fecha || {};
        filter.fecha.$gte = today;
    }
    
    // Consulta principal
    const appointments = await db.collection('appointments')
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
    
    // Contar total de documentos
    const total = await db.collection('appointments').countDocuments(filter);
    
    // Agregar detalles adicionales a cada cita
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
    
    return {
        appointments: appointmentsWithDetails,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Obtener una cita por su ID
 * @param {String} id - ID de la cita
 */
exports.getAppointmentById = async (id) => {
    const db = getDatabase();
    
    const appointment = await db.collection('appointments').findOne({ _id: toObjectId(id) });
    
    if (!appointment) {
        return null;
    }
    
    // Obtener detalles del usuario
    if (appointment.usuario) {
        const user = await db.collection('users').findOne(
            { _id: appointment.usuario },
            { projection: { nombre: 1, apellidos: 1, correo: 1, telefono: 1, empresa: 1 } }
        );
        
        appointment.usuarioDetalles = user || null;
    }
    
    // Obtener detalles del proyecto
    if (appointment.proyecto) {
        const project = await db.collection('projects').findOne(
            { _id: appointment.proyecto },
            { projection: { nombre: 1, estado: 1, categoria: 1, porcentajeProgreso: 1 } }
        );
        
        appointment.proyectoDetalles = project || null;
    }
    
    return appointment;
};

/**
 * Crear una nueva cita
 * @param {Object} appointmentData - Datos de la cita
 */
exports.createAppointment = async (appointmentData) => {
    const db = getDatabase();
    
    // Convertir fecha a objeto Date
    const fecha = new Date(appointmentData.fecha);
    
    // Verificar disponibilidad de la hora
    const existingAppointment = await db.collection('appointments').findOne({
        fecha: fecha,
        hora: appointmentData.hora,
        estado: { $in: ['pendiente', 'confirmada'] }
    });
    
    if (existingAppointment) {
        throw new Error('Ya existe una cita programada para esta fecha y hora');
    }
    
    // Convertir IDs a ObjectId
    let usuario = null;
    let proyecto = null;
    
    // Validar usuario
    if (appointmentData.usuario) {
        usuario = toObjectId(appointmentData.usuario);
        
        // Verificar si existe el usuario
        const user = await db.collection('users').findOne({ _id: usuario });
        
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
    } else if (!appointmentData.nombreContacto || !appointmentData.correoContacto) {
        throw new Error('Se requiere usuario registrado o datos de contacto');
    }
    
    // Validar proyecto para citas de seguimiento
    if (appointmentData.tipo === 'seguimiento-proyecto') {
        if (!appointmentData.proyecto) {
            throw new Error('Se requiere proyecto para citas de seguimiento');
        }
        
        proyecto = toObjectId(appointmentData.proyecto);
        
        // Verificar si existe el proyecto
        const project = await db.collection('projects').findOne({ _id: proyecto });
        
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }
    } else if (appointmentData.proyecto) {
        proyecto = toObjectId(appointmentData.proyecto);
    }
    
    // Datos de la cita a guardar
    const newAppointment = {
        tipo: appointmentData.tipo,
        fecha: fecha,
        hora: appointmentData.hora,
        estado: appointmentData.estado || 'pendiente',
        usuario: usuario,
        proyecto: proyecto,
        notas: appointmentData.notas || '',
        fechaCreacion: new Date()
    };
    
    // Si no hay usuario registrado, guardar datos de contacto
    if (!usuario) {
        newAppointment.nombreContacto = appointmentData.nombreContacto;
        newAppointment.correoContacto = appointmentData.correoContacto;
        newAppointment.telefonoContacto = appointmentData.telefonoContacto || '';
    }
    
    // Insertar cita
    const result = await db.collection('appointments').insertOne(newAppointment);
    
    // Si hay usuario, actualizar su lista de citas
    if (usuario) {
        await db.collection('users').updateOne(
            { _id: usuario },
            { $push: { citas: result.insertedId } }
        );
    }
    
    // Obtener cita creada
    return exports.getAppointmentById(result.insertedId);
};

/**
 * Actualizar una cita existente
 * @param {String} id - ID de la cita
 * @param {Object} updateData - Datos a actualizar
 */
exports.updateAppointment = async (id, updateData) => {
    const db = getDatabase();
    
    // Obtener cita actual
    const appointment = await exports.getAppointmentById(id);
    
    if (!appointment) {
        throw new Error('Cita no encontrada');
    }
    
    // Datos a actualizar
    const updateFields = {};
    
    // Actualizar tipo
    if (updateData.tipo) {
        updateFields.tipo = updateData.tipo;
    }
    
    // Actualizar estado
    if (updateData.estado) {
        updateFields.estado = updateData.estado;
    }
    
    // Actualizar notas
    if (updateData.notas !== undefined) {
        updateFields.notas = updateData.notas;
    }
    
    // Manejar fecha y hora
    let fechaCambiada = false;
    
    if (updateData.fecha || updateData.hora) {
        const newFecha = updateData.fecha ? new Date(updateData.fecha) : appointment.fecha;
        const newHora = updateData.hora || appointment.hora;
        
        // Verificar disponibilidad
        if (newFecha.toString() !== appointment.fecha.toString() || newHora !== appointment.hora) {
            const existingAppointment = await db.collection('appointments').findOne({
                _id: { $ne: toObjectId(id) },
                fecha: newFecha,
                hora: newHora,
                estado: { $in: ['pendiente', 'confirmada'] }
            });
            
            if (existingAppointment) {
                throw new Error('Ya existe una cita programada para esta fecha y hora');
            }
            
            fechaCambiada = true;
        }
        
        if (updateData.fecha) {
            updateFields.fecha = newFecha;
        }
        
        if (updateData.hora) {
            updateFields.hora = newHora;
        }
    }
    
    // Manejar cambio de proyecto
    if (updateData.proyecto !== undefined) {
        if (updateData.proyecto) {
            const proyectoId = toObjectId(updateData.proyecto);
            
            // Verificar si existe el proyecto
            const project = await db.collection('projects').findOne({ _id: proyectoId });
            
            if (!project) {
                throw new Error('Proyecto no encontrado');
            }
            
            updateFields.proyecto = proyectoId;
        } else {
            updateFields.proyecto = null;
        }
    }
    
    // Manejar cambio de usuario
    if (updateData.usuario !== undefined) {
        const oldUserId = appointment.usuario;
        let newUserId = null;
        
        if (updateData.usuario) {
            newUserId = toObjectId(updateData.usuario);
            
            // Verificar si existe el usuario
            const user = await db.collection('users').findOne({ _id: newUserId });
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            updateFields.usuario = newUserId;
            
            // Eliminar datos de contacto si se asigna usuario
            updateFields.nombreContacto = null;
            updateFields.correoContacto = null;
            updateFields.telefonoContacto = null;
        } else {
            // Si se elimina el usuario, se requieren datos de contacto
            if (!updateData.nombreContacto || !updateData.correoContacto) {
                throw new Error('Se requiere nombre y correo de contacto para citas sin usuario registrado');
            }
            
            updateFields.usuario = null;
            updateFields.nombreContacto = updateData.nombreContacto;
            updateFields.correoContacto = updateData.correoContacto;
            updateFields.telefonoContacto = updateData.telefonoContacto || '';
        }
        
        // Actualizar referencias de usuarios
        if (oldUserId && (!newUserId || oldUserId.toString() !== newUserId.toString())) {
            // Quitar referencia del usuario anterior
            await db.collection('users').updateOne(
                { _id: oldUserId },
                { $pull: { citas: toObjectId(id) } }
            );
        }
        
        if (newUserId && (!oldUserId || oldUserId.toString() !== newUserId.toString())) {
            // Añadir referencia al nuevo usuario
            await db.collection('users').updateOne(
                { _id: newUserId },
                { $push: { citas: toObjectId(id) } }
            );
        }
    } else if (!appointment.usuario) {
        // Actualizar datos de contacto para citas sin usuario
        if (updateData.nombreContacto) {
            updateFields.nombreContacto = updateData.nombreContacto;
        }
        
        if (updateData.correoContacto) {
            updateFields.correoContacto = updateData.correoContacto;
        }
        
        if (updateData.telefonoContacto) {
            updateFields.telefonoContacto = updateData.telefonoContacto;
        }
    }
    
    // Actualizar cita
    await db.collection('appointments').updateOne(
        { _id: toObjectId(id) },
        { $set: updateFields }
    );
    
    // Obtener cita actualizada
    return exports.getAppointmentById(id);
};

/**
 * Eliminar una cita
 * @param {String} id - ID de la cita
 */
exports.deleteAppointment = async (id) => {
    const db = getDatabase();
    
    // Obtener cita actual
    const appointment = await exports.getAppointmentById(id);
    
    if (!appointment) {
        throw new Error('Cita no encontrada');
    }
    
    // Si tiene usuario, actualizar sus referencias
    if (appointment.usuario) {
        await db.collection('users').updateOne(
            { _id: appointment.usuario },
            { $pull: { citas: toObjectId(id) } }
        );
    }
    
    // Eliminar cita
    const result = await db.collection('appointments').deleteOne({ _id: toObjectId(id) });
    
    return result.deletedCount > 0;
};

/**
 * Obtener citas por fecha (para calendario)
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 */
exports.getAppointmentsByDateRange = async (startDate, endDate) => {
    const db = getDatabase();
    
    const appointments = await db.collection('appointments')
        .find({
            fecha: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
        .sort({ fecha: 1, hora: 1 })
        .toArray();
    
    // Agrupar citas por fecha
    const appointmentsByDate = {};
    
    appointments.forEach(appointment => {
        const dateKey = appointment.fecha.toISOString().split('T')[0];
        
        if (!appointmentsByDate[dateKey]) {
            appointmentsByDate[dateKey] = [];
        }
        
        appointmentsByDate[dateKey].push(appointment);
    });
    
    return appointmentsByDate;
};