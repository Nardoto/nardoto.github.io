// content.js - Versão Final com Modais de Doação e Instruções

console.log("Suno Automator: content.js injetado!");

let songQueue = [];
let isAutomating = false;
let currentAutoIndex = 0;

// --- PARTE 1: LÓGICA DA INTERFACE ---

function initializeUI() {
    const toggleButton = document.createElement('button');
    toggleButton.id = 'suno-automator-toggle';
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/icon48.png');
    img.style.width = '30px';
    img.style.height = '30px';
    toggleButton.appendChild(img);
    toggleButton.title = 'Suno Automator - Open/Close';
    document.body.appendChild(toggleButton);
    toggleButton.addEventListener('click', toggleSidebar);

    const sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'suno-automator-sidebar';
    document.body.appendChild(sidebarContainer);

    fetch(chrome.runtime.getURL('sidebar.html'))
        .then(response => response.text())
        .then(html => {
            sidebarContainer.innerHTML = html;
            console.log("Suno Automator: Estrutura da Sidebar injetada.");
            attachSidebarListeners();
            loadSavedState();
            loadSavedDelay();
        }).catch(error => console.error("Suno Automator: Erro ao carregar sidebar.html:", error));
    
    chrome.storage.local.get(['sidebarOpen'], function(result) {
        if (result.sidebarOpen) {
            openSidebar();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('suno-automator-sidebar');
    if (!sidebar) return;
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
}

function openSidebar() {
    const sidebar = document.getElementById('suno-automator-sidebar');
    if (!sidebar) return;
    sidebar.classList.add('open');
    document.body.classList.add('suno-automator-sidebar-open');
    chrome.storage.local.set({ sidebarOpen: true });
}

function closeSidebar() {
    const sidebar = document.getElementById('suno-automator-sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('open');
    document.body.classList.remove('suno-automator-sidebar-open');
    chrome.storage.local.set({ sidebarOpen: false });
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
        updateStatus('⏹️ Automation cancelled by user.', true);
    });
    if (delayInput) delayInput.addEventListener('change', saveDelay);
    // Reseta toda a interface ao clicar em "Limpar"
    if (clearTextBtn) clearTextBtn.addEventListener('click', clearAllUI);
    if (inputText) inputText.addEventListener('focus', () => inputText.select());
    
    // NOVO: Listeners para os botões dos modais
    if (openInstructionsBtn) openInstructionsBtn.addEventListener('click', openInstructionsModal);
    if (openDonationBtn) openDonationBtn.addEventListener('click', openDonationModal);
}

// ===== NOVAS FUNÇÕES PARA OS MODAIS ADICIONADAS AQUI =====
function openInstructionsModal() {
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
// =======================================================

function processAndRenderCards() {
    const fullText = document.getElementById('inputText').value;
    if (!fullText.trim()) {
        updateStatus("⚠️ Por favor, cole um texto para analisar.", true);
        document.getElementById('inputText').focus();
        return;
    }
    saveState();
    songQueue = parseSongText(fullText);
    if (songQueue.length === 0) {
        updateStatus("❌ Nenhuma música encontrada no formato esperado. Verifique o formato do texto.", true);
        return;
    }
    renderSongCards(songQueue);
    updateStatus(`✅ ${songQueue.length} músicas prontas para serem geradas!`, true);
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
    const automationContainer = document.getElementById('automationContainer');
    if (automationContainer && songs.length > 0) {
        automationContainer.classList.remove('hidden');
        document.getElementById('totalCount').textContent = songs.length;
    }
}

async function startAutomation() {
    if (isAutomating || songQueue.length === 0) return;
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
    for (let i = 0; i < songQueue.length; i++) {
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
            await populateSunoAndCreate(song);
            if (i < songQueue.length - 1 && isAutomating) {
                updateStatus(`⏳ Aguardando ${delaySeconds} segundos antes da próxima música...`, true);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        if (card) card.classList.remove('processing');
    }
    stopAutomation();
    updateStatus(`🎉 Automação concluída! ${currentAutoIndex + 1} músicas processadas com sucesso!`, true);
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
            button.disabled = true;
            button.textContent = 'Enviando...';
            populateSunoAndCreate(songData);
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

        // 4) Status
        const statusContainer = document.getElementById('statusContainer');
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.textContent = 'Aguardando...';
        if (statusContainer) statusContainer.classList.add('hidden');

        // 5) Estado interno e persistência
        songQueue = [];
        isAutomating = false;
        chrome.storage.local.set({ sunoAutomator_savedText: '' });

        console.log('Suno Automator: Interface limpa com sucesso.');
    } catch (e) {
        console.warn('Suno Automator: falha ao limpar a interface:', e);
    }
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

async function populateSunoAndCreate(songData) {
    try {
        console.log("=== 🤖 STARTING AUTOMATION ===");
        const lyricsField = document.querySelector('textarea[placeholder="Write some lyrics"]');
        const styleField = document.querySelector('textarea[placeholder*="Hip-hop"]');
        const titleField = document.querySelector('input[placeholder="Add a song title"]');
        const createButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim().toLowerCase() === 'create');
        if (lyricsField) await fillField(lyricsField, songData.lyrics);
        else throw new Error("Lyrics field not found");
        if (styleField) await fillField(styleField, songData.style);
        else throw new Error("Style field not found");
        if (titleField) await fillField(titleField, songData.title);
        else throw new Error("Title field not found");
        await new Promise(resolve => setTimeout(resolve, 500));
        if (createButton) {
            createButton.click();
            handleAutomationResponse({ success: true, title: songData.title });
        } else {
            throw new Error("'Create' button not found");
        }
    } catch (error) {
        console.error("❌ Automation error:", error);
        handleAutomationResponse({ success: false, error: error.message, title: songData.title });
    }
}

async function fillField(element, value) {
    if (!element) throw new Error("Elemento não fornecido");
    element.focus();
    element.click();
    element.value = '';
    await new Promise(r => setTimeout(r, 100));
    element.value = value;
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    const changeEvent = new Event('change', { bubbles: true, cancelable: true });
    element.dispatchEvent(inputEvent);
    element.dispatchEvent(changeEvent);
    await new Promise(r => setTimeout(r, 100));
    element.blur();
}

function handleAutomationResponse(response) {
    const processedSongIndex = songQueue.findIndex(song => song.title === response.title);
    if (processedSongIndex === -1) return;
    const card = document.getElementById(`song-card-${processedSongIndex}`);
    const button = card ? card.querySelector('.insert-btn') : null;
    if (response.success) {
        updateStatus(`✅ "${response.title}" was processed successfully!`, true);
        if (card) card.classList.add('processed');
        if (button) button.textContent = '✅ Success';
    } else {
        updateStatus(`❌ Error processing "${response.title}": ${response.error}`, true);
        if (button) {
            button.disabled = false;
            button.textContent = '⚠️ Try Again';
        }
    }
}

function saveState() {
    const textToSave = document.getElementById('inputText').value;
    chrome.storage.local.set({ sunoAutomator_savedText: textToSave });
}

function loadSavedState() {
    chrome.storage.local.get(['sunoAutomator_savedText'], function(result) {
        if (result.sunoAutomator_savedText) {
            const inputText = document.getElementById('inputText');
            if (inputText) {
                inputText.value = result.sunoAutomator_savedText;
                if (result.sunoAutomator_savedText.trim()) {
                    updateStatus("💾 Previous text restored. Click 'Analyze' to continue.", true);
                }
            }
        }
    });
}

function saveDelay() {
    const delay = document.getElementById('delayInput').value;
    chrome.storage.local.set({ sunoAutomator_delay: delay });
}

function loadSavedDelay() {
    chrome.storage.local.get(['sunoAutomator_delay'], function(result) {
        if (result.sunoAutomator_delay) {
            const delayInput = document.getElementById('delayInput');
            if (delayInput) {
                delayInput.value = result.sunoAutomator_delay;
            }
        }
    });
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
            reject(new Error(`Element not found: ${selector}`));
        }, timeout);
    });
}