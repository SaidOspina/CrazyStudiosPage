const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectToDatabase } = require('./config/db').default;

// Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

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
app.use('/api/projects', projectRoutes);
app.use('/api/appointments', appointmentRoutes);

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
        // Si llegamos aquí, el JSON es válido
    }
}));

// Middleware para ver el cuerpo de las peticiones
app.use((req, res, next) => {
    if (req.method === 'POST' && req.url.includes('/api/auth/register')) {
        console.log('==== PETICIÓN DE REGISTRO RECIBIDA ====');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('=======================================');
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

// Añadir esto a app.js o a una ruta apropiada
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
}

module.exports = app;