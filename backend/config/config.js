const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    // Entorno
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Servidor
    port: process.env.PORT || 3000,
    
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'crazy_studios_secret_key',
        expiresIn: process.env.JWT_EXPIRE || '30d'
    },
    
    // Email
    email: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        from: {
            email: process.env.FROM_EMAIL || 'soporte@crazystudios.com',
            name: process.env.FROM_NAME || 'Soporte Crazy Studios'
        }
    },
    
    // Uploads
    uploads: {
        projectFilesDir: 'uploads/projects',
        profileImagesDir: 'uploads/profiles',
        maxFileSize: 5 * 1024 * 1024 // 5MB
    },
    
    // Roles de usuario
    userRoles: ['cliente', 'admin', 'superadmin'],
    
    // Estados de proyecto
    projectStatuses: [
        'cotizacion', 
        'pago procesado', 
        'iniciado', 
        'desarrollo inicial', 
        'desarrollo medio', 
        'finalizado'
    ],
    
    // Tipos de cita
    appointmentTypes: [
        'consulta-general', 
        'plan-personalizado', 
        'seguimiento-proyecto'
    ],
    
    // Estados de cita
    appointmentStatuses: [
        'pendiente', 
        'confirmada', 
        'cancelada', 
        'completada'
    ]
};