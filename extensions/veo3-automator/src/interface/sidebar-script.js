// sidebar-script.js - Versão Final com Modais de Instrução e Doação

let songQueue = [];
let currentSongIndex = 0;
let isAutoProcessing = false;

document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores dos Elementos ---
    const processBtn = document.getElementById('processBtn');
    const songCardList = document.getElementById('song-card-list');
    const autoInsertBtn = document.getElementById('autoInsertBtn');
    const stopAutoBtn = document.getElementById('stopAutoBtn');
    const inputText = document.getElementById('inputText');
    const clearTextBtn = document.getElementById('clearTextBtn');
    // NOVO: Seletores para os botões do rodapé
    const openInstructionsBtn = document.getElementById('openInstructionsModalBtn');
    const openDonationBtn = document.getElementById('openDonationModalBtn');
    
    // Seletores para download em massa
    const detectVideosBtn = document.getElementById('detectVideosBtn');
    const scrollLoadBtn = document.getElementById('scrollLoadBtn');
    const startMassDownloadBtn = document.getElementById('startMassDownloadBtn');
    const stopMassDownloadBtn = document.getElementById('stopMassDownloadBtn');
    const downloadDelayInput = document.getElementById('downloadDelayInput');
    const videoListContainer = document.getElementById('videoListContainer');
    const detectedVideoList = document.getElementById('detectedVideoList');
    
    // Seletores para controles de funcionalidades
const imageModeToggle = document.getElementById('imageModeToggle');

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

    // --- Ouvintes de Eventos (Event Listeners) ---
    if (processBtn) processBtn.addEventListener('click', processAndRenderCards);
    if (songCardList) songCardList.addEventListener('click', handleCardButtonClick);
    if (autoInsertBtn) autoInsertBtn.addEventListener('click', startAutoProcessing);
    if (stopAutoBtn) stopAutoBtn.addEventListener('click', stopAutoProcessing);
    if (inputText) inputText.addEventListener('click', () => inputText.select());
    if (clearTextBtn) clearTextBtn.addEventListener('click', clearAll);

    // NOVO: Listeners para os botões dos modais
    if (openInstructionsBtn) openInstructionsBtn.addEventListener('click', openInstructionsModal);
    if (openDonationBtn) openDonationBtn.addEventListener('click', openDonationModal);
    
    // Listeners para download em massa
    if (detectVideosBtn) detectVideosBtn.addEventListener('click', detectVideos);
    if (scrollLoadBtn) scrollLoadBtn.addEventListener('click', scrollToLoadAllVideos);
    if (startMassDownloadBtn) startMassDownloadBtn.addEventListener('click', startMassDownload);
    if (stopMassDownloadBtn) stopMassDownloadBtn.addEventListener('click', stopMassDownload);
    if (downloadDelayInput) downloadDelayInput.addEventListener('change', updateDownloadDelay);
    
    // Listeners para controles de funcionalidades
    if (imageModeToggle) imageModeToggle.addEventListener('change', toggleImageMode);

    // Find Replace event listeners
    if (findReplaceBtn) findReplaceBtn.addEventListener('click', toggleFindReplace);
    if (closeFindBtn) closeFindBtn.addEventListener('click', closeFindReplace);
    if (findInput) findInput.addEventListener('input', performFind);
    if (findPrevBtn) findPrevBtn.addEventListener('click', findPrevious);
    if (findNextBtn) findNextBtn.addEventListener('click', findNext);
    if (replaceBtn) replaceBtn.addEventListener('click', replaceCurrent);
    if (replaceAllBtn) replaceAllBtn.addEventListener('click', replaceAll);

    document.addEventListener('suno-automator-response', handleResponseFromPage);
});

// --- NOVAS FUNÇÕES PARA OS MODAIS ---

function openInstructionsModal() {
    // Evita abrir múltiplos modais
    if (document.getElementById('suno-automator-modal-bg')) return;
    
    const modalHTML = `
        <div id="suno-automator-modal-bg">
            <div class="suno-automator-modal">
                <h2>❓ Como Usar</h2>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>1. Formate o Texto:</strong> Para cada música, use os marcadores em linhas separadas:<br>
                    <code>LETRA X</code><br>
                    <code>LYRICS:</code><br>
                    <code>...sua letra aqui...</code><br>
                    <code>STYLES: ...seu estilo aqui...</code><br>
                    <code>Song Title: ...seu título aqui...</code>
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>2. Analise e Liste:</strong> Cole o texto na caixa e clique em "Analisar e Listar Músicas" para ver os cards.
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>3. Gere as Músicas:</strong> Use os botões "Inserir no Suno" de cada card para gerar manualmente, ou use a opção "Inserir Todas Automaticamente" para gerar em fila.
                </p>
                <button class="modal-close-btn" id="modal-close">Entendido</button>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('modal-close').addEventListener('click', () => document.getElementById('suno-automator-modal-bg').remove());
}

function openDonationModal() {
    // Evita abrir múltiplos modais
    if (document.getElementById('suno-automator-modal-bg')) return;

    const modalHTML = `
        <div id="suno-automator-modal-bg">
            <div class="suno-automator-modal">
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
    document.getElementById('modal-close').addEventListener('click', () => document.getElementById('suno-automator-modal-bg').remove());
}

// --- Restante do código (sem alterações) ---

function clearAll() {
    const inputText = document.getElementById('inputText');
    const songListElement = document.getElementById('song-card-list');
    const automationContainer = document.getElementById('automationContainer');
    const statusContainer = document.getElementById('statusContainer');
    if (inputText) inputText.value = '';
    if (songListElement) songListElement.innerHTML = '';
    if (automationContainer) automationContainer.classList.add('hidden');
    if (statusContainer) {
        statusContainer.classList.add('hidden');
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.textContent = 'Aguardando...';
    }
    songQueue = [];
    if (isAutoProcessing) stopAutoProcessing();
    console.log("Interface limpa e resetada.");
}

function processAndRenderCards() {
    const fullText = document.getElementById('inputText').value;
    if (!fullText.trim()) {
        updateStatus("Por favor, cole um texto para analisar.", true);
        return;
    }
    songQueue = parseSongText(fullText);
    if (songQueue.length === 0) {
        updateStatus("Nenhuma música encontrada no formato esperado.", true);
        document.getElementById('automationContainer').classList.add('hidden');
        return;
    }
    renderSongCards(songQueue);
    updateStatus(`${songQueue.length} músicas prontas para serem geradas.`, true);
    document.getElementById('automationContainer').classList.remove('hidden');
}

function renderSongCards(songs) {
    const songListElement = document.getElementById('song-card-list');
    if (!songListElement) return;
    songListElement.innerHTML = ''; 
    songs.forEach((song, index) => {
        const card = document.createElement('li');
        card.className = 'song-card';
        card.id = `song-card-${index}`;
        card.innerHTML = `
            <div class="card-title" title="${song.title}">${song.title}</div>
            <p class="card-style" title="${song.style}">Estilo: ${song.style.substring(0, 30)}...</p>
            <button class="insert-btn" data-song-index="${index}">➡️ Inserir no Suno</button>
        `;
        songListElement.appendChild(card);
    });
}

function handleCardButtonClick(event) {
    if (event.target && event.target.classList.contains('insert-btn')) {
        const button = event.target;
        const songIndex = parseInt(button.dataset.songIndex, 10);
        if (!isNaN(songIndex) && songQueue[songIndex]) {
            triggerAutomationForSong(songIndex);
        }
    }
}

function startAutoProcessing() {
    isAutoProcessing = true;
    currentSongIndex = 0;
    document.getElementById('autoInsertBtn').classList.add('hidden');
    document.getElementById('stopAutoBtn').classList.remove('hidden');
    document.getElementById('progressInfo').classList.remove('hidden');
    processNextSongInAutoQueue();
}

function stopAutoProcessing() {
    isAutoProcessing = false;
    document.getElementById('autoInsertBtn').classList.remove('hidden');
    document.getElementById('stopAutoBtn').classList.add('hidden');
    updateStatus('Automação interrompida pelo usuário.', true);
    document.querySelectorAll('.song-card.processing').forEach(card => card.classList.remove('processing'));
}

function processNextSongInAutoQueue() {
    if (!isAutoProcessing || currentSongIndex >= songQueue.length) {
        if (isAutoProcessing) updateStatus('🎉 Automação concluída!', true);
        stopAutoProcessing();
        return;
    }
    triggerAutomationForSong(currentSongIndex);
}

function triggerAutomationForSong(index) {
    const songData = songQueue[index];
    if (!songData) return;
    if (isAutoProcessing) {
        document.getElementById('currentSong').textContent = `"${songData.title}"`;
        document.getElementById('progressCount').textContent = index + 1;
        document.getElementById('totalCount').textContent = songQueue.length;
        document.querySelectorAll('.song-card').forEach(c => c.classList.remove('processing'));
        document.getElementById(`song-card-${index}`).classList.add('processing');
    }
    const button = document.querySelector(`#song-card-${index} .insert-btn`);
    if (button) {
      button.disabled = true;
      button.textContent = 'Enviando...';
    }
    const customEvent = new CustomEvent('suno-automator-create', { detail: songData });
    document.dispatchEvent(customEvent);
}

function handleResponseFromPage(event) {
    const response = event.detail;
    const processedSongIndex = songQueue.findIndex(song => song.title === response.title);
    if (processedSongIndex === -1) return;
    const card = document.getElementById(`song-card-${processedSongIndex}`);
    const button = card ? card.querySelector('.insert-btn') : null;
    if (response.success) {
        if (card) card.classList.add('processed');
        if (button) button.textContent = '✅ Sucesso';
        if (isAutoProcessing && processedSongIndex === currentSongIndex) {
            currentSongIndex++;
            const delayInput = document.getElementById('delayInput');
            const delaySeconds = parseInt(delayInput.value, 10) || 3;
            updateStatus(`Sucesso! Aguardando ${delaySeconds}s para a próxima música...`, true);
            setTimeout(processNextSongInAutoQueue, delaySeconds * 1000);
        } else {
            updateStatus(`"${response.title}" foi processado com sucesso!`, true);
        }
    } else {
        updateStatus(`❌ Erro ao processar "${response.title}": ${response.error}`, true);
        if (button) {
            button.disabled = false;
            button.textContent = '⚠️ Tentar Novamente';
        }
        if (isAutoProcessing) stopAutoProcessing();
    }
    if (card) card.classList.remove('processing');
}

function parseSongText(rawText) {
    const songs = [];
    const songBlocks = rawText.split(/LETRA \d+\s*\n/i).filter(block => block.trim() !== '');
    for (const block of songBlocks) {
        const match = block.match(/LYRICS:\s*\n(?<lyrics>[\s\S]*?)\s*STYLES:\s*(?<style>.*?)\s*Song Title:\s*(?<title>.*)/i);
        if (match && match.groups) {
            songs.push({
                lyrics: match.groups.lyrics.trim(),
                style: match.groups.style.trim(),
                title: match.groups.title.trim()
            });
        }
    }
    return songs;
}

function updateStatus(message, show = true) {
    const statusContainer = document.getElementById('statusContainer');
    const statusTextElem = document.getElementById('statusText');
    if (statusTextElem && statusContainer) {
        statusTextElem.textContent = message;
        if (show) {
            statusContainer.classList.remove('hidden');
        } else {
            statusContainer.classList.add('hidden');
        }
    }
}

// --- Find and Replace Functionality ---

let currentMatches = [];
let currentMatchIndex = -1;

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
        inputText.focus();
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

// Mostrar informações da memória de imagens

// ===== FUNÇÕES DE DOWNLOAD EM MASSA =====

// Detectar vídeos na página
async function detectVideos() {
    try {
        console.log("🔍 Detectando vídeos na página...");
        updateDownloadStatus("Detectando vídeos...");
        
        // Verificar se o Flow Mass Downloader está disponível
        if (!window.flowMassDownloader) {
            updateDownloadStatus("❌ Flow Mass Downloader não disponível");
            return;
        }
        
        const videoCount = window.flowMassDownloader.processAllVideos();
        updateDownloadStats();
        
        if (videoCount > 0) {
            updateDownloadStatus(`✅ ${videoCount} vídeos detectados`);
            showVideoList();
        } else {
            updateDownloadStatus("⚠️ Nenhum vídeo detectado");
        }
        
    } catch (error) {
        console.error("❌ Erro ao detectar vídeos:", error);
        updateDownloadStatus("❌ Erro ao detectar vídeos");
    }
}

// Scroll para carregar todos os vídeos
async function scrollToLoadAllVideos() {
    try {
        console.log("📜 Iniciando scroll para carregar todos os vídeos...");
        updateDownloadStatus("Carregando todos os vídeos...");
        
        // Verificar se o Flow Mass Downloader está disponível
        if (!window.flowMassDownloader) {
            updateDownloadStatus("❌ Flow Mass Downloader não disponível");
            return;
        }
        
        // Mostrar indicador de progresso
        const scrollBtn = document.getElementById('scrollLoadBtn');
        if (scrollBtn) {
            scrollBtn.disabled = true;
            scrollBtn.textContent = '📜 Carregando...';
        }
        
        await window.flowMassDownloader.scrollToLoadAllVideos();
        
        // Atualizar lista de vídeos após scroll
        const videoCount = window.flowMassDownloader.processAllVideos();
        updateDownloadStats();
        
        if (videoCount > 0) {
            updateDownloadStatus(`✅ ${videoCount} vídeos carregados`);
            showVideoList();
        } else {
            updateDownloadStatus("⚠️ Nenhum vídeo encontrado");
        }
        
        // Restaurar botão
        if (scrollBtn) {
            scrollBtn.disabled = false;
            scrollBtn.textContent = '📜 Carregar Todos';
        }
        
    } catch (error) {
        console.error("❌ Erro ao fazer scroll:", error);
        updateDownloadStatus("❌ Erro ao carregar vídeos");
        
        // Restaurar botão em caso de erro
        const scrollBtn = document.getElementById('scrollLoadBtn');
        if (scrollBtn) {
            scrollBtn.disabled = false;
            scrollBtn.textContent = '📜 Carregar Todos';
        }
    }
}

// Iniciar download em massa
async function startMassDownload() {
    try {
        console.log("🚀 Iniciando download em massa...");
        updateDownloadStatus("Iniciando download em massa...");
        
        // Verificar se há vídeos detectados
        const videos = window.flowMassDownloader.getDetectedVideos();
        if (videos.length === 0) {
            updateDownloadStatus("⚠️ Nenhum vídeo detectado. Clique em 'Detectar Vídeos' primeiro.");
            return;
        }
        
        // Atualizar configuração de delay
        updateDownloadDelay();
        
        // Mostrar botão de parar
        const startBtn = document.getElementById('startMassDownloadBtn');
        const stopBtn = document.getElementById('stopMassDownloadBtn');
        
        if (startBtn) startBtn.classList.add('hidden');
        if (stopBtn) stopBtn.classList.remove('hidden');
        
        // Iniciar download
        await window.flowMassDownloader.startMassDownload();
        
        // Atualizar estatísticas
        updateDownloadStats();
        updateDownloadStatus("✅ Download em massa concluído");
        
        // Restaurar botões
        if (startBtn) startBtn.classList.remove('hidden');
        if (stopBtn) stopBtn.classList.add('hidden');
        
    } catch (error) {
        console.error("❌ Erro no download em massa:", error);
        updateDownloadStatus("❌ Erro no download em massa");
        
        // Restaurar botões em caso de erro
        const startBtn = document.getElementById('startMassDownloadBtn');
        const stopBtn = document.getElementById('stopMassDownloadBtn');
        
        if (startBtn) startBtn.classList.remove('hidden');
        if (stopBtn) stopBtn.classList.add('hidden');
    }
}

// Parar download em massa
function stopMassDownload() {
    try {
        console.log("⏹️ Parando download em massa...");
        
        if (window.flowMassDownloader) {
            window.flowMassDownloader.stopMassDownload();
        }
        
        updateDownloadStatus("⏹️ Download interrompido");
        
        // Restaurar botões
        const startBtn = document.getElementById('startMassDownloadBtn');
        const stopBtn = document.getElementById('stopMassDownloadBtn');
        
        if (startBtn) startBtn.classList.remove('hidden');
        if (stopBtn) stopBtn.classList.add('hidden');
        
    } catch (error) {
        console.error("❌ Erro ao parar download:", error);
        updateDownloadStatus("❌ Erro ao parar download");
    }
}

// Atualizar delay de download
function updateDownloadDelay() {
    const delayInput = document.getElementById('downloadDelayInput');
    if (delayInput && window.flowMassDownloader) {
        const delay = parseInt(delayInput.value) || 3;
        FLOW_DOWNLOADER_CONFIG.downloadDelay = delay * 1000;
        console.log(`⏱️ Delay de download atualizado para ${delay} segundos`);
    }
}

// Atualizar estatísticas de download
function updateDownloadStats() {
    try {
        if (!window.flowMassDownloader) return;
        
        const stats = window.flowMassDownloader.getStats();
        
        const detectedCount = document.getElementById('detectedCount');
        const downloadedCount = document.getElementById('downloadedCount');
        
        if (detectedCount) detectedCount.textContent = stats.totalDetected;
        if (downloadedCount) downloadedCount.textContent = stats.totalDownloaded;
        
    } catch (error) {
        console.warn("⚠️ Erro ao atualizar estatísticas:", error);
    }
}

// Atualizar status de download
function updateDownloadStatus(message) {
    const statusElement = document.getElementById('downloadStatus');
    if (statusElement) {
        statusElement.textContent = message;
    }
    console.log(`📥 Download Status: ${message}`);
}

// Mostrar lista de vídeos detectados
function showVideoList() {
    try {
        const videoListContainer = document.getElementById('videoListContainer');
        const detectedVideoList = document.getElementById('detectedVideoList');
        
        if (!videoListContainer || !detectedVideoList || !window.flowMassDownloader) return;
        
        const videos = window.flowMassDownloader.getDetectedVideos();
        
        if (videos.length === 0) {
            videoListContainer.classList.add('hidden');
            return;
        }
        
        // Limpar lista existente
        detectedVideoList.innerHTML = '';
        
        // Adicionar cada vídeo à lista
        videos.forEach((videoData, index) => {
            const videoItem = document.createElement('div');
            videoItem.className = `video-item ${videoData.downloaded ? 'downloaded' : ''}`;
            videoItem.innerHTML = `
                <div class="video-info">
                    <div class="video-title" title="${videoData.title}">${videoData.title}</div>
                    <div class="video-status">${videoData.downloaded ? '✅ Baixado' : '⏳ Aguardando'}</div>
                </div>
                <div class="video-actions">
                    <button class="video-download-btn ${videoData.downloaded ? 'downloaded' : ''}" 
                            data-video-index="${index}"
                            ${videoData.downloaded ? 'disabled' : ''}>
                        ${videoData.downloaded ? '✅' : '📥'}
                    </button>
                </div>
            `;
            
            // Adicionar listener para download individual
            const downloadBtn = videoItem.querySelector('.video-download-btn');
            if (downloadBtn && !videoData.downloaded) {
                downloadBtn.addEventListener('click', () => downloadSingleVideo(index));
            }
            
            detectedVideoList.appendChild(videoItem);
        });
        
        // Mostrar container
        videoListContainer.classList.remove('hidden');
        
    } catch (error) {
        console.error("❌ Erro ao mostrar lista de vídeos:", error);
    }
}

// Download individual de vídeo
async function downloadSingleVideo(videoIndex) {
    try {
        if (!window.flowMassDownloader) return;
        
        const videos = window.flowMassDownloader.getDetectedVideos();
        const videoData = videos[videoIndex];
        
        if (!videoData || videoData.downloaded) return;
        
        console.log(`📥 Baixando vídeo individual: "${videoData.title}"`);
        
        // Atualizar botão para mostrar progresso
        const downloadBtn = document.querySelector(`[data-video-index="${videoIndex}"]`);
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.textContent = '⏳';
        }
        
        // Fazer download
        await window.flowMassDownloader.downloadVideo(videoData);
        
        // Atualizar interface
        updateDownloadStats();
        showVideoList(); // Recarregar lista para mostrar status atualizado
        
        console.log(`✅ Download individual concluído: "${videoData.title}"`);
        
    } catch (error) {
        console.error(`❌ Erro no download individual do vídeo ${videoIndex}:`, error);
        
        // Restaurar botão em caso de erro
        const downloadBtn = document.querySelector(`[data-video-index="${videoIndex}"]`);
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = '📥';
        }
    }
}

// Atualizar estatísticas periodicamente durante download
setInterval(() => {
    if (window.flowMassDownloader) {
        updateDownloadStats();
    }
}, 2000);

// ===== FUNÇÕES DE CONTROLE DE VISIBILIDADE =====

// Toggle do modo imagem
function toggleImageMode() {
    const toggle = document.getElementById('imageModeToggle');
    
    if (!toggle) return;
    
    if (toggle.checked) {
        showAllImageSections();
        console.log("🖼️ Modo Imagem: Ativado");
        
        // Mostrar aviso sobre reprocessar prompts
        showImageModeAlert();
    } else {
        hideAllImageSections();
        console.log("🖼️ Modo Imagem: Desativado");
    }
    
    // Salvar preferência
    saveFeaturePreference('imageModeEnabled', toggle.checked);
}

// Usar funções do image-automator.js
function showAllImageSections() {
    if (typeof window.showAllImageSections === 'function') {
        window.showAllImageSections();
    }
}

function hideAllImageSections() {
    if (typeof window.hideAllImageSections === 'function') {
        window.hideAllImageSections();
    }
}

// Salvar preferência do usuário
function saveFeaturePreference(key, value) {
    try {
        if (chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.set({ [key]: value });
        }
    } catch (error) {
        console.warn('⚠️ Erro ao salvar preferência:', error);
    }
}

// Carregar preferências salvas
function loadFeaturePreferences() {
    try {
        if (chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.get(['imageModeEnabled'], function(result) {
                // Restaurar estado do modo imagem
                const imageModeToggle = document.getElementById('imageModeToggle');
                if (imageModeToggle && result.imageModeEnabled !== undefined) {
                    imageModeToggle.checked = result.imageModeEnabled;
                    toggleImageMode();
                }
            });
        }
    } catch (error) {
        console.warn('⚠️ Erro ao carregar preferências:', error);
    }
}

// Mostrar aviso sobre modo imagem
function showImageModeAlert() {
    // Evita abrir múltiplos modais
    if (document.getElementById('veo3-automator-modal-bg')) return;
    
    const modalHTML = `
        <div id="veo3-automator-modal-bg">
            <div class="veo3-automator-modal">
                <h2>🖼️ Modo Imagem Ativado!</h2>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>✨ Áreas de upload de imagem foram adicionadas aos seus prompts!</strong>
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>⚠️ IMPORTANTE:</strong> Se você já tem prompts processados, é recomendado reprocessá-los para que as áreas de imagem apareçam corretamente.
                </p>
                <p style="text-align: left; font-size: 0.9rem;">
                    <strong>🔄 Como reprocessar:</strong><br>
                    1. Mantenha seu texto na caixa de entrada<br>
                    2. Clique em "Processar Prompts" novamente<br>
                    3. As áreas de imagem aparecerão em todos os cards
                </p>
                <p style="text-align: left; font-size: 0.8rem; color: #666; margin-top: 15px;">
                    <strong>💡 Dica:</strong> Você pode arrastar imagens diretamente para as áreas ou clicar para selecionar arquivos.
                </p>
                <button class="modal-close-btn" id="modal-close">Entendido</button>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('veo3-automator-modal-bg').remove();
    });
}

// ===== FUNÇÕES DE BOTÕES DE DOWNLOAD SIMPLES =====

// Adicionar botões de download aos vídeos
function addDownloadButtonsToVideos() {
    console.log("🔍 Procurando vídeos para adicionar botões de download...");
    
    // Seletores para encontrar vídeos do Google Flow
    const videoSelectors = [
        '.sc-510f5a89-0', // Container principal do vídeo
        '.sc-d90fd836-2', // Container do vídeo
        '.sc-ad287003-0'  // Player de vídeo
    ];
    
    let videosFound = 0;
    
    videoSelectors.forEach(selector => {
        const videoContainers = document.querySelectorAll(selector);
        videoContainers.forEach(container => {
            // Verificar se já tem botão de download
            if (container.querySelector('.veo3-download-button')) {
                return;
            }
            
            // Verificar se é realmente um container de vídeo
            if (container.querySelector('video') || container.querySelector('[class*="video"]')) {
                addDownloadButtonToContainer(container);
                videosFound++;
            }
        });
    });
    
    console.log(`✅ ${videosFound} botões de download adicionados`);
}

// Adicionar botão de download a um container específico
function addDownloadButtonToContainer(container) {
    const downloadButton = document.createElement('button');
    downloadButton.className = 'veo3-download-button';
    downloadButton.innerHTML = `
        <span class="veo3-download-icon">📥</span>
        <span>720p</span>
    `;
    
    // Tornar o container relativo para posicionamento absoluto
    container.style.position = 'relative';
    
    // Adicionar o botão
    container.appendChild(downloadButton);
    
    // Adicionar event listener
    downloadButton.addEventListener('click', () => {
        downloadVideoFromContainer(container, downloadButton);
    });
}

// Remover botões de download dos vídeos
function removeDownloadButtonsFromVideos() {
    const downloadButtons = document.querySelectorAll('.veo3-download-button');
    downloadButtons.forEach(button => {
        button.remove();
    });
    console.log(`🗑️ ${downloadButtons.length} botões de download removidos`);
}

// Download de vídeo específico
async function downloadVideoFromContainer(container, button) {
    try {
        console.log("📥 Iniciando download de vídeo...");
        
        // Mudar estado do botão
        button.classList.add('downloading');
        button.innerHTML = `
            <span class="veo3-download-icon">⏳</span>
            <span>Baixando...</span>
        `;
        
        // Simular hover para mostrar botões originais
        await simulateHover(container);
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Procurar botão de download original
        const originalDownloadButton = findOriginalDownloadButton(container);
        if (originalDownloadButton) {
            // Clicar no botão original
            originalDownloadButton.click();
            
            // Aguardar menu aparecer
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Selecionar opção 720p
            await selectDownloadOption('720p');
            
            // Sucesso
            button.classList.remove('downloading');
            button.classList.add('downloaded');
            button.innerHTML = `
                <span class="veo3-download-icon">✅</span>
                <span>Baixado</span>
            `;
            
            console.log("✅ Download concluído com sucesso!");
        } else {
            throw new Error("Botão de download original não encontrado");
        }
        
    } catch (error) {
        console.error("❌ Erro no download:", error);
        
        // Resetar botão em caso de erro
        button.classList.remove('downloading');
        button.innerHTML = `
            <span class="veo3-download-icon">📥</span>
            <span>720p</span>
        `;
    }
}

// Simular hover no container
async function simulateHover(container) {
    const mouseEvents = [
        new MouseEvent('mouseenter', { bubbles: true, cancelable: true }),
        new MouseEvent('mouseover', { bubbles: true, cancelable: true }),
        new MouseEvent('mousemove', { bubbles: true, cancelable: true })
    ];
    
    mouseEvents.forEach(event => {
        container.dispatchEvent(event);
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
}

// Encontrar botão de download original
function findOriginalDownloadButton(container) {
    const selectors = [
        'button[id^="radix-"] i.google-symbols[font-size="1.25rem"]',
        'button[aria-haspopup="menu"] i.google-symbols[font-size="1.25rem"]',
        'button.sc-e8425ea6-0 i.google-symbols[font-size="1.25rem"]'
    ];
    
    for (const selector of selectors) {
        const icon = container.querySelector(selector);
        if (icon && icon.textContent === 'download') {
            return icon.closest('button');
        }
    }
    
    return null;
}

// Selecionar opção de download
async function selectDownloadOption(resolution) {
    const menuSelectors = [
        '[data-radix-popper-content-wrapper]',
        '[data-radix-menu-content]',
        '[role="menu"]',
        '.sc-a3741a4a-2.eMwpFv'
    ];
    
    let menu = null;
    for (const selector of menuSelectors) {
        menu = document.querySelector(selector);
        if (menu && menu.offsetParent !== null) {
            break;
        }
    }
    
    if (!menu) return;
    
    // Procurar pela opção específica
    const options = [
        'Tamanho original (720p)',
        'Resolução ampliada (1080p)',
        'Original size (720p)',
        'Enlarged resolution (1080p)'
    ];
    
    for (const optionText of options) {
        const option = Array.from(menu.querySelectorAll('*')).find(element => 
            element.textContent && element.textContent.includes(optionText)
        );
        
        if (option) {
            option.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            return;
        }
    }
}

// Observer para detectar novos vídeos carregados
function setupVideoObserver() {
    const observer = new MutationObserver((mutations) => {
        let shouldAddButtons = false;
        
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Verificar se é um container de vídeo
                    if (node.matches && (
                        node.matches('.sc-510f5a89-0') ||
                        node.matches('.sc-d90fd836-2') ||
                        node.matches('.sc-ad287003-0') ||
                        node.querySelector('.sc-510f5a89-0') ||
                        node.querySelector('.sc-d90fd836-2') ||
                        node.querySelector('.sc-ad287003-0')
                    )) {
                        shouldAddButtons = true;
                    }
                }
            });
        });
        
        if (shouldAddButtons) {
            setTimeout(() => {
                addDownloadButtonsToVideos();
            }, 500);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log("👀 Observer de vídeos configurado");
}

// Carregar preferências quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadFeaturePreferences();
        // Adicionar botões de download automaticamente
        addDownloadButtonsToVideos();
        // Configurar observer para novos vídeos
        setupVideoObserver();
        console.log("📥 Botões de download adicionados automaticamente!");
    }, 1000);
});
