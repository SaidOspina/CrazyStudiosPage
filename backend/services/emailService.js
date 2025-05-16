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

module.exports = {
    sendEmail,
    sendWelcomeEmail: exports.sendWelcomeEmail,
    sendPasswordResetEmail: exports.sendPasswordResetEmail,
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
    sendAdminAppointmentNotificationEmail: exports.sendAdminAppointmentNotificationEmail
};