// content.js - Prompt Manager 5.0 - Sistema de Integração com IAs
console.log("🚀 Prompt Manager 5.0: Script de conteúdo carregado");

// Handler atual do site (injetado por *_handler.js)
let currentHandler = null;

// Estado da sequência
let sequencePaused = false;
let sequenceStopped = false;
let currentPromptIndex = 0;
let totalPrompts = 0;
let waitTimeMs = 15000;
let sequenceTimeouts = [];
let isSequenceRunning = false; // Nova variável para controlar execuções múltiplas

// Seleciona o handler do site atual (carregado pelos *_handler.js via window.PMHandlers)
function initializeSiteHandler() {
    const PM = window.PMHandlers || {};
    const host = window.location.hostname;
    if (host.includes('claude.ai')) {
        currentHandler = PM.claude || null;
    } else {
        currentHandler = null;
    }
}

initializeSiteHandler();

async function copyLastResponse() {
    if (!currentConfig) return null;

    const hostname = window.location.hostname;
    try {
        // Preferência: usar handler/site-specific sempre
        if (currentHandler && typeof currentHandler.getLastResponse === 'function') {
            console.log(`${hostname} detectado - usando extração direta via handler`);
            const text = currentHandler.getLastResponse();
            if (typeof text === 'string' && text.trim()) {
                console.log(`${hostname} - Texto extraído com sucesso:`, text.substring(0, 100) + '...');
                return text.trim();
            }
            console.log(`${hostname} - Handler não retornou texto, tentando fallback DOM`);
        }

        // Fallback DOM: extrai do último container conhecido
        const selectors = (currentConfig.responseText || '').split(', ').map(s => s.trim()).filter(Boolean);
        let allResponses = [];
        for (const selector of selectors) {
            try {
                const responses = document.querySelectorAll(selector);
                if (responses.length > 0) { allResponses = responses; break; }
            } catch {}
        }
        if (allResponses.length === 0) return 'ERRO: Sem resposta';
        const lastResponse = allResponses[allResponses.length - 1];

        // Evita ler clipboard no Claude (pode gerar DOMException); prefira innerText
        if (hostname.includes('claude.ai')) {
            const txt = (lastResponse.innerText || lastResponse.textContent || '').trim();
            return txt || 'ERRO: Sem resposta';
        }

        // Para outros sites: tenta botão de copiar e leitura do clipboard, com fallback silencioso
        let copyButton = null;
        const copySelectors = (currentConfig.copyButton || '').split(', ').map(s => s.trim()).filter(Boolean);
        for (const copySelector of copySelectors) {
            try {
                copyButton = lastResponse.querySelector(copySelector) || (lastResponse.parentElement && lastResponse.parentElement.querySelector(copySelector));
                if (!copyButton) {
                    const globalButtons = document.querySelectorAll(copySelector);
                    if (globalButtons.length > 0) copyButton = globalButtons[globalButtons.length - 1];
                }
                if (copyButton) break;
            } catch {}
        }

        if (copyButton) {
            try {
                copyButton.click();
                await new Promise(r => setTimeout(r, 1200));
                let text = '';
                try { text = await navigator.clipboard.readText(); } catch {}
                if (typeof text === 'string' && text.trim()) return text.trim();
            } catch (e) {
                console.warn('Falha ao usar botão de copiar: ', e?.message || e);
            }
        }

        // Fallback final: pega só o texto da resposta da IA
        return (lastResponse.innerText || lastResponse.textContent || '').trim();
    } catch (error) {
        console.warn('Prompt Manager: Erro ao copiar resposta (fallback para DOM):', error);
        try {
            const t = currentHandler?.getLastResponse?.();
            if (t && typeof t === 'string' && t.trim()) return t.trim();
        } catch {}
        return 'ERRO: Não foi possível copiar a resposta';
    }
}

// Configuração por site (sem funções pesadas; extração fica nos handlers)
const SITE_CONFIG = {
    'claude.ai': {
        inputField: 'div.ProseMirror[contenteditable="true"]',
        sendButton: 'button[aria-label*="Send"], button[aria-label*="Enviar"], button[data-testid="send-button"], button[type="submit"]:not([disabled]), button:has(svg):not([disabled]), button.send-button, form button:last-of-type:not([disabled])',
        stopButton: 'button[aria-label*="Stop"], button[aria-label*="Parar"], button[title*="Stop"]',
        responseText: '.prose, [data-is-streaming="false"]',
        copyButton: 'button[aria-label*="Copy"]'
    }
};

let sidebarInjected = false;
let sequenceCheckInterval = null;
let currentConfig = SITE_CONFIG[window.location.hostname] || null;

// Injeção da sidebar
async function injectSidebar() {
    if (document.getElementById('promptmanager-sidebar')) return;
    if (sidebarInjected) return;
    
    try {
        // Criar elementos manualmente (sem innerHTML)
        const sidebarContainer = document.createElement('div');
        sidebarContainer.id = 'promptmanager-sidebar';
        
        const toggleButton = document.createElement('button');
        toggleButton.id = 'promptmanager-toggle';
        toggleButton.textContent = '';
        toggleButton.title = 'Claude LoopLess 4.1 - Clique para abrir/fechar';
        
        // Criar elemento IMG para o ícone
        const iconImg = document.createElement('img');
        const iconUrl = chrome.runtime.getURL('icons/iconLOGO.png');
        iconImg.src = iconUrl;
        iconImg.style.width = '48px';
        iconImg.style.height = '48px';
        iconImg.style.objectFit = 'cover';
        iconImg.style.borderRadius = '50%';
        iconImg.style.pointerEvents = 'none';
        iconImg.alt = 'Claude LoopLess';
        
        // Adicionar a imagem ao botão
        toggleButton.appendChild(iconImg);
        
        // Adicionar ao DOM
        document.body.appendChild(sidebarContainer);
        document.body.appendChild(toggleButton);
        
        // Carregar o conteúdo via fetch mas inserir de forma segura
        const sidebarUrl = chrome.runtime.getURL('sidebar.html');
        const response = await fetch(sidebarUrl);
        const html = await response.text();

        // Usar DOMParser para parsear HTML de forma segura
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Mover os elementos do body parseado para o container
        while (doc.body.firstChild) {
            sidebarContainer.appendChild(doc.body.firstChild);
        }
        
        // Adicionar evento do toggle
        toggleButton.addEventListener('click', toggleSidebar);
        
        // Corrigir o src da imagem no header
        setTimeout(() => {
            const headerLogo = document.getElementById('header-logo');
            if (headerLogo) {
                headerLogo.src = chrome.runtime.getURL('icons/iconLOGO.png');
            }
        }, 100);
        
        // Carregar o script
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('sidebar-script.js');
    document.head.appendChild(script);
    // Aguarda carregamento do script para robustez
    await new Promise(resolve => { script.onload = resolve; script.onerror = resolve; });
        
        sidebarInjected = true;
        console.log("Prompt Manager: Interface injetada com sucesso");
        
        // Verificar estado salvo
        chrome.storage.local.get(['sidebarOpen'], function(result) {
            if (result.sidebarOpen) {
                setTimeout(openSidebar, 500);
            }
        });
        
    } catch (error) {
        console.error("Prompt Manager: Erro ao injetar interface:", error);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('promptmanager-sidebar');
    if (!sidebar) return;
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    const sidebar = document.getElementById('promptmanager-sidebar');
    if (!sidebar) return;
    sidebar.classList.add('open');
    const sidebarWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width') || '400px';
    document.body.style.transition = 'width 0.3s ease';
    document.body.style.width = `calc(100% - ${sidebarWidth})`;
    chrome.storage.local.set({ sidebarOpen: true });
}

function closeSidebar() {
    const sidebar = document.getElementById('promptmanager-sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('open');
    document.body.style.width = '100%';
    chrome.storage.local.set({ sidebarOpen: false });
}

// NOVA FUNÇÃO: Verifica se pode enviar
function canSendMessage() {
    if (!currentConfig) return false;
    
    // Verifica se há botão de parar (IA ainda respondendo)
    const stopButton = document.querySelector(currentConfig.stopButton);
    if (stopButton && stopButton.offsetParent !== null) {
        console.log('Prompt Manager: IA ainda está respondendo...');
        return false;
    }
    
    // Verifica se o campo de entrada está disponível
    const inputField = document.querySelector(currentConfig.inputField);
    if (!inputField || inputField.disabled) {
        console.log('Prompt Manager: Campo de entrada não disponível');
        return false;
    }
    
    // Verifica se o botão de enviar está habilitado
    const sendButton = document.querySelector(currentConfig.sendButton);
    if (!sendButton || sendButton.disabled) {
        console.log('Prompt Manager: Botão de enviar desabilitado');
        return false;
    }
    
    return true;
}

// Função auxiliar para obter resposta atual do site
function getCurrentResponse() {
    if (currentHandler && typeof currentHandler.getLastResponse === 'function') {
        try {
            const t = currentHandler.getLastResponse();
            return typeof t === 'string' ? t : '';
        } catch {
            return '';
        }
    }
    return '';
}

// Aguarda o Claude terminar de gerar a resposta - VERSÃO PACIENTE
function waitForClaudeToFinish() {
    return new Promise((resolve) => {
        console.log('⏳ Aguardando Claude terminar COMPLETAMENTE de gerar...');

        let checkCount = 0;
        let lastResponseLength = 0;
        let stableCount = 0;
        const STABLE_REQUIRED = 10; // Requer 10 verificações estáveis (10 segundos)

        const checkInterval = setInterval(() => {
            checkCount++;

            // 1. Verifica se ainda está em streaming
            const streamingElements = document.querySelectorAll('[data-is-streaming="true"]');
            const isStreaming = streamingElements.length > 0;

            // 2. Verifica botão de stop
            const stopSelectors = [
                'button[aria-label*="Stop"]',
                'button[aria-label*="Parar"]',
                'button[title*="Stop"]',
                'button[data-testid*="stop"]'
            ];

            let stopButton = null;
            for (const selector of stopSelectors) {
                try {
                    const element = document.querySelector(selector);
                    if (element && element.offsetParent !== null && isVisible(element)) {
                        stopButton = element;
                        break;
                    }
                } catch (e) {}
            }

            // 3. Verifica se o texto parou de crescer
            const currentResponse = getCurrentResponse();
            const currentLength = currentResponse.length;

            if (currentLength === lastResponseLength && currentLength > 0) {
                stableCount++;
            } else {
                stableCount = 0;
                lastResponseLength = currentLength;
            }

            // Log detalhado a cada verificação
            console.log(`⏳ Claude verificação ${checkCount}: streaming=${isStreaming}, stopBtn=${!!stopButton}, textLen=${currentLength}, stable=${stableCount}/${STABLE_REQUIRED}`);

            // CRITÉRIOS MUITO RIGOROSOS para considerar que terminou:
            // 1. NÃO está em streaming
            // 2. NÃO há botão de stop visível
            // 3. Texto está estável por pelo menos STABLE_REQUIRED verificações
            // 4. Há texto capturado (não está vazio)
            if (!isStreaming && !stopButton && stableCount >= STABLE_REQUIRED && currentLength > 0) {
                console.log('✅ Claude FINALIZOU - Aguardando 5 segundos extras para garantir...');
                clearInterval(checkInterval);
                setTimeout(() => {
                    console.log('✅ Delay de segurança concluído - prosseguindo');
                    resolve();
                }, 5000); // Aguarda 5 segundos extras para GARANTIR
            }
        }, 1000); // Verifica a cada 1 segundo (mais paciente)

        // Timeout de segurança (máximo 180 segundos = 3 minutos)
        setTimeout(() => {
            console.log('⚠️ Timeout de 3 minutos atingido - forçando continuação');
            clearInterval(checkInterval);
            resolve();
        }, 180000);
    });
}

// NOVA FUNÇÃO: Aguarda o campo estar realmente disponível para envio
function waitForInputReady() {
    return new Promise((resolve, reject) => {
        console.log('Verificando se campo está pronto para envio...');
        
        const checkInterval = setInterval(() => {
            // PRIMEIRA COISA: verifica se a sequência foi parada
            if (sequenceStopped) {
                console.log('❌ Sequência foi parada - cancelando waitForInputReady');
                clearInterval(checkInterval);
                reject(new Error('Sequência parada'));
                return;
            }
            
            if (sequencePaused) {
                console.log('⏸️ Sequência pausada - cancelando waitForInputReady');
                clearInterval(checkInterval);
                reject(new Error('Sequência pausada'));
                return;
            }
            
            const hostname = window.location.hostname;
            let inputField, sendButton, noStopButton = true;
            let currentStopButton = null; // Declaração global para a função

            if (hostname.includes('claude.ai')) {
                // Usa os mesmos seletores que funcionaram em findActiveTextArea
                const inputSelectors = (currentConfig?.inputField || '').split(',').map(s => s.trim()).filter(Boolean);
                for (const selector of inputSelectors) {
                    const candidate = document.querySelector(selector);
                    if (candidate && isVisible(candidate)) {
                        inputField = candidate;
                        break;
                    }
                }

                const buttonSelectors = (currentConfig?.sendButton || '').split(',').map(s => s.trim()).filter(Boolean);
                for (const selector of buttonSelectors) {
                    const candidate = document.querySelector(selector);
                    if (candidate && isVisible(candidate) && !candidate.disabled) {
                        sendButton = candidate;
                        break;
                    }
                }

                // Seletor para o stop button
                currentStopButton = document.querySelector('button[aria-label*="Stop"], button[aria-label*="Parar"], button[title*="Stop"]');
                noStopButton = !currentStopButton || currentStopButton.style.display === 'none';
            }

            // Verifica se tudo está pronto
            const inputReady = !!(inputField && !inputField.hasAttribute('disabled'));
            const buttonReady = sendButton && !sendButton.disabled && sendButton.offsetParent !== null;
            
            // Log detalhado para debug
            console.log('⏳ Aguardando campo ficar disponível...', {
                hostname: hostname,
                inputReady: inputReady,
                buttonReady: buttonReady,
                noStopButton: noStopButton,
                inputField: inputField ? 'encontrado' : 'não encontrado',
                sendButton: sendButton ? 'encontrado' : 'não encontrado',
                inputDisabled: inputField ? inputField.hasAttribute('disabled') : 'N/A',
                buttonDisabled: sendButton ? sendButton.disabled : 'N/A'
            });
            
            if (inputReady && buttonReady && noStopButton) {
                console.log('✅ Campo pronto para envio!');
                clearInterval(checkInterval);
                resolve();
            }
    }, 2000); // Verifica a cada 2 segundos (ajustado)
        
        // Timeout de segurança aumentado (90 segundos)
        setTimeout(() => {
            console.log('⚠️ Timeout - forçando envio mesmo sem confirmar disponibilidade');
            clearInterval(checkInterval);
            resolve();
        }, 90000);
    });
}

// SUBSTITUIÇÃO DAS FUNÇÕES startSequenceCheck() e checkAndProceed()

function startSequenceProcessing(promptsToSend) {
    // Verifica se já há uma sequência rodando
    if (isSequenceRunning) {
        console.log('⚠️ Sequência já está em execução - ignorando nova tentativa');
        return;
    }
    
    console.log('Prompt Manager: Iniciando processamento sequencial');
    isSequenceRunning = true;
    currentPromptIndex = 0;
    totalPrompts = promptsToSend;
    sequenceStopped = false;
    sequencePaused = false;
    
    // Começa processando o primeiro
    processNextPrompt();
}

function processNextPrompt() {
    console.log(`Prompt Manager: Processando ${currentPromptIndex + 1}/${totalPrompts}`);
    
    // VERIFICAÇÃO DE SEGURANÇA: Se não há sequência rodando, para
    if (!isSequenceRunning) {
        console.log(`🛑 PARADA DE SEGURANÇA: Não há sequência ativa - FINALIZANDO`);
        return;
    }
    
    // VERIFICAÇÃO DE SEGURANÇA: Se chegou no limite, para completamente
    if (currentPromptIndex >= totalPrompts) {
        console.log(`🛑 PARADA DE SEGURANÇA: Índice ${currentPromptIndex} >= Total ${totalPrompts} - FINALIZANDO`);
        isSequenceRunning = false; // Libera trava
        return;
    }
    
    // Se não é o primeiro, precisa aguardar o campo estar disponível E clicar enviar
    if (currentPromptIndex > 0) {
        // CLAUDE: Aguarda campo estar realmente disponível
        waitForInputReady().then(() => {
            const sendResult = clickSendButton();
            if (!sendResult.success) {
                sendSequenceResponse(false, 'ERRO: Não foi possível enviar o prompt');
                return;
            }
            // Depois de enviar, aguarda terminar de gerar
            (currentHandler?.waitForFinish ? currentHandler.waitForFinish() : waitForClaudeToFinish()).then(() => {
                continueAfterResponse();
            });
        }).catch(error => {
            console.log('Claude waitForInputReady foi cancelado:', error.message);
            return; // Para a execução
        });
    } else {
        // PRIMEIRO PROMPT: Só aguarda terminar de gerar
        (currentHandler?.waitForFinish ? currentHandler.waitForFinish() : waitForClaudeToFinish()).then(() => {
            continueAfterResponse();
        });
    }
}

function continueAfterResponse() {
    console.log(`🔄 continueAfterResponse - Prompt ${currentPromptIndex + 1}/${totalPrompts}`);

    // Verifica se a sequência foi parada
    if (sequenceStopped) {
        console.log('❌ Prompt Manager: Sequência foi interrompida');
        return;
    }
    
    // Se é o último prompt, não continua
    if (currentPromptIndex >= totalPrompts - 1) {
        console.log('🏁 Último prompt - copiando resposta final e finalizando');
        // Copia a última resposta e finaliza
        copyLastResponseAndFinish();
        return; // Para aqui, não agenda próximo prompt
    }
    
    console.log(`⏭️ Não é o último prompt - preparando próximo (${currentPromptIndex + 1})`);
    
    // Se não é o último, inserir o próximo prompt no campo
    const timeoutId = setTimeout(() => {
        if (!sequenceStopped) {
            console.log('📤 Solicitando próximo prompt');
            document.dispatchEvent(new CustomEvent('promptmanager-request-next-prompt'));
        }
    }, 5000);
    sequenceTimeouts.push(timeoutId);
    
    // Copia a resposta e continua
    copyAndContinue();
}

function waitForLastResponse() {
    console.log('Prompt Manager: Aguardando conclusão da última resposta...');
    const config = SITE_CONFIG[window.location.hostname];
    let checkCount = 0;
    
    const checkInterval = setInterval(() => {
        checkCount++;
        
        // Procura botão de parar
        const stopButton = document.querySelector(config.stopButton || 'button[aria-label*="Stop"]');
        
        if (!stopButton || stopButton.offsetParent === null) {
            // Botão sumiu, resposta completa!
            clearInterval(checkInterval);
            setTimeout(() => {
                copyAndContinue();
            }, 1000);
        }
        
        // Timeout de segurança (2 minutos)
        if (checkCount > 120) {
            clearInterval(checkInterval);
            copyAndContinue();
        }
    }, 1000);
}

// Nova função para copiar resposta final sem continuar
function copyLastResponseAndFinish() {
    console.log(`🏁 copyLastResponseAndFinish - Prompt final ${currentPromptIndex + 1}/${totalPrompts}`);
    
    // Verifica se a sequência foi parada
    if (sequenceStopped) {
        console.log('❌ Prompt Manager: Sequência foi interrompida');
        return;
    }
    
    // Copia a resposta final sem agendar próximo
    copyUsingButton().then((success) => {
        console.log(`📋 Resultado da cópia final: ${success ? 'Sucesso' : 'Falha'}`);
        
        if (!success) {
            console.log('🔄 Prompt Manager: Usando método alternativo para resposta final');
            // Fallback: copia direto do DOM
            Promise.resolve(copyLastResponse()).then(text => {
                const safeLen = typeof text === 'string' ? text.length : 0;
                console.log(`📝 Texto final alternativo capturado: ${safeLen} chars`);
                sendSequenceResponse(true, (typeof text === 'string' ? text : '') || 'ERRO: Não foi possível capturar resposta final');
            });
        }
        
        // Finaliza sequência - NÃO incrementa nem agenda próximo
        console.log('🏆 Sequência finalizada com sucesso - último prompt processado');
        isSequenceRunning = false; // Libera trava de execução
        
    }).catch(error => {
        console.error('❌ Erro na função copyLastResponseAndFinish:', error);
        sendSequenceResponse(false, `ERRO: ${error.message}`);
        isSequenceRunning = false; // Libera trava de execução em caso de erro
    });
}

function copyAndContinue() {
    console.log(`📋 copyAndContinue - Prompt ${currentPromptIndex + 1}/${totalPrompts}`);
    
    // Verifica se a sequência foi parada
    if (sequenceStopped) {
        console.log('❌ Prompt Manager: Sequência foi interrompida');
        return;
    }
    
    // Tenta copiar usando o botão
    copyUsingButton().then((success) => {
        console.log(`📋 Resultado da cópia: ${success ? 'Sucesso' : 'Falha'}`);
        
        // Verifica novamente após a cópia
        if (sequenceStopped) {
            console.log('❌ Prompt Manager: Sequência foi interrompida durante cópia');
            return;
        }
        
        if (success) {
            console.log('✅ Prompt Manager: Resposta copiada com sucesso');
        } else {
            console.log('🔄 Prompt Manager: Usando método alternativo de cópia');
            // Fallback: copia direto do DOM
            Promise.resolve(copyLastResponse()).then(text => {
                const safeLen = typeof text === 'string' ? text.length : 0;
                console.log(`📝 Texto alternativo capturado: ${safeLen} chars`);
                sendSequenceResponse(true, (typeof text === 'string' ? text : '') || 'ERRO: Não foi possível capturar resposta');
            });
        }
        
        // Continua para o próximo
        console.log(`⏭️ Incrementando índice: ${currentPromptIndex} -> ${currentPromptIndex + 1}`);
        currentPromptIndex++;
        
        // VERIFICAÇÃO EXTRA: Se após incrementar chegou no limite, para
        if (currentPromptIndex >= totalPrompts) {
            console.log(`🏁 Atingiu limite após incremento - Total: ${totalPrompts}, Atual: ${currentPromptIndex} - FINALIZANDO`);
            isSequenceRunning = false; // Libera trava de execução
            return;
        }
        
        if (currentPromptIndex < totalPrompts && !sequenceStopped) {
            // Usa o tempo configurado pelo usuário
            console.log(`⏰ Agendando próximo prompt em ${waitTimeMs}ms (configurado pelo usuário)`);
            const timeoutId = setTimeout(processNextPrompt, waitTimeMs);
            sequenceTimeouts.push(timeoutId);
        } else {
            console.log(`🏁 Sequência finalizada ou interrompida - Total: ${totalPrompts}, Atual: ${currentPromptIndex}, Parado: ${sequenceStopped}`);
            isSequenceRunning = false; // Libera trava de execução
        }
    }).catch(error => {
        console.error('❌ Erro na função copyAndContinue:', error);
        sendSequenceResponse(false, `ERRO: ${error.message}`);
        isSequenceRunning = false; // Libera trava de execução em caso de erro
    });
}

async function copyUsingButton() {
    try {
        const hostname = window.location.hostname;

        // Se for Claude, usa extração direta do DOM
        if (currentHandler && currentHandler.getLastResponse) {
            console.log(`${hostname} - Usando extração direta na sequência`);

            // Não precisa aguardar mais, pois já aguardamos o stop-icon desaparecer
            const text = currentHandler.getLastResponse();
            if (text && text.trim()) {
                console.log(`${hostname} - Texto extraído com sucesso na sequência`);
                sendSequenceResponse(true, text);
                return true;
            } else {
                console.log(`${hostname} - Nenhum texto encontrado na sequência`);
                sendSequenceResponse(false, `ERRO: Sem resposta do ${hostname}`);
                return false;
            }
        }

        // Método original para Claude
        let selector = '';

        if (hostname.includes('claude.ai')) {
            selector = 'button[aria-label*="Copy"]';
        }

        if (!selector) return false;
        
        // Pega todos os botões de copiar
        const copyButtons = document.querySelectorAll(selector);
        if (copyButtons.length === 0) return false;
        
        const lastButton = copyButtons[copyButtons.length - 1];
        
        // Foca no documento antes de clicar
        window.focus();
        document.body.focus();
        
        lastButton.click();
        
        // Aguarda mais tempo e tenta múltiplas vezes
        let attempts = 0;
        while (attempts < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
                // Tenta focar novamente
                window.focus();
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    sendSequenceResponse(true, text);
                    return true;
                }
            } catch (clipboardError) {
                console.log(`Tentativa ${attempts + 1} falhou:`, clipboardError.message);
            }
            attempts++;
        }
        
        // Se falhar, usa o método alternativo
        const copiedText = await copyLastResponse();
        sendSequenceResponse(true, copiedText);
        return true;
        
    } catch (error) {
        console.error('Erro ao copiar com botão:', error);
        // Fallback final
        const copiedText = await copyLastResponse();
        sendSequenceResponse(true, copiedText || 'ERRO: Não foi possível copiar');
        return false;
    }
}

// Listener para inserir próximo prompt quando solicitado
document.addEventListener('promptmanager-request-next-prompt', () => {
    document.dispatchEvent(new CustomEvent('promptmanager-get-next-prompt'));
});

// Listener para receber e inserir o próximo prompt
document.addEventListener('promptmanager-insert-next-prompt', (event) => {
    const { text } = event.detail;
    insertTextIntoField(text);
});

// Função para enviar resposta de volta
function sendSequenceResponse(success, copiedText) {
    console.log('Prompt Manager: Enviando resposta copiada:', success ? 'Sucesso' : 'Erro');
    const preview = typeof copiedText === 'string' ? (copiedText.substring(0, 100) + '...') : '[non-string]';
    console.log('Dados enviados:', { success, copiedText: preview });
    
    // Garante que sempre enviamos dados válidos
    const responseData = {
        success: Boolean(success),
    copiedText: typeof copiedText === 'string' ? copiedText : ''
    };
    
    document.dispatchEvent(new CustomEvent('promptmanager-sequence-response', {
        detail: responseData
    }));
}

// Utilitários de DOM
function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return el.offsetParent !== null && style.visibility !== 'hidden' && style.display !== 'none';
}

function isInsideSidebar(el) {
    return !!(el && el.closest && el.closest('#promptmanager-sidebar'));
}

// Busca campo de texto ativo
function findActiveTextArea() {
    console.log('🔍 DEBUG findActiveTextArea - hostname:', window.location.hostname);
    console.log('🔍 DEBUG currentConfig:', currentConfig);
    
    // 1) Preferir seletores específicos do site
    const hostSelectors = (currentConfig?.inputField || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const trySelectors = hostSelectors.length ? hostSelectors : [
        // Fallbacks gerais (com filtro para fora da sidebar)
        'textarea#prompt-textarea',
        'textarea[data-testid="prompt-textarea"]',
        '.ql-editor[contenteditable="true"]',
        'div[contenteditable="true"][data-placeholder*="Envie uma mensagem"]',
        'div[contenteditable="true"][data-placeholder*="Send a message"]',
        '.ProseMirror[contenteditable="true"]',
        'textarea[data-testid="chat-input"]',
        'textarea[placeholder*="Message"]',
        '[contenteditable="true"]:not([aria-hidden="true"])',
        'textarea:not([readonly]):not([disabled])',
        'input[type="text"]:not([readonly]):not([disabled])'
    ];

    console.log('🔍 DEBUG Seletores a tentar:', trySelectors);

    for (const selector of trySelectors) {
        let candidates = [];
        try {
            candidates = Array.from(document.querySelectorAll(selector));
        } catch (e) {
            console.log(`🔍 DEBUG Erro com seletor "${selector}":`, e.message);
        }
        
        console.log(`🔍 DEBUG Seletor "${selector}" encontrou ${candidates.length} candidatos`);
        
        const chosen = candidates.find(el => {
            const inSidebar = isInsideSidebar(el);
            const visible = isVisible(el);
            const notDisabled = !el.disabled && !el.readOnly;
            console.log(`🔍 DEBUG Candidato:`, { inSidebar, visible, notDisabled, el });
            return !inSidebar && visible && notDisabled;
        });
        
        if (chosen) {
            console.log(`✅ Campo encontrado com seletor: ${selector}`, chosen);
            return chosen;
        }
    }
    console.log('❌ Nenhum campo de texto encontrado após testar todos os seletores');
    return null;
}

// Insere texto no campo
function insertTextIntoField(text) {
    const textarea = findActiveTextArea();
    if (!textarea) return { success: false, message: 'Campo de texto não encontrado.' };

    textarea.focus();

    try {
        // Código para Claude
        if (textarea.hasAttribute('contenteditable')) {
            textarea.textContent = text;
            // Para campos contenteditable, simula digitação
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: text
            });
            textarea.dispatchEvent(inputEvent);
        } else {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return { success: true, message: 'Prompt inserido com sucesso.' };
    } catch (error) {
        return { success: false, message: 'Erro ao inserir texto.' };
    }
}

// Clica no botão de enviar
function clickSendButton() {
    // 1) Preferir seletores específicos do site
    const hostSelectors = (currentConfig?.sendButton || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const fallbackSelectors = [
        'button[data-testid="send-button"]',
        'button[aria-label*="Send"]',
        'button[aria-label*="Enviar"]',
        'button[aria-label="Send message"]',
        'button[mattooltip*="Send"]',
        '.send-button-container button',
        'button.send-button',
        'button[type="submit"]:not([disabled])',
        'button[aria-label*="Submit"]',
        'button:has(svg):not([disabled])',
        'form button:last-of-type:not([disabled])',
        'button:not([disabled]):has([data-icon])',
        'button:not([disabled])[title*="Send"]'
    ];

    const trySelectors = hostSelectors.length ? hostSelectors : fallbackSelectors;

    for (const selector of trySelectors) {
        let candidates = [];
        try {
            candidates = Array.from(document.querySelectorAll(selector));
        } catch {}
        const button = candidates.find(el => !isInsideSidebar(el) && isVisible(el) && !el.disabled);
        if (button) {
            console.log(`Botão de envio encontrado com seletor: ${selector}`);
            button.click();
            return { success: true, message: 'Prompt enviado!' };
        }
    }

    console.log('❌ Botão de envio não encontrado');
    return { success: false, message: 'Botão de envio não encontrado.' };
}

// Event Listeners
document.addEventListener('promptmanager-insert-text', (event) => {
    const result = insertTextIntoField(event.detail.text);
    document.dispatchEvent(new CustomEvent('promptmanager-insert-response', { detail: result }));
});

document.addEventListener('promptmanager-send-prompt', (event) => {
    const insertResult = insertTextIntoField(event.detail.text);
    if (insertResult.success) {
        setTimeout(() => {
            const sendResult = clickSendButton();
            const finalMessage = sendResult.success ? sendResult.message : 'Prompt inserido, mas não enviado.';
            document.dispatchEvent(new CustomEvent('promptmanager-insert-response', { 
                detail: { ...sendResult, message: finalMessage } 
            }));
        }, 200);
    } else {
        document.dispatchEvent(new CustomEvent('promptmanager-insert-response', { detail: insertResult }));
    }
});

// NOVO: Listener para sequência automática
document.addEventListener('promptmanager-sequence-send', (event) => {
    currentConfig = SITE_CONFIG[window.location.hostname];
    if (!currentConfig) {
        console.error('Prompt Manager: Site não configurado');
        sendSequenceResponse(false, 'ERRO: Site não suportado');
        return;
    }
    
    // Recebe configurações
    const { text, totalCount, waitTime } = event.detail;
    waitTimeMs = event.detail.waitTime || 15000;
    
    const insertResult = insertTextIntoField(text);
    if (insertResult.success) {
        setTimeout(() => {
            const sendResult = clickSendButton();
            if (sendResult.success) {
                // Inicia o processamento sequencial
                startSequenceProcessing(totalCount);
            } else {
                sendSequenceResponse(false, 'ERRO: Falha ao enviar o prompt');
            }
        }, 200);
    } else {
        sendSequenceResponse(false, 'ERRO: Falha ao inserir o prompt');
    }
});

// ===== NOVOS LISTENERS PARA CONTROLE DE SEQUÊNCIA =====

document.addEventListener('promptmanager-pause-sequence', () => {
    console.log('Prompt Manager: Sequência pausada');
    sequencePaused = true;
});

document.addEventListener('promptmanager-resume-sequence', () => {
    console.log('Prompt Manager: Sequência retomada');
    sequencePaused = false;
    // Se estava aguardando, continua o processamento
    if (currentPromptIndex < totalPrompts && !sequenceStopped) {
        const timeoutId = setTimeout(processNextPrompt, waitTimeMs);
        sequenceTimeouts.push(timeoutId);
    }
});

document.addEventListener('promptmanager-stop-sequence', () => {
    console.log('Prompt Manager: Sequência interrompida');
    sequenceStopped = true;
    sequencePaused = false;
    isSequenceRunning = false; // Libera trava de execução
    
    // Cancela todos os timeouts pendentes
    sequenceTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    sequenceTimeouts = [];
    
    // Reset das variáveis
    currentPromptIndex = 0;
    totalPrompts = 0;
});

// Atualizar processNextPrompt para verificar pause/stop
const originalProcessNextPrompt = processNextPrompt;
processNextPrompt = function() {
    // Verifica se foi pausado ou parado
    if (sequencePaused) {
        console.log('Prompt Manager: Processamento pausado');
        return;
    }
    
    if (sequenceStopped) {
        console.log('Prompt Manager: Processamento interrompido');
        sequenceStopped = false; // Reset
        isSequenceRunning = false; // Libera trava
        return;
    }
    
    // Continua com o processamento normal
    originalProcessNextPrompt();
};

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(injectSidebar, 1000));
} else {
    setTimeout(injectSidebar, 1500);
}

const observer_init = new MutationObserver(() => {
    if (!sidebarInjected && document.body) {
        setTimeout(injectSidebar, 2000);
    }
});

if (document.body) {
    observer_init.observe(document.body, { childList: true, subtree: true });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer_init.observe(document.body, { childList: true, subtree: true });
    });
}