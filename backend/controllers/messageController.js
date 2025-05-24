/**
 * ARCHIVO: backend/controllers/messageController.js
 * Controlador para el módulo de mensajes
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
                                    { $and: [{ $eq: ['$leido', false] }, { $ne: ['$remitente', toObjectId(userId)] }] },
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
            
            conversations = [{
                _id: userId,
                messages: messages,
                totalMensajes: messages.length,
                mensajesNoLeidos: messages.filter(msg => !msg.leido && msg.esDeAdmin).length,
                ultimoAdmin: ultimoAdmin
            }];
        }
        
        res.status(200).json({
            success: true,
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
                    { projection: { nombre: 1, apellidos: 1, rol: 1 } }
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
                { $set: { leido: true, fechaLectura: new Date() } }
            );
        } else {
            // Cliente marca como leídos los mensajes de admin
            await db.collection('messages').updateMany(
                { 
                    cliente: toObjectId(clienteId),
                    esDeAdmin: true,
                    leido: false
                },
                { $set: { leido: true, fechaLectura: new Date() } }
            );
        }
        
        res.status(200).json({
            success: true,
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
            // Cliente enviando mensaje
            targetClienteId = toObjectId(userId);
            esDeAdmin = false;
        } else if (userRole === 'admin' || userRole === 'superadmin') {
            // Admin enviando mensaje
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
                await emailService.sendMessageNotificationToClient(cliente, {
                    adminName: `${remitente.nombre} ${remitente.apellidos}`,
                    mensaje: mensaje.trim(),
                    fechaEnvio: new Date()
                });
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
                    const ultimoAdmin = await db.collection('users').findOne(
                        { _id: ultimoMensajeAdmin.remitente }
                    );
                    
                    if (ultimoAdmin) {
                        await emailService.sendMessageNotificationToAdmin(ultimoAdmin, {
                            clientName: `${cliente.nombre} ${cliente.apellidos}`,
                            clientEmail: cliente.correo,
                            mensaje: mensaje.trim(),
                            fechaEnvio: new Date()
                        });
                    }
                } else {
                    // Si no hay admin previo, notificar a todos los admins
                    const admins = await db.collection('users')
                        .find({ rol: { $in: ['admin', 'superadmin'] } })
                        .toArray();
                    
                    for (const admin of admins) {
                        await emailService.sendMessageNotificationToAdmin(admin, {
                            clientName: `${cliente.nombre} ${cliente.apellidos}`,
                            clientEmail: cliente.correo,
                            mensaje: mensaje.trim(),
                            fechaEnvio: new Date()
                        });
                    }
                }
            }
        } catch (emailError) {
            console.error('Error al enviar notificación por email:', emailError);
            // No interrumpir el proceso por fallos de email
        }
        
        // Obtener mensaje creado con información del remitente
        const mensajeCreado = await db.collection('messages').findOne({ _id: result.insertedId });
        mensajeCreado.remitenteInfo = {
            nombre: remitente.nombre,
            apellidos: remitente.apellidos,
            rol: remitente.rol
        };
        
        res.status(201).json({
            success: true,
            message: 'Mensaje enviado correctamente',
            data: mensajeCreado
        });
        
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
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
                    fechaLectura: new Date() 
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
        
        const stats = await db.collection('messages').aggregate([
            {
                $group: {
                    _id: '$cliente',
                    totalMensajes: { $sum: 1 },
                    mensajesNoLeidos: {
                        $sum: {
                            $cond: [{ $eq: ['$leido', false] }, 1, 0]
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
