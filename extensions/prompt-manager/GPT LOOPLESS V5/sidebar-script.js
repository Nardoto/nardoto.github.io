// sidebar-script.js – GPT LoopLess 5.0 - Sistema Exclusivo para ChatGPT

// Estado global
const STORAGE_KEY = 'gptLoopLess_data';

let sequenceWaitTime = 10000; // 10 segundos padrão
let channels = {};
let prompts = {};
let promptHistory = [];
let usedPrompts = new Set();
let settings = {
    sidebarSize: 'medium',
    theme: 'light',
    autoInsert: true
};

// Objeto de estado centralizado
const state = {
    currentChannel: '',
    currentCategory: '',
    editingPromptId: null,
    promptToCopy: null,
    isSequenceRunning: false,
    isSequencePaused: false,
    sequencePrompts: [],
    currentSequenceIndex: 0,
    sequenceResults: [],
    autoPlayMode: false,
    sequenceState: 'idle' // 'idle', 'running', 'paused', 'completed', 'error'
};

let currentChannel = '';
let currentCategory = '';
let editingPromptId = null;
let promptToCopy = null; // Referência do prompt a copiar
let editingPromptScrollPosition = 0; // NOVO: Armazenar posição do scroll ao editar

// NOVO: Variáveis do sistema de busca
let currentSearchTerm = '';
let currentFilter = 'all';
let currentSort = 'order';
let searchResults = [];

// NOVA FUNÇÃO: Preservar posição do scroll
function preserveScrollPosition(callback) {
    const promptsList = document.getElementById('promptsList');
    if (!promptsList) {
        callback();
        return;
    }
    
    const currentScrollTop = promptsList.scrollTop;
    callback();
    
    // Restaura o scroll após a operação
    setTimeout(() => {
        promptsList.scrollTop = currentScrollTop;
    }, 50);
}

// NOVO: Variáveis para controle da sequência
let isSequenceRunning = false;
let isSequencePaused = false;
let sequencePrompts = [];
let currentSequenceIndex = 0;
let sequenceResults = [];
let autoPlayMode = false;
let sequenceStartTime = null;
let sequenceState = 'idle'; // 'idle', 'running', 'paused', 'completed', 'error'

// Inicialização
// Adicione esta função para permitir ajuste do tempo
function setSequenceWaitTime(seconds) {
    sequenceWaitTime = seconds * 1000;
    localStorage.setItem('gptLoopLess_sequenceWaitTime', sequenceWaitTime);
}

function initializePromptManager() {
    if (!document.getElementById('promptmanager-sidebar')) {
        setTimeout(initializePromptManager, 300);
        return;
    }
    loadData();
    syncStateVariables(); // Garante sincronização inicial
    applySettings();
    setupEventListeners();
    // Bind closeHelp button if present
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    if (closeHelpBtn) closeHelpBtn.addEventListener('click', closeHelp);
    updateUI();
    updateStartButtonText(); // Configura o texto inicial do botão
    
    console.log("✅ GPT LoopLess 5.0 inicializado");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePromptManager);
} else {
    initializePromptManager();
}

// Dados
function createDefaultData() {
    channels = { "Workspace Principal": { categories: { "Geral": [] } } };
    prompts = {};
    state.currentChannel = "Workspace Principal";
    state.currentCategory = "Geral";
    syncStateVariables();
}

function migrateOldStructure(oldData) {
    createDefaultData();
    if (oldData.categories) {
        for (const cat in oldData.categories) {
            channels["Workspace Principal"].categories[cat] = oldData.categories[cat];
        }
    }
    if (oldData.prompts) prompts = oldData.prompts;
}

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            createDefaultData();
            return;
        }
        const data = JSON.parse(raw);

        if (data.channels) {
            channels = data.channels;
            prompts = data.prompts || {};
        } else {
            migrateOldStructure(data);
        }

        settings = { ...settings, ...(data.settings || {}) };
        
        // NOVO: restaura último canal/categoria utilizados com validação
        let loadedChannel = data.lastChannel;
        let loadedCategory = data.lastCategory;

        if (!loadedChannel || !channels[loadedChannel]) {
            loadedChannel = Object.keys(channels)[0] || "Workspace Principal";
        }

        if (!loadedCategory || !channels[loadedChannel]?.categories?.[loadedCategory]) {
            loadedCategory = Object.keys(channels[loadedChannel].categories)[0] || "Geral";
        }

    state.currentChannel = loadedChannel;
    state.currentCategory = loadedCategory;
    syncStateVariables();
        
        // Carrega o tempo de espera da sequência
        sequenceWaitTime = parseInt(localStorage.getItem('gptLoopLess_sequenceWaitTime')) || 10000;
    // Auto play começa desligado por padrão (mais intuitivo)
    const savedAutoPlay = localStorage.getItem('gptLoopLess_autoPlayMode');
    state.autoPlayMode = savedAutoPlay === 'true';
    autoPlayMode = state.autoPlayMode; // Sincroniza variável global

        // Aplica configurações na interface
        const waitInput = document.getElementById('sequenceWaitTime');
        if (waitInput) waitInput.value = sequenceWaitTime / 1000;
        const autoPlayCheck = document.getElementById('autoPlayMode');
        if (autoPlayCheck) {
            autoPlayCheck.checked = state.autoPlayMode;
            toggleAutoPlaySettings(state.autoPlayMode);
        }

    } catch (e) {
        console.error("Erro ao carregar dados:", e);
        createDefaultData();
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY,
        JSON.stringify({ 
            channels, 
            prompts, 
            settings, 
            lastSaved: Date.now(),
            // Persistência de última posição
            lastChannel: state.currentChannel,
            lastCategory: state.currentCategory
        })
    );
}

// Utilidades
function generateId() { 
    return 'prompt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5); 
}

function uniqueChannelName(base) { 
    let name = base; 
    let n = 2; 
    while (channels[name]) name = `${base} (${n++})`; 
    return name; 
}

function safeClear(el) { 
    while (el.firstChild) el.removeChild(el.firstChild); 
}

function showStatus(msg, type = 'info') {
    const box = document.getElementById('statusContainer');
    const text = document.getElementById('statusText');
    if (!box || !text) return;
    box.className = `status-container ${type}`;
    text.textContent = msg;
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 3000);
}

// Função auxiliar: fábrica de botões de ação
function createActionButton(config) {
    const btn = document.createElement('button');
    btn.className = `action-btn ${config.className || ''}`.trim();
    if (config.title) btn.title = config.title;
    if (typeof config.onClick === 'function') btn.onclick = config.onClick;

    const icon = document.createElement('span');
    icon.className = 'btn-icon';
    icon.textContent = config.icon || '';

    const label = document.createElement('span');
    label.className = 'btn-label';
    label.textContent = config.label || '';

    btn.appendChild(icon);
    btn.appendChild(label);
    return btn;
}

function recordPromptUsage(prompt) {
    const now = new Date();
    const historyItem = { 
        id: prompt.id, 
        name: prompt.name, 
        text: prompt.text, 
        timestamp: now.toISOString(), 
        timeFormatted: now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        }) 
    };
    promptHistory.unshift(historyItem);
    if (promptHistory.length > 20) { 
        promptHistory = promptHistory.slice(0, 20); 
    }
    usedPrompts.add(prompt.id);
    updateHistoryDisplay();
    updateStats();
}

// Event Listeners
function setupEventListeners() {
    const map = {
        newPromptBtn: () => showPromptForm(),
        savePromptBtn: () => savePrompt(),
        cancelPromptBtn: hidePromptForm,
        expandPromptBtn: () => showExpandedPromptModal(),
        newChannelBtn: () => createNewChannel(),
        duplicateChannelBtn: () => duplicateChannel(),
        editChannelBtn: () => editChannel(),
        deleteChannelBtn: () => deleteChannel(),
        channelSelect: changeChannel,
        newCategoryBtn: () => createNewCategory(),
        duplicateCategoryBtn: () => duplicateCategory(),
        editCategoryBtn: () => editCategory(),
        deleteCategoryBtn: () => deleteCategory(),
        categorySelect: changeCategory,
    settingsBtn: showSettings,
    helpBtn: showHelp,
    supportBtn: showSupport,                  // Botão de apoio
    startTourBtn: startTour,
        closeSettingsBtn: hideSettings,
        saveSettingsBtn: saveSettings,
        resetSettingsBtn: resetSettings,
        clearDataBtn: clearAllData,
        startSequenceBtn: startSequence,
        pauseSequenceBtn: pauseSequence,
        stopSequenceBtn: stopSequence,
        copyResultsBtn: copyResults,
        closeResultsBtn: closeResultsModal,
        clearPreviewBtn: clearPreview,
        copyPreviewBtn: copyPreview,
        exportTxtBtn: exportPreviewAsTxt,
        promptSearch: handleCompactSearch,        // NOVO: Busca compacta
        searchToggleBtn: toggleCompactSearch,     // NOVO: Toggle busca
        exportBtn: openExportModal,               // NOVO: Exportar dados
        importBtn: openImportModal,               // NOVO: Importar dados
        confirmExportBtn: confirmExport,          // NOVO: Confirmar exportação
        cancelExportBtn: closeExportModal,        // NOVO: Cancelar exportação
        confirmImportBtn: confirmImport,          // NOVO: Confirmar importação
        cancelImportBtn: closeImportModal,        // NOVO: Cancelar importação
    importFile: handleImportFile,             // NOVO: Handle arquivo importado
    // NOVOS: controle do modal de cópia
    copyChannelSelect: handleCopyChannelChange,
    confirmCopyBtn: confirmCopyPrompt,
    cancelCopyBtn: closeCopyPromptModal,
        // Adicione estas linhas no objeto map:
        sequenceWaitTime: (e) => {
            sequenceWaitTime = parseInt(e.target.value) * 1000;
            localStorage.setItem('gptLoopLess_sequenceWaitTime', sequenceWaitTime);
        },
        autoPlayMode: (e) => {
            autoPlayMode = e.target.checked;
            localStorage.setItem('gptLoopLess_autoPlayMode', autoPlayMode);
            toggleAutoPlaySettings(autoPlayMode);
        }
    };

    for (const id in map) {
        const el = document.getElementById(id);
        if (!el) continue;
        const evt = (el.tagName === 'SELECT' || el.type === 'file') ? 'change' : 'click';
        el.addEventListener(evt, map[id]);
    }

    // NOVO: Event listeners para busca compacta
    const searchInput = document.getElementById('promptSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleCompactSearch);
    }

    // Apoie modal close
    const closeSupportBtn = document.getElementById('closeSupportBtn');
    if (closeSupportBtn) closeSupportBtn.addEventListener('click', closeSupport);

    document.addEventListener('promptmanager-insert-response', e => {
        const { success, message } = e.detail;
        if (!isSequenceRunning) {
            showStatus(message, success ? 'success' : 'error');
        }
    });

    document.addEventListener('promptmanager-sequence-response', handleSequenceResponse);

    // NOVO: Event listeners para modais
    setupModalEventListeners();
}

// Apoie modal logic
function showSupport() {
    const modal = document.getElementById('supportModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        const btn = document.getElementById('closeSupportBtn');
        if (btn) btn.focus();
    }, 50);
    
    // Adicionar listener para o botão copiar PIX
    const copyPixBtn = document.getElementById('copyPixBtn');
    if (copyPixBtn) {
        copyPixBtn.addEventListener('click', () => {
            const pixKey = document.getElementById('pixKey').textContent;
            navigator.clipboard.writeText(pixKey).then(() => {
                copyPixBtn.textContent = '✅ Copiado!';
                setTimeout(() => {
                    copyPixBtn.textContent = '📋 Copiar';
                }, 2000);
            }).catch(err => {
                console.error('Erro ao copiar:', err);
                copyPixBtn.textContent = '❌ Erro';
                setTimeout(() => {
                    copyPixBtn.textContent = '📋 Copiar';
                }, 2000);
            });
        });
    }
    
    // Esc para fechar
    const onEsc = (e) => {
        if (e.key === 'Escape') {
            closeSupport();
            document.removeEventListener('keydown', onEsc);
        }
    };
    document.addEventListener('keydown', onEsc);
    // Clique fora fecha
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSupport();
    }, { once: true });
}

function closeSupport() {
    const modal = document.getElementById('supportModal');
    if (!modal) return;
    modal.classList.add('hidden');
}

// Canais
function createNewChannel() {
    const name = prompt('Digite o nome do novo canal:');
    if (!name) return;
    const channelName = uniqueChannelName(name.trim());
    channels[channelName] = { categories: { "Geral": [] } };
    state.currentChannel = channelName;
    state.currentCategory = "Geral";
    saveData();
    updateUI();
    showStatus(`Canal "${channelName}" criado`, 'success');
}

function editChannel() {
    const newName = prompt('Digite o novo nome do canal:', state.currentChannel);
    if (!newName || newName.trim() === state.currentChannel) return;
    const safeName = uniqueChannelName(newName.trim());
    channels[safeName] = channels[state.currentChannel];
    delete channels[state.currentChannel];
    Object.values(prompts).forEach(prompt => {
        if (prompt.channel === state.currentChannel) {
            prompt.channel = safeName;
        }
    });
    state.currentChannel = safeName;
    saveData();
    updateUI();
    showStatus(`Canal renomeado para "${safeName}"`, 'success');
}

function deleteChannel() {
    if (Object.keys(channels).length === 1) {
        showStatus('Mantenha pelo menos um canal', 'error');
        return;
    }
    if (!confirm(`Excluir canal "${state.currentChannel}"?`)) return;
    for (const cat in channels[state.currentChannel].categories) {
        channels[state.currentChannel].categories[cat].forEach(id => delete prompts[id]);
    }
    delete channels[state.currentChannel];
    state.currentChannel = Object.keys(channels)[0];
    state.currentCategory = Object.keys(channels[state.currentChannel].categories)[0];
    saveData();
    updateUI();
    showStatus('Canal excluído', 'success');
}

function changeChannel(e) {
    state.currentChannel = e.target.value;
    state.currentCategory = Object.keys(channels[state.currentChannel].categories)[0];
    syncStateVariables();
    updateUI();
    saveData(); // salva seleção imediatamente
}

// Função para sincronizar variáveis globais com o estado
function syncStateVariables() {
    currentChannel = state.currentChannel;
    currentCategory = state.currentCategory;
}

// Categorias
function createNewCategory() {
    const name = prompt('Digite o nome da nova categoria:');
    if (!name) return;
    const catName = name.trim();
    const cats = channels[state.currentChannel].categories;
    if (cats[catName]) {
        showStatus('Categoria já existe', 'error');
        return;
    }
    cats[catName] = [];
    state.currentCategory = catName;
    saveData();
    updateUI();
    showStatus(`Categoria "${catName}" criada`, 'success');
}

function editCategory() {
    const newName = prompt('Digite o novo nome da categoria:', state.currentCategory);
    if (!newName || newName.trim() === state.currentCategory) return;
    const catName = newName.trim();
    const cats = channels[state.currentChannel].categories;
    if (cats[catName]) {
        showStatus('Categoria já existe', 'error');
        return;
    }
    cats[catName] = cats[state.currentCategory];
    delete cats[state.currentCategory];
    Object.values(prompts).forEach(prompt => {
        if (prompt.channel === state.currentChannel && prompt.category === state.currentCategory) {
            prompt.category = catName;
        }
    });
    state.currentCategory = catName;
    saveData();
    updateUI();
    showStatus(`Categoria renomeada para "${catName}"`, 'success');
}

function deleteCategory() {
    const cats = channels[state.currentChannel].categories;
    if (Object.keys(cats).length === 1) {
        showStatus('Mantenha pelo menos uma categoria', 'error');
        return;
    }
    if (!confirm(`Excluir categoria "${state.currentCategory}"?`)) return;
    cats[state.currentCategory].forEach(id => delete prompts[id]);
    delete cats[state.currentCategory];
    state.currentCategory = Object.keys(cats)[0];
    saveData();
    updateUI();
    showStatus('Categoria excluída', 'success');
}

function changeCategory(e) {
    state.currentCategory = e.target.value;
    syncStateVariables();
    updateUI();
    saveData(); // salva seleção imediatamente
}

// Prompts
function showPromptForm() {
    document.getElementById('promptForm').classList.remove('hidden');
    const name = document.getElementById('promptName');
    const text = document.getElementById('promptText');
    name.focus();
    if (!state.editingPromptId) {
        name.value = '';
        text.value = '';
    }
}

function hidePromptForm() {
    document.getElementById('promptForm').classList.add('hidden');
    document.getElementById('promptName').value = '';
    document.getElementById('promptText').value = '';
    state.editingPromptId = null;
}

function savePrompt() {
    const nameVal = document.getElementById('promptName').value.trim();
    const textVal = document.getElementById('promptText').value.trim();
    if (!nameVal || !textVal) {
        showStatus('Preencha todos os campos', 'error');
        return;
    }
    const id = state.editingPromptId || generateId();
    const now = Date.now();
    prompts[id] = {
        id,
        name: nameVal,
        text: textVal,
        channel: state.currentChannel,
        category: state.currentCategory,
        created: state.editingPromptId ? prompts[id].created : now,
        modified: now
    };
    const list = channels[state.currentChannel].categories[state.currentCategory];
    if (!state.editingPromptId && !list.includes(id)) list.push(id);
    const action = state.editingPromptId ? 'atualizado' : 'salvo';
    state.editingPromptId = null;
    saveData();
    hidePromptForm();
    preserveScrollPosition(() => updateUI());
    showStatus(`Prompt ${action}`, 'success');
}

function editPrompt(p) {
    state.editingPromptId = p.id;
    
    // NÃO armazenar posição do scroll - manter posição atual
    // Simplesmente abrir o formulário sem afetar a lista
    
    document.getElementById('promptName').value = p.name;
    document.getElementById('promptText').value = p.text;
    showPromptForm();
}

// Funções para o modal expandido de prompts
function showExpandedPromptModal() {
    const modal = document.getElementById('expandedPromptModal');
    const expandedName = document.getElementById('expandedPromptName');
    const expandedText = document.getElementById('expandedPromptText');
    const expandBtn = document.getElementById('expandPromptBtn');
    
    // Preencher com os valores atuais do formulário
    const currentName = document.getElementById('promptName').value;
    const currentText = document.getElementById('promptText').value;
    
    expandedName.value = currentName;
    expandedText.value = currentText;
    
    // Focar no campo de texto expandido
    expandedText.focus();
    
    // Adicionar classe active ao botão
    if (expandBtn) expandBtn.classList.add('active');
    
    modal.classList.remove('hidden');
}

function hideExpandedPromptModal() {
    const modal = document.getElementById('expandedPromptModal');
    const expandBtn = document.getElementById('expandPromptBtn');
    
    // Remover classe active do botão
    if (expandBtn) expandBtn.classList.remove('active');
    
    modal.classList.add('hidden');
}

function saveExpandedPrompt() {
    const expandedName = document.getElementById('expandedPromptName').value.trim();
    const expandedText = document.getElementById('expandedPromptText').value.trim();
    
    if (!expandedName || !expandedText) {
        showStatus('Preencha todos os campos', 'error');
        return;
    }
    
    // Atualizar os campos do formulário principal
    document.getElementById('promptName').value = expandedName;
    document.getElementById('promptText').value = expandedText;
    
    // Fechar o modal expandido
    hideExpandedPromptModal();
    
    // Salvar o prompt
    savePrompt();
}

function deletePrompt(p) {
    // Adicionamos logs para depuração
    console.log('Tentando excluir o prompt:', p);

    if (!confirm(`Tem certeza que deseja excluir o prompt "${p.name}"?`)) {
        console.log('Exclusão cancelada pelo usuário.');
        return;
    }

    // Validação para garantir que o prompt tem as informações necessárias
    if (!p || !p.id || !state.currentChannel || !state.currentCategory) {
        console.error('Erro de exclusão: Informações do prompt ou do estado atual (canal/categoria) estão faltando.', { prompt: p, currentChannel: state.currentChannel, currentCategory: state.currentCategory });
        showStatus('Erro interno ao tentar excluir.', 'error');
        return;
    }

    try {
        // Obtenha a lista de IDs da categoria ATUAL
    const idList = channels[state.currentChannel].categories[state.currentCategory];

        // Verifique se a lista foi encontrada
        if (!idList) {
            console.error('Erro de exclusão: Não foi possível encontrar a lista de prompts para a categoria atual.');
            showStatus('Erro: Categoria não encontrada.', 'error');
            return;
        }

        // Filtre a lista para remover o ID do prompt a ser excluído
        const newList = idList.filter(id => id !== p.id);
        
        // Verifique se a lista realmente mudou de tamanho
        if (newList.length === idList.length) {
            console.warn('Aviso: O prompt a ser excluído não foi encontrado na lista da categoria atual. Verificando em outros locais...');
            // Futuramente, poderíamos adicionar uma busca em todas as categorias aqui se necessário.
        }

        // Atualize a lista de IDs no objeto 'channels'
    channels[state.currentChannel].categories[state.currentCategory] = newList;

        // Remova o objeto do prompt da lista principal 'prompts'
        delete prompts[p.id];

        console.log(`Prompt ${p.id} removido com sucesso.`);

        // Salve os dados e atualize a interface
        saveData();
        updateUI();
        showStatus('Prompt excluído com sucesso!', 'success');

    } catch (error) {
        console.error('Ocorreu um erro inesperado durante a exclusão:', error);
        showStatus('Erro inesperado. Verifique o console.', 'error');
    }
}

function forceInsertPrompt(p) {
    recordPromptUsage(p);
    document.dispatchEvent(new CustomEvent('promptmanager-insert-text', { detail: { text: p.text } }));
}

function insertPrompt(p) {
    if (settings.autoInsert) {
        forceInsertPrompt(p);
    }
}

function sendPrompt(p) {
    recordPromptUsage(p);
    
    // Adicionar classe permanente para indicar que foi enviado
    const promptElement = document.querySelector(`[data-prompt-id="${p.id}"]`);
    if (promptElement) {
        promptElement.classList.add('sent');
        // A classe 'sent' permanecerá até que a página seja atualizada
    }
    
    document.dispatchEvent(new CustomEvent('promptmanager-send-prompt', { detail: { text: p.text } }));
}

function movePrompt(promptId, direction) {
    const list = channels[state.currentChannel].categories[state.currentCategory];
    const currentIndex = list.indexOf(promptId);
    if (currentIndex === -1) return;
    
    let targetIndex;
    if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < list.length - 1) {
        targetIndex = currentIndex + 1;
    } else {
        return;
    }

    // Encontrar ambos os elementos que vão trocar de posição
    const currentElement = document.querySelector(`[data-prompt-id="${promptId}"]`);
    const targetPromptId = list[targetIndex];
    const targetElement = document.querySelector(`[data-prompt-id="${targetPromptId}"]`);
    
    if (currentElement && targetElement) {
        // Adicionar classes de animação
        currentElement.classList.add(direction === 'up' ? 'moving-up' : 'moving-down');
        targetElement.classList.add(direction === 'up' ? 'moving-down' : 'moving-up');
        
        // Remover as classes após a animação
        setTimeout(() => {
            currentElement.classList.remove('moving-up', 'moving-down');
            targetElement.classList.remove('moving-up', 'moving-down');
        }, 600);
    }

    // Fazer a troca na estrutura de dados
    [list[currentIndex], list[targetIndex]] = [list[targetIndex], list[currentIndex]];
    
    saveData();
    
    // Usar preserveScrollPosition para manter posição
    setTimeout(() => {
        preserveScrollPosition(() => updatePromptList());
    }, 300);
}

// NOVA FUNÇÃO: Atualiza progresso da sequência
function updateSequenceProgress() {
    const startBtn = document.getElementById('startSequenceBtn');
    if (isSequenceRunning && startBtn) {
        const progress = `${currentSequenceIndex + 1}/${sequencePrompts.length}`;
        startBtn.title = `Executando: ${progress}`;
        showStatus(`Processando ${progress}: ${prompts[sequencePrompts[currentSequenceIndex]]?.name}`, 'info');
    }
}

// NOVA FUNÇÃO: Atualiza texto do botão de acordo com o estado
function updateStartButtonText() {
    const startBtn = document.getElementById('startSequenceBtn');
    if (!startBtn) return;
    
    if (isSequenceRunning && isSequencePaused) {
        startBtn.textContent = 'Retomar Sequência';
        startBtn.title = 'Retomar a sequência pausada';
    } else if (isSequenceRunning) {
        startBtn.textContent = 'Sequência Ativa';
        startBtn.title = 'Uma sequência está em execução';
        startBtn.disabled = true;
    } else {
        startBtn.textContent = 'Iniciar Sequência';
        startBtn.title = 'Iniciar nova sequência com os prompts desta categoria';
        startBtn.disabled = false;
    }
}

// UI Updates
function updateUI() {
    updateChannelSelect();
    updateCategorySelect();
    updatePromptList();
    updateStats();
    updateHistoryDisplay();
}

function updateChannelSelect() {
    const sel = document.getElementById('channelSelect');
    if (!sel) return;
    safeClear(sel);
    Object.keys(channels).forEach(ch => {
        const o = document.createElement('option');
        o.value = ch;
        o.textContent = ch;
    if (ch === state.currentChannel) o.selected = true;
        sel.appendChild(o);
    });
}

function updateCategorySelect() {
    const sel = document.getElementById('categorySelect');
    if (!sel) return;
    safeClear(sel);
    const cats = channels[state.currentChannel].categories;
    Object.keys(cats).forEach(cat => {
        const o = document.createElement('option');
        o.value = cat;
        o.textContent = cat;
        if (cat === state.currentCategory) o.selected = true;
        sel.appendChild(o);
    });
}

function updatePromptList() {
    const box = document.getElementById('promptsList');
    if (!box) return;
    
    // Remover verificação de edição - manter lista sempre na posição atual
    
    safeClear(box);
    const ids = channels[state.currentChannel]?.categories[state.currentCategory];
    if (!ids || !ids.length) {
        const msg = document.createElement('div');
        msg.className = 'empty-message';
        msg.textContent = 'Nenhum prompt nesta categoria.';
        box.appendChild(msg);
        return;
    }
    ids.forEach((id, index) => {
        if (prompts[id]) {
            box.appendChild(buildPromptItem(prompts[id], index, ids.length));
        }
    });
}

function buildPromptItem(p, index, totalPrompts) {
    const item = document.createElement('div');
    item.className = 'prompt-item';
    
    // Adiciona o data-attribute para identificar o prompt
    item.setAttribute('data-prompt-id', p.id);
    
    // DRAG & DROP: Tornar item arrastável
    item.draggable = true;
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    
    // Adiciona número do prompt (estilo Suno)
    const promptNumber = document.createElement('div');
    promptNumber.className = 'prompt-number';
    promptNumber.textContent = index + 1;
    item.appendChild(promptNumber);
    
    if (usedPrompts.has(p.id)) {
        item.classList.add('used');
    }

    const name = document.createElement('div');
    name.className = 'prompt-name';
    name.textContent = p.name;
    name.onclick = () => insertPrompt(p);

    const actions = document.createElement('div');
    actions.className = 'prompt-actions';

    const insertBtn = document.createElement('button');
    insertBtn.className = 'action-btn insert-btn';
    insertBtn.title = 'Inserir prompt no campo de texto';
    // Safe DOM (Trusted Types friendly)
    {
        const icon = document.createElement('span');
        icon.className = 'btn-icon';
        icon.textContent = '+'; // monochrome icon
        const label = document.createElement('span');
        label.className = 'btn-label';
        label.textContent = 'Inserir';
        insertBtn.appendChild(icon);
        insertBtn.appendChild(label);
    }
    insertBtn.onclick = () => forceInsertPrompt(p);
    actions.appendChild(insertBtn);
    
    const sendBtn = document.createElement('button');
    sendBtn.className = 'action-btn send-btn';
    sendBtn.title = 'Enviar este prompt para a IA';
    {
        const icon = document.createElement('span');
        icon.className = 'btn-icon';
        icon.textContent = '→'; // monochrome arrow
        const label = document.createElement('span');
        label.className = 'btn-label';
        label.textContent = 'Enviar';
        sendBtn.appendChild(icon);
        sendBtn.appendChild(label);
    }
    sendBtn.onclick = () => sendPrompt(p);
    actions.appendChild(sendBtn);

    const duplicateBtn = document.createElement('button');
    duplicateBtn.className = 'action-btn duplicate-btn';
    duplicateBtn.title = 'Duplicar Prompt';
    {
        const icon = document.createElement('span');
        icon.className = 'btn-icon';
        icon.textContent = '⧉';
        const label = document.createElement('span');
        label.className = 'btn-label';
        label.textContent = 'Duplicar';
        duplicateBtn.appendChild(icon);
        duplicateBtn.appendChild(label);
    }
    duplicateBtn.onclick = () => duplicatePrompt(p);
    actions.appendChild(duplicateBtn);

    // Botão "Copiar para..."
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn copy-btn';
    copyBtn.title = 'Copiar prompt para outro canal/categoria';
    {
        const icon = document.createElement('span');
        icon.className = 'btn-icon';
        icon.textContent = '⎘'; // monochrome copy-like symbol
        const label = document.createElement('span');
        label.className = 'btn-label';
        label.textContent = 'Copiar';
        copyBtn.appendChild(icon);
        copyBtn.appendChild(label);
    }
    copyBtn.onclick = () => openCopyPromptModal(p);
    actions.appendChild(copyBtn);

    const moveContainer = document.createElement('div');
    moveContainer.className = 'move-buttons';
    if (totalPrompts > 1) {
        if (index > 0) {
            const upBtn = document.createElement('button');
            upBtn.className = 'action-btn move-btn';
            upBtn.textContent = '↑';
            upBtn.onclick = () => movePrompt(p.id, 'up');
            moveContainer.appendChild(upBtn);
        }
        if (index < totalPrompts - 1) {
            const downBtn = document.createElement('button');
            downBtn.className = 'action-btn move-btn';
            downBtn.textContent = '↓';
            downBtn.onclick = () => movePrompt(p.id, 'down');
            moveContainer.appendChild(downBtn);
        }
        actions.appendChild(moveContainer);
    }
    
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn';
    editBtn.title = 'Editar este prompt';
    {
        const icon = document.createElement('span');
        icon.className = 'btn-icon';
        icon.textContent = '✎';
        const label = document.createElement('span');
        label.className = 'btn-label';
        label.textContent = 'Editar';
        editBtn.appendChild(icon);
        editBtn.appendChild(label);
    }
    editBtn.onclick = () => editPrompt(p);
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.title = 'Excluir este prompt';
    {
        const icon = document.createElement('span');
        icon.className = 'btn-icon';
        icon.textContent = '✖';
        const label = document.createElement('span');
        label.className = 'btn-label';
        label.textContent = 'Excluir';
        deleteBtn.appendChild(icon);
        deleteBtn.appendChild(label);
    }
    deleteBtn.onclick = () => deletePrompt(p);
    actions.appendChild(deleteBtn);

    const content = document.createElement('div');
    content.className = 'prompt-content';
    content.textContent = p.text.length > 100 ? p.text.slice(0, 100) + '...' : p.text;

    // Progress container for sequence execution
    const progressContainer = document.createElement('div');
    progressContainer.className = 'prompt-progress-container';
    progressContainer.style.display = 'none'; // Hidden by default, shown during sequences

    const progressFill = document.createElement('div');
    progressFill.className = 'prompt-progress-fill';

    const progressStatus = document.createElement('div');
    progressStatus.className = 'prompt-progress-status';

    progressContainer.appendChild(progressFill);
    progressContainer.appendChild(progressStatus);

    item.appendChild(name);
    item.appendChild(actions);
    item.appendChild(content);
    item.appendChild(progressContainer);

    return item;
}

function updateStats() {
    const promptCountEl = document.getElementById('promptCount');
    const categoryCountEl = document.getElementById('categoryCount');
    const usedCountEl = document.getElementById('usedCount');

    if (promptCountEl) promptCountEl.textContent = Object.keys(prompts).length;
    if (categoryCountEl && channels[state.currentChannel]) {
        categoryCountEl.textContent = Object.keys(channels[state.currentChannel].categories).length;
    }
    if (usedCountEl) usedCountEl.textContent = promptHistory.length;
}

function updateHistoryDisplay() {
    const historyContainer = document.getElementById('promptHistory');
    if (!historyContainer) return;
    safeClear(historyContainer);
    if (promptHistory.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'history-empty';
        emptyMsg.textContent = 'Nenhum prompt enviado';
        historyContainer.appendChild(emptyMsg);
        return;
    }
    promptHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        const header = document.createElement('div');
        header.className = 'history-item-header';
        const name = document.createElement('span');
        name.className = 'history-item-name';
        name.textContent = item.name;
        const time = document.createElement('span');
        time.className = 'history-item-time';
        time.textContent = item.timeFormatted;
        const preview = document.createElement('div');
        preview.className = 'history-item-preview';
        preview.textContent = item.text.length > 60 ? item.text.slice(0, 60) + '...' : item.text;
        header.appendChild(name);
        header.appendChild(time);
        historyItem.appendChild(header);
        historyItem.appendChild(preview);
        historyContainer.appendChild(historyItem);
    });
}

// Adicione após a função updateHistoryDisplay()

// Atualiza o preview em tempo real
function updateRealtimePreview() {
    const previewTextarea = document.getElementById('realtimePreview');
    if (!previewTextarea) return;
    
    let fullText = '';
    sequenceResults.forEach((result, index) => {
        // Apenas o texto da resposta, sem formatação
        fullText += `${result.responseText}\n\n`;
    });
    
    previewTextarea.value = fullText;
    // Auto-scroll para o final
    previewTextarea.scrollTop = previewTextarea.scrollHeight;
}

// Exporta o conteúdo do preview como TXT
function exportPreviewAsTxt() {
    const previewTextarea = document.getElementById('realtimePreview');
    if (!previewTextarea || !previewTextarea.value.trim()) {
        showStatus('Nada para exportar', 'error');
        return;
    }
    
    const blob = new Blob([previewTextarea.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respostas-ia-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Arquivo TXT exportado', 'success');
}

// Limpa o preview
function clearPreview() {
    const previewTextarea = document.getElementById('realtimePreview');
    if (previewTextarea) {
        previewTextarea.value = '';
        sequenceResults = []; // Limpa também o array
        showStatus('Preview limpo', 'info');
    }
}

// Copia o conteúdo do preview
function copyPreview() {
    const previewTextarea = document.getElementById('realtimePreview');
    if (!previewTextarea || !previewTextarea.value.trim()) {
        showStatus('Nada para copiar', 'error');
        return;
    }
    
    navigator.clipboard.writeText(previewTextarea.value).then(() => {
        showStatus('Conteúdo copiado!', 'success');
    }, () => {
        showStatus('Erro ao copiar', 'error');
    });
}

// Import/Export
function exportData() {
    try {
        const blob = new Blob(
            [JSON.stringify({ channels, prompts, settings }, null, 2)],
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompts-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showStatus('Backup exportado', 'success');
    } catch (error) {
        console.error('Erro ao exportar:', error);
        showStatus('Erro ao exportar', 'error');
    }
}

function parseImportedData(json, fileName = '') {
    if (json.channels) {
        return {
            channels: json.channels,
            prompts: json.prompts || {},
            settings: json.settings || {}
        };
    }
    if (json.categories) {
        let base = fileName ? fileName.replace(/\.json$/i, '') : '';
        base = base || prompt('Nome do canal:', 'Canal Importado') || 'Canal Importado';
        const chanName = uniqueChannelName(base.trim());
        return {
            channels: { [chanName]: { categories: json.categories } },
            prompts: json.prompts || {},
            settings: json.settings || {}
        };
    }
    throw new Error('Formato inválido');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
        showStatus('Use arquivos .json', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const inc = parseImportedData(JSON.parse(ev.target.result), file.name);
            for (const incName in inc.channels) {
                const safe = channels[incName] ? uniqueChannelName(incName) : incName;
                channels[safe] = inc.channels[incName];
            }
            for (const id in inc.prompts) {
                const newId = prompts[id] ? generateId() : id;
                prompts[newId] = { ...inc.prompts[id], id: newId };
            }
            settings = { ...settings, ...inc.settings };
            saveData();
            updateUI();
            showStatus('Dados importados', 'success');
        } catch (err) {
            console.error('Erro ao importar:', err);
            showStatus('Erro ao importar', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Settings
function applySettings() {
    const sizeMap = { small: '320px', medium: '400px', large: '500px' };
    const newWidth = sizeMap[settings.sidebarSize] || '400px';
    document.documentElement.style.setProperty('--sidebar-width', newWidth);
    const sidebar = document.getElementById('promptmanager-sidebar');
    if (sidebar) {
        // Tema
        sidebar.classList.remove('theme-light', 'theme-dark');
        if (settings.theme === 'dark') {
            sidebar.classList.add('theme-dark');
        } else {
            sidebar.classList.add('theme-light');
        }

        // Tamanho (para CSS responsivo dos botões)
        sidebar.classList.remove('size-small', 'size-medium', 'size-large');
        const sizeClass = settings.sidebarSize === 'small' ? 'size-small'
            : settings.sidebarSize === 'large' ? 'size-large'
            : 'size-medium';
        sidebar.classList.add(sizeClass);
    }
}

function showSettings() {
    document.getElementById('sidebarSize').value = settings.sidebarSize;
    document.getElementById('theme').value = settings.theme;
    document.getElementById('autoInsertChk').checked = settings.autoInsert;
    document.getElementById('settingsModal').classList.remove('hidden');
}

function hideSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function saveSettings() {
    settings.sidebarSize = document.getElementById('sidebarSize').value;
    settings.theme = document.getElementById('theme').value;
    settings.autoInsert = document.getElementById('autoInsertChk').checked;
    saveData();
    applySettings(); 
    hideSettings();
    showStatus('Configurações salvas', 'success');
}

function resetSettings() {
    if (!confirm('Restaurar configurações padrão?')) return;
    settings = {
        sidebarSize: 'medium',
        theme: 'light',
        autoInsert: true
    };
    saveData();
    applySettings();
    hideSettings();
    updateUI();
    showStatus('Configurações restauradas', 'success');
}

function clearAllData() {
    if (!confirm('ATENÇÃO: Isso apagará TODOS os seus canais, categorias e prompts permanentemente. Deseja continuar?')) {
        return;
    }
    try {
        localStorage.removeItem(STORAGE_KEY);
        showStatus('Todos os dados foram limpos. A sidebar será recarregada.', 'success');
        setTimeout(() => {
            location.reload();
        }, 1500);
    } catch (error) {
        console.error("Erro ao limpar os dados:", error);
        showStatus('Ocorreu um erro ao limpar os dados.', 'error');
    }
}

// --- LÓGICA DA SEQUÊNCIA AUTOMÁTICA ---

function toggleUIControls(disabled) {
    document.getElementById('channelSelect').disabled = disabled;
    document.getElementById('categorySelect').disabled = disabled;
    document.getElementById('newPromptBtn').disabled = disabled;
    document.getElementById('exportBtn').disabled = disabled;
    document.getElementById('importFile').labels[0].style.pointerEvents = disabled ? 'none' : 'auto';
    document.getElementById('settingsBtn').disabled = disabled;
    document.querySelectorAll('.prompt-item .action-btn, .prompt-item .move-btn').forEach(btn => btn.disabled = disabled);
}

function startSequence() {
    // Auto-ativa o modo autoplay se não estiver ativo (mais intuitivo)
    if (!autoPlayMode) {
        autoPlayMode = true;
        localStorage.setItem('gptLoopLess_autoPlayMode', autoPlayMode);
        const autoPlayCheck = document.getElementById('autoPlayMode');
        if (autoPlayCheck) autoPlayCheck.checked = true;
        toggleAutoPlaySettings(autoPlayMode);
        console.log('🔄 Auto play ativado automaticamente para iniciar sequência');
    }

    // Se há uma sequência pausada, retoma ela
    if (isSequenceRunning && isSequencePaused) {
        isSequencePaused = false;
        sequenceState = 'running';
        showStatus('Sequência retomada!', 'info');
        updateStartButtonText();
        processNextPrompt();
        return;
    }

    // Se já há uma sequência ativa (não pausada), avisa
    if (isSequenceRunning && !isSequencePaused) {
        showStatus('Uma sequência já está em execução.', 'warning');
        return;
    }

    // Inicia nova sequência
    const promptIds = channels[state.currentChannel]?.categories[state.currentCategory];
    if (!promptIds || promptIds.length === 0) {
        showStatus('Não há prompts nesta categoria para iniciar uma sequência.', 'error');
        return;
    }

    if (!confirm(`Iniciar sequência com ${promptIds.length} prompts da categoria "${state.currentCategory}"?\n\nTempo de espera: ${sequenceWaitTime/1000}s entre prompts`)) {
        return;
    }

    // Inicializa a sequência
    isSequenceRunning = true;
    isSequencePaused = false;
    sequenceState = 'running';
    sequencePrompts = [...promptIds];
    currentSequenceIndex = 0;
    sequenceResults = [];
    sequenceStartTime = Date.now();

    // Ativa modo escuro moderno
    const sidebar = document.getElementById('promptmanager-sidebar');
    if (sidebar) {
        sidebar.classList.add('auto-play-mode');
    }

    // Atualiza UI
    showSequenceControls('running');
    updateSequenceProgress(0, sequencePrompts.length, 'Iniciando sequência...');
    updateSequenceStatus('Sequência iniciada', 'info');
    updateStartButtonText(); // Atualiza botão para "Sequência Ativa"
    
    // Marca todos os prompts como pendentes e mostra suas barras
    sequencePrompts.forEach((promptId, index) => {
        console.log(`Iniciando prompt ${promptId} como pending (${index + 1}/${sequencePrompts.length})`);
        updatePromptItemStatus(promptId, 'pending');
        
        // FORÇA a barra a aparecer com estilo inline (garantia extra)
        const promptElement = document.querySelector(`[data-prompt-id="${promptId}"]`);
        if (promptElement) {
            const progressContainer = promptElement.querySelector('.prompt-progress-container');
            const progressFill = promptElement.querySelector('.prompt-progress-fill');
            const progressStatus = promptElement.querySelector('.prompt-progress-status');
            
            if (progressContainer) {
                progressContainer.style.display = 'block';
                progressContainer.style.visibility = 'visible';
                progressContainer.style.background = '#2c2c2c';
                progressContainer.style.border = '1px solid #444';
                progressContainer.style.padding = '8px';
                progressContainer.style.marginTop = '8px';
                progressContainer.style.borderRadius = '4px';
            }
            
            if (progressFill) {
                progressFill.style.width = '30%';
                progressFill.style.background = 'linear-gradient(90deg, #6b7280, #9ca3af)';
                progressFill.style.height = '6px';
            }
            
            if (progressStatus) {
                progressStatus.textContent = '📝 Aguardando...';
                progressStatus.style.color = '#9ca3af';
                progressStatus.style.fontSize = '11px';
                progressStatus.style.textAlign = 'center';
                progressStatus.style.marginTop = '4px';
            }
            
            console.log(`✅ Barra forçada para prompt ${promptId}`);
        } else {
            console.log(`❌ Elemento não encontrado para prompt ${promptId}`);
        }
    });

    // Marca todos os prompts como pending
    sequencePrompts.forEach(promptId => {
        updatePromptItemStatus(promptId, 'pending');
    });

    // Ativa o primeiro prompt
    if (sequencePrompts.length > 0) {
        updatePromptItemStatus(sequencePrompts[0], 'current');
        
        // DEBUG: Verifica criação inicial das barras
        console.log('🚀 INÍCIO - Verificando criação das barras de progresso:');
        const allPromptElements = document.querySelectorAll('.prompt-item[data-prompt-id]');
        allPromptElements.forEach((el, index) => {
            const id = el.getAttribute('data-prompt-id');
            const hasProgress = !!el.querySelector('.prompt-progress-container');
            console.log(`  ${index + 1}. ID: ${id}, Progress Container: ${hasProgress}`);
        });
    }

    showStatus(`Sequência iniciada com ${sequencePrompts.length} prompts`, 'success');

    // Inicia a execução
    executeNextPromptInSequence();
}

function stopSequence() {
    isSequenceRunning = false;
    
    // MANTÉM modo escuro moderno mesmo ao parar manualmente
    // const sidebar = document.getElementById('promptmanager-sidebar');
    // if (sidebar) {
    //     sidebar.classList.remove('auto-play-mode');
    // }
    
    const startBtn = document.getElementById('startSequenceBtn');
    startBtn.textContent = '▶';
    startBtn.classList.remove('running');
    toggleUIControls(false);
}

function executeNextPromptInSequence() {
    if (!isSequenceRunning || isSequencePaused) return;

    // Trava simples para prevenir reentrância (evita disparar 2x o mesmo prompt)
    if (window.pmDispatching) {
        console.log('⏳ Ainda enviando prompt anterior... aguardando resposta.');
        return;
    }

    if (currentSequenceIndex >= sequencePrompts.length) {
        finishSequence();
        return;
    }

    const promptId = sequencePrompts[currentSequenceIndex];
    const prompt = prompts[promptId];

    if (!prompt) {
        console.error(`Prompt com ID ${promptId} não encontrado.`);
        updatePromptItemStatus(promptId, 'error');
        updateSequenceStatus(`Erro: Prompt ${currentSequenceIndex + 1} não encontrado`, 'error');
        
        sequenceResults.push({ 
            promptName: `ID Inválido: ${promptId}`,
            error: 'Prompt não encontrado'
        });
        
        currentSequenceIndex++;
        setTimeout(() => executeNextPromptInSequence(), 1000);
        return;
    }

    // Atualiza UI para mostrar prompt atual
    updateSequenceProgress(currentSequenceIndex + 1, sequencePrompts.length, `Enviando: ${prompt.name}`);
    updatePromptItemStatus(promptId, 'current');
    
    // DEBUG: Lista todos os elementos para verificar
    console.log('🔍 DEBUG - Verificando todos os prompts na DOM:');
    const allPromptElements = document.querySelectorAll('.prompt-item[data-prompt-id]');
    allPromptElements.forEach((el, index) => {
        const id = el.getAttribute('data-prompt-id');
        const hasProgress = !!el.querySelector('.prompt-progress-container');
        console.log(`  ${index + 1}. ID: ${id}, Progress Container: ${hasProgress}`);
    });

    // Remove status anterior
    if (currentSequenceIndex > 0) {
        const prevPromptId = sequencePrompts[currentSequenceIndex - 1];
        updatePromptItemStatus(prevPromptId, 'completed');
        console.log(`📝 Prompt anterior ${prevPromptId} marcado como completed`);
    }

    console.log(`Executando prompt ${currentSequenceIndex + 1}/${sequencePrompts.length}: ${prompt.name}`);

    // Envia o prompt com informações da sequência
    window.pmDispatching = true;
    document.dispatchEvent(new CustomEvent('promptmanager-sequence-send', { 
        detail: { 
            text: prompt.text,
            promptName: prompt.name,
            currentIndex: currentSequenceIndex,
            totalCount: sequencePrompts.length,
            waitTime: sequenceWaitTime
        } 
    }));
}

function handleSequenceResponse(event) {
    if (!isSequenceRunning) return;
    
    console.log('📨 Resposta recebida:', event.detail);
    // Libera trava de envio para permitir próximo prompt
    window.pmDispatching = false;
    
    // Verifica se event.detail existe e tem estrutura válida
    if (!event.detail || typeof event.detail !== 'object') {
        console.error('❌ Resposta sem dados ou inválida:', event.detail);
        const promptId = sequencePrompts[currentSequenceIndex];
        updatePromptItemStatus(promptId, 'error');
        updateSequenceStatus('Erro: Resposta sem dados válidos', 'error');
        
        // Adiciona ao log de resultados
        sequenceResults.push({
            promptId: promptId,
            promptName: prompts[promptId]?.name || 'Prompt Desconhecido',
            status: 'error',
            response: 'ERRO: Resposta sem dados válidos',
            timestamp: new Date().toLocaleString()
        });
        
        currentSequenceIndex++;
        setTimeout(executeNextPromptInSequence, 1000);
        return;
    }

    const { success, copiedText } = event.detail;
    const promptId = sequencePrompts[currentSequenceIndex];
    const promptName = prompts[promptId]?.name || 'Prompt Desconhecido';

    console.log(`📋 Processando resposta - Sucesso: ${success}, Texto: ${copiedText?.length || 0} chars`);

    if (success && copiedText && copiedText.trim()) {
        // Sucesso com dados válidos
        updatePromptItemStatus(promptId, 'completed');
        updateSequenceStatus(`✅ ${promptName} - Resposta capturada (${copiedText.length} chars)`, 'success');
        
        // Adiciona ao log de resultados
        sequenceResults.push({
            promptId: promptId,
            promptName: promptName,
            status: 'completed',
            success: true,
            responseText: copiedText,
            response: copiedText, // compat
            timestamp: new Date().toLocaleString()
        });
    } else {
        // Erro ou resposta vazia
        const errorMsg = !success ? 'Falha no envio' : 'Resposta vazia';
        console.error(`❌ ${errorMsg} para prompt ${promptName}`);
        
        updatePromptItemStatus(promptId, 'error');
        updateSequenceStatus(`❌ ${promptName} - ${errorMsg}`, 'error');
        
        // Adiciona ao log de resultados
        sequenceResults.push({
            promptId: promptId,
            promptName: promptName,
            status: 'error',
            success: false,
            responseText: (typeof copiedText === 'string' ? copiedText : '') || `ERRO: ${errorMsg}`,
            response: (typeof copiedText === 'string' ? copiedText : '') || `ERRO: ${errorMsg}`, // compat
            timestamp: new Date().toLocaleString()
        });
    }
    
    // Atualiza o preview em tempo real
    updateRealtimePreview();

    currentSequenceIndex++;
    
    // VERIFICAÇÃO CRÍTICA: Se acabaram os prompts, finaliza
    if (currentSequenceIndex >= sequencePrompts.length) {
        console.log(`🏁 FINALIZANDO: currentSequenceIndex ${currentSequenceIndex} >= sequencePrompts.length ${sequencePrompts.length}`);
        finishSequence();
        return;
    }
    
    // Pausa se necessário ou continua
    if (isSequencePaused) {
        updateSequenceStatus('Sequência pausada após completar prompt', 'warning');
        return;
    }
    
    // Continua para o próximo prompt
    console.log(`⏭️ Agendando próximo prompt: ${currentSequenceIndex + 1}/${sequencePrompts.length} em ${sequenceWaitTime}ms`);
    setTimeout(executeNextPromptInSequence, sequenceWaitTime);
}
function finishSequence() {
    isSequenceRunning = false;
    isSequencePaused = false;
    sequenceState = 'completed';
    window.pmDispatching = false; // garante liberação
    
    // MANTÉM modo escuro moderno após finalizar
    // const sidebar = document.getElementById('promptmanager-sidebar');
    // if (sidebar) {
    //     sidebar.classList.remove('auto-play-mode');
    // }
    
    // Marca o último prompt como completed se não foi marcado
    if (currentSequenceIndex > 0) {
        const lastPromptId = sequencePrompts[currentSequenceIndex - 1];
        updatePromptItemStatus(lastPromptId, 'completed');
    }
    
    // Atualiza UI
    showSequenceControls('idle');
    updateSequenceProgress(sequencePrompts.length, sequencePrompts.length, 'Sequência finalizada');
    updateStartButtonText(); // Volta para "Iniciar Sequência"
    
    const successCount = sequenceResults.filter(r => r.success).length;
    const totalTime = Math.round((Date.now() - sequenceStartTime) / 1000);
    
    updateSequenceStatus(`✅ Concluída: ${successCount}/${sequencePrompts.length} prompts em ${totalTime}s`, 'success');
    
    showStatus(`Sequência finalizada! ${successCount}/${sequencePrompts.length} prompts processados`, 'success');
    showResultsModal();
    
    // Limpa status dos prompts após um tempo
    setTimeout(() => {
        sequencePrompts.forEach(promptId => {
            updatePromptItemStatus(promptId, null);
        });
        promptStatusCache.clear(); // Clear status cache when sequence completes
    }, 5000);
}

function showResultsModal() {
    console.log('🎯 Mostrando modal de resultados...');
    const modal = document.getElementById('sequenceResultsModal');
    const textarea = document.getElementById('sequenceResultsText');
    
    if (!modal || !textarea) {
        console.error('❌ Modal ou textarea não encontrados!');
        return;
    }
    
    const successCount = sequenceResults.filter(r => r.success).length;
    const errorCount = sequenceResults.length - successCount;
    const totalTime = Math.round((Date.now() - sequenceStartTime) / 1000);
    
    let formattedResults = `RESULTADOS DA SEQUÊNCIA - ${new Date().toLocaleString('pt-BR')}\n`;
    formattedResults += `Categoria: ${state.currentCategory}\n`;
    formattedResults += `Total de prompts: ${sequenceResults.length}\n`;
    formattedResults += `Sucessos: ${successCount} | Erros: ${errorCount}\n`;
    formattedResults += `Tempo total: ${totalTime}s\n`;
    formattedResults += `========================================\n\n`;

    sequenceResults.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        formattedResults += `${status} PROMPT ${index + 1}: ${result.promptName}\n`;
        formattedResults += `Horário: ${result.timestamp}\n`;
        formattedResults += `----------------------------------------\n`;
        formattedResults += `${result.responseText}\n\n`;
        formattedResults += `========================================\n\n`;
    });

    textarea.value = formattedResults;
    modal.classList.remove('hidden');
    console.log('✅ Modal exibido');
}

// ===== AJUDA / COMO USAR =====
function showHelp() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    // Focus no botão fechar para acessibilidade
    setTimeout(() => {
        const btn = document.getElementById('closeHelpBtn');
        if (btn) btn.focus();
    }, 50);
    // Esc para fechar
    const onEsc = (e) => {
        if (e.key === 'Escape') {
            closeHelp();
            document.removeEventListener('keydown', onEsc);
        }
    };
    document.addEventListener('keydown', onEsc);
    // Clique fora fecha
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeHelp();
    }, { once: true });
}

function closeHelp() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    modal.classList.add('hidden');
}

function closeResultsModal() {
    document.getElementById('sequenceResultsModal').classList.add('hidden');
}

function copyResults() {
    const textarea = document.getElementById('sequenceResultsText');
    navigator.clipboard.writeText(textarea.value).then(() => {
        showStatus('Resultados copiados para a área de transferência!', 'success');
    }, () => {
        showStatus('Falha ao copiar os resultados.', 'error');
    });
}

// ===== NOVAS FUNÇÕES PARA AUTO PLAY V4.0 =====

function toggleAutoPlaySettings(show) {
    const autoPlaySettings = document.getElementById('autoPlaySettings');
    if (autoPlaySettings) {
        autoPlaySettings.style.display = show ? 'block' : 'none';
        document.getElementById('promptmanager-sidebar').classList.toggle('auto-play-mode', show);
    }
}

function updateSequenceProgress(current, total, status = '') {
    // Em vez de atualizar a caixa de progresso, atualiza o título da categoria
    const categoryHeader = document.querySelector('.category-header .category-name');
    if (categoryHeader && isSequenceRunning) {
        // Salva o nome original da categoria se não foi salvo ainda
        if (!categoryHeader.dataset.originalName) {
            categoryHeader.dataset.originalName = categoryHeader.textContent;
        }
        
        // Mostra progresso simples no título
        if (current === 0) {
            categoryHeader.textContent = `${categoryHeader.dataset.originalName} - Iniciando...`;
        } else if (current >= total) {
            categoryHeader.textContent = `${categoryHeader.dataset.originalName} - Finalizado!`;
            // Volta o nome original após 3 segundos
            setTimeout(() => {
                if (categoryHeader.dataset.originalName) {
                    categoryHeader.textContent = categoryHeader.dataset.originalName;
                }
            }, 3000);
        } else {
            categoryHeader.textContent = `${categoryHeader.dataset.originalName} - Enviando ${current}/${total}`;
        }
    }
    
    // Mantém os elementos originais funcionando para compatibilidade (mas ocultos no CSS)
    const progressText = document.getElementById('progressText');
    const progressCount = document.getElementById('progressCount');
    const progressFill = document.getElementById('progressFill');
    const sequenceStatus = document.getElementById('sequenceStatus');
    
    if (progressText) progressText.textContent = status || `Prompt ${current}/${total}`;
    if (progressCount) progressCount.textContent = `${current}/${total}`;
    if (progressFill) progressFill.style.width = `${(current / total) * 100}%`;
    
    if (sequenceStatus && status) {
        sequenceStatus.textContent = status;
        sequenceStatus.className = 'sequence-status info';
    }
}

// ===== Guided Tour (leve) =====
let tourState = { active: false, index: 0, overlay: null, tooltip: null, lastHighlighted: null, handEl: null };

function getTourSteps() {
    // Seletores internos do painel da extensão
    return [
        { selector: '#channelSelect', text: 'Selecione aqui o Canal de Trabalho. Você pode criar múltiplos canais para separar projetos.' },
        { selector: '#categorySelect', text: 'Cada canal possui categorias. Use-as para organizar seus prompts.' },
        { selector: '#newPromptBtn', text: 'Crie um novo prompt. Dê um nome curto e cole o texto completo aqui.' },
        { selector: '#autoPlayMode', text: 'Ative o Modo Auto Play para enviar prompts em sequência automática.' },
        { selector: '#sequenceWaitTime', text: 'Defina o tempo de espera entre prompts (em segundos). Aumente para respostas mais longas.' },
        { selector: '#startSequenceBtn', text: 'Clique para iniciar a sequência. Você verá o status em cada card.' },
        { selector: '#promptsList', text: 'Aqui ficam os cards de prompts. A barrinha mostra Aguardando, Enviando e Concluído ✓.' },
        { selector: '.realtime-preview-section', text: 'O Preview em Tempo Real acumula as respostas. Você pode limpar, copiar ou exportar.' },
        { selector: '#exportBtn', text: 'Exporte seus dados para backup.' },
        { selector: '#importBtn', text: 'E importe quando precisar restaurar.' },
    ];
}

function startTour() {
    if (tourState.active) return;
    tourState.active = true;
    tourState.index = 0;
    createTourOverlay();
    showTourStep(0);
    // Fecha ajuda ao iniciar o tour
    closeHelp();
}

function endTour() {
    tourState.active = false;
    if (tourState.overlay) tourState.overlay.remove();
    if (tourState.tooltip) tourState.tooltip.remove();
    if (tourState.handEl) tourState.handEl.remove();
    if (tourState.lastHighlighted) tourState.lastHighlighted.classList.remove('tour-highlight');
    document.removeEventListener('keydown', tourKeydownHandler);
    tourState = { active: false, index: 0, overlay: null, tooltip: null, lastHighlighted: null, handEl: null };
}

function createTourOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.addEventListener('click', endTour);
    document.body.appendChild(overlay);
    tourState.overlay = overlay;

    const tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';
    tooltip.innerHTML = `
        <div class="tour-content"></div>
        <div class="tour-actions">
            <button class="secondary-btn tour-prev">Anterior</button>
            <button class="secondary-btn tour-skip">Pular</button>
            <button class="primary-btn tour-next">Próximo</button>
        </div>
    `;
    document.body.appendChild(tooltip);
    tourState.tooltip = tooltip;

    // Mãozinha removida: manter apenas destaque e tooltip

    tooltip.querySelector('.tour-prev').addEventListener('click', () => moveTour(-1));
    tooltip.querySelector('.tour-next').addEventListener('click', () => moveTour(1));
    tooltip.querySelector('.tour-skip').addEventListener('click', endTour);

    // Teclado
    document.addEventListener('keydown', tourKeydownHandler);
}

function tourKeydownHandler(e) {
    if (!tourState.active) return;
    if (e.key === 'Escape') return endTour();
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') return moveTour(1);
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') return moveTour(-1);
}

function moveTour(delta) {
    const steps = getTourSteps();
    let next = tourState.index + delta;
    if (next < 0) next = 0;
    if (next >= steps.length) return endTour();
    showTourStep(next);
}

function showTourStep(index) {
    const steps = getTourSteps();
    const step = steps[index];
    if (!step) return endTour();
    tourState.index = index;

    const target = document.querySelector(step.selector);
    // Se o alvo não existir/estiver oculto, avance
    if (!target || (target.offsetParent === null && step.selector !== '#promptsList')) {
        return moveTour(1);
    }

    // Limpa destaque anterior
    if (tourState.lastHighlighted) tourState.lastHighlighted.classList.remove('tour-highlight');

    // Destaca e garante visibilidade
    target.classList.add('tour-highlight');
    tourState.lastHighlighted = target;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Posiciona tooltip próximo ao alvo
    positionTooltipNear(target, step.text);

    // Overlay sem spotlight: nenhuma atualização necessária
}

function positionTooltipNear(target, text) {
    const tooltip = tourState.tooltip;
    if (!tooltip) return;
    tooltip.querySelector('.tour-content').textContent = text;

    const rect = target.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    const padding = 8;
    let top = window.scrollY + rect.top - tipRect.height - padding;
    let left = window.scrollX + rect.left + (rect.width - tipRect.width) / 2;

    // Se não couber acima, coloca abaixo
    if (top < window.scrollY) {
        top = window.scrollY + rect.bottom + padding;
    }
    // Ajustes laterais
    left = Math.max(window.scrollX + padding, Math.min(left, window.scrollX + window.innerWidth - tipRect.width - padding));

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Mãozinha removida: apenas tooltip reposicionado
}

function updateSequenceStatus(message, type = 'info') {
    const sequenceStatus = document.getElementById('sequenceStatus');
    if (sequenceStatus) {
        sequenceStatus.textContent = message;
        sequenceStatus.className = `sequence-status ${type}`;
    }
}

function showSequenceControls(state) {
    const startBtn = document.getElementById('startSequenceBtn');
    const pauseBtn = document.getElementById('pauseSequenceBtn');
    const stopBtn = document.getElementById('stopSequenceBtn');
    const progress = document.getElementById('sequenceProgress');
    
    if (startBtn) startBtn.style.display = state === 'idle' ? 'flex' : 'none';
    if (pauseBtn) pauseBtn.style.display = state === 'running' ? 'flex' : 'none';
    if (stopBtn) stopBtn.style.display = state === 'running' || state === 'paused' ? 'flex' : 'none';
    // SEMPRE mantém a caixa de progresso oculta
    if (progress) progress.style.display = 'none';
}

function pauseSequence() {
    if (isSequenceRunning && !isSequencePaused) {
        isSequencePaused = true;
        sequenceState = 'paused';
        
        // Sinaliza para o content script pausar
        document.dispatchEvent(new CustomEvent('promptmanager-pause-sequence'));
        
        updateSequenceStatus('Sequência pausada', 'warning');
        showSequenceControls('paused');
        updateStartButtonText(); // Atualiza botão para "Retomar Sequência"
        
        // Atualiza o botão de pause para resume
        const pauseBtn = document.getElementById('pauseSequenceBtn');
        if (pauseBtn) {
            // Solução segura para TrustedHTML
            safeClearElement(pauseBtn);
            
            const iconSpan = document.createElement('span');
            iconSpan.className = 'btn-icon';
            iconSpan.textContent = '▶';
            
            const textSpan = document.createElement('span');
            textSpan.className = 'btn-text';
            textSpan.textContent = 'Continuar';
            
            pauseBtn.appendChild(iconSpan);
            pauseBtn.appendChild(textSpan);
            pauseBtn.onclick = resumeSequence;
        }
        
        showStatus('Sequência pausada', 'warning');
    }
}

function resumeSequence() {
    if (isSequenceRunning && isSequencePaused) {
        isSequencePaused = false;
        sequenceState = 'running';
        
        // Sinaliza para o content script continuar
        document.dispatchEvent(new CustomEvent('promptmanager-resume-sequence'));
        
        updateSequenceStatus('Sequência retomada', 'info');
        showSequenceControls('running');
        updateStartButtonText(); // Atualiza botão para "Sequência Ativa"
        
        // Restaura o botão de pause
        const pauseBtn = document.getElementById('pauseSequenceBtn');
        if (pauseBtn) {
            // Solução segura para TrustedHTML
            safeClearElement(pauseBtn);
            
            const iconSpan = document.createElement('span');
            iconSpan.className = 'btn-icon';
            iconSpan.textContent = '⏸';
            
            const textSpan = document.createElement('span');
            textSpan.className = 'btn-text';
            textSpan.textContent = 'Pausar';
            
            pauseBtn.appendChild(iconSpan);
            pauseBtn.appendChild(textSpan);
            pauseBtn.onclick = pauseSequence;
        }
        
        showStatus('Sequência retomada', 'success');
    }
}

function stopSequence() {
    if (isSequenceRunning) {
        isSequenceRunning = false;
        isSequencePaused = false;
        sequenceState = 'idle';
    window.pmDispatching = false; // garante liberação
        
        // Sinaliza para o content script parar
        document.dispatchEvent(new CustomEvent('promptmanager-stop-sequence'));
        
        // Limpa status dos prompts e cache
        sequencePrompts.forEach(promptId => {
            updatePromptItemStatus(promptId, null);
        });
        promptStatusCache.clear(); // Clear status cache on sequence stop
        
        updateSequenceStatus('Sequência interrompida', 'warning');
        showSequenceControls('idle');
        updateStartButtonText(); // Atualiza botão para "Iniciar Sequência"
        
        // Restaura o botão de pause
        const pauseBtn = document.getElementById('pauseSequenceBtn');
        if (pauseBtn) {
            // Solução segura para TrustedHTML
            safeClearElement(pauseBtn);
            
            const iconSpan = document.createElement('span');
            iconSpan.className = 'btn-icon';
            iconSpan.textContent = '⏸';
            
            const textSpan = document.createElement('span');
            textSpan.className = 'btn-text';
            textSpan.textContent = 'Pausar';
            
            pauseBtn.appendChild(iconSpan);
            pauseBtn.appendChild(textSpan);
            pauseBtn.onclick = pauseSequence;
        }
        
        showStatus('Sequência interrompida', 'warning');
        
        // Reset variables
        sequencePrompts = [];
        currentSequenceIndex = 0;
        sequenceResults = [];
    }
}

// ===== FUNÇÕES DE DUPLICAÇÃO =====

function duplicateChannel() {
    const newName = prompt(`Duplicar canal "${state.currentChannel}".\nNome do novo canal:`);
    if (!newName || newName.trim() === '') return;
    
    const trimmedName = newName.trim();
    if (channels[trimmedName]) {
        showStatus('Já existe um canal com este nome!', 'error');
        return;
    }
    
    // Copia o canal atual
    channels[trimmedName] = JSON.parse(JSON.stringify(channels[state.currentChannel]));
    
    // Gera novos IDs para os prompts duplicados
    const newPrompts = {};
    for (const categoryName in channels[trimmedName].categories) {
        const newPromptIds = [];
        for (const oldPromptId of channels[trimmedName].categories[categoryName]) {
            const oldPrompt = prompts[oldPromptId];
            if (oldPrompt) {
                const newPromptId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                newPrompts[newPromptId] = {
                    ...oldPrompt,
                    id: newPromptId,
                    name: oldPrompt.name + ' (Cópia)'
                };
                newPromptIds.push(newPromptId);
            }
        }
        channels[trimmedName].categories[categoryName] = newPromptIds;
    }
    
    // Adiciona os novos prompts
    Object.assign(prompts, newPrompts);
    
    state.currentChannel = trimmedName;
    state.currentCategory = Object.keys(channels[trimmedName].categories)[0] || "Geral";
    
    saveData();
    updateUI();
    showStatus(`Canal "${trimmedName}" duplicado com sucesso!`, 'success');
}

function duplicateCategory() {
    const newName = prompt(`Duplicar categoria "${state.currentCategory}".\nNome da nova categoria:`);
    if (!newName || newName.trim() === '') return;
    
    const trimmedName = newName.trim();
    if (channels[state.currentChannel].categories[trimmedName]) {
        showStatus('Já existe uma categoria com este nome!', 'error');
        return;
    }
    
    // Copia os prompts da categoria atual
    const currentPromptIds = channels[state.currentChannel].categories[state.currentCategory] || [];
    const newPromptIds = [];
    
    for (const oldPromptId of currentPromptIds) {
        const oldPrompt = prompts[oldPromptId];
        if (oldPrompt) {
            const newPromptId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            prompts[newPromptId] = {
                ...oldPrompt,
                id: newPromptId,
                name: oldPrompt.name + ' (Cópia)'
            };
            newPromptIds.push(newPromptId);
        }
    }
    
    channels[state.currentChannel].categories[trimmedName] = newPromptIds;
    state.currentCategory = trimmedName;
    
    saveData();
    updateUI();
    showStatus(`Categoria "${trimmedName}" duplicada com sucesso!`, 'success');
}

function duplicatePrompt(promptObj) {
    const newName = prompt(`Duplicar prompt "${promptObj.name}".\nNome do novo prompt:`);
    if (!newName || newName.trim() === '') return;
    
    const trimmedName = newName.trim();
    const newPromptId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    prompts[newPromptId] = {
        id: newPromptId,
        name: trimmedName,
        text: promptObj.text,
        created: new Date().toISOString()
    };
    
    channels[state.currentChannel].categories[state.currentCategory].push(newPromptId);
    
    saveData();
    updateUI();
    showStatus(`Prompt "${trimmedName}" duplicado com sucesso!`, 'success');
}

// FUNÇÃO SIMPLIFICADA - updatePromptItemStatus
// Cache for last status to prevent duplicate updates
const promptStatusCache = new Map();

function updatePromptItemStatus(promptId, status) {
    // Check if this is a duplicate update
    const lastStatus = promptStatusCache.get(promptId);
    if (lastStatus === status) {
        console.log(`🔄 Ignorando atualização duplicada: ${promptId} já está ${status}`);
        return;
    }
    
    promptStatusCache.set(promptId, status);
    console.log(`🎯 updatePromptItemStatus: ${promptId} -> ${status}`);
    
    const promptElement = document.querySelector(`[data-prompt-id="${promptId}"]`);
    if (!promptElement) {
        console.log(`❌ Elemento não encontrado para promptId: ${promptId}`);
        return;
    }
    
    console.log(`✅ Elemento encontrado para prompt ${promptId}`);
    
    // Remove animações anteriores para reset
    promptElement.style.animation = 'none';
    void promptElement.offsetWidth; // Força reflow
    
    // Remove todas as classes de status
    promptElement.classList.remove('sequence-current', 'sequence-completed', 'sequence-error', 'sequence-pending');
    
    // Adiciona a nova classe
    if (status) {
        promptElement.classList.add(`sequence-${status}`);
        
        // Atualiza também a pequena barra de progresso dentro do card
        const progressContainer = promptElement.querySelector('.prompt-progress-container');
        const progressFill = promptElement.querySelector('.prompt-progress-fill');
        const progressStatus = promptElement.querySelector('.prompt-progress-status');
        if (progressContainer) {
            progressContainer.style.display = 'block';
            progressContainer.style.visibility = 'visible';
        }
        const setFill = (width, bg) => {
            if (progressFill) {
                progressFill.style.width = width;
                progressFill.style.background = bg;
                progressFill.style.height = progressFill.style.height || '6px';
            }
        };
        const setStatus = (text, color) => {
            if (progressStatus) {
                progressStatus.textContent = text;
                progressStatus.style.color = color;
                progressStatus.style.fontSize = progressStatus.style.fontSize || '11px';
                progressStatus.style.textAlign = 'center';
                progressStatus.style.marginTop = '4px';
            }
        };

        // Adiciona mensagem de status dentro do card
        let statusMsg = promptElement.querySelector('.prompt-status-msg');
        if (!statusMsg) {
            statusMsg = document.createElement('div');
            statusMsg.className = 'prompt-status-msg';
            promptElement.appendChild(statusMsg);
        }
        
        switch (status) {
            case 'current':
                statusMsg.textContent = '⏳ Enviando...';
                statusMsg.style.color = '#ff6b35';
                setStatus('Enviando...', '#f59e0b');
                setFill('60%', 'linear-gradient(90deg, #f59e0b, #f97316)');
                console.log(`🟠 Prompt ${promptId} marcado como ATUAL (laranja com pulse)`);
                break;
            case 'completed':
                statusMsg.textContent = '✅ Concluído';
                statusMsg.style.color = '#10b981';
                setStatus('Concluído ✓', '#10b981');
                setFill('100%', '#10b981');
                setTimeout(() => statusMsg.remove(), 3000);
                console.log(`🟢 Prompt ${promptId} marcado como COMPLETO (verde)`);
                break;
            case 'error':
                statusMsg.textContent = '❌ Erro';
                statusMsg.style.color = '#dc2626';
                setStatus('Erro ❌', '#dc2626');
                setFill('100%', '#dc2626');
                console.log(`🔴 Prompt ${promptId} marcado como ERRO (vermelho)`);
                break;
            case 'pending':
                statusMsg.textContent = '⏸️ Aguardando';
                statusMsg.style.color = '#6b7280';
                setStatus('Aguardando...', '#9ca3af');
                setFill('30%', 'linear-gradient(90deg, #6b7280, #9ca3af)');
                console.log(`⚫ Prompt ${promptId} marcado como PENDENTE (cinza)`);
                break;
        }
    } else {
        console.log(`🔄 Reset aplicado para prompt ${promptId}`);
    }
}

// Adicione este novo listener
document.addEventListener('promptmanager-get-next-prompt', () => {
    const nextIndex = currentSequenceIndex + 1;
    if (nextIndex < sequencePrompts.length) {
        const nextPrompt = prompts[sequencePrompts[nextIndex]];
    }
});

// ============= DRAG & DROP FUNCTIONS =============
let draggedElement = null;
let draggedPromptId = null;

function handleDragStart(e) {
    draggedElement = e.target;
    draggedPromptId = e.target.getAttribute('data-prompt-id');
    
    // Adicionar classe visual
    e.target.classList.add('dragging');
    
    // Configurar dados do drag
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    console.log('🎯 Iniciando drag:', draggedPromptId);
}

function handleDragEnd(e) {
    // Remover classe visual
    e.target.classList.remove('dragging');
    
    // Limpar indicadores de drop
    document.querySelectorAll('.drop-indicator').forEach(indicator => {
        indicator.classList.remove('active');
    });
    
    // Limpar classes drag-over
    document.querySelectorAll('.prompt-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    draggedElement = null;
    draggedPromptId = null;
    
    console.log('🏁 Finalizando drag');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Permite drop
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (e.target.classList.contains('prompt-item') && e.target !== draggedElement) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('prompt-item')) {
        e.target.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation(); // Para a propagação
    }
    
    const targetElement = e.target.closest('.prompt-item');
    if (!targetElement || targetElement === draggedElement) {
        return false;
    }
    
    const targetPromptId = targetElement.getAttribute('data-prompt-id');
    
    if (draggedPromptId && targetPromptId) {
        // Executar reordenação com animação
        reorderPrompts(draggedPromptId, targetPromptId);
    }
    
    return false;
}

function reorderPrompts(draggedId, targetId) {
    const list = channels[state.currentChannel].categories[state.currentCategory];
    const draggedIndex = list.indexOf(draggedId);
    const targetIndex = list.indexOf(targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    console.log(`🔄 Movendo prompt ${draggedIndex} → ${targetIndex}`);
    
    // Remover item da posição original
    const [draggedItem] = list.splice(draggedIndex, 1);
    
    // Inserir na nova posição
    list.splice(targetIndex, 0, draggedItem);
    
    // Salvar dados
    saveData();
    
    // Atualizar lista com animação
    animateReorder(() => {
        preserveScrollPosition(() => updatePromptList());
    });
}

function animateReorder(callback) {
    // Adicionar classe de reordenação aos itens
    document.querySelectorAll('.prompt-item').forEach(item => {
        item.classList.add('reordering');
    });
    
    // Executar callback após pequeno delay
    setTimeout(() => {
        callback();
        
        // Remover classe após animação
        setTimeout(() => {
            document.querySelectorAll('.prompt-item').forEach(item => {
                item.classList.remove('reordering');
            });
        }, 300);
    }, 50);
}

// ============= SEARCH & FILTER SYSTEM =============

// Função debounce para otimizar busca em tempo real
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============= COMPACT SEARCH FUNCTIONS =============
let isSearchOpen = false;
let searchTimeout = null;

// Função auxiliar para limpeza segura (Gemini-compatible)
function safeClearElement(element) {
    if (window.location.hostname.includes('gemini.google.com')) {
        // Para Gemini: remover filhos um por um
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    } else {
        // Para outros sites: método normal
        element.innerHTML = '';
    }
}

function toggleCompactSearch() {
    const searchInput = document.getElementById('promptSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!isSearchOpen) {
        // Abrir busca
        searchInput.classList.remove('hidden');
        searchInput.focus();
        isSearchOpen = true;
        
        // Adicionar listener para ESC
        document.addEventListener('keydown', handleSearchEscape);
        
        // Fechar se clicar fora
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    } else {
        // Fechar busca
        closeCompactSearch();
    }
}

function handleCompactSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');
    
    // Debounce
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (searchTerm.length === 0) {
            searchResults.classList.add('hidden');
            clearAllHighlights();
            return;
        }
        
        if (searchTerm.length < 2) {
            return; // Só busca com 2+ caracteres
        }
        
        const results = findMatchingPrompts(searchTerm);
        displaySearchResults(results, searchTerm);
    }, 300);
}

function findMatchingPrompts(searchTerm) {
    const results = [];
    
    // Buscar em todos os canais e categorias
    Object.keys(channels).forEach(channelName => {
        const channel = channels[channelName];
        Object.keys(channel.categories).forEach(categoryName => {
            const promptIds = channel.categories[categoryName];
            promptIds.forEach(promptId => {
                const prompt = prompts[promptId];
                if (prompt) {
                    const nameMatch = prompt.name.toLowerCase().includes(searchTerm);
                    const textMatch = prompt.text.toLowerCase().includes(searchTerm);
                    
                    if (nameMatch || textMatch) {
                        results.push({
                            prompt,
                            channel: channelName,
                            category: categoryName,
                            nameMatch,
                            textMatch
                        });
                    }
                }
            });
        });
    });
    
    return results.slice(0, 10); // Máximo 10 resultados
}

function displaySearchResults(results, searchTerm) {
    const searchResults = document.getElementById('searchResults');
    
    // Usar função auxiliar para limpeza segura
    safeClearElement(searchResults);
    
    if (results.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'search-no-results';
        noResults.textContent = `Nenhum prompt encontrado para "${searchTerm}"`;
        searchResults.appendChild(noResults);
    } else {
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            
            const name = document.createElement('div');
            name.className = 'search-result-name';
            name.textContent = result.prompt.name;
            
            const preview = document.createElement('div');
            preview.className = 'search-result-preview';
            preview.textContent = result.prompt.text.substring(0, 60) + '...';
            
            const location = document.createElement('div');
            location.className = 'search-result-location';
            location.textContent = `📂 ${result.channel} › ${result.category}`;
            
            resultItem.appendChild(name);
            resultItem.appendChild(preview);
            resultItem.appendChild(location);
            
            // Click para navegar até o prompt
            resultItem.addEventListener('click', () => {
                navigateToPrompt(result.channel, result.category, result.prompt.id);
                closeCompactSearch();
            });
            
            searchResults.appendChild(resultItem);
        });
    }
    
    searchResults.classList.remove('hidden');
}

function navigateToPrompt(channelName, categoryName, promptId) {
    // Trocar para o canal correto
    if (state.currentChannel !== channelName) {
        state.currentChannel = channelName;
        const channelSelect = document.getElementById('channelSelect');
        if (channelSelect) {
            channelSelect.value = channelName;
        }
    }
    
    // Trocar para a categoria correta
    if (state.currentCategory !== categoryName) {
        state.currentCategory = categoryName;
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.value = categoryName;
        }
    }
    
    // Atualizar UI
    updateUI();
    
    // Destacar o prompt encontrado
    setTimeout(() => {
        const promptElement = document.querySelector(`[data-prompt-id="${promptId}"]`);
        if (promptElement) {
            promptElement.classList.add('search-highlight');
            promptElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Remover highlight após 3 segundos
            setTimeout(() => {
                promptElement.classList.remove('search-highlight');
            }, 3000);
        }
    }, 100);
}

function closeCompactSearch() {
    const searchInput = document.getElementById('promptSearch');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.classList.add('hidden');
    searchResults.classList.add('hidden');
    searchInput.value = '';
    isSearchOpen = false;
    
    // Remover listeners
    document.removeEventListener('keydown', handleSearchEscape);
    document.removeEventListener('click', handleClickOutside);
    
    clearAllHighlights();
}

function handleSearchEscape(e) {
    if (e.key === 'Escape') {
        closeCompactSearch();
    }
}

function handleClickOutside(e) {
    const compactSearch = e.target.closest('.compact-search');
    if (!compactSearch) {
        closeCompactSearch();
    }
}

function clearAllHighlights() {
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.classList.remove('search-highlight');
    });
}

// Função obsoleta - manter para compatibilidade
function applySearchAndFilters() {
    const promptsList = document.getElementById('promptsList');
    if (!promptsList) return;

    const ids = channels[state.currentChannel]?.categories[state.currentCategory] || [];
    if (ids.length === 0) {
        updatePromptList();
        return;
    }

    // Filtrar prompts baseado nos critérios
    let filteredPrompts = ids.map(id => prompts[id]).filter(Boolean);

    // Aplicar filtro de busca por texto
    if (currentSearchTerm) {
        filteredPrompts = filteredPrompts.filter(prompt => 
            prompt.name.toLowerCase().includes(currentSearchTerm) ||
            prompt.text.toLowerCase().includes(currentSearchTerm)
        );
    }

    // Aplicar filtros por categoria
    switch (currentFilter) {
        case 'used':
            filteredPrompts = filteredPrompts.filter(prompt => usedPrompts.has(prompt.id));
            break;
        case 'unused':
            filteredPrompts = filteredPrompts.filter(prompt => !usedPrompts.has(prompt.id));
            break;
        case 'recent':
            // Prompts modificados nos últimos 7 dias
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            filteredPrompts = filteredPrompts.filter(prompt => 
                (prompt.modified || prompt.created) > weekAgo
            );
            break;
        default: // 'all'
            break;
    }

    // Aplicar ordenação
    switch (currentSort) {
        case 'name':
            filteredPrompts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'created':
            filteredPrompts.sort((a, b) => a.created - b.created);
            break;
        case 'modified':
            filteredPrompts.sort((a, b) => (b.modified || b.created) - (a.modified || a.created));
            break;
        case 'usage':
            // Ordenar por uso (mais usados primeiro) - implementação básica
            filteredPrompts.sort((a, b) => {
                const aUsed = usedPrompts.has(a.id) ? 1 : 0;
                const bUsed = usedPrompts.has(b.id) ? 1 : 0;
                return bUsed - aUsed;
            });
            break;
        default: // 'order'
            // Manter ordem original dos IDs
            const originalOrder = channels[state.currentChannel].categories[state.currentCategory];
            filteredPrompts.sort((a, b) => originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id));
            break;
    }

    // Renderizar resultados
    renderFilteredPrompts(filteredPrompts);
}

function renderFilteredPrompts(filteredPrompts) {
    const promptsList = document.getElementById('promptsList');
    if (!promptsList) return;

    safeClear(promptsList);

    // Mostrar contador de resultados
    if (currentSearchTerm || currentFilter !== 'all') {
        const counter = document.createElement('div');
        counter.className = 'search-results-count';
        counter.textContent = `${filteredPrompts.length} prompts encontrados`;
        promptsList.appendChild(counter);
    }

    if (filteredPrompts.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'search-no-results';
        noResults.textContent = currentSearchTerm ? 
            `Nenhum prompt encontrado para "${currentSearchTerm}"` : 
            'Nenhum prompt corresponde aos filtros selecionados';
        promptsList.appendChild(noResults);
        return;
    }

    // Renderizar prompts filtrados
    filteredPrompts.forEach((prompt, index) => {
        const totalPrompts = filteredPrompts.length;
        const promptElement = buildPromptItem(prompt, index, totalPrompts);
        
        // Destacar termo de busca
        if (currentSearchTerm) {
            highlightSearchTerm(promptElement, currentSearchTerm);
        }
        
        promptsList.appendChild(promptElement);
    });
}

function highlightSearchTerm(element, searchTerm) {
    const nameElement = element.querySelector('.prompt-name');
    const contentElement = element.querySelector('.prompt-content');
    
    // Função auxiliar para highlight seguro
    function safeHighlight(targetElement, text, term) {
        if (!text.toLowerCase().includes(term)) return;
        
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        // Limpa o elemento usando função auxiliar
        safeClearElement(targetElement);
        
        parts.forEach((part, index) => {
            if (part.toLowerCase() === term.toLowerCase()) {
                // Criar elemento mark para highlight
                const mark = document.createElement('mark');
                mark.style.background = 'var(--claude-primary)';
                mark.style.color = 'white';
                mark.style.padding = '1px 2px';
                mark.style.borderRadius = '2px';
                mark.textContent = part;
                targetElement.appendChild(mark);
            } else {
                // Criar texto simples
                const textNode = document.createTextNode(part);
                targetElement.appendChild(textNode);
            }
        });
    }
    
    if (nameElement && nameElement.textContent.toLowerCase().includes(searchTerm)) {
        safeHighlight(nameElement, nameElement.textContent, searchTerm);
    }
    
    if (contentElement && contentElement.textContent.toLowerCase().includes(searchTerm)) {
        safeHighlight(contentElement, contentElement.textContent, searchTerm);
    }
}

// Modificar updatePromptList para usar o sistema de busca
const originalUpdatePromptList = updatePromptList;
updatePromptList = function() {
    // Se há filtros/busca ativa, usar sistema filtrado
    if (currentSearchTerm || currentFilter !== 'all' || currentSort !== 'order') {
        applySearchAndFilters();
    } else {
        // Caso contrário, usar sistema original
        originalUpdatePromptList();
    }
};

// ============= IMPORT/EXPORT SYSTEM =============
let currentImportData = null;

function setupModalEventListeners() {
    // Event listeners para fechar modais
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Event listeners para o modal expandido de prompts
    const closeExpandedModal = document.getElementById('closeExpandedModal');
    const saveExpandedPromptBtn = document.getElementById('saveExpandedPromptBtn');
    const cancelExpandedPromptBtn = document.getElementById('cancelExpandedPromptBtn');

    if (closeExpandedModal) {
        closeExpandedModal.addEventListener('click', hideExpandedPromptModal);
    }
    
    if (saveExpandedPromptBtn) {
        saveExpandedPromptBtn.addEventListener('click', saveExpandedPrompt);
    }
    
    if (cancelExpandedPromptBtn) {
        cancelExpandedPromptBtn.addEventListener('click', hideExpandedPromptModal);
    }

    // Fechar modal clicando no fundo
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                // Se for o modal expandido, remover classe active do botão
                if (modal.id === 'expandedPromptModal') {
                    const expandBtn = document.getElementById('expandPromptBtn');
                    if (expandBtn) expandBtn.classList.remove('active');
                }
            }
        });
    });

    // Fechar modal expandido com tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const expandedModal = document.getElementById('expandedPromptModal');
            if (expandedModal && !expandedModal.classList.contains('hidden')) {
                hideExpandedPromptModal();
            }
        }
    });

    // Event listeners para seleção de tipo de exportação
    document.querySelectorAll('input[name="exportType"]').forEach(radio => {
        radio.addEventListener('change', updateExportSelects);
    });
    
    // Event listener para mudança de canal
    const channelSelect = document.getElementById('exportChannelSelect');
    if (channelSelect) {
        channelSelect.addEventListener('change', populateCategoriesForSelectedChannel);
    }
}

function openExportModal() {
    const modal = document.getElementById('exportModal');
    populateExportSelects();
    modal.classList.remove('hidden');
}

function closeExportModal() {
    document.getElementById('exportModal').classList.add('hidden');
}

function openImportModal() {
    document.getElementById('importFile').click();
}

function closeImportModal() {
    document.getElementById('importModal').classList.add('hidden');
    currentImportData = null;
}

function populateExportSelects() {
    const channelSelect = document.getElementById('exportChannelSelect');
    const categorySelect = document.getElementById('exportCategorySelect');
    
    // Limpar opções
    safeClearElement(channelSelect);
    safeClearElement(categorySelect);
    
    // Popular canais
    Object.keys(channels).forEach(channelName => {
        const option = document.createElement('option');
        option.value = channelName;
        option.textContent = channelName;
        channelSelect.appendChild(option);
    });
    
    // Popular categorias do canal atual
    if (state.currentChannel && channels[state.currentChannel]) {
        Object.keys(channels[state.currentChannel].categories).forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = `${state.currentChannel} > ${categoryName}`;
            categorySelect.appendChild(option);
        });
    }
}

function updateExportSelects() {
    const selectedType = document.querySelector('input[name="exportType"]:checked').value;
    const channelSelect = document.getElementById('exportChannelSelect');
    const categorySelect = document.getElementById('exportCategorySelect');
    
    channelSelect.disabled = selectedType !== 'channel';
    categorySelect.disabled = selectedType !== 'category';
    
    if (selectedType === 'category') {
        // Atualizar categorias do canal selecionado
        populateCategoriesForSelectedChannel();
    }
}

function populateCategoriesForSelectedChannel() {
    const channelSelect = document.getElementById('exportChannelSelect');
    const categorySelect = document.getElementById('exportCategorySelect');
    const selectedChannel = channelSelect.value || state.currentChannel;
    
    // Limpar categorias
    safeClearElement(categorySelect);
    
    // Popular categorias do canal selecionado
    if (channels[selectedChannel]) {
        Object.keys(channels[selectedChannel].categories).forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = `${selectedChannel} > ${categoryName}`;
            categorySelect.appendChild(option);
        });
    }
}

function confirmExport() {
    const selectedType = document.querySelector('input[name="exportType"]:checked').value;
    let exportedData = {};
    let filename = 'promptmanager-export';
    
    switch (selectedType) {
        case 'all':
            exportedData = {
                channels: channels,
                prompts: prompts,
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '5.0',
                    type: 'complete'
                }
            };
            filename = 'promptmanager-complete-export';
            break;
            
        case 'channel':
            const selectedChannel = document.getElementById('exportChannelSelect').value;
            const channelPrompts = {};
            
            // Coletar todos os prompts do canal
            Object.keys(channels[selectedChannel].categories).forEach(categoryName => {
                channels[selectedChannel].categories[categoryName].forEach(promptId => {
                    if (prompts[promptId]) {
                        channelPrompts[promptId] = prompts[promptId];
                    }
                });
            });
            
            exportedData = {
                channels: { [selectedChannel]: channels[selectedChannel] },
                prompts: channelPrompts,
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '5.0',
                    type: 'channel',
                    channelName: selectedChannel
                }
            };
            filename = `promptmanager-${selectedChannel.toLowerCase().replace(/\s+/g, '-')}-export`;
            break;
            
        case 'category':
            const categorySelect = document.getElementById('exportCategorySelect');
            const channelSelect = document.getElementById('exportChannelSelect');
            const categoryName = categorySelect.value;
            const channelName = channelSelect.value || state.currentChannel;
            const categoryPrompts = {};
            
            // Coletar prompts da categoria
            if (channels[channelName] && channels[channelName].categories[categoryName]) {
                channels[channelName].categories[categoryName].forEach(promptId => {
                    if (prompts[promptId]) {
                        categoryPrompts[promptId] = prompts[promptId];
                    }
                });
            }
            
            exportedData = {
                channels: { [channelName]: { categories: { [categoryName]: channels[channelName].categories[categoryName] } } },
                prompts: categoryPrompts,
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '5.0',
                    type: 'category',
                    channelName: channelName,
                    categoryName: categoryName
                }
            };
            filename = `promptmanager-${channelName.toLowerCase().replace(/\s+/g, '-')}-${categoryName.toLowerCase().replace(/\s+/g, '-')}-export`;
            break;
    }
    
    // Baixar arquivo
    downloadJSON(exportedData, `${filename}.json`);
    closeExportModal();
    
    const promptCount = Object.keys(exportedData.prompts).length;
    showStatus(`Exportação concluída: ${promptCount} prompts exportados`, 'success');
}

function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Valida a estrutura (schema) do arquivo de backup importado
function validateBackupShape(data) {
    if (!data || typeof data !== 'object') return 'Arquivo não parece ser um JSON válido.';
    if (!data.channels || typeof data.channels !== 'object') return 'Arquivo de backup corrompido: Faltou a propriedade "channels".';
    if (!data.prompts  || typeof data.prompts  !== 'object') return 'Arquivo de backup corrompido: Faltou a propriedade "prompts".';

    for (const [channelName, channelObj] of Object.entries(data.channels)) {
        if (!channelObj || !channelObj.categories || typeof channelObj.categories !== 'object') {
            return `Estrutura inválida para o canal "${channelName}".`;
        }
        for (const [categoryName, promptIds] of Object.entries(channelObj.categories)) {
            if (!Array.isArray(promptIds)) {
                return `Categoria "${categoryName}" no canal "${channelName}" não contém uma lista de IDs.`;
            }
            for (const id of promptIds) {
                if (!data.prompts[id]) {
                    // ID de prompt listado na categoria, mas não encontrado na lista principal de prompts.
                    return `ID de prompt órfão encontrado: "${id}" na categoria "${categoryName}".`;
                }
            }
        }
    }
    return null; // Retorna null se tudo estiver OK
}

function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);

            // ---- INÍCIO DA MUDANÇA ----
            const validationError = validateBackupShape(importedData);
            if (validationError) {
                showStatus(validationError, 'error');
                return; // Interrompe a importação se a estrutura for inválida
            }
            // ---- FIM DA MUDANÇA ----

            currentImportData = importedData;
            showImportPreview(currentImportData);

        } catch (error) {
            showStatus('Erro ao ler arquivo: formato JSON inválido.', 'error');
        }
    };
    reader.readAsText(file);
    
    e.target.value = '';
}

function showImportPreview(data) {
    const modal = document.getElementById('importModal');
    const preview = document.getElementById('importPreview');
    const checkboxContainer = document.getElementById('importCheckboxes');
    const optionsDiv = document.querySelector('.import-options');
    const confirmBtn = document.getElementById('confirmImportBtn');
    
    // Mostrar preview
    let previewText = '';
    if (data.metadata) {
        previewText += `Tipo: ${data.metadata.type || 'desconhecido'}\n`;
        previewText += `Data: ${data.metadata.exportDate || 'desconhecida'}\n`;
        previewText += `Versão: ${data.metadata.version || 'desconhecida'}\n\n`;
    }
    
    previewText += `Canais: ${Object.keys(data.channels || {}).length}\n`;
    previewText += `Prompts: ${Object.keys(data.prompts || {}).length}\n\n`;
    
    // Detalhar canais
    if (data.channels) {
        Object.keys(data.channels).forEach(channelName => {
            const channel = data.channels[channelName];
            const categoryCount = Object.keys(channel.categories || {}).length;
            let promptCount = 0;
            
            Object.values(channel.categories || {}).forEach(promptIds => {
                promptCount += promptIds.length;
            });
            
            previewText += `📁 ${channelName}: ${categoryCount} categorias, ${promptCount} prompts\n`;
            
            Object.keys(channel.categories || {}).forEach(categoryName => {
                const promptIds = channel.categories[categoryName];
                previewText += `  📂 ${categoryName}: ${promptIds.length} prompts\n`;
            });
        });
    }
    
    preview.textContent = previewText;
    
    // Criar checkboxes
    safeClearElement(checkboxContainer);
    
    if (data.channels) {
        Object.keys(data.channels).forEach(channelName => {
            const channelDiv = document.createElement('div');
            channelDiv.className = 'channel-group';
            
            const channelHeader = document.createElement('div');
            channelHeader.className = 'channel-header';
            
            const channelCheckbox = document.createElement('input');
            channelCheckbox.type = 'checkbox';
            channelCheckbox.id = `import-channel-${channelName}`;
            channelCheckbox.checked = true;
            
            const channelLabel = document.createElement('label');
            channelLabel.htmlFor = channelCheckbox.id;
            channelLabel.textContent = `📁 ${channelName}`;
            
            const promptCountSpan = document.createElement('span');
            promptCountSpan.className = 'prompt-count';
            
            let totalPrompts = 0;
            Object.values(data.channels[channelName].categories || {}).forEach(promptIds => {
                totalPrompts += promptIds.length;
            });
            promptCountSpan.textContent = `${totalPrompts} prompts`;
            
            channelHeader.appendChild(channelCheckbox);
            channelHeader.appendChild(channelLabel);
            channelHeader.appendChild(promptCountSpan);
            channelDiv.appendChild(channelHeader);
            
            // Categorias
            Object.keys(data.channels[channelName].categories || {}).forEach(categoryName => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category-item';
                
                const categoryCheckbox = document.createElement('input');
                categoryCheckbox.type = 'checkbox';
                categoryCheckbox.id = `import-category-${channelName}-${categoryName}`;
                categoryCheckbox.checked = true;
                
                const categoryLabel = document.createElement('label');
                categoryLabel.htmlFor = categoryCheckbox.id;
                categoryLabel.textContent = `📂 ${categoryName}`;
                
                const promptCount = data.channels[channelName].categories[categoryName].length;
                const categoryCountSpan = document.createElement('span');
                categoryCountSpan.className = 'prompt-count';
                categoryCountSpan.textContent = `${promptCount} prompts`;
                
                categoryDiv.appendChild(categoryCheckbox);
                categoryDiv.appendChild(categoryLabel);
                categoryDiv.appendChild(categoryCountSpan);
                channelDiv.appendChild(categoryDiv);
                
                // Sincronizar checkboxes
                categoryCheckbox.addEventListener('change', updateChannelCheckbox);
                channelCheckbox.addEventListener('change', function() {
                    categoryCheckbox.checked = this.checked;
                });
            });
            
            checkboxContainer.appendChild(channelDiv);
        });
    }
    
    optionsDiv.classList.remove('hidden');
    confirmBtn.classList.remove('hidden');
    modal.classList.remove('hidden');
}

function updateChannelCheckbox(e) {
    const categoryCheckbox = e.target;
    const channelName = categoryCheckbox.id.split('-')[2];
    const channelCheckbox = document.getElementById(`import-channel-${channelName}`);
    
    if (!channelCheckbox) return;
    
    const categoryCheckboxes = document.querySelectorAll(`input[id^="import-category-${channelName}-"]`);
    const checkedCategories = Array.from(categoryCheckboxes).filter(cb => cb.checked);
    
    channelCheckbox.checked = checkedCategories.length > 0;
    channelCheckbox.indeterminate = checkedCategories.length > 0 && checkedCategories.length < categoryCheckboxes.length;
}

function confirmImport() {
    if (!currentImportData) return;
    
    const replaceExisting = document.getElementById('replaceExisting').checked;
    let importedPrompts = 0;
    let importedChannels = 0;
    let importedCategories = 0;
    
    // Coletar seleções
    const selectedChannels = [];
    const selectedCategories = {};
    
    Object.keys(currentImportData.channels || {}).forEach(channelName => {
        const channelCheckbox = document.getElementById(`import-channel-${channelName}`);
        if (channelCheckbox && channelCheckbox.checked) {
            selectedChannels.push(channelName);
            selectedCategories[channelName] = [];
            
            Object.keys(currentImportData.channels[channelName].categories || {}).forEach(categoryName => {
                const categoryCheckbox = document.getElementById(`import-category-${channelName}-${categoryName}`);
                if (categoryCheckbox && categoryCheckbox.checked) {
                    selectedCategories[channelName].push(categoryName);
                }
            });
        }
    });
    
    // Importar dados selecionados
    selectedChannels.forEach(channelName => {
        const importChannel = currentImportData.channels[channelName];
        
        // Criar canal se não existir
        if (!channels[channelName]) {
            channels[channelName] = { categories: {} };
            importedChannels++;
        }
        
        selectedCategories[channelName].forEach(categoryName => {
            const importPromptIds = importChannel.categories[categoryName];
            
            // Criar categoria se não existir
            if (!channels[channelName].categories[categoryName]) {
                channels[channelName].categories[categoryName] = [];
                importedCategories++;
            }
            
            // Importar prompts
            importPromptIds.forEach(promptId => {
                const importPrompt = currentImportData.prompts[promptId];
                if (!importPrompt) return;
                
                let finalPromptId = promptId;
                
                if (replaceExisting) {
                    // Verificar se já existe prompt com mesmo nome
                    const existingPromptId = channels[channelName].categories[categoryName].find(id => {
                        const existingPrompt = prompts[id];
                        return existingPrompt && existingPrompt.name === importPrompt.name;
                    });
                    
                    if (existingPromptId) {
                        finalPromptId = existingPromptId;
                    }
                } else {
                    // Criar novo ID se já existir
                    if (prompts[promptId]) {
                        finalPromptId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    }
                }
                
                // Salvar prompt
                prompts[finalPromptId] = {
                    ...importPrompt,
                    id: finalPromptId
                };
                
                // Adicionar à categoria se não estiver
                if (!channels[channelName].categories[categoryName].includes(finalPromptId)) {
                    channels[channelName].categories[categoryName].push(finalPromptId);
                }
                
                importedPrompts++;
            });
        });
    });
    
    saveData();
    updateUI();
    closeImportModal();
    
    showStatus(`Importação concluída: ${importedChannels} canais, ${importedCategories} categorias, ${importedPrompts} prompts`, 'success');
}

//# sourceMappingURL=sidebar-script.js.map

// ============= FUNÇÕES DE CÓPIA DE PROMPT =============

/**
 * Abre o modal de cópia e popula os dropdowns.
 * @param {object} prompt - O objeto do prompt a ser copiado.
 */
function openCopyPromptModal(prompt) {
    promptToCopy = prompt;
    const modal = document.getElementById('copyPromptModal');
    const channelSelect = document.getElementById('copyChannelSelect');
    const nameInput = document.getElementById('copyPromptName');

    if (!modal || !channelSelect || !nameInput) return;

    // Limpa seletores anteriores
    while (channelSelect.firstChild) channelSelect.removeChild(channelSelect.firstChild);

    // Popula o seletor de canais
    Object.keys(channels).forEach(channelName => {
        const option = document.createElement('option');
        option.value = channelName;
        option.textContent = channelName;
        if (channelName === state.currentChannel) option.selected = true;
        channelSelect.appendChild(option);
    });

    // Popula as categorias para o canal pré-selecionado
    handleCopyChannelChange();
    
    // Define o nome padrão do prompt
    nameInput.value = prompt.name;
    nameInput.placeholder = `Cópia de "${prompt.name}"`;

    // Exibe o modal
    modal.classList.remove('hidden');
}

/**
 * Fecha o modal de cópia.
 */
function closeCopyPromptModal() {
    const modal = document.getElementById('copyPromptModal');
    if (modal) modal.classList.add('hidden');
    promptToCopy = null;
}

/**
 * Atualiza o seletor de categorias quando o canal de destino é alterado.
 */
function handleCopyChannelChange() {
    const channelSelect = document.getElementById('copyChannelSelect');
    const categorySelect = document.getElementById('copyCategorySelect');
    if (!channelSelect || !categorySelect) return;

    const selectedChannel = channelSelect.value;
    while (categorySelect.firstChild) categorySelect.removeChild(categorySelect.firstChild);

    if (channels[selectedChannel] && channels[selectedChannel].categories) {
        Object.keys(channels[selectedChannel].categories).forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
    }
}

/**
 * Confirma e executa a cópia do prompt para o destino selecionado.
 */
function confirmCopyPrompt() {
    if (!promptToCopy) return;

    const destChannel = document.getElementById('copyChannelSelect')?.value;
    const destCategory = document.getElementById('copyCategorySelect')?.value;
    const newName = (document.getElementById('copyPromptName')?.value || '').trim();

    if (!destChannel || !destCategory) {
        showStatus('Selecione um canal e uma categoria de destino.', 'error');
        return;
    }

    // Gera um novo ID para a cópia
    const newPromptId = generateId();

    // Cria o novo objeto de prompt
    const newPrompt = {
        ...promptToCopy,
        id: newPromptId,
        name: newName || promptToCopy.name,
        channel: destChannel,
        category: destCategory,
        created: Date.now(),
        modified: Date.now()
    };

    // Adiciona o novo prompt ao objeto principal de prompts
    prompts[newPromptId] = newPrompt;

    // Garante que a estrutura de destino exista
    if (!channels[destChannel]) channels[destChannel] = { categories: {} };
    if (!channels[destChannel].categories[destCategory]) channels[destChannel].categories[destCategory] = [];

    // Adiciona o ID do novo prompt à lista da categoria de destino
    channels[destChannel].categories[destCategory].push(newPromptId);

    // Salva, atualiza e notifica o usuário
    saveData();
    updateUI();
    closeCopyPromptModal();
    showStatus(`Prompt copiado para "${destChannel} > ${destCategory}"!`, 'success');
}