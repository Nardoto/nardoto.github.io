// ========================================
// Auto Image Loader - Carregamento automático de imagens por nome
// ========================================

console.log('🖼️ Auto Image Loader: Carregado!');

class AutoImageLoader {
    constructor() {
        this.selectedFiles = [];
        this.loadedImages = new Map(); // Map<promptIndex, File>
        this.usedFiles = new Set(); // Set de arquivos já utilizados
    }

    // Inicializar o carregador automático
    initialize() {
        console.log('🖼️ Auto Image Loader: Inicializando...');
        this.addAutoLoadButton();
    }

    // Adicionar botão de carregamento automático na interface
    addAutoLoadButton() {
        // Observar quando as seções de imagem são criadas
        const observeImageSections = () => {
            const songCardList = document.getElementById('song-card-list');
            if (!songCardList) {
                setTimeout(observeImageSections, 500);
                return;
            }

            // Criar observer para detectar quando image-section é adicionada
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Verificar se alguma image-section foi adicionada
                            const imageSection = node.querySelector('.image-section') ||
                                                (node.classList && node.classList.contains('image-section') ? node : null);

                            if (imageSection) {
                                // Adicionar botão apenas uma vez
                                this.injectAutoLoadButton(songCardList);
                            }
                        }
                    }
                }
            });

            observer.observe(songCardList, {
                childList: true,
                subtree: true
            });

            console.log('👀 Observer criado para detectar seções de imagem');
        };

        observeImageSections();
    }

    // Injetar botão na interface
    injectAutoLoadButton(songCardList) {
        // Verificar se já existe
        if (document.getElementById('auto-image-load-btn')) {
            return;
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'auto-image-loader-container';
        buttonContainer.style.cssText = `
            margin: 16px 0;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e8eaed;
        `;

        buttonContainer.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #ffffff 0%, #e8eaed 100%);
                padding: 16px;
                border-radius: 12px;
                margin-bottom: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border: 1px solid #dadce0;
            ">
                <div style="
                    font-size: 13px;
                    color: #333333;
                    margin-bottom: 10px;
                    font-weight: 500;
                ">🖼️ Carregamento Automático de Imagens</div>
                <button id="auto-image-load-btn" style="
                    width: 100%;
                    padding: 10px 16px;
                    background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                ">
                    📁 Selecionar Imagens da Pasta
                </button>
                <div id="auto-load-status" style="
                    margin-top: 10px;
                    font-size: 12px;
                    color: #333333;
                    text-align: center;
                    display: none;
                    font-weight: 500;
                "></div>
            </div>
        `;

        // Inserir no topo da lista de cards (antes do primeiro card)
        if (songCardList.firstChild) {
            songCardList.insertBefore(buttonContainer, songCardList.firstChild);
        } else {
            songCardList.appendChild(buttonContainer);
        }

        // Adicionar hover effect
        const button = document.getElementById('auto-image-load-btn');
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
        });

        // Adicionar evento de clique
        button.addEventListener('click', () => this.selectFolder());

        console.log('✅ Auto Image Loader: Botão adicionado à interface');
    }

    // Selecionar pasta com imagens
    async selectFolder() {
        try {
            // Criar input file com múltiplos arquivos
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/jpeg,image/png,image/gif,image/webp';
            input.webkitdirectory = false; // Permitir seleção de múltiplos arquivos

            input.onchange = async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) {
                    this.showStatus('❌ Nenhuma imagem selecionada', 'error');
                    return;
                }

                this.selectedFiles = files;
                this.showStatus(`✅ ${files.length} imagens carregadas`, 'success');

                // Processar automaticamente
                await this.processAutoLoad();
            };

            input.click();
        } catch (error) {
            console.error('❌ Erro ao selecionar pasta:', error);
            this.showStatus('❌ Erro ao selecionar imagens', 'error');
        }
    }

    // Processar carregamento automático
    async processAutoLoad() {
        this.showStatus('🔄 Processando imagens...', 'info');

        // Limpar Set de arquivos usados
        this.usedFiles.clear();

        // ABORDAGEM SIMPLES: Buscar TODOS os campos de imagem pela ID
        // Ignorar a estrutura HTML complexa
        let matchedCount = 0;
        let totalInputs = 0;

        // Detectar automaticamente quantos prompts existem (sem limite!)
        let maxPrompts = 0;
        while (document.getElementById(`file-input-${maxPrompts}`)) {
            maxPrompts++;
        }

        console.log(`🔢 Total de prompts detectados: ${maxPrompts}`);

        // Loop por TODOS os inputs de arquivo encontrados (sem limite!)
        for (let i = 0; i < maxPrompts; i++) {
            const fileInput = document.getElementById(`file-input-${i}`);

            if (!fileInput) {
                continue;
            }

            totalInputs++;
            const promptNumber = i + 1; // Prompt número 1, 2, 3...

            // ABORDAGEM FLEXÍVEL: Buscar o texto do prompt sem assumir formato
            // Procurar pelo card específico
            const card = document.getElementById(`song-card-${i}`);
            let promptText = '';

            if (card) {
                // Buscar divs com title no card específico
                const divsWithTitle = card.querySelectorAll('div[title]');

                for (const div of divsWithTitle) {
                    const title = div.getAttribute('title');
                    if (title && title.trim()) {
                        // Pegar o primeiro title válido encontrado
                        promptText = title;
                        break;
                    }
                }
            }

            // Se não encontrou pelo card, buscar de forma mais ampla
            if (!promptText) {
                // Buscar no documento por elementos que possam ter o texto do prompt
                const allElements = document.querySelectorAll('.card-style[title]');
                if (allElements[i]) {
                    promptText = allElements[i].getAttribute('title');
                }
            }

            if (!promptText || promptText.trim() === '') {
                console.log(`⚠️ Prompt ${promptNumber} não encontrado`);
                continue;
            }

            // Remover quebras de linha do prompt antes de normalizar
            const cleanPrompt = promptText.replace(/\n/g, ' ').trim();

            // Normalizar prompt para comparação (primeiros 15 caracteres)
            const promptPrefix = this.normalizeFileName(cleanPrompt.substring(0, 15));
            console.log(`🔍 Prompt ${promptNumber}: "${cleanPrompt.substring(0, 50)}..." | Prefix="${promptPrefix}"`);

            // Buscar arquivo de imagem correspondente
            const matchedFile = this.findMatchingImage(promptPrefix);

            if (matchedFile) {
                console.log(`✅ Match encontrado para prompt ${promptNumber}: "${matchedFile.name}"`);

                // Carregar imagem no campo (usar i que é o índice real)
                await this.loadImageToCard(i, matchedFile);
                matchedCount++;

                await this.delay(200);
            } else {
                console.log(`❌ Nenhuma imagem encontrada para prompt ${promptNumber}`);
                console.log(`   Prefix buscado: "${promptPrefix}"`);

                // Mostrar os prefixos dos arquivos disponíveis para debug
                const availableFiles = Array.from(this.selectedFiles)
                    .filter(f => !this.usedFiles.has(f.name))
                    .slice(0, 3); // Mostrar apenas 3 para não poluir

                if (availableFiles.length > 0) {
                    console.log(`   Arquivos disponíveis (primeiros 3):`);
                    availableFiles.forEach(file => {
                        const fileNameClean = file.name.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
                        const filePrefix = this.normalizeFileName(fileNameClean.substring(0, 15));
                        console.log(`     - "${file.name}" → Prefix: "${filePrefix}"`);
                    });
                }
            }
        }

        this.showStatus(`${matchedCount}/${totalInputs} imagens carregadas`, 'success');

        // Limpar status após 5 segundos
        setTimeout(() => {
            const statusDiv = document.getElementById('auto-load-status');
            if (statusDiv) statusDiv.style.display = 'none';
        }, 5000);
    }

    // Extrair texto do prompt do card
    extractPromptText(card) {
        // Método 1: Buscar diretamente por divs com atributo title que contenha o texto do prompt
        // Isso evita pegar elementos de outros cards
        const divsWithTitle = card.querySelectorAll('div[title]');
        for (const div of divsWithTitle) {
            const titleText = div.getAttribute('title');
            if (titleText && titleText.trim() && titleText.includes('PARTE')) {
                // Pegar a PRIMEIRA ocorrência válida (mais específica)
                return titleText.trim();
            }
        }

        // Método 2: Buscar especificamente por .card-style
        const cardStyleElements = card.querySelectorAll('.card-style');
        if (cardStyleElements.length > 0) {
            // Pegar o PRIMEIRO card-style (que deve ser do card atual)
            const firstCardStyle = cardStyleElements[0];
            const text = firstCardStyle.getAttribute('title') || firstCardStyle.textContent;
            if (text && text.trim()) {
                return text.trim();
            }
        }

        // Método 3: Fallback - pegar do textContent (menos confiável)
        const textContent = card.textContent;
        if (textContent && textContent.trim()) {
            // Tentar extrair apenas a primeira linha que contém "PARTE"
            const lines = textContent.split('\n');
            for (const line of lines) {
                if (line.trim().includes('PARTE')) {
                    return line.trim();
                }
            }
            return textContent.trim();
        }

        return '';
    }

    // Normalizar nome de arquivo para comparação
    normalizeFileName(text) {
        let normalized = text
            .trim()
            .toLowerCase()
            .replace(/[\(\)\[\]]/g, '');    // Remover parênteses e colchetes

        // Converter timestamps para formato unificado
        // (0:00-0:08) → (000-008)
        // (1:04-1:12) → (104-112)
        normalized = normalized.replace(/(\d+):(\d+)/g, (match, min, sec) => {
            const totalSec = parseInt(min) * 60 + parseInt(sec);
            return String(totalSec).padStart(3, '0');
        });

        return normalized
            .replace(/[^a-z0-9]/g, '_')    // Substituir outros caracteres especiais por _
            .replace(/_+/g, '_')            // Remover underscores duplicados
            .replace(/^_|_$/g, '');         // Remover underscores no início/fim
    }

    // Buscar imagem que corresponda ao prefixo
    findMatchingImage(promptPrefix) {
        let bestMatch = null;
        let bestMatchLength = 0;

        // Extrair número do TAKE do prefix (ex: "take_9" de "take_9_064")
        const takeMatch = promptPrefix.match(/take_(\d+)/i);
        const takeNumber = takeMatch ? parseInt(takeMatch[1]) : null;

        for (const file of this.selectedFiles) {
            // Pular se já foi usado
            if (this.usedFiles.has(file.name)) {
                continue;
            }

            const fileName = file.name
                .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') // Remover extensão
                .toLowerCase();

            // Se temos número do TAKE, priorizar match exato por número
            if (takeNumber !== null) {
                const fileTakeMatch = fileName.match(/take\s+(\d+)/i);
                if (fileTakeMatch && parseInt(fileTakeMatch[1]) === takeNumber) {
                    // Match perfeito pelo número do TAKE!
                    this.usedFiles.add(file.name);
                    return file;
                }
            }

            const normalizedFileName = this.normalizeFileName(fileName);

            // Calcular quantos caracteres coincidem no início
            let matchLength = 0;
            const maxLength = Math.min(promptPrefix.length, normalizedFileName.length);

            for (let i = 0; i < maxLength; i++) {
                if (promptPrefix[i] === normalizedFileName[i]) {
                    matchLength++;
                } else {
                    break;
                }
            }

            // Precisa ter pelo menos 10 caracteres coincidindo
            if (matchLength >= 10 && matchLength > bestMatchLength) {
                bestMatch = file;
                bestMatchLength = matchLength;
            }
        }

        // Marcar como usado se encontrou
        if (bestMatch) {
            this.usedFiles.add(bestMatch.name);
        }

        return bestMatch;
    }

    // Carregar imagem em um card específico
    async loadImageToCard(cardIndex, imageFile) {
        try {
            // Buscar o input file do card
            const fileInput = document.getElementById(`file-input-${cardIndex}`);
            if (!fileInput) {
                console.warn(`⚠️ Input file não encontrado para card ${cardIndex}`);
                return;
            }

            // Criar um DataTransfer para simular seleção de arquivo
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(imageFile);
            fileInput.files = dataTransfer.files;

            // Disparar evento de mudança
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);

            // Verificar se o image-automator processou o arquivo
            await this.delay(500);

            // Se o image-automator não processou, processar manualmente
            const preview = document.getElementById(`preview-${cardIndex}`);
            if (!preview || preview.style.display === 'none') {
                await this.manualImageLoad(cardIndex, imageFile);
            }

            console.log(`✅ Imagem carregada no card ${cardIndex}: ${imageFile.name}`);
        } catch (error) {
            console.error(`❌ Erro ao carregar imagem no card ${cardIndex}:`, error);
        }
    }

    // Carregar imagem manualmente se o image-automator não processar
    async manualImageLoad(cardIndex, imageFile) {
        const dropZone = document.getElementById(`drop-zone-${cardIndex}`);
        const preview = document.getElementById(`preview-${cardIndex}`);
        const previewImg = document.getElementById(`preview-img-${cardIndex}`);
        const fileName = document.getElementById(`file-name-${cardIndex}`);
        const fileSize = document.getElementById(`file-size-${cardIndex}`);

        if (!dropZone || !preview || !previewImg) {
            console.warn(`⚠️ Elementos de preview não encontrados para card ${cardIndex}`);
            return;
        }

        // Criar URL da imagem
        const imageUrl = URL.createObjectURL(imageFile);

        // Atualizar preview
        previewImg.src = imageUrl;
        if (fileName) fileName.textContent = imageFile.name;
        if (fileSize) fileSize.textContent = this.formatFileSize(imageFile.size);

        // Mostrar preview e esconder drop zone
        dropZone.style.display = 'none';
        preview.style.display = 'block';

        // Salvar no imageManager se disponível
        if (window.imageManager) {
            window.imageManager.saveImage(cardIndex, imageFile);
        }
    }

    // Formatar tamanho do arquivo
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Mostrar status
    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('auto-load-status');
        if (!statusDiv) return;

        statusDiv.textContent = message;
        statusDiv.style.color = '#333333';
        statusDiv.style.display = 'block';

        // Adicionar ícone baseado no tipo
        const icons = {
            info: '🔄',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const icon = icons[type] || icons.info;
        statusDiv.textContent = `${icon} ${message}`;
    }

    // Delay helper
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Instanciar e inicializar
const autoImageLoader = new AutoImageLoader();

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => autoImageLoader.initialize());
} else {
    autoImageLoader.initialize();
}

// Expor globalmente
window.autoImageLoader = autoImageLoader;

console.log('✅ Auto Image Loader: Pronto para uso!');
