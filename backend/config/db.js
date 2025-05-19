import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// URL de conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'crazy_studios_db';

// Cliente MongoDB
let client;
let db;

/**
 * Conecta a la base de datos MongoDB
 */
async function connectToDatabase() {
    if (db) return db;
    
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        db = client.db(DB_NAME);
        console.log('Conectado a MongoDB');
        
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

export default {
    connectToDatabase,
    closeDatabaseConnection,
    getDatabase,
    toObjectId,
    ObjectId
};  