const { getDatabase, toObjectId } = require('../config/db').default;

/**
 * Genera informe de proyectos por rango de fechas
 */
exports.generateProjectsReport = async (req, res) => {
    try {
        const db = getDatabase();
        const { startDate, endDate, status, category, cliente } = req.query;
        
        // Validar fechas
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fecha de inicio y fecha de fin'
            });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido'
            });
        }
        
        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio debe ser anterior a la fecha de fin'
            });
        }
        
        // Configurar fin del día para la fecha final
        end.setHours(23, 59, 59, 999);
        
        // Construir filtros
        const filter = {
            fechaCreacion: {
                $gte: start,
                $lte: end
            }
        };
        
        // Filtros adicionales opcionales
        if (status && status !== 'all') {
            filter.estado = status;
        }
        
        if (category && category !== 'all') {
            filter.categoria = category;
        }
        
        if (cliente && cliente !== 'all') {
            filter.cliente = toObjectId(cliente);
        }
        
        console.log('Filtros aplicados:', filter);
        
        // Obtener proyectos con detalles del cliente
        const projects = await db.collection('projects')
            .aggregate([
                { $match: filter },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'cliente',
                        foreignField: '_id',
                        as: 'clienteDetalles'
                    }
                },
                {
                    $unwind: {
                        path: '$clienteDetalles',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $sort: { fechaCreacion: -1 }
                }
            ])
            .toArray();
        
        // Calcular estadísticas
        const stats = {
            totalProyectos: projects.length,
            ingresosTotales: projects.reduce((sum, p) => sum + (p.costo || 0), 0),
            progresoPromedio: projects.length > 0 
                ? Math.round(projects.reduce((sum, p) => sum + (p.porcentajeProgreso || 0), 0) / projects.length)
                : 0,
            porEstado: {},
            porCategoria: {},
            porCliente: {}
        };
        
        // Estadísticas por estado
        projects.forEach(project => {
            const estado = project.estado || 'sin-estado';
            stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;
        });
        
        // Estadísticas por categoría
        projects.forEach(project => {
            const categoria = project.categoria || 'sin-categoria';
            stats.porCategoria[categoria] = (stats.porCategoria[categoria] || 0) + 1;
        });
        
        // Estadísticas por cliente
        projects.forEach(project => {
            if (project.clienteDetalles) {
                const clienteNombre = `${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos}`;
                if (!stats.porCliente[clienteNombre]) {
                    stats.porCliente[clienteNombre] = {
                        proyectos: 0,
                        ingresos: 0
                    };
                }
                stats.porCliente[clienteNombre].proyectos += 1;
                stats.porCliente[clienteNombre].ingresos += (project.costo || 0);
            }
        });
        
        // Top clientes por ingresos
        const topClientes = Object.entries(stats.porCliente)
            .map(([nombre, data]) => ({ nombre, ...data }))
            .sort((a, b) => b.ingresos - a.ingresos)
            .slice(0, 10);
        
        // Proyectos más rentables
        const topProyectos = projects
            .filter(p => p.costo > 0)
            .sort((a, b) => b.costo - a.costo)
            .slice(0, 10)
            .map(p => ({
                nombre: p.nombre,
                cliente: p.clienteDetalles ? `${p.clienteDetalles.nombre} ${p.clienteDetalles.apellidos}` : 'Sin cliente',
                costo: p.costo,
                estado: p.estado,
                progreso: p.porcentajeProgreso
            }));
        
        res.status(200).json({
            success: true,
            data: {
                filtros: {
                    fechaInicio: startDate,
                    fechaFin: endDate,
                    estado: status || 'todos',
                    categoria: category || 'todas',
                    cliente: cliente || 'todos'
                },
                estadisticas: stats,
                topClientes,
                topProyectos,
                proyectos: projects,
                fechaGeneracion: new Date()
            }
        });
        
    } catch (error) {
        console.error('Error al generar reporte de proyectos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte',
            error: error.message
        });
    }
};

/**
 * Obtiene datos para filtros del reporte
 */
exports.getReportFilters = async (req, res) => {
    try {
        const db = getDatabase();
        
        // Obtener estados únicos
        const estados = await db.collection('projects')
            .distinct('estado', { estado: { $exists: true, $ne: null } });
        
        // Obtener categorías únicas
        const categorias = await db.collection('projects')
            .distinct('categoria', { categoria: { $exists: true, $ne: null } });
        
        // Obtener clientes con proyectos
        const clientes = await db.collection('projects')
            .aggregate([
                { $match: { cliente: { $exists: true, $ne: null } } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'cliente',
                        foreignField: '_id',
                        as: 'clienteInfo'
                    }
                },
                { $unwind: '$clienteInfo' },
                {
                    $group: {
                        _id: '$cliente',
                        nombre: { $first: '$clienteInfo.nombre' },
                        apellidos: { $first: '$clienteInfo.apellidos' },
                        empresa: { $first: '$clienteInfo.empresa' },
                        totalProyectos: { $sum: 1 }
                    }
                },
                { $sort: { totalProyectos: -1 } }
            ])
            .toArray();
        
        // Obtener rango de fechas de proyectos
        const fechaStats = await db.collection('projects')
            .aggregate([
                {
                    $group: {
                        _id: null,
                        fechaMasAntigua: { $min: '$fechaCreacion' },
                        fechaMasReciente: { $max: '$fechaCreacion' }
                    }
                }
            ])
            .toArray();
        
        res.status(200).json({
            success: true,
            data: {
                estados: estados.sort(),
                categorias: categorias.sort(),
                clientes: clientes.map(c => ({
                    id: c._id,
                    nombre: `${c.nombre} ${c.apellidos}`,
                    empresa: c.empresa,
                    proyectos: c.totalProyectos
                })),
                rangoFechas: fechaStats[0] || {
                    fechaMasAntigua: new Date(),
                    fechaMasReciente: new Date()
                }
            }
        });
        
    } catch (error) {
        console.error('Error al obtener filtros de reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener filtros',
            error: error.message
        });
    }
};

/**
 * Exporta reporte a diferentes formatos
 */
exports.exportReport = async (req, res) => {
    try {
        const { format = 'json', ...reportParams } = req.query;
        
        // Generar reporte primero
        const reportReq = { ...req, query: reportParams };
        const reportRes = {
            status: () => reportRes,
            json: (data) => data
        };
        
        const reportData = await exports.generateProjectsReport(reportReq, reportRes);
        
        if (format === 'csv') {
            // Generar CSV
            const csvHeaders = [
                'Nombre', 'Cliente', 'Categoria', 'Estado', 'Progreso (%)', 
                'Costo', 'Fecha Creacion', 'Fecha Actualizacion'
            ];
            
            const csvRows = reportData.data.proyectos.map(p => [
                `"${p.nombre}"`,
                `"${p.clienteDetalles ? `${p.clienteDetalles.nombre} ${p.clienteDetalles.apellidos}` : 'Sin cliente'}"`,
                `"${p.categoria || 'Sin categoria'}"`,
                `"${p.estado || 'Sin estado'}"`,
                p.porcentajeProgreso || 0,
                p.costo || 0,
                p.fechaCreacion ? new Date(p.fechaCreacion).toISOString().split('T')[0] : '',
                p.fechaActualizacion ? new Date(p.fechaActualizacion).toISOString().split('T')[0] : ''
            ]);
            
            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.join(','))
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="reporte_proyectos_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send('\ufeff' + csvContent); // BOM for Excel compatibility
            
        } else {
            // Formato JSON por defecto
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="reporte_proyectos_${new Date().toISOString().split('T')[0]}.json"`);
            res.json(reportData);
        }
        
    } catch (error) {
        console.error('Error al exportar reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar reporte',
            error: error.message
        });
    }
};