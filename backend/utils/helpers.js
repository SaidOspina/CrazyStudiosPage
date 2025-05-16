/**
 * Helpers generales para la aplicación
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Funciones para manejo de fechas
 */

/**
 * Formatea una fecha a string en formato dd/mm/yyyy
 * @param {Date} date - Fecha a formatear
 * @returns {String} Fecha formateada
 */
exports.formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Obtiene una fecha con el formato YYYY-MM-DD para inputs HTML
 * @param {Date} date - Fecha a formatear
 * @returns {String} Fecha formateada
 */
exports.formatDateForInput = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '';
    
    // Formato YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

/**
 * Obtiene el rango de fechas para una semana
 * @param {Date} date - Fecha de referencia
 * @returns {Object} Fechas de inicio y fin de la semana
 */
exports.getWeekRange = (date) => {
    const d = new Date(date);
    
    // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
    const day = d.getDay();
    
    // Calcular días para llegar al lunes (inicio de semana)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    
    // Establecer fecha de inicio (lunes)
    const startDate = new Date(d.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    
    // Establecer fecha de fin (domingo)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    return {
        startDate,
        endDate
    };
};

/**
 * Funciones para strings
 */

/**
 * Capitaliza la primera letra de cada palabra
 * @param {String} str - String a capitalizar
 * @returns {String} String capitalizado
 */
exports.capitalizeWords = (str) => {
    if (!str) return '';
    
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Trunca un texto a una longitud máxima
 * @param {String} text - Texto a truncar
 * @param {Number} maxLength - Longitud máxima
 * @returns {String} Texto truncado
 */
exports.truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
};

/**
 * Elimina las etiquetas HTML de un texto
 * @param {String} html - Texto con HTML
 * @returns {String} Texto sin HTML
 */
exports.stripHtml = (html) => {
    if (!html) return '';
    
    return html.replace(/<\/?[^>]+(>|$)/g, '');
};

/**
 * Genera un string aleatorio
 * @param {Number} length - Longitud del string
 * @returns {String} String aleatorio
 */
exports.generateRandomString = (length = 10) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

/**
 * Funciones para arrays y objetos
 */

/**
 * Ordena un array de objetos por una propiedad
 * @param {Array} array - Array a ordenar
 * @param {String} property - Propiedad por la que ordenar
 * @param {String} direction - Dirección: 'asc' o 'desc'
 * @returns {Array} Array ordenado
 */
exports.sortArrayByProperty = (array, property, direction = 'asc') => {
    const sortedArray = [...array];
    
    sortedArray.sort((a, b) => {
        // Manejar valores nulos
        if (a[property] === null) return direction === 'asc' ? -1 : 1;
        if (b[property] === null) return direction === 'asc' ? 1 : -1;
        
        // Comparar fechas
        if (a[property] instanceof Date && b[property] instanceof Date) {
            return direction === 'asc' 
                ? a[property].getTime() - b[property].getTime()
                : b[property].getTime() - a[property].getTime();
        }
        
        // Comparar strings (insensible a mayúsculas/minúsculas)
        if (typeof a[property] === 'string' && typeof b[property] === 'string') {
            return direction === 'asc'
                ? a[property].localeCompare(b[property])
                : b[property].localeCompare(a[property]);
        }
        
        // Comparar números
        return direction === 'asc'
            ? a[property] - b[property]
            : b[property] - a[property];
    });
    
    return sortedArray;
};

/**
 * Filtra un array de objetos por un texto en múltiples propiedades
 * @param {Array} array - Array a filtrar
 * @param {String} search - Texto de búsqueda
 * @param {Array} properties - Propiedades en las que buscar
 * @returns {Array} Array filtrado
 */
exports.filterArrayByText = (array, search, properties) => {
    if (!search || !array.length || !properties.length) return array;
    
    const searchLower = search.toLowerCase();
    
    return array.filter(item => {
        return properties.some(prop => {
            const value = item[prop];
            
            if (value === null || value === undefined) return false;
            
            return String(value).toLowerCase().includes(searchLower);
        });
    });
};

/**
 * Agrupa un array de objetos por una propiedad
 * @param {Array} array - Array a agrupar
 * @param {String} property - Propiedad por la que agrupar
 * @returns {Object} Objeto con elementos agrupados
 */
exports.groupArrayByProperty = (array, property) => {
    return array.reduce((result, item) => {
        const key = item[property];
        
        if (!result[key]) {
            result[key] = [];
        }
        
        result[key].push(item);
        
        return result;
    }, {});
};

/**
 * Funciones para manejo de dinero
 */

/**
 * Formatea un número como moneda
 * @param {Number} amount - Cantidad a formatear
 * @param {String} locale - Configuración regional (ej: 'es-CO')
 * @param {String} currency - Moneda (ej: 'COP')
 * @returns {String} Cantidad formateada
 */
exports.formatCurrency = (amount, locale = 'es-CO', currency = 'COP') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Convierte una cantidad a número
 * @param {String} amountStr - Cantidad en formato string
 * @returns {Number} Cantidad como número
 */
exports.parseAmount = (amountStr) => {
    if (!amountStr) return 0;
    
    // Eliminar símbolos de moneda, puntos y espacios
    const cleanStr = amountStr.replace(/[^\d,-]/g, '').replace(',', '.');
    
    return parseFloat(cleanStr) || 0;
};

/**
 * Funciones para nombres
 */

/**
 * Obtiene las iniciales de un nombre
 * @param {String} firstName - Nombre
 * @param {String} lastName - Apellido
 * @returns {String} Iniciales
 */
exports.getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '';
    
    let initials = '';
    
    if (firstName) {
        initials += firstName.charAt(0).toUpperCase();
    }
    
    if (lastName) {
        initials += lastName.charAt(0).toUpperCase();
    }
    
    return initials;
};

/**
 * Obtiene el nombre completo
 * @param {String} firstName - Nombre
 * @param {String} lastName - Apellido
 * @returns {String} Nombre completo
 */
exports.getFullName = (firstName, lastName) => {
    if (!firstName && !lastName) return '';
    
    return [firstName, lastName].filter(Boolean).join(' ');
};

/**
 * Funciones para manejo de archivos
 */

/**
 * Crea un directorio recursivamente si no existe
 * @param {String} dirPath - Ruta del directorio
 */
exports.ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Elimina un archivo si existe
 * @param {String} filePath - Ruta del archivo
 * @returns {Boolean} True si se eliminó, false si no existía
 */
exports.removeFileIfExists = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error al eliminar archivo ${filePath}:`, error);
        return false;
    }
};

/**
 * Funciones para respuestas HTTP
 */

/**
 * Formatea una respuesta exitosa
 * @param {String} message - Mensaje de éxito
 * @param {Object} data - Datos a enviar
 * @returns {Object} Respuesta formateada
 */
exports.successResponse = (message = 'Operación exitosa', data = null) => {
    const response = {
        success: true,
        message
    };
    
    if (data !== null) {
        response.data = data;
    }
    
    return response;
};

/**
 * Formatea una respuesta de error
 * @param {String} message - Mensaje de error
 * @param {Object} error - Detalles adicionales del error
 * @returns {Object} Respuesta formateada
 */
exports.errorResponse = (message = 'Se produjo un error', error = null) => {
    const response = {
        success: false,
        message
    };
    
    if (error && process.env.NODE_ENV === 'development') {
        response.error = error instanceof Error ? error.message : error;
    }
    
    return response;
};

/**
 * Maneja errores en controladores asíncronos
 * @param {Function} fn - Función controladora
 * @returns {Function} Función middleware con manejo de errores
 */
exports.asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};