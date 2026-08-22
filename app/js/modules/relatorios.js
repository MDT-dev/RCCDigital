// ─── Relatórios Module ──────────────────────────────────────
const RelatoriosModule = {
    render() {
        const container = document.getElementById('main-content');
        
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>Relatórios</h1>
                    <p class="subtitle">Gere relatórios técnicos completos das obras</p>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
                <div class="card">
                    <h3 style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
                        <i data-lucide="file-text"></i> Relatório Geral da Obra
                    </h3>
                    <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">
                        Relatório completo com todas as atividades, estimativas e recomendações de gestão.
                    </p>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <select id="relatorioObraSelect" style="padding:8px 14px;border-radius:var(--radius-sm);background:var(--bg-primary);border:1px solid var(--border);color:var(--text-primary);flex:1;min-width:150px">
                            <option value="">Selecione uma obra...</option>
                            ${DB.obras.map(o => `<option value="${o.id}">${o.nome}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary" onclick="RelatoriosModule.generateReport()">
                            <i data-lucide="file-text"></i> Gerar
                        </button>
                    </div>
                </div>
                <div class="card">
                    <h3 style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
                        <i data-lucide="calculator"></i> Relatório de Estimativas
                    </h3>
                    <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">
                        Detalhamento completo de todas as estimativas de resíduos por grupo e atividade.
                    </p>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <button class="btn btn-primary" onclick="RelatoriosModule.generateEstimativaReport()">
                            <i data-lucide="calculator"></i> Gerar
                        </button>
                        <button class="btn btn-outline" onclick="RelatoriosModule.generateFullReport()">
                            <i data-lucide="file-archive"></i> Relatório Completo
                        </button>
                    </div>
                </div>
            </div>

            <div id="relatorioPreview" class="relatorio-preview" style="display:none">
            </div>
        `;

        lucide.createIcons();
    },

    generateReport() {
        const obraId = parseInt(document.getElementById('relatorioObraSelect')?.value);
        if (!obraId) {
            showToast('Selecione uma obra para gerar o relatório.', 'error');
            return;
        }
        this.generate(obraId);
    },

    generate(obraId) {
        const obra = getObraById(obraId);
        if (!obra) {
            showToast('Obra não encontrada.', 'error');
            return;
        }

        const atividades = getAtividadesByObra(obraId);
        const estimativas = EstimativasModule.calculateAll().filter(e => e.obraId === obraId);
        const totalResiduos = estimativas.reduce((sum, e) => sum + e.estimativa, 0);
        const grupos = GestaoModule.aggregateByGroup(estimativas);

        const preview = document.getElementById('relatorioPreview');
        if (preview) {
            preview.style.display = 'block';
            preview.innerHTML = `
                <div class="relatorio-header">
                    <h3>
                        <i data-lucide="file-text"></i>
                        RELATÓRIO TÉCNICO
                    </h3>
                    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
                        <div>
                            <div style="font-size:1.1rem;font-weight:600">${obra.nome}</div>
                            <div style="color:var(--text-secondary);display:flex;align-items:center;gap:4px">
                                <i data-lucide="map-pin" style="width:14px;height:14px"></i>
                                ${obra.localizacao}
                            </div>
                        </div>
                        <div class="relatorio-meta">
                            <span><i data-lucide="calendar"></i> ${new Date().toLocaleDateString('pt-PT')}</span>
                            <span><i data-lucide="layers"></i> ${obra.pisos} pisos</span>
                            <span><i data-lucide="ruler"></i> ${obra.area} m²</span>
                        </div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">
                    <div style="background:var(--bg-primary);padding:12px;border-radius:var(--radius-sm);text-align:center">
                        <div style="font-size:0.7rem;color:var(--text-muted);display:flex;align-items:center;justify-content:center;gap:4px">
                            <i data-lucide="clipboard-list" style="width:14px;height:14px"></i>
                            Atividades
                        </div>
                        <div style="font-size:1.4rem;font-weight:600">${atividades.length}</div>
                    </div>
                    <div style="background:var(--bg-primary);padding:12px;border-radius:var(--radius-sm);text-align:center">
                        <div style="font-size:0.7rem;color:var(--text-muted);display:flex;align-items:center;justify-content:center;gap:4px">
                            <i data-lucide="scale" style="width:14px;height:14px"></i>
                            Resíduos Estimados
                        </div>
                        <div style="font-size:1.4rem;font-weight:600;color:var(--accent)">${Math.round(totalResiduos)} kg</div>
                    </div>
                    <div style="background:var(--bg-primary);padding:12px;border-radius:var(--radius-sm);text-align:center">
                        <div style="font-size:0.7rem;color:var(--text-muted);display:flex;align-items:center;justify-content:center;gap:4px">
                            <i data-lucide="recycle" style="width:14px;height:14px"></i>
                            Grupos
                        </div>
                        <div style="font-size:1.4rem;font-weight:600">${Object.keys(grupos).length}</div>
                    </div>
                </div>

                <h4 style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="clipboard-list"></i> Atividades Registadas
                </h4>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Atividade</th>
                            <th>Fase</th>
                            <th>Quantidade</th>
                            <th>Estimativa</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${atividades.map(a => {
                            const est = estimativas.find(e => e.atividadeId === a.id);
                            return `
                                <tr>
                                    <td>${a.data}</td>
                                    <td>${a.nome}</td>
                                    <td><span class="badge badge-${a.fase.toLowerCase()}">${a.fase}</span></td>
                                    <td>${a.quantidade} ${a.unidade}</td>
                                    <td>${est ? Math.round(est.estimativa) + ' kg' : '—'}</td>
                                </tr>
                            `;
                        }).join('')}
                        <tr class="total-row">
                            <td colspan="3" style="text-align:right;font-weight:600">TOTAL</td>
                            <td></td>
                            <td style="font-weight:600">${Math.round(totalResiduos)} kg</td>
                        </tr>
                    </tbody>
                </table>

                <h4 style="margin:16px 0 8px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="recycle"></i> Gestão de Resíduos
                </h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    ${Object.entries(grupos).map(([grupo, data]) => {
                        const rec = getRecomendacao(grupo);
                        return `
                            <div style="background:var(--bg-primary);padding:12px;border-radius:var(--radius-sm);border-left:3px solid ${GestaoModule.getColor(grupo)}">
                                <div style="display:flex;justify-content:space-between">
                                    <span style="font-weight:500;display:flex;align-items:center;gap:6px">
                                        <i data-lucide="${GestaoModule.getIcon(grupo)}" style="width:14px;height:14px;color:${GestaoModule.getColor(grupo)}"></i>
                                        ${grupo}
                                    </span>
                                    <span style="font-weight:600">${Math.round(data.total)} kg</span>
                                </div>
                                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">
                                    <div><i data-lucide="recycle" style="width:12px;height:12px;display:inline"></i> ${rec?.reutilizacao || 'N/A'}</div>
                                    <div><i data-lucide="package" style="width:12px;height:12px;display:inline"></i> ${rec?.destino || 'N/A'}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="margin-top:16px;display:flex;gap:12px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:16px">
                    <button class="btn btn-primary" onclick="RelatoriosModule.exportPDF(${obraId})">
                        <i data-lucide="file-pdf"></i> Exportar PDF
                    </button>
                    <button class="btn btn-outline" onclick="RelatoriosModule.exportExcel(${obraId})">
                        <i data-lucide="file-spreadsheet"></i> Exportar Excel
                    </button>
                </div>
            `;
            lucide.createIcons();
        }

        showToast(`Relatório da obra "${obra.nome}" gerado com sucesso!`, 'success');
    },

    generateEstimativaReport() {
        const estimativas = EstimativasModule.calculateAll();
        const total = estimativas.reduce((sum, e) => sum + e.estimativa, 0);
        const grupos = GestaoModule.aggregateByGroup(estimativas);

        const preview = document.getElementById('relatorioPreview');
        if (preview) {
            preview.style.display = 'block';
            preview.innerHTML = `
                <div class="relatorio-header">
                    <h3>
                        <i data-lucide="calculator"></i>
                        RELATÓRIO DE ESTIMATIVAS
                    </h3>
                    <div class="relatorio-meta">
                        <span><i data-lucide="calendar"></i> ${new Date().toLocaleDateString('pt-PT')}</span>
                        <span><i data-lucide="clipboard-list"></i> ${estimativas.length} registos</span>
                        <span><i data-lucide="scale"></i> ${Math.round(total)} kg total</span>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px">
                    ${Object.entries(grupos).map(([grupo, data]) => `
                        <div style="background:var(--bg-primary);padding:12px;border-radius:var(--radius-sm);text-align:center">
                            <div style="font-size:0.7rem;color:var(--text-muted);display:flex;align-items:center;justify-content:center;gap:4px">
                                <i data-lucide="${GestaoModule.getIcon(grupo)}" style="width:14px;height:14px;color:${GestaoModule.getColor(grupo)}"></i>
                                ${grupo}
                            </div>
                            <div style="font-size:1.2rem;font-weight:600;color:${GestaoModule.getColor(grupo)}">${Math.round(data.total)} kg</div>
                            <div style="font-size:0.7rem;color:var(--text-muted)">${data.atividades} atividades</div>
                        </div>
                    `).join('')}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Obra</th>
                            <th>Atividade</th>
                            <th>Fase</th>
                            <th>Grupo</th>
                            <th>Estimativa</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${estimativas.map(e => `
                            <tr>
                                <td><strong>${e.obraNome}</strong></td>
                                <td>${e.atividade}</td>
                                <td><span class="badge badge-${e.fase.toLowerCase()}">${e.fase}</span></td>
                                <td><span class="badge badge-${e.grupo.toLowerCase()}">${e.grupo}</span></td>
                                <td><strong>${Math.round(e.estimativa)} kg</strong></td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="4" style="text-align:right;font-weight:600">TOTAL GERAL</td>
                            <td style="font-weight:600">${Math.round(total)} kg</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top:16px;display:flex;gap:12px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:16px">
                    <button class="btn btn-primary" onclick="RelatoriosModule.exportPDF()">
                        <i data-lucide="file-pdf"></i> Exportar PDF
                    </button>
                </div>
            `;
            lucide.createIcons();
        }

        showToast('Relatório de estimativas gerado!', 'success');
    },

    generateFullReport() {
        const preview = document.getElementById('relatorioPreview');
        if (preview) {
            let html = `
                <div class="relatorio-header">
                    <h3>
                        <i data-lucide="file-archive"></i>
                        RELATÓRIO COMPLETO - TODAS AS OBRAS
                    </h3>
                    <div class="relatorio-meta">
                        <span><i data-lucide="calendar"></i> ${new Date().toLocaleDateString('pt-PT')}</span>
                        <span><i data-lucide="building-2"></i> ${DB.obras.length} obras</span>
                        <span><i data-lucide="clipboard-list"></i> ${DB.atividades.length} atividades</span>
                    </div>
                </div>
            `;

            for (const obra of DB.obras) {
                const atividades = getAtividadesByObra(obra.id);
                const estimativas = EstimativasModule.calculateAll().filter(e => e.obraId === obra.id);
                const total = estimativas.reduce((sum, e) => sum + e.estimativa, 0);
                const grupos = GestaoModule.aggregateByGroup(estimativas);

                html += `
                    <div style="margin-bottom:24px;border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px">
                        <h4 style="font-family:'Space Grotesk',sans-serif;display:flex;align-items:center;gap:8px">
                            <i data-lucide="home"></i>
                            ${obra.nome}
                        </h4>
                        <div style="display:flex;gap:16px;font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;flex-wrap:wrap">
                            <span style="display:flex;align-items:center;gap:4px"><i data-lucide="map-pin" style="width:14px;height:14px"></i> ${obra.localizacao}</span>
                            <span style="display:flex;align-items:center;gap:4px"><i data-lucide="ruler" style="width:14px;height:14px"></i> ${obra.area} m²</span>
                            <span style="display:flex;align-items:center;gap:4px"><i data-lucide="scale" style="width:14px;height:14px"></i> ${Math.round(total)} kg</span>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            ${Object.entries(grupos).map(([g, d]) => 
                                `<span style="font-size:0.7rem;background:var(--bg-primary);padding:2px 10px;border-radius:12px;display:flex;align-items:center;gap:4px;color:${GestaoModule.getColor(g)}">
                                    <i data-lucide="${GestaoModule.getIcon(g)}" style="width:12px;height:12px"></i>
                                    ${g}: ${Math.round(d.total)}kg
                                </span>`
                            ).join('')}
                            ${Object.keys(grupos).length === 0 ? '<span style="font-size:0.8rem;color:var(--text-muted)">Sem estimativas</span>' : ''}
                        </div>
                        <div style="margin-top:8px;font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;gap:4px">
                            <i data-lucide="clipboard-list" style="width:14px;height:14px"></i>
                            ${atividades.length} atividade${atividades.length > 1 ? 's' : ''}
                        </div>
                    </div>
                `;
            }

            html += `
                <div style="margin-top:16px;display:flex;gap:12px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:16px">
                    <button class="btn btn-primary" onclick="RelatoriosModule.exportPDF()">
                        <i data-lucide="file-pdf"></i> Exportar PDF
                    </button>
                </div>
            `;

            preview.style.display = 'block';
            preview.innerHTML = html;
            lucide.createIcons();
        }

        showToast('Relatório completo gerado!', 'success');
    },

    exportPDF() {
        showToast('PDF exportado com sucesso! (Simulação)', 'success');
    },

    exportExcel() {
        showToast('Excel exportado com sucesso! (Simulação)', 'success');
    }
};