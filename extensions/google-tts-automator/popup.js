// popup.js (Seu código com a automação do "Concluído" ajustada)

let textParts = [];
let currentPartIndex = 0;
let isProcessing = false;
let isPaused = false;

document.addEventListener('DOMContentLoaded', function() {
    // Garante que os elementos existem antes de adicionar listeners
    const processBtn = document.getElementById('processBtn');
    const clearBtn = document.getElementById('clearBtn');
    const openAIStudioBtn = document.getElementById('openAIStudio');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const stopBtn = document.getElementById('stopBtn');
    const inputTextElem = document.getElementById('inputText');
    const charLimitElem = document.getElementById('charLimit');
    const copyUrlBtn = document.querySelector('.url-container .copy-btn');

    if (processBtn) processBtn.addEventListener('click', startProcessing);
    if (clearBtn) clearBtn.addEventListener('click', clearText);
    if (openAIStudioBtn) openAIStudioBtn.addEventListener('click', openAIStudio);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseProcessing);
    if (resumeBtn) resumeBtn.addEventListener('click', resumeProcessing);
    if (stopBtn) stopBtn.addEventListener('click', stopProcessing);
    if (inputTextElem) inputTextElem.addEventListener('input', updateStats);
    if (charLimitElem) charLimitElem.addEventListener('input', updateStats);
    if (copyUrlBtn) copyUrlBtn.addEventListener('click', copyUrl);

    loadSavedState();
});

function clearText() {
    const inputTextElem = document.getElementById('inputText');
    if (inputTextElem) inputTextElem.value = '';
    hideElements();
    textParts = []; 
    currentPartIndex = 0; 
    isProcessing = false;
    isPaused = false;
    saveState(); 
    updateStats();
    updateProgress(); 
    updateStatus('Aguardando texto...');
}

function copyUrl(event) {
    const urlSpan = document.getElementById('aiStudioUrl');
    if (!urlSpan || !event || !event.target) return;
    const url = urlSpan.textContent;
    navigator.clipboard.writeText(url).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copiado!';
        btn.style.background = '#28a745';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#17a2b8';
        }, 2000);
    });
}

function openAIStudio() {
    chrome.tabs.create({ url: 'https://aistudio.google.com/generate-speech' });
}

function hideElements() {
    const statusContainer = document.getElementById('statusContainer');
    const partsListContainer = document.getElementById('partsListContainer');
    const statsContainer = document.getElementById('statsContainer');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const stopBtn = document.getElementById('stopBtn');
    const processBtn = document.getElementById('processBtn');

    if (statusContainer) statusContainer.classList.add('hidden');
    if (partsListContainer) partsListContainer.classList.add('hidden');
    if (statsContainer) statsContainer.classList.add('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (processBtn) processBtn.classList.remove('hidden');
}

function updateStats() {
    const inputTextElem = document.getElementById('inputText');
    const charLimitElem = document.getElementById('charLimit');
    const totalCharsElem = document.getElementById('totalChars');
    const totalPartsElem = document.getElementById('totalParts');
    const completedPartsElem = document.getElementById('completedParts');
    const statsContainerElem = document.getElementById('statsContainer');

    if (!inputTextElem || !charLimitElem || !totalCharsElem || !totalPartsElem || !completedPartsElem || !statsContainerElem) return;

    const text = inputTextElem.value;
    const charLimit = parseInt(charLimitElem.value) || 2000;

    totalCharsElem.textContent = text.length;
    const tempParts = splitText(text, charLimit);
    totalPartsElem.textContent = tempParts.length;
    completedPartsElem.textContent = textParts.filter(part => part.processed).length;

    if (text.length > 0) {
        statsContainerElem.classList.remove('hidden');
    } else {
        statsContainerElem.classList.add('hidden');
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
    if (!partsList) return;
    partsList.innerHTML = '';
    textParts.forEach((part, index) => {
        const li = document.createElement('li');
        li.id = `part-${index}`;
        const textSpan = document.createElement('span');
        textSpan.className = 'part-text';
        textSpan.textContent = `${index + 1}. ${part.text.substring(0, 80)}${part.text.length > 80 ? '...' : ''}`;
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'part-buttons';
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Copiar';
        copyBtn.addEventListener('click', (event) => copyPart(index, event));
        const markBtn = document.createElement('button');
        markBtn.textContent = '✅ Concluído';
        markBtn.className = 'success-btn';
        markBtn.addEventListener('click', () => markAsCompleted(index));
        buttonsDiv.appendChild(copyBtn);
        buttonsDiv.appendChild(markBtn);
        li.appendChild(textSpan);
        li.appendChild(buttonsDiv);
        partsList.appendChild(li);
        if (part.processed) li.classList.add('processed');
        if (index === currentPartIndex && !part.processed && isProcessing && !isPaused) {
            li.classList.add('processing');
        }
    });
}

function copyPart(index, event) {
    if (index < 0 || index >= textParts.length) return;
    currentPartIndex = index;
    saveState();
    const partText = textParts[index].text;
    navigator.clipboard.writeText(partText).then(() => {
        if (event && event.target) {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✅ Copiado!';
            btn.style.background = '#28a745';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#17a2b8'; 
            }, 2000);
        }
        document.querySelectorAll('#partsList li').forEach(li => li.classList.remove('processing'));
        const currentLi = document.getElementById(`part-${index}`);
        if (currentLi) currentLi.classList.add('processing');
        updateStatus(`Parte ${index + 1} copiada! Enviando para AI Studio...`);
        pasteTextToAIStudio(partText, index);
    });
}

async function markAsCompleted(index) {
    if (index < 0 || index >= textParts.length || (textParts[index] && textParts[index].processed)) return;

    if (textParts[index]) textParts[index].processed = true;
    
    const li = document.getElementById(`part-${index}`);
    if (li) {
        li.classList.remove('processing');
        li.classList.add('processed');
    }

    updateStats();
    updateProgress();
    saveState();

    const completedCount = textParts.filter(part => part.processed).length;
    if (completedCount === textParts.length) {
        updateStatus('🎉 Todas as partes foram processadas com sucesso!');
        stopProcessing();
    } else if (isProcessing && !isPaused) {
        let nextUnprocessedIndex = -1;
        for (let i = index + 1; i < textParts.length; i++) {
            if (textParts[i] && !textParts[i].processed) {
                nextUnprocessedIndex = i;
                break;
            }
        }
        if (nextUnprocessedIndex === -1) { // Se não encontrar para frente, busca do início (caso alguma anterior tenha sido pulada)
            nextUnprocessedIndex = textParts.findIndex(part => part && !part.processed);
        }
        
        if (nextUnprocessedIndex !== -1) {
            currentPartIndex = nextUnprocessedIndex;
            updateStatus(`Parte ${index + 1} concluída! Processando próxima: Parte ${currentPartIndex + 1}.`);
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            const nextPartItem = document.getElementById(`part-${currentPartIndex}`);
            if (nextPartItem) {
                const nextPartCopyButton = nextPartItem.querySelector('.part-buttons button:first-child');
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
    currentPartIndex = 0; // Sempre começa da primeira parte ao clicar em "Processar Texto"
    isProcessing = true;
    isPaused = false;
    createPartsList();
    showProcessingUI();
    updateStats(); // Atualiza totalChars e totalParts com base nas novas textParts
    updateProgress(); // Reseta a barra de progresso e contadores
    saveState();
    updateStatus(`Texto dividido em ${textParts.length} partes. Iniciando processamento...`);
    
    const firstPartItem = document.getElementById(`part-${currentPartIndex}`);
    if (firstPartItem) {
        const firstPartCopyButton = firstPartItem.querySelector('.part-buttons button:first-child');
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
            const nextPartCopyButton = nextPartItem.querySelector('.part-buttons button:first-child');
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

    if (processBtn) processBtn.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');

    const completedCount = textParts.filter(part => part.processed).length;
    if (textParts.length > 0 && completedCount === textParts.length) {
        updateStatus('🎉 Processamento concluído com sucesso!');
    } else {
        updateStatus('⏹️ Processamento interrompido.');
    }
    saveState();
}

function showProcessingUI() {
    const statusContainer = document.getElementById('statusContainer');
    const partsListContainer = document.getElementById('partsListContainer');
    const processBtn = document.getElementById('processBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resumeBtn = document.getElementById('resumeBtn');

    if (statusContainer) statusContainer.classList.remove('hidden');
    if (partsListContainer) partsListContainer.classList.remove('hidden');
    if (processBtn) processBtn.classList.add('hidden');
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.remove('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
}

function updateStatus(message) {
    const statusTextElem = document.getElementById('statusText');
    if (statusTextElem) statusTextElem.textContent = message;
}

function updateProgress() {
    const completed = textParts.filter(part => part.processed).length;
    const total = textParts.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    const currentPartElem = document.getElementById('currentPart');
    const totalPartsDisplayElem = document.getElementById('totalPartsDisplay');
    const progressBarElem = document.getElementById('progressBar');

    if (currentPartElem) currentPartElem.textContent = completed;
    if (totalPartsDisplayElem) totalPartsDisplayElem.textContent = total;
    if (progressBarElem) progressBarElem.value = percentage;
}

function saveState() {
    const inputTextElem = document.getElementById('inputText');
    const charLimitElem = document.getElementById('charLimit');
    if (!inputTextElem || !charLimitElem) return;

    chrome.storage.local.set({
        inputText: inputTextElem.value,
        charLimit: charLimitElem.value,
        textParts: textParts,
        currentPartIndex: currentPartIndex,
        isProcessing: isProcessing,
        isPaused: isPaused
    });
}

function loadSavedState() {
    chrome.storage.local.get(['inputText', 'charLimit', 'textParts', 'currentPartIndex', 'isProcessing', 'isPaused'], function(result) {
        const inputTextElem = document.getElementById('inputText');
        const charLimitElem = document.getElementById('charLimit');

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
                    if (currentPartIndex < textParts.length && textParts[currentPartIndex] && !textParts[currentPartIndex].processed) {
                        const partItem = document.getElementById(`part-${currentPartIndex}`);
                        if (partItem) {
                            const copyButton = partItem.querySelector('.part-buttons button:first-child');
                            if(copyButton) copyPart(currentPartIndex, { target: copyButton });
                        }
                    } else if (textParts.every(p => p && p.processed)) {
                        stopProcessing(); 
                        updateStatus('🎉 Todas as partes já foram processadas.');
                    } else {
                        let nextAutoProcessIndex = textParts.findIndex((part, i) => part && !part.processed);
                        if(nextAutoProcessIndex !== -1) {
                            currentPartIndex = nextAutoProcessIndex;
                            updateStatus(`▶️ Processamento retomado. Processando Parte ${currentPartIndex + 1}.`);
                            const nextPartToProcessItem = document.getElementById(`part-${currentPartIndex}`);
                            if(nextPartToProcessItem) {
                                const copyButton = nextPartToProcessItem.querySelector('.part-buttons button:first-child');
                                if(copyButton) copyPart(currentPartIndex, { target: copyButton });
                            }
                        } else {
                            stopProcessing();
                            updateStatus('Nenhuma parte pendente para processar.');
                        }
                    }
                }
            } else {
                updateStatus('Estado anterior carregado. Clique em Processar para iniciar.');
                hideElements();
                const processBtnElem = document.getElementById('processBtn');
                if(processBtnElem) processBtnElem.classList.remove('hidden');
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
    const processBtnElem = document.getElementById('processBtn'); // Para reabilitar
    const filenameForThisPart = `audio_parte_${partIndex + 1}.wav`; // Nome de arquivo dinâmico

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0 || tabs[0].id === undefined) {
            updateStatus(`Erro: Nenhuma aba ativa para colar a Parte ${partIndex + 1}.`);
            if(processBtnElem) processBtnElem.disabled = false;
            isProcessing = false;
            return;
        }
        const activeTabId = tabs[0].id;

        if (tabs[0].url && (tabs[0].url.startsWith("https://aistudio.google.com/experiments/generative-ai-studio/sound-generator") || tabs[0].url.startsWith("https://aistudio.google.com/generate-speech"))) {
            chrome.tabs.sendMessage(activeTabId, { 
                action: "pasteText", // Ação que o content.js do usuário espera
                text: textToPaste,
                filename: filenameForThisPart // Passando o nome do arquivo para o content.js
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Popup: Erro ao enviar mensagem para content script:", chrome.runtime.lastError.message);
                    updateStatus(`Erro na Parte ${partIndex + 1}: ${chrome.runtime.lastError.message}.`);
                    isProcessing = false; 
                    if(processBtnElem) processBtnElem.disabled = false;
                    document.getElementById('pauseBtn').classList.add('hidden');
                    document.getElementById('resumeBtn').classList.add('hidden');
                    document.getElementById('stopBtn').classList.add('hidden');
                    if (processBtnElem) processBtnElem.classList.remove('hidden');

                } else if (response && response.success) {
                    updateStatus(`Parte ${partIndex + 1}: ${response.message}`);
                    // O content.js (v.DirectDownloadUserBase - Seletor Textarea Corrigido)
                    // envia de volta { success: true, downloadInitiated: true/false, message: "..." }
                    if (response.downloadInitiated === true) {
                        console.log(`popup.js: Download para Parte ${partIndex + 1} solicitado. Marcando como concluída e avançando...`);
                        markAsCompleted(partIndex); // Chama markAsCompleted para atualizar a UI e tentar a próxima parte.
                    } else {
                        updateStatus(`Falha ao solicitar download para Parte ${partIndex + 1}: ${response.message}`);
                        if(processBtnElem) processBtnElem.disabled = false;
                        isProcessing = false; 
                        // Esconder botões de pausa/parada e mostrar o de iniciar
                        document.getElementById('pauseBtn').classList.add('hidden');
                        document.getElementById('resumeBtn').classList.add('hidden');
                        document.getElementById('stopBtn').classList.add('hidden');
                        if (processBtnElem) processBtnElem.classList.remove('hidden');
                    }
                } else { 
                    updateStatus(`Erro na Parte ${partIndex + 1}: ${response ? response.message : 'Nenhuma resposta do content script.'}`);
                    if(processBtnElem) processBtnElem.disabled = false;
                    isProcessing = false;
                }
            });
        } else {
            updateStatus(`Parte ${partIndex + 1} copiada! Abra a aba correta do Google AI Studio.`);
            if(processBtnElem) processBtnElem.disabled = false;
            isProcessing = false;
        }
    });
}