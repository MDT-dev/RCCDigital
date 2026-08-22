// ─── Database ──────────────────────────────────────────────
const DB = {
    obras: [
        {
            id: 1,
            nome: 'Moradia Talatona',
            localizacao: 'Talatona, Luanda',
            municipio: 'Talatona',
            tipo: 'Moradia unifamiliar',
            area: 350,
            pisos: 2,
            dataInicio: '2026-01-15',
            dataFimPrevista: '2026-12-20',
            estado: 'execucao',
            createdAt: '2026-01-10',
            materiais: [
                { nome: 'Betão', quantidade: 45, unidade: 'm³' },
                { nome: 'Tijolos', quantidade: 12000, unidade: 'unidades' },
                { nome: 'Aço', quantidade: 3200, unidade: 'kg' },
                { nome: 'Cimento', quantidade: 150, unidade: 'sacos' },
                { nome: 'Areia', quantidade: 60, unidade: 'm³' },
                { nome: 'Brita', quantidade: 40, unidade: 'm³' },
                { nome: 'Madeira para cofragem', quantidade: 25, unidade: 'm³' },
                { nome: 'Tubos PVC', quantidade: 200, unidade: 'metros' }
            ]
        },
        {
            id: 2,
            nome: 'Edifício Viana',
            localizacao: 'Viana, Luanda',
            municipio: 'Viana',
            tipo: 'Edifício residencial',
            area: 820,
            pisos: 4,
            dataInicio: '2026-03-01',
            dataFimPrevista: '2027-06-30',
            estado: 'execucao',
            createdAt: '2026-02-20',
            materiais: [
                { nome: 'Betão', quantidade: 120, unidade: 'm³' },
                { nome: 'Tijolos', quantidade: 25000, unidade: 'unidades' },
                { nome: 'Aço', quantidade: 8500, unidade: 'kg' },
                { nome: 'Cimento', quantidade: 400, unidade: 'sacos' },
                { nome: 'Areia', quantidade: 150, unidade: 'm³' },
                { nome: 'Brita', quantidade: 100, unidade: 'm³' }
            ]
        },
        {
            id: 3,
            nome: 'Moradia Belas',
            localizacao: 'Belas, Luanda',
            municipio: 'Belas',
            tipo: 'Moradia unifamiliar',
            area: 280,
            pisos: 1,
            dataInicio: '2026-05-10',
            dataFimPrevista: '2026-11-30',
            estado: 'execucao',
            createdAt: '2026-05-05',
            materiais: [
                { nome: 'Betão', quantidade: 30, unidade: 'm³' },
                { nome: 'Tijolos', quantidade: 8000, unidade: 'unidades' },
                { nome: 'Aço', quantidade: 1800, unidade: 'kg' },
                { nome: 'Cimento', quantidade: 100, unidade: 'sacos' }
            ]
        }
    ],

    atividades: [
        {
            id: 1,
            obraId: 1,
            fase: 'Alvenaria',
            nome: 'Execução de paredes em bloco',
            quantidade: 200,
            unidade: 'm²',
            data: '2026-08-21',
            observacoes: 'Paredes externas e internas'
        },
        {
            id: 2,
            obraId: 1,
            fase: 'Revestimento',
            nome: 'Reboco interior',
            quantidade: 150,
            unidade: 'm²',
            data: '2026-08-20',
            observacoes: 'Salas e quartos'
        },
        {
            id: 3,
            obraId: 1,
            fase: 'Estrutura',
            nome: 'Cofragem de vigas',
            quantidade: 45,
            unidade: 'm³',
            data: '2026-08-19',
            observacoes: 'Vigas do piso superior'
        },
        {
            id: 4,
            obraId: 2,
            fase: 'Alvenaria',
            nome: 'Levantamento de alvenaria',
            quantidade: 300,
            unidade: 'm²',
            data: '2026-08-18',
            observacoes: 'Paredes exteriores'
        }
    ],

    coeficientes: [
        { id: 1, grupo: 'Minerais', atividade: 'Alvenaria', coeficiente: 4.19, unidade: 'kg/m²', autor: 'Mália et al.', ano: 2011 },
        { id: 2, grupo: 'Minerais', atividade: 'Reboco', coeficiente: 3.47, unidade: 'kg/m²', autor: 'Mália et al.', ano: 2011 },
        { id: 3, grupo: 'Madeira', atividade: 'Cofragem', coeficiente: 7.11, unidade: 'kg/m³', autor: 'Mália et al.', ano: 2011 },
        { id: 4, grupo: 'Metais', atividade: 'Aço', coeficiente: 2.40, unidade: 'kg/m³', autor: 'Mália et al.', ano: 2011 },
        { id: 5, grupo: 'Minerais', atividade: 'Cerâmica', coeficiente: 2.76, unidade: 'kg/m²', autor: 'Mália et al.', ano: 2011 },
        { id: 6, grupo: 'Plásticos', atividade: 'Instalações', coeficiente: 1.05, unidade: 'kg/m²', autor: 'Mália et al.', ano: 2011 }
    ],

    recomendacoes: {
        'Minerais': {
            segregacao: 'Separar dos restantes resíduos na origem',
            acondicionamento: 'Zona específica do estaleiro, sobre superfície impermeável',
            reutilizacao: 'Material para enchimento, regularização de terrenos, base de pavimentos',
            destino: 'Reaproveitamento em obra ou encaminhamento para reciclagem autorizada'
        },
        'Madeira': {
            segregacao: 'Separar por tipo e qualidade',
            acondicionamento: 'Área coberta, protegida da humidade',
            reutilizacao: 'Cofragens secundárias, proteções, elementos provisórios',
            destino: 'Reciclagem ou valorização energética controlada'
        },
        'Metais': {
            segregacao: 'Separar por tipo (aço, alumínio, cobre)',
            acondicionamento: 'Local seco, organizado por categorias',
            reutilizacao: 'Reaproveitamento de barras, perfis e tubos',
            destino: 'Valorização como sucata metálica'
        },
        'Plásticos': {
            segregacao: 'Separar por tipo de plástico',
            acondicionamento: 'Local coberto, evitar exposição solar prolongada',
            reutilizacao: 'Tubos e conexões em instalações provisórias',
            destino: 'Reciclagem especializada'
        },
        'Outros': {
            segregacao: 'Avaliar caso a caso',
            acondicionamento: 'Conforme características do resíduo',
            reutilizacao: 'Avaliar possibilidade de reaproveitamento',
            destino: 'Encaminhamento adequado conforme classificação'
        }
    }
};

function getObraById(id) {
    return DB.obras.find(o => o.id === id);
}

function getAtividadesByObra(obraId) {
    return DB.atividades.filter(a => a.obraId === obraId);
}

function getCoeficiente(atividade) {
    const ativLower = atividade.toLowerCase();
    for (const coef of DB.coeficientes) {
        if (ativLower.includes(coef.atividade.toLowerCase())) {
            return coef;
        }
    }
    return null;
}

function calcularEstimativa(atividade, quantidade, unidade) {
    const coef = getCoeficiente(atividade);
    if (!coef) return null;
    
    let qty = quantidade;
    if (unidade === 'm³' && coef.unidade.includes('m²')) {
        qty = quantidade * 2.5;
    }
    
    const estimativa = qty * coef.coeficiente;
    return {
        grupo: coef.grupo,
        coeficiente: coef.coeficiente,
        estimativa: Math.round(estimativa * 10) / 10,
        unidade: 'kg',
        referencia: `${coef.autor} (${coef.ano})`
    };
}

function getRecomendacao(grupo) {
    return DB.recomendacoes[grupo] || DB.recomendacoes['Outros'];
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}