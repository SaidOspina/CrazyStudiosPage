const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Configuración del transporte de email usando nodemailer
 */
const createTransporter = () => {
    const transporterConfig = {
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true solo para puerto 465
        auth: {
            user: config.email.user,
            pass: config.email.password
        },
        // Configuraciones para mejorar la estabilidad
        connectionTimeout: 10000, // 10 segundos
        greetingTimeout: 10000, // 10 segundos
        socketTimeout: 10000, // 10 segundos
        // Reintento si hay fallos
        tls: {
            rejectUnauthorized: true // Verificar certificado SSL/TLS
        }
    };
    
    console.log('Configurando transporte de email con:', {
        host: transporterConfig.host,
        port: transporterConfig.port,
        secure: transporterConfig.secure,
        user: transporterConfig.auth.user
    });
    
    return nodemailer.createTransport(transporterConfig);
};

/**
 * Envía un email usando la configuración establecida
 * @param {Object} options - Opciones de email
 */
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `${config.email.from.name} <${config.email.from.email}>`,
            to: options.to,
            subject: options.subject,
            html: options.html
        };
        
        // Añadir CC si está presente
        if (options.cc) {
            mailOptions.cc = options.cc;
        }
        
        // Añadir BCC si está presente
        if (options.bcc) {
            mailOptions.bcc = options.bcc;
        }
        
        // Añadir adjuntos si están presentes
        if (options.attachments) {
            mailOptions.attachments = options.attachments;
        }
        
        console.log(`Intentando enviar email a: ${options.to}`);
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email enviado correctamente. ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('Error al enviar email:', {
            message: error.message,
            code: error.code,
            command: error.command,
            stack: error.stack
        });
        throw error;
    }
};

/**
 * Envía un email de bienvenida a un nuevo usuario
 * @param {Object} user - Datos del usuario
 */
exports.sendWelcomeEmail = async (user) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">¡Bienvenido a Crazy Studios!</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${user.nombre},</p>
                    <p>Gracias por registrarte en Crazy Studios. Estamos emocionados de tenerte con nosotros y ayudarte a hacer realidad tus proyectos.</p>
                    <p>Con tu cuenta podrás:</p>
                    <ul>
                        <li>Solicitar cotizaciones para tus proyectos</li>
                        <li>Agendar citas de consultoría</li>
                        <li>Dar seguimiento al avance de tus proyectos</li>
                        <li>Comunicarte directamente con nuestro equipo</li>
                    </ul>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    <p>¡Esperamos trabajar contigo pronto!</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: user.correo,
            subject: '¡Bienvenido a Crazy Studios!',
            html: emailContent
        });
        
        console.log(`Email de bienvenida enviado a ${user.correo}`);
    } catch (error) {
        console.error('Error al enviar email de bienvenida:', error);
        throw error;
    }
};

/**
 * Envía un email para restablecer la contraseña
 * @param {Object} user - Datos del usuario
 */
exports.sendPasswordResetEmail = async (user) => {
    try {
        // URL de restablecimiento (frontend)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${user.resetToken}`;
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Restablecimiento de Contraseña</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${user.nombre},</p>
                    <p>Has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace para crear una nueva contraseña:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
                    </p>
                    <p>Este enlace expirará en 10 minutos.</p>
                    <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá siendo la misma.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: user.correo,
            subject: 'Restablecimiento de Contraseña - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de restablecimiento enviado a ${user.correo}`);
    } catch (error) {
        console.error('Error al enviar email de restablecimiento:', error);
        throw error;
    }
};

/**
 * Envía un email de notificación de cambio de contraseña
 * @param {Object} user - Datos del usuario
 */
exports.sendPasswordChangedEmail = async (user) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Cambio de Contraseña</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${user.nombre},</p>
                    <p>Tu contraseña ha sido cambiada exitosamente.</p>
                    <p>Si tú no realizaste este cambio, por favor contáctanos inmediatamente.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: user.correo,
            subject: 'Contraseña Cambiada - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de notificación de cambio de contraseña enviado a ${user.correo}`);
    } catch (error) {
        console.error('Error al enviar email de notificación:', error);
        throw error;
    }
};

/**
 * Envía un email de notificación sobre la creación de un proyecto
 * @param {Object} client - Datos del cliente
 * @param {Object} project - Datos del proyecto
 */
exports.sendProjectCreationEmail = async (client, project) => {
    try {
        const projectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}`;
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Nuevo Proyecto Creado</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${client.nombre},</p>
                    <p>Se ha creado un nuevo proyecto para ti:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Nombre del Proyecto:</strong> ${project.nombre}</p>
                        <p><strong>Estado:</strong> ${project.estado}</p>
                    </div>
                    <p>Puedes ver los detalles completos del proyecto en tu cuenta:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${projectUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Proyecto</a>
                    </p>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: client.correo,
            subject: 'Nuevo Proyecto Creado - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de notificación de proyecto enviado a ${client.correo}`);
    } catch (error) {
        console.error('Error al enviar email de notificación de proyecto:', error);
        throw error;
    }
};

/**
 * Envía un email de notificación sobre asignación de proyecto
 * @param {Object} client - Datos del cliente
 * @param {Object} project - Datos del proyecto
 */
exports.sendProjectAssignmentEmail = async (client, project) => {
    try {
        const projectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}`;
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Proyecto Asignado</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${client.nombre},</p>
                    <p>Se te ha asignado un proyecto:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Nombre del Proyecto:</strong> ${project.nombre}</p>
                        <p><strong>Estado:</strong> ${project.estado}</p>
                    </div>
                    <p>Puedes ver los detalles completos del proyecto en tu cuenta:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${projectUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Proyecto</a>
                    </p>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: client.correo,
            subject: 'Proyecto Asignado - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de asignación de proyecto enviado a ${client.correo}`);
    } catch (error) {
        console.error('Error al enviar email de asignación de proyecto:', error);
        throw error;
    }
};

/**
 * Envía un email de notificación sobre actualización de estado de proyecto
 * @param {Object} client - Datos del cliente
 * @param {Object} project - Datos del proyecto
 */
exports.sendProjectStatusUpdateEmail = async (client, project) => {
    try {
        const projectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}`;
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Actualización de Proyecto</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${client.nombre},</p>
                    <p>El estado de tu proyecto <strong>${project.nombre}</strong> ha sido actualizado:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Estado Anterior:</strong> ${project.estadoAnterior}</p>
                        <p><strong>Nuevo Estado:</strong> ${project.estadoNuevo}</p>
                    </div>
                    <p>Puedes ver los detalles completos del proyecto en tu cuenta:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${projectUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Proyecto</a>
                    </p>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: client.correo,
            subject: 'Actualización de Proyecto - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de actualización de proyecto enviado a ${client.correo}`);
    } catch (error) {
        console.error('Error al enviar email de actualización de proyecto:', error);
        throw error;
    }
};

/**
 * Envía un email de notificación sobre eliminación de proyecto
 * @param {Object} client - Datos del cliente
 * @param {Object} project - Datos del proyecto
 */
exports.sendProjectDeletionEmail = async (client, project) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Proyecto Eliminado</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${client.nombre},</p>
                    <p>Te informamos que el proyecto <strong>${project.nombre}</strong> ha sido eliminado de nuestro sistema.</p>
                    <p>Si tienes alguna pregunta o consideras que esto ha sido un error, por favor contáctanos inmediatamente.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: client.correo,
            subject: 'Proyecto Eliminado - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de eliminación de proyecto enviado a ${client.correo}`);
    } catch (error) {
        console.error('Error al enviar email de eliminación de proyecto:', error);
        throw error;
    }
};

/**
 * Envía un email de confirmación de cita
 * @param {Object} user - Datos del usuario
 * @param {Object} appointment - Datos de la cita
 */
exports.sendAppointmentConfirmationEmail = async (user, appointment) => {
    try {
        const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Confirmación de Cita</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${user.nombre},</p>
                    <p>Tu cita ha sido confirmada con los siguientes detalles:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Hora:</strong> ${appointment.hora}</p>
                        <p><strong>Estado:</strong> ${appointment.estado}</p>
                    </div>
                    <p>Recuerda que puedes ver, modificar o cancelar tu cita desde tu cuenta.</p>
                    <p>Si tienes alguna pregunta o necesitas reprogramar, contáctanos con antelación.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: user.correo,
            subject: 'Confirmación de Cita - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de confirmación de cita enviado a ${user.correo}`);
    } catch (error) {
        console.error('Error al enviar email de confirmación de cita:', error);
        throw error;
    }
};

/**
 * Envía un email de confirmación de cita a un usuario no registrado
 * @param {Object} contact - Datos de contacto
 * @param {Object} appointment - Datos de la cita
 */
exports.sendGuestAppointmentConfirmationEmail = async (contact, appointment) => {
    try {
        const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Confirmación de Cita</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${contact.nombre},</p>
                    <p>Tu cita ha sido confirmada con los siguientes detalles:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Hora:</strong> ${appointment.hora}</p>
                        <p><strong>Estado:</strong> ${appointment.estado}</p>
                    </div>
                    <p>Para modificar o cancelar tu cita, por favor contáctanos directamente respondiendo a este correo o llamando a nuestro número de atención.</p>
                    <p>Considera crear una cuenta en nuestra plataforma para gestionar tus citas más fácilmente en el futuro.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: contact.correo,
            subject: 'Confirmación de Cita - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de confirmación de cita enviado a invitado ${contact.correo}`);
    } catch (error) {
        console.error('Error al enviar email de confirmación de cita a invitado:', error);
        throw error;
    }
};

/**
 * Envía un email de asignación de cita
 * @param {Object} user - Datos del usuario
 * @param {Object} appointment - Datos de la cita
 */
exports.sendAppointmentAssignmentEmail = async (user, appointment) => {
    try {
        const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Cita Asignada</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${user.nombre},</p>
                    <p>Se te ha asignado una cita con los siguientes detalles:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Hora:</strong> ${appointment.hora}</p>
                        <p><strong>Estado:</strong> ${appointment.estado}</p>
                    </div>
                    <p>Puedes ver, modificar o cancelar esta cita desde tu cuenta.</p>
                    <p>Si tienes alguna pregunta o necesitas reprogramar, contáctanos con antelación.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: user.correo,
            subject: 'Cita Asignada - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de asignación de cita enviado a ${user.correo}`);
    } catch (error) {
        console.error('Error al enviar email de asignación de cita:', error);
        throw error;
    }
};

/**
 * Envía un email de actualización de estado de cita
 * @param {Object} user - Datos del usuario
 * @param {Object} appointment - Datos de la cita
 */
exports.sendAppointmentStatusUpdateEmail = async (user, appointment) => {
    try {
        const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const estadosCita = {
            'pendiente': 'Pendiente',
            'confirmada': 'Confirmada',
            'cancelada': 'Cancelada',
            'completada': 'Completada'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Actualización de Cita</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${user.nombre},</p>
                    <p>El estado de tu cita ha sido actualizado:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Hora:</strong> ${appointment.hora}</p>
                        <p><strong>Estado Anterior:</strong> ${estadosCita[appointment.estadoAnterior] || appointment.estadoAnterior}</p>
                        <p><strong>Estado Nuevo:</strong> ${estadosCita[appointment.estadoNuevo] || appointment.estadoNuevo}</p>
                    </div>
                    <p>Puedes ver los detalles de tu cita en tu cuenta.</p>
                    <p>Si tienes alguna pregunta o necesitas asistencia, contáctanos.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: user.correo,
            subject: 'Actualización de Cita - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de actualización de cita enviado a ${user.correo}`);
    } catch (error) {
        console.error('Error al enviar email de actualización de cita:', error);
        throw error;
    }
};

/**
 * Envía un email de actualización de estado de cita a un usuario no registrado
 * @param {Object} contact - Datos de contacto
 * @param {Object} appointment - Datos de la cita
 */
exports.sendGuestAppointmentStatusUpdateEmail = async (contact, appointment) => {
    try {
        const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const estadosCita = {
            'pendiente': 'Pendiente',
            'confirmada': 'Confirmada',
            'cancelada': 'Cancelada',
            'completada': 'Completada'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Actualización de Cita</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${contact.nombre},</p>
                    <p>El estado de tu cita ha sido actualizado:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Hora:</strong> ${appointment.hora}</p>
                        <p><strong>Estado Anterior:</strong> ${estadosCita[appointment.estadoAnterior] || appointment.estadoAnterior}</p>
                        <p><strong>Estado Nuevo:</strong> ${estadosCita[appointment.estadoNuevo] || appointment.estadoNuevo}</p>
                    </div>
                    <p>Para cualquier consulta o modificación, por favor contáctanos directamente respondiendo a este correo o llamando a nuestro número de atención.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: contact.correo,
            subject: 'Actualización de Cita - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de actualización de cita enviado a invitado ${contact.correo}`);
    } catch (error) {
        console.error('Error al enviar email de actualización de cita a invitado:', error);
        throw error;
    }
};

/**
 * Envía un email de reprogramación de cita
 * @param {Object} user - Datos del usuario
 * @param {Object} appointment - Datos de la cita
 */
exports.sendAppointmentRescheduledEmail = async (user, appointment) => {
    try {
        const fechaAnterior = new Date(appointment.fechaAnterior).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const fechaNueva = new Date(appointment.fechaNueva).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Cita Reprogramada</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${user.nombre},</p>
                    <p>Tu cita ha sido reprogramada:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha Anterior:</strong> ${fechaAnterior}</p>
                        <p><strong>Hora Anterior:</strong> ${appointment.horaAnterior}</p>
                        <p><strong>Nueva Fecha:</strong> ${fechaNueva}</p>
                        <p><strong>Nueva Hora:</strong> ${appointment.horaNueva}</p>
                    </div>
                    <p>Si esta nueva fecha y hora no te conviene, por favor contáctanos lo antes posible para buscar una alternativa.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: user.correo,
            subject: 'Cita Reprogramada - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de reprogramación de cita enviado a ${user.correo}`);
    } catch (error) {
        console.error('Error al enviar email de reprogramación de cita:', error);
        throw error;
    }
};

/**
 * Envía un email de reprogramación de cita a un usuario no registrado
 * @param {Object} contact - Datos de contacto
 * @param {Object} appointment - Datos de la cita
 */
exports.sendGuestAppointmentRescheduledEmail = async (contact, appointment) => {
    try {
        const fechaAnterior = new Date(appointment.fechaAnterior).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const fechaNueva = new Date(appointment.fechaNueva).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Cita Reprogramada</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${contact.nombre},</p>
                    <p>Tu cita ha sido reprogramada:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha Anterior:</strong> ${fechaAnterior}</p>
                        <p><strong>Hora Anterior:</strong> ${appointment.horaAnterior}</p>
                        <p><strong>Nueva Fecha:</strong> ${fechaNueva}</p>
                        <p><strong>Nueva Hora:</strong> ${appointment.horaNueva}</p>
                    </div>
                    <p>Si esta nueva fecha y hora no te conviene, por favor contáctanos lo antes posible para buscar una alternativa.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: contact.correo,
            subject: 'Cita Reprogramada - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de reprogramación de cita enviado a invitado ${contact.correo}`);
    } catch (error) {
        console.error('Error al enviar email de reprogramación de cita a invitado:', error);
        throw error;
    }
};

/**
 * Envía un email de cancelación de cita
 * @param {Object} user - Datos del usuario
 * @param {Object} appointment - Datos de la cita
 */
exports.sendAppointmentCancellationEmail = async (user, appointment) => {
    try {
        const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Cita Cancelada</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${user.nombre},</p>
                    <p>Te confirmamos que tu cita ha sido cancelada:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Hora:</strong> ${appointment.hora}</p>
                    </div>
                    <p>Si deseas programar una nueva cita, puedes hacerlo desde tu cuenta o contactándonos directamente.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: user.correo,
            subject: 'Cita Cancelada - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de cancelación de cita enviado a ${user.correo}`);
    } catch (error) {
        console.error('Error al enviar email de cancelación de cita:', error);
        throw error;
    }
};

/**
 * Envía un email de cancelación de cita a un usuario no registrado
 * @param {Object} contact - Datos de contacto
 * @param {Object} appointment - Datos de la cita
 */
exports.sendGuestAppointmentCancellationEmail = async (contact, appointment) => {
    try {
        const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Cita Cancelada</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${contact.nombre},</p>
                    <p>Te confirmamos que tu cita ha sido cancelada:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Hora:</strong> ${appointment.hora}</p>
                    </div>
                    <p>Si deseas programar una nueva cita, puedes contactarnos directamente.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: contact.correo,
            subject: 'Cita Cancelada - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de cancelación de cita enviado a invitado ${contact.correo}`);
    } catch (error) {
        console.error('Error al enviar email de cancelación de cita a invitado:', error);
        throw error;
    }
};

/**
 * Envía un email de notificación de nueva cita a los administradores
 * @param {Object} admin - Datos del administrador
 * @param {Object} appointment - Datos de la cita
 */
exports.sendAdminAppointmentNotificationEmail = async (admin, appointment) => {
    try {
        const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tiposCita = {
            'consulta-general': 'Consulta General',
            'plan-personalizado': 'Plan Personalizado',
            'seguimiento-proyecto': 'Seguimiento de Proyecto'
        };
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a4a4a;">Nueva Cita Programada</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${admin.nombre},</p>
                    <p>Se ha programado una nueva cita:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Cliente:</strong> ${appointment.cliente}</p>
                        <p><strong>Tipo de Cita:</strong> ${tiposCita[appointment.tipo] || appointment.tipo}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Hora:</strong> ${appointment.hora}</p>
                    </div>
                    <p>Recuerda revisar los detalles completos en el sistema y confirmar la cita si es necesario.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p>© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: admin.correo,
            subject: 'Nueva Cita Programada - Crazy Studios',
            html: emailContent
        });
        
        console.log(`Email de notificación de cita enviado a administrador ${admin.correo}`);
    } catch (error) {
        console.error('Error al enviar email de notificación a administrador:', error);
        throw error;
    }
};

// Añadir esta función a emailService.js
exports.testConnection = async () => {
    try {
        const transporter = createTransporter();
        
        // Verificar la conexión
        const verification = await transporter.verify();
        
        console.log('Conexión SMTP verificada correctamente:', verification);
        return { success: true, message: 'Conexión SMTP establecida correctamente' };
    } catch (error) {
        console.error('Error al verificar conexión SMTP:', error);
        return { 
            success: false, 
            message: 'Error al verificar conexión SMTP', 
            error: {
                message: error.message,
                code: error.code
            }
        };
    }
};

/**
 * Envía notificación por email a un cliente cuando un admin le responde (VERSIÓN MEJORADA)
 * @param {Object} client - Datos del cliente
 * @param {Object} messageData - Datos del mensaje
 */
exports.sendMessageNotificationToClient = async (client, messageData) => {
    try {
        console.log('📧 Enviando notificación de mensaje al cliente:', client.correo);
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                <!-- Header con logo -->
                <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
                    <h1 style="color: #007bff; margin: 0; font-size: 24px;">💬 Nueva Respuesta de Crazy Studios</h1>
                </div>
                
                <!-- Saludo personalizado -->
                <div style="color: #333; line-height: 1.6; font-size: 16px;">
                    <p style="margin-bottom: 20px;">¡Hola <strong>${client.nombre}</strong>!</p>
                    
                    <p style="margin-bottom: 25px;">
                        <strong style="color: #007bff;">${messageData.adminName}</strong> de nuestro equipo te ha enviado una respuesta:
                    </p>
                    
                    <!-- Mensaje destacado -->
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-left: 4px solid #007bff; margin: 25px 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="display: flex; align-items: flex-start; gap: 15px;">
                            <div style="background-color: #007bff; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">
                                ${messageData.adminName.charAt(0).toUpperCase()}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #007bff; margin-bottom: 8px;">
                                    ${messageData.adminName} - Crazy Studios
                                </div>
                                <div style="color: #333; font-style: italic; line-height: 1.5; font-size: 15px;">
                                    "${messageData.mensaje}"
                                </div>
                                <div style="margin-top: 12px; font-size: 13px; color: #666;">
                                    📅 ${messageData.fechaEnvio.toLocaleDateString('es-ES', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Call to action -->
                    <div style="text-align: center; margin: 35px 0;">
                        <p style="margin-bottom: 20px; color: #555;">
                            Para ver la conversación completa y responder, accede a tu cuenta:
                        </p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                           style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3); transition: all 0.3s ease;">
                            💬 Ver y Responder Mensaje
                        </a>
                    </div>
                    
                    <!-- Información adicional -->
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 25px 0;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                            <strong>💡 Consejo:</strong> Mantén una comunicación fluida con nuestro equipo para obtener los mejores resultados en tu proyecto.
                        </p>
                    </div>
                    
                    <p style="margin-top: 25px; color: #555;">
                        Si tienes alguna pregunta adicional, no dudes en responder a través de tu panel de cliente.
                    </p>
                    
                    <p style="color: #007bff; font-weight: 600;">
                        ¡Gracias por confiar en Crazy Studios! 🚀
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} Crazy Studios. Todos los derechos reservados.</p>
                    <p style="margin: 0;">Este mensaje fue enviado porque tienes una cuenta activa en nuestro sistema.</p>
                    <p style="margin: 10px 0 0 0; color: #007bff;">
                        <a href="mailto:soporte@crazystudios.com" style="color: #007bff; text-decoration: none;">📧 soporte@crazystudios.com</a>
                    </p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: client.correo,
            subject: `💬 Nueva respuesta de ${messageData.adminName} - Crazy Studios`,
            html: emailContent
        });
        
        console.log('✅ Notificación de mensaje enviada al cliente:', client.correo);
        
    } catch (error) {
        console.error('❌ Error al enviar notificación de mensaje al cliente:', error);
        throw error;
    }
};

/**
 * Envía notificación por email a un admin cuando un cliente envía un mensaje (VERSIÓN MEJORADA)
 * @param {Object} admin - Datos del administrador
 * @param {Object} messageData - Datos del mensaje
 */
exports.sendMessageNotificationToAdmin = async (admin, messageData) => {
    try {
        console.log('📧 Enviando notificación de mensaje al admin:', admin.correo);
        
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); border-radius: 8px; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">🔔 Nuevo Mensaje de Cliente</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Requiere tu atención</p>
                </div>
                
                <!-- Información del cliente -->
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #28a745;">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">👤 Información del Cliente</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <strong style="color: #495057;">Nombre:</strong><br>
                            <span style="color: #007bff; font-size: 16px; font-weight: 600;">${messageData.clientName}</span>
                        </div>
                        <div>
                            <strong style="color: #495057;">Email:</strong><br>
                            <a href="mailto:${messageData.clientEmail}" style="color: #007bff; text-decoration: none;">${messageData.clientEmail}</a>
                        </div>
                        <div>
                            <strong style="color: #495057;">Fecha:</strong><br>
                            <span style="color: #495057;">${messageData.fechaEnvio.toLocaleDateString('es-ES', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Mensaje del cliente -->
                <div style="color: #333; line-height: 1.6;">
                    <h3 style="color: #333; margin-bottom: 20px; font-size: 18px;">💬 Mensaje del Cliente:</h3>
                    
                    <div style="background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); padding: 25px; border-radius: 12px; margin: 20px 0; position: relative; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <!-- Indicador de mensaje -->
                        <div style="position: absolute; top: -8px; left: 25px; background-color: #007bff; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            MENSAJE CLIENTE
                        </div>
                        
                        <div style="margin-top: 10px; font-size: 16px; line-height: 1.6; color: #333;">
                            "${messageData.mensaje}"
                        </div>
                    </div>
                </div>
                
                <!-- Acciones rápidas -->
                <div style="background-color: #fff; border: 2px solid #007bff; border-radius: 12px; padding: 25px; margin: 30px 0;">
                    <h3 style="margin: 0 0 20px 0; color: #007bff; text-align: center; font-size: 18px;">⚡ Acciones Rápidas</h3>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/html/dashboardAdministrador.html" 
                           style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 10px 10px 0; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);">
                            💬 Responder Ahora
                        </a>
                        
                        <a href="mailto:${messageData.clientEmail}" 
                           style="display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 10px 10px 0; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                            📧 Email Directo
                        </a>
                    </div>
                </div>
                
                <!-- Consejos para una buena respuesta -->
                <div style="background-color: #f8f9fa; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h4 style="margin: 0 0 15px 0; color: #856404;">💡 Consejos para una Respuesta Efectiva:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #495057; line-height: 1.6;">
                        <li>Responde dentro de las próximas 2 horas para mantener una excelente experiencia de cliente</li>
                        <li>Personaliza tu respuesta mencionando el nombre del cliente</li>
                        <li>Proporciona información específica y actionable</li>
                        <li>Si necesitas más tiempo, envía una respuesta de confirmación inicial</li>
                    </ul>
                </div>
                
                <!-- Estadísticas rápidas -->
                <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); padding: 20px; border-radius: 8px; margin: 25px 0; color: white; text-align: center;">
                    <h4 style="margin: 0 0 10px 0;">📊 Recuerda</h4>
                    <p style="margin: 0; opacity: 0.9;">La comunicación rápida y efectiva mejora la satisfacción del cliente y fortalece nuestra reputación.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #e8f5e8; border-radius: 8px;">
                    <p style="margin: 0; color: #155724; font-weight: 600; font-size: 16px;">
                        🚀 ¡Mantengamos la excelencia en nuestro servicio al cliente!
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} Crazy Studios - Panel de Administración</p>
                    <p style="margin: 0;">Este mensaje fue enviado porque eres administrador del sistema.</p>
                    <p style="margin: 10px 0 0 0;">
                        📞 Si tienes problemas técnicos, contacta al equipo de desarrollo.
                    </p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: admin.correo,
            subject: `🔔 Nuevo mensaje de ${messageData.clientName} - Centro de Mensajes`,
            html: emailContent
        });
        
        console.log('✅ Notificación de mensaje enviada al admin:', admin.correo);
        
    } catch (error) {
        console.error('❌ Error al enviar notificación de mensaje al admin:', error);
        throw error;
    }
};

/**
 * Envía resumen diario de mensajes a los administradores (VERSIÓN MEJORADA)
 * @param {Object} admin - Datos del administrador
 * @param {Object} summary - Resumen de mensajes
 */
exports.sendDailyMessageSummary = async (admin, summary) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; padding: 30px; background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%); border-radius: 8px; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">📊 Resumen Diario de Mensajes</h1>
                    <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">
                        ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                
                <!-- Saludo personalizado -->
                <div style="margin-bottom: 30px;">
                    <p style="font-size: 18px; color: #333; margin: 0;">
                        ¡Hola <strong style="color: #007bff;">${admin.nombre}</strong>! 👋
                    </p>
                    <p style="color: #666; margin: 10px 0 0 0;">
                        Aquí tienes el resumen de la actividad de mensajes del día:
                    </p>
                </div>
                
                <!-- Estadísticas principales -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; margin: 30px 0;">
                    <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;">
                            ${summary.nuevosHoy || 0}
                        </div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            💬 Mensajes Nuevos
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);">
                        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;">
                            ${summary.respondidosHoy || 0}
                        </div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            ✅ Respondidos
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%); border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);">
                        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;">
                            ${summary.pendientes || 0}
                        </div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            ⏳ Pendientes
                        </div>
                    </div>
                </div>
                
                <!-- Métricas adicionales -->
                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0;">
                    <h3 style="margin: 0 0 20px 0; color: #495057; text-align: center;">📈 Métricas del Día</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 5px;">
                                ${summary.tiempoRespuestaPromedio || 'N/A'}
                            </div>
                            <div style="font-size: 14px; color: #666;">⏱️ Tiempo Respuesta Promedio</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745; margin-bottom: 5px;">
                                ${summary.satisfaccionClientes || 'N/A'}
                            </div>
                            <div style="font-size: 14px; color: #666;">😊 Satisfacción Cliente</div>
                        </div>
                    </div>
                </div>
                
                <!-- Conversaciones activas -->
                ${summary.conversacionesActivas && summary.conversacionesActivas.length > 0 ? `
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 25px; border-radius: 12px; margin: 30px 0;">
                    <h3 style="color: #856404; margin: 0 0 20px 0; text-align: center;">🔥 Conversaciones que Requieren Atención</h3>
                    <div style="space-y: 15px;">
                        ${summary.conversacionesActivas.map(conv => `
                            <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 600; color: #495057; margin-bottom: 5px;">
                                            👤 ${conv.clientName}
                                        </div>
                                        <div style="color: #6c757d; font-size: 14px;">
                                            💬 ${conv.mensajesPendientes} mensaje(s) sin responder
                                        </div>
                                    </div>
                                    <div style="background-color: #ffc107; color: #212529; padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: 600;">
                                        PRIORITARIO
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Call to action -->
                <div style="text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #17a2b8 0%, #007bff 100%); border-radius: 12px; color: white;">
                    <h3 style="margin: 0 0 20px 0; font-size: 20px;">🚀 ¡Mantén el Momentum!</h3>
                    <p style="margin: 0 0 25px 0; opacity: 0.9; font-size: 16px;">
                        ${summary.pendientes > 0 ? 
                            `Tienes ${summary.pendientes} mensajes esperando tu respuesta. ¡Vamos por ellos!` :
                            '¡Excelente trabajo! Todos los mensajes han sido atendidos.'
                        }
                    </p>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/html/dashboardAdministrador.html" 
                       style="display: inline-block; background-color: white; color: #007bff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        💼 Ir al Centro de Mensajes
                    </a>
                </div>
                
                <!-- Consejos del día -->
                <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); padding: 25px; border-radius: 12px; margin: 30px 0; color: white;">
                    <h4 style="margin: 0 0 15px 0; text-align: center;">💡 Consejo del Día</h4>
                    <p style="margin: 0; text-align: center; font-style: italic; opacity: 0.9;">
                        "La comunicación efectiva es el 80% del éxito en el servicio al cliente. Cada mensaje es una oportunidad de crear una experiencia memorable."
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
                    <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} Crazy Studios - Sistema de Gestión</p>
                    <p style="margin: 0;">Resumen automático generado para administradores del sistema.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: admin.correo,
            subject: `📊 Resumen diario de mensajes - ${new Date().toLocaleDateString('es-ES')} - Crazy Studios`,
            html: emailContent
        });
        
        console.log('✅ Resumen diario enviado a:', admin.correo);
        
    } catch (error) {
        console.error('❌ Error al enviar resumen diario:', error);
        throw error;
    }
};

/**
 * Envía notificación cuando se archiva una conversación
 * @param {Object} admin - Datos del administrador
 * @param {Object} conversationData - Datos de la conversación archivada
 */
exports.sendConversationArchivedNotification = async (admin, conversationData) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #6c757d;">📦 Conversación Archivada</h1>
                </div>
                <div style="color: #666; line-height: 1.6;">
                    <p>Hola ${admin.nombre},</p>
                    <p>Se ha archivado la conversación con <strong>${conversationData.clientName}</strong>.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Cliente:</strong> ${conversationData.clientName}</p>
                        <p><strong>Total de mensajes:</strong> ${conversationData.totalMessages}</p>
                        <p><strong>Fecha de archivo:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                    
                    <p>La conversación puede ser restaurada desde el panel de administración si es necesario.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: admin.correo,
            subject: '📦 Conversación Archivada - Crazy Studios',
            html: emailContent
        });
        
    } catch (error) {
        console.error('Error al enviar notificación de archivo:', error);
        throw error;
    }
};

/**
 * Envía alerta cuando hay muchos mensajes sin responder
 * @param {Object} admin - Datos del administrador
 * @param {Object} alertData - Datos de la alerta
 */
exports.sendUnreadMessagesAlert = async (admin, alertData) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dc3545; border-radius: 8px; background-color: #f8d7da;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #721c24;">🚨 Alerta: Mensajes Sin Responder</h1>
                </div>
                <div style="color: #721c24; line-height: 1.6;">
                    <p>Hola ${admin.nombre},</p>
                    <p>Hay <strong>${alertData.unreadCount}</strong> mensajes sin responder que requieren tu atención.</p>
                    
                    <div style="background-color: #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Mensajes más antiguos sin responder:</strong></p>
                        <ul>
                            ${alertData.oldestMessages.map(msg => 
                                `<li>${msg.clientName} - ${msg.timeAgo}</li>`
                            ).join('')}
                        </ul>
                    </div>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/html/dashboardAdministrador.html" 
                           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            🚨 Responder Mensajes Urgentes
                        </a>
                    </p>
                    
                    <p>Por favor, revisa y responde estos mensajes lo antes posible para mantener la satisfacción del cliente.</p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: admin.correo,
            subject: `🚨 URGENTE: ${alertData.unreadCount} mensajes sin responder - Crazy Studios`,
            html: emailContent
        });
        
    } catch (error) {
        console.error('Error al enviar alerta de mensajes:', error);
        throw error;
    }
};

/**
 * Envía un email con código de verificación para restablecer contraseña
 * @param {Object} user - Datos del usuario
 */
exports.sendPasswordResetCodeEmail = async (user) => {
    try {
        console.log(`📧 Enviando código de verificación a: ${user.correo}`);
        
        const emailContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Código de Verificación</h1>
                    <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.9;">Para restablecer tu contraseña</p>
                </div>
                
                <!-- Contenido Principal -->
                <div style="padding: 40px 30px;">
                    
                    <!-- Saludo Personal -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; font-size: 24px; margin: 0 0 15px 0;">¡Hola ${user.nombre}! 👋</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Crazy Studios</strong>.
                        </p>
                    </div>
                    
                    <!-- Código de Verificación -->
                    <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 30px; border-radius: 16px; margin-bottom: 30px; text-align: center; border: 2px solid #667eea20;">
                        <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Tu código de verificación es:</h3>
                        
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 36px; font-weight: 800; letter-spacing: 8px; padding: 20px; border-radius: 12px; margin: 20px 0; font-family: 'Courier New', monospace; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            ${user.resetCode}
                        </div>
                        
                        <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">
                            Este código es válido por <strong style="color: #667eea;">${user.expirationTime}</strong>
                        </p>
                    </div>
                    
                    <!-- Instrucciones -->
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #4facfe;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px; display: flex; align-items: center; gap: 10px;">
                            📝 Instrucciones
                        </h3>
                        <ol style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
                            <li style="margin-bottom: 8px;">Regresa a la página de restablecimiento de contraseña</li>
                            <li style="margin-bottom: 8px;">Ingresa el código de 6 dígitos mostrado arriba</li>
                            <li style="margin-bottom: 8px;">Crea tu nueva contraseña segura</li>
                            <li>¡Listo! Podrás acceder con tu nueva contraseña</li>
                        </ol>
                    </div>
                    
                    <!-- Advertencias de Seguridad -->
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 12px; border-left: 5px solid #ffc107; margin-bottom: 30px;">
                        <div style="display: flex; align-items: flex-start; gap: 15px;">
                            <div style="font-size: 24px;">⚠️</div>
                            <div>
                                <div style="font-weight: 600; color: #856404; margin-bottom: 10px;">Importante para tu seguridad:</div>
                                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                                    <li style="margin-bottom: 5px;">No compartas este código con nadie</li>
                                    <li style="margin-bottom: 5px;">Solo tú solicitaste este cambio</li>
                                    <li style="margin-bottom: 5px;">Si no fuiste tú, ignora este correo</li>
                                    <li>El código expira automáticamente en ${user.expirationTime}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Botón de Acción -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/forgot-password.html" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            🔐 Continuar con el Restablecimiento
                        </a>
                    </div>
                    
                    <!-- Información Adicional -->
                    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 10px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                        <div style="display: flex; align-items: flex-start; gap: 15px;">
                            <div style="font-size: 20px;">💡</div>
                            <div>
                                <div style="font-weight: 600; color: #155724; margin-bottom: 8px;">¿Necesitas ayuda?</div>
                                <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.5;">
                                    Si tienes problemas para restablecer tu contraseña o no solicitaste este cambio, 
                                    contáctanos inmediatamente en <a href="mailto:soporte@crazystudios.com" style="color: #155724; font-weight: 600;">soporte@crazystudios.com</a>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de Contacto -->
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center;">
                        <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 16px;">📞 Soporte Técnico</h3>
                        <div style="color: #6c757d; font-size: 14px;">
                            <p style="margin: 5px 0;">📧 Email: <a href="mailto:soporte@crazystudios.com" style="color: #667eea;">soporte@crazystudios.com</a></p>
                            <p style="margin: 5px 0;">🌐 Web: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #667eea;">www.crazystudios.com</a></p>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                        © ${new Date().getFullYear()} Crazy Studios. Tu seguridad es nuestra prioridad.
                    </p>
                    <p style="margin: 0; color: #6c757d; font-size: 12px;">
                        Este es un correo automático de seguridad. Por favor, no respondas a este mensaje.
                    </p>
                </div>
            </div>
        `;
        
        await sendEmail({
            to: user.correo,
            subject: `🔐 Código de Verificación: ${user.resetCode} - Crazy Studios`,
            html: emailContent
        });
        
        console.log(`✅ Código de verificación enviado exitosamente a: ${user.correo}`);
        
    } catch (error) {
        console.error(`❌ Error al enviar código de verificación a ${user.correo}:`, error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    sendWelcomeEmail: exports.sendWelcomeEmail,
    sendPasswordResetEmail: exports.sendPasswordResetEmail,
    sendPasswordResetCodeEmail: exports.sendPasswordResetCodeEmail,
    sendPasswordChangedEmail: exports.sendPasswordChangedEmail,
    sendProjectCreationEmail: exports.sendProjectCreationEmail,
    sendProjectAssignmentEmail: exports.sendProjectAssignmentEmail,
    sendProjectStatusUpdateEmail: exports.sendProjectStatusUpdateEmail,
    sendProjectDeletionEmail: exports.sendProjectDeletionEmail,
    sendAppointmentConfirmationEmail: exports.sendAppointmentConfirmationEmail,
    sendGuestAppointmentConfirmationEmail: exports.sendGuestAppointmentConfirmationEmail,
    sendAppointmentAssignmentEmail: exports.sendAppointmentAssignmentEmail,
    sendAppointmentStatusUpdateEmail: exports.sendAppointmentStatusUpdateEmail,
    sendGuestAppointmentStatusUpdateEmail: exports.sendGuestAppointmentStatusUpdateEmail,
    sendAppointmentRescheduledEmail: exports.sendAppointmentRescheduledEmail,
    sendGuestAppointmentRescheduledEmail: exports.sendGuestAppointmentRescheduledEmail,
    sendAppointmentCancellationEmail: exports.sendAppointmentCancellationEmail,
    sendGuestAppointmentCancellationEmail: exports.sendGuestAppointmentCancellationEmail,
    sendAdminAppointmentNotificationEmail: exports.sendAdminAppointmentNotificationEmail,
    sendMessageNotificationToClient: exports.sendMessageNotificationToClient,
    sendMessageNotificationToAdmin: exports.sendMessageNotificationToAdmin,
    sendDailyMessageSummary: exports.sendDailyMessageSummary
};