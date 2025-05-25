// backend/controllers/notificationController.js

const { getDatabase } = require('../config/db').default;
const emailService = require('../services/emailService');

/**
 * Envía notificación por correo cuando un cliente solicita un nuevo proyecto
 * @route POST /api/notifications/project-request
 */
exports.sendProjectRequestNotification = async (req, res) => {
    try {
        console.log('📧 Procesando notificación de solicitud de proyecto...');
        
        const { cliente, proyecto } = req.body;
        
        // Validar datos requeridos
        if (!cliente || !proyecto) {
            return res.status(400).json({
                success: false,
                message: 'Datos de cliente y proyecto son requeridos'
            });
        }
        
        const db = getDatabase();
        
        // Obtener todos los administradores
        const administradores = await db.collection('users')
            .find({ 
                rol: { $in: ['admin', 'superadmin'] }
            })
            .project({ 
                nombre: 1, 
                apellidos: 1, 
                correo: 1 
            })
            .toArray();
        
        if (administradores.length === 0) {
            console.warn('⚠️ No se encontraron administradores para notificar');
            return res.status(200).json({
                success: true,
                message: 'No hay administradores para notificar',
                notificationsSent: 0
            });
        }
        
        console.log(`📬 Enviando notificaciones a ${administradores.length} administrador(es)...`);
        
        // Enviar notificación a cada administrador
        const notificationPromises = administradores.map(admin => 
            emailService.sendProjectRequestNotificationToAdmin(admin, {
                cliente,
                proyecto
            })
        );
        
        // También enviar confirmación al cliente
        notificationPromises.push(
            emailService.sendProjectRequestConfirmationToClient(cliente, proyecto)
        );
        
        // Ejecutar todas las notificaciones
        const results = await Promise.allSettled(notificationPromises);
        
        // Contar notificaciones exitosas
        const successfulNotifications = results.filter(result => result.status === 'fulfilled').length;
        const failedNotifications = results.filter(result => result.status === 'rejected').length;
        
        // Log de resultados
        console.log(`✅ Notificaciones exitosas: ${successfulNotifications}`);
        if (failedNotifications > 0) {
            console.warn(`⚠️ Notificaciones fallidas: ${failedNotifications}`);
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Error en notificación ${index + 1}:`, result.reason);
                }
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notificaciones procesadas',
            notificationsSent: successfulNotifications,
            notificationsFailed: failedNotifications,
            totalAdmins: administradores.length
        });
        
    } catch (error) {
        console.error('❌ Error al enviar notificaciones de solicitud de proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar notificaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// backend/services/emailService.js - Agregar estas funciones


/**
 * Envía confirmación por email al cliente sobre su solicitud de proyecto
 * @param {Object} cliente - Datos del cliente
 * @param {Object} proyecto - Datos del proyecto
 */
exports.sendProjectRequestConfirmationToClient = async (cliente, proyecto) => {
    try {
        console.log(`📧 Enviando confirmación de solicitud al cliente: ${cliente.correo}`);
        
        const categoryLabels = {
            'web-development': 'Desarrollo Web',
            'ecommerce': 'Tienda Online',
            'marketing-digital': 'Marketing Digital',
            'social-media': 'Redes Sociales',
            'seo': 'SEO',
            'branding': 'Branding',
            'design': 'Diseño Gráfico'
        };
        
        const emailContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">¡Solicitud Recibida!</h1>
                    <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.9;">Hemos recibido tu solicitud de proyecto</p>
                </div>
                
                <!-- Contenido Principal -->
                <div style="padding: 40px 30px;">
                    
                    <!-- Saludo Personal -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; font-size: 24px; margin: 0 0 15px 0;">¡Hola ${cliente.nombre}! 👋</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                            Gracias por confiar en <strong>Crazy Studios</strong> para tu próximo proyecto. Hemos recibido tu solicitud y estamos emocionados de trabajar contigo.
                        </p>
                    </div>
                    
                    <!-- Resumen del Proyecto -->
                    <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #667eea;">
                        <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px; display: flex; align-items: center; gap: 10px;">
                            📋 Resumen de tu Solicitud
                        </h3>
                        
                        <div style="margin-bottom: 15px;">
                            <div style="font-weight: 600; color: #667eea; margin-bottom: 5px;">Nombre del Proyecto</div>
                            <div style="color: #333; font-size: 18px; font-weight: 600;">${proyecto.nombre}</div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div>
                                <div style="font-weight: 600; color: #667eea; margin-bottom: 5px;">Categoría</div>
                                <div style="color: #333; font-size: 16px;">${categoryLabels[proyecto.categoria] || proyecto.categoria}</div>
                            </div>
                            <div>
                                <div style="font-weight: 600; color: #667eea; margin-bottom: 5px;">Fecha de Solicitud</div>
                                <div style="color: #333; font-size: 16px;">${new Date(proyecto.fechaSolicitud).toLocaleDateString('es-ES', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric'
                                })}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Próximos Pasos -->
                    <div style="background: linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #4facfe;">
                        <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px; display: flex; align-items: center; gap: 10px;">
                            🚀 ¿Qué sigue ahora?
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                            <div style="display: flex; align-items: flex-start; gap: 15px;">
                                <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
                                <div>
                                    <div style="font-weight: 600; color: #333; margin-bottom: 5px;">Revisión Interna</div>
                                    <div style="color: #666; font-size: 14px; line-height: 1.5;">Nuestro equipo revisará tu solicitud y evaluará los requerimientos.</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 15px;">
                                <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
                                <div>
                                    <div style="font-weight: 600; color: #333; margin-bottom: 5px;">Contacto Directo</div>
                                    <div style="color: #666; font-size: 14px; line-height: 1.5;">Te contactaremos en las próximas 24 horas para discutir los detalles.</div>
                                </div>
                            </div>
                            ${proyecto.requiereConsulta ? `
                            <div style="display: flex; align-items: flex-start; gap: 15px;">
                                <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
                                <div>
                                    <div style="font-weight: 600; color: #333; margin-bottom: 5px;">Consulta Gratuita</div>
                                    <div style="color: #666; font-size: 14px; line-height: 1.5;">Programaremos tu consulta gratuita como lo solicitaste.</div>
                                </div>
                            </div>
                            ` : `
                            <div style="display: flex; align-items: flex-start; gap: 15px;">
                                <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
                                <div>
                                    <div style="font-weight: 600; color: #333; margin-bottom: 5px;">Propuesta Personalizada</div>
                                    <div style="color: #666; font-size: 14px; line-height: 1.5;">Prepararemos una propuesta detallada para tu proyecto.</div>
                                </div>
                            </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Recordatorio -->
                    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; margin-bottom: 30px;">
                        <div style="display: flex; align-items: flex-start; gap: 15px;">
                            <div style="font-size: 24px;">💡</div>
                            <div>
                                <div style="font-weight: 600; color: #2e7d32; margin-bottom: 8px;">Mientras tanto...</div>
                                <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
                                    <li style="margin-bottom: 5px;">Puedes revisar el estado de tu solicitud en tu dashboard de cliente</li>
                                    <li style="margin-bottom: 5px;">Recopila cualquier material adicional que puedas tener</li>
                                    <li>Si tienes preguntas urgentes, no dudes en contactarnos</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Botones de Acción -->
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/html/dashboard.html" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                💼 Ir a mi Dashboard
                            </a>
                            <a href="mailto:soporte@crazystudios.com?subject=Consulta sobre mi solicitud de proyecto: ${proyecto.nombre}" 
                               style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);">
                                📧 Contactar Soporte
                            </a>
                        </div>
                    </div>
                    
                    <!-- Información de Contacto -->
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; text-align: center;">
                        <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 16px;">📞 ¿Necesitas ayuda inmediata?</h3>
                        <div style="color: #6c757d; font-size: 14px;">
                            <p style="margin: 5px 0;">📧 Email: <a href="mailto:soporte@crazystudios.com" style="color: #667eea;">soporte@crazystudios.com</a></p>
                            <p style="margin: 5px 0;">💬 También puedes escribirnos directamente desde tu dashboard</p>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                        © ${new Date().getFullYear()} Crazy Studios. Gracias por confiar en nosotros.
                    </p>
                    <p style="margin: 0; color: #6c757d; font-size: 12px;">
                        Este es un correo de confirmación automático. Responderemos personalmente muy pronto.
                    </p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: cliente.correo,
            subject: `✅ Confirmación de Solicitud: ${proyecto.nombre} - Crazy Studios`,
            html: emailContent
        });
        
        console.log(`✅ Confirmación enviada exitosamente al cliente: ${cliente.correo}`);
        
    } catch (error) {
        console.error(`❌ Error al enviar confirmación al cliente ${cliente.correo}:`, error);
        throw error;
    }
};