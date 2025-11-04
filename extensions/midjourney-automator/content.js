// content.js - Versão Final com Modais de Doação e Instruções

// Função para limpar formatação de texto (remove formatação mas MANTÉM quebras de linha)
function cleanTextFormatting(text) {
    if (!text) return '';
    
    return text
        // Remove TODOS os asteriscos (negrito, itálico, etc.)
        .replace(/\*/g, '')
        // Remove TODOS os underscores
        .replace(/_/g, '')
        // Remove TODOS os tildes
        .replace(/~/g, '')
        // Remove TODOS os backticks
        .replace(/`/g, '')
        // Remove formatação de cabeçalho markdown
        .replace(/^#{1,6}\s+/gm, '')
        // Remove formatação de lista markdown
        .replace(/^[\s]*[-*+]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        // Remove links markdown (mantém apenas o texto)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove imagens markdown (mantém apenas o alt)
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        // Remove formatação de bloco de código
        .replace(/```[\s\S]*?```/g, '')
        // Remove formatação de citação
        .replace(/^>\s+/gm, '')
        // IMPORTANTE: NÃO remove quebras de linha (\n) - mantém prompts separados
        // Remove apenas múltiplos espaços em branco (mantém quebras de linha)
        .replace(/[ \t]+/g, ' ')
        // Remove espaços no início e fim de cada linha (mantém quebras de linha)
        .split('\n').map(line => line.trim()).join('\n')
        // Remove linhas vazias duplicadas (mantém uma quebra de linha entre prompts)
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Remove espaços no início e fim do texto completo
        .trim();
}

// Função para aplicar limpeza automática na textarea
function setupTextareaCleaning() {
    const textarea = document.getElementById('inputText');
    if (!textarea) return;
    
    // Limpa formatação quando cola texto
    textarea.addEventListener('paste', function(e) {
        // Pequeno delay para garantir que o texto foi colado
        setTimeout(() => {
            const currentText = textarea.value;
            const cleanedText = cleanTextFormatting(currentText);
            if (cleanedText !== currentText) {
                // Mostra no console o que foi removido (para debug)
                console.log('Midjourney Automator (Nardoto): Texto limpo automaticamente');
                console.log('Antes:', currentText);
                console.log('Depois:', cleanedText);
                
                textarea.value = cleanedText;
                // Dispara evento de input para notificar mudanças
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 10);
    });
    
    // REMOVIDO: Event listener de input que estava bloqueando o Enter
    // A limpeza de formatação agora acontece apenas no paste, permitindo digitação normal
}

console.log("Midjourney Automator: content.js injetado! - Desenvolvido por Nardoto");

// Sistema de notificações removido - Chrome Web Store gerencia atualizações automaticamente

let songQueue = [];
let isAutomating = false;
let currentAutoIndex = 0;

// --- PARTE 1: LÓGICA DA INTERFACE ---



// Função para verificar se estamos na página do Midjourney
function isMidjourneyPage() {
    // Verificar se estamos na URL do Midjourney
    const url = window.location.href;
    return url.includes('midjourney.com');
}

function initializeUI() {
    console.log("🎯 Midjourney Automator (Nardoto): Tentando inicializar...");
    console.log("🔍 URL atual:", window.location.href);

    // TEMPORÁRIO: Inicializar em qualquer página para debug
    console.log("🎯 Midjourney Automator: Inicializando interface (modo debug)...");
    
    const toggleButton = document.createElement('button');
    toggleButton.id = 'midjourney-automator-toggle';
    toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
    `;
    toggleButton.title = 'Midjourney Automator - Abrir/Fechar';
    document.body.appendChild(toggleButton);
    toggleButton.addEventListener('click', toggleSidebar);

    console.log("📦 Criando container da sidebar...");
    const sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'midjourney-automator-sidebar';
    document.body.appendChild(sidebarContainer);
    console.log("✅ Sidebar container criado e adicionado ao body");

    console.log("📁 Carregando sidebar.html...");
    fetch(chrome.runtime.getURL('sidebar.html'))
        .then(response => {
            console.log("🔄 Response recebida:", response.ok);
            return response.text();
        })
        .then(html => {
            console.log("🖼️ HTML recebido, tamanho:", html.length);
            sidebarContainer.innerHTML = html;
            console.log("✅ Midjourney Automator (Nardoto): Estrutura da Sidebar injetada.");
            console.log("🔍 Sidebar element após injeção:", document.getElementById('midjourney-automator-sidebar'));
            attachSidebarListeners();
            loadSavedState();
            loadSavedDelay();
            
            // REMOVIDO: Chamada dupla que estava causando interferência com outros campos
        }).catch(error => {
            console.error("❌ Midjourney Automator: Erro ao carregar sidebar.html:", error);
        });
    
    try {
        if (chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.get(['sidebarOpen'], function(result) {
                if (chrome.runtime.lastError) {
                    console.warn('Midjourney Automator: Erro ao verificar estado da sidebar:', chrome.runtime.lastError.message);
                    return;
                }
                if (result.sidebarOpen) {
                    openSidebar();
                }
            });
        }
    } catch (error) {
        console.warn('Midjourney Automator: Erro ao verificar estado da sidebar:', error.message);
    }
}

function toggleSidebar() {
    console.log('🔄 Toggle sidebar chamado');
    const sidebar = document.getElementById('midjourney-automator-sidebar');
    console.log('🔍 Sidebar element:', sidebar);
    if (!sidebar) {
        console.error('❌ Sidebar não encontrada!');
        return;
    }
    console.log('📋 Sidebar classes:', sidebar.classList.toString());
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
}

function openSidebar() {
    const sidebar = document.getElementById('midjourney-automator-sidebar');
    if (!sidebar) return;
    sidebar.classList.add('open');
    document.body.classList.add('midjourney-automator-sidebar-open');
    try {
        if (chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.set({ sidebarOpen: true });
        }
    } catch (error) {
        console.warn('Midjourney Automator: Erro ao salvar estado da sidebar:', error.message);
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('midjourney-automator-sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('open');
    document.body.classList.remove('midjourney-automator-sidebar-open');
    try {
        if (chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.set({ sidebarOpen: false });
        }
    } catch (error) {
        console.warn('Midjourney Automator: Erro ao salvar estado da sidebar:', error.message);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUI);
} else {
    initializeUI();
}

// --- PARTE 2: LÓGICA DO CÉREBRO DA SIDEBAR ---

function attachSidebarListeners() {
    const processBtn = document.getElementById('processBtn');
    const songCardList = document.getElementById('song-card-list');
    const autoInsertBtn = document.getElementById('autoInsertBtn');
    const stopAutoBtn = document.getElementById('stopAutoBtn');
    const delayInput = document.getElementById('delayInput');
    // Corrige o seletor: o HTML usa id="clearTextBtn"
    const clearTextBtn = document.getElementById('clearTextBtn');
    const inputText = document.getElementById('inputText');
    // NOVO: Seletores para os botões do rodapé
    const openInstructionsBtn = document.getElementById('openInstructionsModalBtn');
    const openDonationBtn = document.getElementById('openDonationModalBtn');

    if (processBtn) processBtn.addEventListener('click', processAndRenderCards);
    if (songCardList) songCardList.addEventListener('click', handleCardButtonClick);
    if (autoInsertBtn) autoInsertBtn.addEventListener('click', startAutomation);
    if (stopAutoBtn) stopAutoBtn.addEventListener('click', () => {
        isAutomating = false;
        stopAutomation();
        updateStatus('⏹️ Automação cancelada pelo usuário.', true);
    });
    if (delayInput) delayInput.addEventListener('change', saveDelay);
    // Reseta toda a interface ao clicar em "Limpar"
    if (clearTextBtn) clearTextBtn.addEventListener('click', clearAllUI);
    // REMOVIDO: Event listener que selecionava todo o texto ao focar, impedindo digitação normal
    
    // REMOVIDO: Event listeners problemáticos que causavam redirecionamento de foco
    // O textarea já funciona corretamente com Enter por padrão
    
    // NOVO: Listeners para os botões dos modais
    if (openInstructionsBtn) openInstructionsBtn.addEventListener('click', openInstructionsModal);
    if (openDonationBtn) openDonationBtn.addEventListener('click', openDonationModal);
    
    // Configura limpeza automática da textarea
    setupTextareaCleaning();
    
    // REMOVIDO: Função que causava interferência com outros campos
    
    // REMOVIDO: Chamada dupla que estava causando interferência

    // Configurar funcionalidade de localizar e substituir
    setupFindReplaceListeners();
}

// REMOVIDO: Função forceTextareaConfiguration que causava interferência
// O textarea funciona corretamente por padrão sem configurações especiais

// Função para atualizar contadores de progresso
function updateProgressCounters() {
    const totalAnalyzed = document.getElementById('totalAnalyzed');
    const totalSent = document.getElementById('totalSent');
    const remaining = document.getElementById('remaining');
    
    if (!totalAnalyzed || !totalSent || !remaining) return;
    
    const total = songQueue.length;
    const sent = document.querySelectorAll('.song-card.processed').length;
    const faltam = total - sent;
    
    totalAnalyzed.textContent = total;
    totalSent.textContent = sent;
    remaining.textContent = faltam;
    
    console.log(`📊 Progresso: ${sent}/${total} enviados, ${faltam} faltam`);
}


// ===== NOVAS FUNÇÕES PARA OS MODAIS ADICIONADAS AQUI =====
function openInstructionsModal() {
    if (document.getElementById('midjourney-automator-modal-bg')) return;
    const modalHTML = `
        <div id="midjourney-automator-modal-bg">
            <div class="midjourney-automator-modal">
                <h2>❓ Como Usar o Midjourney Automator</h2>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>🆕 VERSÃO 2.0 - Midjourney Edition!</strong><br>
                    Automatiza o envio de prompts para o Midjourney de forma rápida e eficiente!<br>
                    <em>Desenvolvido por <strong>Nardoto</strong></em>
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>1. Formatos Suportados:</strong><br>
                    <strong>Formato Simples:</strong><br>
                    <code>Título da Imagem</code><br>
                    <code>Prompt detalhado da imagem...</code><br><br>

                    <strong>Formato Estruturado:</strong><br>
                    <code>IMAGEM 1</code><br>
                    <code>PROMPT:</code><br>
                    <code>...descrição da imagem...</code><br>
                    <code>TITLE: Título da imagem</code>
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>2. Analise e Liste:</strong> Cole os prompts na caixa e clique em "Analisar e Listar Prompts".
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>3. Gere as Imagens:</strong> Use "Gerar no Midjourney" em cada card, ou "Gerar Todos Automaticamente".
                </p>
                <p style="text-align: left; font-size: 0.8rem; color: #666; margin-top: 10px;">
                    <strong>✨ Recursos da v2.0:</strong><br>
                    • Envio automático de prompts<br>
                    • Detecção automática do campo de input<br>
                    • Suporte a lotes de prompts<br>
                    • Interface intuitiva e responsiva
                </p>
                <button class="modal-close-btn" id="modal-close">Entendido</button>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('modal-close').addEventListener('click', () => document.getElementById('midjourney-automator-modal-bg').remove());
}

function openDonationModal() {
    if (document.getElementById('midjourney-automator-modal-bg')) return;
    const modalHTML = `
        <div id="midjourney-automator-modal-bg">
            <div class="midjourney-automator-modal">
                <h2>Obrigado pelo apoio!</h2>
                <p>Envie um PIX para:</p>
                <p><strong>Tharcisio Bernardo Valli Nardoto</strong></p>
                <p><strong>Chave PIX<br>tharcisionardoto@gmail.com</strong></p>
                <p style="display:flex;align-items:center;justify-content:center;gap:6px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#25D366" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.472-.148-.672.15-.198.297-.772.966-.947 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.607.134-.133.298-.347.447-.52.148-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.074-.148-.672-1.611-.92-2.209-.242-.577-.487-.5-.672-.51l-.573-.01c-.198 0-.52.074-.793.372-.272.297-1.04 1.016-1.04 2.48 0 1.465 1.065 2.87 1.213 3.068.148.198 2.095 3.2 5.076 4.487.71.306 1.262.489 1.694.626.712.227 1.36.195 1.87.118.571-.085 1.758-.718 2.006-1.412.248-.695.248-1.289.173-1.412-.074-.124-.272-.198-.57-.347zm-5.421 7.119h-.001a9.87 9.87 0 0 1-5.031-1.378l-.36-.214-3.741.981 1-3.65-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.638 0 5.122 1.03 6.988 2.898a9.821 9.821 0 0 1 2.893 6.989c-.002 5.451-4.437 9.885-9.892 9.885zm0-18.156c-4.557 0-8.272 3.713-8.272 8.27a8.23 8.23 0 0 0 1.409 4.585l.089.139-.598 2.192 2.251-.592.135.08a8.245 8.245 0 0 0 4.875 1.475h.003c4.556 0 8.271-3.714 8.271-8.272 0-2.214-.861-4.297-2.425-5.86A8.212 8.212 0 0 0 12.05 3.345z"/>
                    </svg>
                    <strong>(27) 99913-2594</strong>
                </p>
                <p>Qualquer valor é bem-vindo.<br>“O sonho é a coisa mais real que existe.”<br>Gratidão 🙏</p>
                <button class="modal-close-btn" id="modal-close">Fechar</button>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('modal-close').addEventListener('click', () => document.getElementById('midjourney-automator-modal-bg').remove());
}
// =======================================================

function processAndRenderCards() {
    const fullText = document.getElementById('inputText').value;
    if (!fullText.trim()) {
        updateStatus("⚠️ Por favor, cole um texto para analisar.", true);
        document.getElementById('inputText').focus();
        return;
    }
    saveState();
    songQueue = parseVideoText(fullText);
    if (songQueue.length === 0) {
        updateStatus("❌ Nenhum prompt encontrado no formato esperado. Verifique o formato do texto.", true);
        return;
    }
    renderSongCards(songQueue);
    updateStatus(`✅ ${songQueue.length} prompts prontos para serem gerados!`, true);
    
    // Atualizar contadores
    updateProgressCounters();
}

function renderSongCards(songs) {
    const songListElement = document.getElementById('song-card-list');
    if (!songListElement) return;
    songListElement.innerHTML = ''; 
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.id = `song-card-${index}`;
        card.innerHTML = `
            <div class="card-title" title="${song.title}">${song.title}</div>
            <div class="card-style" title="${song.prompt}">${song.prompt.substring(0, 100)}${song.prompt.length > 100 ? '...' : ''}</div>
            <button class="insert-btn" data-song-index="${index}" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">Gerar no Midjourney</button>
        `;
        songListElement.appendChild(card);
    });
    const automationContainer = document.getElementById('automationContainer');
    if (automationContainer && songs.length > 0) {
        automationContainer.classList.remove('hidden');
        document.getElementById('totalCount').textContent = songs.length;
    }
}



// Função para gerar delay aleatório entre prompts (mais humano)
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para simular digitacao humana (opcional)
function getTypingDelay() {
    // Simula tempo de "digitacao" humana (0.5s a 2s)
    return getRandomDelay(500, 2000);
}

// Função para pausas de "leitura" (como se o usuário estivesse pensando)
function getReadingDelay() {
    // Simula tempo de "leitura/pensamento" (1s a 4s)
    return getRandomDelay(1000, 4000);
}

async function startAutomation() {
    if (isAutomating || songQueue.length === 0) return;

    isAutomating = true;
    currentAutoIndex = 0;

    // Configurações de delay mais humanas
    const baseDelaySeconds = parseInt(document.getElementById('delayInput').value) || 8;
    const baseDelayMs = baseDelaySeconds * 1000;

    // Range de variação: +/- 50% do tempo base
    const minDelayMs = Math.floor(baseDelayMs * 0.5);
    const maxDelayMs = Math.floor(baseDelayMs * 1.5);

    console.log(`🤖 Delays configurados: Base=${baseDelaySeconds}s, Range=${minDelayMs/1000}s-${maxDelayMs/1000}s`);
    const autoBtn = document.getElementById('autoInsertBtn');
    const stopBtn = document.getElementById('stopAutoBtn');
    const progressInfo = document.getElementById('progressInfo');
    autoBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressInfo.classList.remove('hidden');
    
    // Processar prompts individualmente com comportamento mais humano
    const totalPrompts = songQueue.length;
    const BATCH_SIZE = 6; // A cada 6 prompts, fazer uma pausa maior

    console.log(`🔄 Iniciando processamento de ${totalPrompts} prompts (lotes de ${BATCH_SIZE})`);

    for (let i = 0; i < totalPrompts; i++) {
        if (!isAutomating) break;

        currentAutoIndex = i;
        const song = songQueue[i];
        const card = document.getElementById(`song-card-${i}`);
        const button = card?.querySelector('.insert-btn');

            if (button && !button.disabled) {
                document.getElementById('currentSong').textContent = song.title;
                document.getElementById('progressCount').textContent = i + 1;
                if (card) card.classList.add('processing');
                button.disabled = true;
                button.textContent = 'Enviando...';
                
                // Atualizar contadores durante o processo
                updateProgressCounters();

            // Simular tempo de "leitura" do prompt
            const readingTime = getReadingDelay();
            updateStatus(`📝 Analisando prompt "${song.title}"...`, true);
            await new Promise(resolve => setTimeout(resolve, readingTime));

            // Simular tempo de "digitacao"
            const typingTime = getTypingDelay();
            updateStatus(`⌨️ Digitando prompt...`, true);
            await new Promise(resolve => setTimeout(resolve, typingTime));

            // Enviar o prompt
            updateStatus(`🚀 Enviando prompt...`, true);
            await populateMidjourneyAndCreate(song);

            // Delay entre prompts (mais humano)
            if (i < totalPrompts - 1 && isAutomating) {
                const randomDelay = getRandomDelay(minDelayMs, maxDelayMs);
                const delaySeconds = Math.round(randomDelay / 1000);

                // A cada 6 prompts, fazer uma pausa maior (simula descanso humano)
                if ((i + 1) % BATCH_SIZE === 0 && i < totalPrompts - 1) {
                    const longPause = getRandomDelay(30000, 60000); // 30s a 60s
                    const longPauseSeconds = Math.round(longPause / 1000);

                    updateStatus(`🛋️ Pausa para descanso (${i + 1} prompts enviados) - Aguardando ${longPauseSeconds}s...`, true);
                    console.log(`🛋️ Pausa após ${i + 1} prompts: ${longPauseSeconds}s`);
                    await new Promise(resolve => setTimeout(resolve, longPause));

                    if (!isAutomating) break;
                    updateStatus(`🔄 Retomando envios...`, true);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Pequena pausa adicional
                }

                // Delay normal entre prompts
                updateStatus(`⏳ Aguardando ${delaySeconds}s antes do próximo prompt... (tempo variável)`, true);
                console.log(`⏳ Delay aleatório: ${delaySeconds}s`);
                await new Promise(resolve => setTimeout(resolve, randomDelay));
            }
        }
        if (card) card.classList.remove('processing');
    }
    
    stopAutomation();
    updateStatus(`🎉 Automação concluída! ${currentAutoIndex + 1} prompts enviados com comportamento humanizado!`, true);
}

function stopAutomation() {
    isAutomating = false;
    const autoBtn = document.getElementById('autoInsertBtn');
    const stopBtn = document.getElementById('stopAutoBtn');
    const progressInfo = document.getElementById('progressInfo');
    if (autoBtn) autoBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (progressInfo) progressInfo.classList.add('hidden');
    document.querySelectorAll('.song-card.processing').forEach(card => card.classList.remove('processing'));
}

function handleCardButtonClick(event) {
    if (event.target && event.target.classList.contains('insert-btn')) {
        const button = event.target;
        const songIndex = parseInt(button.dataset.songIndex, 10);
        if (!isNaN(songIndex) && songQueue[songIndex]) {
            const songData = songQueue[songIndex];
            
            // Verificar se é um retry (botão "Enviar Novamente")
            if (button.textContent.includes('Enviar Novamente')) {
                retryPrompt(songIndex);
                return;
            }
            
            // Envio normal
            button.disabled = true;
            button.textContent = 'Enviando...';
            populateMidjourneyAndCreate(songData);
        }
    }
}

// Novo: limpa texto, lista de cards, status, automação e estado salvo
function clearAllUI() {
    try {
        // 1) Texto
        const inputText = document.getElementById('inputText');
        if (inputText) {
            inputText.value = '';
        }

        // 2) Lista de músicas
        const songListElement = document.getElementById('song-card-list');
        if (songListElement) songListElement.innerHTML = '';

        // 3) Containers de automação e progresso
        const automationContainer = document.getElementById('automationContainer');
        const progressInfo = document.getElementById('progressInfo');
        const autoBtn = document.getElementById('autoInsertBtn');
        const stopBtn = document.getElementById('stopAutoBtn');
        const currentSong = document.getElementById('currentSong');
        const progressCount = document.getElementById('progressCount');
        const totalCount = document.getElementById('totalCount');

        if (isAutomating) stopAutomation();
        if (automationContainer) automationContainer.classList.add('hidden');
        if (progressInfo) progressInfo.classList.add('hidden');
        if (autoBtn) autoBtn.classList.remove('hidden');
        if (stopBtn) stopBtn.classList.add('hidden');
        if (currentSong) currentSong.textContent = '-';
        if (progressCount) progressCount.textContent = '0';
        if (totalCount) totalCount.textContent = '0';
        
        // Limpar informações dos prompts
        const currentPrompt = document.getElementById('currentPrompt');
        const totalPrompts = document.getElementById('totalPrompts');
        if (currentPrompt) currentPrompt.textContent = '-';
        if (totalPrompts) totalPrompts.textContent = '-';

        // 4) Status
        const statusContainer = document.getElementById('statusContainer');
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.textContent = 'Aguardando...';
        if (statusContainer) statusContainer.classList.add('hidden');

        // 5) Estado interno e persistência
        songQueue = [];
        isAutomating = false;
        
        // 6) Resetar contadores
        updateProgressCounters();
        try {
            if (chrome.runtime && chrome.runtime.id) {
                chrome.storage.local.set({ midjourneyAutomator_savedText: '' });
            }
        } catch (error) {
            console.warn('VEO3 Automator: Erro ao limpar estado persistente:', error.message);
        }

        console.log('Midjourney Automator: Interface limpa com sucesso.');
    } catch (e) {
        console.warn('Midjourney Automator: falha ao limpar a interface:', e);
    }
}

function parseVideoText(rawText) {
    const videos = [];
    
    // NOVO: Reconhece formato "Scene X — Título" com prompts VEO3
    const sceneBlocks = rawText.split(/(?=Scene \d+\s*—)/i).filter(block => block.trim() !== '');
    
    if (sceneBlocks.length > 1) {
        for (const block of sceneBlocks) {
            const sceneMatch = block.match(/Scene\s+(\d+)\s*—\s*(.+?)(?:\s*\([^)]*\))?\s*\n([\s\S]*)/i);
            if (sceneMatch) {
                const sceneNumber = sceneMatch[1];
                const sceneTitle = sceneMatch[2].trim();
                const content = sceneMatch[3];
                
                // Procura pelo prompt VEO3 no conteúdo e captura até o final do bloco
                const veoPromptMatch = content.match(/Veo\s*3\s*Prompt[^:]*:\s*\n([\s\S]*?)(?=(?:\n\s*Scene \d+\s*—|\n\s*$|$))/i);
                if (veoPromptMatch) {
                    const prompt = veoPromptMatch[1].trim();
                    videos.push({
                        title: `Scene ${sceneNumber} — ${sceneTitle}`,
                        prompt: prompt
                    });
                }
            }
        }
        
        // Se encontrou cenas, retorna
        if (videos.length > 0) {
            return videos;
        }
    }
    
    // Tenta dividir por quebra de linha dupla (parágrafo + enter + novo parágrafo)
    const paragraphs = rawText.split(/\n\s*\n/).filter(block => block.trim() !== '');
    
    // Se encontrou múltiplos parágrafos separados por quebra dupla
    if (paragraphs.length > 1) {
        for (const paragraph of paragraphs) {
            const lines = paragraph.trim().split('\n');
            if (lines.length >= 2) {
                // Primeira linha é o título, restante é o prompt
                const title = lines[0].trim();
                const prompt = lines.slice(1).join('\n').trim();
                if (title && prompt) {
                    videos.push({
                        title: title,
                        prompt: prompt
                    });
                }
            } else if (lines.length === 1 && lines[0].trim()) {
                // Se só tem uma linha, usa ela como título e prompt
                const content = lines[0].trim();
                videos.push({
                    title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    prompt: content
                });
            }
        }
        
        // Se encontrou vídeos pelo método de quebra dupla, retorna
        if (videos.length > 0) {
            return videos;
        }
    }
    
    // Fallback: mantém a lógica antiga para compatibilidade
    // Suporta tanto o formato antigo (LETRA) quanto novos formatos para vídeo
    const videoBlocks = rawText.split(/(?:LETRA \d+|VIDEO \d+|PROMPT \d+)\s*\n/i).filter(block => block.trim() !== '');
    
    for (const block of videoBlocks) {
        // Formato original (músicas convertidas para vídeo)
        let match = block.match(/LYRICS:\s*\n(?<lyrics>[\s\S]*?)\s*STYLES:\s*(?<style>.*?)\s*Song Title:\s*(?<title>.*)/i);
        if (match && match.groups) {
            videos.push({
                title: match.groups.title.trim(),
                prompt: `Create a music video with the following style: ${match.groups.style.trim()}\n\nLyrics:\n${match.groups.lyrics.trim()}`
            });
            continue;
        }
        
        // Novo formato específico para vídeos
        match = block.match(/PROMPT:\s*\n(?<prompt>[\s\S]*?)\s*TITLE:\s*(?<title>.*)/i);
        if (match && match.groups) {
            videos.push({
                title: match.groups.title.trim(),
                prompt: match.groups.prompt.trim()
            });
            continue;
        }
        
        // Formato simples: título seguido de prompt
        match = block.match(/^([^\n]+)\s*\n([\s\S]+)$/);
        if (match) {
            videos.push({
                title: match[1].trim(),
                prompt: match[2].trim()
            });
        }
    }
    return videos;
}

async function populateMidjourneyAndCreate(promptData) {
    try {
        // Verificar se estamos na página do Midjourney - se não estiver, não executar
        if (!isMidjourneyPage()) {
            console.log("🎯 Midjourney Automator: Não é página do Midjourney, automação não será executada");
            return;
        }

        console.log("=== 🤖 INICIANDO AUTOMAÇÃO MIDJOURNEY ===");
        const textArea = document.querySelector('#desktop_input_bar');

        if (!textArea) {
            throw new Error("Campo de texto do Midjourney não encontrado");
        }

        // Combina título e prompt em um texto único
        const fullPrompt = `${promptData.prompt}`;
        console.log("📝 Preenchendo campo com:", fullPrompt);

        // Guardar o valor original para verificação
        const originalValue = textArea.value;

        await fillField(textArea, fullPrompt);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Procurar pelo botão de envio do Midjourney
        const submitButton = document.querySelector('svg[viewBox="0 0 24 24"][height="24"][width="24"]');

        let submissionSuccess = false;

        // Tentar enviar via botão SVG
        if (submitButton && submitButton.closest('button, [role="button"]')) {
            const button = submitButton.closest('button, [role="button"]');
            console.log("🔘 Tentando enviar via botão SVG:", button);
            try {
                button.click();
                submissionSuccess = true;
                console.log("✅ Envio via botão bem-sucedido");
            } catch (error) {
                console.warn("⚠️ Falha no clique do botão:", error);
            }
        }

        // Se o botão não foi encontrado, tentar simular Enter
        if (!submissionSuccess) {
            console.log("⌨️ Tentando enviar via tecla Enter");
            try {
                // Simular pressionar Enter
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                textArea.dispatchEvent(enterEvent);

                // Também simular keypress e keyup
                const keypressEvent = new KeyboardEvent('keypress', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                textArea.dispatchEvent(keypressEvent);

                const keyupEvent = new KeyboardEvent('keyup', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                textArea.dispatchEvent(keyupEvent);

                submissionSuccess = true;
                console.log("✅ Envio via Enter bem-sucedido");
            } catch (error) {
                console.warn("⚠️ Falha no envio via Enter:", error);
            }
        }

        // Verificar se o envio foi realmente bem-sucedido
        if (submissionSuccess) {
            const isSuccess = await checkSubmissionSuccess(textArea, fullPrompt);
            if (isSuccess) {
                handleAutomationResponse({ success: true, title: promptData.title });
                return;
            } else {
                console.warn("⚠️ Envio não confirmado, tentando novamente...");
                // Tentar novamente com Enter
                await new Promise(resolve => setTimeout(resolve, 1000));
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                textArea.dispatchEvent(enterEvent);

                // Verificar novamente
                await new Promise(resolve => setTimeout(resolve, 2000));
                const finalCheck = await checkSubmissionSuccess(textArea, fullPrompt);
                if (finalCheck) {
                    handleAutomationResponse({ success: true, title: promptData.title });
                    return;
                }
            }
        }

        // Última tentativa: envio direto via Enter
        console.log("🔄 Tentando envio direto como última opção...");
        const directSuccess = await tryDirectSubmission(textArea);
        if (directSuccess) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const finalDirectCheck = await checkSubmissionSuccess(textArea, fullPrompt);
            if (finalDirectCheck) {
                handleAutomationResponse({ success: true, title: promptData.title });
                return;
            }
        }

        throw new Error("Todas as estratégias de envio falharam");

    } catch (error) {
        console.error("❌ Erro na automação Midjourney:", error);
        handleAutomationResponse({ success: false, error: error.message, title: promptData.title });
    }
}

async function fillField(element, value) {
    if (!element) throw new Error("Elemento não fornecido");
    
    console.log("🔧 Preenchendo campo:", element);
    
    // Focar no elemento
    element.focus();
    element.click();
    
    // Limpar o campo
    element.value = '';
    
    // Aguardar um pouco
    await new Promise(r => setTimeout(r, 100));
    
    // Definir o valor
    element.value = value;
    
    // Disparar todos os eventos necessários para simular digitação real
    const events = [
        new Event('input', { bubbles: true, cancelable: true }),
        new Event('change', { bubbles: true, cancelable: true }),
        new Event('keydown', { bubbles: true, cancelable: true }),
        new Event('keypress', { bubbles: true, cancelable: true }),
        new Event('keyup', { bubbles: true, cancelable: true }),
        new Event('compositionstart', { bubbles: true, cancelable: true }),
        new Event('compositionend', { bubbles: true, cancelable: true })
    ];
    
    // Disparar eventos sequencialmente
    for (const event of events) {
        element.dispatchEvent(event);
        await new Promise(r => setTimeout(r, 10)); // Pequena pausa entre eventos
    }
    
    // Aguardar um pouco mais
    await new Promise(r => setTimeout(r, 200));
    
    // Remover foco
    element.blur();
    
    console.log("✅ Campo preenchido com sucesso");
}

// Função auxiliar para encontrar botões de envio
function findSubmitButton() {
    const selectors = [
        // Seletores específicos do VEO3
        'i.sc-95c4f607-0.grsLJu.google-symbols',
        '[data-testid="submit-button"]',
        '[data-testid="create-button"]',
        
        // Seletores genéricos de botões de envio
        'button[type="submit"]',
        'input[type="submit"]',
        'button.submit',
        'button.create',
        'button.send',
        
        // Procurar por ícones comuns
        'button i.material-icons',
        'button i.fas',
        'button i.far',
        'button svg',
        
        // Procurar por classes que podem indicar botão de envio
        '.submit-btn',
        '.create-btn',
        '.send-btn',
        '.action-button',
        '.primary-button'
    ];
    
    for (const selector of selectors) {
        try {
            const button = document.querySelector(selector);
            if (button && button.offsetParent !== null) { // Verifica se está visível
                console.log(`🔍 Botão encontrado com seletor: ${selector}`, button);
                return button;
            }
        } catch (error) {
            // Ignora seletores inválidos
            continue;
        }
    }
    
    // Se não encontrar com seletores específicos, procurar por botões visíveis
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
        if (button.offsetParent !== null && 
            (button.textContent.toLowerCase().includes('enviar') ||
             button.textContent.toLowerCase().includes('submit') ||
             button.textContent.toLowerCase().includes('create') ||
             button.textContent.toLowerCase().includes('send') ||
             button.textContent.toLowerCase().includes('gerar'))) {
            console.log("🔍 Botão encontrado com texto:", button);
            return button;
        }
    }
    
    console.warn("⚠️ Nenhum botão de envio encontrado");
    return null;
}



// Função para verificar se o envio foi bem-sucedido
async function checkSubmissionSuccess(textArea, originalValue) {
    console.log("🔍 Verificando se o envio foi bem-sucedido...");
    console.log("📝 Valor atual da textarea:", textArea.value);
    console.log("📝 Valor original:", originalValue);
    
    // Aguardar um pouco para que a página possa processar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se o campo foi limpo (indicando que foi enviado)
    if (textArea.value !== originalValue) {
        console.log("✅ Campo foi limpo - envio provavelmente bem-sucedido");
        return true;
    }
    
    // Verificar se apareceu alguma mensagem de sucesso
    const successIndicators = [
        'success',
        'sucesso',
        'created',
        'criado',
        'generated',
        'gerado',
        'processing',
        'processando'
    ];
    
    for (const indicator of successIndicators) {
        const elements = document.querySelectorAll(`[class*="${indicator}"], [id*="${indicator}"], [data-testid*="${indicator}"]`);
        for (const element of elements) {
            if (element.offsetParent !== null && element.textContent.toLowerCase().includes(indicator)) {
                console.log(`✅ Indicador de sucesso encontrado: ${indicator}`, element);
                return true;
            }
        }
    }
    
    // Verificar se o botão mudou de estado
    const submitButton = findSubmitButton();
    if (submitButton && (submitButton.disabled || submitButton.textContent.toLowerCase().includes('processando') || submitButton.textContent.toLowerCase().includes('processing'))) {
        console.log("✅ Botão mudou de estado - envio em andamento");
        return true;
    }
    
    console.log("⚠️ Não foi possível confirmar o sucesso do envio");
    return false;
}

// Função para tentar envio direto via Enter na textarea
async function tryDirectSubmission(textArea) {
    console.log("🎯 Tentando envio direto via Enter...");
    
    try {
        // Focar na textarea
        textArea.focus();
        
        // Simular pressionar Enter com todos os eventos necessários
        const events = [
            new KeyboardEvent('keydown', { 
                key: 'Enter', 
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true, 
                cancelable: true 
            }),
            new KeyboardEvent('keypress', { 
                key: 'Enter', 
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true, 
                cancelable: true 
            }),
            new KeyboardEvent('keyup', { 
                key: 'Enter', 
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true, 
                cancelable: true 
            })
        ];
        
        for (const event of events) {
            textArea.dispatchEvent(event);
            await new Promise(r => setTimeout(r, 50));
        }
        
        console.log("✅ Eventos de Enter disparados com sucesso");
        return true;
    } catch (error) {
        console.error("❌ Erro no envio direto:", error);
        return false;
    }
}

function handleAutomationResponse(response) {
    const processedSongIndex = songQueue.findIndex(song => song.title === response.title);
    if (processedSongIndex === -1) return;
    const card = document.getElementById(`song-card-${processedSongIndex}`);
    const button = card ? card.querySelector('.insert-btn') : null;
    
    if (response.success) {
        updateStatus(`✅ "${response.title}" foi processado com sucesso!`, true);
        if (card) card.classList.add('processed');
        if (button) {
            button.textContent = '✅ Sucesso';
            button.disabled = true;
            button.style.background = '#4CAF50';
        }
        // Atualizar contadores após sucesso
        updateProgressCounters();
    } else {
        updateStatus(`❌ Erro ao processar "${response.title}": ${response.error}`, true);
        if (button) {
            button.disabled = false;
            button.textContent = '🔄 Enviar Novamente';
            button.style.background = '#FF9800';
            button.title = 'Clique para tentar enviar novamente';
            
            // Adicionar event listener para retry se não existir
            if (!button.hasAttribute('data-retry-listener')) {
                button.addEventListener('click', () => {
                    retryPrompt(processedSongIndex);
                });
                button.setAttribute('data-retry-listener', 'true');
            }
        }
    }
}

// Função para tentar enviar novamente um prompt que falhou
async function retryPrompt(promptIndex) {
    if (promptIndex < 0 || promptIndex >= songQueue.length) {
        console.error('❌ Índice de prompt inválido para retry:', promptIndex);
        return;
    }
    
    const song = songQueue[promptIndex];
    const card = document.getElementById(`song-card-${promptIndex}`);
    const button = card ? card.querySelector('.insert-btn') : null;
    
    if (!song || !card || !button) {
        console.error('❌ Elementos não encontrados para retry do prompt:', promptIndex);
        return;
    }
    
    console.log(`🔄 Tentando enviar novamente o prompt ${promptIndex}: "${song.title}"`);
    
    // Atualizar interface para mostrar que está tentando novamente
    if (card) card.classList.add('processing');
    if (button) {
        button.disabled = true;
        button.textContent = '🔄 Enviando...';
        button.style.background = '#2196F3';
    }
    
    updateStatus(`🔄 Tentando enviar novamente: "${song.title}"`, true);
    
    try {
        // Tentar enviar o prompt novamente
        await populateVEO3AndCreate(song);
        
        // Se chegou até aqui sem erro, considerar sucesso
        handleAutomationResponse({ success: true, title: song.title });
        
    } catch (error) {
        console.error(`❌ Erro no retry do prompt ${promptIndex}:`, error);
        handleAutomationResponse({ 
            success: false, 
            error: error.message, 
            title: song.title 
        });
    } finally {
        // Remover classe de processamento
        if (card) card.classList.remove('processing');
    }
}

function saveState() {
    try {
        if (!chrome.runtime || !chrome.runtime.id) {
            console.warn('VEO3 Automator: Contexto da extensão invalidado, não é possível salvar estado.');
            return;
        }
        const textToSave = document.getElementById('inputText').value;
        chrome.storage.local.set({ midjourneyAutomator_savedText: textToSave });
    } catch (error) {
        console.warn('VEO3 Automator: Erro ao salvar estado:', error.message);
    }
}

function loadSavedState() {
    try {
        if (!chrome.runtime || !chrome.runtime.id) {
            console.warn('VEO3 Automator: Contexto da extensão invalidado, não é possível carregar estado.');
            return;
        }
        chrome.storage.local.get(['midjourneyAutomator_savedText'], function(result) {
            if (chrome.runtime.lastError) {
                console.warn('VEO3 Automator: Erro ao carregar estado:', chrome.runtime.lastError.message);
                return;
            }
            if (result.midjourneyAutomator_savedText) {
                const inputText = document.getElementById('inputText');
                if (inputText) {
                    inputText.value = result.midjourneyAutomator_savedText;
                    if (result.midjourneyAutomator_savedText.trim()) {
                        updateStatus("💾 Texto anterior restaurado. Clique em 'Analisar' para continuar.", true);
                    }
                }
            }
        });
    } catch (error) {
        console.warn('VEO3 Automator: Erro ao carregar estado:', error.message);
    }
}

function saveDelay() {
    try {
        if (!chrome.runtime || !chrome.runtime.id) {
            console.warn('VEO3 Automator: Contexto da extensão invalidado, não é possível salvar delay.');
            return;
        }
        const delay = document.getElementById('delayInput').value;
        chrome.storage.local.set({ midjourneyAutomator_delay: delay });
    } catch (error) {
        console.warn('VEO3 Automator: Erro ao salvar delay:', error.message);
    }
}

function loadSavedDelay() {
    try {
        if (!chrome.runtime || !chrome.runtime.id) {
            console.warn('VEO3 Automator: Contexto da extensão invalidado, não é possível carregar delay.');
            return;
        }
        chrome.storage.local.get(['midjourneyAutomator_delay'], function(result) {
            if (chrome.runtime.lastError) {
                console.warn('VEO3 Automator: Erro ao carregar delay:', chrome.runtime.lastError.message);
                return;
            }
            if (result.midjourneyAutomator_delay) {
                const delayInput = document.getElementById('delayInput');
                if (delayInput) {
                    delayInput.value = result.midjourneyAutomator_delay;
                }
            } else {
                // Definir valor padrão mais adequado para comportamento humanizado
                const delayInput = document.getElementById('delayInput');
                if (delayInput && delayInput.value === '3') {
                    delayInput.value = '8'; // Novo padrão para comportamento mais humano
                }
            }
        });
    } catch (error) {
        console.warn('VEO3 Automator: Erro ao carregar delay:', error.message);
    }
}

function updateStatus(message, show = true) {
    const statusContainer = document.getElementById('statusContainer');
    const statusTextElem = document.getElementById('statusText');
    if (statusTextElem && statusContainer) {
        statusTextElem.textContent = message;
        if (show) statusContainer.classList.remove('hidden');
        else statusContainer.classList.add('hidden');
    }
}

function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) return resolve(element);
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Elemento não encontrado: ${selector}`));
        }, timeout);
    });
}

// --- Find and Replace Functionality ---

let currentMatches = [];
let currentMatchIndex = -1;

function setupFindReplaceListeners() {
    // Find Replace elements
    const findReplaceBtn = document.getElementById('findReplaceBtn');
    const findReplaceBar = document.getElementById('findReplaceBar');
    const findInput = document.getElementById('findInput');
    const replaceInput = document.getElementById('replaceInput');
    const findPrevBtn = document.getElementById('findPrevBtn');
    const findNextBtn = document.getElementById('findNextBtn');
    const replaceBtn = document.getElementById('replaceBtn');
    const replaceAllBtn = document.getElementById('replaceAllBtn');
    const closeFindBtn = document.getElementById('closeFindBtn');
    const findCount = document.getElementById('findCount');

    // Find Replace event listeners
    if (findReplaceBtn) findReplaceBtn.addEventListener('click', toggleFindReplace);
    if (closeFindBtn) closeFindBtn.addEventListener('click', closeFindReplace);
    if (findInput) {
        findInput.addEventListener('input', performFind);
        
        // Proteção simples: apenas prevenir propagação de eventos
        findInput.addEventListener('keydown', function(e) {
            e.stopPropagation();
        });
        
        findInput.addEventListener('keyup', function(e) {
            e.stopPropagation();
        });
        
        findInput.addEventListener('focus', function(e) {
            e.stopPropagation();
        });
    }
    if (findPrevBtn) findPrevBtn.addEventListener('click', findPrevious);
    if (findNextBtn) findNextBtn.addEventListener('click', findNext);
    if (replaceBtn) replaceBtn.addEventListener('click', replaceCurrent);
    if (replaceAllBtn) replaceAllBtn.addEventListener('click', replaceAll);
}

function toggleFindReplace() {
    const findReplaceBar = document.getElementById('findReplaceBar');
    const findInput = document.getElementById('findInput');

    if (findReplaceBar.classList.contains('hidden')) {
        findReplaceBar.classList.remove('hidden');
        findInput.focus();
    } else {
        closeFindReplace();
    }
}

function closeFindReplace() {
    const findReplaceBar = document.getElementById('findReplaceBar');
    const findInput = document.getElementById('findInput');
    const replaceInput = document.getElementById('replaceInput');

    findReplaceBar.classList.add('hidden');
    findInput.value = '';
    replaceInput.value = '';
    clearHighlights();
    updateFindCount();
}

function performFind() {
    const findInput = document.getElementById('findInput');
    const inputText = document.getElementById('inputText');
    const searchText = findInput.value;

    clearHighlights();

    if (!searchText) {
        updateFindCount();
        return;
    }

    const text = inputText.value;
    currentMatches = [];

    let index = 0;
    while (index < text.length) {
        const foundIndex = text.toLowerCase().indexOf(searchText.toLowerCase(), index);
        if (foundIndex === -1) break;

        currentMatches.push({
            start: foundIndex,
            end: foundIndex + searchText.length
        });

        index = foundIndex + 1;
    }

    if (currentMatches.length > 0) {
        currentMatchIndex = 0;
        highlightCurrentMatch();
    } else {
        currentMatchIndex = -1;
    }

    updateFindCount();
}

function findNext() {
    if (currentMatches.length === 0) return;

    currentMatchIndex = (currentMatchIndex + 1) % currentMatches.length;
    highlightCurrentMatch();
    updateFindCount();
}

function findPrevious() {
    if (currentMatches.length === 0) return;

    currentMatchIndex = currentMatchIndex <= 0 ? currentMatches.length - 1 : currentMatchIndex - 1;
    highlightCurrentMatch();
    updateFindCount();
}

function highlightCurrentMatch() {
    const inputText = document.getElementById('inputText');

    if (currentMatchIndex >= 0 && currentMatchIndex < currentMatches.length) {
        const match = currentMatches[currentMatchIndex];
        inputText.setSelectionRange(match.start, match.end);
        // REMOVIDO: inputText.focus() que estava causando redirecionamento de foco
    }
}

function replaceCurrent() {
    const replaceInput = document.getElementById('replaceInput');
    const inputText = document.getElementById('inputText');
    const replaceText = replaceInput.value;

    if (currentMatchIndex >= 0 && currentMatchIndex < currentMatches.length) {
        const match = currentMatches[currentMatchIndex];
        const text = inputText.value;

        const newText = text.substring(0, match.start) + replaceText + text.substring(match.end);
        inputText.value = newText;

        // Ajustar posições dos matches seguintes
        const lengthDiff = replaceText.length - (match.end - match.start);
        for (let i = currentMatchIndex + 1; i < currentMatches.length; i++) {
            currentMatches[i].start += lengthDiff;
            currentMatches[i].end += lengthDiff;
        }

        // Remover o match atual e refazer a busca
        currentMatches.splice(currentMatchIndex, 1);
        if (currentMatchIndex >= currentMatches.length) {
            currentMatchIndex = currentMatches.length - 1;
        }

        if (currentMatches.length > 0 && currentMatchIndex >= 0) {
            highlightCurrentMatch();
        }

        updateFindCount();
    }
}

function replaceAll() {
    const findInput = document.getElementById('findInput');
    const replaceInput = document.getElementById('replaceInput');
    const inputText = document.getElementById('inputText');

    const searchText = findInput.value;
    const replaceText = replaceInput.value;

    if (!searchText) return;

    const text = inputText.value;
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newText = text.replace(regex, replaceText);

    inputText.value = newText;

    // Limpar matches e refazer busca
    currentMatches = [];
    currentMatchIndex = -1;
    performFind();
}

function clearHighlights() {
    // Como estamos usando textarea, não podemos destacar visualmente o texto
    // mas podemos limpar a seleção
    const inputText = document.getElementById('inputText');
    inputText.setSelectionRange(0, 0);
}

function updateFindCount() {
    const findCount = document.getElementById('findCount');

    if (currentMatches.length === 0) {
        findCount.textContent = '0/0';
    } else {
        findCount.textContent = `${currentMatchIndex + 1}/${currentMatches.length}`;
    }
}