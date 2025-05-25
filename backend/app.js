const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectToDatabase } = require('./config/db').default;

// Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Inicializar Express
const app = express();

// Conectar a la base de datos
connectToDatabase();

// Middleware
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500','https://crazystudiospage.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes); // ✅ ESTA LÍNEA ES IMPORTANTE
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messageRoutes);

// Ruta principal (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Configurar express.json con opciones de depuración
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
        try {
            JSON.parse(buf.toString());
        } catch (e) {
            console.error('Error parsing JSON:', e);
            res.status(400).json({ 
                success: false, 
                message: 'Invalid JSON in request body' 
            });
            throw new Error('Invalid JSON');
        }
    }
}));

// Middleware para ver el cuerpo de las peticiones (debugging)
app.use((req, res, next) => {
    if (req.method === 'POST' && req.url.includes('/api/projects')) {
        console.log('==== PETICIÓN DE PROYECTO RECIBIDA ====');
        console.log('URL:', req.url);
        console.log('Method:', req.method);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('=========================================');
    }
    next();
}); 

app.use((req, res, next) => {
    if (req.url.includes('/api/messages')) {
        console.log('==== PETICIÓN DE MENSAJES RECIBIDA ====');
        console.log('URL:', req.url);
        console.log('Method:', req.method);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        if (req.method !== 'GET') {
            console.log('Body:', JSON.stringify(req.body, null, 2));
        }
        console.log('========================================');
    }
    next();
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Añadir esto para development
if (process.env.NODE_ENV === 'development') {
    const emailService = require('./services/emailService');
    
    // Ruta de prueba para verificar la conexión SMTP
    app.get('/api/test/email', async (req, res) => {
        try {
            const result = await emailService.testConnection();
            res.status(result.success ? 200 : 500).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al probar conexión SMTP',
                error: error.message
            });
        }
    });
    
    // Ruta de prueba para verificar rutas de proyectos
    app.get('/api/test/projects', (req, res) => {
        res.json({
            success: true,
            message: 'Ruta de proyectos funcionando correctamente',
            availableRoutes: [
                'GET /api/projects - Obtener todos los proyectos',
                'POST /api/projects - Crear nuevo proyecto',
                'GET /api/projects/:id - Obtener proyecto por ID',
                'PUT /api/projects/:id - Actualizar proyecto',
                'DELETE /api/projects/:id - Eliminar proyecto'
            ]
        });
    });
    
    // ✅ AGREGADO: Ruta de prueba para verificar rutas de mensajes
    app.get('/api/test/messages', (req, res) => {
        res.json({
            success: true,
            message: 'Ruta de mensajes funcionando correctamente',
            availableRoutes: [
                'GET /api/messages/conversations - Obtener conversaciones',
                'GET /api/messages/messages/:clienteId - Obtener mensajes de una conversación',
                'POST /api/messages/send - Enviar mensaje',
                'PUT /api/messages/mark-read/:clienteId - Marcar como leído',
                'GET /api/messages/stats - Obtener estadísticas',
                'GET /api/messages/search - Buscar mensajes'
            ]
        });
    });
}
module.exports = app;