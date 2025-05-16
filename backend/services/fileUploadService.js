const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config/config');

/**
 * Configuración de almacenamiento para archivos de proyectos
 */
const projectStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dir = path.resolve(config.uploads.projectFilesDir);
        
        // Crear directorio si no existe
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        cb(null, dir);
    },
    filename: function(req, file, cb) {
        // Generar nombre único basado en timestamp e id del proyecto
        const projectId = req.params.id || 'new';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        
        cb(null, `project_${projectId}_${uniqueSuffix}${extension}`);
    }
});

/**
 * Configuración de almacenamiento para imágenes de perfil
 */
const profileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dir = path.resolve(config.uploads.profileImagesDir);
        
        // Crear directorio si no existe
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        cb(null, dir);
    },
    filename: function(req, file, cb) {
        // Generar nombre único basado en timestamp e id del usuario
        const userId = req.params.id || req.user.id;
        const uniqueSuffix = Date.now();
        const extension = path.extname(file.originalname);
        
        cb(null, `profile_${userId}_${uniqueSuffix}${extension}`);
    }
});

/**
 * Filtro para validar tipos de archivos permitidos
 * @param {Object} req - Objeto de solicitud
 * @param {Object} file - Archivo subido
 * @param {Function} cb - Callback
 */
const fileFilter = (req, file, cb) => {
    // Tipos MIME permitidos
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        // Aceptar archivo
        cb(null, true);
    } else {
        // Rechazar archivo
        cb(new Error('Tipo de archivo no permitido. Los formatos aceptados son: imágenes, PDF, documentos de Office, archivos de texto, ZIP y RAR.'), false);
    }
};

/**
 * Middleware para subir archivos de proyectos
 */
const uploadProjectFiles = multer({
    storage: projectStorage,
    limits: {
        fileSize: config.uploads.maxFileSize // Tamaño máximo (5MB)
    },
    fileFilter: fileFilter
});

/**
 * Middleware para subir imágenes de perfil
 */
const uploadProfileImage = multer({
    storage: profileStorage,
    limits: {
        fileSize: config.uploads.maxFileSize // Tamaño máximo (5MB)
    },
    fileFilter: (req, file, cb) => {
        // Solo permitir imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF).'), false);
        }
    }
});

/**
 * Elimina un archivo del sistema
 * @param {String} filePath - Ruta del archivo a eliminar
 */
const deleteFile = async (filePath) => {
    try {
        const fullPath = path.resolve(filePath);
        
        // Verificar si el archivo existe
        if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        throw error;
    }
};

/**
 * Procesa la subida de múltiples archivos para un proyecto
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {String} fieldName - Nombre del campo en el formulario
 */
const handleProjectFilesUpload = (req, res, fieldName = 'files') => {
    return new Promise((resolve, reject) => {
        const upload = uploadProjectFiles.array(fieldName, 10); // Máximo 10 archivos
        
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Error de multer
                reject({
                    status: 400,
                    message: `Error en la subida de archivos: ${err.message}`
                });
            } else if (err) {
                // Otro tipo de error
                reject({
                    status: 500,
                    message: `Error en la subida de archivos: ${err.message}`
                });
            } else {
                // Subida exitosa
                const fileData = req.files.map(file => ({
                    filename: file.filename,
                    originalname: file.originalname,
                    path: file.path,
                    size: file.size,
                    mimetype: file.mimetype
                }));
                
                resolve(fileData);
            }
        });
    });
};

/**
 * Procesa la subida de una imagen de perfil
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {String} fieldName - Nombre del campo en el formulario
 */
const handleProfileImageUpload = (req, res, fieldName = 'image') => {
    return new Promise((resolve, reject) => {
        const upload = uploadProfileImage.single(fieldName);
        
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Error de multer
                reject({
                    status: 400,
                    message: `Error en la subida de imagen: ${err.message}`
                });
            } else if (err) {
                // Otro tipo de error
                reject({
                    status: 500,
                    message: `Error en la subida de imagen: ${err.message}`
                });
            } else if (!req.file) {
                // No se subió ningún archivo
                reject({
                    status: 400,
                    message: 'No se ha proporcionado ninguna imagen'
                });
            } else {
                // Subida exitosa
                const fileData = {
                    filename: req.file.filename,
                    originalname: req.file.originalname,
                    path: req.file.path,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                };
                
                resolve(fileData);
            }
        });
    });
};

module.exports = {
    uploadProjectFiles,
    uploadProfileImage,
    deleteFile,
    handleProjectFilesUpload,
    handleProfileImageUpload
};