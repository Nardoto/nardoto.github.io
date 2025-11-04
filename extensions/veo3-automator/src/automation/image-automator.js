// image-automator.js - Automatizador de Imagens para VEO3
// Desenvolvido por Nardoto - Integra imagens automaticamente aos prompts
//
// FUNCIONALIDADES:
// ✅ Adiciona campo de imagem a cada card de prompt
// ✅ Usa pasta IMAGENS existente como temporária
// ✅ Simula drag & drop de imagens automaticamente
// ✅ Confirma corte de imagem automaticamente
// ✅ Envia prompt quando botão fica disponível
// ✅ Interface integrada com o VEO3 Automator existente

console.log("🖼️ Image Automator: Inicializando...");

// Configurações do Image Automator
const IMAGE_CONFIG = {
    tempFolder: 'IMAGENS', // Pasta temporária existente
    cropButtonSelector: 'button.sc-d6df593a-1.eEpoHF.sc-30bcd3c2-7.ckBtCO', // Botão "Cortar e salvar" - ATUALIZADO
    submitButtonSelector: '.sc-95c4f607-0.grsLJu.google-symbols', // Botão de enviar
    textAreaSelector: '#PINHOLE_TEXT_AREA_ELEMENT_ID', // Campo do prompt
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
    maxFileSize: 10 * 1024 * 1024 // 10MB
};

// Estado global do automatizador de imagens
let imageAssociations = new Map(); // Map prompt index -> image file
let processingQueue = [];
let isProcessingImages = false;

// Classe para gerenciar imagens dos prompts
class ImageManager {
    constructor() {
        this.images = new Map();
        this.observers = [];
        this.memoryKey = 'veo3_image_memory';
        this.loadFromMemory();
    }

    // Associar imagem a um prompt
    setImage(promptIndex, imageFile) {
        this.images.set(promptIndex, imageFile);
        console.log(`🖼️ Imagem associada ao prompt ${promptIndex}:`, imageFile.name);
        this.notifyObservers('imageSet', { promptIndex, imageFile });
    }

    // Obter imagem de um prompt
    getImage(promptIndex) {
        return this.images.get(promptIndex);
    }

    // Remover imagem de um prompt
    removeImage(promptIndex) {
        const removed = this.images.delete(promptIndex);
        if (removed) {
            console.log(`🗑️ Imagem removida do prompt ${promptIndex}`);
            this.notifyObservers('imageRemoved', { promptIndex });
        }
        return removed;
    }

    // Verificar se prompt tem imagem
    hasImage(promptIndex) {
        return this.images.has(promptIndex);
    }

    // Limpar todas as imagens
    clearAll() {
        this.images.clear();
        console.log("🗑️ Todas as imagens removidas");
        this.notifyObservers('allImagesCleared');
    }

    // Adicionar observer para mudanças
    addObserver(callback) {
        this.observers.push(callback);
    }

    // Notificar observers
    notifyObservers(event, data) {
        this.observers.forEach(callback => callback(event, data));
    }

    // Salvar no localStorage com hash do prompt para identificação
    saveToMemory(promptText, promptIndex) {
        try {
            const promptHash = this.generatePromptHash(promptText);
            const imageData = this.images.get(promptIndex);
            
            if (!imageData) return;

            // Converter File para dados que podem ser salvos
            const reader = new FileReader();
            reader.onload = () => {
                const imageInfo = {
                    name: imageData.name,
                    type: imageData.type,
                    size: imageData.size,
                    dataUrl: reader.result,
                    promptHash: promptHash,
                    promptIndex: promptIndex,
                    savedAt: Date.now()
                };

                let savedImages = JSON.parse(localStorage.getItem(this.memoryKey) || '{}');
                savedImages[promptHash] = imageInfo;

                // Limitar a 20 imagens na memória para evitar problemas de espaço
                const imageKeys = Object.keys(savedImages);
                if (imageKeys.length > 20) {
                    // Remove as mais antigas
                    const sortedKeys = imageKeys.sort((a, b) =>
                        savedImages[a].savedAt - savedImages[b].savedAt
                    );
                    sortedKeys.slice(0, imageKeys.length - 20).forEach(key => {
                        delete savedImages[key];
                    });
                }

                try {
                    localStorage.setItem(this.memoryKey, JSON.stringify(savedImages));
                    console.log(`💾 Imagem salva na memória para prompt: ${promptText.substring(0, 50)}...`);
                } catch (quotaError) {
                    // Se exceder quota, limpar toda a memória e tentar novamente
                    console.warn("⚠️ Quota excedida, limpando memória antiga...");
                    localStorage.removeItem(this.memoryKey);

                    // Salvar apenas a imagem atual
                    const freshImages = {};
                    freshImages[promptHash] = imageInfo;
                    try {
                        localStorage.setItem(this.memoryKey, JSON.stringify(freshImages));
                        console.log(`💾 Memória limpa e imagem salva`);
                    } catch (finalError) {
                        console.error("❌ Não foi possível salvar imagem mesmo após limpar memória");
                    }
                }
            };
            reader.readAsDataURL(imageData);
        } catch (error) {
            console.warn("⚠️ Erro ao salvar imagem na memória:", error);
        }
    }

    // Carregar da memória por hash do prompt
    loadFromMemoryByPrompt(promptText, promptIndex) {
        try {
            const promptHash = this.generatePromptHash(promptText);
            const savedImages = JSON.parse(localStorage.getItem(this.memoryKey) || '{}');
            
            if (savedImages[promptHash]) {
                const imageInfo = savedImages[promptHash];
                
                // Converter dataUrl de volta para File
                fetch(imageInfo.dataUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], imageInfo.name, { type: imageInfo.type });
                        this.setImage(promptIndex, file);
                        
                        // Mostrar preview
                        showImagePreview(file, promptIndex);
                        updateCardButton(document.getElementById(`song-card-${promptIndex}`), promptIndex);
                        
                        console.log(`🔄 Imagem restaurada da memória para prompt ${promptIndex}: ${imageInfo.name}`);
                        return true;
                    });
                return true;
            }
            return false;
        } catch (error) {
            console.warn("⚠️ Erro ao carregar imagem da memória:", error);
            return false;
        }
    }

    // Carregar todas as imagens salvas na inicialização
    loadFromMemory() {
        try {
            const savedImages = JSON.parse(localStorage.getItem(this.memoryKey) || '{}');
            console.log(`💾 ${Object.keys(savedImages).length} imagens encontradas na memória`);
        } catch (error) {
            console.warn("⚠️ Erro ao acessar memória de imagens:", error);
        }
    }

    // Gerar hash simples do prompt para identificação
    generatePromptHash(promptText) {
        let hash = 0;
        const cleanPrompt = promptText.trim().toLowerCase();
        for (let i = 0; i < cleanPrompt.length; i++) {
            const char = cleanPrompt.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'prompt_' + Math.abs(hash).toString(16);
    }

    // Listar imagens salvas
    getMemoryInfo() {
        try {
            const savedImages = JSON.parse(localStorage.getItem(this.memoryKey) || '{}');
            return {
                count: Object.keys(savedImages).length,
                totalSize: JSON.stringify(savedImages).length,
                images: Object.values(savedImages).map(img => ({
                    name: img.name,
                    size: img.size,
                    savedAt: new Date(img.savedAt).toLocaleString()
                }))
            };
        } catch (error) {
            return { count: 0, totalSize: 0, images: [] };
        }
    }

    // Limpar memória
    clearMemory() {
        localStorage.removeItem(this.memoryKey);
        console.log("🗑️ Memória de imagens limpa");
    }
}

// Instância global do gerenciador de imagens
const imageManager = new ImageManager();

// Expor imageManager globalmente para acesso da sidebar
window.imageManager = imageManager;

// Função principal para inicializar o automatizador de imagens
function initializeImageAutomator() {
    console.log("🖼️ Image Automator: Inicializando interface de imagens...");

    // Verificar se estamos na página correta (VEO3 ou Flow)
    const isVEO3Page = window.location.href.includes('/tools/veo/') ||
                       window.location.href.includes('/tools/video-generation/');
    const isFlowPage = window.location.href.includes('/tools/flow/') ||
                       window.location.href.includes('labs.google/flow');

    if (!isVEO3Page && !isFlowPage) {
        console.log("ℹ️ Image Automator: Não está na página do VEO3 ou Flow, aguardando...");
        return;
    }

    // Aguardar que a interface principal do VEO3 Automator seja carregada
    waitForElement('.song-card, [class*="video-card"], [id*="card"]', 10000).then(() => {
        console.log("🖼️ Interface principal encontrada, integrando campos de imagem...");

        // Observar mudanças na lista de prompts para adicionar campos de imagem
        observePromptList();

        // Adicionar funcionalidade aos cards existentes
        enhanceExistingCards();

        console.log("✅ Image Automator: Inicializado com sucesso!");
    }).catch(error => {
        console.log("ℹ️ Image Automator aguardando interface do VEO3 Automator ser carregada...");
        // Tentar novamente após 2 segundos
        setTimeout(initializeImageAutomator, 2000);
    });
}

// Observar mudanças na lista de prompts
function observePromptList() {
    // Procurar pela lista de cards com múltiplos seletores
    const songList = document.getElementById('song-card-list') ||
                     document.querySelector('[class*="card-list"]') ||
                     document.querySelector('[class*="prompt-list"]') ||
                     document.body;

    if (!songList) {
        console.warn("⚠️ Lista de cards não encontrada");
        return;
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE &&
                        (node.classList.contains('song-card') ||
                         node.id?.includes('card-') ||
                         node.classList.contains('video-card'))) {
                        enhancePromptCard(node);
                    }
                });
            }
        });
    });

    observer.observe(songList, { childList: true, subtree: true });
    console.log("👀 Observer ativo para novos cards de prompt");
}

// Melhorar cards existentes
function enhanceExistingCards() {
    const existingCards = document.querySelectorAll('.song-card');
    existingCards.forEach(card => enhancePromptCard(card));
    console.log(`🔧 ${existingCards.length} cards existentes melhorados`);
}

// Melhorar um card de prompt individual
function enhancePromptCard(card) {
    if (card.querySelector('.image-section')) {
        return; // Já foi melhorado
    }

    const cardId = card.id;
    const promptIndex = cardId ? parseInt(cardId.replace('song-card-', '')) : -1;
    
    if (promptIndex === -1) {
        console.warn("⚠️ Não foi possível determinar o índice do prompt");
        return;
    }

    console.log(`🔧 Melhorando card do prompt ${promptIndex}`);

    // Criar seção de imagem
    const imageSection = createImageSection(promptIndex);
    
    // Inserir antes do botão
    const insertBtn = card.querySelector('.insert-btn');
    if (insertBtn) {
        insertBtn.parentNode.insertBefore(imageSection, insertBtn);
    } else {
        card.appendChild(imageSection);
    }

    // Verificar se o modo imagem está ativado para mostrar a seção
    checkImageModeState();

    // Atualizar botão para incluir imagem se houver
    updateCardButton(card, promptIndex);
}

// Criar seção de imagem para um prompt
function createImageSection(promptIndex) {
    const section = document.createElement('div');
    section.className = 'image-section hidden';
    section.style.cssText = `
        margin: 12px 0;
        padding: 12px;
        border: 2px dashed #e0e0e0;
        border-radius: 8px;
        background: #fafafa;
        transition: all 0.3s ease;
    `;

    section.innerHTML = `
        <div class="image-drop-zone" id="drop-zone-${promptIndex}" style="
            text-align: center;
            padding: 20px 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        ">
            <div class="drop-zone-content">
                <div style="font-size: 24px; margin-bottom: 8px;">🖼️</div>
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                    <strong>Arraste uma imagem aqui</strong>
                </div>
                <div style="font-size: 12px; color: #999;">
                    Ou clique para selecionar (JPG, PNG, GIF até 10MB)
                </div>
                <button class="restore-image-btn" id="restore-${promptIndex}" style="
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 6px 12px;
                    cursor: pointer;
                    font-size: 11px;
                    margin-top: 8px;
                    display: none;
                ">💾 Restaurar da Memória</button>
            </div>
            <input type="file" id="file-input-${promptIndex}" accept="image/*" style="display: none;">
        </div>
        
        <div class="image-preview" id="preview-${promptIndex}" style="display: none;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <img id="preview-img-${promptIndex}" style="
                        width: 40px; 
                        height: 40px; 
                        object-fit: cover; 
                        border-radius: 6px;
                        border: 2px solid #4CAF50;
                    ">
                    <div>
                        <div id="file-name-${promptIndex}" style="font-size: 12px; font-weight: 600; color: #333;"></div>
                        <div id="file-size-${promptIndex}" style="font-size: 11px; color: #666;"></div>
                    </div>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button class="replace-image-btn" id="replace-${promptIndex}" style="
                        background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 6px 8px;
                        cursor: pointer;
                        font-size: 11px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    ">🔄 Substituir</button>
                    <button class="remove-image-btn" id="remove-${promptIndex}" style="
                        background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 6px 8px;
                        cursor: pointer;
                        font-size: 11px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    ">🗑️ Remover</button>
                </div>
            </div>
        </div>
    `;

    // Adicionar event listeners
    setupImageSectionListeners(section, promptIndex);

    return section;
}

// Configurar listeners para a seção de imagem
function setupImageSectionListeners(section, promptIndex) {
    const dropZone = section.querySelector(`#drop-zone-${promptIndex}`);
    const fileInput = section.querySelector(`#file-input-${promptIndex}`);
    const removeBtn = section.querySelector(`#remove-${promptIndex}`);
    const replaceBtn = section.querySelector(`#replace-${promptIndex}`);
    const restoreBtn = section.querySelector(`#restore-${promptIndex}`);

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#4CAF50';
        dropZone.style.backgroundColor = '#f1f8f1';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#e0e0e0';
        dropZone.style.backgroundColor = '#fafafa';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#e0e0e0';
        dropZone.style.backgroundColor = '#fafafa';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageFile(files[0], promptIndex);
        }
    });

    // Click para selecionar arquivo
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Input de arquivo
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageFile(file, promptIndex);
        }
    });

    // Botão remover
    removeBtn.addEventListener('click', () => {
        removeImageFromPrompt(promptIndex);
    });

    // Botão substituir
    if (replaceBtn) {
        replaceBtn.addEventListener('click', () => {
            fileInput.click(); // Abre o seletor de arquivo para substituir
        });
    }

    // Botão restaurar da memória
    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            restoreImageFromMemory(promptIndex);
        });
    }

    // Verificar se há imagem na memória e mostrar botão restaurar
    checkAndShowRestoreButton(promptIndex);
}

// Manipular arquivo de imagem selecionado
function handleImageFile(file, promptIndex) {
    console.log(`🖼️ Processando imagem para prompt ${promptIndex}:`, file.name);

    // Validar arquivo
    if (!validateImageFile(file)) {
        showImageStatus(`❌ Arquivo inválido: ${file.name}`, 'error');
        return;
    }

    // Salvar imagem no gerenciador
    imageManager.setImage(promptIndex, file);
    
    // Salvar na memória para futura restauração
    const promptText = getPromptText(promptIndex);
    if (promptText) {
        console.log(`💾 Salvando imagem na memória para prompt ${promptIndex}`);
        imageManager.saveToMemory(promptText, promptIndex);
    } else {
        console.warn(`⚠️ Não foi possível obter texto do prompt ${promptIndex} para salvar na memória`);
    }
    
    // Mostrar preview
    showImagePreview(file, promptIndex);
    
    // Atualizar botão do card
    updateCardButton(document.getElementById(`song-card-${promptIndex}`), promptIndex);
    
    // Ocultar botão restaurar pois agora há uma imagem ativa
    const restoreBtn = document.getElementById(`restore-${promptIndex}`);
    if (restoreBtn) restoreBtn.style.display = 'none';
    
    showImageStatus(`✅ Imagem adicionada e salva na memória: ${file.name}`, 'success');
}

// Validar arquivo de imagem
function validateImageFile(file) {
    // Verificar tipo
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!IMAGE_CONFIG.supportedFormats.includes(fileExtension)) {
        showImageStatus(`❌ Formato não suportado: ${fileExtension}`, 'error');
        return false;
    }

    // Verificar tamanho
    if (file.size > IMAGE_CONFIG.maxFileSize) {
        showImageStatus(`❌ Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB`, 'error');
        return false;
    }

    // Verificar se é realmente uma imagem
    if (!file.type.startsWith('image/')) {
        showImageStatus('❌ Arquivo não é uma imagem válida', 'error');
        return false;
    }

    return true;
}

// Mostrar preview da imagem
function showImagePreview(file, promptIndex) {
    const dropZone = document.getElementById(`drop-zone-${promptIndex}`);
    const preview = document.getElementById(`preview-${promptIndex}`);
    const previewImg = document.getElementById(`preview-img-${promptIndex}`);
    const fileName = document.getElementById(`file-name-${promptIndex}`);
    const fileSize = document.getElementById(`file-size-${promptIndex}`);

    if (!preview || !previewImg || !fileName || !fileSize) {
        console.warn(`⚠️ Elementos de preview não encontrados para prompt ${promptIndex}`);
        return;
    }

    // Criar URL para preview
    const imageUrl = URL.createObjectURL(file);
    previewImg.src = imageUrl;
    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    // Mostrar preview e esconder drop zone
    if (dropZone) dropZone.style.display = 'none';
    preview.style.display = 'block';

    console.log(`🖼️ Preview da imagem mostrado para prompt ${promptIndex}`);
}

// Remover imagem de um prompt
function removeImageFromPrompt(promptIndex) {
    imageManager.removeImage(promptIndex);
    
    const dropZone = document.getElementById(`drop-zone-${promptIndex}`);
    const preview = document.getElementById(`preview-${promptIndex}`);
    const previewImg = document.getElementById(`preview-img-${promptIndex}`);
    
    if (dropZone) dropZone.style.display = 'block';
    if (preview) preview.style.display = 'none';
    if (previewImg && previewImg.src.startsWith('blob:')) {
        URL.revokeObjectURL(previewImg.src);
    }

    // Atualizar botão do card
    updateCardButton(document.getElementById(`song-card-${promptIndex}`), promptIndex);
    
    showImageStatus(`🗑️ Imagem removida do prompt ${promptIndex}`, 'info');
}

// Atualizar botão do card baseado na presença de imagem
function updateCardButton(card, promptIndex) {
    if (!card) return;

    const button = card.querySelector('.insert-btn');
    if (!button) return;

    const hasImage = imageManager.hasImage(promptIndex);
    
    // Verificar se o botão já está em estado de erro (retry)
    const isRetryState = button.textContent.includes('Enviar Novamente');
    
    if (isRetryState) {
        // Manter estado de retry se já estiver
        return;
    }
    
    if (hasImage) {
        button.innerHTML = `🖼️ Gerar com Imagem`;
        button.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        button.title = 'Gerar vídeo com imagem anexada';
    } else {
        button.innerHTML = `Gerar no VEO3`;
        button.style.background = '#2196F3';
        button.title = 'Gerar vídeo apenas com texto';
    }
}

// Restaurar imagem da memória para um prompt específico
function restoreImageFromMemory(promptIndex) {
    const promptText = getPromptText(promptIndex);
    if (!promptText) {
        showImageStatus("❌ Não foi possível obter o texto do prompt para restauração", 'error');
        return;
    }

    const restored = imageManager.loadFromMemoryByPrompt(promptText, promptIndex);
    if (restored) {
        showImageStatus(`✅ Imagem restaurada da memória para prompt ${promptIndex}`, 'success');
        
        // Ocultar botão restaurar após uso
        const restoreBtn = document.getElementById(`restore-${promptIndex}`);
        if (restoreBtn) restoreBtn.style.display = 'none';
    } else {
        showImageStatus("⚠️ Nenhuma imagem encontrada na memória para este prompt", 'warning');
    }
}

// Verificar se há imagem na memória e mostrar botão restaurar
function checkAndShowRestoreButton(promptIndex) {
    const promptText = getPromptText(promptIndex);
    if (!promptText) return;

    const promptHash = imageManager.generatePromptHash(promptText);
    const savedImages = JSON.parse(localStorage.getItem('veo3_image_memory') || '{}');
    
    const restoreBtn = document.getElementById(`restore-${promptIndex}`);
    if (restoreBtn && savedImages[promptHash]) {
        restoreBtn.style.display = 'inline-block';
        restoreBtn.title = `Imagem salva: ${savedImages[promptHash].name}`;
    }
}

// Obter texto do prompt por índice
function getPromptText(promptIndex) {
    try {
        const card = document.getElementById(`song-card-${promptIndex}`);
        if (!card) {
            console.warn(`⚠️ Card não encontrado para prompt ${promptIndex}`);
            return null;
        }

        // Procurar pelo texto do prompt no card com múltiplos seletores
        const selectors = ['.song-title', '.prompt-text', 'h3', 'p', '.card-title', '.card-content'];
        let promptElement = null;
        
        for (const selector of selectors) {
            promptElement = card.querySelector(selector);
            if (promptElement && promptElement.textContent.trim()) {
                break;
            }
        }
        
        if (!promptElement) {
            // Tentar pegar o primeiro elemento de texto visível
            const allElements = card.querySelectorAll('*');
            for (const element of allElements) {
                if (element.textContent && element.textContent.trim().length > 10) {
                    promptElement = element;
                    break;
                }
            }
        }
        
        const promptText = promptElement ? promptElement.textContent.trim() : null;
        console.log(`📝 Texto do prompt ${promptIndex}:`, promptText ? promptText.substring(0, 50) + '...' : 'não encontrado');
        return promptText;
    } catch (error) {
        console.warn("⚠️ Erro ao obter texto do prompt:", error);
        return null;
    }
}

// Função principal para processar prompt com imagem
async function processPromptWithImage(promptIndex, promptData) {
    console.log(`🖼️ Processando prompt ${promptIndex} com imagem`);
    
    const hasImage = imageManager.hasImage(promptIndex);
    
    if (!hasImage) {
        console.log(`📝 Prompt ${promptIndex} não tem imagem, usando fluxo normal`);
        // Usar função existente do VEO3
        return await populateVEO3AndCreate(promptData);
    }


    try {
        const imageFile = imageManager.getImage(promptIndex);
        console.log(`🖼️ Iniciando fluxo com imagem para prompt ${promptIndex}:`, imageFile.name);

        // Passo 1: Preencher campo de texto
        await fillVEO3TextField(promptData);

        // Passo 2: Simular drag & drop da imagem
        await simulateImageDragDrop(imageFile);

        // Passo 3: Aguardar e confirmar corte
        try {
            await waitAndConfirmCrop();
        } catch (cropError) {
            console.error(`❌ Erro no processo de corte:`, cropError);
            // Tentar clicar em qualquer botão de confirmação disponível
            const anyConfirmButton = document.querySelector('button[type="button"]');
            if (anyConfirmButton && anyConfirmButton.textContent.includes('Confirmar')) {
                anyConfirmButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            // Continuar mesmo com erro no corte
        }

        // Passo 3.5: AGUARDAR UPLOAD DA IMAGEM COMPLETAR
        console.log("⏳ Aguardando upload da imagem...");
        await waitForImageUpload();

        // Passo 3.6: Verificar se mudou para modo correto (Frame para vídeo / Frames to Video)
        await checkAndSetVideoMode();

        // Passo 4: Aguardar botão de envio e enviar
        await waitAndSubmit();

        console.log(`✅ Prompt ${promptIndex} processado com imagem com sucesso`);
        return { success: true, title: promptData.title };

    } catch (error) {
        console.error(`❌ Erro ao processar prompt ${promptIndex} com imagem:`, error);
        // Garantir que sempre retorna algo, mesmo com erro
        return { success: false, error: error.message, title: promptData.title };
    }
}

// Preencher campo de texto do VEO3
async function fillVEO3TextField(promptData) {
    const textArea = document.querySelector(IMAGE_CONFIG.textAreaSelector);
    if (!textArea) {
        throw new Error("Campo de texto do VEO3 não encontrado");
    }

    // Enviar apenas o conteúdo bruto do prompt (sem duplicar título)
    const fullPrompt = promptData.prompt;
    console.log("📝 Preenchendo campo de texto:", fullPrompt);

    await fillField(textArea, fullPrompt);
    console.log("✅ Campo de texto preenchido");
}

// Simular drag & drop de imagem
async function simulateImageDragDrop(imageFile) {
    console.log("🖼️ Simulando drag & drop da imagem...");

    const textArea = document.querySelector(IMAGE_CONFIG.textAreaSelector);
    if (!textArea) {
        throw new Error("Campo de texto não encontrado para drag & drop");
    }

    // Aguardar um pouco para garantir que a interface está pronta (reduzido para 500ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Estratégia 1: Drag & Drop tradicional
    try {
        console.log("🖼️ Tentando drag & drop tradicional...");
        
        // Criar eventos de drag & drop mais realistas
        const dragEvents = [
            new DragEvent('dragenter', { 
                bubbles: true, 
                cancelable: true,
                dataTransfer: createDataTransfer([imageFile])
            }),
            new DragEvent('dragover', { 
                bubbles: true, 
                cancelable: true,
                dataTransfer: createDataTransfer([imageFile])
            }),
            new DragEvent('drop', { 
                bubbles: true, 
                cancelable: true,
                dataTransfer: createDataTransfer([imageFile])
            })
        ];

        // Disparar eventos com intervalos mais realistas
        for (const event of dragEvents) {
            textArea.dispatchEvent(event);
            await new Promise(r => setTimeout(r, 300));
        }

        console.log("✅ Eventos de drag & drop disparados");
        
    } catch (error) {
        console.warn("⚠️ Falha no drag & drop tradicional:", error);
    }

    // Estratégia 2: Simular input de arquivo
    try {
        console.log("🖼️ Tentando simulação de input de arquivo...");
        
        // Criar input temporário
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.accept = 'image/*';
        tempInput.style.display = 'none';
        document.body.appendChild(tempInput);
        
        // Simular seleção de arquivo
        const fileList = new DataTransfer();
        fileList.items.add(imageFile);
        tempInput.files = fileList.files;
        
        // Disparar evento de change
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        tempInput.dispatchEvent(changeEvent);
        
        // Remover input temporário
        document.body.removeChild(tempInput);
        
        console.log("✅ Simulação de input de arquivo executada");
        
    } catch (error) {
        console.warn("⚠️ Falha na simulação de input:", error);
    }

    // Estratégia 3: Tentar encontrar área de drop específica
    try {
        console.log("🖼️ Procurando área de drop específica...");
        
        const dropAreas = document.querySelectorAll('[class*="drop"], [class*="upload"], [class*="file"], [data-testid*="drop"], [data-testid*="upload"]');
        
        for (const dropArea of dropAreas) {
            if (dropArea.offsetParent === null) continue;
            
            console.log("🖼️ Área de drop encontrada, tentando drop...");
            
            const dragEvents = [
                new DragEvent('dragenter', { 
                    bubbles: true, 
                    cancelable: true,
                    dataTransfer: createDataTransfer([imageFile])
                }),
                new DragEvent('dragover', { 
                    bubbles: true, 
                    cancelable: true,
                    dataTransfer: createDataTransfer([imageFile])
                }),
                new DragEvent('drop', { 
                    bubbles: true, 
                    cancelable: true,
                    dataTransfer: createDataTransfer([imageFile])
                })
            ];

            for (const event of dragEvents) {
                dropArea.dispatchEvent(event);
                await new Promise(r => setTimeout(r, 200));
            }
        }
        
        console.log("✅ Drop em áreas específicas executado");
        
    } catch (error) {
        console.warn("⚠️ Falha no drop em áreas específicas:", error);
    }
    
    // Aguardar interface processar a imagem
    console.log("⏳ Aguardando processamento da imagem...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("✅ Simulação de drag & drop concluída");
}

// Criar DataTransfer com arquivo
function createDataTransfer(files) {
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    return dataTransfer;
}

// Aguardar e confirmar corte da imagem
async function waitAndConfirmCrop() {
    console.log("✂️ Aguardando janela de corte...");

    try {
        // Aguardar menos tempo para a interface carregar (500ms ao invés de 2000ms)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Aguardar botão de corte aparecer e ser clicado automaticamente
        const cropButton = await waitForCropButton(10000);
        console.log("✂️ Botão de corte foi encontrado e clicado automaticamente!");

        // Aguardar processamento da imagem (reduzido para 1500ms)
        console.log("⏳ Aguardando processamento da imagem...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log("✅ Corte de imagem processado com sucesso");
        
    } catch (error) {
        console.error("❌ Erro no processo de corte:", error);
        throw new Error(`Falha ao encontrar/clicar botão de corte: ${error.message}`);
    }
}

// Função para aguardar o upload da imagem completar
async function waitForImageUpload(timeout = 30000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let foundProgress = false;

        const checkImageStatus = () => {
            // Verificar timeout
            if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout aguardando upload da imagem (${timeout}ms)`));
                return;
            }

            // Primeiro, verificar se existe indicador de progresso
            const allIcons = document.querySelectorAll('i.google-symbols, i.material-icons');
            let progressIndicator = null;
            for (const icon of allIcons) {
                if (icon.textContent.trim() === 'progress_activity') {
                    progressIndicator = icon;
                    break;
                }
            }

            const progressText = Array.from(document.querySelectorAll('div')).find(el =>
                el.textContent.includes('Fazer upload') && el.querySelector('i')
            );

            if (progressIndicator || progressText) {
                if (!foundProgress) {
                    console.log("📤 Upload em progresso detectado...");
                    foundProgress = true;
                }
            }

            // Verificar se a imagem foi carregada checando:
            // 1. Botão com data-state="closed"
            // 2. Ícone mudou de "add" para "close"
            // 3. Texto "Primeiro frame" apareceu

            // Procurar ícone "close" em botões
            let closeIconButton = null;
            const buttonIcons = document.querySelectorAll('button i.google-symbols, button i.material-icons');
            for (const icon of buttonIcons) {
                if (icon.textContent.trim() === 'close') {
                    closeIconButton = icon.closest('button');
                    break;
                }
            }

            const uploadedIndicators = [
                // Procurar botão com data-state="closed"
                document.querySelector('button[data-state="closed"]'),
                // Botão com ícone "close"
                closeIconButton,
                // Procurar texto "Primeiro frame"
                Array.from(document.querySelectorAll('span')).find(span =>
                    span.textContent.includes('Primeiro frame')
                )
            ];

            // Método alternativo: procurar botões e verificar mudança
            const frameButtons = document.querySelectorAll('button.sc-74578dc8-1, button[class*="sc-74578dc8"]');
            let imageLoaded = false;

            for (const button of frameButtons) {
                const icon = button.querySelector('i.google-symbols, i.material-icons');
                const hasDataState = button.hasAttribute('data-state');
                const hasCloseIcon = icon && icon.textContent.trim() === 'close';
                const hasAddIcon = icon && icon.textContent.trim() === 'add';

                if (hasDataState || hasCloseIcon) {
                    imageLoaded = true;
                    console.log("✅ Imagem carregada detectada!");
                    console.log(`   - data-state: ${button.getAttribute('data-state')}`);
                    console.log(`   - ícone: ${icon ? icon.textContent.trim() : 'nenhum'}`);
                    break;
                }

                // Debug
                if (icon) {
                    console.log(`🔍 Botão frame encontrado - ícone: "${icon.textContent.trim()}", data-state: ${hasDataState}`);
                }
            }

            // Se encontrou algum indicador de upload completo
            if (imageLoaded || uploadedIndicators.some(el => el)) {
                // Aguardar mais um pouco para garantir que está pronto
                console.log("✅ Upload da imagem concluído! Aguardando estabilização...");
                setTimeout(() => {
                    console.log("🚀 Imagem pronta para envio!");
                    resolve();
                }, 2000); // Aguarda 2 segundos após detectar o upload completo
                return;
            }

            // Se já detectou progresso mas ainda não terminou, ou se ainda não começou
            setTimeout(checkImageStatus, 500);
        };

        // Iniciar verificação após um pequeno delay
        setTimeout(checkImageStatus, 1000);
    });
}

// Função para aguardar botão de corte com múltiplos seletores
async function waitForCropButton(timeout = 15000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkButtons = () => {
            // Verificar se ainda está dentro do timeout
            if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout aguardando botão de corte (${timeout}ms)`));
                return;
            }

            // ESTRATÉGIA PRINCIPAL: Procurar PRIMEIRO pelas classes EXATAS do botão correto
            const correctButtonSelectors = [
                'button.sc-c177465c-1.gdArnN.sc-958863ea-7.kGrksz',  // Classes exatas fornecidas pelo usuário
                'button[class*="gdArnN"][class*="kGrksz"]',  // Classes parciais
                'button.gdArnN.kGrksz'  // Classes simplificadas
            ];

            for (const selector of correctButtonSelectors) {
                try {
                    const buttons = document.querySelectorAll(selector);
                    for (const button of buttons) {
                        if (button.offsetParent === null) continue;

                        const buttonText = button.textContent.trim();
                        const icon = button.querySelector('i.material-icons, i.google-symbols');

                        // Verificar se é o botão "Cortar e salvar" / "Crop and Save"
                        if (buttonText.includes('Cortar e salvar') || buttonText.includes('Crop and Save') ||
                            (icon && icon.textContent.trim() === 'crop' &&
                             (buttonText.toLowerCase().includes('salvar') || buttonText.toLowerCase().includes('save')))) {
                            console.log(`✅ BOTÃO CORRETO encontrado pelas classes específicas!`);
                            console.log(`   Seletor: ${selector}`);
                            console.log(`   Texto: "${buttonText}"`);
                            console.log(`   Classes: "${button.className}"`);
                            button.click();
                            resolve(button);
                            return;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            // Estratégia de fallback: procurar por todos os botões e ser MUITO específico
            const allButtons = document.querySelectorAll('button');
            for (const button of allButtons) {
                if (button.offsetParent === null) continue;

                const buttonText = button.textContent.trim();
                const icon = button.querySelector('i.material-icons, i.google-symbols');

                // Debug para entender o que está sendo encontrado
                if (icon && icon.textContent.includes('crop')) {
                    console.log(`🔍 Debug - Botão com 'crop': texto="${buttonText}", ícone="${icon.textContent.trim()}", classes="${button.className}"`);
                }

                // Verificação EXATA: deve ter texto "Cortar e salvar" / "Crop and Save" E ícone "crop" (sem underscore)
                const isCorrectButton = buttonText === 'cropCortar e salvar' ||
                                       buttonText === 'Cortar e salvar' ||
                                       buttonText === 'cropCrop and Save' ||
                                       buttonText === 'Crop and Save' ||
                                       (buttonText.includes('Cortar') && buttonText.includes('salvar')) ||
                                       (buttonText.includes('Crop') && buttonText.includes('Save'));

                const hasCorrectIcon = icon && icon.textContent.trim() === 'crop';

                // EVITAR botões com crop_16_9, crop_square, etc
                const hasWrongIcon = icon && (
                    icon.textContent.includes('crop_16_9') ||
                    icon.textContent.includes('crop_square') ||
                    icon.textContent.includes('crop_') // Qualquer crop com underscore
                );

                if (isCorrectButton && hasCorrectIcon && !hasWrongIcon) {
                    console.log(`✅ Botão 'Cortar e salvar' / 'Crop and Save' encontrado por texto e ícone!`);
                    button.click();
                    resolve(button);
                    return;
                }
            }
            
            // REMOVIDAS todas as estratégias antigas que causavam problemas
            // Se não encontrou o botão correto, vamos registrar o que encontramos para debug
            console.log(`⚠️ Botão 'Cortar e salvar' / 'Crop and Save' não encontrado nesta tentativa`);
            console.log(`   Botões encontrados com 'crop' no ícone:`);
            const debugButtons = document.querySelectorAll('button');
            let foundAnyWithCrop = false;
            for (const btn of debugButtons) {
                const icon = btn.querySelector('i.material-icons, i.google-symbols');
                if (icon && icon.textContent.includes('crop')) {
                    foundAnyWithCrop = true;
                    console.log(`   - "${btn.textContent.trim()}" (ícone: "${icon.textContent.trim()}")`);
                }
            }
            if (!foundAnyWithCrop) {
                console.log(`   Nenhum botão com ícone crop encontrado ainda`);
            }

            // Se não encontrou, tentar novamente em 100ms (mais rápido)
            setTimeout(checkButtons, 100);
        };

        // Iniciar verificação imediatamente
        checkButtons();
    });
}

// Verificar e definir modo de vídeo correto
async function checkAndSetVideoMode() {
    console.log("🎬 Verificando modo de vídeo...");
    
    try {
        // Aguardar um pouco para a interface atualizar após o corte (aumentado)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Procurar pelo botão de seleção de modo
        const modeButton = document.querySelector('button[role="combobox"][aria-controls*="radix"]');
        
        if (!modeButton) {
            console.warn("⚠️ Botão de modo não encontrado, continuando...");
            return;
        }
        
        const buttonText = modeButton.textContent || modeButton.innerText;
        console.log("🎬 Modo atual:", buttonText);
        
        // Verificar se já está no modo correto (PT: "Frame para vídeo" / EN: "Frames to Video")
        if (buttonText.includes("Frame para vídeo") || buttonText.includes("Frame to video") ||
            buttonText.includes("Frames to Video")) {
            console.log("✅ Já está no modo 'Frame para vídeo' / 'Frames to Video'");
            return;
        }
        
        // Se estiver em "Texto para vídeo" / "Text to Video", precisa mudar para "Frame para vídeo" / "Frames to Video"
        if (buttonText.includes("Texto para vídeo") || buttonText.includes("Text to video") ||
            buttonText.includes("Text to Video")) {
            console.log("🔄 Mudando de 'Texto para vídeo' / 'Text to Video' para 'Frame para vídeo' / 'Frames to Video'...");

            // Clicar no botão para abrir o dropdown
            modeButton.click();
            console.log("📱 Dropdown aberto");

            // Aguardar dropdown aparecer (aumentado)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Procurar pela opção "Frame para vídeo" / "Frames to Video"
            const options = document.querySelectorAll('[role="option"], [data-radix-collection-item]');
            let frameOption = null;

            for (const option of options) {
                const optionText = option.textContent || option.innerText;
                if (optionText.includes("Frame para vídeo") || optionText.includes("Frame to video") ||
                    optionText.includes("Frames to video") || optionText.includes("Frames to Video")) {
                    frameOption = option;
                    break;
                }
            }

            if (frameOption) {
                frameOption.click();
                console.log("✅ Modo alterado para 'Frame para vídeo' / 'Frames to Video'");

                // Aguardar a mudança de modo ser processada (aumentado)
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.warn("⚠️ Opção 'Frame para vídeo' / 'Frames to Video' não encontrada");

                // Fechar dropdown se não encontrou a opção
                modeButton.click();
            }
        }
        
    } catch (error) {
        console.warn("⚠️ Erro ao verificar/alterar modo de vídeo:", error);
        // Não é um erro fatal, continuar com o processo
    }
}

// Aguardar botão de envio ficar disponível e enviar
async function waitAndSubmit() {
    console.log("📤 Aguardando botão arrow_forward ficar disponível...");

    let attempts = 0;
    const maxAttempts = 10; // 10 tentativas (10 segundos)

    while (attempts < maxAttempts) {
        console.log(`🔍 Tentativa ${attempts + 1}/${maxAttempts} - Procurando botão arrow_forward...`);

        // PRIORIDADE MÁXIMA: Procurar pelo botão arrow_forward
        const allButtons = document.querySelectorAll('button');
        let arrowForwardButton = null;

        for (const button of allButtons) {
            if (button.offsetParent === null) continue;

            // Procurar pelo ícone arrow_forward dentro do botão
            const icon = button.querySelector('i.google-symbols, i.material-icons');
            if (icon && icon.textContent.trim() === 'arrow_forward') {
                // Verificar se o botão está habilitado
                const isDisabled = button.hasAttribute('disabled') ||
                                 button.getAttribute('aria-disabled') === 'true' ||
                                 button.style.pointerEvents === 'none' ||
                                 button.classList.contains('disabled');

                if (!isDisabled) {
                    arrowForwardButton = button;
                    console.log("✅ Botão arrow_forward encontrado!");
                    console.log(`   Classes: "${button.className}"`);
                    console.log(`   HTML: ${button.outerHTML.substring(0, 100)}...`);
                    break;
                } else {
                    console.log("⚠️ Botão arrow_forward encontrado mas está desabilitado");
                }
            }
        }

        // Se encontrou o botão arrow_forward
        if (arrowForwardButton) {
            try {
                console.log("🎯 Clicando no botão arrow_forward...");

                // Aguardar um pouco para estabilização
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Clicar no botão
                arrowForwardButton.click();
                console.log("✅ Clique executado!");

                // Aguardar e tentar eventos adicionais
                await new Promise(resolve => setTimeout(resolve, 500));

                // Disparar eventos de mouse adicionais para garantir
                const mouseEvents = [
                    new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }),
                    new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }),
                    new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
                ];

                for (const event of mouseEvents) {
                    arrowForwardButton.dispatchEvent(event);
                }

                console.log("✅ Eventos adicionais disparados");
                console.log("🎉 Prompt com imagem enviado com sucesso!");
                return;

            } catch (error) {
                console.error("❌ Erro ao clicar no botão arrow_forward:", error);
            }
        }

        // Fallback: Procurar pelo seletor antigo
        const specificSubmitIcon = document.querySelector('i.sc-95c4f607-0.grsLJu.google-symbols[font-size="1rem"]');
        if (specificSubmitIcon && specificSubmitIcon.offsetParent !== null) {
            const parentButton = specificSubmitIcon.closest('button');
            if (parentButton && parentButton.offsetParent !== null) {
                const isDisabled = parentButton.hasAttribute('disabled') || 
                                 parentButton.getAttribute('aria-disabled') === 'true' ||
                                 parentButton.style.pointerEvents === 'none';
                
                if (!isDisabled) {
                    console.log("🎯 Botão de envio específico encontrado por ícone");
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    try {
                        // Múltiplas estratégias para clicar
                        parentButton.click();
                        console.log("✅ Clique direto no botão específico executado");
                        
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                        // Eventos de mouse
                        const mouseEvents = [
                            new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }),
                            new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }),
                            new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
                        ];
                        
                        mouseEvents.forEach(event => parentButton.dispatchEvent(event));
                        console.log("✅ Eventos de mouse no botão específico disparados");
                        
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                        // Focus e Enter
                        parentButton.focus();
                        const enterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            bubbles: true,
                            cancelable: true
                        });
                        parentButton.dispatchEvent(enterEvent);
                        console.log("✅ Focus + Enter no botão específico executado");
                        
                    } catch (error) {
                        console.warn("⚠️ Erro ao clicar no botão específico:", error);
                    }
                    
                    console.log("🚀 Prompt enviado via botão específico!");
                    return;
                }
            }
        }
        
        // Estratégia 2: Procurar por todos os botões visíveis e verificar se são de envio
        const submitButtons = document.querySelectorAll('button');
        for (const button of submitButtons) {
            if (button.offsetParent === null) continue; // Pular botões invisíveis
            
            const buttonText = button.textContent.trim().toLowerCase();
            const buttonHTML = button.innerHTML.toLowerCase();
            const isDisabled = button.hasAttribute('disabled') || 
                             button.getAttribute('aria-disabled') === 'true' ||
                             button.style.pointerEvents === 'none' ||
                             button.classList.contains('disabled');
            
            // Verificar se é um botão de envio/submit
            if (!isDisabled && (
                buttonText.includes('enviar') || 
                buttonText.includes('send') || 
                buttonText.includes('submit') ||
                buttonText.includes('gerar') ||
                buttonText.includes('generate') ||
                buttonText.includes('criar') ||
                buttonText.includes('create') ||
                buttonHTML.includes('send') ||
                buttonHTML.includes('submit') ||
                buttonHTML.includes('arrow_forward') ||
                buttonHTML.includes('play_arrow')
            )) {
                console.log(`🎯 Botão de envio encontrado por texto: "${buttonText}"`);
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                try {
                    // Múltiplas estratégias para clicar
                    button.click();
                    console.log("✅ Clique direto executado");
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Eventos de mouse
                    const mouseEvents = [
                        new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }),
                        new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }),
                        new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
                    ];
                    
                    mouseEvents.forEach(event => button.dispatchEvent(event));
                    console.log("✅ Eventos de mouse disparados");
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Focus e Enter
                    button.focus();
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        bubbles: true,
                        cancelable: true
                    });
                    button.dispatchEvent(enterEvent);
                    console.log("✅ Focus + Enter executado");
                    
                } catch (error) {
                    console.warn("⚠️ Erro ao clicar no botão:", error);
                }
                
                console.log("🚀 Prompt enviado!");
                return;
            }
        }
        
        // Estratégia 2: Procurar por ícones de envio
        const sendIcons = document.querySelectorAll('i, svg, [class*="icon"]');
        for (const icon of sendIcons) {
            if (icon.offsetParent === null) continue;
            
            const iconText = icon.textContent || icon.getAttribute('class') || '';
            const iconHTML = icon.innerHTML.toLowerCase();
            
            if (iconText.includes('send') || 
                iconText.includes('arrow_forward') ||
                iconText.includes('play_arrow') ||
                iconText.includes('submit') ||
                iconHTML.includes('send') ||
                iconHTML.includes('arrow_forward') ||
                iconHTML.includes('play_arrow')) {
                
                const parentButton = icon.closest('button');
                if (parentButton && parentButton.offsetParent !== null) {
                    const isDisabled = parentButton.hasAttribute('disabled') || 
                                     parentButton.getAttribute('aria-disabled') === 'true' ||
                                     parentButton.style.pointerEvents === 'none';
                    
                    if (!isDisabled) {
                        console.log(`🎯 Botão de envio encontrado por ícone: "${iconText}"`);
                        
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        try {
                            parentButton.click();
                            console.log("✅ Clique no botão com ícone executado");
                            
                            const mouseEvents = [
                                new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }),
                                new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }),
                                new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
                            ];
                            
                            mouseEvents.forEach(event => parentButton.dispatchEvent(event));
                            console.log("✅ Eventos de mouse no botão com ícone disparados");
                            
                        } catch (error) {
                            console.warn("⚠️ Erro ao clicar no botão com ícone:", error);
                        }
                        
                        console.log("🚀 Prompt enviado via ícone!");
                        return;
                    }
                }
            }
        }
        
        // Estratégia 3: Procurar por botões com classes específicas do VEO3
        const veo3Selectors = [
            'button[class*="sc-"]',
            'button[class*="submit"]',
            'button[class*="send"]',
            'button[class*="generate"]',
            'button[class*="create"]',
            'button[type="submit"]'
        ];
        
        for (const selector of veo3Selectors) {
            try {
                const buttons = document.querySelectorAll(selector);
                for (const button of buttons) {
                    if (button.offsetParent === null) continue;
                    
                    const isDisabled = button.hasAttribute('disabled') || 
                                     button.getAttribute('aria-disabled') === 'true' ||
                                     button.style.pointerEvents === 'none';
                    
                    if (!isDisabled) {
                        const buttonText = button.textContent.trim().toLowerCase();
                        if (buttonText.includes('enviar') || 
                            buttonText.includes('send') || 
                            buttonText.includes('submit') ||
                            buttonText.includes('gerar') ||
                            buttonText.includes('generate')) {
                            
                            console.log(`🎯 Botão VEO3 encontrado: "${buttonText}"`);
                            
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            try {
                                button.click();
                                console.log("✅ Clique no botão VEO3 executado");
                                
                                const mouseEvents = [
                                    new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }),
                                    new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }),
                                    new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
                                ];
                                
                                mouseEvents.forEach(event => button.dispatchEvent(event));
                                console.log("✅ Eventos de mouse no botão VEO3 disparados");
                                
                            } catch (error) {
                                console.warn("⚠️ Erro ao clicar no botão VEO3:", error);
                            }
                            
                            console.log("🚀 Prompt enviado via VEO3!");
                            return;
                        }
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        if (attempts % 10 === 0) {
            console.log(`⏳ Aguardando botão de envio... (${attempts}/30)`);
        }
        
        // Aguardar 1 segundo antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    throw new Error("Timeout aguardando botão arrow_forward ficar disponível (10 segundos)");
}

// Mostrar status das operações de imagem
function showImageStatus(message, type = 'info') {
    // Usar sistema de status existente do VEO3
    if (typeof updateStatus === 'function') {
        updateStatus(`🖼️ ${message}`, true);
    } else {
        console.log(`🖼️ Status: ${message}`);
    }
}

// Função auxiliar para aguardar elemento aparecer
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

// Hook na função original do VEO3 para incluir processamento de imagem
function hookIntoVEO3Automation() {
    // Salvar referência da função original
    if (typeof populateVEO3AndCreate === 'function') {
        const originalFunction = populateVEO3AndCreate;
        
        // Substituir com nova função que verifica imagens
        window.populateVEO3AndCreate = async function(videoData) {
            const promptIndex = songQueue.findIndex(song => 
                song.title === videoData.title && song.prompt === videoData.prompt
            );
            
            if (promptIndex !== -1 && imageManager.hasImage(promptIndex)) {
                console.log(`🖼️ Usando fluxo com imagem para prompt ${promptIndex}`);
                return await processPromptWithImage(promptIndex, videoData);
            } else {
                console.log(`📝 Usando fluxo normal para prompt ${promptIndex}`);
                return await originalFunction(videoData);
            }
        };
        
        console.log("🔗 Hook instalado na função populateVEO3AndCreate");
    }
}

// Limpar todas as imagens quando interface for limpa
function hookIntoClearFunction() {
    if (typeof clearAllUI === 'function') {
        const originalClear = clearAllUI;
        
        window.clearAllUI = function() {
            // Executar limpeza original
            originalClear();
            
            // Limpar imagens
            imageManager.clearAll();
            console.log("🗑️ Imagens limpas junto com interface");
        };
        
        console.log("🔗 Hook instalado na função clearAllUI");
    }
}

// Exportar função para ser usada pelo content.js
window.processPromptWithImage = processPromptWithImage;

// Inicializar quando página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            initializeImageAutomator();
            hookIntoVEO3Automation();
            hookIntoClearFunction();
        }, 1000);
    });
} else {
    setTimeout(() => {
        initializeImageAutomator();
        hookIntoVEO3Automation();
        hookIntoClearFunction();
    }, 1000);
}

// Mostrar todas as seções de imagem
function showAllImageSections() {
    const imageSections = document.querySelectorAll('.image-section');
    imageSections.forEach(section => {
        section.classList.remove('hidden');
    });
    console.log(`🖼️ ${imageSections.length} seções de imagem mostradas`);
}

// Esconder todas as seções de imagem
function hideAllImageSections() {
    const imageSections = document.querySelectorAll('.image-section');
    imageSections.forEach(section => {
        section.classList.add('hidden');
    });
    console.log(`🖼️ ${imageSections.length} seções de imagem escondidas`);
}

// Verificar estado do modo imagem
function checkImageModeState() {
    const imageModeToggle = document.getElementById('imageModeToggle');
    if (imageModeToggle && imageModeToggle.checked) {
        showAllImageSections();
    }
}

// Expor funções globalmente para acesso da sidebar
window.showAllImageSections = showAllImageSections;
window.hideAllImageSections = hideAllImageSections;

console.log("🖼️ Image Automator: Carregado com sucesso!");