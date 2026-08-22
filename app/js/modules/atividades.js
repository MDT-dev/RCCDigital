// ─── Atividades Module ──────────────────────────────────────
const AtividadesModule = {
    render() {
        const container = document.getElementById('main-content');
        
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>Atividades</h1>
                    <p class="subtitle">Registro de atividades executadas nas obras</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="AtividadesModule.openCreateModal()">
                        <i data-lucide="plus"></i> Nova Atividade
                    </button>
                </div>
            </div>

            <div class="search-bar">
                <div class="search-wrapper">
                    <i data-lucide="search"></i>
                    <input type="text" placeholder="Pesquisar atividade..." id="searchAtividade" oninput="AtividadesModule.filter()">
                </div>
                <select id="filterObra" onchange="AtividadesModule.filter()">
                    <option value="">Todas as obras</option>
                    ${DB.obras.map(o => `<option value="${o.id}">${o.nome}</option>`).join('')}
                </select>
                <select id="filterFase" onchange="AtividadesModule.filter()">
                    <option value="">Todas as fases</option>
                    <option value="Estrutura">Estrutura</option>
                    <option value="Alvenaria">Alvenaria</option>
                    <option value="Revestimento">Revestimento</option>
                    <option value="Instalações">Instalações</option>
                    <option value="Acabamentos">Acabamentos</option>
                </select>
            </div>

            ${this.renderTable()}
        `;

        lucide.createIcons();
        this.updateCounts();
    },

    renderTable(obraId = null, embedded = false) {
        let atividades = DB.atividades;
        if (obraId) {
            atividades = atividades.filter(a => a.obraId === obraId);
        }

        if (atividades.length === 0) {
            return `
                <div class="empty-state">
                    <div class="icon"><i data-lucide="clipboard-list"></i></div>
                    <h3>Nenhuma atividade registada</h3>
                    <p>Registe a primeira atividade para começar a estimar resíduos</p>
                </div>
            `;
        }

        const tableHtml = `
            <div class="table-container">
                <div class="table-header">
                    <h3>${embedded ? '' : 'Todas as Atividades'}</h3>
                    <span style="font-size:0.8rem;color:var(--text-muted)">${atividades.length} registos</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            ${!embedded ? '<th>Obra</th>' : ''}
                            <th>Fase</th>
                            <th>Atividade</th>
                            <th>Quantidade</th>
                            <th>Estimativa</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${atividades.map(a => {
                            const obra = getObraById(a.obraId);
                            const estimativa = calcularEstimativa(a.nome, a.quantidade, a.unidade);
                            return `
                                <tr>
                                    <td>${a.data}</td>
                                    ${!embedded ? `<td><strong>${obra?.nome || 'N/A'}</strong></td>` : ''}
                                    <td><span class="badge badge-${a.fase.toLowerCase()}">${a.fase}</span></td>
                                    <td>${a.nome}</td>
                                    <td>${a.quantidade} ${a.unidade}</td>
                                    <td>${estimativa ? `${estimativa.estimativa} kg` : '—'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline" onclick="AtividadesModule.viewEstimativa(${a.id})">
                                            <i data-lucide="eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="AtividadesModule.delete(${a.id})">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        return tableHtml;
    },

    filter() {
        const search = document.getElementById('searchAtividade')?.value?.toLowerCase() || '';
        const obraId = document.getElementById('filterObra')?.value;
        const fase = document.getElementById('filterFase')?.value;
        
        let filtered = DB.atividades.filter(a => {
            const matchSearch = a.nome.toLowerCase().includes(search);
            const matchObra = !obraId || a.obraId === parseInt(obraId);
            const matchFase = !fase || a.fase === fase;
            return matchSearch && matchObra && matchFase;
        });
        
        const container = document.getElementById('main-content');
        const tableSection = container.querySelector('.table-container');
        if (tableSection) {
            const newTable = this.renderTable();
            const header = container.querySelector('.page-header');
            const searchBar = container.querySelector('.search-bar');
            container.innerHTML = `
                ${header.outerHTML}
                ${searchBar.outerHTML}
                ${this.renderTable()}
            `;
            lucide.createIcons();
        }
    },

    openCreateModal(obraId = null) {
        const modal = document.getElementById('modal-container');
        const obrasOptions = DB.obras.map(o => 
            `<option value="${o.id}" ${o.id === obraId ? 'selected' : ''}>${o.nome}</option>`
        ).join('');

        modal.innerHTML = `
            <div class="modal-overlay open" onclick="if(event.target===this) this.classList.remove('open')">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Nova Atividade</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('open')">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form onsubmit="AtividadesModule.createAtividade(event)">
                        <div class="form-group">
                            <label>Obra *</label>
                            <select id="ativObra" required>
                                <option value="">Selecione uma obra...</option>
                                ${obrasOptions}
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Fase Construtiva *</label>
                                <select id="ativFase" required>
                                    <option value="">Selecione...</option>
                                    <option value="Estrutura">Estrutura</option>
                                    <option value="Alvenaria">Alvenaria</option>
                                    <option value="Revestimento">Revestimento</option>
                                    <option value="Instalações">Instalações</option>
                                    <option value="Acabamentos">Acabamentos</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Atividade *</label>
                                <input type="text" id="ativNome" placeholder="Ex: Execução de paredes em bloco" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Quantidade *</label>
                                <input type="number" id="ativQty" placeholder="200" min="0.1" step="0.1" required>
                            </div>
                            <div class="form-group">
                                <label>Unidade *</label>
                                <select id="ativUnidade" required>
                                    <option value="m²">m²</option>
                                    <option value="m³">m³</option>
                                    <option value="kg">kg</option>
                                    <option value="metro linear">metro linear</option>
                                    <option value="unidade">unidade</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Data</label>
                            <input type="date" id="ativData" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>Observações</label>
                            <textarea id="ativObs" placeholder="Detalhes adicionais sobre a atividade..."></textarea>
                        </div>
                        <div class="btn-row">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').classList.remove('open')">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Registar e Calcular</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    createAtividade(event) {
        event.preventDefault();
        
        const obraId = parseInt(document.getElementById('ativObra').value);
        const fase = document.getElementById('ativFase').value;
        const nome = document.getElementById('ativNome').value.trim();
        const quantidade = parseFloat(document.getElementById('ativQty').value);
        const unidade = document.getElementById('ativUnidade').value;
        const data = document.getElementById('ativData').value || new Date().toISOString().split('T')[0];
        const observacoes = document.getElementById('ativObs').value.trim();

        if (!obraId || !fase || !nome || !quantidade) {
            showToast('Preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const newAtividade = {
            id: generateId(),
            obraId,
            fase,
            nome,
            quantidade,
            unidade,
            data,
            observacoes
        };

        DB.atividades.push(newAtividade);
        this.closeModal();
        this.render();
        showToast(`Atividade "${nome}" registada com sucesso!`, 'success');
        this.updateCounts();

        const estimativa = calcularEstimativa(nome, quantidade, unidade);
        if (estimativa) {
            setTimeout(() => {
                showToast(`Estimativa: ${estimativa.estimativa} kg de ${estimativa.grupo}`, 'success');
            }, 500);
        }
    },

    viewEstimativa(id) {
        const ativ = DB.atividades.find(a => a.id === id);
        if (!ativ) return;
        
        const estimativa = calcularEstimativa(ativ.nome, ativ.quantidade, ativ.unidade);
        const obra = getObraById(ativ.obraId);
        const recomendacao = estimativa ? getRecomendacao(estimativa.grupo) : null;

        const modal = document.getElementById('modal-container');
        modal.innerHTML = `
            <div class="modal-overlay open" onclick="if(event.target===this) this.classList.remove('open')">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Detalhe da Estimativa</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('open')">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div style="margin-bottom:16px">
                        <p><strong>Atividade:</strong> ${ativ.nome}</p>
                        <p><strong>Obra:</strong> ${obra?.nome || 'N/A'}</p>
                        <p><strong>Quantidade:</strong> ${ativ.quantidade} ${ativ.unidade}</p>
                        <p><strong>Data:</strong> ${ativ.data}</p>
                    </div>
                    ${estimativa ? `
                        <div style="background:var(--bg-primary);padding:16px;border-radius:var(--radius-sm);margin-bottom:16px">
                            <h4 style="color:var(--accent);margin-bottom:8px">Resultado da Estimativa</h4>
                            <p style="font-size:1.2rem;font-weight:600">${estimativa.estimativa} kg</p>
                            <p><strong>Grupo:</strong> ${estimativa.grupo}</p>
                            <p><strong>Coeficiente:</strong> ${estimativa.coeficiente} ${estimativa.unidade}</p>
                            <p style="font-size:0.75rem;color:var(--text-muted)">Fonte: ${estimativa.referencia}</p>
                        </div>
                        ${recomendacao ? `
                            <div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px">
                                <h4 style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
                                    <i data-lucide="recycle"></i> Recomendações de Gestão
                                </h4>
                                <p><strong>Segregação:</strong> ${recomendacao.segregacao}</p>
                                <p><strong>Acondicionamento:</strong> ${recomendacao.acondicionamento}</p>
                                <p><strong>Reutilização:</strong> ${recomendacao.reutilizacao}</p>
                                <p><strong>Destino:</strong> ${recomendacao.destino}</p>
                            </div>
                        ` : ''}
                    ` : `
                        <div style="background:var(--bg-primary);padding:16px;border-radius:var(--radius-sm);color:var(--text-muted)">
                            <p>Não foi possível calcular a estimativa para esta atividade.</p>
                            <p style="font-size:0.8rem">Verifique se existe um coeficiente associado.</p>
                        </div>
                    `}
                    <div class="btn-row">
                        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').classList.remove('open')">Fechar</button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    delete(id) {
        if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;
        
        const index = DB.atividades.findIndex(a => a.id === id);
        if (index > -1) {
            DB.atividades.splice(index, 1);
            this.render();
            showToast('Atividade removida com sucesso.', 'success');
            this.updateCounts();
        }
    },

    closeModal() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.classList.remove('open');
    },

    updateCounts() {
        const count = document.getElementById('atividadeCount');
        if (count) count.textContent = DB.atividades.length;
    }
};