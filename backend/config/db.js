import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// URL de conexión a MongoDB Atlas (o local para desarrollo)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'crazy_studios_db';

// Cliente MongoDB
let client;
let db;

/**
 * Conecta a la base de datos MongoDB
 */
async function connectToDatabase() {
    if (db) return db;
    
    try {
        // Opciones de conexión recomendadas para MongoDB Atlas
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Ajusta según tus necesidades
            serverSelectionTimeoutMS: 5000, // Timeout para selección de servidor
            socketTimeoutMS: 45000, // Timeout para operaciones
        };

        client = new MongoClient(MONGODB_URI, options);
        await client.connect();
        
        db = client.db(DB_NAME);
        console.log(`Conectado a MongoDB: ${DB_NAME}`);
        
        return db;
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        throw error;
    }
}

/**
 * Cierra la conexión con MongoDB
 */
async function closeDatabaseConnection() {
    if (client) {
        await client.close();
        console.log('Conexión a MongoDB cerrada');
        db = null;
        client = null;
    }
}

/**
 * Obtiene una referencia a la base de datos
 */
function getDatabase() {
    if (!db) {
        throw new Error('La base de datos no ha sido inicializada. Llama a connectToDatabase primero.');
    }
    return db;
}

/**
 * Helper para convertir string ID a ObjectId
 */
function toObjectId(id) {
    try {
        return new ObjectId(id);
    } catch (error) {
        throw new Error('ID inválido');
    }
}

// Agregar una función para verificar la conexión
async function checkConnection() {
    try {
        const database = getDatabase();
        await database.command({ ping: 1 });
        return true;
    } catch (error) {
        console.error('Error al verificar la conexión:', error);
        return false;
    }
}

export default {
    connectToDatabase,
    closeDatabaseConnection,
    getDatabase,
    toObjectId,
    ObjectId,
    checkConnection
};