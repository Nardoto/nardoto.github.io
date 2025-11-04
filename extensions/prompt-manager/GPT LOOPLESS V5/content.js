// content.js - GPT LoopLess 5.0 - Sistema Exclusivo para ChatGPT
console.log("🚀 GPT LoopLess 5.0: Script de conteúdo carregado");

// Estado da sequência
let sequencePaused = false;
let sequenceStopped = false;
let currentPromptIndex = 0;
let totalPrompts = 0;
let waitTimeMs = 10000;
let sequenceTimeouts = [];
let sequenceActive = false; // evita reinicializar a sequência a cada envio

// Configuração específica para ChatGPT
const CHATGPT_CONFIG = {
    inputField: 'textarea[data-testid="prompt-textarea"], textarea#prompt-textarea, div[contenteditable="true"][data-testid*="composer"], div[contenteditable="true"]:not([aria-hidden="true"]), textarea[placeholder*="Message"], div[contenteditable="true"][role="textbox"]',
    sendButton: 'button[data-testid="send-button"], button[class*="send-button"], button[aria-label*="Send"], svg[data-testid="send-button"]',
    stopButton: 'button[aria-label*="Stop"], button[data-testid="stop-button"]',
    responseText: '[data-message-author-role="assistant"], .markdown.prose, .markdown, [class*="markdown"]',
    copyButton: 'button[data-testid="copy-turn-action-button"]'
};

let sidebarInjected = false;
let currentConfig = CHATGPT_CONFIG;

// Helper: texto significativo (evita enviar mensagens de erro/sentinelas)
function isMeaningfulText(text) {
    if (typeof text !== 'string') return false;
    const t = text.trim();
    if (t.length < 5) return false;
    const lower = t.toLowerCase();
    const blockedPrefixes = [
        'erro:',
        'error:',
        'timeout atingido',
        'intercom not booted',
    ];
    return !blockedPrefixes.some(p => lower.startsWith(p));
}

// Helper: obtém o último container de mensagem do assistente visível
function getLastAssistantContainer() {
    console.log('🔍 Procurando container da última resposta...');
    
    // Múltiplos seletores para cobrir diferentes estruturas do ChatGPT
    const selectors = [
        '[data-message-author-role="assistant"]',
        '[data-testid*="conversation-turn"]:has(.markdown)',
        '.group:has([data-message-author-role="assistant"])',
        'div[class*="message"]:has(.markdown)',
        'article:has(.markdown.prose)'
    ];
    
    let allContainers = [];
    
    for (const selector of selectors) {
        try {
            const nodes = Array.from(document.querySelectorAll(selector));
            if (nodes.length > 0) {
                console.log(`✅ Seletor "${selector}" encontrou ${nodes.length} containers`);
                allContainers = allContainers.concat(nodes);
            }
        } catch (e) {
            console.log(`⚠️ Erro com seletor "${selector}":`, e.message);
        }
    }
    
    // Remove duplicatas e filtra visíveis
    const uniqueContainers = [...new Set(allContainers)];
    const visibles = uniqueContainers.filter(el => el && el.offsetParent !== null);
    
    console.log(`📊 Total de containers únicos: ${uniqueContainers.length}, visíveis: ${visibles.length}`);
    
    // Retorna o último visível ou o último encontrado
    return visibles.length ? visibles[visibles.length - 1] : 
           (uniqueContainers.length ? uniqueContainers[uniqueContainers.length - 1] : null);
}

// Copia a última resposta do assistente como texto plano
function copyLastResponse() {
    try {
        console.log('📋 Iniciando copyLastResponse...');
        
        const container = getLastAssistantContainer();
        if (!container) {
            console.log('❌ Nenhum container de assistente encontrado');
            return '';
        }
        
        console.log('✅ Container encontrado:', container.className || container.tagName);
        
        // Seletores expandidos para elementos de texto
        const textSelectors = [
            '.markdown.prose',
            '.markdown',
            '[class*="markdown"]',
            'div[class*="text"]',
            'div[class*="content"]',
            'p',
            'pre',
            'code'
        ];
        
        let textElement = null;
        
        // Tenta encontrar elemento de texto dentro do container
        for (const selector of textSelectors) {
            const el = container.querySelector(selector);
            if (el && el.textContent && el.textContent.trim().length > 0) {
                textElement = el;
                console.log(`✅ Elemento de texto encontrado com seletor: ${selector}`);
                break;
            }
        }
        
        // Se não encontrou elemento específico, usa o container inteiro
        const target = textElement || container;
        console.log('🎯 Elemento alvo:', target.className || target.tagName);
        
        // Tenta múltiplas formas de extrair texto
        let text = '';
        
        // Método 1: innerText (preserva formatação)
        if (target.innerText) {
            text = target.innerText;
            console.log('📝 Texto extraído via innerText:', text.length, 'chars');
        }
        // Método 2: textContent (fallback)
        else if (target.textContent) {
            text = target.textContent;
            console.log('📝 Texto extraído via textContent:', text.length, 'chars');
        }
        
        // Limpa e valida o texto
        const cleaned = text.trim();
        
        if (cleaned.length === 0) {
            console.log('⚠️ Texto extraído está vazio após limpeza');
            
            // Tentativa final: percorre todos os nós de texto
            const walker = document.createTreeWalker(
                target,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let nodeText = '';
            let node;
            while (node = walker.nextNode()) {
                if (node.nodeValue && node.nodeValue.trim()) {
                    nodeText += node.nodeValue + ' ';
                }
            }
            
            const walkerText = nodeText.trim();
            if (walkerText) {
                console.log('✅ Texto recuperado via TreeWalker:', walkerText.length, 'chars');
                return walkerText;
            }
        }
        
        console.log('✅ Texto final extraído:', cleaned.length, 'chars');
        return cleaned;
        
    } catch (e) {
        console.error('❌ copyLastResponse falhou:', e);
        return '';
    }
}


// Injeção da sidebar
async function injectSidebar() {
    if (document.getElementById('promptmanager-sidebar')) return;
    if (sidebarInjected) return;
    
    try {
        // Criar elementos manualmente
        const sidebarContainer = document.createElement('div');
        sidebarContainer.id = 'promptmanager-sidebar';
        
    const toggleButton = document.createElement('button');
    toggleButton.id = 'promptmanager-toggle';
        // Criar imagem do logo que preenche todo o botão
        const logoImg = document.createElement('img');
        logoImg.src = chrome.runtime.getURL('icons/iconLOGO.png');
        logoImg.style.width = '100%';
        logoImg.style.height = '100%';
        logoImg.style.borderRadius = '50%';
        logoImg.style.objectFit = 'cover';
        toggleButton.appendChild(logoImg);
        
        toggleButton.title = 'GPT LoopLess 5.0 - Clique para abrir/fechar';
        
        // Adicionar ao DOM
        document.body.appendChild(sidebarContainer);
        document.body.appendChild(toggleButton);
        
        // Carregar o conteúdo da sidebar
        const sidebarUrl = chrome.runtime.getURL('sidebar.html');
        const response = await fetch(sidebarUrl);
        const html = await response.text();
        
        // Inserir o HTML de forma segura
        sidebarContainer.innerHTML = html;
        
        // Adicionar evento do toggle
        toggleButton.addEventListener('click', toggleSidebar);
        
        // Carregar o script da sidebar
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('sidebar-script.js');
        document.head.appendChild(script);
        
        // Aguarda carregamento do script
        await new Promise(resolve => { script.onload = resolve; script.onerror = resolve; });
        
        sidebarInjected = true;
        console.log("GPT LoopLess: Interface injetada com sucesso");
        
        // Verificar estado salvo
        chrome.storage.local.get(['sidebarOpen'], function(result) {
            if (result.sidebarOpen) {
                setTimeout(openSidebar, 500);
            }
        });
        
    } catch (error) {
        console.error("GPT LoopLess: Erro ao injetar interface:", error);
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
        console.log('GPT LoopLess: IA ainda está respondendo...');
        return false;
    }
    
    // Verifica se o campo de entrada está disponível
    const inputField = document.querySelector(currentConfig.inputField);
    if (!inputField || inputField.disabled) {
        console.log('GPT LoopLess: Campo de entrada não disponível');
        return false;
    }
    
    // Verifica se o botão de enviar está habilitado
    const sendButton = document.querySelector(currentConfig.sendButton);
    if (!sendButton || sendButton.disabled) {
        console.log('GPT LoopLess: Botão de enviar desabilitado');
        return false;
    }
    
    return true;
}

// (A função copyLastResponse moderna já está definida no topo deste arquivo)

// Aguarda o ChatGPT terminar de gerar a resposta
function waitForChatGPTToFinish() {
    return new Promise((resolve) => {
        console.log('⏳ Aguardando ChatGPT terminar de gerar...');
        
        let lastResponseLength = 0;
        let stableCount = 0;
        let safetyTimeoutId;
        let checkCount = 0;
        
        const checkInterval = setInterval(() => {
            checkCount++;
            console.log(`🔄 Verificação ${checkCount}...`);
            
            // Primeira verificação: procura pelo botão de stop
            const stopSelectors = [
                'button[data-testid="stop-button"]',
                'button[aria-label*="Stop"]',
                'button[aria-label*="Interromper"]',
                'button[aria-label*="Parar"]',
                'button[title*="Stop"]',
                'button[title*="Parar"]',
                '[data-testid*="stop"]',
                'button:has([data-testid*="stop"])',
                // Novos seletores
                'button:has(svg[class*="stop"])',
                'button[class*="stop"]',
                '[role="button"][aria-label*="Stop"]'
            ];
            
            let stopButton = null;
            for (const selector of stopSelectors) {
                try {
                    const buttons = document.querySelectorAll(selector);
                    for (const btn of buttons) {
                        if (btn && btn.offsetParent !== null && !isInsideSidebar(btn)) {
                            stopButton = btn;
                            console.log(`✅ Stop button encontrado com seletor: ${selector}`);
                            break;
                        }
                    }
                    if (stopButton) break;
                } catch (e) {
                    // Ignora erros de seletor inválido
                }
            }
            
            // Segunda verificação: verifica se texto parou de crescer
            const currentResponse = copyLastResponse();
            const currentLength = currentResponse.length;
            
            console.log(`📊 Resposta atual: ${currentLength} chars (anterior: ${lastResponseLength})`);
            
            if (currentLength === lastResponseLength && currentLength > 0) {
                stableCount++;
            } else {
                stableCount = 0;
                lastResponseLength = currentLength;
            }
            
            // Terceira verificação: procura indicadores de carregamento
            const loadingIndicators = [
                '.animate-pulse',
                '[class*="loading"]',
                '[class*="skeleton"]',
                '.cursor-blink',
                '[data-state="loading"]'
            ];
            
            let hasLoadingIndicator = false;
            for (const selector of loadingIndicators) {
                try {
                    const el = document.querySelector(selector);
                    if (el && el.offsetParent !== null) {
                        hasLoadingIndicator = true;
                        console.log(`⏳ Indicador de carregamento encontrado: ${selector}`);
                        break;
                    }
                } catch (e) {}
            }
            
            // Condições de término melhoradas
            const noStopButton = !stopButton;
            const textIsStable = stableCount >= 3;
            const hasContent = currentLength > 10; // Pelo menos 10 caracteres
            const noLoadingIndicator = !hasLoadingIndicator;
            
            if (noStopButton && textIsStable && hasContent && noLoadingIndicator) {
                console.log('✅ ChatGPT terminou de gerar:', {
                    noStopButton,
                    textIsStable,
                    hasContent,
                    noLoadingIndicator,
                    finalLength: currentLength
                });
                clearInterval(checkInterval);
                if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
                window.lastChatGPTFinishTime = Date.now();
                
                // Aguarda um pouco mais para garantir que tudo esteja pronto
                setTimeout(resolve, 2000);
            } else if (noStopButton && currentLength === 0 && checkCount > 5) {
                // Se não há stop button mas também não há texto após 5 verificações
                console.log('⚠️ Sem stop button e sem texto - pode haver um problema');
                clearInterval(checkInterval);
                if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
                resolve();
            } else {
                const status = [];
                if (stopButton) status.push('stop-button presente');
                if (!textIsStable) status.push(`texto mudando (stable: ${stableCount}/3)`);
                if (!hasContent) status.push('sem conteúdo suficiente');
                if (hasLoadingIndicator) status.push('indicador de carregamento');
                
                console.log(`⏳ Ainda gerando: ${status.join(', ')}`);
            }
        }, 2000); // Verifica a cada 2 segundos
        
        // Timeout de segurança (máximo 120 segundos)
        safetyTimeoutId = setTimeout(() => {
            console.log('⏰ Timeout atingido - forçando continuação');
            clearInterval(checkInterval);
            window.lastChatGPTFinishTime = Date.now();
            resolve();
        }, 120000);
    });
}

// Função auxiliar para obter resposta atual do site
function getCurrentResponse() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
        try {
            const last = getLastAssistantContainer();
            if (!last) return '';
            const md = last.querySelector('.markdown.prose, .markdown, [class*="markdown"]');
            const el = md || last;
            const t = el.innerText ?? el.textContent ?? '';
            return typeof t === 'string' ? t : '';
        } catch {
            return '';
        }
    }
    return '';
}

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
            
            if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
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
                const fallbackSelectors = [
                    'button[data-testid="send-button"]',
                    'button[aria-label*="Send"]',
                    'button[aria-label*="Enviar"]',
                    'button[aria-label="Send message"]',
                    'button[class*="send-button"]',
                    'button[type="submit"]:not([aria-hidden="true"])'
                ];
                const allSelectors = [...buttonSelectors, ...fallbackSelectors];
                
                for (const selector of allSelectors) {
                    const candidates = Array.from(document.querySelectorAll(selector) || []);
                    const candidate = candidates.find(el => !isInsideSidebar(el) && isVisible(el));
                    if (candidate) {
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
            }
            
            // Verifica se tudo está pronto
            const inputReady = !!(inputField && !inputField.hasAttribute('disabled') && (
                !hostname.includes('gemini.google.com') || (
                    inputField.getAttribute('contenteditable') !== 'false' &&
                    !(inputField.classList && inputField.classList.contains('disabled'))
                )
            ));
            const buttonReady = sendButton && sendButton.offsetParent !== null;
            
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
    console.log('GPT LoopLess: Iniciando processamento sequencial');
    currentPromptIndex = 0;
    totalPrompts = promptsToSend;
    
    // Começa processando o primeiro
    processNextPrompt();
}

function processNextPrompt() {
    console.log(`GPT LoopLess: Processando ${currentPromptIndex + 1}/${totalPrompts}`);
    
    // VERIFICAÇÃO DE SEGURANÇA: Se chegou no limite, para completamente
    if (currentPromptIndex >= totalPrompts) {
        console.log(`🛑 PARADA DE SEGURANÇA: Índice ${currentPromptIndex} >= Total ${totalPrompts} - FINALIZANDO`);
        return;
    }
    
    // Se não é o primeiro, precisa aguardar o campo estar disponível E clicar enviar
    if (currentPromptIndex > 0) {
        // CHATGPT: Aguarda campo estar realmente disponível
        waitForInputReady().then(() => {
            const sendResult = clickSendButton();
            if (!sendResult.success) {
                sendSequenceResponse(false, 'ERRO: Não foi possível enviar o prompt');
                return;
            }
            // Depois de enviar, aguarda terminar de gerar
            waitForChatGPTToFinish().then(() => {
                continueAfterResponse();
            });
        }).catch(error => {
            console.log('ChatGPT waitForInputReady foi cancelado:', error.message);
            return; // Para a execução
        });
    } else {
        // PRIMEIRO PROMPT: Só aguarda terminar de gerar
        waitForChatGPTToFinish().then(() => {
            continueAfterResponse();
        });
    }
}

function continueAfterResponse() {
    console.log(`🔄 continueAfterResponse - Prompt ${currentPromptIndex + 1}/${totalPrompts}`);
    
    // Verifica se a sequência foi parada
    if (sequenceStopped) {
        console.log('❌ GPT LoopLess: Sequência foi interrompida');
        return;
    }
    
    // Se é o último prompt, não continua
    if (currentPromptIndex >= totalPrompts - 1) {
        console.log('🏁 Último prompt - aguardando resposta final ser gerada');
        // Aguarda a resposta final ser completamente gerada antes de copiar
        waitForChatGPTToFinish().then(() => {
            console.log('✅ Resposta final gerada - copiando e finalizando');
            copyLastResponseAndFinish();
        });
        return; // Para aqui, não agenda próximo prompt
    }
    
    console.log(`⏭️ Não é o último prompt - preparando próximo (${currentPromptIndex + 1})`);
    
    // Copia a resposta primeiro, depois agenda o próximo
    copyAndContinue().then(() => {
        // Após copiar e incrementar o índice, agenda o próximo se ainda não chegou no limite
        if (currentPromptIndex < totalPrompts && !sequenceStopped) {
            console.log('📤 Solicitando próximo prompt após cópia');
            const timeoutId = setTimeout(() => {
                if (!sequenceStopped) {
                    document.dispatchEvent(new CustomEvent('promptmanager-request-next-prompt'));
                }
            }, 5000);
            sequenceTimeouts.push(timeoutId);
        }
    }).catch(error => {
        console.error('❌ Erro durante copyAndContinue:', error);
    });
}

function waitForLastResponse() {
    console.log('GPT LoopLess: Aguardando conclusão da última resposta...');
    const config = CHATGPT_CONFIG;
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
    
    // Copia a resposta final sem agendar próximo
    copyUsingButton().then(async (success) => {
        console.log(`📋 Resultado da cópia final: ${success ? 'Sucesso' : 'Falha'}`);
        if (!success) {
            console.log('🔄 GPT LoopLess: Usando método alternativo para resposta final');
            await waitForChatGPTToFinish();
            const text = await copyLastResponse();
            const safe = typeof text === 'string' ? text : '';
            const ok = isMeaningfulText(safe);
            console.log(`📝 Texto final alternativo capturado: ${safe.length} chars, meaningful=${ok}`);
            sendSequenceResponse(ok, ok ? safe : '');
        }
        // Finaliza sequência - NÃO incrementa nem agenda próximo
        console.log('🏆 Sequência finalizada com sucesso - último prompt processado');
        sequenceActive = false; // libera para próxima execução
    }).catch(error => {
        console.error('❌ Erro na função copyLastResponseAndFinish:', error);
        sendSequenceResponse(false, `ERRO: ${error.message}`);
        sequenceActive = false; // falha também encerra
    });
}

async function copyAndContinue() {
    console.log(`📋 copyAndContinue - Prompt ${currentPromptIndex + 1}/${totalPrompts}`);
    
    // Verifica se a sequência foi parada
    if (sequenceStopped) {
        console.log('❌ GPT LoopLess: Sequência foi interrompida');
        return;
    }
    try {
        const success = await copyUsingButton();
        console.log(`📋 Resultado da cópia: ${success ? 'Sucesso' : 'Falha'}`);
        if (sequenceStopped) {
            console.log('❌ GPT LoopLess: Sequência foi interrompida durante cópia');
            return;
        }
        if (!success) {
            console.log('🔄 GPT LoopLess: Usando método alternativo de cópia');
            await waitForChatGPTToFinish();
            const text = await copyLastResponse();
            const safe = typeof text === 'string' ? text : '';
            const ok = isMeaningfulText(safe);
            console.log(`📝 Texto alternativo capturado: ${safe.length} chars, meaningful=${ok}`);
            sendSequenceResponse(ok, ok ? safe : '');
        }
        // Incrementa o índice - o próximo prompt será agendado por continueAfterResponse()
        console.log(`⏭️ Incrementando índice: ${currentPromptIndex} -> ${currentPromptIndex + 1}`);
        currentPromptIndex++;
        if (currentPromptIndex >= totalPrompts) {
            console.log(`🏁 Atingiu limite após incremento - Total: ${totalPrompts}, Atual: ${currentPromptIndex} - FINALIZANDO`);
            return;
        }
        console.log(`✅ Índice incrementado para ${currentPromptIndex}/${totalPrompts} - próximo será agendado pelo continueAfterResponse()`);
    } catch (error) {
        console.error('❌ Erro na função copyAndContinue:', error);
        sendSequenceResponse(false, `ERRO: ${error.message}`);
    }
}

async function copyUsingButton() {
    try {
        console.log('📋 Iniciando extração de texto...');

        let text = '';
        let lastAttemptText = '';
        
        // Tenta múltiplos métodos de extração
        for (let attempt = 1; attempt <= 6; attempt++) {
            console.log(`🔄 Tentativa ${attempt}/6 de extração`);
            
            if (attempt > 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Método 1: copyLastResponse (melhorado)
            let maybeText = await copyLastResponse();
            
            // Método 2: Se falhou, tenta seletor alternativo direto
            if (!maybeText || maybeText.length < 10) {
                console.log('🔄 Tentando método alternativo de extração...');
                
                const alternativeSelectors = [
                    // Seletores mais específicos primeiro
                    '[data-message-author-role="assistant"]:last-child .markdown',
                    '[data-message-author-role="assistant"]:last-of-type .markdown',
                    '.group:has([data-message-author-role="assistant"]):last-child .markdown',
                    // Seletores mais genéricos
                    '.markdown.prose:last-of-type',
                    '.markdown:last-of-type',
                    '[class*="message"]:last-child [class*="markdown"]',
                    // Seletor por posição
                    'main [class*="markdown"]:last-of-type'
                ];
                
                for (const selector of alternativeSelectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            const lastEl = elements[elements.length - 1];
                            const altText = lastEl.innerText || lastEl.textContent || '';
                            if (altText.trim().length > maybeText.length) {
                                maybeText = altText.trim();
                                console.log(`✅ Texto alternativo encontrado com: ${selector}`);
                                break;
                            }
                        }
                    } catch (e) {
                        console.log(`⚠️ Erro com seletor alternativo ${selector}:`, e.message);
                    }
                }
            }
            
            // Método 3: Se ainda falhou, tenta clipboard API
            if (!maybeText || maybeText.length < 10) {
                console.log('🔄 Tentando ler do clipboard...');
                try {
                    // Procura e clica no botão de copiar
                    const copyButtons = document.querySelectorAll('button[data-testid="copy-turn-action-button"], button[aria-label*="Copy"], button[title*="Copy"]');
                    for (const btn of copyButtons) {
                        if (isVisible(btn) && !btn.disabled) {
                            btn.click();
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // Tenta ler do clipboard
                            try {
                                const clipText = await navigator.clipboard.readText();
                                if (clipText && clipText.length > maybeText.length) {
                                    maybeText = clipText;
                                    console.log('✅ Texto recuperado do clipboard');
                                    break;
                                }
                            } catch (clipErr) {
                                console.log('⚠️ Não foi possível ler clipboard:', clipErr.message);
                            }
                        }
                    }
                } catch (e) {
                    console.log('⚠️ Erro ao tentar copiar via botão:', e.message);
                }
            }
            
            if (typeof maybeText === 'string') {
                const trimmed = maybeText.trim();
                
                // Verifica se o texto mudou desde a última tentativa
                if (trimmed === lastAttemptText && attempt > 2) {
                    console.log('⚠️ Texto não está mudando entre tentativas');
                }
                lastAttemptText = trimmed;
                
                if (isMeaningfulText(trimmed)) {
                    text = trimmed;
                    console.log(`✅ Texto extraído com sucesso na tentativa ${attempt}: ${text.length} chars`);
                    break;
                } else {
                    console.log(`⚠️ Texto não significativo (len=${trimmed.length})`);
                    
                    // Se é a última tentativa, aceita qualquer texto com mais de 5 chars
                    if (attempt === 6 && trimmed.length > 5) {
                        text = trimmed;
                        console.log('⚠️ Aceitando texto mínimo na última tentativa');
                        break;
                    }
                }
            }
        }

        if (text && text.length > 0) {
            console.log(`✅ Texto final extraído: ${text.length} chars`);
            sendSequenceResponse(true, text);
            return true;
        } else {
            console.log('❌ Falha na extração após todas as tentativas');
            sendSequenceResponse(false, 'Não foi possível extrair o texto da resposta');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro ao copiar:', error);
        sendSequenceResponse(false, `Erro: ${error.message}`);
        return false;
    }
}

// Função para enviar resposta de volta
function sendSequenceResponse(success, copiedText) {
    console.log('GPT LoopLess: Enviando resposta copiada:', success ? 'Sucesso' : 'Erro');
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
    console.log('🔍 DEBUG findActiveTextArea - ChatGPT');
    console.log('🔍 DEBUG currentConfig:', currentConfig);
    
    // Usar seletores específicos do ChatGPT
    const chatgptSelectors = (currentConfig?.inputField || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const trySelectors = chatgptSelectors.length ? chatgptSelectors : [
        // Fallbacks específicos para ChatGPT
        'textarea#prompt-textarea',
        'textarea[data-testid="prompt-textarea"]',
        'div[contenteditable="true"][data-testid*="composer"]',
        'div[contenteditable="true"]:not([aria-hidden="true"])',
        'textarea[placeholder*="Message"]',
        'div[contenteditable="true"][role="textbox"]'
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
        // Para ChatGPT, insere o texto diretamente
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
        return { success: true, message: 'Prompt inserido com sucesso no ChatGPT.' };
    } catch (error) {
        return { success: false, message: 'Erro ao inserir texto.' };
    }
}

// Clica no botão de enviar
function clickSendButton() {
    console.log('🔍 Procurando botão de envio...');
    
    // Usar seletores específicos do ChatGPT
    const chatgptSelectors = (currentConfig?.sendButton || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const fallbackSelectors = [
        'button[data-testid="send-button"]',
        'button[aria-label*="Send"]',
        'button[aria-label*="Enviar"]',
        'button[aria-label="Send message"]',
        'button[aria-label="Send prompt"]',
        'button[class*="send-button"]',
        'button[type="submit"]:not([aria-hidden="true"])',
        // Novos seletores
        'svg[data-testid="send-button"]',
        'button:has(svg[data-testid="send-button"])',
        '[role="button"][aria-label*="Send"]',
        'button.absolute.bottom-1\\.5.right-2',
        'button[class*="absolute"][class*="bottom"]',
        // Seletor por posição relativa ao campo de texto
        '#prompt-textarea ~ button',
        '[contenteditable="true"] ~ button'
    ];

    const trySelectors = [...chatgptSelectors, ...fallbackSelectors];
    console.log(`📋 Tentando ${trySelectors.length} seletores...`);

    for (const selector of trySelectors) {
        let candidates = [];
        try {
            candidates = Array.from(document.querySelectorAll(selector));
        } catch (e) {
            console.log(`⚠️ Erro com seletor "${selector}":`, e.message);
            continue;
        }
        
        console.log(`🔍 Seletor "${selector}" encontrou ${candidates.length} candidatos`);
        
        for (const el of candidates) {
            const inSidebar = isInsideSidebar(el);
            const visible = isVisible(el);
            const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true';
            
            console.log(`  📍 Candidato:`, {
                tag: el.tagName,
                class: el.className,
                inSidebar,
                visible,
                disabled,
                ariaLabel: el.getAttribute('aria-label')
            });
            
            if (!inSidebar && visible && !disabled) {
                console.log(`✅ Botão de envio encontrado com seletor: ${selector}`);
                
                // Tenta múltiplas formas de clicar
                try {
                    // Método 1: Click direto
                    el.click();
                } catch (e1) {
                    console.log('⚠️ Click direto falhou, tentando dispatchEvent...');
                    try {
                        // Método 2: Mouse events
                        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    } catch (e2) {
                        console.log('⚠️ dispatchEvent falhou, tentando PointerEvent...');
                        try {
                            // Método 3: Pointer events
                            el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
                            el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
                            el.dispatchEvent(new PointerEvent('click', { bubbles: true }));
                        } catch (e3) {
                            console.error('❌ Todos os métodos de click falharam');
                        }
                    }
                }
                
                return { success: true, message: 'Prompt enviado!' };
            }
        }
    }

    // Última tentativa: procurar por SVG ou ícone dentro de botões
    console.log('🔍 Tentando encontrar botão por ícone SVG...');
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
        if (isInsideSidebar(button) || !isVisible(button) || button.disabled) continue;
        
        // Verifica se tem SVG de envio
        const hasSendIcon = button.querySelector('svg[class*="send"], svg[data-icon="send"], path[d*="M2.01 21L23"]');
        if (hasSendIcon) {
            console.log('✅ Botão encontrado por ícone SVG');
            button.click();
            return { success: true, message: 'Prompt enviado!' };
        }
    }

    console.log('❌ Botão de envio não encontrado após todas as tentativas');
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
    currentConfig = CHATGPT_CONFIG;
    if (!currentConfig) {
        console.error('GPT LoopLess: Site não configurado');
        sendSequenceResponse(false, 'ERRO: Site não suportado');
        return;
    }
    
    // Recebe configurações
    const { text, totalCount, waitTime } = event.detail;
    waitTimeMs = event.detail.waitTime || 10000;
    // Inicializa contadores apenas na primeira chamada
    if (!sequenceActive) {
        sequenceActive = true;
        currentPromptIndex = 0;
        totalPrompts = typeof totalCount === 'number' ? totalCount : totalPrompts;
    }
    
    const insertResult = insertTextIntoField(text);
    if (insertResult.success) {
        setTimeout(() => {
            const sendResult = clickSendButton();
            if (sendResult.success) {
                // Após enviar, aguarda terminar de gerar e dá sequência
                waitForChatGPTToFinish().then(() => {
                    continueAfterResponse();
                });
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
    console.log('GPT LoopLess: Sequência pausada');
    sequencePaused = true;
});

document.addEventListener('promptmanager-resume-sequence', () => {
    console.log('GPT LoopLess: Sequência retomada');
    sequencePaused = false;
    // Se estava aguardando, continua o processamento
    if (currentPromptIndex < totalPrompts && !sequenceStopped) {
        const timeoutId = setTimeout(processNextPrompt, waitTimeMs);
        sequenceTimeouts.push(timeoutId);
    }
});

document.addEventListener('promptmanager-stop-sequence', () => {
    console.log('GPT LoopLess: Sequência interrompida');
    sequenceStopped = true;
    sequencePaused = false;
    
    // Cancela todos os timeouts pendentes
    sequenceTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    sequenceTimeouts = [];
    
    // Reset das variáveis
    currentPromptIndex = 0;
    totalPrompts = 0;
    sequenceActive = false;
});

// Atualizar processNextPrompt para verificar pause/stop
const originalProcessNextPrompt = processNextPrompt;
processNextPrompt = function() {
    // Verifica se foi pausado ou parado
    if (sequencePaused) {
        console.log('GPT LoopLess: Processamento pausado');
        return;
    }
    
    if (sequenceStopped) {
        console.log('GPT LoopLess: Processamento interrompido');
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