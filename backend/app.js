const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectToDatabase } = require('./config/db');

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
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(cors());
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