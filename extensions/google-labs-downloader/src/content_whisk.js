// ===================================
// Whisk Image Downloader - Download em massa com nomes corretos
// ===================================

(function() {
    'use strict';

    // Verifica se estamos na página correta do Whisk
    if (!window.location.href.includes('whisk')) {
        return; // Sai se não for página do Whisk
    }

    // Configurações
    const WHISK_CONFIG = {
        DELAY_BETWEEN_DOWNLOADS: 200,  // Tempo entre downloads (0.2 segundos)
        DEBUG: true,                   // Modo debug para logs detalhados
        WAIT_TIMEOUT: 3000,            // Tempo máximo de espera por elemento
        AUTO_RENAME: true              // Renomear automaticamente baseado no prompt
    };

    // Sistema de log customizado
    const whiskLog = {
        info: (...args) => WHISK_CONFIG.DEBUG && console.log('ℹ️ [Whisk-Downloader]', ...args),
        success: (...args) => WHISK_CONFIG.DEBUG && console.log('✅ [Whisk-Downloader]', ...args),
        error: (...args) => WHISK_CONFIG.DEBUG && console.error('❌ [Whisk-Downloader]', ...args),
        warn: (...args) => WHISK_CONFIG.DEBUG && console.warn('⚠️ [Whisk-Downloader]', ...args)
    };

    // Estado global
    let isWhiskDownloadRunning = false;
    let whiskDownloadedCount = 0;
    let whiskFailedCount = 0;
    let whiskTotalImages = 0;
    let whiskProcessedImages = new Set();

    // Função auxiliar para esperar
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Função para atualizar o painel de estatísticas
    function updateWhiskStats(current, total, failed = 0) {
        // Mostra o painel de estatísticas
        const statsDiv = document.getElementById('whisk-stats');
        const initialInfo = document.getElementById('whisk-initial-info');

        if (statsDiv && !statsDiv.classList.contains('active')) {
            statsDiv.classList.add('active');
            if (initialInfo) initialInfo.style.display = 'none';
        }

        // Atualiza valores
        const totalEl = document.getElementById('whisk-total-images');
        const downloadedEl = document.getElementById('whisk-downloaded');
        const failedEl = document.getElementById('whisk-failed');
        const progressFill = document.getElementById('whisk-progress-fill');
        const progressText = document.getElementById('whisk-progress-text');

        if (totalEl) totalEl.textContent = total;
        if (downloadedEl) downloadedEl.textContent = current;
        if (failedEl) failedEl.textContent = failed;

        // Calcula e atualiza progresso
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;

            if (isWhiskDownloadRunning) {
                progressFill.classList.add('loading');
                progressFill.classList.remove('complete');
            } else if (percentage === 100) {
                progressFill.classList.add('complete');
                progressFill.classList.remove('loading');
            }
        }

        if (progressText) {
            if (isWhiskDownloadRunning) {
                progressText.textContent = `${percentage}% - Baixando...`;
            } else if (percentage === 100) {
                progressText.textContent = '✅ Download concluído!';
            } else {
                progressText.textContent = `${percentage}% concluído`;
            }
        }

        // Atualiza ícone de status no título
        const statusIcon = document.querySelector('.whisk-info-panel .whisk-status-icon');
        if (statusIcon) {
            statusIcon.classList.remove('ready', 'downloading', 'complete');
            if (isWhiskDownloadRunning) {
                statusIcon.classList.add('downloading');
            } else if (percentage === 100) {
                statusIcon.classList.add('complete');
            } else {
                statusIcon.classList.add('ready');
            }
        }
    }

    // Função para resetar estatísticas
    function resetWhiskStats() {
        whiskDownloadedCount = 0;
        whiskFailedCount = 0;
        whiskTotalImages = 0;

        const statsDiv = document.getElementById('whisk-stats');
        const initialInfo = document.getElementById('whisk-initial-info');

        if (statsDiv) {
            statsDiv.classList.remove('active');
            if (initialInfo) initialInfo.style.display = 'block';
        }
    }

    // Função para limpar nome de arquivo
    function sanitizeFileName(text) {
        // Remove caracteres inválidos para nomes de arquivo
        return text
            .replace(/[<>:"/\\|?*]/g, '')  // Remove caracteres inválidos
            .replace(/\s+/g, '_')           // Substitui espaços por underscore
            .replace(/_{2,}/g, '_')         // Remove underscores duplicados
            .replace(/^_|_$/g, '')          // Remove underscores no início/fim
            .substring(0, 100);             // Limita a 100 caracteres
    }

    // Função para extrair o prompt clicando na imagem
    async function extractPromptFromImage(imageContainer) {
        try {
            // Encontra QUALQUER imagem no container
            const imgElement = imageContainer.querySelector('img');

            if (!imgElement) {
                whiskLog.warn('Imagem não encontrada no container');
                return `image_${Date.now()}`;
            }

            whiskLog.info('Clicando na imagem para abrir o modal...');

            // Clica diretamente na imagem
            imgElement.click();

            // Aguarda o modal aparecer
            await sleep(300);

            // Verifica se o modal abriu procurando o dialog
            const modal = document.querySelector('div[role="dialog"], div.sc-8e0ee53d-1');

            if (!modal) {
                whiskLog.warn('Modal não abriu, tentando clicar novamente...');
                // Tenta clicar no container pai se a imagem não funcionou
                const parentButton = imageContainer.closest('button, div[role="button"]');
                if (parentButton) {
                    parentButton.click();
                    await sleep(300);
                }
            }

            // Procura o textarea com o prompt
            const promptTextarea = document.querySelector('#prompt-editor');

            if (promptTextarea && promptTextarea.value) {
                const promptText = promptTextarea.value.trim();

                whiskLog.info(`Prompt encontrado: ${promptText.substring(0, 50)}...`);

                // Fecha o modal - procura especificamente o botão de fechar
                const closeButton = document.querySelector('button[aria-label="Fechar este modal"], button[aria-label*="close" i], button[aria-label*="fechar" i], button.sc-8e0ee53d-2');

                if (closeButton) {
                    whiskLog.info('Fechando modal via botão...');
                    closeButton.click();
                } else {
                    // Se não encontrar o botão, tenta ESC
                    whiskLog.info('Fechando modal via ESC...');
                    const escEvent = new KeyboardEvent('keydown', {
                        key: 'Escape',
                        keyCode: 27,
                        code: 'Escape',
                        which: 27,
                        bubbles: true,
                        cancelable: true
                    });
                    document.dispatchEvent(escEvent);
                }

                await sleep(200);

                // Extrai apenas a parte inicial do prompt (PARTE X Y: descrição)
                let cleanPrompt = '';

                // Procura por padrões como "PARTE X Y:" ou similar
                const parteMatch = promptText.match(/^(PARTE\s+\d+\s+\d+:\s*[^,]+)/i);

                if (parteMatch) {
                    // Se encontrou "PARTE X Y: descrição", usa isso
                    cleanPrompt = parteMatch[1];
                } else {
                    // Se não tem "PARTE", pega os primeiros 50 caracteres até a primeira vírgula
                    const firstPart = promptText.split(',')[0];
                    cleanPrompt = firstPart.substring(0, 50);
                }

                // Limpa o prompt para ser usado como nome de arquivo
                cleanPrompt = cleanPrompt
                    .replace(/:/g, '')  // Remove dois pontos
                    .replace(/\s+/g, '_')  // Substitui espaços por underscore
                    .replace(/[<>:"/\\|?*]/g, '')  // Remove caracteres inválidos
                    .replace(/_{2,}/g, '_')  // Remove underscores duplicados
                    .replace(/^_|_$/g, '')  // Remove underscores no início/fim
                    .trim();

                const finalPrompt = cleanPrompt || `image_${Date.now()}`;

                whiskLog.success(`Prompt extraído e limpo: ${finalPrompt}`);
                return finalPrompt;
            } else {
                whiskLog.warn('Textarea #prompt-editor não encontrado ou vazio');
            }

            // Se não encontrou o textarea, tenta fechar qualquer modal aberto
            const escEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                keyCode: 27,
                code: 'Escape',
                which: 27,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(escEvent);

            return `image_${Date.now()}`;
        } catch (error) {
            whiskLog.error('Erro ao extrair prompt:', error);
            // Tenta fechar qualquer modal aberto em caso de erro
            const escEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                keyCode: 27,
                code: 'Escape',
                which: 27,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(escEvent);
            return `image_${Date.now()}`;
        }
    }

    // Função para encontrar todos os containers de imagem
    function findAllWhiskImageContainers() {
        whiskLog.info('🔍 Buscando TODOS os containers de imagem no DOM...');

        // Busca TODOS os containers, independente se têm imagem carregada ou não
        const allContainers = Array.from(document.querySelectorAll('div.sc-12e568c9-0, div.dKRdkO'));

        whiskLog.info(`📦 Total de containers encontrados: ${allContainers.length}`);

        // NÃO filtra mais! Retorna TODOS os containers
        // As imagens serão carregadas quando rolarmos até cada container

        // IMPORTANTE: Reverte o array para processar de baixo para cima (mais recentes primeiro)
        allContainers.reverse();
        whiskLog.info('🔄 Array revertido - processando de baixo para cima (mais recentes primeiro)');

        return allContainers;
    }


    // Função para baixar uma imagem com nome customizado
    async function downloadWhiskImage(imageContainer, customName) {
        try {
            // Aguarda a tag <img> aparecer no container
            let img = imageContainer.querySelector('img');
            let imgAttempts = 0;

            while (!img && imgAttempts < 20) {
                whiskLog.info(`⏳ Aguardando tag <img> aparecer... (tentativa ${imgAttempts + 1}/20)`);
                await sleep(150);
                img = imageContainer.querySelector('img');
                imgAttempts++;
            }

            if (!img) {
                whiskLog.error('❌ Tag <img> não apareceu após 3 segundos');
                return false;
            }

            whiskLog.success('✅ Tag <img> encontrada!');

            // Aguarda a blob URL carregar na imagem
            let blobAttempts = 0;
            while ((!img.src || !img.src.startsWith('blob:')) && blobAttempts < 20) {
                whiskLog.info(`⏳ Aguardando blob URL carregar... (tentativa ${blobAttempts + 1}/20)`);
                await sleep(150);
                blobAttempts++;
            }

            if (!img.src || !img.src.startsWith('blob:')) {
                whiskLog.error(`❌ Blob URL não carregou após 3 segundos. Src atual: ${img.src || 'vazio'}`);
                return false;
            }

            whiskLog.success('✅ Blob URL carregada!');

            // Marca como processada
            imageContainer.classList.add('whisk-downloader-processed');

            // Obtém a URL da imagem
            const imageUrl = img.src;
            whiskLog.info(`Baixando imagem: ${imageUrl.substring(0, 60)}...`);

            // Faz o download usando fetch
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Determina a extensão do arquivo
            const contentType = blob.type;
            let extension = '.jpg'; // Padrão
            if (contentType.includes('png')) extension = '.png';
            else if (contentType.includes('webp')) extension = '.webp';
            else if (contentType.includes('gif')) extension = '.gif';

            // Cria o nome do arquivo
            const fileName = `${sanitizeFileName(customName)}${extension}`;

            // Cria um link temporário para download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            whiskLog.success(`Imagem baixada: ${fileName}`);

            // Adiciona indicador visual de download concluído
            imageContainer.style.opacity = '0.6';
            imageContainer.style.border = '3px solid #34A853';

            return true;
        } catch (error) {
            whiskLog.error('Erro ao baixar imagem:', error);
            return false;
        }
    }


    // Função para processar todas as imagens
    async function downloadAllWhiskImages() {
        if (isWhiskDownloadRunning) {
            whiskLog.warn('Download já está em andamento');
            return;
        }

        // Reset stats
        resetWhiskStats();

        isWhiskDownloadRunning = true;
        whiskDownloadedCount = 0;
        whiskFailedCount = 0;
        whiskProcessedImages.clear();

        // IMPORTANTE: Remove todas as marcações de imagens processadas para permitir re-download
        document.querySelectorAll('.whisk-downloader-processed').forEach(el => {
            el.classList.remove('whisk-downloader-processed');
            el.style.opacity = '';
            el.style.border = '';
        });
        whiskLog.info('Marcações de imagens processadas removidas - todas as imagens serão processadas');

        const button = document.getElementById('whisk-download-btn');
        if (button) {
            updateWhiskButtonState(button, 'downloading');
            button.querySelector('span').textContent = 'Processando imagens...';
        }

        whiskLog.info('Iniciando download em massa das imagens...');

        // Busca TODOS os containers (mesmo que as imagens não tenham blob URL ainda)
        const imageContainers = findAllWhiskImageContainers();
        whiskTotalImages = imageContainers.length;

        if (whiskTotalImages === 0) {
            whiskLog.warn('Nenhuma imagem encontrada na página');
            isWhiskDownloadRunning = false;
            if (button) updateWhiskButtonState(button, 'no-images');
            return;
        }

        whiskLog.info(`Processando ${whiskTotalImages} imagens...`);

        // Atualiza estatísticas iniciais
        updateWhiskStats(0, whiskTotalImages, 0);

        // Processa cada imagem
        for (let i = 0; i < imageContainers.length; i++) {
            if (!isWhiskDownloadRunning) {
                whiskLog.warn('Download cancelado pelo usuário');
                break;
            }

            const container = imageContainers[i];

            whiskLog.info(`\n========================================`);
            whiskLog.info(`📍 PROCESSANDO CONTAINER [${i + 1}/${whiskTotalImages}]`);
            whiskLog.info(`========================================`);

            // Garante que a imagem está visível (scroll até ela)
            whiskLog.info('📜 Rolando até o container...');
            container.scrollIntoView({ behavior: 'auto', block: 'center' });
            await sleep(400); // Espera para lazy loading

            // Extrai o prompt clicando na imagem (isso também força o carregamento)
            whiskLog.info('📝 Extraindo prompt da imagem...');
            const prompt = await extractPromptFromImage(container);
            const customName = `${sanitizeFileName(prompt)}`;

            whiskLog.info(`💾 Nome: ${customName}`);
            whiskLog.info('⏬ Iniciando download...');

            // Baixa a imagem com o nome correto
            const success = await downloadWhiskImage(container, customName);

            if (success) {
                whiskDownloadedCount++;
                whiskProcessedImages.add(container);
                whiskLog.success(`✅ [${i + 1}/${whiskTotalImages}] Download concluído!`);
            } else {
                whiskFailedCount++;
                whiskLog.error(`❌ [${i + 1}/${whiskTotalImages}] Download falhou!`);
            }

            // Atualiza estatísticas em tempo real
            updateWhiskStats(whiskDownloadedCount, whiskTotalImages, whiskFailedCount);

            // Atualiza o botão com progresso
            if (button) {
                const progress = Math.round((i + 1) / whiskTotalImages * 100);
                button.querySelector('span').textContent = `Baixando... ${progress}%`;
            }

            // Delay entre downloads
            if (i < imageContainers.length - 1) {
                await sleep(WHISK_CONFIG.DELAY_BETWEEN_DOWNLOADS);
            }
        }

        isWhiskDownloadRunning = false;

        // Atualização final das estatísticas
        updateWhiskStats(whiskDownloadedCount, whiskTotalImages, whiskFailedCount);

        whiskLog.success(`Download concluído! ${whiskDownloadedCount} de ${whiskTotalImages} imagens baixadas.`);

        if (button) {
            updateWhiskButtonState(button, 'completed', whiskDownloadedCount);
        }
    }

    // Função para atualizar estado do botão
    function updateWhiskButtonState(button, state, count = 0) {
        const icon = button.querySelector('i');
        const text = button.querySelector('span');

        switch(state) {
            case 'downloading':
                icon.textContent = 'stop_circle';
                text.textContent = 'Clique para cancelar';
                button.style.background = '#EA4335';
                button.disabled = false;
                button.title = 'Clique para cancelar o download';
                break;
            case 'completed':
                icon.textContent = 'check_circle';
                text.textContent = `Concluído (${count} imagens)`;
                button.style.background = '#34A853';
                button.disabled = false;
                button.title = 'Download concluído!';
                break;
            case 'no-images':
                icon.textContent = 'image_not_supported';
                text.textContent = 'Nenhuma imagem encontrada';
                button.style.background = '#FFA500';
                button.disabled = false;
                button.title = 'Nenhuma imagem foi encontrada na página';
                break;
            default:
                icon.textContent = 'download';
                text.textContent = 'Baixar Todas as Imagens';
                button.style.background = '#FFD700';
                button.style.color = '#000000';
                button.disabled = false;
                button.title = 'Clique para iniciar o download de todas as imagens';
        }
    }

    // Função para criar interface
    function createWhiskInterface() {
        if (document.getElementById('whisk-downloader-container')) {
            whiskLog.info('Interface já existe');
            return;
        }

        // Injeta estilos
        const style = document.createElement('style');
        style.textContent = `
            #whisk-downloader-container {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                font-family: 'Google Sans', Arial, sans-serif;
            }

            #whisk-download-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: #FFD700;
                color: #000000;
                border: none;
                border-radius: 24px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                white-space: nowrap;
            }

            #whisk-download-btn:hover:not(:disabled) {
                transform: scale(1.05);
                box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            }

            #whisk-download-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            #whisk-download-btn i {
                font-family: 'Material Icons' !important;
                font-size: 20px;
            }

            .whisk-info-panel {
                background: white;
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                font-size: 12px;
                width: 280px;
            }

            .whisk-info-panel h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #1a73e8;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .whisk-info-panel p {
                margin: 6px 0;
                color: #5f6368;
                line-height: 1.4;
            }

            .whisk-stats {
                display: none;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid #e8eaed;
            }

            .whisk-stats.active {
                display: block;
            }

            .whisk-stat-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                align-items: center;
            }

            .whisk-stat-label {
                color: #5f6368;
                font-weight: 500;
            }

            .whisk-stat-value {
                color: #202124;
                font-weight: 600;
            }

            .whisk-progress-container {
                margin: 12px 0;
            }

            .whisk-progress-bar {
                width: 100%;
                height: 8px;
                background: #e8eaed;
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }

            .whisk-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #1a73e8, #4285f4);
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
            }

            .whisk-progress-fill.complete {
                background: linear-gradient(90deg, #0d652d, #34a853);
            }

            .whisk-progress-text {
                text-align: center;
                margin-top: 6px;
                font-size: 11px;
                color: #5f6368;
                font-weight: 500;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            @keyframes shimmer {
                0% { background-position: -200px 0; }
                100% { background-position: 200px 0; }
            }

            .whisk-progress-fill.loading {
                background: linear-gradient(90deg, #1a73e8 25%, #4285f4 50%, #1a73e8 75%);
                background-size: 200px 100%;
                animation: shimmer 1.5s infinite;
            }

            .whisk-downloader-processed {
                position: relative;
            }

            .whisk-downloader-processed::after {
                content: '✓';
                position: absolute;
                top: 10px;
                right: 10px;
                background: #34A853;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                z-index: 1000;
            }

            .whisk-status-icon {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 6px;
            }

            .whisk-status-icon.ready {
                background: #e8f0fe;
            }

            .whisk-status-icon.downloading {
                background: #fef7e0;
            }

            .whisk-status-icon.complete {
                background: #e6f4ea;
            }
        `;
        document.head.appendChild(style);

        // Cria container principal
        const container = document.createElement('div');
        container.id = 'whisk-downloader-container';

        // Cria botão principal
        const button = document.createElement('button');
        button.id = 'whisk-download-btn';

        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = 'download';

        const text = document.createElement('span');
        text.textContent = 'Baixar Todas as Imagens';

        button.appendChild(icon);
        button.appendChild(text);

        button.onclick = function() {
            if (isWhiskDownloadRunning) {
                // Se estiver rodando, cancela
                isWhiskDownloadRunning = false;
                whiskLog.warn('Download cancelado pelo usuário');
                updateWhiskButtonState(button, 'default');
            } else {
                // Se não estiver rodando, inicia
                downloadAllWhiskImages();
            }
        };

        // Cria painel de informações
        const infoPanel = document.createElement('div');
        infoPanel.className = 'whisk-info-panel';
        infoPanel.id = 'whisk-info-panel';
        infoPanel.innerHTML = `
            <h4>
                <span class="whisk-status-icon ready"></span>
                Whisk Downloader
            </h4>
            <div id="whisk-initial-info">
                <p>• Clique para baixar todas as imagens</p>
                <p>• Nomes baseados nos prompts</p>
                <p>• Download automático em sequência</p>
            </div>
            <div id="whisk-stats" class="whisk-stats">
                <div class="whisk-stat-row">
                    <span class="whisk-stat-label">Total de imagens:</span>
                    <span class="whisk-stat-value" id="whisk-total-images">0</span>
                </div>
                <div class="whisk-stat-row">
                    <span class="whisk-stat-label">Baixadas:</span>
                    <span class="whisk-stat-value" id="whisk-downloaded">0</span>
                </div>
                <div class="whisk-stat-row">
                    <span class="whisk-stat-label">Falharam:</span>
                    <span class="whisk-stat-value" id="whisk-failed">0</span>
                </div>
                <div class="whisk-progress-container">
                    <div class="whisk-progress-bar">
                        <div class="whisk-progress-fill" id="whisk-progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="whisk-progress-text" id="whisk-progress-text">0% concluído</div>
                </div>
            </div>
        `;

        container.appendChild(button);
        container.appendChild(infoPanel);

        document.body.appendChild(container);

        // Adiciona ícones do Google Material Icons se não existir
        if (!document.querySelector('link[href*="Material+Icons"]')) {
            const iconLink = document.createElement('link');
            iconLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            iconLink.rel = 'stylesheet';
            document.head.appendChild(iconLink);
        }

        whiskLog.success('Interface Whisk Downloader criada com sucesso!');
    }

    // Função para detectar mudanças na página (SPA)
    function observeWhiskPageChanges() {
        const observer = new MutationObserver((mutations) => {
            // Verifica se houve mudanças significativas na página
            const hasSignificantChanges = mutations.some(mutation =>
                mutation.addedNodes.length > 0 &&
                Array.from(mutation.addedNodes).some(node =>
                    node.nodeName === 'IMG' ||
                    (node.querySelector && node.querySelector('img'))
                )
            );

            if (hasSignificantChanges) {
                whiskLog.info('Novas imagens detectadas na página');
                // Reseta o estado das imagens processadas quando novas imagens aparecem
                document.querySelectorAll('.whisk-downloader-processed').forEach(el => {
                    el.classList.remove('whisk-downloader-processed');
                });
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        whiskLog.info('Observador de mudanças na página ativado');
    }

    // Inicialização
    function initializeWhisk() {
        whiskLog.info('Inicializando Whisk Image Downloader...');

        // Aguarda um pouco para a página carregar completamente
        setTimeout(() => {
            createWhiskInterface();
            observeWhiskPageChanges();

            // Análise inicial da página
            const images = findAllWhiskImageContainers();
            whiskLog.info(`Página carregada com ${images.length} imagens disponíveis`);
        }, 2000);
    }

    // Inicia quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWhisk);
    } else {
        initializeWhisk();
    }

    whiskLog.success('Script Whisk Image Downloader carregado!');

})(); // Fecha o IIFE