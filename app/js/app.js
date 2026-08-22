// ─── Main Application ──────────────────────────────────────

// ─── Toast System ──────────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon"><i data-lucide="${icons[type] || 'info'}"></i></span>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i data-lucide="x"></i>
        </button>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ─── Navigation ────────────────────────────────────────────
function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    switch (page) {
        case 'dashboard':
            DashboardModule.render();
            break;
        case 'obras':
            ObrasModule.render();
            break;
        case 'atividades':
            AtividadesModule.render();
            break;
        case 'estimativas':
            EstimativasModule.render();
            break;
        case 'gestao':
            GestaoModule.render();
            break;
        case 'relatorios':
            RelatoriosModule.render();
            break;
        default:
            DashboardModule.render();
    }
}

// ─── Dashboard Module ──────────────────────────────────────
const DashboardModule = {
    render() {
        const container = document.getElementById('main-content');
        const totalObras = DB.obras.length;
        const totalAtividades = DB.atividades.length;
        const estimativas = EstimativasModule.calculateAll();
        const totalResiduos = estimativas.reduce((sum, e) => sum + e.estimativa, 0);
        const grupos = GestaoModule.aggregateByGroup(estimativas);

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p class="subtitle">Visão geral da gestão de resíduos das obras</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="ObrasModule.openCreateModal()">
                        <i data-lucide="plus"></i> Nova Obra
                    </button>
                    <button class="btn btn-outline" onclick="AtividadesModule.openCreateModal()">
                        <i data-lucide="plus"></i> Nova Atividade
                    </button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="label">Obras Ativas</div>
                    <div class="value">${totalObras}</div>
                    <div class="sub">${DB.obras.filter(o => o.estado === 'execucao').length} em execução</div>
                </div>
                <div class="stat-card">
                    <div class="label">Atividades Registadas</div>
                    <div class="value">${totalAtividades}</div>
                    <div class="sub">última: ${DB.atividades[0]?.data || '—'}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Resíduos Estimados</div>
                    <div class="value">${Math.round(totalResiduos)} <span class="sub" style="font-size:0.8rem">kg</span></div>
                    <div class="sub">${Object.keys(grupos).length} grupos identificados</div>
                </div>
                <div class="stat-card">
                    <div class="label">Principal Grupo</div>
                    <div class="value" style="font-size:1.2rem;color:var(--accent)">
                        ${Object.entries(grupos).sort((a,b) => b[1].total - a[1].total)[0]?.[0] || '—'}
                    </div>
                    <div class="sub">
                        ${Object.entries(grupos).sort((a,b) => b[1].total - a[1].total)[0]?.[1] ? 
                            Math.round(Object.entries(grupos).sort((a,b) => b[1].total - a[1].total)[0][1].total) + ' kg' : 
                            'N/A'}
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card">
                    <h3>Distribuição por Grupo</h3>
                    <div class="chart-wrapper">
                        <canvas id="dashboardPieChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3>Resíduos por Obra</h3>
                    <div class="chart-wrapper">
                        <canvas id="dashboardBarChart"></canvas>
                    </div>
                </div>
            </div>

            <div style="margin-top:20px">
                <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="clipboard-list"></i> Atividades Recentes
                </h3>
                ${AtividadesModule.renderTable()}
            </div>
        `;

        lucide.createIcons();

        setTimeout(() => {
            this.initCharts(grupos);
        }, 100);
    },

    initCharts(groups) {
        const colors = {
            'Minerais': '#4ade80',
            'Madeira': '#fbbf24',
            'Metais': '#60a5fa',
            'Plásticos': '#f87171',
            'Outros': '#94a3b8'
        };

        const pieCtx = document.getElementById('dashboardPieChart');
        if (pieCtx) {
            new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(groups),
                    datasets: [{
                        data: Object.values(groups).map(d => d.total),
                        backgroundColor: Object.keys(groups).map(g => colors[g] || '#94a3b8'),
                        borderColor: 'var(--bg-primary)',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: 'var(--text-secondary)',
                                padding: 12,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        }

        const barCtx = document.getElementById('dashboardBarChart');
        if (barCtx) {
            const obras = {};
            for (const e of EstimativasModule.calculateAll()) {
                if (!obras[e.obraNome]) obras[e.obraNome] = 0;
                obras[e.obraNome] += e.estimativa;
            }

            new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(obras),
                    datasets: [{
                        label: 'Resíduos (kg)',
                        data: Object.values(obras),
                        backgroundColor: 'rgba(74, 222, 128, 0.6)',
                        borderColor: '#4ade80',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'var(--border)'
                            },
                            ticks: {
                                color: 'var(--text-muted)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: 'var(--text-muted)',
                                maxRotation: 45
                            }
                        }
                    }
                }
            });
        }
    }
};

// ─── Initialize Application ──────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            navigateTo(page);
        });
    });

    navigateTo('dashboard');

    ObrasModule.updateCounts();
    AtividadesModule.updateCounts();
});

window.showToast = showToast;
window.navigateTo = navigateTo;
window.ObrasModule = ObrasModule;
window.AtividadesModule = AtividadesModule;
window.EstimativasModule = EstimativasModule;
window.GestaoModule = GestaoModule;
window.RelatoriosModule = RelatoriosModule;
window.DashboardModule = DashboardModule;