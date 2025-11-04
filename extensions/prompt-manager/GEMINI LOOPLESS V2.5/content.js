// content.js - Gemini LoopLess 2.5 - Sistema de Integração com o Gemini
console.log("🚀 Gemini LoopLess 2.5: Script de conteúdo carregado");

// Handler atual do site (injetado por *_handler.js)
let currentHandler = null;

// Estado da sequência
let sequencePaused = false;
let sequenceStopped = false;
let currentPromptIndex = 0;
let totalPrompts = 0;
let waitTimeMs = 10000;
let sequenceTimeouts = [];

// Seleciona o handler do site atual (carregado pelos *_handler.js via window.PMHandlers)
function initializeSiteHandler() {
    const PM = window.PMHandlers || {};
    const host = window.location.hostname;
    if (host.includes('gemini.google.com')) {
        currentHandler = PM.gemini || null;
    } else if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) {
        currentHandler = PM.chatgpt || null;
    } else if (host.includes('claude.ai')) {
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

        // Evita ler clipboard no ChatGPT/Claude/Gemini (pode gerar DOMException); prefira innerText
        if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com') || hostname.includes('claude.ai') || hostname.includes('gemini.google.com')) {
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
    console.warn('Gemini LoopLess: Erro ao copiar resposta (fallback para DOM):', error);
        try {
            const t = currentHandler?.getLastResponse?.();
            if (t && typeof t === 'string' && t.trim()) return t.trim();
        } catch {}
        return 'ERRO: Não foi possível copiar a resposta';
    }
}

// Configuração por site (sem funções pesadas; extração fica nos handlers)
const SITE_CONFIG = {
    'chat.openai.com': {
        inputField: 'textarea[data-testid="prompt-textarea"], textarea#prompt-textarea',
        sendButton: 'button[data-testid="send-button"], button[class*="send-button"]',
        stopButton: 'button[aria-label*="Stop"], button[data-testid="stop-button"]',
        responseText: '[data-message-author-role="assistant"], .markdown.prose, .markdown, [class*="markdown"]',
        copyButton: 'button[data-testid="copy-turn-action-button"]'
    },
    'chatgpt.com': {
        inputField: 'textarea[data-testid="prompt-textarea"], textarea#prompt-textarea, div[contenteditable="true"][data-testid*="composer"], div[contenteditable="true"]:not([aria-hidden="true"]), textarea[placeholder*="Message"], div[contenteditable="true"][role="textbox"]',
        sendButton: 'button[data-testid="send-button"], button[class*="send-button"], button[aria-label*="Send"], svg[data-testid="send-button"]',
        stopButton: 'button[aria-label*="Stop"], button[data-testid="stop-button"]',
        responseText: '[data-message-author-role="assistant"], .markdown.prose, .markdown, [class*="markdown"]',
        copyButton: 'button[data-testid="copy-turn-action-button"]'
    },
    'claude.ai': {
        inputField: 'div.ProseMirror[contenteditable="true"]',
        sendButton: 'button[aria-label*="Send"], button[aria-label*="Enviar"]',
        stopButton: 'button[aria-label*="Stop"], button[aria-label*="Parar"], button[title*="Stop"]',
        responseText: '.prose, [data-is-streaming="false"]',
        copyButton: 'button[aria-label*="Copy"]'
    },
    'gemini.google.com': {
        inputField: '.ql-editor[contenteditable="true"], div[contenteditable="true"][data-placeholder*="Envie uma mensagem"], div[contenteditable="true"]:not([aria-hidden="true"])',
        sendButton: 'button[aria-label*="Enviar"], button[mattooltip*="Send"], .send-button-container button, button[data-testid="send-button"], button.send-button',
        stopButton: 'button[aria-label*="Parar"], button[mattooltip*="Stop"], .stop-button, .stop-icon, [class*="stop-icon"], .blue-circle.stop-icon',
        responseText: '.model-response-text, .message-content, [data-testid*="conversation-turn"], .assistant-message',
        copyButton: 'button[mattooltip*="Copiar"], button[aria-label*="Copiar"], button[aria-label*="Copy"]'
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
    toggleButton.title = 'Gemini LoopLess - Clique para abrir/fechar';
    const logoUrl = chrome.runtime.getURL('icons/iconLOGO.png');
    // Preencher todo o botão com a logo
    toggleButton.style.backgroundImage = `url(${logoUrl})`;
    toggleButton.style.backgroundSize = 'cover';
    toggleButton.style.backgroundRepeat = 'no-repeat';
    toggleButton.style.backgroundPosition = 'center';
    toggleButton.style.borderRadius = '0';
    toggleButton.style.boxShadow = 'none';
    toggleButton.style.padding = '0';
        
        // Adicionar ao DOM
        document.body.appendChild(sidebarContainer);
        document.body.appendChild(toggleButton);
        
        // Carregar o conteúdo via fetch mas inserir de forma segura
        const sidebarUrl = chrome.runtime.getURL('sidebar.html');
        const response = await fetch(sidebarUrl);
        const html = await response.text();
        
        // Para Gemini: criar um iframe temporário para parsear o HTML
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        iframe.contentDocument.open();
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();
        
        // Mover os elementos do iframe para o container
        while (iframe.contentDocument.body.firstChild) {
            sidebarContainer.appendChild(
                document.adoptNode(iframe.contentDocument.body.firstChild)
            );
        }
        
        // Remover o iframe
        iframe.remove();
        
        // Adicionar evento do toggle
        toggleButton.addEventListener('click', toggleSidebar);
        
        // Ajusta ícone do cabeçalho
        try {
            const headerIcon = document.getElementById('pm-header-icon');
            if (headerIcon) {
                headerIcon.src = chrome.runtime.getURL('icons/iconLOGO.png');
                headerIcon.width = 18;
                headerIcon.height = 18;
                headerIcon.style.verticalAlign = 'middle';
                headerIcon.style.marginRight = '8px';
            }
        } catch {}

        // Carregar o script
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('sidebar-script.js');
    document.head.appendChild(script);
    // Aguarda carregamento do script para robustez
    await new Promise(resolve => { script.onload = resolve; script.onerror = resolve; });
        
        sidebarInjected = true;
    console.log("Gemini LoopLess: Interface injetada com sucesso");
        
        // Verificar estado salvo
        chrome.storage.local.get(['sidebarOpen'], function(result) {
            if (result.sidebarOpen) {
                setTimeout(openSidebar, 500);
            }
        });
        
    } catch (error) {
    console.error("Gemini LoopLess: Erro ao injetar interface:", error);
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
    console.log('Gemini LoopLess: IA ainda está respondendo...');
        return false;
    }
    
    // Verifica se o campo de entrada está disponível
    const inputField = document.querySelector(currentConfig.inputField);
    if (!inputField || inputField.disabled) {
    console.log('Gemini LoopLess: Campo de entrada não disponível');
        return false;
    }
    
    // Verifica se o botão de enviar está habilitado
    const sendButton = document.querySelector(currentConfig.sendButton);
    if (!sendButton || sendButton.disabled) {
    console.log('Gemini LoopLess: Botão de enviar desabilitado');
        return false;
    }
    
    return true;
}

// (A função copyLastResponse moderna já está definida no topo deste arquivo)

// Aguarda o Gemini terminar de gerar a resposta
function waitForGeminiToFinish() {
    return new Promise((resolve) => {
        console.log('Aguardando Gemini terminar de gerar...');
        
        let previousResponseLength = 0;
        let stableCount = 0;
        const checkInterval = setInterval(() => {
            // Múltiplos seletores para o ícone de stop do Gemini
            const stopElements = document.querySelectorAll('.stop-icon, [class*="stop-icon"], .blue-circle.stop-icon, button[aria-label*="Parar"], button[mattooltip*="Stop"], .stop-button');
            
            // Também verifica se há qualquer indicação de que está gerando
            const isGenerating = document.querySelector('[class*="generating"], [class*="typing"], [aria-label*="Generating"], .generating-indicator, [aria-busy="true"]');
            
            // Verificação adicional: tamanho do texto estável
            let currentLength = 0;
            try {
                const currentText = (typeof getCurrentResponse === 'function') ? getCurrentResponse() : '';
                currentLength = (currentText && typeof currentText === 'string') ? currentText.length : 0;
            } catch (e) {
                currentLength = 0;
            }
            if (currentLength === previousResponseLength) {
                stableCount++;
            } else {
                stableCount = 0;
                previousResponseLength = currentLength;
            }
            
            if (stopElements.length === 0 && !isGenerating && stableCount >= 3) {
                console.log('Gemini terminou de gerar - sem indicadores e texto estável (3 checagens)');
                clearInterval(checkInterval);
                // Aguarda mais um pouco para garantir
                setTimeout(resolve, 1500);
            } else {
                console.log(`Gemini ainda está gerando - ${stopElements.length} stop elements, isGenerating: ${!!isGenerating}, stableCount: ${stableCount}/3, len: ${currentLength}`);
            }
        }, 2000); // Verifica a cada 2000ms (ajustado)
        
        // Timeout de segurança (máximo 120 segundos)
        setTimeout(() => {
            console.log('Timeout atingido - forçando continuação');
            clearInterval(checkInterval);
            resolve();
        }, 120000);
    });
}

// Aguarda o ChatGPT terminar de gerar a resposta
// Função auxiliar para obter resposta atual do site
function getCurrentResponse() {
    const hostname = window.location.hostname;
    
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

function waitForChatGPTToFinish() {
    return new Promise((resolve) => {
        console.log('Aguardando ChatGPT terminar de gerar...');
        
        let lastResponseLength = 0;
        let stableCount = 0;
        
        const checkInterval = setInterval(() => {
            // Primeira verificação: procura pelo botão de stop
            const stopSelectors = [
                'button[data-testid="stop-button"]',
                'button[aria-label*="Stop"]',
                'button[aria-label*="Interromper"]',
                'button[aria-label*="Parar"]',
                'button[title*="Stop"]',
                'button[title*="Parar"]',
                '[data-testid*="stop"]',
                'button:has([data-testid*="stop"])'
            ];
            
            let stopButton = null;
            for (const selector of stopSelectors) {
                try {
                    stopButton = document.querySelector(selector);
                    if (stopButton && stopButton.offsetParent !== null) {
                        console.log(`ChatGPT - Stop button encontrado com seletor: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Ignora erros de seletor inválido
                }
            }
            
            // Segunda verificação: verifica se texto parou de crescer
            const currentResponse = getCurrentResponse();
            const currentLength = currentResponse.length;
            
            if (currentLength === lastResponseLength) {
                stableCount++;
            } else {
                stableCount = 0;
                lastResponseLength = currentLength;
            }
            
            // Terminou se: (1) não há stop button E (2) texto está estável há pelo menos 3 verificações
            if (!stopButton && stableCount >= 3) {
                console.log('ChatGPT terminou de gerar - stop-button ausente e texto estável');
                clearInterval(checkInterval);
                window.lastChatGPTFinishTime = Date.now();
                setTimeout(resolve, 1000);
            } else if (!stopButton) {
                console.log(`ChatGPT - Sem stop button, mas texto ainda mudando (stable: ${stableCount}/3)`);
            } else {
                console.log('ChatGPT ainda está gerando - stop-button presente');
                stableCount = 0; // Reset se ainda há stop button
            }
        }, 1500); // Verifica a cada 1.5 segundos
        
        // Timeout de segurança (máximo 90 segundos)
        setTimeout(() => {
            console.log('Timeout atingido - forçando continuação');
            clearInterval(checkInterval);
            window.lastChatGPTFinishTime = Date.now();
            resolve();
        }, 90000);
    });
}

// Aguarda o Claude terminar de gerar a resposta
function waitForClaudeToFinish() {
    return new Promise((resolve) => {
        console.log('Aguardando Claude terminar de gerar...');
        
        const checkInterval = setInterval(() => {
            // Procura pelo botão de stop do Claude
            const stopButton = document.querySelector('button[aria-label*="Stop"], button[aria-label*="Parar"]');
            
            if (!stopButton) {
                console.log('Claude terminou de gerar - stop-button não encontrado');
                clearInterval(checkInterval);
                // Aguarda mais um pouco para garantir
                setTimeout(resolve, 1000);
            } else {
                console.log('Claude ainda está gerando - stop-button presente');
            }
        }, 500); // Verifica a cada 500ms
        
        // Timeout de segurança (máximo 60 segundos)
        setTimeout(() => {
            console.log('Timeout atingido - forçando continuação');
            clearInterval(checkInterval);
            resolve();
        }, 60000);
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
            
            if (hostname.includes('gemini.google.com')) {
                // Múltiplos seletores para campo de input
                inputField = document.querySelector('.ql-editor[contenteditable="true"], div[contenteditable="true"][data-placeholder*="Envie uma mensagem"], div[contenteditable="true"]:not([aria-hidden="true"])');
                
                // Múltiplos seletores para botão de envio
                sendButton = document.querySelector('button[aria-label*="Send"], button[aria-label*="Enviar"], button[mattooltip*="Send"], .send-button-container button, button[data-testid="send-button"], button.send-button');
                
                // Múltiplos seletores para botão de stop
                const stopButtons = document.querySelectorAll('.stop-icon, [class*="stop-icon"], .blue-circle.stop-icon, button[aria-label*="Parar"], button[mattooltip*="Stop"], .stop-button');
                noStopButton = stopButtons.length === 0;
                
                // Verificação extra de readonly/disabled do campo
                let isContentEditableFalse = false;
                let hasDisabledClass = false;
                if (inputField) {
                    isContentEditableFalse = inputField.getAttribute('contenteditable') === 'false';
                    hasDisabledClass = !!(inputField.classList && inputField.classList.contains('disabled'));
                    if (isContentEditableFalse || hasDisabledClass) {
                        console.log('Gemini - Campo em estado de leitura (readonly/disabled class).');
                    }
                }
                
                console.log(`Gemini - Campo: ${!!inputField}, Envio: ${!!sendButton}, Sem Stop: ${noStopButton}`);
            } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
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
                    if (candidate && isVisible(candidate)) {
                        sendButton = candidate;
                        break;
                    }
                }
                
                // Para ChatGPT, estratégia melhorada de detecção
                const now = Date.now();
                const timeSinceLastCheck = now - (window.lastChatGPTFinishTime || 0);
                
                // Verifica múltiplos seletores para o botão de stop
                const stopSelectors = [
                    'button[data-testid="stop-button"]',
                    'button[aria-label*="Stop"]',
                    'button[aria-label*="Interromper"]',
                    'button[aria-label*="Parar"]',
                    '[data-testid*="stop"]',
                    'svg[data-icon="stop"]',
                    '.stop-icon'
                ];
                
                let foundStopButton = null;
                for (const selector of stopSelectors) {
                    try {
                        const element = document.querySelector(selector);
                        if (element && element.offsetParent !== null) {
                            foundStopButton = element;
                            break;
                        }
                    } catch (e) {
                        // Ignora erro de seletor
                    }
                }
                
                // Estratégia combinada: se passou muito tempo OU se não há stop button
                if (timeSinceLastCheck > 5000 || !foundStopButton) {
                    noStopButton = true;
                    console.log('ChatGPT - Permitindo continuação:', {
                        timeSinceLastCheck,
                        foundStopButton: !!foundStopButton,
                        reason: timeSinceLastCheck > 5000 ? 'timeout' : 'no-stop-button'
                    });
                } else {
                    noStopButton = false;
                    currentStopButton = foundStopButton;
                }
                
                // Log adicional para debug
                console.log('ChatGPT waitForInputReady:', {
                    inputField: !!inputField,
                    sendButton: !!sendButton,
                    foundStopButton: !!foundStopButton,
                    noStopButton,
                    timeSinceLastCheck
                });
            } else if (hostname.includes('claude.ai')) {
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
                
                // Adicione este seletor alternativo para o stop button
                currentStopButton = document.querySelector('button[aria-label*="Stop"], button[aria-label*="Parar"], button[title*="Stop"]');
                noStopButton = !currentStopButton || currentStopButton.style.display === 'none';
            }
            
            // Verifica se tudo está pronto
            const inputReady = !!(inputField && !inputField.hasAttribute('disabled') && (
                !hostname.includes('gemini.google.com') || (
                    inputField.getAttribute('contenteditable') !== 'false' &&
                    !(inputField.classList && inputField.classList.contains('disabled'))
                )
            ));
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
                contenteditableFalse: hostname.includes('gemini.google.com') && inputField ? inputField.getAttribute('contenteditable') === 'false' : 'N/A',
                hasDisabledClass: hostname.includes('gemini.google.com') && inputField ? !!(inputField.classList && inputField.classList.contains('disabled')) : 'N/A',
                buttonDisabled: sendButton ? sendButton.disabled : 'N/A'
            });
            
            if (inputReady && buttonReady && noStopButton) {
                console.log('✅ Campo pronto para envio!');
                clearInterval(checkInterval);
                resolve();
            }
    }, 2000); // Verifica a cada 2 segundos (ajustado)
        
        // Timeout de segurança aumentado (60 segundos)
        setTimeout(() => {
            console.log('⚠️ Timeout - forçando envio mesmo sem confirmar disponibilidade');
            clearInterval(checkInterval);
            resolve();
        }, 60000);
    });
}

// SUBSTITUIÇÃO DAS FUNÇÕES startSequenceCheck() e checkAndProceed()

function startSequenceProcessing(promptsToSend) {
    console.log('Prompt Manager: Iniciando processamento sequencial');
    currentPromptIndex = 0;
    totalPrompts = promptsToSend;
    
    // Começa processando o primeiro
    processNextPrompt();
}

function processNextPrompt() {
    console.log(`Prompt Manager: Processando ${currentPromptIndex + 1}/${totalPrompts}`);
    
    // VERIFICAÇÃO DE SEGURANÇA: Se chegou no limite, para completamente
    if (currentPromptIndex >= totalPrompts) {
        console.log(`🛑 PARADA DE SEGURANÇA: Índice ${currentPromptIndex} >= Total ${totalPrompts} - FINALIZANDO`);
        return;
    }
    
    const hostname = window.location.hostname;
    // Trava global para Gemini: evita sobreposição de prompts
    if (hostname.includes('gemini.google.com')) {
        if (window.geminiProcessing) {
            console.log('Ainda processando prompt anterior...');
            return;
        }
        window.geminiProcessing = true;
    }
    
    // Se não é o primeiro, precisa aguardar o campo estar disponível E clicar enviar
    if (currentPromptIndex > 0) {
        
        if (hostname.includes('gemini.google.com')) {
            // GEMINI: Aguarda campo estar realmente disponível
            waitForInputReady().then(() => {
                const sendResult = clickSendButton();
                if (!sendResult.success) {
                    sendSequenceResponse(false, 'ERRO: Não foi possível enviar o prompt');
                    return;
                }
                // Depois de enviar, aguarda terminar de gerar
                (currentHandler?.waitForFinish ? currentHandler.waitForFinish() : waitForGeminiToFinish()).then(() => {
                    // Delay extra para o Gemini liberar o campo de vez
                    setTimeout(() => continueAfterResponse(), 5000);
                });
            }).catch(error => {
                console.log('Gemini waitForInputReady foi cancelado:', error.message);
                return; // Para a execução
            });
        } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
            // CHATGPT: Aguarda campo estar realmente disponível
            waitForInputReady().then(() => {
                const sendResult = clickSendButton();
                if (!sendResult.success) {
                    sendSequenceResponse(false, 'ERRO: Não foi possível enviar o prompt');
                    return;
                }
                // Depois de enviar, aguarda terminar de gerar
                (currentHandler?.waitForFinish ? currentHandler.waitForFinish() : waitForChatGPTToFinish()).then(() => {
                    continueAfterResponse();
                });
            }).catch(error => {
                console.log('ChatGPT waitForInputReady foi cancelado:', error.message);
                return; // Para a execução
            });
        } else if (hostname.includes('claude.ai')) {
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
            // OUTROS SITES: Método antigo
            const sendResult = clickSendButton();
            if (!sendResult.success) {
                sendSequenceResponse(false, 'ERRO: Não foi possível enviar o prompt');
                return;
            }
            setTimeout(() => {
                continueAfterResponse();
            }, waitTimeMs);
        }
    } else {
        // PRIMEIRO PROMPT: Só aguarda terminar de gerar
        const hostname = window.location.hostname;
        
        if (hostname.includes('gemini.google.com')) {
            (currentHandler?.waitForFinish ? currentHandler.waitForFinish() : waitForGeminiToFinish()).then(() => {
                // Delay extra para o Gemini liberar totalmente
                setTimeout(() => continueAfterResponse(), 5000);
            });
        } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
            (currentHandler?.waitForFinish ? currentHandler.waitForFinish() : waitForChatGPTToFinish()).then(() => {
                continueAfterResponse();
            });
        } else if (hostname.includes('claude.ai')) {
            (currentHandler?.waitForFinish ? currentHandler.waitForFinish() : waitForClaudeToFinish()).then(() => {
                continueAfterResponse();
            });
        } else {
            setTimeout(() => {
                continueAfterResponse();
            }, waitTimeMs);
        }
    }
}

function continueAfterResponse() {
    console.log(`🔄 continueAfterResponse - Prompt ${currentPromptIndex + 1}/${totalPrompts}`);
    // Libera trava de processamento do Gemini
    window.geminiProcessing = false;
    
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
        
    }).catch(error => {
        console.error('❌ Erro na função copyLastResponseAndFinish:', error);
        sendSequenceResponse(false, `ERRO: ${error.message}`);
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
            return;
        }
        
        if (currentPromptIndex < totalPrompts && !sequenceStopped) {
            // Usa o tempo configurado pelo usuário
            console.log(`⏰ Agendando próximo prompt em ${waitTimeMs}ms (configurado pelo usuário)`);
            const timeoutId = setTimeout(processNextPrompt, waitTimeMs);
            sequenceTimeouts.push(timeoutId);
        } else {
            console.log(`🏁 Sequência finalizada ou interrompida - Total: ${totalPrompts}, Atual: ${currentPromptIndex}, Parado: ${sequenceStopped}`);
        }
    }).catch(error => {
        console.error('❌ Erro na função copyAndContinue:', error);
        sendSequenceResponse(false, `ERRO: ${error.message}`);
    });
}

async function copyUsingButton() {
    try {
        const hostname = window.location.hostname;
        
        // Se for Gemini, ChatGPT ou Claude, usa extração direta do DOM
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
        
        // Método original para outros sites
        let selector = '';
        
        if (hostname.includes('claude.ai')) {
            selector = 'button[aria-label*="Copy"]';
        } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
            selector = 'button[data-testid="copy-turn-action-button"]';
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
        // Tratamento especial para Gemini
        if (window.location.hostname.includes('gemini.google.com')) {
            console.log('🔧 Insertando texto no Gemini...');
            
            // Para Gemini, simula digitação real
            textarea.textContent = '';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Aguarda um momento para limpar
            setTimeout(() => {
                // Insere o texto de forma mais robusta
                if (textarea.hasAttribute('contenteditable')) {
                    // Método 1: Usar textContent
                    textarea.textContent = text;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Método 2: Simular digitação se o primeiro falhar
                    if (!textarea.textContent || textarea.textContent !== text) {
                        console.log('🔄 Fallback: simulando digitação caractere por caractere');
                        textarea.textContent = '';
                        for (const char of text) {
                            textarea.textContent += char;
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                    
                    // Método 3: Usar innerHTML como último recurso
                    if (!textarea.textContent || textarea.textContent !== text) {
                        console.log('🔄 Fallback: usando innerHTML');
                        textarea.innerHTML = text;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                } else {
                    // Para campos de input normais
                    textarea.value = text;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                console.log(`✅ Texto inserido no Gemini: ${textarea.textContent?.length || textarea.value?.length || 0} caracteres`);
            }, 100);
            
            return { success: true, message: 'Prompt inserido com sucesso no Gemini.' };
        }
        
        // Código original para outros sites
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
        'button[type="submit"]',
        'button[aria-label*="Submit"]'
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
    waitTimeMs = event.detail.waitTime || 10000;
    
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
    
    // Cancela todos os timeouts pendentes
    sequenceTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    sequenceTimeouts = [];
    
    // Reset das variáveis
    currentPromptIndex = 0;
    totalPrompts = 0;
    // Libera trava do Gemini caso esteja ativa
    window.geminiProcessing = false;
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