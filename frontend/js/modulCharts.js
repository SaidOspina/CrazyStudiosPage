/**
 * IMPLEMENTACIÓN DE GRÁFICOS DEL DASHBOARD ADMINISTRADOR
 * Gráficos: Proyectos por Estado y Registro de Clientes
 */

// Variables globales para los gráficos
let projectsStatusChart = null;
let clientsRegisterChart = null;

/**
 * Inicializa todos los gráficos del dashboard
 */
async function initDashboardCharts() {
    console.log('📊 Inicializando gráficos del dashboard...');
    
    try {
        // Verificar si Chart.js está disponible
        if (typeof Chart === 'undefined') {
            console.log('📦 Cargando Chart.js...');
            await loadChartJS();
        }
        
        // Inicializar gráficos
        await Promise.all([
            initProjectsStatusChart(),
            initClientsRegisterChart()
        ]);
        
        console.log('✅ Todos los gráficos inicializados correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar gráficos:', error);
        showChartError('Error al cargar los gráficos. Verifica tu conexión.');
    }
}

/**
 * Carga Chart.js dinámicamente si no está disponible
 */
function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
        script.onload = () => {
            console.log('✅ Chart.js cargado correctamente');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Error al cargar Chart.js');
            reject(new Error('No se pudo cargar Chart.js'));
        };
        document.head.appendChild(script);
    });
}

/**
 * Inicializa el gráfico de Proyectos por Estado
 */
async function initProjectsStatusChart() {
    console.log('📈 Inicializando gráfico de Proyectos por Estado...');
    
    try {
        const projectsData = await fetchProjectsData();
        const chartData = processProjectsStatusData(projectsData);
        
        const canvas = document.querySelector('#projects-status-chart canvas');
        if (!canvas) {
            console.error('❌ Canvas para gráfico de proyectos no encontrado');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico existente si existe
        if (projectsStatusChart) {
            projectsStatusChart.destroy();
        }
        
        projectsStatusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.data,
                    backgroundColor: [
                        '#FF6B6B', // Cotización - Rojo suave
                        '#4ECDC4', // Pago Procesado - Turquesa
                        '#45B7D1', // Iniciado - Azul
                        '#96CEB4', // Desarrollo Inicial - Verde claro
                        '#FFEAA7', // Desarrollo Medio - Amarillo
                        '#DDA0DD', // Finalizado - Lila
                    ],
                    borderColor: '#1e1e1e',
                    borderWidth: 2,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        display: true,
                        labels: {
                            color: '#ffffff',
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#333',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
        
        console.log('✅ Gráfico de Proyectos por Estado creado:', chartData);
        
    } catch (error) {
        console.error('❌ Error al crear gráfico de proyectos:', error);
        showChartError('Error al cargar gráfico de proyectos');
    }
}

/**
 * Inicializa el gráfico de Registro de Clientes
 */
async function initClientsRegisterChart() {
    console.log('📈 Inicializando gráfico de Registro de Clientes...');
    
    try {
        const clientsData = await fetchClientsData();
        const chartData = processClientsRegisterData(clientsData);
        
        const canvas = document.querySelector('#clients-register-chart canvas');
        if (!canvas) {
            console.error('❌ Canvas para gráfico de clientes no encontrado');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico existente si existe
        if (clientsRegisterChart) {
            clientsRegisterChart.destroy();
        }
        
        clientsRegisterChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Nuevos Clientes',
                    data: chartData.data,
                    backgroundColor: 'rgba(70, 183, 209, 0.8)',
                    borderColor: '#46B7D1',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                    hoverBackgroundColor: 'rgba(70, 183, 209, 1)',
                    hoverBorderColor: '#ffffff',
                    hoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#333',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return `${context[0].label}`;
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                const singular = value === 1 ? 'cliente' : 'clientes';
                                return `${value} ${singular} registrado${value !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 11
                            },
                            stepSize: 1,
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeInOutBounce'
                }
            }
        });
        
        console.log('✅ Gráfico de Registro de Clientes creado:', chartData);
        
    } catch (error) {
        console.error('❌ Error al crear gráfico de clientes:', error);
        showChartError('Error al cargar gráfico de clientes');
    }
}

/**
 * Obtiene datos de proyectos desde la API
 */
async function fetchProjectsData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No hay token de autenticación');
    }
    
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
    
    console.log('🔄 Obteniendo datos de proyectos...');
    
    const response = await fetch(`${API_BASE}/api/projects?limit=1000`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Datos de proyectos obtenidos:', data.data?.length || 0, 'proyectos');
    
    return data.data || [];
}

/**
 * Obtiene datos de clientes desde la API
 */
async function fetchClientsData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No hay token de autenticación');
    }
    
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
    
    console.log('🔄 Obteniendo datos de clientes...');
    
    const response = await fetch(`${API_BASE}/api/users?limit=1000`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const clients = (data.data || []).filter(user => user.rol === 'cliente');
    
    console.log('✅ Datos de clientes obtenidos:', clients.length, 'clientes');
    
    return clients;
}

/**
 * Procesa los datos de proyectos para el gráfico de estados
 */
function processProjectsStatusData(projects) {
    console.log('🔄 Procesando datos de proyectos por estado...');
    
    // Mapeo de estados a nombres amigables
    const statusMap = {
        'cotizacion': 'Cotización',
        'pago procesado': 'Pago Procesado',
        'iniciado': 'Iniciado',
        'desarrollo inicial': 'Desarrollo Inicial',
        'desarrollo medio': 'Desarrollo Medio',
        'finalizado': 'Finalizado'
    };
    
    // Contar proyectos por estado
    const statusCounts = {};
    
    // Inicializar contadores
    Object.keys(statusMap).forEach(status => {
        statusCounts[status] = 0;
    });
    
    // Contar proyectos
    projects.forEach(project => {
        const status = project.estado?.toLowerCase() || 'cotizacion';
        if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
        } else {
            // Manejar estados no mapeados
            statusCounts['cotizacion']++;
        }
    });
    
    // Filtrar estados con al menos 1 proyecto para mostrar solo datos relevantes
    const relevantStates = Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]); // Ordenar por cantidad descendente
    
    // Si no hay datos relevantes, mostrar al menos un estado
    if (relevantStates.length === 0) {
        relevantStates.push(['cotizacion', 0]);
    }
    
    const chartData = {
        labels: relevantStates.map(([status, _]) => statusMap[status] || status),
        data: relevantStates.map(([_, count]) => count)
    };
    
    console.log('✅ Datos procesados para gráfico de proyectos:', chartData);
    
    return chartData;
}

/**
 * Procesa los datos de clientes para el gráfico de registro
 */
function processClientsRegisterData(clients) {
    console.log('🔄 Procesando datos de registro de clientes...');
    
    // Obtener últimos 6 meses
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            label: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
            count: 0
        });
    }
    
    // Contar clientes por mes
    clients.forEach(client => {
        if (!client.fechaRegistro) return;
        
        const registrationDate = new Date(client.fechaRegistro);
        const monthKey = `${registrationDate.getFullYear()}-${String(registrationDate.getMonth() + 1).padStart(2, '0')}`;
        
        const monthData = months.find(m => m.key === monthKey);
        if (monthData) {
            monthData.count++;
        }
    });
    
    const chartData = {
        labels: months.map(m => m.label),
        data: months.map(m => m.count)
    };
    
    console.log('✅ Datos procesados para gráfico de clientes:', chartData);
    
    return chartData;
}

/**
 * Muestra mensaje de error en los gráficos
 */
function showChartError(message) {
    console.log('⚠️ Mostrando error en gráficos:', message);
    
    const chartContainers = [
        '#projects-status-chart',
        '#clients-register-chart'
    ];
    
    chartContainers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: #666;
                    text-align: center;
                    padding: 20px;
                ">
                    <i class="fas fa-chart-bar" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p style="margin: 0; font-size: 14px;">${message}</p>
                    <button onclick="initDashboardCharts()" style="
                        margin-top: 12px;
                        padding: 8px 16px;
                        background: var(--primary-color, #007bff);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    });
}

/**
 * Actualiza los gráficos con nuevos datos
 */
async function refreshDashboardCharts() {
    console.log('🔄 Actualizando gráficos del dashboard...');
    
    try {
        showToast('Actualizando gráficos...', 'info');
        
        // Actualizar gráfico de proyectos
        if (projectsStatusChart) {
            const projectsData = await fetchProjectsData();
            const chartData = processProjectsStatusData(projectsData);
            
            projectsStatusChart.data.labels = chartData.labels;
            projectsStatusChart.data.datasets[0].data = chartData.data;
            projectsStatusChart.update('active');
        }
        
        // Actualizar gráfico de clientes
        if (clientsRegisterChart) {
            const clientsData = await fetchClientsData();
            const chartData = processClientsRegisterData(clientsData);
            
            clientsRegisterChart.data.labels = chartData.labels;
            clientsRegisterChart.data.datasets[0].data = chartData.data;
            clientsRegisterChart.update('active');
        }
        
        showToast('Gráficos actualizados correctamente', 'success');
        console.log('✅ Gráficos actualizados correctamente');
        
    } catch (error) {
        console.error('❌ Error al actualizar gráficos:', error);
        showToast('Error al actualizar gráficos', 'error');
    }
}

/**
 * Destruye los gráficos (útil para limpieza)
 */
function destroyDashboardCharts() {
    console.log('🗑️ Destruyendo gráficos...');
    
    if (projectsStatusChart) {
        projectsStatusChart.destroy();
        projectsStatusChart = null;
    }
    
    if (clientsRegisterChart) {
        clientsRegisterChart.destroy();
        clientsRegisterChart = null;
    }
}

/**
 * Redimensiona los gráficos (útil para responsive)
 */
function resizeDashboardCharts() {
    console.log('📏 Redimensionando gráficos...');
    
    if (projectsStatusChart) {
        projectsStatusChart.resize();
    }
    
    if (clientsRegisterChart) {
        clientsRegisterChart.resize();
    }
}

// Exponer funciones globalmente
window.initDashboardCharts = initDashboardCharts;
window.refreshDashboardCharts = refreshDashboardCharts;
window.destroyDashboardCharts = destroyDashboardCharts;
window.resizeDashboardCharts = resizeDashboardCharts;

// Event listeners
window.addEventListener('resize', () => {
    setTimeout(resizeDashboardCharts, 100);
});

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para que se carguen los datos de estadísticas
    setTimeout(() => {
        if (document.getElementById('overview')?.classList.contains('active')) {
            initDashboardCharts();
        }
    }, 2000);
});

console.log('📊 Módulo de gráficos del dashboard cargado correctamente');