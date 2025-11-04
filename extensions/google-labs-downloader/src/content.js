// Configurações
const CONFIG = {
    DELAY_BETWEEN_VIDEOS: 1000,  // Tempo entre downloads (1 segundo)
    MAX_RETRIES: 3,              // Número máximo de tentativas por vídeo
    DEBUG: true,                 // Modo debug para logs detalhados
    WAIT_TIMEOUT: 5000           // Tempo máximo de espera por um elemento (5 segundos)
};

// Sistema de log customizado
const log = {
    info: (...args) => CONFIG.DEBUG && console.log('ℹ️ [Labs-Downloader]', ...args),
    success: (...args) => CONFIG.DEBUG && console.log('✅ [Labs-Downloader]', ...args),
    error: (...args) => CONFIG.DEBUG && console.error('❌ [Labs-Downloader]', ...args),
    warn: (...args) => CONFIG.DEBUG && console.warn('⚠️ [Labs-Downloader]', ...args)
};

// Estado global para controlar o processo de download
let isDownloadProcessRunning = false;
// Estado e observador para o modo de vigilância
let isWatchModeActive = false;
let watchModeObserver = null;
// Estado para pausar e continuar downloads
let processedContainers = new Set();
let downloadedCount = 0;
let isPaused = false;


// Função auxiliar para esperar um tempo específico
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para esperar por um elemento ou condição
async function waitFor(predicate, timeout = CONFIG.WAIT_TIMEOUT, interval = 100) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const result = predicate();
        if (result) return result;
        await sleep(interval);
    }
    log.warn(`A condição de espera não foi atendida após ${timeout}ms`);
    return null;
}

// --- Funções de busca de elementos ---

function findAllVideoContainers() {
    // Usa um seletor de atributo estável ('data-item-index') para encontrar os containers de vídeo.
    // Este seletor é muito mais robusto que classes geradas dinamicamente.
    const containers = Array.from(document.querySelectorAll('[data-item-index]'));
    log.info(`Seletor [data-item-index] encontrou ${containers.length} containers.`);
    return containers.filter(container => container.querySelector('video')); // Garante que só pegamos containers que de fato têm um vídeo.
}

function isVideoProcessing(container) {
    // Verifica se o vídeo ainda está sendo processado (mostra porcentagem)
    const progressElements = container.querySelectorAll('.sc-dd6abb21-0.jvYyvA, .sc-dd6abb21-1.iEQNVH');
    if (progressElements.length > 0) {
        // Verifica se algum elemento contém uma porcentagem
        for (const elem of progressElements) {
            if (elem.textContent && elem.textContent.match(/\d+%/)) {
                return true;
            }
        }
    }
    return false;
}

function findDownloadButton(container) {
    // Primeiro verifica se o vídeo ainda está sendo processado
    if (isVideoProcessing(container)) {
        return null; // Não retorna botão se ainda está processando
    }
    
    // Procura o botão de download dentro de um container específico
    const buttons = Array.from(container.querySelectorAll('button'));
    return buttons.find(btn => {
        const icon = btn.querySelector('i.google-symbols');
        if (icon && icon.textContent.trim() === 'download') return true;

        const span = btn.querySelector('span');
        return span && span.textContent.toLowerCase().includes('baixar');
    });
}

function findResolutionOption() {
    // Procura pela opção de resolução no menu que aparece
    const keywords = ['tamanho original', 'resolução ampliada', '1080p', '720p'];
    const items = Array.from(document.querySelectorAll('[role="menuitem"], button'));
    return items.find(item => {
        const text = (item.textContent || '').toLowerCase().trim();
        return keywords.some(keyword => text.includes(keyword));
    });
}

// --- Lógica de Download ---

async function downloadSingleVideo(container, retryCount = 0) {
    if (!isDownloadProcessRunning) return false; // Verifica se o processo foi interrompido
    if (container.dataset.downloaded === 'true') {
        log.info('Vídeo já foi baixado, pulando.');
        return true;
    }
    
    // Verifica se o vídeo ainda está sendo processado
    if (isVideoProcessing(container)) {
        log.warn('Vídeo ainda está sendo processado (mostrando %), pulando por enquanto.');
        return false;
    }

    if (retryCount >= CONFIG.MAX_RETRIES) {
        log.error('Máximo de tentativas atingido para o vídeo. Pulando.');
        container.dataset.downloadStatus = 'failed';
        return false;
    }

    log.info(`Iniciando download (tentativa ${retryCount + 1}/${CONFIG.MAX_RETRIES})`);

    try {
        const downloadBtn = await waitFor(() => findDownloadButton(container));
        if (!downloadBtn) throw new Error('Botão de download não encontrado.');
        log.success('Botão de download encontrado.');

        // Simula o evento de passar o mouse sobre o container para garantir que o menu de download apareça.
        container.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        await sleep(200); // Pequena pausa para os botões aparecerem

        downloadBtn.click();

        const resolutionOption = await waitFor(findResolutionOption);
        if (!resolutionOption) throw new Error('Opção de resolução não encontrada no menu.');
        log.success(`Opção de resolução encontrada: "${resolutionOption.textContent.trim()}"`);

        resolutionOption.click();
        container.dataset.downloaded = 'true';
        log.success('Download iniciado com sucesso!');
        return true;

    } catch (err) {
        log.error(`Falha na tentativa ${retryCount + 1}: ${err.message}`);
        await sleep(1000); // Espera antes de tentar novamente
        return downloadSingleVideo(container, retryCount + 1);
    }
}

function stopDownloadProcess() {
    isDownloadProcessRunning = false;
    isPaused = true;
    const button = document.getElementById('veo3-auto-download-btn');
    if (button) {
        // Atualiza ícone e texto
        const icon = button.querySelector('i.google-symbols');
        const textSpan = button.querySelector('span');
        if (icon) icon.textContent = 'play_arrow';
        if (textSpan) textSpan.textContent = 'Continuar Download';
        
        button.onclick = downloadAllVideos; // Reatribui a função para permitir continuar
        button.style.background = '#34A853';
        button.style.color = 'white';
        button.style.animation = 'none';
        button.style.transform = 'scale(1)';
    }
    log.warn('O processo de download foi pausado pelo usuário.');
}

async function downloadAllVideos() {
    const button = document.getElementById('veo3-auto-download-btn');
    if (!button) return;

    // Se não estiver pausado, é um novo início, então resetamos o estado.
    if (!isPaused) {
        processedContainers = new Set();
        downloadedCount = 0;
    }

    isDownloadProcessRunning = true;
    isPaused = false;
    
    // Atualiza ícone e texto
    const icon = button.querySelector('i.google-symbols');
    const textSpan = button.querySelector('span');
    if (icon) icon.textContent = 'stop_circle';
    if (textSpan) textSpan.textContent = 'Parar Download';
    
    button.onclick = stopDownloadProcess; // Altera o evento para parar
    button.style.background = '#EA4335';
    button.style.color = 'white';
    button.style.animation = 'veo3-pulse 2s infinite';
    
    log.info('Iniciando processo dinâmico de varredura e download...');

    let stableScrolls = 0;
    const STABILITY_THRESHOLD = 3; // Número de rolagens sem novos vídeos para parar

    // O loop agora verifica se o processo deve continuar
    while (stableScrolls < STABILITY_THRESHOLD && isDownloadProcessRunning) {
        const currentContainers = findAllVideoContainers();
        const newContainers = currentContainers.filter(c => !processedContainers.has(c));

        if (newContainers.length > 0) {
            stableScrolls = 0; // Reseta a contagem de estabilidade
            log.success(`Encontrados ${newContainers.length} novos vídeos.`);

            for (const container of newContainers) {
                if (!isDownloadProcessRunning) break; // Interrompe o loop interno se o processo foi parado

                processedContainers.add(container); // Marca como processado imediatamente
                const totalFound = processedContainers.size;

                log.info(`--- Processando vídeo ${totalFound} ---`);
                updateFloatingButton(downloadedCount, totalFound, 'downloading');

                if (await downloadSingleVideo(container)) {
                    if (isDownloadProcessRunning) downloadedCount++; // Só incrementa se não foi parado
                }
                updateFloatingButton(downloadedCount, totalFound, 'downloading');

                // Pausa entre os downloads para não sobrecarregar o navegador/servidor
                await sleep(CONFIG.DELAY_BETWEEN_VIDEOS);
            }
        } else {
            stableScrolls++;
            log.info(`Nenhum vídeo novo encontrado nesta rolagem. Contagem de estabilidade: ${stableScrolls}/${STABILITY_THRESHOLD}`);
        }

        // Rola para o final da página para carregar mais conteúdo
        window.scrollTo(0, document.body.scrollHeight);
        updateFloatingButton(downloadedCount, processedContainers.size, 'scanning');
        await sleep(1500); // Aguarda MAIS tempo para o carregamento do conteúdo
    }

    if (isDownloadProcessRunning) { // Só mostra mensagem de sucesso se não foi pausado
        log.success(`Processo concluído! ${downloadedCount}/${processedContainers.size} vídeos baixados.`);
        if (button) {
            // Atualiza ícone e texto
            const icon = button.querySelector('i.google-symbols');
            const textSpan = button.querySelector('span');
            if (icon) icon.textContent = 'check_circle';
            if (textSpan) textSpan.textContent = `Concluído (${downloadedCount} vídeos)`;
            
            button.style.background = '#34A853';
            button.style.color = 'white';
            button.style.animation = 'none';
            button.style.cursor = 'default';
            button.disabled = true;
        }
    }
}

// --- Lógica do Modo Vigilância ---

function stopWatchMode() {
    if (watchModeObserver) {
        watchModeObserver.disconnect();
        watchModeObserver = null;
        log.info('Observador do Modo Automático parado.');
    }
    // Desmarca o switch na UI se ele ainda estiver marcado
    const toggle = document.getElementById('veo3-watch-mode-toggle');
    if (toggle) toggle.checked = false;
    isWatchModeActive = false;
}

async function scrollToDiscoverAllVideos() {
    log.info('🔄 Rolando a página para descobrir todos os vídeos...');
    
    let previousCount = 0;
    let stableScrolls = 0;
    const maxStableScrolls = 5;
    
    while (stableScrolls < maxStableScrolls) {
        // Rola até o final da página
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(1500); // Aguarda mais tempo para carregar
        
        const currentCount = findAllVideoContainers().length;
        
        if (currentCount > previousCount) {
            log.info(`📹 Descobertos ${currentCount} containers (${currentCount - previousCount} novos)`);
            previousCount = currentCount;
            stableScrolls = 0; // Reseta se encontrou novos
        } else {
            stableScrolls++;
            log.info(`🔍 Varredura ${stableScrolls}/${maxStableScrolls} - ${currentCount} containers encontrados`);
        }
    }
    
    // Rola de volta ao topo
    window.scrollTo(0, 0);
    await sleep(500);
    
    log.success(`✅ Varredura completa! Total de ${previousCount} containers descobertos.`);
    return previousCount;
}

async function waitForVideosReady(maxWaitTime = 300000) { // 5 minutos máximo
    const startTime = Date.now();
    const checkInterval = 5000; // Verifica a cada 5 segundos
    
    log.info('⏳ Aguardando vídeos ficarem prontos para download...');
    
    // PRIMEIRO: Descobre todos os vídeos rolando a página
    await scrollToDiscoverAllVideos();
    
    // DEPOIS: Verifica se estão prontos
    while (Date.now() - startTime < maxWaitTime) {
        // Rola novamente para garantir que pegou todos
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(1000);
        window.scrollTo(0, 0);
        await sleep(500);
        
        const containers = findAllVideoContainers();
        let readyCount = 0;
        let processingCount = 0;
        
        for (const container of containers) {
            if (isVideoProcessing(container)) {
                processingCount++;
            } else if (findDownloadButton(container)) {
                readyCount++;
            }
        }
        
        log.info(`📊 Status: ${readyCount} prontos | ${processingCount} processando | ${containers.length} total`);
        
        // Se pelo menos metade dos vídeos estão prontos, podemos começar
        if (readyCount > 0 && containers.length > 0) {
            const percentReady = (readyCount / containers.length) * 100;
            if (percentReady >= 50 || readyCount >= 3) {
                log.success(`✅ ${readyCount} vídeos prontos! Iniciando downloads...`);
                return true;
            }
        }
        
        await sleep(checkInterval);
    }
    
    log.warn('⚠️ Tempo máximo de espera atingido. Iniciando mesmo assim...');
    return true;
}

// Função separada para lidar com o processo de espera e download
async function handleAutomationComplete() {
    log.success(`"Automação concluída!" detectado.`);
    
    // Atualiza o botão para mostrar que está esperando
    const mainButton = document.getElementById('veo3-auto-download-btn');
    if (!mainButton) {
        log.warn('Botão principal não encontrado!');
        return;
    }
    
    // Atualiza ícone e texto para o estado de espera
    const icon = mainButton.querySelector('i.google-symbols');
    const textSpan = mainButton.querySelector('span');
    if (icon) icon.textContent = 'hourglass_empty';
    
    mainButton.style.background = '#1a73e8';
    mainButton.style.color = 'white';
    mainButton.disabled = true;
    
    // Aguarda 60 segundos iniciais
    log.info('⏰ Aguardando 60 segundos para os vídeos começarem a processar...');
    let countdown = 60;
    const countdownInterval = setInterval(() => {
        countdown--;
        if (mainButton && textSpan) {
            textSpan.textContent = `Aguardando ${countdown}s...`;
        }
    }, 1000);
    
    await sleep(60000); // 60 segundos
    clearInterval(countdownInterval);
    
    log.success('✅ 60 segundos decorridos. Verificando vídeos prontos...');
    
    // Aguarda até que vídeos estejam prontos
    await waitForVideosReady();
    
    // Restaura o botão e inicia o download
    if (mainButton) {
        mainButton.disabled = false;
        const icon = mainButton.querySelector('i.google-symbols');
        const textSpan = mainButton.querySelector('span');
        if (icon) icon.textContent = 'auto_awesome';
        if (textSpan) textSpan.textContent = 'Baixar Todos os Vídeos';
        mainButton.style.background = 'transparent';
        mainButton.style.color = 'white';
        
        log.info('🚀 Iniciando downloads automaticamente...');
        mainButton.click();
    }
}

function startWatchMode() {
    if (watchModeObserver) return; // Já está rodando

    log.info('Iniciando observador do Modo Automático...');
    watchModeObserver = new MutationObserver(() => {
        // Procura por um elemento que contenha o texto de conclusão
        const statusElement = Array.from(document.querySelectorAll('span, div')).find(
            el => el.textContent.includes('Automação concluída!')
        );

        if (statusElement && !isDownloadProcessRunning) {
            stopWatchMode(); // Para o observador para evitar gatilhos múltiplos
            
            // Chama a função async separadamente para garantir que seja executada
            handleAutomationComplete().catch(err => {
                log.error(`Erro ao processar automação: ${err.message}`);
            });
        }
    });

    watchModeObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

function handleWatchModeChange(event) {
    isWatchModeActive = event.target.checked;
    log.info(`Modo Automático ${isWatchModeActive ? 'ativado' : 'desativado'}.`);
    if (isWatchModeActive) {
        startWatchMode();
    } else {
        stopWatchMode();
    }
}

// --- Interface do Usuário (Botão Flutuante) ---

function updateFloatingButton(current, total, state = 'downloading') {
    const btn = document.getElementById('veo3-auto-download-btn');
    if (btn && isDownloadProcessRunning) {
        const icon = btn.querySelector('i.google-symbols');
        const textSpan = btn.querySelector('span');
        
        if (state === 'scanning') {
            if (icon) icon.textContent = 'search';
            if (textSpan) textSpan.textContent = `Varrendo... (${total} encontrados)`;
        } else {
            if (icon) icon.textContent = 'stop_circle';
            if (textSpan) textSpan.textContent = `Pausar (${current}/${total})`;
        }
    }
}

function findReferenceElement() {
    const buttons = Array.from(document.querySelectorAll('button'));
    // Lista de textos em múltiplas línguas para encontrar o botão de referência
    const referenceTexts = [
        'Criação de cenas',  // Português
        'Scene builder',     // Inglês
        'Scenebuilder',      // Inglês (variação)
        'Generador de escenas',  // Espanhol
        'Créateur de scènes',    // Francês
        'Szenenersteller',       // Alemão
        'シーンビルダー',        // Japonês
        '场景构建器'            // Chinês
    ];

    // Busca pelo botão usando qualquer um dos textos
    const referenceButton = buttons.find(btn => {
        const btnText = btn.textContent.trim();
        return referenceTexts.some(text =>
            btnText.toLowerCase() === text.toLowerCase() ||
            btnText.toLowerCase().includes(text.toLowerCase())
        );
    });

    return referenceButton;
}

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .veo3-controls-wrapper { 
            display: inline-flex; 
            align-items: center; 
            gap: 16px;
            margin-left: 12px;
        }
        
        .veo3-switch-container { 
            display: flex; 
            align-items: center; 
            gap: 8px;
        }
        
        .veo3-switch-label { 
            font-size: 13px; 
            color: #5f6368; 
            font-weight: 500;
            user-select: none;
            font-family: 'Google Sans', Arial, sans-serif;
        }
        
        .veo3-switch { 
            position: relative; 
            display: inline-block; 
            width: 40px; 
            height: 20px; 
        }
        
        .veo3-switch input { opacity: 0; width: 0; height: 0; }
        
        .veo3-slider { 
            position: absolute; 
            cursor: pointer; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            background-color: #dadce0; 
            transition: .3s; 
            border-radius: 20px; 
        }
        
        .veo3-slider:before { 
            position: absolute; 
            content: ""; 
            height: 16px; 
            width: 16px; 
            left: 2px; 
            bottom: 2px; 
            background-color: white; 
            transition: .3s; 
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3);
        }
        
        input:checked + .veo3-slider { background-color: #4285f4; }
        input:checked + .veo3-slider:before { transform: translateX(20px); }
        
        @keyframes veo3-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
    `;
    document.head.appendChild(style);
}

function createWatchModeSwitch() {
    const container = document.createElement('div');
    container.className = 'veo3-switch-container';

    const label = document.createElement('label');
    label.className = 'veo3-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = 'veo3-watch-mode-toggle';
    input.onchange = handleWatchModeChange;

    const slider = document.createElement('span');
    slider.className = 'veo3-slider';

    label.appendChild(input);
    label.appendChild(slider);

    const text = document.createElement('span');
    text.className = 'veo3-switch-label';
    text.textContent = 'Modo Automático';

    container.appendChild(label);
    container.appendChild(text);

    return container;
}

function createFloatingButton() {
    if (document.getElementById('veo3-auto-download-btn')) return;

    const referenceElement = findReferenceElement();
    if (!referenceElement || !referenceElement.parentNode) {
        log.warn('Botão de referência "Criação de cenas" não encontrado. O botão de download não será adicionado.');
        return;
    }

    // Garante que os estilos do switch sejam injetados apenas uma vez
    if (!document.querySelector('style[textContent*=".veo3-switch"]')) {
        injectStyles();
    }
    const btn = document.createElement('button');
    btn.id = 'veo3-auto-download-btn';
    
    // Cria ícone de estrela do Google AI
    const icon = document.createElement('i');
    icon.className = 'google-symbols';
    icon.textContent = 'auto_awesome';
    icon.style.fontSize = '18px';
    icon.style.marginRight = '6px';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = 'Baixar Todos os Vídeos';
    
    btn.appendChild(icon);
    btn.appendChild(textSpan);
    
    // Estilos sem fundo e letras brancas
    Object.assign(btn.style, {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'transparent',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: "'Google Sans', Arial, sans-serif",
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
    });

    btn.onclick = downloadAllVideos;

    // Efeitos de hover aprimorados
    btn.onmouseover = () => { 
        if (!btn.disabled) {
            btn.style.background = 'rgba(255, 255, 255, 0.1)';
        }
    };
    btn.onmouseout = () => { 
        if (!btn.disabled && !isDownloadProcessRunning) {
            btn.style.background = 'transparent';
        }
    };

    // Cria wrapper sem fundo (integrado à página)
    const wrapper = document.createElement('div');
    wrapper.className = 'veo3-controls-wrapper';
    
    const switchElement = createWatchModeSwitch();

    wrapper.appendChild(btn);
    wrapper.appendChild(switchElement);

    // Insere após o elemento de referência
    const parent = referenceElement.parentNode;
    parent.insertBefore(wrapper, referenceElement.nextSibling);

    log.success('Botão de download em massa adicionado à página.');
}

// --- Inicialização ---

function initialize() {
    // Usa um observador para adicionar o botão assim que o elemento de referência aparecer
    const observer = new MutationObserver(() => {
        const referenceElement = findReferenceElement();
        if (referenceElement && !document.getElementById('veo3-auto-download-btn')) {
            createFloatingButton();
            log.success('Botão de download adicionado à página.');
            // Uma vez que o botão foi criado, não precisamos mais observar
            observer.disconnect();
        }
    });

    // Inicia a observação
    observer.observe(document.body, { childList: true, subtree: true });

    // Tenta criar o botão imediatamente caso o elemento de referência já esteja na página
    const referenceElement = findReferenceElement();
    if (referenceElement && !document.getElementById('veo3-auto-download-btn')) {
        createFloatingButton();
        log.success('Botão de download adicionado à página.');
        observer.disconnect();
    }

    log.success('Google Labs Downloader iniciado e pronto.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}