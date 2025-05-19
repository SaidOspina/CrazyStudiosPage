const dotenv = require('dotenv');
const app = require('./app');

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en modo ${process.env.NODE_ENV} en puerto ${PORT}`);
});

// En tu archivo server.js o app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Ruta raíz - redirigir a index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Otras rutas...

app.listen(3000, () => {
    console.log('Servidor iniciado en puerto 3000');
});