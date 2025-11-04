// prompt-organizer.js - Sistema de Gerenciamento de Arquivos de Prompts

console.log("📁 Prompt Organizer: Carregado!");

// ===== ORGANIZADOR DE PROMPTS =====

// Obter prompts salvos do localStorage
function getSavedPrompts() {
    try {
        const saved = localStorage.getItem('veo3-saved-prompts');
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error("❌ Erro ao carregar prompts salvos:", error);
        return {};
    }
}

// Salvar arquivo de prompts
function saveCurrentPrompts() {
    console.log('💾 Função saveCurrentPrompts chamada!');
    const inputText = document.getElementById('inputText');
    const promptsText = inputText.value.trim();
    
    if (!promptsText) {
        updateStatus("⚠️ Não há prompts para salvar. Digite algo na caixa de texto primeiro.", true);
        return;
    }
    
    // Pedir nome para o arquivo de prompts
    const fileName = prompt("📁 Digite um nome para este arquivo de prompts:");
    
    if (!fileName || fileName.trim() === '') {
        updateStatus("❌ Nome do arquivo não pode estar vazio.", true);
        return;
    }
    
    try {
        // Carregar prompts existentes
        const savedPrompts = getSavedPrompts();
        
        // Verificar se já existe um arquivo com esse nome
        if (savedPrompts[fileName.trim()]) {
            const overwrite = confirm(`⚠️ Já existe um arquivo com o nome "${fileName}". Deseja substituí-lo?`);
            if (!overwrite) {
                updateStatus("❌ Operação cancelada.", true);
                return;
            }
        }
        
        // Salvar o novo arquivo
        savedPrompts[fileName.trim()] = {
            content: promptsText,
            date: new Date().toLocaleString('pt-BR'),
            preview: promptsText.substring(0, 100) + (promptsText.length > 100 ? '...' : '')
        };
        
        // Salvar no localStorage
        localStorage.setItem('veo3-saved-prompts', JSON.stringify(savedPrompts));
        
        // Atualizar lista
        loadSavedPromptsList();
        
        updateStatus(`✅ Arquivo "${fileName}" salvo com sucesso!`, true);
        
    } catch (error) {
        console.error("❌ Erro ao salvar prompts:", error);
        updateStatus("❌ Erro ao salvar prompts. Tente novamente.", true);
    }
}

// Carregar lista de arquivos de prompts salvos
function loadSavedPromptsList() {
    const savedPromptsList = document.getElementById('savedPromptsList');
    if (!savedPromptsList) return;
    
    try {
        const savedPrompts = getSavedPrompts();
        const promptNames = Object.keys(savedPrompts);
        
        if (promptNames.length === 0) {
            savedPromptsList.innerHTML = `
                <div class="no-files">
                    <span>📁 Nenhum arquivo salvo ainda</span>
                    <small>Salve seu primeiro conjunto de prompts usando "💾 Salvar Como..."</small>
                </div>
            `;
            return;
        }
        
        // Ordenar por data (mais recentes primeiro)
        const sortedPrompts = promptNames.sort((a, b) => {
            return new Date(savedPrompts[b].date) - new Date(savedPrompts[a].date);
        });
        
        savedPromptsList.innerHTML = sortedPrompts.map(name => {
            const prompt = savedPrompts[name];
            return `
                <div class="file-item" data-prompt-name="${name}" onclick="loadPrompt('${name}')">
                    <div class="file-info">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${name}</span>
                        <span class="file-date">${prompt.date}</span>
                    </div>
                    <div class="file-actions" onclick="event.stopPropagation()">
                        <button class="action-btn load" onclick="loadPrompt('${name}')" title="Abrir">📂</button>
                        <button class="action-btn rename" onclick="renamePrompt('${name}')" title="Renomear">✏️</button>
                        <button class="action-btn delete" onclick="deletePrompt('${name}')" title="Excluir">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error("❌ Erro ao carregar lista de arquivos:", error);
        savedPromptsList.innerHTML = `
            <div class="error-files">
                <span>❌ Erro ao carregar arquivos salvos</span>
            </div>
        `;
    }
}

// Carregar prompt específico
function loadPrompt(promptName) {
    console.log('📂 Função loadPrompt chamada com:', promptName);
    try {
        const savedPrompts = getSavedPrompts();
        const prompt = savedPrompts[promptName];
        
        if (!prompt) {
            updateStatus("❌ Arquivo não encontrado.", true);
            return;
        }
        
        // Carregar no textarea
        const inputText = document.getElementById('inputText');
        inputText.value = prompt.content;
        
        updateStatus(`✅ Arquivo "${promptName}" carregado!`, true);
        
    } catch (error) {
        console.error("❌ Erro ao carregar prompt:", error);
        updateStatus("❌ Erro ao carregar prompt.", true);
    }
}

// Renomear prompt
function renamePrompt(oldName) {
    try {
        const savedPrompts = getSavedPrompts();
        const prompt = savedPrompts[oldName];
        
        if (!prompt) {
            updateStatus("❌ Arquivo não encontrado.", true);
            return;
        }
        
        const newName = prompt(`✏️ Digite o novo nome para "${oldName}":`, oldName);
        
        if (!newName || newName.trim() === '' || newName.trim() === oldName) {
            updateStatus("❌ Nome inválido ou não alterado.", true);
            return;
        }
        
        // Verificar se já existe um arquivo com o novo nome
        if (savedPrompts[newName.trim()]) {
            updateStatus("❌ Já existe um arquivo com esse nome.", true);
            return;
        }
        
        // Renomear
        savedPrompts[newName.trim()] = prompt;
        delete savedPrompts[oldName];
        
        // Salvar no localStorage
        localStorage.setItem('veo3-saved-prompts', JSON.stringify(savedPrompts));
        
        // Atualizar lista
        loadSavedPromptsList();
        
        updateStatus(`✅ Arquivo renomeado para "${newName}"!`, true);
        
    } catch (error) {
        console.error("❌ Erro ao renomear prompt:", error);
        updateStatus("❌ Erro ao renomear prompt.", true);
    }
}

// Deletar arquivo
function deletePrompt(promptName) {
    try {
        const confirmDelete = confirm(`🗑️ Tem certeza que deseja excluir o arquivo "${promptName}"?\n\nEsta ação não pode ser desfeita.`);
        
        if (!confirmDelete) {
            updateStatus("❌ Operação cancelada.", true);
            return;
        }
        
        const savedPrompts = getSavedPrompts();
        delete savedPrompts[promptName];
        
        // Salvar no localStorage
        localStorage.setItem('veo3-saved-prompts', JSON.stringify(savedPrompts));
        
        // Atualizar lista
        loadSavedPromptsList();
        
        updateStatus(`✅ Arquivo "${promptName}" excluído!`, true);
        
    } catch (error) {
        console.error("❌ Erro ao deletar prompt:", error);
        updateStatus("❌ Erro ao deletar prompt.", true);
    }
}

// Mostrar modal de abertura de arquivos
function showLoadPromptsModal() {
    console.log('📂 Função showLoadPromptsModal chamada!');
    const savedPrompts = getSavedPrompts();
    const promptNames = Object.keys(savedPrompts);
    
    if (promptNames.length === 0) {
        updateStatus("📁 Nenhum arquivo salvo para abrir.", true);
        return;
    }
    
    // Evita abrir múltiplos modais
    if (document.getElementById('veo3-automator-modal-bg')) return;
    
    const modalHTML = `
        <div id="veo3-automator-modal-bg">
            <div class="veo3-automator-modal">
                <h2>📂 Abrir Arquivo de Prompts</h2>
                <div class="load-prompts-list">
                    ${promptNames.map(name => {
                        const prompt = savedPrompts[name];
                        return `
                            <div class="load-prompt-item" onclick="loadPrompt('${name}'); document.getElementById('veo3-automator-modal-bg').remove();">
                                <div class="load-prompt-name">📄 ${name}</div>
                                <div class="load-prompt-preview">${prompt.preview}</div>
                                <div class="load-prompt-date">${prompt.date}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button class="modal-close-btn" id="modal-close">Fechar</button>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('veo3-automator-modal-bg').remove();
    });
}

// Inicializar organizador de prompts
function initPromptOrganizer() {
    console.log("📁 Inicializando Prompt Organizer...");
    
    // Tornar funções disponíveis globalmente
    window.saveCurrentPrompts = saveCurrentPrompts;
    window.showLoadPromptsModal = showLoadPromptsModal;
    window.loadPrompt = loadPrompt;
    window.renamePrompt = renamePrompt;
    window.deletePrompt = deletePrompt;
    
    // Carregar lista de prompts salvos
    loadSavedPromptsList();
    
    console.log("✅ Prompt Organizer inicializado com sucesso!");
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPromptOrganizer);
} else {
    initPromptOrganizer();
}
