const dotenv = require('dotenv');
const app = require('./app');

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en modo ${process.env.NODE_ENV} en puerto ${PORT}`);
});