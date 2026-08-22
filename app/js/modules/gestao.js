// ─── Gestão Module ──────────────────────────────────────────
const GestaoModule = {
    render() {
        const container = document.getElementById('main-content');
        const estimativas = EstimativasModule.calculateAll();
        const grupos = this.aggregateByGroup(estimativas);

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>Gestão de Resíduos</h1>
                    <p class="subtitle">Estratégias de segregação, reutilização e destinação</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline" onclick="GestaoModule.exportReport()">
                        <i data-lucide="file-text"></i> Exportar Relatório
                    </button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="label">Total de Resíduos</div>
                    <div class="value">${Math.round(estimativas.reduce((s, e) => s + e.estimativa, 0))} <span class="sub" style="font-size:0.8rem">kg</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Grupos Identificados</div>
                    <div class="value">${Object.keys(grupos).length}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Potencial de Reutilização</div>
                    <div class="value" style="font-size:1.2rem;color:var(--accent)">Alto</div>
                    <div class="sub">Com base nos resíduos gerados</div>
                </div>
            </div>

            <div class="gestao-grid">
                ${Object.entries(grupos).map(([grupo, data]) => {
                    const recomendacao = getRecomendacao(grupo);
                    return `
                        <div class="gestao-card">
                            <div class="group-header">
                                <span class="dot" style="background:${this.getColor(grupo)}"></span>
                                <h4>
                                    <i data-lucide="${this.getIcon(grupo)}"></i>
                                    ${grupo}
                                </h4>
                            </div>
                            <div class="group-quantity">${Math.round(data.total)} kg</div>
                            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px">
                                ${data.atividades} atividade${data.atividades > 1 ? 's' : ''}
                            </div>
                            <div class="suggestions">
                                <ul>
                                    <li><strong>Segregação:</strong> ${recomendacao?.segregacao || 'Separar adequadamente'}</li>
                                    <li><strong>Acondicionamento:</strong> ${recomendacao?.acondicionamento || 'Armazenar conforme especificação'}</li>
                                    <li><strong>Reutilização:</strong> ${recomendacao?.reutilizacao || 'Avaliar possibilidade de reaproveitamento'}</li>
                                    <li><strong>Destino:</strong> ${recomendacao?.destino || 'Encaminhar para destino adequado'}</li>
                                </ul>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        lucide.createIcons();
    },

    aggregateByGroup(estimativas) {
        const groups = {};
        for (const e of estimativas) {
            if (!groups[e.grupo]) {
                groups[e.grupo] = { total: 0, atividades: 0 };
            }
            groups[e.grupo].total += e.estimativa;
            groups[e.grupo].atividades += 1;
        }
        return groups;
    },

    getColor(grupo) {
        const colors = {
            'Minerais': '#4ade80',
            'Madeira': '#fbbf24',
            'Metais': '#60a5fa',
            'Plásticos': '#f87171',
            'Outros': '#94a3b8'
        };
        return colors[grupo] || '#94a3b8';
    },

    getIcon(grupo) {
        const icons = {
            'Minerais': 'mountain',
            'Madeira': 'tree-pine',
            'Metais': 'cog',
            'Plásticos': 'beaker',
            'Outros': 'package'
        };
        return icons[grupo] || 'package';
    },

    renderSummary(obraId, embedded = false) {
        const estimativas = EstimativasModule.calculateAll().filter(e => e.obraId === obraId);
        const grupos = this.aggregateByGroup(estimativas);

        if (Object.keys(grupos).length === 0) {
            return `
                <div class="empty-state" style="padding:20px">
                    <p style="font-size:0.85rem">Nenhum resíduo estimado para esta obra.</p>
                </div>
            `;
        }

        return `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
                ${Object.entries(grupos).map(([grupo, data]) => {
                    const rec = getRecomendacao(grupo);
                    return `
                        <div style="background:var(--bg-primary);border-radius:var(--radius-sm);padding:14px 16px;border-left:3px solid ${this.getColor(grupo)}">
                            <div style="display:flex;justify-content:space-between;align-items:center">
                                <span style="font-weight:500;display:flex;align-items:center;gap:6px">
                                    <i data-lucide="${this.getIcon(grupo)}" style="width:14px;height:14px;color:${this.getColor(grupo)}"></i>
                                    ${grupo}
                                </span>
                                <span style="font-weight:600">${Math.round(data.total)} kg</span>
                            </div>
                            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">
                                ${data.atividades} atividade${data.atividades > 1 ? 's' : ''}
                            </div>
                            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:6px;border-top:1px solid var(--border);padding-top:6px">
                                ${rec?.reutilizacao?.substring(0, 60)}${rec?.reutilizacao?.length > 60 ? '...' : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    exportReport() {
        const estimativas = EstimativasModule.calculateAll();
        const grupos = this.aggregateByGroup(estimativas);
        
        let report = '=== RELATÓRIO DE GESTÃO DE RESÍDUOS ===\n';
        report += `Data: ${new Date().toLocaleDateString('pt-PT')}\n\n`;
        report += 'RESUMO POR GRUPO:\n';
        report += '-'.repeat(40) + '\n';
        
        for (const [grupo, data] of Object.entries(grupos)) {
            const rec = getRecomendacao(grupo);
            report += `\n${grupo.toUpperCase()}\n`;
            report += `  Quantidade: ${Math.round(data.total)} kg\n`;
            report += `  Atividades: ${data.atividades}\n`;
            report += `  Reutilização: ${rec?.reutilizacao || 'N/A'}\n`;
            report += `  Destino: ${rec?.destino || 'N/A'}\n`;
        }
        
        report += '\n' + '-'.repeat(40) + '\n';
        const total = estimativas.reduce((s, e) => s + e.estimativa, 0);
        report += `TOTAL GERAL: ${Math.round(total)} kg\n`;

        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_gestao_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Relatório exportado com sucesso!', 'success');
    }
};