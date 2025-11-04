// ===================================
// Whisk Image Downloader ENHANCED - Versão com anti-duplicatas e download individual
// ===================================
// Novas funcionalidades:
// 1. Opção para não baixar imagens com prompt repetido (baixar apenas uma)
// 2. Botão individual em cada imagem para download independente
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
        AUTO_RENAME: true,             // Renomear automaticamente baseado no prompt
        SKIP_DUPLICATES: true          // 🆕 NOVA: Pular imagens com prompt duplicado
    };

    // Sistema de log customizado
    const whiskLog = {
        info: (...args) => WHISK_CONFIG.DEBUG && console.log('ℹ️ [Whisk-Enhanced]', ...args),
        success: (...args) => WHISK_CONFIG.DEBUG && console.log('✅ [Whisk-Enhanced]', ...args),
        error: (...args) => WHISK_CONFIG.DEBUG && console.error('❌ [Whisk-Enhanced]', ...args),
        warn: (...args) => WHISK_CONFIG.DEBUG && console.warn('⚠️ [Whisk-Enhanced]', ...args)
    };

    // Estado global
    let isWhiskDownloadRunning = false;
    let whiskDownloadedCount = 0;
    let whiskFailedCount = 0;
    let whiskSkippedCount = 0; // 🆕 Contador de imagens puladas por duplicação
    let whiskTotalImages = 0;
    let whiskProcessedImages = new Set();
    let downloadedPrompts = new Map(); // 🆕 Armazena prompts já baixados

    // Função auxiliar para esperar
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Função para atualizar o painel de estatísticas
    function updateWhiskStats(current, total, failed = 0, skipped = 0) {
        // Mostra o painel de estatísticas
        const statsDiv = document.getElementById('whisk-stats');

        if (statsDiv && !statsDiv.classList.contains('active')) {
            statsDiv.classList.add('active');
        }

        // Atualiza valores
        const totalEl = document.getElementById('whisk-total-images');
        const downloadedEl = document.getElementById('whisk-downloaded');
        const failedEl = document.getElementById('whisk-failed');
        const skippedEl = document.getElementById('whisk-skipped'); // 🆕
        const progressFill = document.getElementById('whisk-progress-fill');
        const progressText = document.getElementById('whisk-progress-text');

        if (totalEl) totalEl.textContent = total;
        if (downloadedEl) downloadedEl.textContent = current;
        if (failedEl) failedEl.textContent = failed;
        if (skippedEl) skippedEl.textContent = skipped; // 🆕

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
        whiskSkippedCount = 0; // 🆕
        whiskTotalImages = 0;
        downloadedPrompts.clear(); // 🆕 Limpa prompts baixados

        const statsDiv = document.getElementById('whisk-stats');

        if (statsDiv) {
            statsDiv.classList.remove('active');
        }
    }

    // Função para limpar nome de arquivo
    function sanitizeFileName(text) {
        // Remove APENAS caracteres inválidos, mantém espaços e texto original
        return text
            .replace(/[<>:"/\\|?*]/g, '')  // Remove caracteres inválidos do Windows
            .trim();                        // Remove espaços no início/fim
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

                // Extrai o prompt completo (mínimo 50 caracteres)
                let cleanPrompt = promptText;

                // Se o prompt for muito curto, pega pelo menos 50 caracteres
                if (cleanPrompt.length < 50) {
                    // Pega os primeiros 50 caracteres
                    cleanPrompt = promptText.substring(0, 50);
                } else {
                    // Pega os primeiros 50 caracteres ou até a primeira vírgula (o que for maior)
                    const firstCommaIndex = promptText.indexOf(',');
                    if (firstCommaIndex > 50) {
                        cleanPrompt = promptText.substring(0, firstCommaIndex);
                    } else if (firstCommaIndex > 0) {
                        cleanPrompt = promptText.substring(0, 50);
                    } else {
                        cleanPrompt = promptText.substring(0, 50);
                    }
                }

                // Limpa APENAS caracteres inválidos, mantém espaços
                const finalPrompt = sanitizeFileName(cleanPrompt) || `image_${Date.now()}`;

                whiskLog.success(`Prompt extraído: ${finalPrompt}`);
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

        // IMPORTANTE: Reverte o array para processar de baixo para cima (mais recentes primeiro)
        allContainers.reverse();
        whiskLog.info('🔄 Array revertido - processando de baixo para cima (mais recentes primeiro)');

        return allContainers;
    }

    // 🆕 NOVA FUNÇÃO: Baixar uma única imagem (usada pelo botão individual)
    async function downloadSingleWhiskImage(imageContainer) {
        try {
            whiskLog.info('📸 Download individual iniciado...');

            // Garante que a imagem está visível
            imageContainer.scrollIntoView({ behavior: 'auto', block: 'center' });
            await sleep(400);

            // Extrai o prompt
            const prompt = await extractPromptFromImage(imageContainer);
            const customName = sanitizeFileName(prompt);

            whiskLog.info(`💾 Nome: ${customName}`);

            // Baixa a imagem
            const success = await downloadWhiskImage(imageContainer, customName);

            if (success) {
                whiskLog.success(`✅ Imagem baixada com sucesso!`);
                // Adiciona badge de sucesso
                addDownloadBadge(imageContainer, 'success');
            } else {
                whiskLog.error(`❌ Falha ao baixar imagem`);
                addDownloadBadge(imageContainer, 'error');
            }

            return success;
        } catch (error) {
            whiskLog.error('Erro no download individual:', error);
            addDownloadBadge(imageContainer, 'error');
            return false;
        }
    }

    // 🆕 NOVA FUNÇÃO: Adicionar badge de status no container
    function addDownloadBadge(container, status) {
        // Remove badge anterior se existir
        const existingBadge = container.querySelector('.whisk-download-badge');
        if (existingBadge) existingBadge.remove();

        const badge = document.createElement('div');
        badge.className = `whisk-download-badge ${status}`;
        badge.textContent = status === 'success' ? '✓ Baixado' : '✗ Erro';
        container.appendChild(badge);

        // Remove badge após 3 segundos
        setTimeout(() => badge.remove(), 3000);
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

    // Função para processar todas as imagens (com opção de pular duplicatas)
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
        whiskSkippedCount = 0; // 🆕
        whiskProcessedImages.clear();

        // IMPORTANTE: Remove todas as marcações de imagens processadas para permitir re-download
        document.querySelectorAll('.whisk-downloader-processed').forEach(el => {
            el.classList.remove('whisk-downloader-processed');
            el.style.opacity = '';
            el.style.border = '';
        });
        whiskLog.info('Marcações de imagens processadas removidas - todas as imagens serão processadas');

        const button = document.getElementById('whisk-download-btn-inline');
        if (button) {
            updateWhiskButtonState(button, 'downloading');
        }

        whiskLog.info('Iniciando download em massa das imagens...');

        // 🆕 Verifica se modo anti-duplicatas está ativo
        const skipDuplicates = WHISK_CONFIG.SKIP_DUPLICATES;
        if (skipDuplicates) {
            whiskLog.info('🔄 Modo anti-duplicatas ATIVADO - pulando prompts repetidos');
        }

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
        updateWhiskStats(0, whiskTotalImages, 0, 0);

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

            // 🆕 VERIFICA SE PROMPT JÁ FOI BAIXADO
            if (skipDuplicates && downloadedPrompts.has(customName)) {
                whiskSkippedCount++;
                whiskLog.warn(`⏭️ PULANDO - Prompt já foi baixado: ${customName}`);
                whiskLog.info(`📊 Total pulado: ${whiskSkippedCount}`);

                // Adiciona indicador visual de pulado
                container.style.opacity = '0.4';
                container.style.border = '3px solid #FFA500';

                // Atualiza estatísticas
                updateWhiskStats(whiskDownloadedCount, whiskTotalImages, whiskFailedCount, whiskSkippedCount);

                // Atualiza o botão com progresso
                if (button) {
                    const progress = Math.round((i + 1) / whiskTotalImages * 100);
                    button.querySelector('span').textContent = `Baixando... ${progress}%`;
                }

                // Continua para próxima imagem
                continue;
            }

            whiskLog.info(`💾 Nome: ${customName}`);
            whiskLog.info('⏬ Iniciando download...');

            // Baixa a imagem com o nome correto
            const success = await downloadWhiskImage(container, customName);

            if (success) {
                whiskDownloadedCount++;
                whiskProcessedImages.add(container);
                downloadedPrompts.set(customName, true); // 🆕 Registra prompt como baixado
                whiskLog.success(`✅ [${i + 1}/${whiskTotalImages}] Download concluído!`);
            } else {
                whiskFailedCount++;
                whiskLog.error(`❌ [${i + 1}/${whiskTotalImages}] Download falhou!`);
            }

            // Atualiza estatísticas em tempo real
            updateWhiskStats(whiskDownloadedCount, whiskTotalImages, whiskFailedCount, whiskSkippedCount);

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
        updateWhiskStats(whiskDownloadedCount, whiskTotalImages, whiskFailedCount, whiskSkippedCount);

        whiskLog.success(`Download concluído! ${whiskDownloadedCount} de ${whiskTotalImages} imagens baixadas (${whiskSkippedCount} puladas por duplicação).`);

        if (button) {
            updateWhiskButtonState(button, 'completed', whiskDownloadedCount);
        }
    }

    // Função para atualizar estado do botão
    function updateWhiskButtonState(button, state, count = 0) {
        if (!button) return;

        const icon = button.querySelector('i');
        const text = button.querySelector('span');

        // Remove classes de estado
        button.classList.remove('downloading', 'completed', 'no-images');

        switch(state) {
            case 'downloading':
                icon.textContent = 'stop_circle';
                text.textContent = 'Cancelar Download';
                button.classList.add('downloading');
                button.disabled = false;
                button.title = 'Clique para cancelar o download';
                break;
            case 'completed':
                icon.textContent = 'check_circle';
                text.textContent = `Concluído (${count})`;
                button.classList.add('completed');
                button.disabled = false;
                button.title = 'Download concluído!';
                break;
            case 'no-images':
                icon.textContent = 'image_not_supported';
                text.textContent = 'Nenhuma imagem';
                button.classList.add('no-images');
                button.disabled = false;
                button.title = 'Nenhuma imagem foi encontrada na página';
                break;
            default:
                icon.textContent = 'download';
                text.textContent = 'Baixar Todas as Imagens';
                button.disabled = false;
                button.title = 'Clique para iniciar o download de todas as imagens';
        }
    }

    // 🆕 NOVA FUNÇÃO: Criar botão individual de download em cada imagem
    function addIndividualDownloadButtons() {
        whiskLog.info('🔘 Adicionando botões individuais de download...');

        const containers = findAllWhiskImageContainers();

        containers.forEach((container, index) => {
            // Não adiciona se já existe
            if (container.querySelector('.whisk-individual-download-btn')) {
                return;
            }

            // Cria botão flutuante
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'whisk-individual-download-btn';
            downloadBtn.innerHTML = '<i class="material-icons">download</i>';
            downloadBtn.title = 'Baixar esta imagem';

            downloadBtn.onclick = async (e) => {
                e.stopPropagation(); // Evita abrir o modal
                e.preventDefault();

                // Muda estado do botão
                downloadBtn.classList.add('downloading');
                downloadBtn.innerHTML = '<i class="material-icons">hourglass_empty</i>';
                downloadBtn.disabled = true;

                // Faz o download
                const success = await downloadSingleWhiskImage(container);

                // Restaura botão
                setTimeout(() => {
                    downloadBtn.classList.remove('downloading');
                    downloadBtn.innerHTML = '<i class="material-icons">download</i>';
                    downloadBtn.disabled = false;
                }, 2000);
            };

            // Adiciona ao container
            container.style.position = 'relative';
            container.appendChild(downloadBtn);
        });

        whiskLog.success(`✅ ${containers.length} botões individuais adicionados!`);
    }

    // 🆕 NOVA FUNÇÃO: Toggle do modo anti-duplicatas
    function toggleSkipDuplicates() {
        WHISK_CONFIG.SKIP_DUPLICATES = !WHISK_CONFIG.SKIP_DUPLICATES;

        const checkbox = document.getElementById('whisk-skip-duplicates-checkbox');
        if (checkbox) {
            checkbox.checked = WHISK_CONFIG.SKIP_DUPLICATES;
        }

        const statusText = document.getElementById('whisk-duplicate-status');
        if (statusText) {
            statusText.textContent = WHISK_CONFIG.SKIP_DUPLICATES ? 'Ativado' : 'Desativado';
            statusText.style.color = WHISK_CONFIG.SKIP_DUPLICATES ? '#34A853' : '#EA4335';
        }

        whiskLog.info(`🔄 Modo anti-duplicatas: ${WHISK_CONFIG.SKIP_DUPLICATES ? 'ATIVADO' : 'DESATIVADO'}`);
    }

    // 🆕 NOVA FUNÇÃO: Torna o painel arrastável
    function makePanelDraggable() {
        const container = document.getElementById('whisk-downloader-container');
        const header = document.getElementById('whisk-panel-header');

        if (!container || !header) return;

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Posição inicial padrão (centro-direita)
        container.style.left = '20px';
        container.style.top = '100px';

        // Carrega posição salva do localStorage (opcional)
        const savedPosition = localStorage.getItem('whisk-panel-position');
        if (savedPosition) {
            try {
                const { x, y } = JSON.parse(savedPosition);
                container.style.left = `${x}px`;
                container.style.top = `${y}px`;
                xOffset = x;
                yOffset = y;
                whiskLog.info(`Posição carregada: ${x}, ${y}`);
            } catch (e) {
                whiskLog.warn('Erro ao carregar posição salva', e);
            }
        }

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.closest('.whisk-minimize-btn') || e.target.closest('.whisk-toggle-switch')) {
                return; // Não arrasta se clicar no botão minimizar ou toggle
            }

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            header.style.cursor = 'grabbing';
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                container.style.left = `${currentX}px`;
                container.style.top = `${currentY}px`;
            }
        }

        function dragEnd(e) {
            if (isDragging) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                header.style.cursor = 'grab';

                // Salva posição no localStorage
                localStorage.setItem('whisk-panel-position', JSON.stringify({ x: currentX, y: currentY }));
            }
        }

        whiskLog.success('Painel agora é arrastável!');
    }

    // 🆕 NOVA FUNÇÃO: Toggle minimizar/expandir painel
    function togglePanelMinimize() {
        const panel = document.getElementById('whisk-info-panel');
        const content = document.querySelector('.whisk-panel-content');
        const minimizeBtn = document.querySelector('.whisk-minimize-btn');

        if (!panel || !content) return;

        const isMinimized = panel.classList.contains('minimized');

        if (isMinimized) {
            // Expandir
            panel.classList.remove('minimized');
            content.style.display = 'block';
            minimizeBtn.textContent = '−';
            minimizeBtn.title = 'Minimizar painel';
        } else {
            // Minimizar
            panel.classList.add('minimized');
            content.style.display = 'none';
            minimizeBtn.textContent = '+';
            minimizeBtn.title = 'Expandir painel';
        }

        whiskLog.info(`Painel ${isMinimized ? 'expandido' : 'minimizado'}`);
    }

    // Função para criar interface
    function createWhiskInterface() {
        if (document.getElementById('whisk-downloader-container')) {
            whiskLog.info('Interface já existe');
            return;
        }

        whiskLog.info('🚀 Criando interface do Whisk Downloader...');

        // Injeta estilos
        const style = document.createElement('style');
        style.textContent = `
            #whisk-downloader-container {
                position: fixed;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                font-family: 'Google Sans', Arial, sans-serif;
            }

            /* Botão inline dentro do painel */
            #whisk-download-btn-inline {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                padding: 12px;
                background: #FFD700;
                color: #000000;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                margin-bottom: 12px;
            }

            #whisk-download-btn-inline:hover:not(:disabled) {
                background: #FFA500;
                box-shadow: 0 3px 8px rgba(0,0,0,0.15);
                transform: translateY(-1px);
            }

            #whisk-download-btn-inline:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            #whisk-download-btn-inline.downloading {
                background: #EA4335;
                color: white;
            }

            #whisk-download-btn-inline.completed {
                background: #34A853;
                color: white;
            }

            #whisk-download-btn-inline.no-images {
                background: #FFA500;
                color: #000000;
            }

            #whisk-download-btn-inline i {
                font-family: 'Material Icons' !important;
                font-size: 20px;
            }

            .whisk-info-panel {
                background: white;
                padding: 0;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                font-size: 12px;
                width: 280px;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .whisk-info-panel.minimized {
                width: 280px;
            }

            /* 🆕 Header arrastável */
            #whisk-panel-header {
                background: linear-gradient(135deg, #FFD700, #FFA500);
                padding: 12px 15px;
                cursor: grab;
                user-select: none;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            #whisk-panel-header:active {
                cursor: grabbing;
            }

            .whisk-info-panel h4 {
                margin: 0;
                font-size: 14px;
                color: #000000;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }

            /* 🆕 Botão de minimizar */
            .whisk-minimize-btn {
                background: rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(0, 0, 0, 0.2);
                color: #000000;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                transition: all 0.2s ease;
                line-height: 1;
                padding: 0;
            }

            .whisk-minimize-btn:hover {
                background: rgba(0, 0, 0, 0.2);
                transform: scale(1.1);
            }

            /* 🆕 Conteúdo do painel */
            .whisk-panel-content {
                padding: 12px;
                transition: all 0.3s ease;
            }

            #whisk-download-btn {
                transition: all 0.3s ease;
            }

            /* 🆕 Estilos para opção de anti-duplicatas */
            .whisk-option-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                margin-bottom: 10px;
                border-bottom: 1px solid #e8eaed;
            }

            .whisk-option-label {
                color: #5f6368;
                font-weight: 500;
                font-size: 12px;
            }

            .whisk-toggle-switch {
                position: relative;
                width: 40px;
                height: 20px;
            }

            .whisk-toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .whisk-toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                border-radius: 20px;
                transition: 0.4s;
            }

            .whisk-toggle-slider:before {
                position: absolute;
                content: "";
                height: 14px;
                width: 14px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                border-radius: 50%;
                transition: 0.4s;
            }

            .whisk-toggle-switch input:checked + .whisk-toggle-slider {
                background-color: #34A853;
            }

            .whisk-toggle-switch input:checked + .whisk-toggle-slider:before {
                transform: translateX(20px);
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

            /* 🆕 Cor especial para pulados */
            .whisk-stat-value.skipped {
                color: #FFA500;
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
                width: 10px;
                height: 10px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 6px;
            }

            .whisk-status-icon.ready {
                background: rgba(0, 0, 0, 0.3);
            }

            .whisk-status-icon.downloading {
                background: #EA4335;
                animation: pulse 1s infinite;
            }

            .whisk-status-icon.complete {
                background: #34a853;
            }

            /* 🆕 ESTILOS PARA BOTÕES INDIVIDUAIS */
            .whisk-individual-download-btn {
                position: absolute;
                top: 10px;
                left: 10px;
                width: 40px;
                height: 40px;
                background: rgba(255, 215, 0, 0.95);
                border: 2px solid #fff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 1000;
                opacity: 0;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }

            .whisk-individual-download-btn:hover {
                transform: scale(1.15);
                background: rgba(255, 215, 0, 1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }

            .whisk-individual-download-btn.downloading {
                background: rgba(234, 67, 53, 0.95);
                animation: pulse 1s infinite;
            }

            .whisk-individual-download-btn i {
                font-family: 'Material Icons' !important;
                font-size: 20px;
                color: #000;
            }

            /* Mostra botão ao passar mouse no container */
            div.sc-12e568c9-0:hover .whisk-individual-download-btn,
            div.dKRdkO:hover .whisk-individual-download-btn {
                opacity: 1;
            }

            /* 🆕 BADGE DE STATUS NO CONTAINER */
            .whisk-download-badge {
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 600;
                z-index: 1001;
                animation: slideUp 0.3s ease;
            }

            .whisk-download-badge.success {
                background: #34A853;
                color: white;
            }

            .whisk-download-badge.error {
                background: #EA4335;
                color: white;
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);

        // Cria container principal
        const container = document.createElement('div');
        container.id = 'whisk-downloader-container';

        // Cria painel de informações
        const infoPanel = document.createElement('div');
        infoPanel.className = 'whisk-info-panel';
        infoPanel.id = 'whisk-info-panel';
        infoPanel.innerHTML = `
            <div id="whisk-panel-header">
                <h4>
                    <span class="whisk-status-icon ready"></span>
                    Whisk Downloader
                </h4>
                <button class="whisk-minimize-btn" title="Minimizar painel">−</button>
            </div>
            <div class="whisk-panel-content">
                <button id="whisk-download-btn-inline">
                    <i class="material-icons">download</i>
                    <span>Baixar Todas as Imagens</span>
                </button>

                <div class="whisk-option-row">
                    <span class="whisk-option-label">Pular duplicatas:</span>
                    <label class="whisk-toggle-switch">
                        <input type="checkbox" id="whisk-skip-duplicates-checkbox" ${WHISK_CONFIG.SKIP_DUPLICATES ? 'checked' : ''}>
                        <span class="whisk-toggle-slider"></span>
                    </label>
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
                    <span class="whisk-stat-label">Puladas:</span>
                    <span class="whisk-stat-value skipped" id="whisk-skipped">0</span>
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
            </div>
        `;

        container.appendChild(infoPanel);

        document.body.appendChild(container);

        // 🆕 Adiciona listener para o botão inline de download
        const buttonInline = document.getElementById('whisk-download-btn-inline');
        if (buttonInline) {
            buttonInline.onclick = function() {
                if (isWhiskDownloadRunning) {
                    // Se estiver rodando, cancela
                    isWhiskDownloadRunning = false;
                    whiskLog.warn('Download cancelado pelo usuário');
                    updateWhiskButtonState(buttonInline, 'default');
                } else {
                    // Se não estiver rodando, inicia
                    downloadAllWhiskImages();
                }
            };
        }

        // 🆕 Torna o painel arrastável
        makePanelDraggable();

        // 🆕 Adiciona listener para o botão de minimizar
        const minimizeBtn = document.querySelector('.whisk-minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', togglePanelMinimize);
        }

        // 🆕 Adiciona listener para o toggle de duplicatas
        const checkbox = document.getElementById('whisk-skip-duplicates-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', toggleSkipDuplicates);
        }

        // Adiciona ícones do Google Material Icons se não existir
        if (!document.querySelector('link[href*="Material+Icons"]')) {
            const iconLink = document.createElement('link');
            iconLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            iconLink.rel = 'stylesheet';
            document.head.appendChild(iconLink);
        }

        whiskLog.success('✅ Interface Whisk Downloader Enhanced criada com sucesso!');
        whiskLog.info(`📍 Painel criado na posição: ${container.style.left} x ${container.style.top}`);

        // Verifica se o painel foi realmente adicionado ao DOM
        setTimeout(() => {
            const check = document.getElementById('whisk-downloader-container');
            if (check) {
                whiskLog.success('✅ Painel confirmado no DOM');
            } else {
                whiskLog.error('❌ ERRO: Painel não encontrado no DOM!');
            }
        }, 500);
    }

    // Função para detectar mudanças na página (SPA) e adicionar botões
    function observeWhiskPageChanges() {
        const observer = new MutationObserver((mutations) => {
            // Verifica se houve mudanças significativas na página
            const hasSignificantChanges = mutations.some(mutation =>
                mutation.addedNodes.length > 0 &&
                Array.from(mutation.addedNodes).some(node =>
                    node.nodeName === 'IMG' ||
                    (node.querySelector && node.querySelector('img')) ||
                    (node.classList && (node.classList.contains('sc-12e568c9-0') || node.classList.contains('dKRdkO')))
                )
            );

            if (hasSignificantChanges) {
                whiskLog.info('Novas imagens detectadas na página');
                // Reseta o estado das imagens processadas quando novas imagens aparecem
                document.querySelectorAll('.whisk-downloader-processed').forEach(el => {
                    el.classList.remove('whisk-downloader-processed');
                });

                // 🆕 Adiciona botões individuais nas novas imagens
                setTimeout(() => addIndividualDownloadButtons(), 1000);
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
        whiskLog.info('Inicializando Whisk Image Downloader ENHANCED...');

        // Aguarda um pouco para a página carregar completamente
        setTimeout(() => {
            createWhiskInterface();
            observeWhiskPageChanges();

            // Análise inicial da página
            const images = findAllWhiskImageContainers();
            whiskLog.info(`Página carregada com ${images.length} imagens disponíveis`);

            // 🆕 Adiciona botões individuais de download
            addIndividualDownloadButtons();

            // 🆕 Re-adiciona botões a cada 3 segundos para pegar novas imagens
            setInterval(() => {
                addIndividualDownloadButtons();
            }, 3000);
        }, 2000);
    }

    // Inicia quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWhisk);
    } else {
        initializeWhisk();
    }

    whiskLog.success('Script Whisk Image Downloader ENHANCED carregado!');

})(); // Fecha o IIFE
