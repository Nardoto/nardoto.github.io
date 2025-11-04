// sidebar-script.js - Final Version with Instruction and Donation Modals

let songQueue = [];
let currentSongIndex = 0;
let isAutoProcessing = false;

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const processBtn = document.getElementById('processBtn');
    const songCardList = document.getElementById('song-card-list');
    const autoInsertBtn = document.getElementById('autoInsertBtn');
    const stopAutoBtn = document.getElementById('stopAutoBtn');
    const inputText = document.getElementById('inputText');
    const clearTextBtn = document.getElementById('clearTextBtn');
    // NEW: Selectors for footer buttons
    const openInstructionsBtn = document.getElementById('openInstructionsModalBtn');
    const openDonationBtn = document.getElementById('openDonationModalBtn');

    // --- Event Listeners ---
    if (processBtn) processBtn.addEventListener('click', processAndRenderCards);
    if (songCardList) songCardList.addEventListener('click', handleCardButtonClick);
    if (autoInsertBtn) autoInsertBtn.addEventListener('click', startAutoProcessing);
    if (stopAutoBtn) stopAutoBtn.addEventListener('click', stopAutoProcessing);
    if (inputText) inputText.addEventListener('click', () => inputText.select());
    if (clearTextBtn) clearTextBtn.addEventListener('click', clearAll);
    
    // NEW: Listeners for modal buttons
    if (openInstructionsBtn) openInstructionsBtn.addEventListener('click', openInstructionsModal);
    if (openDonationBtn) openDonationBtn.addEventListener('click', openDonationModal);
    
    document.addEventListener('suno-automator-response', handleResponseFromPage);
});

// --- NEW FUNCTIONS FOR MODALS ---

function openInstructionsModal() {
    // Avoid opening multiple modals
    if (document.getElementById('suno-automator-modal-bg')) return;
    
    const modalHTML = `
        <div id="suno-automator-modal-bg">
            <div class="suno-automator-modal">
                <h2>❓ How to Use / Como Usar</h2>
                <div style="display: flex; justify-content: space-between; gap: 15px;">
                    <div style="flex: 1;">
                        <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">English</h3>
                        <ol style="text-align: left; font-size: 0.9rem; padding-left: 20px;">
                            <li>Paste your formatted text.</li>
                            <li>Click "Analyze and List" to see the cards.</li>
                            <li>Use the card buttons or automatic insertion.</li>
                        </ol>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Português</h3>
                        <ol style="text-align: left; font-size: 0.9rem; padding-left: 20px;">
                            <li>Cole seu texto formatado.</li>
                            <li>Clique em "Analisar e Listar" para ver os cards.</li>
                            <li>Use os botões de cada card ou a inserção automática.</li>
                        </ol>
                    </div>
                </div>
                <button class="modal-close-btn" id="modal-close">Got it / Entendido</button>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('modal-close').addEventListener('click', () => document.getElementById('suno-automator-modal-bg').remove());
}

function openDonationModal() {
    // Avoid opening multiple modals
    if (document.getElementById('suno-automator-modal-bg')) return;

    const modalHTML = `
        <div id="suno-automator-modal-bg">
            <div class="suno-automator-modal" style="max-width: 500px;">
                <h2 style="text-align: center; color: #ff7eb9;">❤️ Thank you for your support!</h2>
                <div class="donation-columns" style="display: flex; gap: 20px; margin: 20px 0;">
                    <div class="donation-column" style="flex: 1; border: 1px solid #444; border-radius: 8px; padding: 15px; text-align: center; background-color: #2a2a2a;">
                        <h3 style="border-bottom: 1px solid #555; padding-bottom: 10px; margin-bottom: 15px;">BR Brazil - PIX</h3>
                        <p style="font-size: 0.9rem;"><strong>Tharcisio Bernardo Valli Nardoto</strong></p>
                        <p style="font-size: 0.9rem;"><strong>PIX Key:</strong><br><span style="color: #a9d7ff;">tharcisionardoto@gmail.com</span></p>
                        <p style="font-size: 0.9rem;"><strong>WhatsApp:</strong><br>(27) 99913-2594</p>
                    </div>
                    <div class="donation-column" style="flex: 1; border: 1px solid #444; border-radius: 8px; padding: 15px; text-align: center; background-color: #2a2a2a; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <h3 style="border-bottom: 1px solid #555; padding-bottom: 10px; margin-bottom: 15px;">International</h3>
                        <p style="font-size: 0.9rem;">Support the project from anywhere in the world!</p>
                        <a href="https://ko-fi.com/nardoto" target="_blank" class="kofi-btn" style="background-color: #f9b038; color: #000; font-weight: bold; padding: 10px 20px; border-radius: 20px; text-decoration: none; margin-top: 15px; display: inline-flex; align-items: center; gap: 8px;">
                           Ko-fi
                        </a>
                    </div>
                </div>
                <p style="text-align: center; font-size: 0.9rem; margin-top: 20px;">
                    Any amount is welcome.<br>
                    <em style="color: #a9d7ff;">“The dream is the most real thing there is.”</em><br>
                    Gratitude! 🙏
                </p>
                <button class="modal-close-btn" id="modal-close" style="margin-top: 20px;">Close</button>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('modal-close').addEventListener('click', () => document.getElementById('suno-automator-modal-bg').remove());
}

// --- Rest of the code (no changes) ---

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
        if (statusText) statusText.textContent = 'Waiting...';
    }
    songQueue = [];
    if (isAutoProcessing) stopAutoProcessing();
    console.log("Interface cleared and reset.");
}

function processAndRenderCards() {
    const fullText = document.getElementById('inputText').value;
    if (!fullText.trim()) {
        updateStatus("Please paste a text to analyze.", true);
        return;
    }
    songQueue = parseSongText(fullText);
    if (songQueue.length === 0) {
        updateStatus("No songs found in the expected format.", true);
        document.getElementById('automationContainer').classList.add('hidden');
        return;
    }
    renderSongCards(songQueue);
    updateStatus(`${songQueue.length} songs ready to be generated.`, true);
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
            <p class="card-style" title="${song.style}">Style: ${song.style.substring(0, 30)}...</p>
            <button class="insert-btn" data-song-index="${index}">➡️ Insert into Suno</button>
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
    updateStatus('Automation stopped by the user.', true);
    document.querySelectorAll('.song-card.processing').forEach(card => card.classList.remove('processing'));
}

function processNextSongInAutoQueue() {
    if (!isAutoProcessing || currentSongIndex >= songQueue.length) {
        if (isAutoProcessing) updateStatus('🎉 Automation complete!', true);
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
      button.textContent = 'Sending...';
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
        if (button) button.textContent = '✅ Success';
        if (isAutoProcessing && processedSongIndex === currentSongIndex) {
            currentSongIndex++;
            const delayInput = document.getElementById('delayInput');
            const delaySeconds = parseInt(delayInput.value, 10) || 3;
            updateStatus(`Success! Waiting ${delaySeconds}s for the next song...`, true);
            setTimeout(processNextSongInAutoQueue, delaySeconds * 1000);
        } else {
            updateStatus(`"${response.title}" was processed successfully!`, true);
        }
    } else {
        updateStatus(`❌ Error processing "${response.title}": ${response.error}`, true);
        if (button) {
            button.disabled = false;
            button.textContent = '⚠️ Try Again';
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