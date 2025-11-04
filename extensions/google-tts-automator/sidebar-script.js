// sidebar-script.js - Script específico para a sidebar
console.log("Google Speech sidebar-script.js carregado!");

let textParts = [];
let currentPartIndex = 0;
let isProcessing = false;
let isPaused = false;
let isManualMode = false; // Nova variável para controlar o modo
let currentEditingIndex = -1; // Para rastrear qual parte está sendo editada no modal

// Aguarda o conteúdo da sidebar ser carregado
function initializeSidebar() {
    console.log("Inicializando Google Speech Sidebar...");
    
    // Aguarda um pouco mais para garantir que o DOM da sidebar esteja pronto
    setTimeout(() => {
        if (document.getElementById('blablabot-sidebar')) {
            setupEventListeners();
            setupContentScriptCommunication();
            loadSavedState();
            console.log("Google Speech Sidebar inicializada com sucesso!");
        } else {
            // Tenta novamente se a sidebar ainda não estiver pronta
            setTimeout(initializeSidebar, 500);
        }
    }, 1000);
}

// Configura comunicação com o content script
function setupContentScriptCommunication() {
    // Listener para respostas do content script
    document.addEventListener('blablabot-paste-response', (event) => {
        const response = event.detail;
        console.log(`Resposta recebida para parte ${response.partIndex + 1}:`, response);
        
        if (response.isManual) {
            // Para cópias manuais, apenas mostra o resultado sem afetar o fluxo automático
            if (response.success && response.downloadInitiated) {
                updateStatus(`✅ Parte ${response.partIndex + 1} processada e download iniciado!`);
            } else {
                updateStatus(`⚠️ Parte ${response.partIndex + 1} copiada, mas houve problema: ${response.message}`);
            }
            return;
        }
        
        // Para processamento automático (fluxo normal)
        if (response.success) {
            updateStatus(`Parte ${response.partIndex + 1}: ${response.message}`);
            if (response.downloadInitiated === true) {
                console.log(`Sidebar: Download para Parte ${response.partIndex + 1} solicitado.`);
                markAsCompleted(response.partIndex);
            } else {
                updateStatus(`Falha ao solicitar download para Parte ${response.partIndex + 1}: ${response.message}`);
                isProcessing = false;
            }
        } else { 
            updateStatus(`Erro na Parte ${response.partIndex + 1}: ${response.message}`);
            isProcessing = false;
        }
    });
    
    console.log("Comunicação com content script configurada");
}

// Função para atualizar o ícone do botão toggle
function updateToggleIcon(isOpen) {
    const toggleBtn = document.getElementById('blablabot-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = isOpen ? '🔒' : '🎵';
        toggleBtn.title = isOpen ? 'Recolher Sidebar' : 'Abrir Sidebar';
    }
}

function setupEventListeners() {
    // Garante que os elementos existem antes de adicionar listeners
    const processBtn = document.getElementById('processBtn');
    const clearBtn = document.getElementById('clearBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const stopBtn = document.getElementById('stopBtn');
    const inputTextElem = document.getElementById('inputText');
    const charLimitElem = document.getElementById('charLimit');

    
    // Novos event listeners para modo manual
    const modeSwitch = document.getElementById('modeSwitch');
    const addManualBlockBtn = document.getElementById('addManualBlockBtn');
    const clearManualBtn = document.getElementById('clearManualBtn');
    const startBtn = document.getElementById('startBtn');
    const startAutoBtn = document.getElementById('startAutoBtn');

    if (processBtn) processBtn.addEventListener('click', divideTextOnly);
    if (clearBtn) clearBtn.addEventListener('click', clearText);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseProcessing);
    if (resumeBtn) resumeBtn.addEventListener('click', resumeProcessing);
    if (stopBtn) stopBtn.addEventListener('click', stopProcessing);
    if (inputTextElem) inputTextElem.addEventListener('input', updateStats);
    if (charLimitElem) charLimitElem.addEventListener('input', updateStats);

    
    // Novos listeners
    if (modeSwitch) modeSwitch.addEventListener('change', toggleMode);
    if (addManualBlockBtn) addManualBlockBtn.addEventListener('click', addManualBlock);
    if (clearManualBtn) clearManualBtn.addEventListener('click', clearManualBlocks);
    if (startBtn) startBtn.addEventListener('click', startGeneration);
    if (startAutoBtn) startAutoBtn.addEventListener('click', startAutomaticProcessing);
    
    // Listeners do modal
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const modalSave = document.getElementById('modalSave');
    const modalTextarea = document.getElementById('modalTextarea');
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);
    if (modalSave) modalSave.addEventListener('click', saveModalContent);
    if (modalTextarea) modalTextarea.addEventListener('input', updateModalCharCount);
    
    // Listener do botão de ajuda
    const helpBtn = document.getElementById('helpBtn');
    
    if (helpBtn) helpBtn.addEventListener('click', () => {
        if (window.openHelpModal) {
            window.openHelpModal();
        } else {
            console.error('Função openHelpModal não encontrada');
        }
    });
    
    // Fechar modal ao clicar fora
    const modal = document.getElementById('blablabot-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    


    console.log("Event listeners configurados na sidebar");
}

// Nova função para alternar entre modos
function toggleMode(event) {
    isManualMode = event.target.checked;
    const automaticMode = document.getElementById('automaticMode');
    const manualMode = document.getElementById('manualMode');
    const processBtn = document.getElementById('processBtn');
    const startBtn = document.getElementById('startBtn');
    const startAutoBtn = document.getElementById('startAutoBtn');
    const modeIndicator = document.getElementById('modeIndicator');
    
    if (isManualMode) {
        // Modo Manual
        automaticMode.classList.add('hidden');
        manualMode.classList.remove('hidden');
        processBtn.classList.add('hidden');
        // Não esconde o startAutoBtn no modo manual - ele pode ser usado para processar blocos manuais
        
        // Atualiza o indicador de modo
        if (modeIndicator) modeIndicator.textContent = 'Modo Manual';
        
        // Limpa dados do modo automático
        clearText();
        
        updateStatus('Modo Manual ativado. Adicione blocos de texto.');
    } else {
        // Modo Automático
        manualMode.classList.add('hidden');
        automaticMode.classList.remove('hidden');
        
        // Atualiza o indicador de modo
        if (modeIndicator) modeIndicator.textContent = 'Modo Automático';
        
        // Limpa dados do modo manual
        clearManualBlocks();
        
        updateStatus('Modo Automático ativado. Cole seu texto para dividir.');
    }
    
    saveState();
}

// Nova função para adicionar bloco manual
function addManualBlock() {
    const newPart = {
        text: '',
        processed: false,
        isManual: true
    };
    
    textParts.push(newPart);
    createPartsList();
    updateStats();
    updateProgress();
    saveState();
    
    // Mostra o botão de iniciar se houver pelo menos um bloco
    if (textParts.length > 0) {
        document.getElementById('startBtn').classList.remove('hidden');
        document.getElementById('startAutoBtn').classList.remove('hidden'); // Mostra também o botão automático
        document.getElementById('statsContainer').classList.remove('hidden');
        document.getElementById('partsListContainer').classList.remove('hidden');
    }
    
    updateStatus(`Bloco ${textParts.length} adicionado.`);
    
    // Foca na nova textarea
    setTimeout(() => {
        const newTextarea = document.querySelector(`#part-${textParts.length - 1} .part-textarea`);
        if (newTextarea) {
            newTextarea.focus();
        }
    }, 100);
}

// Nova função para limpar blocos manuais
function clearManualBlocks() {
    if (textParts.length > 0 && confirm('Tem certeza que deseja remover todos os blocos?')) {
        textParts = [];
        currentPartIndex = 0;
        isProcessing = false;
        isPaused = false;
        
        const partsList = document.getElementById('partsList');
        if (partsList) partsList.innerHTML = '';
        
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('statsContainer').classList.add('hidden');
        document.getElementById('partsListContainer').classList.add('hidden');
        document.getElementById('statusContainer').classList.add('hidden');
        
        // Esconde os botões de iniciar
        const startAutoBtn = document.getElementById('startAutoBtn');
        if (startAutoBtn) startAutoBtn.classList.add('hidden');
        
        updateStats();
        updateProgress();
        saveState();
        updateStatus('Todos os blocos foram removidos.');
    }
}

// Nova função para iniciar geração (modo manual)
function startGeneration() {
    if (textParts.length === 0) {
        updateStatus('❌ Adicione pelo menos um bloco de texto!');
        return;
    }
    
    // Verifica se há blocos vazios
    const emptyBlocks = textParts.filter((part, index) => !part.text.trim()).map((_, index) => index + 1);
    if (emptyBlocks.length > 0) {
        updateStatus(`❌ Os blocos ${emptyBlocks.join(', ')} estão vazios!`);
        return;
    }
    
    currentPartIndex = 0;
    isProcessing = true;
    isPaused = false;
    
    showProcessingUI();
    updateStats();
    updateProgress();
    saveState();
    
    updateStatus(`Iniciando processamento de ${textParts.length} blocos...`);
    
    // Esconde o botão de iniciar e mostra controles de execução
    document.getElementById('startBtn').classList.add('hidden');
    document.getElementById('executionButtons').classList.remove('hidden');
    
    // Inicia o processamento do primeiro bloco
    const firstPartItem = document.getElementById(`part-${currentPartIndex}`);
    if (firstPartItem) {
        const firstPartCopyButton = firstPartItem.querySelector('.copy-btn');
        if (firstPartCopyButton) {
            copyPart(currentPartIndex, { target: firstPartCopyButton });
        }
    }
}

function clearText() {
    const inputTextElem = document.getElementById('inputText');
    if (inputTextElem) inputTextElem.value = '';
    hideElements();
    textParts = []; 
    currentPartIndex = 0; 
    isProcessing = false;
    isPaused = false;
    
    // Esconde o botão de iniciar automático
    const startAutoBtn = document.getElementById('startAutoBtn');
    if (startAutoBtn) startAutoBtn.classList.add('hidden');
    
    saveState(); 
    updateStats();
    updateProgress(); 
    updateStatus('Aguardando texto...');
}



function hideElements() {
    const statusContainer = document.getElementById('statusContainer');
    const partsListContainer = document.getElementById('partsListContainer');
    const statsContainer = document.getElementById('statsContainer');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const stopBtn = document.getElementById('stopBtn');
    const processBtn = document.getElementById('processBtn');
    const startBtn = document.getElementById('startBtn');
    const startAutoBtn = document.getElementById('startAutoBtn');
    const executionButtons = document.getElementById('executionButtons');

    if (statusContainer) statusContainer.classList.add('hidden');
    if (partsListContainer) partsListContainer.classList.add('hidden');
    if (statsContainer) statsContainer.classList.add('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (processBtn) processBtn.classList.remove('hidden');
    if (startBtn) startBtn.classList.add('hidden');
    if (startAutoBtn) startAutoBtn.classList.add('hidden');
    if (executionButtons) executionButtons.classList.add('hidden');
}

function updateStats() {
    try {
        const inputTextElem = document.getElementById('inputText');
        const charLimitElem = document.getElementById('charLimit');
        const totalCharsElem = document.getElementById('totalChars');
        const totalPartsElem = document.getElementById('totalParts');
        const completedPartsElem = document.getElementById('completedParts');
        const statsContainerElem = document.getElementById('statsContainer');

        if (isManualMode) {
            // No modo manual, conta caracteres de todos os blocos
            const totalChars = textParts.reduce((sum, part) => sum + (part.text || '').length, 0);
            if (totalCharsElem) totalCharsElem.textContent = totalChars;
            if (totalPartsElem) totalPartsElem.textContent = textParts.length;
        } else {
            // Modo automático (código existente)
            if (!inputTextElem || !charLimitElem) {
                console.warn("Elementos de input não encontrados para updateStats");
                return;
            }

            const text = inputTextElem.value || '';
            const charLimit = parseInt(charLimitElem.value) || 2000;

            if (totalCharsElem) totalCharsElem.textContent = text.length;
            
            const tempParts = splitText(text, charLimit);
            if (totalPartsElem) totalPartsElem.textContent = tempParts.length;
        }
        
        const completedCount = textParts.filter(part => part && part.processed).length;
        if (completedPartsElem) completedPartsElem.textContent = completedCount;

        if (statsContainerElem && !isManualMode) {
            const text = inputTextElem ? inputTextElem.value || '' : '';
            if (text.length > 0) {
                statsContainerElem.classList.remove('hidden');
            } else {
                statsContainerElem.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error("Erro na função updateStats:", error);
    }
}

function splitText(text, maxLength) {
    if (!text || text.trim().length === 0) return [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const parts = [];
    let currentPart = '';
    for (let i = 0; i < sentences.length; i++) {
        let sentence = sentences[i].trim();
        if (!sentence) continue;
        if ((currentPart + sentence + ' ').length <= maxLength) {
            currentPart += sentence + ' ';
        } else {
            if (currentPart) parts.push(currentPart.trim());
            if (sentence.length <= maxLength) {
                 currentPart = sentence + ' ';
            } else {
                 let tempSentence = sentence;
                 while(tempSentence.length > 0) {
                     parts.push(tempSentence.substring(0, maxLength));
                     tempSentence = tempSentence.substring(maxLength);
                 }
                 currentPart = '';
            }
        }
    }
    if (currentPart) parts.push(currentPart.trim());
    return parts.filter(part => part.length > 0);
}

function createPartsList() {
    const partsList = document.getElementById('partsList');
    if (!partsList) {
        console.log("Elemento partsList não encontrado");
        return;
    }
    
    // Limpa a lista de forma segura
    while (partsList.firstChild) {
        partsList.removeChild(partsList.firstChild);
    }
    
    textParts.forEach((part, index) => {
        const li = document.createElement('li');
        li.id = `part-${index}`;
        li.className = 'part-item';
        
        // Adiciona classe manual se for bloco manual
        if (part.isManual) {
            li.classList.add('manual-block');
        }
        
        // Container principal da parte
        const partContainer = document.createElement('div');
        partContainer.className = 'part-container';
        
        // Número da parte
        const partNumber = document.createElement('div');
        partNumber.className = 'part-number';
        partNumber.textContent = `${index + 1}`;
        
        // Textarea editável para o texto
        const textArea = document.createElement('textarea');
        textArea.className = 'part-textarea';
        textArea.value = part.text;
        textArea.placeholder = `Texto da parte ${index + 1}`;
        textArea.addEventListener('input', (e) => {
            textParts[index].text = e.target.value;
            saveState();
            updateStats(); // Atualiza contagem de caracteres
        });
        
        // Container dos botões
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'part-buttons';
        
        // Botão expandir (sempre visível)
        const expandBtn = document.createElement('button');
        expandBtn.textContent = '⤢';
        expandBtn.title = 'Expandir para editar';
        expandBtn.className = 'expand-btn';
        expandBtn.addEventListener('click', () => openModal(index));
        
        // Botão copiar manual (sempre visível)
        const manualCopyBtn = document.createElement('button');
        manualCopyBtn.textContent = '📋';
        manualCopyBtn.title = 'Copiar para AI Studio';
        manualCopyBtn.className = 'manual-copy-btn';
        manualCopyBtn.addEventListener('click', (event) => manualCopyPart(index, event));
        
        // Botão download manual (sempre visível)
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = '⬇️';
        downloadBtn.title = 'Baixar Áudio (se disponível)';
        downloadBtn.className = 'download-btn';
        downloadBtn.addEventListener('click', () => downloadAudioFromPage(index));
        
        // Botão marcar como concluído manual (sempre visível)
        const manualMarkBtn = document.createElement('button');
        manualMarkBtn.textContent = part.processed ? '✅' : '⭕';
        manualMarkBtn.title = part.processed ? 'Marcar como Pendente' : 'Marcar como Concluído';
        manualMarkBtn.className = part.processed ? 'success-btn manual-mark-btn' : 'manual-mark-btn';
        manualMarkBtn.addEventListener('click', () => togglePartStatus(index));
        
        // Botão copiar automático (apenas durante processamento)
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '🔄';
        copyBtn.title = 'Processar Automaticamente';
        copyBtn.className = 'copy-btn';
        copyBtn.style.display = isProcessing ? 'block' : 'none';
        copyBtn.addEventListener('click', (event) => copyPart(index, event));
        
        // Botão marcar como concluído automático (apenas durante processamento)
        const markBtn = document.createElement('button');
        markBtn.textContent = '✅';
        markBtn.title = 'Marcar como Concluído (Auto)';
        markBtn.className = 'success-btn mark-btn';
        markBtn.style.display = isProcessing ? 'block' : 'none';
        markBtn.addEventListener('click', () => markAsCompleted(index));
        
        // Botão remover parte
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '🗑️';
        removeBtn.title = 'Remover Parte';
        removeBtn.className = 'danger-btn';
        removeBtn.addEventListener('click', () => removePart(index));
        
        // Desabilita botão remover durante processamento
        if (isProcessing) {
            removeBtn.disabled = true;
            removeBtn.className = 'danger-btn disabled';
            removeBtn.title = 'Não é possível remover durante processamento';
        }
        
        // Status da parte
        const statusSpan = document.createElement('span');
        statusSpan.className = 'part-status';
        statusSpan.textContent = part.processed ? '✅ Concluída' : '⏳ Pendente';
        
        buttonsDiv.appendChild(expandBtn);
        buttonsDiv.appendChild(manualCopyBtn);
        buttonsDiv.appendChild(downloadBtn);
        buttonsDiv.appendChild(manualMarkBtn);
        buttonsDiv.appendChild(copyBtn);
        buttonsDiv.appendChild(markBtn);
        buttonsDiv.appendChild(removeBtn);
        buttonsDiv.appendChild(statusSpan);
        
        partContainer.appendChild(partNumber);
        partContainer.appendChild(textArea);
        partContainer.appendChild(buttonsDiv);
        li.appendChild(partContainer);
        partsList.appendChild(li);
        
        // Aplica classes de status
        if (part.processed) li.classList.add('processed');
        if (index === currentPartIndex && !part.processed && isProcessing && !isPaused) {
            li.classList.add('processing');
        }
    });
    
    console.log(`Lista de partes criada com ${textParts.length} itens editáveis`);
}

// Nova função para baixar áudio da página
function downloadAudioFromPage(index) {
    try {
        console.log(`Tentando baixar áudio da parte ${index + 1}...`);
        
        // Procura por elementos de áudio na página
        const audioElements = document.querySelectorAll('audio[src^="data:audio"]');
        
        if (audioElements.length === 0) {
            updateStatus(`❌ Nenhum áudio encontrado na página para baixar.`);
            return;
        }
        
        // Se há apenas um áudio, usa ele
        let audioToDownload = audioElements[0];
        
        // Se há múltiplos áudios, pode tentar encontrar o mais recente
        if (audioElements.length > 1) {
            // Usa o último áudio encontrado (provavelmente o mais recente)
            audioToDownload = audioElements[audioElements.length - 1];
        }
        
        if (!audioToDownload.src || !audioToDownload.src.startsWith('data:audio')) {
            updateStatus(`❌ Áudio não contém dados válidos para download.`);
            return;
        }
        
        // Cria um link temporário para download
        const downloadLink = document.createElement('a');
        downloadLink.href = audioToDownload.src;
        downloadLink.download = `audio_parte_${index + 1}.wav`;
        
        // Adiciona ao DOM temporariamente, clica e remove
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        updateStatus(`⬇️ Download iniciado: audio_parte_${index + 1}.wav`);
        console.log(`Download manual iniciado para parte ${index + 1}`);
        
    } catch (error) {
        console.error("Erro na função downloadAudioFromPage:", error);
        updateStatus(`❌ Erro ao baixar áudio da parte ${index + 1}: ${error.message}`);
    }
}

// Nova função para alternar status da parte manualmente
function togglePartStatus(index) {
    try {
        if (index < 0 || index >= textParts.length) {
            console.error(`Índice inválido: ${index}`);
            return;
        }
        
        // Alterna o status
        textParts[index].processed = !textParts[index].processed;
        
        const li = document.getElementById(`part-${index}`);
        const manualMarkBtn = li.querySelector('.manual-mark-btn');
        const statusSpan = li.querySelector('.part-status');
        
        if (textParts[index].processed) {
            // Marca como concluído
            li.classList.add('processed');
            if (manualMarkBtn) {
                manualMarkBtn.textContent = '✅';
                manualMarkBtn.title = 'Marcar como Pendente';
                manualMarkBtn.className = 'success-btn manual-mark-btn';
            }
            if (statusSpan) statusSpan.textContent = '✅ Concluída';
            updateStatus(`✅ Parte ${index + 1} marcada como concluída manualmente.`);
        } else {
            // Marca como pendente
            li.classList.remove('processed');
            if (manualMarkBtn) {
                manualMarkBtn.textContent = '⭕';
                manualMarkBtn.title = 'Marcar como Concluído';
                manualMarkBtn.className = 'manual-mark-btn';
            }
            if (statusSpan) statusSpan.textContent = '⏳ Pendente';
            updateStatus(`⏳ Parte ${index + 1} marcada como pendente.`);
        }
        
        updateStats();
        updateProgress();
        saveState();
        
        console.log(`Parte ${index + 1} ${textParts[index].processed ? 'concluída' : 'pendente'} manualmente`);
        
    } catch (error) {
        console.error("Erro na função togglePartStatus:", error);
        updateStatus(`❌ Erro ao alterar status da parte ${index + 1}: ${error.message}`);
    }
}

// Nova função para cópia manual (independente do processamento automático)
function manualCopyPart(index, event) {
    try {
        console.log(`Cópia manual da parte ${index + 1}...`);
        
        if (index < 0 || index >= textParts.length) {
            console.error(`Índice inválido para copiar: ${index}`);
            return;
        }
        
        // Pega o texto atual da textarea
        const textarea = document.querySelector(`#part-${index} .part-textarea`);
        const partText = textarea ? textarea.value.trim() : textParts[index].text;
        
        if (!partText) {
            updateStatus(`❌ Parte ${index + 1} está vazia!`);
            return;
        }

        // Atualiza o texto no array
        textParts[index].text = partText;
        saveState();
        
        navigator.clipboard.writeText(partText).then(() => {
            console.log(`Parte ${index + 1} copiada manualmente para clipboard`);
            
            if (event && event.target) {
                const btn = event.target;
                const originalText = btn.textContent;
                const originalColor = btn.style.background;
                btn.textContent = '✅';
                btn.style.background = '#28a745';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = originalColor;
                }, 2000);
            }
            
            updateStatus(`📋 Parte ${index + 1} copiada! Cole no AI Studio e configure. Nome do arquivo: audio_parte_${index + 1}.wav`);
            
            // Nome do arquivo baseado no número da parte
            const filenameForThisPart = `audio_parte_${index + 1}.wav`;
            const customEvent = new CustomEvent('blablabot-paste-text', {
                detail: {
                    action: "pasteText",
                    text: partText,
                    filename: filenameForThisPart,
                    partIndex: index,
                    isManual: true // Flag para indicar que é cópia manual
                }
            });
            
            document.dispatchEvent(customEvent);
            
        }).catch(error => {
            console.error(`Erro ao copiar parte ${index + 1}:`, error);
            updateStatus(`❌ Erro ao copiar parte ${index + 1}: ${error.message}`);
        });
        
    } catch (error) {
        console.error("Erro na função manualCopyPart:", error);
        updateStatus(`❌ Erro ao processar parte ${index + 1}: ${error.message}`);
    }
}

// Nova função para remover uma parte
function removePart(index) {
    try {
        console.log(`Tentando remover parte ${index + 1}...`);
        
        if (isProcessing) {
            updateStatus('❌ Não é possível remover partes durante o processamento!');
            return;
        }
        
        if (index < 0 || index >= textParts.length) {
            console.error(`Índice inválido para remover: ${index}`);
            updateStatus(`❌ Erro: Índice inválido para remover parte ${index + 1}`);
            return;
        }
        
        if (!confirm(`Tem certeza que deseja remover a parte ${index + 1}?`)) {
            return;
        }
        
        // Remove a parte do array
        textParts.splice(index, 1);
        
        // Ajusta currentPartIndex se necessário
        if (currentPartIndex > index) {
            currentPartIndex--;
        } else if (currentPartIndex === index && currentPartIndex >= textParts.length) {
            currentPartIndex = Math.max(0, textParts.length - 1);
        }
        
        // Recria a lista completa com os novos índices
        createPartsList();
        updateStats();
        updateProgress();
        saveState();
        
        updateStatus(`✅ Parte ${index + 1} removida. Total de partes: ${textParts.length}`);
        console.log(`Parte ${index + 1} removida com sucesso. Partes restantes: ${textParts.length}`);
        
    } catch (error) {
        console.error("Erro na função removePart:", error);
        updateStatus(`❌ Erro ao remover parte ${index + 1}: ${error.message}`);
    }
}

// Nova função para adicionar uma parte
function addNewPart() {
    if (isProcessing) {
        updateStatus('❌ Não é possível adicionar partes durante o processamento!');
        return;
    }
    
    const newPart = {
        text: 'Digite o texto da nova parte aqui...',
        processed: false
    };
    
    textParts.push(newPart);
    createPartsList();
    updateStats();
    updateProgress();
    saveState();
    updateStatus(`Nova parte adicionada (${textParts.length}).`);
    
    // Foca na nova textarea
    setTimeout(() => {
        const newTextarea = document.querySelector(`#part-${textParts.length - 1} .part-textarea`);
        if (newTextarea) {
            newTextarea.focus();
            newTextarea.select();
        }
    }, 100);
}

function copyPart(index, event) {
    try {
        console.log(`Copiando parte ${index + 1}...`);
        
        if (index < 0 || index >= textParts.length) {
            console.error(`Índice inválido para copiar: ${index}`);
            return;
        }
        
        if (!textParts[index] || !textParts[index].text) {
            console.error(`Texto não encontrado para parte ${index + 1}`);
            return;
        }

        currentPartIndex = index;
        saveState();
        
        const partText = textParts[index].text;
        
        navigator.clipboard.writeText(partText).then(() => {
            console.log(`Parte ${index + 1} copiada para clipboard`);
            
            if (event && event.target) {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✅';
                btn.style.background = '#28a745';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);
            }
            
            // Remove classe processing de todos os itens
            document.querySelectorAll('#partsList li').forEach(li => li.classList.remove('processing'));
            
            // Adiciona classe processing ao item atual
            const currentLi = document.getElementById(`part-${index}`);
            if (currentLi) currentLi.classList.add('processing');
            
            updateStatus(`Parte ${index + 1} copiada! Enviando para AI Studio...`);
            
            // Envia para o AI Studio
            pasteTextToAIStudio(partText, index);
            
        }).catch(error => {
            console.error(`Erro ao copiar parte ${index + 1}:`, error);
            updateStatus(`Erro ao copiar parte ${index + 1}: ${error.message}`);
        });
        
    } catch (error) {
        console.error("Erro na função copyPart:", error);
        updateStatus(`Erro ao processar parte ${index + 1}: ${error.message}`);
    }
}

async function markAsCompleted(index) {
    try {
        console.log(`Marcando parte ${index + 1} como concluída...`);
        
        if (index < 0 || index >= textParts.length) {
            console.error(`Índice inválido: ${index}, total de partes: ${textParts.length}`);
            return;
        }
        
        if (textParts[index] && textParts[index].processed) {
            console.log(`Parte ${index + 1} já estava marcada como processada`);
            return;
        }

        if (textParts[index]) {
            textParts[index].processed = true;
        }
        
        const li = document.getElementById(`part-${index}`);
        if (li) {
            li.classList.remove('processing');
            li.classList.add('processed');
        }

        updateStats();
        updateProgress();
        saveState();

        const completedCount = textParts.filter(part => part && part.processed).length;
        console.log(`Partes concluídas: ${completedCount}/${textParts.length}`);
        
        if (completedCount === textParts.length) {
            updateStatus('🎉 Todas as partes foram processadas com sucesso!');
            stopProcessing();
            return;
        }
        
        if (isProcessing && !isPaused) {
            let nextUnprocessedIndex = -1;
            for (let i = index + 1; i < textParts.length; i++) {
                if (textParts[i] && !textParts[i].processed) {
                    nextUnprocessedIndex = i;
                    break;
                }
            }
            if (nextUnprocessedIndex === -1) {
                nextUnprocessedIndex = textParts.findIndex(part => part && !part.processed);
            }
            
            if (nextUnprocessedIndex !== -1) {
                currentPartIndex = nextUnprocessedIndex;
                updateStatus(`Parte ${index + 1} concluída! Processando próxima: Parte ${currentPartIndex + 1}.`);
                await new Promise(resolve => setTimeout(resolve, 2000)); 
                
                const nextPartItem = document.getElementById(`part-${currentPartIndex}`);
                if (nextPartItem) {
                    const nextPartCopyButton = nextPartItem.querySelector('.copy-btn');
                    if (nextPartCopyButton) {
                        copyPart(currentPartIndex, { target: nextPartCopyButton });
                    } else {
                        updateStatus(`Erro: Botão de copiar da Parte ${currentPartIndex + 1} não encontrado.`);
                        stopProcessing(); 
                    }
                } else {
                     updateStatus(`Erro: Item da lista para Parte ${currentPartIndex + 1} não encontrado.`);
                     stopProcessing(); 
                }
            } else {
                 updateStatus('Nenhuma parte pendente encontrada. Processamento concluído.');
                 stopProcessing();
            }
        } else {
            updateStatus(`Parte ${index + 1} marcada como concluída.`);
        }
    } catch (error) {
        console.error("Erro na função markAsCompleted:", error);
        updateStatus(`Erro ao marcar parte ${index + 1} como concluída: ${error.message}`);
    }
}

// Nova função: apenas divide o texto sem iniciar processamento
function divideTextOnly() {
    const inputTextElem = document.getElementById('inputText');
    const charLimitElem = document.getElementById('charLimit');
    if(!inputTextElem || !charLimitElem) return;

    const text = inputTextElem.value.trim();
    const charLimit = parseInt(charLimitElem.value) || 2000;
    if (!text) {
        updateStatus('❌ Por favor, digite algum texto para processar!');
        return;
    }
    const parts = splitText(text, charLimit);
    if (parts.length === 0) {
        updateStatus('❌ Não foi possível dividir o texto!');
        return;
    }
    
    textParts = parts.map(partString => ({ text: partString, processed: false }));
    currentPartIndex = 0;
    isProcessing = false; // Não inicia processamento ainda
    isPaused = false;
    
    createPartsList();
    updateStats();
    updateProgress();
    saveState();
    
    // Mostra o botão de iniciar modo automático
    const startAutoBtn = document.getElementById('startAutoBtn');
    if (startAutoBtn) startAutoBtn.classList.remove('hidden');
    
    // Mostra as estatísticas e lista de partes
    const statsContainer = document.getElementById('statsContainer');
    const partsListContainer = document.getElementById('partsListContainer');
    if (statsContainer) statsContainer.classList.remove('hidden');
    if (partsListContainer) partsListContainer.classList.remove('hidden');
    
    updateStatus(`✅ Texto dividido em ${textParts.length} partes. Revise as partes e clique em "Iniciar Modo Automático" quando estiver pronto.`);
}

// Nova função: inicia o processamento automático
function startAutomaticProcessing() {
    if (textParts.length === 0) {
        updateStatus('❌ Nenhuma parte para processar!');
        return;
    }
    
    isProcessing = true;
    isPaused = false;
    
    // Esconde o botão de iniciar automático
    const startAutoBtn = document.getElementById('startAutoBtn');
    if (startAutoBtn) startAutoBtn.classList.add('hidden');
    
    showProcessingUI();
    updateStats();
    updateProgress();
    saveState();
    
    updateStatus(`🚀 Iniciando processamento automático de ${textParts.length} partes...`);
    
    const firstPartItem = document.getElementById(`part-${currentPartIndex}`);
    if (firstPartItem) {
        const firstPartCopyButton = firstPartItem.querySelector('.copy-btn');
        if (firstPartCopyButton) {
            copyPart(currentPartIndex, { target: firstPartCopyButton });
        } else {
            updateStatus("Erro: Botão de copiar da primeira parte não encontrado.");
            stopProcessing();
        }
    } else {
        updateStatus("Erro: Item da lista para primeira parte não encontrado.");
        stopProcessing();
    }
}

function startProcessing() {
    const inputTextElem = document.getElementById('inputText');
    const charLimitElem = document.getElementById('charLimit');
    if(!inputTextElem || !charLimitElem) return;

    const text = inputTextElem.value.trim();
    const charLimit = parseInt(charLimitElem.value) || 2000;
    if (!text) {
        updateStatus('❌ Por favor, digite algum texto para processar!');
        return;
    }
    const parts = splitText(text, charLimit);
    if (parts.length === 0) {
        updateStatus('❌ Não foi possível dividir o texto!');
        return;
    }
    textParts = parts.map(partString => ({ text: partString, processed: false }));
    currentPartIndex = 0;
    isProcessing = true;
    isPaused = false;
    createPartsList();
    showProcessingUI();
    updateStats();
    updateProgress();
    saveState();
    updateStatus(`Texto dividido em ${textParts.length} partes. Iniciando processamento...`);
    
    const firstPartItem = document.getElementById(`part-${currentPartIndex}`);
    if (firstPartItem) {
        const firstPartCopyButton = firstPartItem.querySelector('.copy-btn');
        if (firstPartCopyButton) {
            copyPart(currentPartIndex, { target: firstPartCopyButton });
        } else {
            updateStatus("Erro: Botão de copiar da primeira parte não encontrado.");
            stopProcessing();
        }
    } else {
        updateStatus("Erro: Item da lista para primeira parte não encontrado.");
        stopProcessing();
    }
}

function pauseProcessing() {
    isPaused = true;
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    if (resumeBtn) resumeBtn.classList.remove('hidden');
    updateStatus('⏸️ Processamento pausado.');
    saveState();
}

function resumeProcessing() {
    isPaused = false;
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) resumeBtn.classList.add('hidden');
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    saveState();
    
    let nextUnprocessedIndex = textParts.findIndex((part, i) => i >= currentPartIndex && part && !part.processed);
    if (nextUnprocessedIndex === -1) {
        nextUnprocessedIndex = textParts.findIndex(part => part && !part.processed);
    }

    if (nextUnprocessedIndex !== -1) {
        currentPartIndex = nextUnprocessedIndex;
        updateStatus(`▶️ Processamento retomado. Processando Parte ${currentPartIndex + 1}.`);
        const nextPartItem = document.getElementById(`part-${currentPartIndex}`);
        if (nextPartItem) {
            const nextPartCopyButton = nextPartItem.querySelector('.copy-btn');
            if (nextPartCopyButton) {
                copyPart(currentPartIndex, { target: nextPartCopyButton });
            } else {
                updateStatus(`Erro: Botão de copiar da Parte ${currentPartIndex + 1} não encontrado para retomar.`);
                stopProcessing();
            }
        } else {
             updateStatus(`Erro: Item da lista para Parte ${currentPartIndex + 1} não encontrado para retomar.`);
             stopProcessing();
        }
    } else {
        updateStatus('Todas as partes já foram processadas.');
        stopProcessing();
    }
}

function stopProcessing() {
    isProcessing = false;
    isPaused = false;

    const processBtn = document.getElementById('processBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const stopBtn = document.getElementById('stopBtn');
    const startBtn = document.getElementById('startBtn');
    const executionButtons = document.getElementById('executionButtons');

    if (processBtn) processBtn.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (executionButtons) executionButtons.classList.add('hidden');
    
    // No modo manual, mostra o botão de iniciar novamente
    if (isManualMode && textParts.length > 0) {
        if (startBtn) startBtn.classList.remove('hidden');
    }
    
    // No modo automático, mostra o botão de iniciar automático novamente
    if (!isManualMode && textParts.length > 0) {
        const startAutoBtn = document.getElementById('startAutoBtn');
        if (startAutoBtn) startAutoBtn.classList.remove('hidden');
    }

    const completedCount = textParts.filter(part => part.processed).length;
    if (textParts.length > 0 && completedCount === textParts.length) {
        updateStatus('🎉 Processamento concluído com sucesso!');
    } else {
        updateStatus('⏹️ Processamento interrompido.');
    }
    
    // Atualiza os botões da lista para refletir que não está mais processando
    createPartsList();
    saveState();
}

function showProcessingUI() {
    const statusContainer = document.getElementById('statusContainer');
    const partsListContainer = document.getElementById('partsListContainer');
    const processBtn = document.getElementById('processBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const executionButtons = document.getElementById('executionButtons');

    if (statusContainer) statusContainer.classList.remove('hidden');
    if (partsListContainer) partsListContainer.classList.remove('hidden');
    if (processBtn) processBtn.classList.add('hidden');
    if (executionButtons) executionButtons.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.remove('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
}

function updateStatus(message) {
    const statusTextElem = document.getElementById('statusText');
    if (statusTextElem) statusTextElem.textContent = message;
}

function updateProgress() {
    try {
        const completed = textParts.filter(part => part && part.processed).length;
        const total = textParts.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        const currentPartElem = document.getElementById('currentPart');
        const totalPartsDisplayElem = document.getElementById('totalPartsDisplay');
        const progressBarElem = document.getElementById('progressBar');

        if (currentPartElem) currentPartElem.textContent = completed;
        if (totalPartsDisplayElem) totalPartsDisplayElem.textContent = total;
        if (progressBarElem) progressBarElem.value = percentage;
        
        console.log(`Progresso atualizado: ${completed}/${total} (${percentage.toFixed(1)}%)`);
    } catch (error) {
        console.error("Erro na função updateProgress:", error);
    }
}

function saveState() {
    try {
        const inputTextElem = document.getElementById('inputText');
        const charLimitElem = document.getElementById('charLimit');
        const modeSwitch = document.getElementById('modeSwitch');
        
        const validTextParts = Array.isArray(textParts) ? textParts : [];
        const validCurrentPartIndex = typeof currentPartIndex === 'number' && 
                                    currentPartIndex >= 0 && 
                                    currentPartIndex < validTextParts.length ? 
                                    currentPartIndex : 0;

        const stateData = {
            inputText: inputTextElem ? inputTextElem.value || '' : '',
            charLimit: charLimitElem ? charLimitElem.value || '2000' : '2000',
            textParts: validTextParts,
            currentPartIndex: validCurrentPartIndex,
            isProcessing: Boolean(isProcessing),
            isPaused: Boolean(isPaused),
            isManualMode: Boolean(isManualMode) // Salva o modo
        };

        chrome.storage.local.set(stateData, function() {
            if (chrome.runtime.lastError) {
                console.error("Erro ao salvar estado:", chrome.runtime.lastError);
            } else {
                console.log("Estado salvo com sucesso", {
                    modo: isManualMode ? 'Manual' : 'Automático',
                    partes: validTextParts.length,
                    indiceAtual: validCurrentPartIndex,
                    processando: isProcessing
                });
            }
        });
    } catch (error) {
        console.error("Erro na função saveState:", error);
    }
}

function loadSavedState() {
    chrome.storage.local.get(['inputText', 'charLimit', 'textParts', 'currentPartIndex', 'isProcessing', 'isPaused', 'isManualMode'], function(result) {
        const inputTextElem = document.getElementById('inputText');
        const charLimitElem = document.getElementById('charLimit');
        const modeSwitch = document.getElementById('modeSwitch');

        // Restaura o modo
        if (result.isManualMode !== undefined) {
            isManualMode = result.isManualMode;
            if (modeSwitch) {
                modeSwitch.checked = isManualMode;
                // Atualiza o indicador de modo
                const modeIndicator = document.getElementById('modeIndicator');
                if (modeIndicator) {
                    modeIndicator.textContent = isManualMode ? 'Modo Manual' : 'Modo Automático';
                }
                // Dispara o evento de mudança para ajustar a UI
                toggleMode({ target: modeSwitch });
            }
        }

        if (result.inputText && inputTextElem) inputTextElem.value = result.inputText;
        if (result.charLimit && charLimitElem) charLimitElem.value = result.charLimit;
        
        if (result.textParts && result.textParts.length > 0) {
            textParts = result.textParts;
            currentPartIndex = typeof result.currentPartIndex === 'number' ? result.currentPartIndex : 0;
            isProcessing = result.isProcessing || false;
            isPaused = result.isPaused || false;

            createPartsList(); 
            updateStats();    
            updateProgress(); 

            if (isProcessing) {
                showProcessingUI(); 
                if (isPaused) {
                    updateStatus('⏸️ Processamento pausado. Clique em Continuar.');
                    const pauseBtn = document.getElementById('pauseBtn');
                    const resumeBtn = document.getElementById('resumeBtn');
                    if (pauseBtn) pauseBtn.classList.add('hidden');
                    if (resumeBtn) resumeBtn.classList.remove('hidden');
                } else {
                    updateStatus(`▶️ Processamento retomado. Verificando Parte ${currentPartIndex + 1}.`);
                }
            } else {
                updateStatus('Estado anterior carregado.');
                hideElements();
                const processBtnElem = document.getElementById('processBtn');
                const startBtnElem = document.getElementById('startBtn');
                
                if (isManualMode) {
                    // No modo manual, mostra botão de iniciar se houver partes
                    if (textParts.length > 0 && startBtnElem) {
                        startBtnElem.classList.remove('hidden');
                    }
                } else {
                    // No modo automático, mostra botão de processar
                    if (processBtnElem) processBtnElem.classList.remove('hidden');
                    
                    // Se já tem partes divididas, mostra o botão de iniciar automático
                    if (textParts.length > 0) {
                        const startAutoBtn = document.getElementById('startAutoBtn');
                        if (startAutoBtn) startAutoBtn.classList.remove('hidden');
                    }
                }
                
                if(textParts.length > 0) {
                    const statusContainer = document.getElementById('statusContainer');
                    const partsListContainer = document.getElementById('partsListContainer');
                    const statsContainer = document.getElementById('statsContainer');
                    if (statusContainer) statusContainer.classList.remove('hidden');
                    if (partsListContainer) partsListContainer.classList.remove('hidden');
                    if (statsContainer) statsContainer.classList.remove('hidden');
                }
            }
        } else {
            updateStats(); 
        }
    });
}

function pasteTextToAIStudio(textToPaste, partIndex) {
    const filenameForThisPart = `audio_parte_${partIndex + 1}.wav`;

    // Verifica se estamos na página correta
    if (!window.location.href.includes('aistudio.google.com')) {
        updateStatus(`Erro: Não está na página do Google AI Studio`);
        return;
    }

    console.log(`Enviando parte ${partIndex + 1} para content script...`);

    // Dispara um evento customizado para o content script
    const customEvent = new CustomEvent('blablabot-paste-text', {
        detail: {
            action: "pasteText",
            text: textToPaste,
            filename: filenameForThisPart,
            partIndex: partIndex
        }
    });
    
    document.dispatchEvent(customEvent);
    
    updateStatus(`Parte ${partIndex + 1} enviada. Aguardando processamento...`);
}

// Inicializa quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSidebar);
} else {
    initializeSidebar();
}

// Funções do Modal
function openModal(index) {
    if (index < 0 || index >= textParts.length) return;
    
    currentEditingIndex = index;
    const modal = document.getElementById('blablabot-modal');
    const modalTextarea = document.getElementById('modalTextarea');
    const modalPartNumber = document.getElementById('modalPartNumber');
    
    if (modal && modalTextarea && modalPartNumber) {
        // Define o número da parte
        modalPartNumber.textContent = index + 1;
        
        // Pega o texto atual da textarea
        const textarea = document.querySelector(`#part-${index} .part-textarea`);
        modalTextarea.value = textarea ? textarea.value : textParts[index].text;
        
        // Mostra o modal
        modal.classList.remove('hidden');
        
        // Atualiza contador de caracteres
        updateModalCharCount();
        
        // Foca no textarea
        setTimeout(() => modalTextarea.focus(), 100);
    }
}

function closeModal() {
    const modal = document.getElementById('blablabot-modal');
    if (modal) {
        modal.classList.add('hidden');
        currentEditingIndex = -1;
    }
}

function saveModalContent() {
    if (currentEditingIndex < 0 || currentEditingIndex >= textParts.length) {
        closeModal();
        return;
    }
    
    const modalTextarea = document.getElementById('modalTextarea');
    if (modalTextarea) {
        const newText = modalTextarea.value;
        
        // Atualiza o array
        textParts[currentEditingIndex].text = newText;
        
        // Atualiza a textarea na lista
        const textarea = document.querySelector(`#part-${currentEditingIndex} .part-textarea`);
        if (textarea) {
            textarea.value = newText;
        }
        
        // Salva e atualiza stats
        saveState();
        updateStats();
        
        updateStatus(`✅ Parte ${currentEditingIndex + 1} atualizada.`);
    }
    
    closeModal();
}

function updateModalCharCount() {
    const modalTextarea = document.getElementById('modalTextarea');
    const modalCharCount = document.getElementById('modalCharCount');
    
    if (modalTextarea && modalCharCount) {
        modalCharCount.textContent = modalTextarea.value.length;
    }
}

