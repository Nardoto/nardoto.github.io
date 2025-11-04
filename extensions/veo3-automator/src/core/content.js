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

// Função para detectar e exibir quantidade de vídeos automaticamente
function detectAndShowVideos() {
    const textarea = document.getElementById('inputText');
    const videoDetection = document.getElementById('videoDetection');
    const detectedCount = document.getElementById('detectedCount');
    const detectedTime = document.getElementById('detectedTime');

    if (!textarea || !videoDetection) return;

    const text = textarea.value.trim();

    if (!text) {
        // Esconder se não tiver texto
        videoDetection.classList.add('hidden');
        return;
    }

    // Detectar vídeos usando a mesma lógica de parseVideoText
    const videos = parseVideoText(text);

    if (videos.length > 0) {
        // Calcular tempo estimado
        const timeEstimate = calculateEstimatedTime(videos.length);

        // Atualizar interface
        detectedCount.textContent = `${videos.length} vídeo${videos.length > 1 ? 's' : ''} detectado${videos.length > 1 ? 's' : ''}`;
        detectedTime.textContent = `Tempo estimado: ${timeEstimate.formatted}`;
        videoDetection.classList.remove('hidden');
    } else {
        videoDetection.classList.add('hidden');
    }
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
                console.log('VEO3 Automator: Texto limpo automaticamente');
                console.log('Antes:', currentText);
                console.log('Depois:', cleanedText);

                textarea.value = cleanedText;
                // Dispara evento de input para notificar mudanças
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Detectar vídeos automaticamente após colar
            detectAndShowVideos();
        }, 10);
    });

    // Limpa formatação quando digita (opcional, remove formatação em tempo real)
    textarea.addEventListener('input', function(e) {
        const currentText = textarea.value;
        const cleanedText = cleanTextFormatting(currentText);
        if (cleanedText !== currentText) {
            // Preserva a posição do cursor
            const cursorPos = textarea.selectionStart;
            textarea.value = cleanedText;
            // Restaura a posição do cursor
            textarea.setSelectionRange(cursorPos, cursorPos);
        }

        // Detectar vídeos automaticamente ao digitar (com debounce)
        clearTimeout(textarea.detectTimeout);
        textarea.detectTimeout = setTimeout(() => {
            detectAndShowVideos();
        }, 500); // Espera 500ms após parar de digitar
    });
}

console.log("VEO3 Automator: content.js injetado!");

// =======================================================
// ⚠️ VERIFICAÇÃO DE LICENÇA - NÃO REMOVA ⚠️
// =======================================================

// Variável global para controlar o status da licença
let licenseStatus = {
    isValid: false,
    isChecking: true,
    message: ''
};

// Verifica licença mas SEMPRE inicializa a interface
(async function checkLicense() {
    console.log("🔐 Verificando licença...");

    // Verifica se acabou de ativar
    try {
        const result = await chrome.storage.local.get('veo3_just_activated');
        if (result.veo3_just_activated) {
            console.log("✅ Licença acabou de ser ativada! Limpando flag...");
            await chrome.storage.local.remove('veo3_just_activated');
        }
    } catch (e) {
        console.log("⚠️ Erro ao verificar flag de ativação:", e);
    }

    const isLicensed = await initLicenseSystem();

    if (!isLicensed) {
        console.warn("⚠️ Licença não encontrada ou inválida");
        licenseStatus = {
            isValid: false,
            isChecking: false,
            message: '🔐 Extensão em Modo Limitado - Ative sua licença para usar todos os recursos'
        };

        // NÃO bloqueia mais - inicializa com limitações
        console.log("⚠️ Iniciando em modo limitado - funcionalidades restritas");
        console.log("💡 Para ativar: clique no botão 'Ativar Licença' na interface");
    } else {
        console.log("✅ Licença válida! Modo completo ativado.");
        licenseStatus = {
            isValid: true,
            isChecking: false,
            message: '✅ Licença Ativa - Todos os recursos disponíveis'
        };
    }

    // SEMPRE inicializa a extensão (com ou sem licença)
    initializeExtension();
})();

function initializeExtension() {
    console.log("🚀 Iniciando VEO3 Automator...");

    // Inicializa a interface da extensão
    checkAndInitialize();

    // Configura observador de URL (para SPAs)
    setupUrlObserver();
}

function setupUrlObserver() {
    // Observador de mudanças de URL (para SPAs que não recarregam a página)
    const urlObserver = new MutationObserver(() => {
        checkAndInitialize();
    });

    // Observar mudanças no DOM que podem indicar navegação
    urlObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Também observar mudanças de histórico (pushState/replaceState)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
        originalPushState.apply(this, arguments);
        checkAndInitialize();
    };

    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        checkAndInitialize();
    };

    console.log("🔍 Observador de URL configurado");
}

// =======================================================

let songQueue = [];
let isAutomating = false;
let currentAutoIndex = 0;
let timeUpdateInterval = null; // Intervalo para atualizar tempo decorrido/restante

// --- PARTE 1: LÓGICA DA INTERFACE ---



// Função para verificar se estamos na página do VEO3/Flow
function isVEO3Page() {
    // Verificar se estamos na URL do Flow (VEO3) APENAS
    return window.location.href.includes('/tools/flow/');
}

function initializeUI() {
    // Verificar se estamos na página do VEO3/Flow ou Whisk - se não estiver, não inicializar
    if (!isVEO3Page()) {
        console.log("🎯 VEO3 Automator: Não é página do VEO3/Flow/Whisk, não será inicializado aqui");
        return;
    }

    // Se já foi inicializado, não fazer nada
    if (isInitialized) {
        console.log("🎯 VEO3 Automator: Já inicializado, pulando...");
        return;
    }

    console.log("🎯 VEO3 Automator: Inicializando...");
    isInitialized = true;
    
    const toggleButton = document.createElement('button');
    toggleButton.id = 'suno-automator-toggle';
    toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9L12 0Z"/>
        </svg>
    `;
    toggleButton.title = 'VEO3 Automator - Abrir/Fechar';
    document.body.appendChild(toggleButton);
    toggleButton.addEventListener('click', toggleSidebar);

    const sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'veo3-automator-sidebar';
    document.body.appendChild(sidebarContainer);

    fetch(chrome.runtime.getURL('src/interface/sidebar.html'))
        .then(response => response.text())
        .then(html => {
            sidebarContainer.innerHTML = html;
            console.log("VEO3 Automator: Estrutura da Sidebar injetada.");
            attachSidebarListeners();
            loadSavedState();
            loadSavedDelay();
            updateLicenseStatusIndicator(); // Atualizar indicador de licença
        }).catch(error => console.error("VEO3 Automator: Erro ao carregar sidebar.html:", error));
    
    try {
        if (chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.get(['sidebarOpen'], function(result) {
                if (chrome.runtime.lastError) {
                    console.warn('VEO3 Automator: Erro ao verificar estado da sidebar:', chrome.runtime.lastError.message);
                    return;
                }
                if (result.sidebarOpen) {
                    openSidebar();
                }
            });
        }
    } catch (error) {
        console.warn('VEO3 Automator: Erro ao verificar estado da sidebar:', error.message);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('veo3-automator-sidebar');
    if (!sidebar) return;
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
}

function openSidebar() {
    const sidebar = document.getElementById('veo3-automator-sidebar');
    if (!sidebar) return;
    sidebar.classList.add('open');
    document.body.classList.add('veo3-automator-sidebar-open');
    try {
        if (chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.set({ sidebarOpen: true });
        }
    } catch (error) {
        console.warn('VEO3 Automator: Erro ao salvar estado da sidebar:', error.message);
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('veo3-automator-sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('open');
    document.body.classList.remove('veo3-automator-sidebar-open');
    try {
        if (chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.set({ sidebarOpen: false });
        }
    } catch (error) {
        console.warn('VEO3 Automator: Erro ao salvar estado da sidebar:', error.message);
    }
}

// Variável para rastrear se já inicializamos
let isInitialized = false;
let currentUrl = window.location.href;

// Função para limpar UI existente antes de reinicializar
function cleanupUI() {
    const existingToggle = document.getElementById('suno-automator-toggle');
    const existingSidebar = document.getElementById('veo3-automator-sidebar');

    if (existingToggle) existingToggle.remove();
    if (existingSidebar) existingSidebar.remove();

    document.body.classList.remove('veo3-automator-sidebar-open');
    isInitialized = false;
}

// Função para verificar e reinicializar se necessário
function checkAndInitialize() {
    const newUrl = window.location.href;

    // Se mudou de URL
    if (newUrl !== currentUrl) {
        console.log("🔄 VEO3 Automator: URL mudou de", currentUrl, "para", newUrl);
        currentUrl = newUrl;

        // Se saiu de uma página válida para outra, limpar e reinicializar
        if (isVEO3Page()) {
            cleanupUI();
            initializeUI();
        } else if (isInitialized) {
            // Se saiu de uma página válida, apenas limpar
            cleanupUI();
        }
    } else if (isVEO3Page() && !isInitialized) {
        // Se está na página certa mas não inicializou ainda
        initializeUI();
    }
}

// =======================================================
// OBSERVADOR DE URL - MOVIDO PARA DENTRO DE initializeExtension()
// Não remover este comentário - o código agora está em setupUrlObserver()
// =======================================================

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
    // Seletor para o botão de instruções
    const openInstructionsBtn = document.getElementById('openInstructionsModalBtn');

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
    if (inputText) inputText.addEventListener('focus', () => inputText.select());

    // Listener para o botão de instruções
    if (openInstructionsBtn) openInstructionsBtn.addEventListener('click', openInstructionsModal);
    
    // Configura limpeza automática da textarea
    setupTextareaCleaning();

    // Configurar funcionalidade de localizar e substituir usando módulo compartilhado
    setupFindReplaceListeners();
}

// ===== NOVAS FUNÇÕES PARA OS MODAIS ADICIONADAS AQUI =====
function openInstructionsModal() {
    if (document.getElementById('veo3-automator-modal-bg')) return;
    const modalHTML = `
        <div id="veo3-automator-modal-bg">
            <div class="veo3-automator-modal">
                <h2>❓ Como Usar o VEO3 Automator</h2>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>🆕 NOVA VERSÃO 2.0 - Suporte a Imagens!</strong><br>
                    Agora você pode adicionar imagens aos seus prompts para criar vídeos Frame-to-Video automaticamente!
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>1. Formatos Suportados:</strong><br>
                    <strong>Formato Simples:</strong><br>
                    <code>Título do Vídeo</code><br>
                    <code>Prompt detalhado do vídeo...</code><br><br>
                    
                    <strong>Formato Estruturado:</strong><br>
                    <code>VIDEO 1</code><br>
                    <code>PROMPT:</code><br>
                    <code>...descrição do vídeo...</code><br>
                    <code>TITLE: Título do vídeo</code>
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>2. Analise e Liste:</strong> Cole os prompts na caixa e clique em "Analisar e Listar Vídeos".
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>3. 🖼️ Adicione Imagens (NOVO!):</strong> Arraste imagens para os campos em cada card de prompt ou clique para selecionar.
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>4. Gere os Vídeos:</strong> Use "Gerar com Imagem" ou "Gerar no VEO3" em cada card, ou "Gerar Todos Automaticamente".
                </p>
                <p style="text-align: left; font-size: 0.8rem; color: #666; margin-top: 10px;">
                    <strong>✨ Recursos da v2.0:</strong><br>
                    • Drag & drop de imagens automático<br>
                    • Auto-confirmação de corte de imagem<br>
                    • Detecção automática de modo Frame-to-Video<br>
                    • Suporte a JPG, PNG, GIF, WebP até 10MB
                </p>
                <button class="modal-close-btn" id="modal-close">Entendido</button>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('modal-close').addEventListener('click', () => document.getElementById('veo3-automator-modal-bg').remove());
}

// Função openDonationModal removida - não é mais necessária
// =======================================================

// Função para calcular estimativa de tempo de geração
function calculateEstimatedTime(videoCount) {
    // Baseado nos dados fornecidos:
    // - 12 min para 35 vídeos = ~21 segundos/vídeo
    // - 5 min para 13 vídeos = ~23 segundos/vídeo
    // - Média: ~25 segundos por vídeo (estimativa conservadora)
    const SECONDS_PER_VIDEO = 25;

    const totalSeconds = videoCount * SECONDS_PER_VIDEO;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Formatar a string de tempo
    let timeString = '';
    if (hours > 0) {
        timeString += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
        timeString += `${minutes}min`;
    }
    if (hours === 0 && minutes === 0) {
        timeString = `${seconds}s`;
    }

    return {
        totalSeconds: totalSeconds,
        formatted: timeString.trim(),
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}

// Função para formatar tempo em formato legível
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
        return `${minutes}min ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

async function processAndRenderCards() {
    // Processar NÃO verifica licença - apenas organiza os prompts
    console.log("📝 Processando prompts (organização apenas)...");

    // Verificar se está revogado para mostrar aviso visual
    if (isLicenseRevoked && typeof isLicenseRevoked === 'function' && isLicenseRevoked()) {
        const remaining = getRemainingSubmissions ? getRemainingSubmissions() : 0;
        if (remaining > 0) {
            updateStatus(`⚠️ Licença revogada - ${remaining} envios restantes`, true);
        }
    }

    const fullText = document.getElementById('inputText').value;
    if (!fullText.trim()) {
        updateStatus("⚠️ Por favor, cole um texto para analisar.", true);
        document.getElementById('inputText').focus();
        return;
    }
    saveState();
    songQueue = parseVideoText(fullText);
    if (songQueue.length === 0) {
        updateStatus("❌ Nenhum vídeo encontrado no formato esperado. Verifique o formato do texto.", true);
        return;
    }
    renderSongCards(songQueue);

    // Calcular e exibir estimativa de tempo
    const timeEstimate = calculateEstimatedTime(songQueue.length);
    console.log('⏱️ Tempo estimado calculado:', timeEstimate);
    updateStatus(`✅ ${songQueue.length} vídeos prontos para serem gerados! ⏱️ Tempo estimado: ${timeEstimate.formatted}`, true);

    // Atualizar o contador total na seção de progresso
    const totalCount = document.getElementById('totalCount');
    if (totalCount) {
        totalCount.textContent = songQueue.length;
    }
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
            <div class="card-style" title="${song.prompt}" style="white-space: pre-wrap; color: #202124;">${song.prompt.substring(0, 200)}${song.prompt.length > 200 ? '...' : ''}</div>
            <button class="insert-btn" data-song-index="${index}" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">Gerar no VEO3</button>
        `;
        songListElement.appendChild(card);
    });
    const automationContainer = document.getElementById('automationContainer');
    if (automationContainer && songs.length > 0) {
        automationContainer.classList.remove('hidden');
        document.getElementById('totalCount').textContent = songs.length;
    }
}

// Verificar se algum prompt tem imagem
function checkIfAnyPromptsHaveImages() {
    try {
        // Verificar se o imageManager existe (do image-automator.js)
        if (typeof window.imageManager !== 'undefined' && window.imageManager) {
            // Verificar todos os prompts se têm imagem
            for (let i = 0; i < songQueue.length; i++) {
                if (window.imageManager.hasImage(i)) {
                    console.log(`📸 Imagem detectada no prompt ${i}`);
                    return true;
                }
            }
        }
        
        // Verificar também pelos elementos visuais na interface
        const imagePreviewsVisible = document.querySelectorAll('.image-preview[style*="display: block"], .image-preview-container[style*="display: block"]').length > 0;
        if (imagePreviewsVisible) {
            console.log("📸 Imagens detectadas visualmente na interface");
            return true;
        }
        
        return false;
    } catch (error) {
        console.warn("⚠️ Erro ao verificar imagens:", error);
        return false;
    }
}

// Verificar se o botão "Frames para vídeo" está ativo
function isFrameToVideoModeActive() {
    try {
        // Procurar pelo botão específico com as classes corretas que você forneceu
        const frameButton = document.querySelector('button[role="combobox"][class*="sc-d6df593a-1"][class*="csfEZL"]');

        if (frameButton) {
            const buttonText = frameButton.textContent.trim();
            console.log("🔍 Texto do botão de modo (seletor específico):", buttonText);

            if (buttonText.includes('Frames para vídeo') || buttonText.includes('Frame para vídeo') ||
                buttonText.includes('Frames to video') || buttonText.includes('Frame to video') ||
                buttonText.includes('Frames to Video')) {
                console.log("✅ Modo 'Frame para vídeo' / 'Frames to Video' está ativo");
                return true;
            }
        } else {
            console.log("⚠️ Botão com seletor específico não encontrado");
        }

        // Estratégia 2: Procurar por qualquer botão que contenha "Frames para vídeo" ou "Frames to video"
        const allButtons = document.querySelectorAll('button[role="combobox"]');
        console.log(`🔍 Encontrados ${allButtons.length} botões combobox na página`);

        for (let i = 0; i < allButtons.length; i++) {
            const button = allButtons[i];
            const buttonText = button.textContent.trim();
            console.log(`  🔍 Botão ${i + 1}: "${buttonText}"`);

            if (buttonText.includes('Frames para vídeo') || buttonText.includes('Frame para vídeo') ||
                buttonText.includes('Frames to video') || buttonText.includes('Frame to video') ||
                buttonText.includes('Frames to Video')) {
                console.log("✅ Modo 'Frame para vídeo' / 'Frames to Video' encontrado em botão:", buttonText);
                return true;
            }
        }
        
        // Estratégia 3: Verificação por texto visível na página
        const pageText = document.body.textContent || document.body.innerText;
        const lowerPageText = pageText.toLowerCase();

        console.log("🔍 Verificando texto da página...");
        console.log(`  📄 Contém "Frames para vídeo": ${pageText.includes('Frames para vídeo')}`);
        console.log(`  📄 Contém "Frames to Video": ${pageText.includes('Frames to Video')}`);
        console.log(`  📄 Contém "Frames to video": ${pageText.includes('Frames to video')}`);
        console.log(`  📄 Contém "frames to video" (lowercase): ${lowerPageText.includes('frames to video')}`);
        console.log(`  📄 Contém "Texto para vídeo": ${pageText.includes('Texto para vídeo')}`);
        console.log(`  📄 Contém "Text to video": ${pageText.includes('Text to video')}`);

        if ((pageText.includes('Frames para vídeo') && !pageText.includes('Texto para vídeo')) ||
            (pageText.includes('Frames to Video') && !pageText.includes('Text to Video')) ||
            (pageText.includes('Frames to video') && !pageText.includes('Text to video')) ||
            (lowerPageText.includes('frames to video') && !lowerPageText.includes('text to video'))) {
            console.log("✅ Modo 'Frame para vídeo' / 'Frames to Video' detectado por texto da página");
            return true;
        }

        console.log("⚠️ Modo 'Frame para vídeo' / 'Frames to Video' não está ativo");
        return false;
    } catch (error) {
        console.warn("⚠️ Erro ao verificar modo do VEO3:", error);
        return false; // Em caso de erro, assumir que não está no modo correto para segurança
    }
}

async function startAutomation() {
    if (isAutomating || songQueue.length === 0) return;

    // Verificação de licença antes de iniciar automação (ENVIO)
    console.log("🔐 Verificando licença antes de ENVIAR vídeos...");
    const licenseValid = await quickLicenseCheck();

    if (!licenseValid) {
        updateStatus("🚫 Acesso bloqueado - Limite de envios esgotado!", true);
        setTimeout(() => window.location.reload(), 3000);
        return;
    }

    // Mostrar contador se estiver revogado
    if (isLicenseRevoked && typeof isLicenseRevoked === 'function' && isLicenseRevoked()) {
        const remaining = getRemainingSubmissions ? getRemainingSubmissions() : 0;
        if (remaining > 0) {
            const confirmMsg = `⚠️ LICENÇA REVOGADA\n\n` +
                             `Você tem ${remaining} envios restantes.\n` +
                             `Deseja continuar e usar seus envios?\n\n` +
                             `Clique em OK para continuar ou Cancelar para parar.`;

            if (!confirm(confirmMsg)) {
                updateStatus("❌ Automação cancelada pelo usuário", true);
                return;
            }
        }
    }

    // Verificar se há imagens e se o modo está correto
    const hasAnyImages = checkIfAnyPromptsHaveImages();
    if (hasAnyImages) {
        // Aguardar um pouco para a interface carregar completamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const isFrameMode = isFrameToVideoModeActive();
        console.log(`🔍 Verificação de modo: Imagens=${hasAnyImages}, FrameMode=${isFrameMode}`);
        
        if (!isFrameMode) {
            const alertMessage = `🚨 ATENÇÃO / ATTENTION: Modo incorreto detectado / Wrong mode detected!\n\n` +
                                `📸 Você tem prompts com imagens, mas o VEO3 está no modo "Texto para vídeo".\n` +
                                `📸 You have prompts with images, but VEO3 is in "Text to Video" mode.\n\n` +
                                `⚠️ NECESSÁRIO / REQUIRED: Mude para o modo "Frame para vídeo" / "Frames to Video" antes de continuar.\n\n` +
                                `🔄 Procure pelo botão "Frames para vídeo" / "Frames to Video" e clique nele.\n` +
                                `🔄 Look for the "Frames to Video" button and click it.\n\n` +
                                `A automação será cancelada. Mude o modo e tente novamente.\n` +
                                `Automation will be canceled. Change the mode and try again.`;

            alert(alertMessage);
            return; // Cancela a automação
        } else {
            console.log("✅ Modo correto detectado, prosseguindo com automação...");
        }
    }
    
    isAutomating = true;
    currentAutoIndex = 0;
    const delaySeconds = parseInt(document.getElementById('delayInput').value) || 3;
    const delayMs = delaySeconds * 1000;
    const autoBtn = document.getElementById('autoInsertBtn');
    const stopBtn = document.getElementById('stopAutoBtn');
    const progressInfo = document.getElementById('progressInfo');
    autoBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressInfo.classList.remove('hidden');

    // Iniciar contador de tempo
    const startTime = Date.now();
    const totalVideos = songQueue.length;
    const estimatedTime = calculateEstimatedTime(totalVideos);

    // Atualizar elementos de tempo
    const elapsedTimeElement = document.getElementById('elapsedTime');
    const remainingTimeElement = document.getElementById('remainingTime');
    if (remainingTimeElement) {
        remainingTimeElement.textContent = estimatedTime.formatted;
    }

    // Limpar intervalo anterior se existir
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
    }

    // Intervalo para atualizar o tempo em tempo real a cada segundo
    timeUpdateInterval = setInterval(() => {
        if (!isAutomating) {
            clearInterval(timeUpdateInterval);
            timeUpdateInterval = null;
            return;
        }

        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedTimeElement) {
            elapsedTimeElement.textContent = formatTime(elapsedSeconds);
        }

        // Calcular tempo restante baseado no progresso
        const videosCompleted = currentAutoIndex;
        const videosRemaining = totalVideos - videosCompleted;
        const estimatedRemaining = calculateEstimatedTime(videosRemaining);
        if (remainingTimeElement) {
            remainingTimeElement.textContent = estimatedRemaining.formatted;
        }
    }, 1000);

    // NOVO: Processar em lotes de 5 vídeos
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(totalVideos / BATCH_SIZE);
    
    console.log(`🔄 Iniciando processamento em lotes: ${totalBatches} lotes de até ${BATCH_SIZE} vídeos cada`);
    
    // Atualizar interface com informações dos lotes
    const currentBatchElement = document.getElementById('currentBatch');
    const totalBatchesElement = document.getElementById('totalBatches');
    if (currentBatchElement) currentBatchElement.textContent = '0';
    if (totalBatchesElement) totalBatchesElement.textContent = totalBatches.toString();
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (!isAutomating) break;

        // Verificar licença a cada lote (exceto o primeiro, já verificado no início)
        if (batchIndex > 0) {
            console.log(`🔐 Verificando licença antes do lote ${batchIndex + 1}...`);
            updateStatus(`🔐 Verificando licença antes do lote ${batchIndex + 1}...`, true);

            const licenseValid = await quickLicenseCheck(false); // Usa cache se disponível

            if (!licenseValid) {
                updateStatus(`🚫 Licença revogada ou inválida. Parando automação...`, true);
                stopAutomation();

                // Aguarda 3 segundos antes de recarregar para o usuário ler a mensagem
                await new Promise(resolve => setTimeout(resolve, 3000));
                window.location.reload();
                return;
            }

            console.log(`✅ Licença válida, continuando com lote ${batchIndex + 1}`);
        }

        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, totalVideos);
        const batchVideos = songQueue.slice(startIndex, endIndex);

        console.log(`📦 Processando lote ${batchIndex + 1}/${totalBatches} (vídeos ${startIndex + 1}-${endIndex})`);
        updateStatus(`📦 Processando lote ${batchIndex + 1}/${totalBatches} (${batchVideos.length} vídeos)`, true);
        
        // Atualizar interface com lote atual
        if (currentBatchElement) currentBatchElement.textContent = (batchIndex + 1).toString();
        
        // Processar vídeos do lote atual
        for (let i = 0; i < batchVideos.length; i++) {
            if (!isAutomating) break;
            
            const globalIndex = startIndex + i;
            currentAutoIndex = globalIndex;
            const song = batchVideos[i];
            const card = document.getElementById(`song-card-${globalIndex}`);
            const button = card?.querySelector('.insert-btn');
            
            if (button && !button.disabled) {
                document.getElementById('currentSong').textContent = song.title;
                document.getElementById('progressCount').textContent = globalIndex + 1;
                if (card) card.classList.add('processing');
                button.disabled = true;
                button.textContent = 'Enviando...';
                
                await populateVEO3AndCreate(song);
                
                // Aguardar entre vídeos do mesmo lote (delay configurável)
                if (i < batchVideos.length - 1 && isAutomating) {
                    updateStatus(`⏳ Aguardando ${delaySeconds} segundos antes do próximo vídeo...`, true);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
            if (card) card.classList.remove('processing');
        }
        
        // Aguardar 60 segundos entre lotes (exceto no último lote)
        if (batchIndex < totalBatches - 1 && isAutomating) {
            console.log(`⏰ Lote ${batchIndex + 1} concluído. Aguardando 60 segundos antes do próximo lote...`);
            updateStatus(`⏰ Lote ${batchIndex + 1}/${totalBatches} concluído! Aguardando 60 segundos antes do próximo lote...`, true);

            // Mostrar countdown visual
            const countdownElement = document.getElementById('batchPauseCountdown');
            const countdownTimerElement = document.getElementById('pauseCountdownTimer');

            if (countdownElement) {
                countdownElement.classList.remove('hidden');
            }

            // Countdown de 60 segundos
            const PAUSE_DURATION = 60;
            for (let secondsLeft = PAUSE_DURATION; secondsLeft > 0 && isAutomating; secondsLeft--) {
                if (countdownTimerElement) {
                    countdownTimerElement.textContent = `${secondsLeft}s`;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Esconder countdown
            if (countdownElement) {
                countdownElement.classList.add('hidden');
            }
        }
    }
    
    stopAutomation();
    updateStatus(`🎉 Automação concluída! ${currentAutoIndex + 1} vídeos processados em ${totalBatches} lotes!`, true);
}

function stopAutomation() {
    isAutomating = false;

    // Limpar o intervalo de atualização de tempo
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
        timeUpdateInterval = null;
    }

    const autoBtn = document.getElementById('autoInsertBtn');
    const stopBtn = document.getElementById('stopAutoBtn');
    const progressInfo = document.getElementById('progressInfo');
    const elapsedTimeElement = document.getElementById('elapsedTime');
    const remainingTimeElement = document.getElementById('remainingTime');
    const countdownElement = document.getElementById('batchPauseCountdown');

    if (autoBtn) autoBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (progressInfo) progressInfo.classList.add('hidden');
    if (countdownElement) countdownElement.classList.add('hidden'); // Esconder countdown

    // Resetar contadores de tempo
    if (elapsedTimeElement) elapsedTimeElement.textContent = '0s';
    if (remainingTimeElement) remainingTimeElement.textContent = '-';

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
            populateVEO3AndCreate(songData);
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
        
        // Limpar informações dos lotes
        const currentBatch = document.getElementById('currentBatch');
        const totalBatches = document.getElementById('totalBatches');
        if (currentBatch) currentBatch.textContent = '-';
        if (totalBatches) totalBatches.textContent = '-';

        // Limpar contadores de tempo
        const elapsedTimeElement = document.getElementById('elapsedTime');
        const remainingTimeElement = document.getElementById('remainingTime');
        if (elapsedTimeElement) elapsedTimeElement.textContent = '0s';
        if (remainingTimeElement) remainingTimeElement.textContent = '-';

        // Esconder countdown de pausa
        const countdownElement = document.getElementById('batchPauseCountdown');
        if (countdownElement) countdownElement.classList.add('hidden');

        // Limpar detecção automática de vídeos
        const videoDetection = document.getElementById('videoDetection');
        if (videoDetection) videoDetection.classList.add('hidden');

        // 4) Status
        const statusContainer = document.getElementById('statusContainer');
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.textContent = 'Aguardando...';
        if (statusContainer) statusContainer.classList.add('hidden');

        // 5) Estado interno e persistência
        songQueue = [];
        isAutomating = false;
        try {
            if (chrome.runtime && chrome.runtime.id) {
                chrome.storage.local.set({ veo3Automator_savedText: '' });
            }
        } catch (error) {
            console.warn('VEO3 Automator: Erro ao limpar estado persistente:', error.message);
        }

        console.log('VEO3 Automator: Interface limpa com sucesso.');
    } catch (e) {
        console.warn('VEO3 Automator: falha ao limpar a interface:', e);
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
            const content = paragraph.trim();
            if (content) {
                // Usar todo o bloco como prompt completo (sem dividir título)
                // O título é apenas um preview dos primeiros 50 caracteres
                videos.push({
                    title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    prompt: content  // Todo o conteúdo, incluindo primeira linha
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
        
        // Formato simples: usar todo o bloco como prompt
        const content = block.trim();
        if (content) {
            videos.push({
                title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                prompt: content  // Todo o conteúdo, sem dividir
            });
        }
    }
    return videos;
}

async function populateVEO3AndCreate(videoData) {
    try {
        // Incrementar contador de envios se licença estiver revogada
        if (incrementSubmissionCount && typeof incrementSubmissionCount === 'function') {
            const canContinue = await incrementSubmissionCount();
            if (!canContinue) {
                console.error("❌ Limite de envios esgotado!");
                updateStatus("🚫 Limite de envios esgotado! Recarregando...", true);
                setTimeout(() => window.location.reload(), 3000);
                return;
            }

            // Mostrar contador atualizado
            if (isLicenseRevoked && typeof isLicenseRevoked === 'function' && isLicenseRevoked()) {
                const remaining = getRemainingSubmissions ? getRemainingSubmissions() : 0;
                if (remaining > 0 && remaining <= 5) {
                    updateStatus(`⚠️ Enviando... ${remaining} envios restantes!`, true);
                }
            }
        }

        // Verificar se estamos na página do VEO3/Flow - se não estiver, não executar
        if (!isVEO3Page()) {
            console.log("🎯 VEO3 Automator: Não é página do VEO3/Flow, automação VEO3 não será executada");
            return;
        }

        // Verificar se está no modo "Frames para vídeo" e tem imagem para este prompt
        const isFrameMode = isFrameToVideoModeActive();
        const promptIndex = songQueue.findIndex(song =>
            song.title === videoData.title && song.prompt === videoData.prompt
        );

        // Se está no modo frame E tem imagem, usar o fluxo com imagem
        if (isFrameMode && typeof window.imageManager !== 'undefined' &&
            window.imageManager && window.imageManager.hasImage(promptIndex)) {
            console.log(`🖼️ Modo 'Frames para vídeo' ativo e imagem detectada. Usando fluxo com imagem para prompt ${promptIndex}`);

            // Usar o processamento com imagem do image-automator.js
            if (typeof window.processPromptWithImage === 'function') {
                return await window.processPromptWithImage(promptIndex, videoData);
            }
        }

        console.log("=== 🤖 INICIANDO AUTOMAÇÃO VEO3 (modo texto) ===");
        const textArea = document.querySelector('#PINHOLE_TEXT_AREA_ELEMENT_ID');
        
        if (!textArea) {
            throw new Error("Campo de texto do VEO3 não encontrado");
        }
        
        // Enviar apenas o conteúdo bruto do prompt (sem duplicar título)
        const fullPrompt = videoData.prompt;
        console.log("📝 Preenchendo campo com:", fullPrompt);

        // Guardar o valor original para verificação
        const originalValue = textArea.value;

        await fillField(textArea, fullPrompt);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Estratégia 1: Tentar encontrar e clicar no botão de envio
        let submitButton = findSubmitButton();
        
        // Estratégia 2: Procurar por formulários
        const form = textArea.closest('form') || document.querySelector('form');
        
        let submissionSuccess = false;
        
        // Tentar enviar via botão
        if (submitButton) {
            console.log("🔘 Tentando enviar via botão:", submitButton);
            try {
                submitButton.click();
                submissionSuccess = true;
                console.log("✅ Envio via botão bem-sucedido");
            } catch (error) {
                console.warn("⚠️ Falha no clique do botão:", error);
            }
        }
        
        // Se o botão falhou, tentar via formulário
        if (!submissionSuccess && form) {
            console.log("📋 Tentando enviar via formulário:", form);
            try {
                // Simular submit do formulário
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
                submissionSuccess = true;
                console.log("✅ Envio via formulário bem-sucedido");
            } catch (error) {
                console.warn("⚠️ Falha no submit do formulário:", error);
            }
        }
        
        // Se ainda não funcionou, tentar simular Enter na textarea
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
                handleAutomationResponse({ success: true, title: videoData.title });
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
                    handleAutomationResponse({ success: true, title: videoData.title });
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
                handleAutomationResponse({ success: true, title: videoData.title });
                return;
            }
        }
        
        throw new Error("Todas as estratégias de envio falharam");
        
    } catch (error) {
        console.error("❌ Erro na automação VEO3:", error);
        handleAutomationResponse({ success: false, error: error.message, title: videoData.title });
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
    // Primeiro, procurar especificamente pelo botão arrow_forward do VEO3
    const allIcons = document.querySelectorAll('i.google-symbols, i.material-icons');
    for (const icon of allIcons) {
        if (icon.textContent.trim() === 'arrow_forward') {
            console.log("🔍 Botão arrow_forward encontrado!", icon);
            // Retornar o elemento clicável (pode ser o próprio ícone ou seu pai button)
            const parentButton = icon.closest('button');
            return parentButton || icon;
        }
    }

    const selectors = [
        // Seletores específicos do VEO3 - removido o seletor genérico que estava pegando edit
        '[data-testid="submit-button"]',
        '[data-testid="create-button"]',

        // Seletores genéricos de botões de envio
        'button[type="submit"]',
        'input[type="submit"]',
        'button.submit',
        'button.create',
        'button.send',

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
        chrome.storage.local.set({ veo3Automator_savedText: textToSave });
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
        chrome.storage.local.get(['veo3Automator_savedText'], function(result) {
            if (chrome.runtime.lastError) {
                console.warn('VEO3 Automator: Erro ao carregar estado:', chrome.runtime.lastError.message);
                return;
            }
            if (result.veo3Automator_savedText) {
                const inputText = document.getElementById('inputText');
                if (inputText) {
                    inputText.value = result.veo3Automator_savedText;
                    if (result.veo3Automator_savedText.trim()) {
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
        chrome.storage.local.set({ veo3Automator_delay: delay });
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
        chrome.storage.local.get(['veo3Automator_delay'], function(result) {
            if (chrome.runtime.lastError) {
                console.warn('VEO3 Automator: Erro ao carregar delay:', chrome.runtime.lastError.message);
                return;
            }
            if (result.veo3Automator_delay) {
                const delayInput = document.getElementById('delayInput');
                if (delayInput) {
                    delayInput.value = result.veo3Automator_delay;
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

/**
 * Atualiza o indicador visual de status da licença na sidebar
 */
function updateLicenseStatusIndicator() {
    try {
        const userDisplay = document.getElementById('userDisplay');
        const headerUserName = document.getElementById('headerUserName');
        const licenseActionBar = document.getElementById('licenseActionBar');
        const licenseRevokedBar = document.getElementById('licenseRevokedBar');
        const revokedCounter = document.getElementById('revokedCounter');
        const sidebar = document.getElementById('veo3-automator-sidebar');

        // Elementos do painel de configurações
        const settingsLicenseStatus = document.getElementById('settingsLicenseStatus');
        const settingsUserName = document.getElementById('settingsUserName');
        const settingsPlanName = document.getElementById('settingsPlanName');
        const settingsExpiryInfo = document.getElementById('settingsExpiryInfo');
        const settingsLicenseKey = document.getElementById('settingsLicenseKey');

        // Atualizar baseado no status global da licença
        if (licenseStatus.isChecking) {
            // Ainda verificando
            if (settingsLicenseStatus) {
                settingsLicenseStatus.textContent = '🔄 Verificando...';
                settingsLicenseStatus.className = 'info-value';
            }
        } else if (licenseStatus.isValid) {
            // Licença válida

            // Mostrar nome do usuário no cabeçalho
            if (userDisplay && headerUserName) {
                userDisplay.classList.remove('hidden');

                // Obter nome do usuário da licença
                if (licenseState && licenseState.userData) {
                    headerUserName.textContent = licenseState.userData.username || 'Usuário Premium';
                    if (settingsUserName) {
                        settingsUserName.textContent = licenseState.userData.username || 'Usuário Premium';
                    }
                } else {
                    headerUserName.textContent = 'Usuário Premium';
                    if (settingsUserName) {
                        settingsUserName.textContent = 'Usuário Premium';
                    }
                }

                // Mostrar badge de trial se for licença de teste
                const trialBadge = document.getElementById('trialBadge');
                if (trialBadge && licenseState && licenseState.userData) {
                    const plan = licenseState.userData.plan || '';
                    if (plan.toLowerCase().includes('trial')) {
                        trialBadge.classList.remove('hidden');
                    } else {
                        trialBadge.classList.add('hidden');
                    }
                }
            }

            // Atualizar barra de informações da licença
            const licenseInfoBar = document.getElementById('licenseInfoBar');
            const licensePlanName = document.getElementById('licensePlanName');
            const licenseExpiryInfo = document.getElementById('licenseExpiryInfo');

            if (licenseInfoBar && licensePlanName && licenseExpiryInfo && licenseState && licenseState.userData) {
                const plan = licenseState.userData.plan || 'Licença Ativa';
                const expiresAt = licenseState.userData.expiresAt;
                const isTrial = plan.toLowerCase().includes('trial');

                // Mostrar barra APENAS para trials
                if (isTrial) {
                    // É trial - mostrar barra
                    licenseInfoBar.classList.remove('hidden');
                    licenseInfoBar.classList.add('active');
                    licenseInfoBar.classList.add('trial');

                    // Atualizar nome do plano
                    licensePlanName.textContent = plan;

                    // Calcular dias restantes
                    if (expiresAt) {
                        const now = Date.now();
                        const expiryDate = new Date(expiresAt);
                        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

                        if (daysLeft > 0) {
                            if (daysLeft === 1) {
                                licenseExpiryInfo.textContent = `⚠️ Último dia de teste!`;
                            } else {
                                licenseExpiryInfo.textContent = `⏰ ${daysLeft} dias restantes de teste`;
                            }
                        } else {
                            licenseExpiryInfo.textContent = '❌ Trial expirado';
                        }
                    }

                    // Mostrar botão de compra
                    const buyFullLicenseBtn = document.getElementById('buyFullLicenseBtn');
                    if (buyFullLicenseBtn) {
                        buyFullLicenseBtn.classList.remove('hidden');
                    }
                } else {
                    // NÃO é trial - ocultar barra completamente
                    licenseInfoBar.classList.add('hidden');
                    licenseInfoBar.classList.remove('active');
                    licenseInfoBar.classList.remove('trial');

                    // Ocultar botão de compra
                    const buyFullLicenseBtn = document.getElementById('buyFullLicenseBtn');
                    if (buyFullLicenseBtn) {
                        buyFullLicenseBtn.classList.add('hidden');
                    }
                }
            }

            // Atualizar status nas configurações
            if (settingsLicenseStatus) {
                settingsLicenseStatus.textContent = '✅ Ativo';
                settingsLicenseStatus.className = 'info-value status-active';
            }

            // Atualizar informações do plano e validade nas configurações
            if (settingsPlanName && settingsExpiryInfo && licenseState && licenseState.userData) {
                const plan = licenseState.userData.plan || 'Licença Ativa';
                const expiresAt = licenseState.userData.expiresAt;
                const isTrial = plan.toLowerCase().includes('trial');

                // Nome do plano
                settingsPlanName.textContent = plan;
                if (isTrial) {
                    settingsPlanName.className = 'info-value plan-trial';
                } else {
                    settingsPlanName.className = 'info-value';
                }

                // Informações de validade
                if (expiresAt) {
                    const now = Date.now();
                    const expiryDate = new Date(expiresAt);
                    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

                    if (daysLeft > 0) {
                        if (isTrial) {
                            if (daysLeft === 1) {
                                settingsExpiryInfo.textContent = `⚠️ Expira hoje!`;
                                settingsExpiryInfo.className = 'info-value expiry-warning';
                            } else if (daysLeft <= 3) {
                                settingsExpiryInfo.textContent = `⏰ ${daysLeft} dias restantes`;
                                settingsExpiryInfo.className = 'info-value expiry-soon';
                            } else {
                                settingsExpiryInfo.textContent = `${daysLeft} dias restantes`;
                                settingsExpiryInfo.className = 'info-value';
                            }
                        } else {
                            settingsExpiryInfo.textContent = `Até ${expiryDate.toLocaleDateString('pt-BR')}`;
                            settingsExpiryInfo.className = 'info-value';
                        }
                    } else {
                        settingsExpiryInfo.textContent = '❌ Expirada';
                        settingsExpiryInfo.className = 'info-value expiry-warning';
                    }
                } else {
                    settingsExpiryInfo.textContent = '✅ Sem expiração';
                    settingsExpiryInfo.className = 'info-value';
                }
            }

            // Mostrar chave mascarada
            if (settingsLicenseKey && licenseState && licenseState.licenseKey) {
                const key = licenseState.licenseKey;
                const maskedKey = key.substring(0, 4) + '-****-****-' + key.substring(key.length - 4);
                settingsLicenseKey.textContent = maskedKey;
            }

            // Esconder barras de ação
            if (licenseActionBar) {
                licenseActionBar.classList.add('hidden');
            }
            if (licenseRevokedBar) {
                licenseRevokedBar.classList.add('hidden');
            }

            // Remover classe no-license do sidebar
            if (sidebar) {
                const content = sidebar.querySelector('#veo3-flow-content');
                if (content) {
                    content.classList.remove('no-license');
                }
            }
        } else {
            // Licença inválida ou não encontrada

            // Esconder nome do usuário
            if (userDisplay) {
                userDisplay.classList.add('hidden');
            }

            // Esconder barra de informações da licença
            const licenseInfoBar = document.getElementById('licenseInfoBar');
            if (licenseInfoBar) {
                licenseInfoBar.classList.remove('active');
                licenseInfoBar.classList.add('hidden');
            }

            // Verificar se está em modo de licença revogada
            const isRevoked = typeof isLicenseRevoked === 'function' && isLicenseRevoked();
            const remaining = isRevoked && typeof getRemainingSubmissions === 'function' ? getRemainingSubmissions() : 0;

            if (isRevoked) {
                // LICENÇA REVOGADA - Mostrar barra vermelha urgente
                if (licenseRevokedBar) {
                    licenseRevokedBar.classList.remove('hidden');
                }
                if (licenseActionBar) {
                    licenseActionBar.classList.add('hidden'); // Esconder barra amarela padrão
                }

                // Atualizar contador
                if (revokedCounter) {
                    if (remaining > 0) {
                        revokedCounter.textContent = `${remaining} envios restantes`;
                        revokedCounter.style.color = remaining <= 5 ? '#ff9999' : '#ffcccc';
                    } else {
                        revokedCounter.textContent = 'BLOQUEADO - Sem envios restantes';
                        revokedCounter.style.color = '#ff6666';
                    }
                }

                // Atualizar status nas configurações
                if (settingsLicenseStatus) {
                    settingsLicenseStatus.textContent = '🚫 Revogado';
                    settingsLicenseStatus.className = 'info-value';
                    settingsLicenseStatus.style.color = '#ff0000';
                }
            } else {
                // LICENÇA NÃO ATIVADA - Mostrar barra amarela padrão
                if (licenseRevokedBar) {
                    licenseRevokedBar.classList.add('hidden');
                }
                if (licenseActionBar) {
                    licenseActionBar.classList.remove('hidden');
                }

                // Atualizar status nas configurações
                if (settingsLicenseStatus) {
                    settingsLicenseStatus.textContent = '⚠️ Não Ativado';
                    settingsLicenseStatus.className = 'info-value status-inactive';
                }
            }

            if (settingsUserName) {
                settingsUserName.textContent = '-';
            }

            if (settingsLicenseKey) {
                settingsLicenseKey.textContent = '****-****-****-****';
            }

            // Adicionar classe no-license ao sidebar para desabilitar funcionalidades
            if (sidebar) {
                const content = sidebar.querySelector('#veo3-flow-content');
                if (content) {
                    content.classList.add('no-license');
                }
            }
        }

        // Configurar botões de ação
        setupLicenseActionButtons();

        // Configurar botões do painel de configurações
        setupSettingsPanel();

    } catch (error) {
        console.error('Erro ao atualizar indicador de licença:', error);
    }
}

/**
 * Configura os botões de ação da licença
 */
function setupLicenseActionButtons() {
    const activateBtn = document.getElementById('activateLicenseBtn');
    const buyBtn = document.getElementById('buyLicenseBtn');
    const requestTrialBtn = document.getElementById('requestTrialBtn');
    const troubleshootingBtn = document.getElementById('troubleshootingBtn');
    const buyFullLicenseBtn = document.getElementById('buyFullLicenseBtn');

    // Botões da barra de licença revogada
    const reactivateBtn = document.getElementById('reactivateLicenseBtn');
    const buyNewBtn = document.getElementById('buyNewLicenseBtn');

    if (activateBtn && !activateBtn.hasListener) {
        activateBtn.hasListener = true;
        activateBtn.addEventListener('click', () => {
            const activationUrl = chrome.runtime.getURL('src/license/license-activation.html');
            window.open(activationUrl, '_blank', 'width=600,height=800');
        });
    }

    if (buyBtn && !buyBtn.hasListener) {
        buyBtn.hasListener = true;
        buyBtn.addEventListener('click', () => {
            // Abrir página de vendas
            window.open('https://nardoto.com.br#planos', '_blank');
        });
    }

    if (requestTrialBtn && !requestTrialBtn.hasListener) {
        requestTrialBtn.hasListener = true;
        requestTrialBtn.addEventListener('click', () => {
            // Abrir WhatsApp para solicitar trial gratuito
            window.open('https://wa.me/5527999132594?text=Olá! Gostaria de solicitar um teste grátis de 3 dias do VEO3 Automator.', '_blank');
        });
    }

    if (buyFullLicenseBtn && !buyFullLicenseBtn.hasListener) {
        buyFullLicenseBtn.hasListener = true;
        buyFullLicenseBtn.addEventListener('click', () => {
            // Abrir página de vendas
            window.open('https://nardoto.com.br#planos', '_blank');
        });
    }

    if (troubleshootingBtn && !troubleshootingBtn.hasListener) {
        troubleshootingBtn.hasListener = true;
        troubleshootingBtn.addEventListener('click', () => {
            const troubleshootingUrl = chrome.runtime.getURL('src/interface/troubleshooting.html');
            window.open(troubleshootingUrl, '_blank');
        });
    }

    // Botão de reativar licença (barra vermelha)
    if (reactivateBtn && !reactivateBtn.hasListener) {
        reactivateBtn.hasListener = true;
        reactivateBtn.addEventListener('click', () => {
            const activationUrl = chrome.runtime.getURL('src/license/license-activation.html');
            window.open(activationUrl, '_blank', 'width=600,height=800');
        });
    }

    // Botão de comprar nova licença (barra vermelha)
    if (buyNewBtn && !buyNewBtn.hasListener) {
        buyNewBtn.hasListener = true;
        buyNewBtn.addEventListener('click', () => {
            // Abrir WhatsApp com mensagem específica para licença revogada
            window.open('https://wa.me/5527999132594?text=Olá! Minha licença do VEO3 Automator foi revogada e gostaria de comprar uma nova licença.', '_blank');
        });
    }
}

/**
 * Configura o painel de configurações
 */
function setupSettingsPanel() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsDelay = document.getElementById('settingsDelay');

    if (settingsBtn && !settingsBtn.hasListener) {
        settingsBtn.hasListener = true;
        settingsBtn.addEventListener('click', () => {
            if (settingsPanel) {
                settingsPanel.classList.toggle('hidden');

                // Atualizar valor do delay
                if (settingsDelay) {
                    const savedDelay = localStorage.getItem('veo3_delay_seconds') || '3';
                    settingsDelay.value = savedDelay;
                }
            }
        });
    }

    if (closeSettingsBtn && !closeSettingsBtn.hasListener) {
        closeSettingsBtn.hasListener = true;
        closeSettingsBtn.addEventListener('click', () => {
            if (settingsPanel) {
                settingsPanel.classList.add('hidden');
            }
        });
    }

    // Salvar delay quando mudar
    if (settingsDelay && !settingsDelay.hasListener) {
        settingsDelay.hasListener = true;
        settingsDelay.addEventListener('change', (e) => {
            const value = e.target.value;
            localStorage.setItem('veo3_delay_seconds', value);

            // Atualizar também o input de delay principal se existir
            const delayInput = document.getElementById('delayInput');
            if (delayInput) {
                delayInput.value = value;
            }
        });
    }
}

// Atualizar indicador periodicamente
setInterval(updateLicenseStatusIndicator, 5000); // Atualiza a cada 5 segundos

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

// --- Find and Replace Functionality (usando módulo compartilhado) ---

let findReplaceManager = null;

function setupFindReplaceListeners() {
    // Usar o módulo compartilhado FindReplaceManager
    if (typeof FindReplaceManager !== 'undefined') {
        findReplaceManager = new FindReplaceManager({
            textareaId: 'inputText',
            findInputId: 'findInput',
            replaceInputId: 'replaceInput',
            findBarId: 'findReplaceBar',
            findPrevBtnId: 'findPrevBtn',
            findNextBtnId: 'findNextBtn',
            replaceBtnId: 'replaceBtn',
            replaceAllBtnId: 'replaceAllBtn',
            closeBtnId: 'closeFindBtn',
            findCountId: 'findCount',
            toggleBtnId: 'findReplaceBtn'
        });
        console.log("✅ Find & Replace Manager inicializado no VEO3 Automator");
    } else {
        console.warn("⚠️ FindReplaceManager não está disponível");
    }
}