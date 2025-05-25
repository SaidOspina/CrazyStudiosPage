/**
 * MÓDULO DE REPORTES - VERSIÓN CON EXPORTACIÓN REAL PDF/EXCEL
 * Generador de informes de proyectos y citas con exportación completa
 */

// Variables globales del módulo
let currentReportData = null;
let currentReportType = null;
let currentFilters = {};

// Verificar si las librerías están disponibles
let jsPDFLoaded = false;
let xlsxLoaded = false;

/**
 * Inicializa el módulo de reportes
 */
function initReportsModule() {
    console.log('🔄 Inicializando módulo de reportes...');
    
    // Cargar librerías necesarias
    loadRequiredLibraries().then(() => {
        setupReportEventListeners();
        setDefaultDates();
        console.log('✅ Módulo de reportes inicializado correctamente');
    }).catch(error => {
        console.error('Error al cargar librerías:', error);
        showToast('Error al inicializar módulo de reportes', 'error');
    });
}

/**
 * Carga las librerías necesarias para exportación - VERSIÓN CORREGIDA
 */
async function loadRequiredLibraries() {
    return new Promise((resolve, reject) => {
        let scriptsToLoad = 0;
        let scriptsLoaded = 0;
        
        // Función para verificar cuando todas las librerías estén cargadas
        function checkAllLoaded() {
            scriptsLoaded++;
            if (scriptsLoaded === scriptsToLoad) {
                resolve();
            }
        }
        
        // Cargar jsPDF si no está disponible
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            scriptsToLoad++;
            const jsPDFScript = document.createElement('script');
            jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            jsPDFScript.onload = () => {
                // jsPDF puede estar disponible en diferentes formas según la versión
                if (typeof window.jspdf !== 'undefined') {
                    jsPDFLoaded = true;
                    console.log('✅ jsPDF cargado (window.jspdf)');
                } else if (typeof window.jsPDF !== 'undefined') {
                    jsPDFLoaded = true;
                    console.log('✅ jsPDF cargado (window.jsPDF)');
                } else {
                    console.warn('⚠️ jsPDF cargado pero no encontrado en window');
                    jsPDFLoaded = false;
                }
                checkAllLoaded();
            };
            jsPDFScript.onerror = () => {
                console.error('❌ Error al cargar jsPDF');
                jsPDFLoaded = false;
                reject(new Error('Error al cargar jsPDF'));
            };
            document.head.appendChild(jsPDFScript);
        } else {
            jsPDFLoaded = true;
            console.log('✅ jsPDF ya estaba disponible');
        }
        
        // Cargar SheetJS si no está disponible
        if (typeof window.XLSX === 'undefined') {
            scriptsToLoad++;
            const xlsxScript = document.createElement('script');
            xlsxScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            xlsxScript.onload = () => {
                xlsxLoaded = true;
                console.log('✅ SheetJS cargado');
                checkAllLoaded();
            };
            xlsxScript.onerror = () => {
                console.error('❌ Error al cargar SheetJS');
                xlsxLoaded = false;
                reject(new Error('Error al cargar SheetJS'));
            };
            document.head.appendChild(xlsxScript);
        } else {
            xlsxLoaded = true;
            console.log('✅ SheetJS ya estaba disponible');
        }
        
        // Si ambas librerías ya están cargadas
        if (scriptsToLoad === 0) {
            resolve();
        }
    });
}


/**
 * Configura todos los event listeners del módulo
 */
function setupReportEventListeners() {
    // Selector de tipo de informe
    const reportTypeSelect = document.getElementById('report-type-select');
    if (reportTypeSelect) {
        reportTypeSelect.addEventListener('change', handleReportTypeChange);
    }
    
    // Botón de generar informe
    const generateBtn = document.getElementById('generate-report-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateReport);
    }
    
    // Botón de limpiar informe
    const clearBtn = document.getElementById('clear-report-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearReport);
    }
    
    // Botones de exportación
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => exportReport('csv'));
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', () => exportReport('excel'));
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => exportReport('pdf'));
    
    // Botón de ajustar filtros
    const adjustFiltersBtn = document.getElementById('adjust-filters-btn');
    if (adjustFiltersBtn) {
        adjustFiltersBtn.addEventListener('click', () => {
            document.getElementById('empty-state').style.display = 'none';
        });
    }
    
    console.log('Event listeners configurados');
}

/**
 * Establece fechas por defecto (último mes)
 */
function setDefaultDates() {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');
    
    if (startDateInput) {
        startDateInput.value = lastMonth.toISOString().split('T')[0];
    }
    
    if (endDateInput) {
        endDateInput.value = today.toISOString().split('T')[0];
    }
}

/**
 * Maneja el cambio de tipo de informe
 */
function handleReportTypeChange(e) {
    const reportType = e.target.value;
    
    // Ocultar todos los filtros
    document.getElementById('project-filters').style.display = 'none';
    document.getElementById('appointment-filters').style.display = 'none';
    
    // Mostrar filtros específicos
    if (reportType === 'projects') {
        document.getElementById('project-filters').style.display = 'block';
    } else if (reportType === 'appointments') {
        document.getElementById('appointment-filters').style.display = 'block';
    }
    
    // Limpiar resultados anteriores
    hideAllStates();
    currentReportData = null;
    currentReportType = null;
}

/**
 * Maneja la generación del informe
 */
async function handleGenerateReport() {
    const reportType = document.getElementById('report-type-select').value;
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    // Validaciones
    if (!reportType) {
        showToast('Por favor selecciona un tipo de informe', 'warning');
        return;
    }
    
    if (!startDate || !endDate) {
        showToast('Por favor selecciona las fechas de inicio y fin', 'warning');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('La fecha de inicio no puede ser posterior a la fecha de fin', 'error');
        return;
    }
    
    // Mostrar estado de carga
    showLoadingState();
    
    try {
        // Recopilar filtros
        const filters = gatherFilters(reportType);
        
        // Generar informe según el tipo
        let reportData;
        if (reportType === 'projects') {
            reportData = await generateProjectsReport(startDate, endDate, filters);
        } else if (reportType === 'appointments') {
            reportData = await generateAppointmentsReport(startDate, endDate, filters);
        }
        
        // Mostrar resultados
        displayReportResults(reportData, reportType, startDate, endDate);
        
    } catch (error) {
        console.error('Error al generar informe:', error);
        showToast('Error al generar el informe: ' + error.message, 'error');
        hideAllStates();
    }
}

/**
 * Recopila los filtros según el tipo de informe
 */
function gatherFilters(reportType) {
    const filters = {};
    
    if (reportType === 'projects') {
        const statusFilter = document.getElementById('project-status-filter').value;
        const categoryFilter = document.getElementById('project-category-filter').value;
        
        if (statusFilter) filters.estado = statusFilter;
        if (categoryFilter) filters.categoria = categoryFilter;
        
    } else if (reportType === 'appointments') {
        const typeFilter = document.getElementById('appointment-type-filter').value;
        const statusFilter = document.getElementById('appointment-status-filter').value;
        
        if (typeFilter) filters.tipo = typeFilter;
        if (statusFilter) filters.estado = statusFilter;
    }
    
    return filters;
}

/**
 * Genera informe de proyectos
 */
async function generateProjectsReport(startDate, endDate, filters) {
    console.log('Generando informe de proyectos...', { startDate, endDate, filters });
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('Token de autenticación no encontrado');
    }
    
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
    
    // Construir URL con parámetros
    const params = new URLSearchParams({
        limit: 1000,
        ...filters
    });
    
    const response = await fetch(`${API_BASE}/api/projects?${params}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Error al obtener datos de proyectos');
    }
    
    const data = await response.json();
    const allProjects = data.data || [];
    
    // Filtrar por fechas
    const filteredProjects = allProjects.filter(project => {
        if (!project.fechaCreacion) return false;
        
        const projectDate = new Date(project.fechaCreacion);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Incluir todo el día final
        end.setHours(23, 59, 59, 999);
        
        return projectDate >= start && projectDate <= end;
    });
    
    // Calcular estadísticas
    const stats = calculateProjectStats(filteredProjects);
    
    return {
        type: 'projects',
        data: filteredProjects,
        stats,
        period: { startDate, endDate },
        filters
    };
}

/**
 * Genera informe de citas
 */
async function generateAppointmentsReport(startDate, endDate, filters) {
    console.log('Generando informe de citas...', { startDate, endDate, filters });
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('Token de autenticación no encontrado');
    }
    
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
    
    // Construir URL con parámetros
    const params = new URLSearchParams({
        limit: 1000,
        ...filters
    });
    
    const response = await fetch(`${API_BASE}/api/appointments?${params}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Error al obtener datos de citas');
    }
    
    const data = await response.json();
    const allAppointments = data.data || [];
    
    // Filtrar por fechas
    const filteredAppointments = allAppointments.filter(appointment => {
        if (!appointment.fecha) return false;
        
        const appointmentDate = new Date(appointment.fecha);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Incluir todo el día final
        end.setHours(23, 59, 59, 999);
        
        return appointmentDate >= start && appointmentDate <= end;
    });
    
    // Calcular estadísticas
    const stats = calculateAppointmentStats(filteredAppointments);
    
    return {
        type: 'appointments',
        data: filteredAppointments,
        stats,
        period: { startDate, endDate },
        filters
    };
}

/**
 * Calcula estadísticas de proyectos
 */
function calculateProjectStats(projects) {
    const stats = {
        total: projects.length,
        byStatus: {},
        byCategory: {},
        totalCost: 0,
        avgCost: 0,
        avgProgress: 0
    };
    
    let totalCost = 0;
    let totalProgress = 0;
    
    projects.forEach(project => {
        // Por estado
        stats.byStatus[project.estado] = (stats.byStatus[project.estado] || 0) + 1;
        
        // Por categoría
        stats.byCategory[project.categoria] = (stats.byCategory[project.categoria] || 0) + 1;
        
        // Costos
        const cost = parseFloat(project.costo) || 0;
        totalCost += cost;
        
        // Progreso
        const progress = parseInt(project.porcentajeProgreso) || 0;
        totalProgress += progress;
    });
    
    stats.totalCost = totalCost;
    stats.avgCost = projects.length > 0 ? totalCost / projects.length : 0;
    stats.avgProgress = projects.length > 0 ? totalProgress / projects.length : 0;
    
    return stats;
}

/**
 * Calcula estadísticas de citas
 */
function calculateAppointmentStats(appointments) {
    const stats = {
        total: appointments.length,
        byType: {},
        byStatus: {},
        byMonth: {}
    };
    
    appointments.forEach(appointment => {
        // Por tipo
        stats.byType[appointment.tipo] = (stats.byType[appointment.tipo] || 0) + 1;
        
        // Por estado
        stats.byStatus[appointment.estado] = (stats.byStatus[appointment.estado] || 0) + 1;
        
        // Por mes
        if (appointment.fecha) {
            const month = new Date(appointment.fecha).toISOString().slice(0, 7); // YYYY-MM
            stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
        }
    });
    
    return stats;
}

/**
 * Muestra los resultados del informe
 */
function displayReportResults(reportData, reportType, startDate, endDate) {
    currentReportData = reportData;
    currentReportType = reportType;
    currentFilters = reportData.filters;
    
    // Ocultar estados anteriores
    hideAllStates();
    
    // Mostrar sección de resultados
    document.getElementById('report-results').style.display = 'block';
    
    // Actualizar título y información
    updateResultsHeader(reportType, reportData.data.length, startDate, endDate);
    
    // Mostrar resumen estadístico
    displayReportSummary(reportData.stats, reportType);
    
    // Mostrar tabla de datos
    displayReportTable(reportData.data, reportType);
    
    // Habilitar botón de exportación
    document.getElementById('export-report-btn').disabled = false;
    
    // Si no hay datos, mostrar estado vacío
    if (reportData.data.length === 0) {
        document.getElementById('report-results').style.display = 'none';
        document.getElementById('empty-state').style.display = 'block';
    }
    
    console.log('✅ Informe generado:', reportData);
}

/**
 * Actualiza el header de resultados
 */
function updateResultsHeader(reportType, count, startDate, endDate) {
    const title = document.getElementById('results-title');
    const countElement = document.getElementById('results-count');
    const periodElement = document.getElementById('results-period');
    
    const typeNames = {
        'projects': 'Proyectos',
        'appointments': 'Citas'
    };
    
    if (title) {
        title.innerHTML = `<i class="fas fa-chart-line"></i> Informe de ${typeNames[reportType]}`;
    }
    
    if (countElement) {
        countElement.textContent = `${count} registro${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
    
    if (periodElement) {
        const start = new Date(startDate).toLocaleDateString('es-ES');
        const end = new Date(endDate).toLocaleDateString('es-ES');
        periodElement.textContent = `${start} - ${end}`;
    }
}

/**
 * Muestra el resumen estadístico
 */
function displayReportSummary(stats, reportType) {
    const summaryContainer = document.getElementById('report-summary');
    if (!summaryContainer) return;
    
    let summaryHTML = '';
    
    if (reportType === 'projects') {
        summaryHTML = `
            <div class="summary-card">
                <h4>Total Proyectos</h4>
                <div class="summary-value">${stats.total}</div>
                <div class="summary-label">Proyectos encontrados</div>
            </div>
            <div class="summary-card">
                <h4>Costo Total</h4>
                <div class="summary-value">${formatNumber(stats.totalCost)}</div>
                <div class="summary-label">Valor total de proyectos</div>
            </div>
            <div class="summary-card">
                <h4>Costo Promedio</h4>
                <div class="summary-value">${formatNumber(stats.avgCost)}</div>
                <div class="summary-label">Promedio por proyecto</div>
            </div>
            <div class="summary-card">
                <h4>Progreso Promedio</h4>
                <div class="summary-value">${Math.round(stats.avgProgress)}%</div>
                <div class="summary-label">Progreso promedio</div>
            </div>
        `;
    } else if (reportType === 'appointments') {
        const completedCount = stats.byStatus['completada'] || 0;
        const pendingCount = (stats.byStatus['pendiente'] || 0) + (stats.byStatus['confirmada'] || 0);
        const cancelledCount = stats.byStatus['cancelada'] || 0;
        
        summaryHTML = `
            <div class="summary-card">
                <h4>Total Citas</h4>
                <div class="summary-value">${stats.total}</div>
                <div class="summary-label">Citas encontradas</div>
            </div>
            <div class="summary-card">
                <h4>Completadas</h4>
                <div class="summary-value">${completedCount}</div>
                <div class="summary-label">${Math.round((completedCount/stats.total)*100) || 0}% del total</div>
            </div>
            <div class="summary-card">
                <h4>Pendientes</h4>
                <div class="summary-value">${pendingCount}</div>
                <div class="summary-label">${Math.round((pendingCount/stats.total)*100) || 0}% del total</div>
            </div>
            <div class="summary-card">
                <h4>Canceladas</h4>
                <div class="summary-value">${cancelledCount}</div>
                <div class="summary-label">${Math.round((cancelledCount/stats.total)*100) || 0}% del total</div>
            </div>
        `;
    }
    
    summaryContainer.innerHTML = summaryHTML;
}

/**
 * Muestra la tabla de datos
 */
function displayReportTable(data, reportType) {
    const tableHead = document.getElementById('report-table-head');
    const tableBody = document.getElementById('report-table-body');
    
    if (!tableHead || !tableBody) return;
    
    // Limpiar tabla
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (data.length === 0) return;
    
    // Generar headers y filas según el tipo
    if (reportType === 'projects') {
        generateProjectsTable(tableHead, tableBody, data);
    } else if (reportType === 'appointments') {
        generateAppointmentsTable(tableHead, tableBody, data);
    }
}

/**
 * Genera tabla de proyectos
 */
function generateProjectsTable(tableHead, tableBody, projects) {
    // Headers
    tableHead.innerHTML = `
        <tr>
            <th>Proyecto</th>
            <th>Cliente</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Progreso</th>
            <th>Costo</th>
            <th>Fecha Creación</th>
        </tr>
    `;
    
    // Filas
    projects.forEach(project => {
        const clientName = project.clienteDetalles 
            ? `${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos}`
            : 'No asignado';
        
        const categoryName = getCategoryDisplayName(project.categoria);
        const statusName = getStatusDisplayName(project.estado);
        const creationDate = project.fechaCreacion 
            ? new Date(project.fechaCreacion).toLocaleDateString('es-ES')
            : 'No disponible';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="font-weight: 500; color: #ffffff;">${project.nombre}</div>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">${truncateText(project.descripcion, 50)}</div>
            </td>
            <td>
                <div style="font-weight: 500;">${clientName}</div>
                ${project.clienteDetalles?.empresa ? `<div style="font-size: 12px; color: #999;">${project.clienteDetalles.empresa}</div>` : ''}
            </td>
            <td>
                <span class="category-badge">${categoryName}</span>
            </td>
            <td>
                <span class="status-badge" data-status="${project.estado}">${statusName}</span>
            </td>
            <td>
                <div class="table-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${project.porcentajeProgreso || 0}%;"></div>
                    </div>
                    <span class="progress-text">${project.porcentajeProgreso || 0}%</span>
                </div>
            </td>
            <td>
                <strong>${formatNumber(project.costo || 0)}</strong>
            </td>
            <td>${creationDate}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Genera tabla de citas
 */
function generateAppointmentsTable(tableHead, tableBody, appointments) {
    // Headers
    tableHead.innerHTML = `
        <tr>
            <th>Cliente</th>
            <th>Tipo de Cita</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Estado</th>
            <th>Proyecto</th>
            <th>Notas</th>
        </tr>
    `;
    
    // Filas
    appointments.forEach(appointment => {
        const clientName = appointment.usuarioDetalles 
            ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`
            : appointment.nombreContacto || 'No disponible';
        
        const typeName = getAppointmentTypeDisplayName(appointment.tipo);
        const statusName = getStatusDisplayName(appointment.estado);
        const appointmentDate = appointment.fecha 
            ? new Date(appointment.fecha).toLocaleDateString('es-ES')
            : 'No disponible';
        
        const projectName = appointment.proyectoDetalles?.nombre || 'No aplica';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="font-weight: 500; color: #ffffff;">${clientName}</div>
                ${appointment.usuarioDetalles?.empresa ? `<div style="font-size: 12px; color: #999;">${appointment.usuarioDetalles.empresa}</div>` : ''}
                ${appointment.correoContacto ? `<div style="font-size: 12px; color: #999;">${appointment.correoContacto}</div>` : ''}
            </td>
            <td>
                <span class="type-badge">${typeName}</span>
            </td>
            <td>${appointmentDate}</td>
            <td>
                <strong>${appointment.hora || 'No especificada'}</strong>
            </td>
            <td>
                <span class="status-badge" data-status="${appointment.estado}">${statusName}</span>
            </td>
            <td>
                ${appointment.proyectoDetalles ? `<div style="font-weight: 500;">${projectName}</div>` : '<span style="color: #666;">No aplica</span>'}
            </td>
            <td>
                ${appointment.notas ? truncateText(appointment.notas, 50) : '<span style="color: #666;">Sin notas</span>'}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Maneja la limpieza del informe
 */
function handleClearReport() {
    // Limpiar datos
    currentReportData = null;
    currentReportType = null;
    currentFilters = {};
    
    // Resetear formulario
    document.getElementById('report-type-select').value = '';
    document.getElementById('project-status-filter').value = '';
    document.getElementById('project-category-filter').value = '';
    document.getElementById('appointment-type-filter').value = '';
    document.getElementById('appointment-status-filter').value = '';
    
    // Ocultar filtros específicos
    document.getElementById('project-filters').style.display = 'none';
    document.getElementById('appointment-filters').style.display = 'none';
    
    // Ocultar todos los estados
    hideAllStates();
    
    // Deshabilitar botón de exportación
    document.getElementById('export-report-btn').disabled = true;
    
    // Establecer fechas por defecto
    setDefaultDates();
    
    showToast('Informe limpiado correctamente', 'success');
}

/**
 * Oculta todos los estados de la interfaz
 */
function hideAllStates() {
    document.getElementById('report-results').style.display = 'none';
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
}

/**
 * Muestra el estado de carga
 */
function showLoadingState() {
    hideAllStates();
    document.getElementById('loading-state').style.display = 'block';
}

/**
 * Exporta el informe en el formato especificado
 */
function exportReport(format) {
    if (!currentReportData || !currentReportData.data.length) {
        showToast('No hay datos para exportar', 'warning');
        return;
    }
    
    try {
        switch (format) {
            case 'csv':
                exportToCSV();
                break;
            case 'excel':
                exportToExcel();
                break;
            case 'pdf':
                exportToPDF();
                break;
            default:
                throw new Error('Formato de exportación no soportado');
        }
        
        showToast(`Informe exportado en formato ${format.toUpperCase()}`, 'success');
    } catch (error) {
        console.error('Error al exportar:', error);
        showToast('Error al exportar el informe: ' + error.message, 'error');
    }
}

/**
 * Exporta a CSV
 */
function exportToCSV() {
    const data = currentReportData.data;
    const type = currentReportType;
    
    let csvContent = '';
    let headers = [];
    let rows = [];
    
    if (type === 'projects') {
        headers = ['Proyecto', 'Cliente', 'Empresa', 'Categoría', 'Estado', 'Progreso (%)', 'Costo', 'Fecha Creación'];
        
        rows = data.map(project => [
            project.nombre,
            project.clienteDetalles ? `${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos}` : 'No asignado',
            project.clienteDetalles?.empresa || '',
            getCategoryDisplayName(project.categoria),
            getStatusDisplayName(project.estado),
            project.porcentajeProgreso || 0,
            project.costo || 0,
            project.fechaCreacion ? new Date(project.fechaCreacion).toLocaleDateString('es-ES') : ''
        ]);
    } else if (type === 'appointments') {
        headers = ['Cliente', 'Email', 'Tipo Cita', 'Fecha', 'Hora', 'Estado', 'Proyecto', 'Notas'];
        
        rows = data.map(appointment => [
            appointment.usuarioDetalles ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}` : appointment.nombreContacto || '',
            appointment.usuarioDetalles?.correo || appointment.correoContacto || '',
            getAppointmentTypeDisplayName(appointment.tipo),
            appointment.fecha ? new Date(appointment.fecha).toLocaleDateString('es-ES') : '',
            appointment.hora || '',
            getStatusDisplayName(appointment.estado),
            appointment.proyectoDetalles?.nombre || '',
            appointment.notas || ''
        ]);
    }
    
    // Construir CSV
    csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        const escapedRow = row.map(field => `"${String(field).replace(/"/g, '""')}"`);
        csvContent += escapedRow.join(',') + '\n';
    });
    
    // Descargar archivo
    downloadFile(csvContent, `informe_${type}_${getCurrentDateString()}.csv`, 'text/csv');
}

/**
 * Exporta a Excel usando SheetJS
 */
function exportToExcel() {
    if (!xlsxLoaded || typeof XLSX === 'undefined') {
        showToast('Librería Excel no disponible. Usando CSV como alternativa.', 'warning');
        exportToCSV();
        return;
    }

    const data = currentReportData.data;
    const type = currentReportType;
    const stats = currentReportData.stats;
    
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    
    // Preparar datos para la hoja principal
    let worksheetData = [];
    
    if (type === 'projects') {
        // Headers para proyectos
        const headers = ['Proyecto', 'Descripción', 'Cliente', 'Empresa', 'Categoría', 'Estado', 'Progreso (%)', 'Costo', 'Fecha Creación'];
        worksheetData.push(headers);
        
        // Datos de proyectos
        data.forEach(project => {
            const row = [
                project.nombre || '',
                project.descripcion || '',
                project.clienteDetalles ? `${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos}` : 'No asignado',
                project.clienteDetalles?.empresa || '',
                getCategoryDisplayName(project.categoria),
                getStatusDisplayName(project.estado),
                project.porcentajeProgreso || 0,
                project.costo || 0,
                project.fechaCreacion ? new Date(project.fechaCreacion).toLocaleDateString('es-ES') : ''
            ];
            worksheetData.push(row);
        });
        
    } else if (type === 'appointments') {
        // Headers para citas
        const headers = ['Cliente', 'Email', 'Teléfono', 'Tipo Cita', 'Fecha', 'Hora', 'Estado', 'Proyecto', 'Notas'];
        worksheetData.push(headers);
        
        // Datos de citas
        data.forEach(appointment => {
            const row = [
                appointment.usuarioDetalles ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}` : appointment.nombreContacto || '',
                appointment.usuarioDetalles?.correo || appointment.correoContacto || '',
                appointment.usuarioDetalles?.telefono || appointment.telefonoContacto || '',
                getAppointmentTypeDisplayName(appointment.tipo),
                appointment.fecha ? new Date(appointment.fecha).toLocaleDateString('es-ES') : '',
                appointment.hora || '',
                getStatusDisplayName(appointment.estado),
                appointment.proyectoDetalles?.nombre || '',
                appointment.notas || ''
            ];
            worksheetData.push(row);
        });
    }
    
    // Crear hoja de trabajo principal
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Aplicar estilos a los headers
    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" }
    };
    
    // Aplicar estilo a la primera fila (headers)
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = headerStyle;
    }
    
    // Ajustar ancho de columnas
    const colWidths = [];
    for (let col = 0; col < worksheetData[0].length; col++) {
        let maxWidth = 10;
        for (let row = 0; row < worksheetData.length; row++) {
            const cellValue = String(worksheetData[row][col] || '');
            maxWidth = Math.max(maxWidth, cellValue.length);
        }
        colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
    }
    worksheet['!cols'] = colWidths;
    
    // Agregar hoja principal al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    
    // Crear hoja de resumen estadístico
    createStatsSheet(workbook, stats, type);
    
    // Crear hoja de información del reporte
    createInfoSheet(workbook, currentReportData);
    
    // Generar y descargar archivo
    const fileName = `informe_${type}_${getCurrentDateString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

/**
 * Crea hoja de estadísticas para Excel
 */
function createStatsSheet(workbook, stats, type) {
    const statsData = [];
    
    // Título
    statsData.push(['RESUMEN ESTADÍSTICO']);
    statsData.push(['']); // Fila vacía
    
    if (type === 'projects') {
        statsData.push(['Métrica', 'Valor']);
        statsData.push(['Total de Proyectos', stats.total]);
        statsData.push(['Costo Total', formatNumber(stats.totalCost)]);
        statsData.push(['Costo Promedio', formatNumber(stats.avgCost)]);
        statsData.push(['Progreso Promedio (%)', Math.round(stats.avgProgress)]);
        statsData.push(['']); // Fila vacía
        
        // Estadísticas por estado
        statsData.push(['DISTRIBUCIÓN POR ESTADO']);
        statsData.push(['Estado', 'Cantidad', 'Porcentaje']);
        Object.entries(stats.byStatus).forEach(([status, count]) => {
            const percentage = ((count / stats.total) * 100).toFixed(1);
            statsData.push([getStatusDisplayName(status), count, `${percentage}%`]);
        });
        
        statsData.push(['']); // Fila vacía
        
        // Estadísticas por categoría
        statsData.push(['DISTRIBUCIÓN POR CATEGORÍA']);
        statsData.push(['Categoría', 'Cantidad', 'Porcentaje']);
        Object.entries(stats.byCategory).forEach(([category, count]) => {
            const percentage = ((count / stats.total) * 100).toFixed(1);
            statsData.push([getCategoryDisplayName(category), count, `${percentage}%`]);
        });
        
    } else if (type === 'appointments') {
        statsData.push(['Métrica', 'Valor']);
        statsData.push(['Total de Citas', stats.total]);
        statsData.push(['']); // Fila vacía
        
        // Estadísticas por estado
        statsData.push(['DISTRIBUCIÓN POR ESTADO']);
        statsData.push(['Estado', 'Cantidad', 'Porcentaje']);
        Object.entries(stats.byStatus).forEach(([status, count]) => {
            const percentage = ((count / stats.total) * 100).toFixed(1);
            statsData.push([getStatusDisplayName(status), count, `${percentage}%`]);
        });
        
        statsData.push(['']); // Fila vacía
        
        // Estadísticas por tipo
        statsData.push(['DISTRIBUCIÓN POR TIPO']);
        statsData.push(['Tipo', 'Cantidad', 'Porcentaje']);
        Object.entries(stats.byType).forEach(([typeKey, count]) => {
            const percentage = ((count / stats.total) * 100).toFixed(1);
            statsData.push([getAppointmentTypeDisplayName(typeKey), count, `${percentage}%`]);
        });
    }
    
    // Crear hoja de estadísticas
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    
    // Aplicar estilos
    const titleStyle = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: "center" }
    };
    
    const headerStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: "D3D3D3" } }
    };
    
    // Aplicar estilo al título
    if (statsSheet['A1']) {
        statsSheet['A1'].s = titleStyle;
    }
    
    // Ajustar ancho de columnas
    statsSheet['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas');
}

/**
 * Crea hoja de información del reporte para Excel
 */
function createInfoSheet(workbook, reportData) {
    const infoData = [];
    
    infoData.push(['INFORMACIÓN DEL REPORTE']);
    infoData.push(['']); // Fila vacía
    infoData.push(['Tipo de Reporte', currentReportType === 'projects' ? 'Proyectos' : 'Citas']);
    infoData.push(['Fecha de Generación', new Date().toLocaleString('es-ES')]);
    infoData.push(['Período de Consulta', `${new Date(reportData.period.startDate).toLocaleDateString('es-ES')} - ${new Date(reportData.period.endDate).toLocaleDateString('es-ES')}`]);
    infoData.push(['Total de Registros', reportData.data.length]);
    infoData.push(['']); // Fila vacía
    
    // Filtros aplicados
    infoData.push(['FILTROS APLICADOS']);
    if (Object.keys(reportData.filters).length > 0) {
        Object.entries(reportData.filters).forEach(([key, value]) => {
            let displayKey = key;
            let displayValue = value;
            
            if (key === 'estado') {
                displayKey = 'Estado';
                displayValue = getStatusDisplayName(value);
            } else if (key === 'categoria') {
                displayKey = 'Categoría';
                displayValue = getCategoryDisplayName(value);
            } else if (key === 'tipo') {
                displayKey = 'Tipo';
                displayValue = getAppointmentTypeDisplayName(value);
            }
            
            infoData.push([displayKey, displayValue]);
        });
    } else {
        infoData.push(['Sin filtros aplicados', '']);
    }
    
    // Crear hoja de información
    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    
    // Aplicar estilos
    const titleStyle = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: "center" }
    };
    
    if (infoSheet['A1']) {
        infoSheet['A1'].s = titleStyle;
    }
    
    // Ajustar ancho de columnas
    infoSheet['!cols'] = [
        { wch: 25 },
        { wch: 40 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Información');
}

/**
 * Exporta a PDF usando jsPDF - VERSIÓN CORREGIDA
 */
function exportToPDF() {
    // Verificar disponibilidad de jsPDF con múltiples métodos
    let jsPDFConstructor = null;
    
    if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
        jsPDFConstructor = window.jspdf.jsPDF;
        console.log('✅ Usando window.jspdf.jsPDF');
    } else if (typeof window.jsPDF !== 'undefined') {
        jsPDFConstructor = window.jsPDF;
        console.log('✅ Usando window.jsPDF');
    } else if (typeof jsPDF !== 'undefined') {
        jsPDFConstructor = jsPDF;
        console.log('✅ Usando jsPDF global');
    }
    
    if (!jsPDFConstructor) {
        console.error('❌ jsPDF no está disponible');
        showToast('Librería PDF no disponible. Usando exportación alternativa.', 'warning');
        exportToCSV();
        return;
    }

    try {
        const doc = new jsPDFConstructor('l', 'mm', 'a4'); // Orientación horizontal
        
        const data = currentReportData.data;
        const type = currentReportType;
        const stats = currentReportData.stats;
        
        let yPosition = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        
        // Función para agregar nueva página si es necesario
        function checkPageBreak(neededSpace = 20) {
            if (yPosition + neededSpace > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        }
        
        // Título del reporte
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        const title = `INFORME DE ${type === 'projects' ? 'PROYECTOS' : 'CITAS'}`;
        doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;
        
        // Información del reporte
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        const reportInfo = [
            `Fecha de generación: ${new Date().toLocaleString('es-ES')}`,
            `Período: ${new Date(currentReportData.period.startDate).toLocaleDateString('es-ES')} - ${new Date(currentReportData.period.endDate).toLocaleDateString('es-ES')}`,
            `Total de registros: ${data.length}`
        ];
        
        reportInfo.forEach(info => {
            doc.text(info, margin, yPosition);
            yPosition += 8;
        });
        
        yPosition += 10;
        
        // Resumen estadístico
        checkPageBreak(60);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('RESUMEN ESTADÍSTICO', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        if (type === 'projects') {
            const summaryStats = [
                `• Total de proyectos: ${stats.total}`,
                `• Costo total: ${formatNumber(stats.totalCost)}`,
                `• Costo promedio: ${formatNumber(stats.avgCost)}`,
                `• Progreso promedio: ${Math.round(stats.avgProgress)}%`
            ];
            
            summaryStats.forEach(stat => {
                checkPageBreak();
                doc.text(stat, margin, yPosition);
                yPosition += 8;
            });
            
            // Distribución por estado
            yPosition += 5;
            checkPageBreak(30);
            doc.setFont(undefined, 'bold');
            doc.text('Distribución por Estado:', margin, yPosition);
            yPosition += 8;
            doc.setFont(undefined, 'normal');
            
            Object.entries(stats.byStatus).forEach(([status, count]) => {
                const percentage = ((count / stats.total) * 100).toFixed(1);
                checkPageBreak();
                doc.text(`• ${getStatusDisplayName(status)}: ${count} (${percentage}%)`, margin + 10, yPosition);
                yPosition += 6;
            });
            
        } else if (type === 'appointments') {
            const summaryStats = [
                `• Total de citas: ${stats.total}`,
                `• Completadas: ${stats.byStatus['completada'] || 0}`,
                `• Pendientes: ${(stats.byStatus['pendiente'] || 0) + (stats.byStatus['confirmada'] || 0)}`,
                `• Canceladas: ${stats.byStatus['cancelada'] || 0}`
            ];
            
            summaryStats.forEach(stat => {
                checkPageBreak();
                doc.text(stat, margin, yPosition);
                yPosition += 8;
            });
        }
        
        // Tabla de datos
        yPosition += 15;
        checkPageBreak(40);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('DETALLE DE DATOS', margin, yPosition);
        yPosition += 15;
        
        // Configurar tabla
        doc.setFontSize(10);
        
        if (type === 'projects') {
            // Headers de tabla de proyectos
            const headers = ['Proyecto', 'Cliente', 'Estado', 'Progreso', 'Costo'];
            const colWidths = [60, 50, 40, 25, 35];
            let xPosition = margin;
            
            // Dibujar headers
            doc.setFont(undefined, 'bold');
            doc.setFillColor(54, 96, 146);
            doc.setTextColor(255, 255, 255);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
            
            headers.forEach((header, i) => {
                doc.text(header, xPosition + 2, yPosition);
                xPosition += colWidths[i];
            });
            
            yPosition += 8;
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            
            // Datos de proyectos
            data.slice(0, 25).forEach((project, index) => { // Limitar a 25 registros para PDF
                checkPageBreak();
                
                xPosition = margin;
                const rowData = [
                    truncateText(project.nombre, 25),
                    project.clienteDetalles ? truncateText(`${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos}`, 20) : 'No asignado',
                    getStatusDisplayName(project.estado),
                    `${project.porcentajeProgreso || 0}%`,
                    formatNumber(project.costo || 0)
                ];
                
                // Alternar color de fondo para filas
                if (index % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');
                }
                
                rowData.forEach((cell, i) => {
                    doc.text(String(cell), xPosition + 2, yPosition);
                    xPosition += colWidths[i];
                });
                
                yPosition += 8;
            });
            
        } else if (type === 'appointments') {
            // Headers de tabla de citas
            const headers = ['Cliente', 'Tipo', 'Fecha', 'Estado', 'Proyecto'];
            const colWidths = [60, 45, 30, 35, 50];
            let xPosition = margin;
            
            // Dibujar headers
            doc.setFont(undefined, 'bold');
            doc.setFillColor(54, 96, 146);
            doc.setTextColor(255, 255, 255);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
            
            headers.forEach((header, i) => {
                doc.text(header, xPosition + 2, yPosition);
                xPosition += colWidths[i];
            });
            
            yPosition += 8;
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            
            // Datos de citas
            data.slice(0, 25).forEach((appointment, index) => { // Limitar a 25 registros para PDF
                checkPageBreak();
                
                xPosition = margin;
                const clientName = appointment.usuarioDetalles 
                    ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`
                    : appointment.nombreContacto || 'No disponible';
                
                const rowData = [
                    truncateText(clientName, 25),
                    getAppointmentTypeDisplayName(appointment.tipo),
                    appointment.fecha ? new Date(appointment.fecha).toLocaleDateString('es-ES') : 'N/A',
                    getStatusDisplayName(appointment.estado),
                    appointment.proyectoDetalles ? truncateText(appointment.proyectoDetalles.nombre, 20) : 'N/A'
                ];
                
                // Alternar color de fondo para filas
                if (index % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');
                }
                
                rowData.forEach((cell, i) => {
                    doc.text(String(cell), xPosition + 2, yPosition);
                    xPosition += colWidths[i];
                });
                
                yPosition += 8;
            });
        }
        
        // Nota sobre limitación de registros
        if (data.length > 25) {
            yPosition += 10;
            checkPageBreak();
            doc.setFontSize(10);
            doc.setFont(undefined, 'italic');
            doc.text(`Nota: Se muestran los primeros 25 registros de ${data.length} total. Para ver todos los datos, use la exportación Excel.`, margin, yPosition);
        }
        
        // Pie de página en todas las páginas
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            doc.text('Generado por Sistema de Gestión', margin, pageHeight - 10);
        }
        
        // Descargar archivo
        const fileName = `informe_${type}_${getCurrentDateString()}.pdf`;
        doc.save(fileName);
        
        console.log('✅ PDF generado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al generar PDF:', error);
        showToast('Error al generar PDF. Usando exportación CSV como alternativa.', 'error');
        exportToCSV();
    }
}

/**
 * Función de debugging para verificar el estado de jsPDF
 */
function debugJsPDF() {
    console.log('=== DEBUG jsPDF ===');
    console.log('window.jspdf:', typeof window.jspdf);
    console.log('window.jsPDF:', typeof window.jsPDF);
    console.log('jsPDF global:', typeof jsPDF);
    
    if (window.jspdf) {
        console.log('window.jspdf.jsPDF:', typeof window.jspdf.jsPDF);
        console.log('window.jspdf keys:', Object.keys(window.jspdf));
    }
    
    if (window.jsPDF) {
        console.log('window.jsPDF constructor:', typeof window.jsPDF);
    }
    
    console.log('==================');
}

// Función para probar jsPDF después de cargar
function testJsPDFAfterLoad() {
    console.log('🧪 Probando jsPDF después de cargar...');
    debugJsPDF();
    
    // Intentar crear un documento de prueba
    try {
        let TestDoc = null;
        
        if (window.jspdf && window.jspdf.jsPDF) {
            TestDoc = new window.jspdf.jsPDF();
            console.log('✅ Test exitoso con window.jspdf.jsPDF');
        } else if (window.jsPDF) {
            TestDoc = new window.jsPDF();
            console.log('✅ Test exitoso con window.jsPDF');
        } else if (typeof jsPDF !== 'undefined') {
            TestDoc = new jsPDF();
            console.log('✅ Test exitoso con jsPDF global');
        }
        
        if (TestDoc) {
            console.log('✅ jsPDF funcionando correctamente');
            return true;
        } else {
            console.error('❌ No se pudo crear documento de prueba');
            return false;
        }
    } catch (error) {
        console.error('❌ Error en test de jsPDF:', error);
        return false;
    }
}

/**
 * Descarga un archivo
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Obtiene la fecha actual como string
 */
function getCurrentDateString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Formatea números con separadores de miles
 */
function formatNumber(num) {
    return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Trunca texto a una longitud específica
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Obtiene el nombre de visualización de la categoría
 */
function getCategoryDisplayName(category) {
    const categoryNames = {
        'web-development': 'Desarrollo Web',
        'ecommerce': 'Tienda Online',
        'marketing-digital': 'Marketing Digital',
        'social-media': 'Redes Sociales',
        'seo': 'SEO',
        'branding': 'Branding',
        'design': 'Diseño Gráfico'
    };
    
    return categoryNames[category] || category || 'Sin categoría';
}

/**
 * Obtiene el nombre de visualización del estado
 */
function getStatusDisplayName(status) {
    const statusNames = {
        'cotizacion': 'Cotización',
        'pago procesado': 'Pago Procesado',
        'iniciado': 'Iniciado',
        'desarrollo inicial': 'Desarrollo Inicial',
        'desarrollo medio': 'Desarrollo Medio',
        'finalizado': 'Finalizado',
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'completada': 'Completada'
    };
    
    return statusNames[status] || status || 'Sin estado';
}

/**
 * Obtiene el nombre de visualización del tipo de cita
 */
function getAppointmentTypeDisplayName(type) {
    const typeNames = {
        'consulta-general': 'Consulta General',
        'plan-personalizado': 'Plan Personalizado',
        'seguimiento-proyecto': 'Seguimiento de Proyecto'
    };
    
    return typeNames[type] || type || 'Sin tipo';
}

// Exponer funciones globalmente
window.initReportsModule = initReportsModule;

// CSS adicional para mejorar la apariencia de la tabla
const reportStyles = document.createElement('style');
reportStyles.textContent = `
    .category-badge, .type-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        background-color: rgba(0, 123, 255, 0.2);
        color: #007bff;
        border: 1px solid rgba(0, 123, 255, 0.3);
    }
    
    .type-badge {
        background-color: rgba(23, 162, 184, 0.2);
        color: #17a2b8;
        border: 1px solid rgba(23, 162, 184, 0.3);
    }
    
    /* Loading indicator for library loading */
    .library-loading {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 9999;
        display: none;
    }
`;

document.head.appendChild(reportStyles);
window.loadRequiredLibraries = loadRequiredLibraries;
window.exportToPDF = exportToPDF;
window.debugJsPDF = debugJsPDF;
window.testJsPDFAfterLoad = testJsPDFAfterLoad;

console.log('📊 Módulo de reportes con exportación real cargado correctamente');