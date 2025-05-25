const express = require('express');
const reportsController = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación y permisos de administrador
router.use(protect);
router.use(authorize('admin', 'superadmin'));

/**
 * GET /api/reports/projects
 * Genera reporte de proyectos por rango de fechas
 * Query params: startDate, endDate, status?, category?, cliente?
 */
router.get('/projects', reportsController.generateProjectsReport);

/**
 * GET /api/reports/filters
 * Obtiene datos para filtros del reporte (estados, categorías, clientes)
 */
router.get('/filters', reportsController.getReportFilters);

/**
 * GET /api/reports/export
 * Exporta reporte en diferentes formatos
 * Query params: format (json|csv), startDate, endDate, ...
 */
router.get('/export', reportsController.exportReport);

module.exports = router;