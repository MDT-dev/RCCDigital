// ─── Estimativas Module ─────────────────────────────────────
const EstimativasModule = {
    render() {
        const container = document.getElementById('main-content');
        
        const allEstimativas = this.calculateAll();
        const totalResiduos = allEstimativas.reduce((sum, e) => sum + e.estimativa, 0);
        const grupos = this.groupByType(allEstimativas);

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>Estimativas</h1>
                    <p class="subtitle">Visão geral de todos os resíduos estimados</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline" onclick="EstimativasModule.exportCSV()">
                        <i data-lucide="download"></i> Exportar CSV
                    </button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="label">Total Estimado</div>
                    <div class="value">${Math.round(totalResiduos)} <span class="sub" style="font-size:0.8rem">kg</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Atividades Analisadas</div>
                    <div class="value">${allEstimativas.length}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Grupos de Resíduos</div>
                    <div class="value">${Object.keys(grupos).length}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Principal Grupo</div>
                    <div class="value" style="font-size:1.2rem">${this.getMainGroup(grupos)}</div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card">
                    <h3>Distribuição por Grupo</h3>
                    <div class="chart-wrapper">
                        <canvas id="estimativaPieChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3>Resíduos por Obra</h3>
                    <div class="chart-wrapper">
                        <canvas id="estimativaBarChart"></canvas>
                    </div>
                </div>
            </div>

            ${this.renderTable()}
        `;

        lucide.createIcons();
        this.initCharts(grupos);
        this.updateCounts();
    },

    calculateAll() {
        const results = [];
        for (const ativ of DB.atividades) {
            const result = calcularEstimativa(ativ.nome, ativ.quantidade, ativ.unidade);
            if (result) {
                const obra = getObraById(ativ.obraId);
                results.push({
                    atividadeId: ativ.id,
                    obraId: ativ.obraId,
                    obraNome: obra?.nome || 'N/A',
                    atividade: ativ.nome,
                    fase: ativ.fase,
                    quantidade: ativ.quantidade,
                    unidade: ativ.unidade,
                    grupo: result.grupo,
                    estimativa: result.estimativa,
                    coeficiente: result.coeficiente,
                    referencia: result.referencia
                });
            }
        }
        return results;
    },

    groupByType(estimativas) {
        const groups = {};
        for (const e of estimativas) {
            if (!groups[e.grupo]) groups[e.grupo] = 0;
            groups[e.grupo] += e.estimativa;
        }
        return groups;
    },

    getMainGroup(groups) {
        let max = 0;
        let main = '—';
        for (const [key, value] of Object.entries(groups)) {
            if (value > max) {
                max = value;
                main = key;
            }
        }
        return main;
    },

    initCharts(groups) {
        const colors = {
            'Minerais': '#4ade80',
            'Madeira': '#fbbf24',
            'Metais': '#60a5fa',
            'Plásticos': '#f87171',
            'Outros': '#94a3b8'
        };

        const pieCtx = document.getElementById('estimativaPieChart');
        if (pieCtx) {
            new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(groups),
                    datasets: [{
                        data: Object.values(groups),
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

        const barCtx = document.getElementById('estimativaBarChart');
        if (barCtx) {
            const obras = {};
            for (const e of this.calculateAll()) {
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
    },

    renderTable(obraId = null, embedded = false) {
        const estimativas = this.calculateAll();
        const filtered = obraId ? estimativas.filter(e => e.obraId === obraId) : estimativas;

        if (filtered.length === 0) {
            return `
                <div class="empty-state">
                    <div class="icon"><i data-lucide="calculator"></i></div>
                    <h3>Nenhuma estimativa disponível</h3>
                    <p>Registe atividades para gerar estimativas de resíduos</p>
                </div>
            `;
        }

        const total = filtered.reduce((sum, e) => sum + e.estimativa, 0);

        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>${embedded ? '' : 'Todas as Estimativas'}</h3>
                    <span style="font-size:0.8rem;color:var(--text-muted)">Total: ${Math.round(total)} kg</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            ${!embedded ? '<th>Obra</th>' : ''}
                            <th>Atividade</th>
                            <th>Fase</th>
                            <th>Quantidade</th>
                            <th>Grupo</th>
                            <th>Estimativa</th>
                            <th>Coeficiente</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(e => `
                            <tr>
                                ${!embedded ? `<td><strong>${e.obraNome}</strong></td>` : ''}
                                <td>${e.atividade}</td>
                                <td><span class="badge badge-${e.fase.toLowerCase()}">${e.fase}</span></td>
                                <td>${e.quantidade} ${e.unidade}</td>
                                <td><span class="badge badge-${e.grupo.toLowerCase()}">${e.grupo}</span></td>
                                <td><strong>${Math.round(e.estimativa)} kg</strong></td>
                                <td style="font-size:0.75rem;color:var(--text-muted)">${e.coeficiente} ${e.unidade}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td ${!embedded ? 'colspan="5"' : 'colspan="4"'} style="text-align:right;font-weight:600">TOTAL</td>
                            <td style="font-weight:600">${Math.round(total)} kg</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    exportCSV() {
        const estimativas = this.calculateAll();
        if (estimativas.length === 0) {
            showToast('Não há dados para exportar.', 'error');
            return;
        }

        let csv = 'Obra,Atividade,Fase,Quantidade,Unidade,Grupo,Estimativa (kg),Coeficiente\n';
        for (const e of estimativas) {
            csv += `${e.obraNome},${e.atividade},${e.fase},${e.quantidade},${e.unidade},${e.grupo},${e.estimativa},${e.coeficiente}\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estimativas_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('CSV exportado com sucesso!', 'success');
    },

    updateCounts() {}
};