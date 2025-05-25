/**
 * CONTROLADOR DE MENSAJES ACTUALIZADO
 * Versión mejorada con mejor manejo de notificaciones y funcionalidades adicionales
 */

const { getDatabase, toObjectId } = require('../config/db').default;
const emailService = require('../services/emailService');

/**
 * Obtiene todas las conversaciones (para administradores) o conversación específica (para clientes)
 */
exports.getConversations = async (req, res) => {
    try {
        const db = getDatabase();
        const userId = req.user.id;
        const userRole = req.user.rol;
        
        let conversations = [];
        
        if (userRole === 'admin' || userRole === 'superadmin') {
            // Administradores ven todas las conversaciones
            const pipeline = [
                {
                    $match: { archivado: { $ne: true } } // Excluir mensajes archivados
                },
                {
                    $sort: { fechaCreacion: -1 }
                },
                {
                    $group: {
                        _id: '$cliente',
                        ultimoMensaje: { $first: '$$ROOT' },
                        totalMensajes: { $sum: 1 },
                        mensajesNoLeidos: {
                            $sum: {
                                $cond: [
                                    { 
                                        $and: [
                                            { $eq: ['$leido', false] }, 
                                            { $eq: ['$esDeAdmin', false] } // Solo contar mensajes de clientes no leídos
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'clienteInfo'
                    }
                },
                {
                    $unwind: '$clienteInfo'
                },
                {
                    $match: {
                        'clienteInfo.rol': 'cliente' // Solo mostrar conversaciones con clientes
                    }
                },
                {
                    $sort: { 'ultimoMensaje.fechaCreacion': -1 }
                }
            ];
            
            conversations = await db.collection('messages').aggregate(pipeline).toArray();
            
        } else if (userRole === 'cliente') {
            // Clientes solo ven su conversación
            const messages = await db.collection('messages')
                .find({ cliente: toObjectId(userId) })
                .sort({ fechaCreacion: -1 })
                .limit(50)
                .toArray();
            
            // Obtener información del último admin que respondió
            let ultimoAdmin = null;
            const adminMessage = messages.find(msg => msg.esDeAdmin === true);
            if (adminMessage && adminMessage.remitente) {
                ultimoAdmin = await db.collection('users').findOne(
                    { _id: adminMessage.remitente },
                    { projection: { nombre: 1, apellidos: 1, correo: 1 } }
                );
            }
            
            // Contar mensajes no leídos de administradores
            const mensajesNoLeidos = messages.filter(msg => !msg.leido && msg.esDeAdmin).length;
            
            conversations = [{
                _id: userId,
                messages: messages,
                totalMensajes: messages.length,
                mensajesNoLeidos: mensajesNoLeidos,
                ultimoAdmin: ultimoAdmin,
                clienteInfo: {
                    _id: toObjectId(userId),
                    nombre: req.user.nombre,
                    apellidos: req.user.apellidos,
                    correo: req.user.correo
                }
            }];
        }
        
        res.status(200).json({
            success: true,
            count: conversations.length,
            data: conversations
        });
        
    } catch (error) {
        console.error('Error al obtener conversaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener conversaciones',
            error: error.message
        });
    }
};

/**
 * Obtiene los mensajes de una conversación específica
 */
exports.getMessages = async (req, res) => {
    try {
        const db = getDatabase();
        const { clienteId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.rol;
        
        // Verificar permisos
        if (userRole === 'cliente' && clienteId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver esta conversación'
            });
        }
        
        // Obtener mensajes
        const messages = await db.collection('messages')
            .find({ cliente: toObjectId(clienteId) })
            .sort({ fechaCreacion: 1 })
            .toArray();
        
        // Obtener información de remitentes
        const messagesWithSenders = await Promise.all(messages.map(async (message) => {
            if (message.remitente) {
                const sender = await db.collection('users').findOne(
                    { _id: message.remitente },
                    { projection: { nombre: 1, apellidos: 1, rol: 1, correo: 1 } }
                );
                message.remitenteInfo = sender;
            }
            return message;
        }));
        
        // Marcar mensajes como leídos
        if (userRole === 'admin' || userRole === 'superadmin') {
            // Admin marca como leídos los mensajes del cliente
            await db.collection('messages').updateMany(
                { 
                    cliente: toObjectId(clienteId),
                    esDeAdmin: false,
                    leido: false
                },
                { 
                    $set: { 
                        leido: true, 
                        fechaLectura: new Date(),
                        leidoPor: toObjectId(userId)
                    } 
                }
            );
        } else {
            // Cliente marca como leídos los mensajes de admin
            await db.collection('messages').updateMany(
                { 
                    cliente: toObjectId(clienteId),
                    esDeAdmin: true,
                    leido: false
                },
                { 
                    $set: { 
                        leido: true, 
                        fechaLectura: new Date(),
                        leidoPor: toObjectId(userId)
                    } 
                }
            );
        }
        
        res.status(200).json({
            success: true,
            count: messagesWithSenders.length,
            data: messagesWithSenders
        });
        
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensajes',
            error: error.message
        });
    }
};

/**
 * Envía un nuevo mensaje
 */
exports.sendMessage = async (req, res) => {
    try {
        const db = getDatabase();
        const userId = req.user.id;
        const userRole = req.user.rol;
        const { clienteId, mensaje, adjuntos = [] } = req.body;
        
        // Validaciones
        if (!mensaje || mensaje.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El mensaje no puede estar vacío'
            });
        }
        
        let targetClienteId;
        let esDeAdmin = false;
        
        if (userRole === 'cliente') {
            // Cliente enviando mensaje a administradores
            targetClienteId = toObjectId(userId);
            esDeAdmin = false;
        } else if (userRole === 'admin' || userRole === 'superadmin') {
            // Admin enviando mensaje a cliente
            if (!clienteId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere especificar el cliente'
                });
            }
            targetClienteId = toObjectId(clienteId);
            esDeAdmin = true;
        } else {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para enviar mensajes'
            });
        }
        
        // Verificar que el cliente existe
        const cliente = await db.collection('users').findOne({ 
            _id: targetClienteId,
            rol: 'cliente'
        });
        
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // Crear mensaje
        const nuevoMensaje = {
            cliente: targetClienteId,
            remitente: toObjectId(userId),
            mensaje: mensaje.trim(),
            esDeAdmin: esDeAdmin,
            leido: false,
            fechaCreacion: new Date(),
            adjuntos: adjuntos || []
        };
        
        const result = await db.collection('messages').insertOne(nuevoMensaje);
        
        // Obtener información del remitente para notificaciones
        const remitente = await db.collection('users').findOne(
            { _id: toObjectId(userId) },
            { projection: { nombre: 1, apellidos: 1, correo: 1, rol: 1 } }
        );
        
        // Enviar notificaciones por email
        try {
            if (esDeAdmin) {
                // Admin respondiendo a cliente
                console.log('📧 Enviando notificación al cliente:', cliente.correo);
                
                await emailService.sendMessageNotificationToClient(cliente, {
                    adminName: `${remitente.nombre} ${remitente.apellidos}`,
                    mensaje: mensaje.trim(),
                    fechaEnvio: new Date()
                });
                
                console.log('✅ Notificación enviada al cliente exitosamente');
                
            } else {
                // Cliente enviando mensaje - notificar al último admin que le respondió
                const ultimoMensajeAdmin = await db.collection('messages')
                    .findOne(
                        { 
                            cliente: targetClienteId,
                            esDeAdmin: true
                        },
                        { sort: { fechaCreacion: -1 } }
                    );
                
                if (ultimoMensajeAdmin && ultimoMensajeAdmin.remitente) {
                    // Notificar al último admin que respondió
                    const ultimoAdmin = await db.collection('users').findOne(
                        { _id: ultimoMensajeAdmin.remitente }
                    );
                    
                    if (ultimoAdmin) {
                        console.log('📧 Enviando notificación al último admin:', ultimoAdmin.correo);
                        
                        await emailService.sendMessageNotificationToAdmin(ultimoAdmin, {
                            clientName: `${cliente.nombre} ${cliente.apellidos}`,
                            clientEmail: cliente.correo,
                            mensaje: mensaje.trim(),
                            fechaEnvio: new Date()
                        });
                        
                        console.log('✅ Notificación enviada al último admin exitosamente');
                    }
                } else {
                    // Si no hay admin previo, notificar a todos los admins
                    console.log('📧 Notificando a todos los administradores...');
                    
                    const admins = await db.collection('users')
                        .find({ rol: { $in: ['admin', 'superadmin'] } })
                        .toArray();
                    
                    const notificationPromises = admins.map(admin => 
                        emailService.sendMessageNotificationToAdmin(admin, {
                            clientName: `${cliente.nombre} ${cliente.apellidos}`,
                            clientEmail: cliente.correo,
                            mensaje: mensaje.trim(),
                            fechaEnvio: new Date()
                        })
                    );
                    
                    await Promise.all(notificationPromises);
                    console.log(`✅ Notificaciones enviadas a ${admins.length} administradores`);
                }
            }
        } catch (emailError) {
            console.error('❌ Error al enviar notificación por email:', emailError);
            // No interrumpir el proceso por fallos de email, pero registrar el error
        }
        
        // Obtener mensaje creado con información del remitente
        const mensajeCreado = await db.collection('messages').findOne({ _id: result.insertedId });
        mensajeCreado.remitenteInfo = {
            nombre: remitente.nombre,
            apellidos: remitente.apellidos,
            rol: remitente.rol,
            correo: remitente.correo
        };
        
        res.status(201).json({
            success: true,
            message: 'Mensaje enviado correctamente',
            data: mensajeCreado
        });
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar mensaje',
            error: error.message
        });
    }
};

/**
 * Marca mensajes como leídos
 */
exports.markMessagesAsRead = async (req, res) => {
    try {
        const db = getDatabase();
        const { clienteId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.rol;
        
        let filter = {};
        
        if (userRole === 'cliente') {
            // Cliente marca como leídos los mensajes de admin
            filter = {
                cliente: toObjectId(userId),
                esDeAdmin: true,
                leido: false
            };
        } else if (userRole === 'admin' || userRole === 'superadmin') {
            // Admin marca como leídos los mensajes del cliente
            if (!clienteId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere especificar el cliente'
                });
            }
            
            filter = {
                cliente: toObjectId(clienteId),
                esDeAdmin: false,
                leido: false
            };
        }
        
        const result = await db.collection('messages').updateMany(
            filter,
            { 
                $set: { 
                    leido: true, 
                    fechaLectura: new Date(),
                    leidoPor: toObjectId(userId)
                } 
            }
        );
        
        res.status(200).json({
            success: true,
            message: 'Mensajes marcados como leídos',
            modified: result.modifiedCount
        });
        
    } catch (error) {
        console.error('Error al marcar mensajes como leídos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar mensajes como leídos',
            error: error.message
        });
    }
};

/**
 * Obtiene estadísticas de mensajes (solo para admins)
 */
exports.getMessageStats = async (req, res) => {
    try {
        const db = getDatabase();
        const userRole = req.user.rol;
        
        // Verificar permisos
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver estadísticas'
            });
        }
        
        const stats = await db.collection('messages').aggregate([
            {
                $group: {
                    _id: '$cliente',
                    totalMensajes: { $sum: 1 },
                    mensajesNoLeidos: {
                        $sum: {
                            $cond: [
                                { 
                                    $and: [
                                        { $eq: ['$leido', false] }, 
                                        { $eq: ['$esDeAdmin', false] } // Solo mensajes de clientes no leídos
                                    ]
                                }, 
                                1, 
                                0
                            ]
                        }
                    },
                    ultimoMensaje: { $max: '$fechaCreacion' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalConversaciones: { $sum: 1 },
                    totalMensajes: { $sum: '$totalMensajes' },
                    totalNoLeidos: { $sum: '$mensajesNoLeidos' }
                }
            }
        ]).toArray();
        
        const result = stats[0] || {
            totalConversaciones: 0,
            totalMensajes: 0,
            totalNoLeidos: 0
        };
        
        // Obtener estadísticas adicionales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const mensajesHoy = await db.collection('messages').countDocuments({
            fechaCreacion: { $gte: today }
        });
        
        const mensajesClientesHoy = await db.collection('messages').countDocuments({
            fechaCreacion: { $gte: today },
            esDeAdmin: false
        });
        
        const mensajesAdminsHoy = await db.collection('messages').countDocuments({
            fechaCreacion: { $gte: today },
            esDeAdmin: true
        });
        
        result.mensajesHoy = mensajesHoy;
        result.mensajesClientesHoy = mensajesClientesHoy;
        result.mensajesAdminsHoy = mensajesAdminsHoy;
        
        res.status(200).json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

/**
 * Obtiene conversaciones archivadas
 */
exports.getArchivedConversations = async (req, res) => {
    try {
        const db = getDatabase();
        const userRole = req.user.rol;
        
        // Verificar permisos
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver conversaciones archivadas'
            });
        }
        
        // Obtener conversaciones archivadas
        const pipeline = [
            {
                $match: { archivado: true }
            },
            {
                $sort: { fechaArchivado: -1 }
            },
            {
                $group: {
                    _id: '$cliente',
                    ultimoMensaje: { $first: '$$ROOT' },
                    totalMensajes: { $sum: 1 },
                    fechaArchivado: { $first: '$fechaArchivado' },
                    archivadoPor: { $first: '$archivadoPor' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'clienteInfo'
                }
            },
            {
                $unwind: '$clienteInfo'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'archivadoPor',
                    foreignField: '_id',
                    as: 'archivadoPorInfo'
                }
            },
            {
                $unwind: { 
                    path: '$archivadoPorInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    'clienteInfo.rol': 'cliente'
                }
            },
            {
                $sort: { fechaArchivado: -1 }
            }
        ];
        
        const archivedConversations = await db.collection('messages').aggregate(pipeline).toArray();
        
        res.status(200).json({
            success: true,
            count: archivedConversations.length,
            data: archivedConversations
        });
        
    } catch (error) {
        console.error('Error al obtener conversaciones archivadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener conversaciones archivadas',
            error: error.message
        });
    }
};


/**
 * Archiva una conversación completa
 */
exports.archiveConversation = async (req, res) => {
    try {
        const db = getDatabase();
        const { clienteId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.rol;
        
        // Verificar permisos (solo admins pueden archivar)
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para archivar conversaciones'
            });
        }
        
        // Verificar que el cliente existe
        const cliente = await db.collection('users').findOne({ 
            _id: toObjectId(clienteId),
            rol: 'cliente'
        });
        
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // Marcar todos los mensajes de la conversación como archivados
        const result = await db.collection('messages').updateMany(
            { cliente: toObjectId(clienteId) },
            { 
                $set: { 
                    archivado: true,
                    fechaArchivado: new Date(),
                    archivadoPor: toObjectId(userId)
                } 
            }
        );
        
        console.log(`✅ Conversación archivada: ${result.modifiedCount} mensajes archivados`);
        
        // Enviar notificación por email al admin que archivó
        try {
            const admin = await db.collection('users').findOne({ _id: toObjectId(userId) });
            
            if (admin && typeof emailService.sendConversationArchivedNotification === 'function') {
                await emailService.sendConversationArchivedNotification(admin, {
                    clientName: `${cliente.nombre} ${cliente.apellidos}`,
                    totalMessages: result.modifiedCount
                });
            }
        } catch (emailError) {
            console.error('Error al enviar notificación de archivo:', emailError);
            // No interrumpir el proceso por fallos de email
        }
        
        res.status(200).json({
            success: true,
            message: 'Conversación archivada correctamente',
            data: {
                clienteId: clienteId,
                mensajesArchivados: result.modifiedCount,
                fechaArchivado: new Date()
            }
        });
        
    } catch (error) {
        console.error('Error al archivar conversación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al archivar conversación',
            error: error.message
        });
    }
};

/**
 * Restaura una conversación archivada
 */
exports.restoreConversation = async (req, res) => {
    try {
        const db = getDatabase();
        const { clienteId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.rol;
        
        // Verificar permisos (solo admins pueden restaurar)
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para restaurar conversaciones'
            });
        }
        
        // Restaurar todos los mensajes de la conversación
        const result = await db.collection('messages').updateMany(
            { cliente: toObjectId(clienteId) },
            { 
                $unset: { 
                    archivado: "",
                    fechaArchivado: "",
                    archivadoPor: ""
                }
            }
        );
        
        console.log(`✅ Conversación restaurada: ${result.modifiedCount} mensajes restaurados`);
        
        res.status(200).json({
            success: true,
            message: 'Conversación restaurada correctamente',
            data: {
                clienteId: clienteId,
                mensajesRestaurados: result.modifiedCount,
                fechaRestauracion: new Date()
            }
        });
        
    } catch (error) {
        console.error('Error al restaurar conversación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al restaurar conversación',
            error: error.message
        });
    }
};

/**
 * Busca mensajes
 */
exports.searchMessages = async (req, res) => {
    try {
        const db = getDatabase();
        const userId = req.user.id;
        const userRole = req.user.rol;
        const { q: searchTerm, limit = 20, page = 1 } = req.query;
        
        if (!searchTerm || searchTerm.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Término de búsqueda requerido'
            });
        }
        
        const skip = (page - 1) * limit;
        const searchRegex = new RegExp(searchTerm.trim(), 'i');
        
        let filter = {
            mensaje: searchRegex
        };
        
        // Filtrar según rol
        if (userRole === 'cliente') {
            filter.cliente = toObjectId(userId);
        }
        
        const messages = await db.collection('messages')
            .find(filter)
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();
        
        // Obtener información de remitentes y clientes
        const messagesWithDetails = await Promise.all(messages.map(async (message) => {
            const details = { ...message };
            
            // Información del remitente
            if (message.remitente) {
                const sender = await db.collection('users').findOne(
                    { _id: message.remitente },
                    { projection: { nombre: 1, apellidos: 1, rol: 1 } }
                );
                details.remitenteInfo = sender;
            }
            
            // Información del cliente
            if (message.cliente) {
                const client = await db.collection('users').findOne(
                    { _id: message.cliente },
                    { projection: { nombre: 1, apellidos: 1, correo: 1 } }
                );
                details.clienteInfo = client;
            }
            
            return details;
        }));
        
        const total = await db.collection('messages').countDocuments(filter);
        
        res.status(200).json({
            success: true,
            data: messagesWithDetails,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error en búsqueda de mensajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error en búsqueda de mensajes',
            error: error.message
        });
    }
};

/**
 * Elimina un mensaje específico (solo admins)
 */
exports.deleteMessage = async (req, res) => {
    try {
        const db = getDatabase();
        const { messageId } = req.params;
        const userRole = req.user.rol;
        
        // Verificar permisos
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar mensajes'
            });
        }
        
        // Verificar que el mensaje existe
        const message = await db.collection('messages').findOne({ 
            _id: toObjectId(messageId) 
        });
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado'
            });
        }
        
        // Eliminar mensaje
        await db.collection('messages').deleteOne({ _id: toObjectId(messageId) });
        
        res.status(200).json({
            success: true,
            message: 'Mensaje eliminado correctamente'
        });
        
    } catch (error) {
        console.error('Error al eliminar mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar mensaje',
            error: error.message
        });
    }
};

/**
 * Elimina una conversación completa (solo admins)
 */
exports.deleteConversation = async (req, res) => {
    try {
        const db = getDatabase();
        const { clienteId } = req.params;
        const userRole = req.user.rol;
        
        // Verificar permisos
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar conversaciones'
            });
        }
        
        // Verificar que el cliente existe
        const cliente = await db.collection('users').findOne({ 
            _id: toObjectId(clienteId),
            rol: 'cliente'
        });
        
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // Contar mensajes a eliminar
        const messageCount = await db.collection('messages').countDocuments({
            cliente: toObjectId(clienteId)
        });
        
        // Eliminar todos los mensajes de la conversación
        const result = await db.collection('messages').deleteMany({
            cliente: toObjectId(clienteId)
        });
        
        res.status(200).json({
            success: true,
            message: `Conversación eliminada correctamente. ${result.deletedCount} mensajes eliminados.`,
            deletedCount: result.deletedCount
        });
        
    } catch (error) {
        console.error('Error al eliminar conversación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar conversación',
            error: error.message
        });
    }
};

/**
 * Exporta mensajes de una conversación (solo admins)
 */
exports.exportConversation = async (req, res) => {
    try {
        const db = getDatabase();
        const { clienteId } = req.params;
        const userRole = req.user.rol;
        const { format = 'json' } = req.query;
        
        // Verificar permisos
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para exportar conversaciones'
            });
        }
        
        // Obtener información del cliente
        const cliente = await db.collection('users').findOne(
            { _id: toObjectId(clienteId) },
            { projection: { nombre: 1, apellidos: 1, correo: 1 } }
        );
        
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // Obtener todos los mensajes de la conversación
        const messages = await db.collection('messages')
            .find({ cliente: toObjectId(clienteId) })
            .sort({ fechaCreacion: 1 })
            .toArray();
        
        // Obtener detalles de remitentes
        const messagesWithDetails = await Promise.all(messages.map(async (message) => {
            if (message.remitente) {
                const sender = await db.collection('users').findOne(
                    { _id: message.remitente },
                    { projection: { nombre: 1, apellidos: 1, rol: 1 } }
                );
                return {
                    ...message,
                    remitenteInfo: sender
                };
            }
            return message;
        }));
        
        const exportData = {
            cliente: {
                nombre: cliente.nombre,
                apellidos: cliente.apellidos,
                correo: cliente.correo
            },
            totalMensajes: messages.length,
            fechaExportacion: new Date(),
            mensajes: messagesWithDetails
        };
        
        if (format === 'csv') {
            // Generar CSV
            const csvHeaders = ['Fecha', 'Remitente', 'Tipo', 'Mensaje', 'Leído'];
            const csvRows = messagesWithDetails.map(msg => [
                msg.fechaCreacion.toISOString(),
                msg.remitenteInfo ? `${msg.remitenteInfo.nombre} ${msg.remitenteInfo.apellidos}` : 'Desconocido',
                msg.esDeAdmin ? 'Admin' : 'Cliente',
                `"${msg.mensaje.replace(/"/g, '""')}"`, // Escapar comillas
                msg.leido ? 'Sí' : 'No'
            ]);
            
            const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="conversacion_${cliente.nombre}_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
        } else {
            // Generar JSON
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="conversacion_${cliente.nombre}_${new Date().toISOString().split('T')[0]}.json"`);
            res.json(exportData);
        }
        
    } catch (error) {
        console.error('Error al exportar conversación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar conversación',
            error: error.message
        });
    }
};

/**
 * Obtiene el historial de mensajes con paginación avanzada
 */
exports.getMessageHistory = async (req, res) => {
    try {
        const db = getDatabase();
        const userId = req.user.id;
        const userRole = req.user.rol;
        const { 
            page = 1, 
            limit = 20, 
            startDate, 
            endDate, 
            clienteId,
            unreadOnly = false 
        } = req.query;
        
        const skip = (page - 1) * limit;
        let filter = {};
        
        // Filtros según rol
        if (userRole === 'cliente') {
            filter.cliente = toObjectId(userId);
        } else if (clienteId) {
            filter.cliente = toObjectId(clienteId);
        }
        
        // Filtro de fechas
        if (startDate || endDate) {
            filter.fechaCreacion = {};
            if (startDate) {
                filter.fechaCreacion.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.fechaCreacion.$lte = new Date(endDate);
            }
        }
        
        // Filtro de no leídos
        if (unreadOnly === 'true') {
            filter.leido = false;
            if (userRole === 'admin' || userRole === 'superadmin') {
                filter.esDeAdmin = false; // Solo mensajes de clientes no leídos
            } else {
                filter.esDeAdmin = true; // Solo mensajes de admins no leídos
            }
        }
        
        const messages = await db.collection('messages')
            .find(filter)
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();
        
        const total = await db.collection('messages').countDocuments(filter);
        
        // Agregar detalles de remitentes
        const messagesWithDetails = await Promise.all(messages.map(async (message) => {
            const details = { ...message };
            
            if (message.remitente) {
                const sender = await db.collection('users').findOne(
                    { _id: message.remitente },
                    { projection: { nombre: 1, apellidos: 1, rol: 1 } }
                );
                details.remitenteInfo = sender;
            }
            
            if (message.cliente && (userRole === 'admin' || userRole === 'superadmin')) {
                const client = await db.collection('users').findOne(
                    { _id: message.cliente },
                    { projection: { nombre: 1, apellidos: 1, correo: 1 } }
                );
                details.clienteInfo = client;
            }
            
            return details;
        }));
        
        res.status(200).json({
            success: true,
            data: messagesWithDetails,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error al obtener historial de mensajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de mensajes',
            error: error.message
        });
    }
};