// ─── Obras Module ───────────────────────────────────────────
const ObrasModule = {
    render() {
        const container = document.getElementById('main-content');
        const totalObras = DB.obras.length;
        
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>Obras</h1>
                    <p class="subtitle">Gerencie todas as obras em acompanhamento</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="ObrasModule.openCreateModal()">
                        <i data-lucide="plus"></i> Nova Obra
                    </button>
                </div>
            </div>

            <div class="search-bar">
                <div class="search-wrapper">
                    <i data-lucide="search"></i>
                    <input type="text" placeholder="Pesquisar obra..." id="searchObra" oninput="ObrasModule.filter()">
                </div>
                <select id="filterEstado" onchange="ObrasModule.filter()">
                    <option value="">Todos os estados</option>
                    <option value="planeamento">Planeamento</option>
                    <option value="execucao">Execução</option>
                    <option value="concluida">Concluída</option>
                </select>
            </div>

            <div class="obras-grid" id="obrasGrid">
                ${this.renderCards(DB.obras)}
            </div>
        `;

        lucide.createIcons();
        this.updateCounts();
    },

    renderCards(obras) {
        if (!obras || obras.length === 0) {
            return `
                <div class="empty-state" style="grid-column:1/-1">
                    <div class="icon"><i data-lucide="building-2"></i></div>
                    <h3>Nenhuma obra cadastrada</h3>
                    <p>Clique em "Nova Obra" para começar</p>
                </div>
            `;
        }

        const estadoLabels = {
            'planeamento': 'Planeamento',
            'execucao': 'Execução',
            'concluida': 'Concluída'
        };

        return obras.map(obra => `
            <div class="obra-card" onclick="ObrasModule.viewObra(${obra.id})">
                <div class="obra-header">
                    <span class="obra-nome">
                        <i data-lucide="home"></i>
                        ${obra.nome}
                    </span>
                    <span class="badge-status ${obra.estado}">${estadoLabels[obra.estado] || obra.estado}</span>
                </div>
                <div class="obra-local">
                    <i data-lucide="map-pin"></i>
                    ${obra.localizacao}
                </div>
                <div class="obra-meta">
                    <span><i data-lucide="ruler"></i> ${obra.area} m²</span>
                    <span><i data-lucide="layers"></i> ${obra.pisos} pisos</span>
                    <span><i data-lucide="calendar"></i> ${obra.dataInicio}</span>
                </div>
                <div class="obra-progress">
                    <div class="fill" style="width: ${this.getProgress(obra)}%"></div>
                </div>
                <div style="margin-top:8px;font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;gap:12px">
                    <span><i data-lucide="clipboard-list" style="width:12px;height:12px"></i> ${this.getAtividadeCount(obra.id)} atividades</span>
                    <span><i data-lucide="scale" style="width:12px;height:12px"></i> ${this.getEstimativaTotal(obra.id)} kg</span>
                </div>
            </div>
        `).join('');
    },

    getProgress(obra) {
        const start = new Date(obra.dataInicio);
        const end = new Date(obra.dataFimPrevista);
        const now = new Date();
        if (now < start) return 0;
        if (now > end) return 100;
        const total = end - start;
        const elapsed = now - start;
        return Math.min(Math.round((elapsed / total) * 100), 100);
    },

    getAtividadeCount(obraId) {
        return DB.atividades.filter(a => a.obraId === obraId).length;
    },

    getEstimativaTotal(obraId) {
        const atividades = DB.atividades.filter(a => a.obraId === obraId);
        let total = 0;
        for (const ativ of atividades) {
            const result = calcularEstimativa(ativ.nome, ativ.quantidade, ativ.unidade);
            if (result) total += result.estimativa;
        }
        return Math.round(total);
    },

    filter() {
        const search = document.getElementById('searchObra')?.value?.toLowerCase() || '';
        const estado = document.getElementById('filterEstado')?.value || '';
        
        let filtered = DB.obras.filter(obra => {
            const matchNome = obra.nome.toLowerCase().includes(search);
            const matchLocal = obra.localizacao.toLowerCase().includes(search);
            const matchEstado = !estado || obra.estado === estado;
            return (matchNome || matchLocal) && matchEstado;
        });
        
        const grid = document.getElementById('obrasGrid');
        if (grid) {
            grid.innerHTML = this.renderCards(filtered);
        }
        lucide.createIcons();
    },

    viewObra(id) {
        const obra = getObraById(id);
        if (!obra) return;
        
        const container = document.getElementById('main-content');
        const atividades = getAtividadesByObra(id);
        const estimativas = atividades.map(a => {
            const result = calcularEstimativa(a.nome, a.quantidade, a.unidade);
            return { ...a, estimativa: result };
        });
        
        const totalResiduos = estimativas.reduce((sum, e) => sum + (e.estimativa?.estimativa || 0), 0);
        
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <button class="btn btn-outline btn-sm" onclick="ObrasModule.render()" style="margin-bottom:8px">
                        <i data-lucide="arrow-left"></i> Voltar
                    </button>
                    <h1>${obra.nome}</h1>
                    <p class="subtitle">
                        <i data-lucide="map-pin" style="width:14px;height:14px;display:inline"></i>
                        ${obra.localizacao} · ${obra.area} m² · ${obra.pisos} pisos
                    </p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary btn-sm" onclick="AtividadesModule.openCreateModal(${obra.id})">
                        <i data-lucide="plus"></i> Nova Atividade
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="RelatoriosModule.generate(${obra.id})">
                        <i data-lucide="file-text"></i> Relatório
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
                <div class="stat-card">
                    <div class="label">Atividades</div>
                    <div class="value">${atividades.length}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Resíduos Estimados</div>
                    <div class="value">${Math.round(totalResiduos)} <span class="sub" style="font-size:0.8rem">kg</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Progresso</div>
                    <div class="value">${this.getProgress(obra)}%</div>
                </div>
            </div>

            <div style="margin-top:20px">
                <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="clipboard-list"></i> Atividades
                </h3>
                ${AtividadesModule.renderTable(obra.id, true)}
            </div>

            <div style="margin-top:24px">
                <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="calculator"></i> Estimativas
                </h3>
                ${EstimativasModule.renderTable(obra.id, true)}
            </div>

            <div style="margin-top:24px">
                <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="recycle"></i> Gestão de Resíduos
                </h3>
                ${GestaoModule.renderSummary(obra.id, true)}
            </div>
        `;

        lucide.createIcons();
        this.updateCounts();
    },

    openCreateModal() {
        const modal = document.getElementById('modal-container');
        modal.innerHTML = `
            <div class="modal-overlay open" onclick="if(event.target===this) this.classList.remove('open')">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Nova Obra</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('open')">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form onsubmit="ObrasModule.createObra(event)">
                        <div class="form-group">
                            <label>Nome da Obra *</label>
                            <input type="text" id="obraNome" placeholder="Ex: Moradia Talatona" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Localização *</label>
                                <input type="text" id="obraLocal" placeholder="Ex: Talatona, Luanda" required>
                            </div>
                            <div class="form-group">
                                <label>Município *</label>
                                <select id="obraMunicipio" required>
                                    <option value="">Selecione...</option>
                                    <option>Belas</option>
                                    <option>Talatona</option>
                                    <option>Luanda</option>
                                    <option>Viana</option>
                                    <option>Cacuaco</option>
                                    <option>Outros</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Tipo de Obra *</label>
                                <select id="obraTipo" required>
                                    <option>Moradia unifamiliar</option>
                                    <option>Edifício residencial</option>
                                    <option>Edifício misto</option>
                                    <option>Outro</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Área (m²) *</label>
                                <input type="number" id="obraArea" placeholder="350" min="1" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Número de Pisos</label>
                                <input type="number" id="obraPisos" placeholder="2" min="1" value="1">
                            </div>
                            <div class="form-group">
                                <label>Data de Início</label>
                                <input type="date" id="obraDataInicio">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Materiais da Obra (opcional)</label>
                            <textarea id="obraMateriais" placeholder="Liste os materiais previstos para a obra...&#10;Ex: Betão 45m³, Tijolos 12000 unidades, Aço 3200kg"></textarea>
                        </div>
                        <div class="btn-row">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').classList.remove('open')">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Criar Obra</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    createObra(event) {
        event.preventDefault();
        
        const nome = document.getElementById('obraNome').value.trim();
        const localizacao = document.getElementById('obraLocal').value.trim();
        const municipio = document.getElementById('obraMunicipio').value;
        const tipo = document.getElementById('obraTipo').value;
        const area = parseFloat(document.getElementById('obraArea').value);
        const pisos = parseInt(document.getElementById('obraPisos').value) || 1;
        const dataInicio = document.getElementById('obraDataInicio').value || new Date().toISOString().split('T')[0];
        const materiaisText = document.getElementById('obraMateriais').value;

        if (!nome || !localizacao || !municipio || !area) {
            showToast('Preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const materiais = [];
        if (materiaisText) {
            const lines = materiaisText.split('\n').filter(l => l.trim());
            for (const line of lines) {
                const match = line.match(/^([^0-9]+)\s*([0-9,.]+)\s*([a-zA-Z³²]+)/);
                if (match) {
                    materiais.push({
                        nome: match[1].trim(),
                        quantidade: parseFloat(match[2].replace(',', '.')),
                        unidade: match[3].trim()
                    });
                }
            }
        }

        const newObra = {
            id: generateId(),
            nome,
            localizacao,
            municipio,
            tipo,
            area,
            pisos,
            dataInicio,
            dataFimPrevista: '',
            estado: 'execucao',
            createdAt: new Date().toISOString().split('T')[0],
            materiais: materiais.length > 0 ? materiais : [
                { nome: 'Betão', quantidade: area * 0.15, unidade: 'm³' },
                { nome: 'Tijolos', quantidade: area * 35, unidade: 'unidades' },
                { nome: 'Aço', quantidade: area * 8, unidade: 'kg' },
                { nome: 'Cimento', quantidade: area * 0.45, unidade: 'sacos' }
            ]
        };

        DB.obras.push(newObra);
        this.closeModal();
        this.render();
        showToast(`Obra "${nome}" criada com sucesso!`, 'success');
        this.updateCounts();
    },

    closeModal() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.classList.remove('open');
    },

    updateCounts() {
        const count = document.getElementById('obraCount');
        if (count) count.textContent = DB.obras.length;
    }
};