// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear(function() {
    // console.log("Dados de armazenamento local limpos ao instalar/atualizar.");
  });
});

// ADICIONADO AQUI: Listener para mensagens de download do content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadAudio") {
        console.log("background.js: Recebida requisição de download para:", request.filename);
        chrome.downloads.download({
            url: request.audioDataUrl,
            filename: request.filename,
            saveAs: false // Define como false para download automático sem prompt (pode ser true para perguntar)
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("background.js: Erro ao iniciar download:", chrome.runtime.lastError.message);
                sendResponse({ success: false, message: `Erro ao iniciar download: ${chrome.runtime.lastError.message}` });
            } else {
                console.log("background.js: Download iniciado com ID:", downloadId);
                sendResponse({ success: true, message: "Download iniciado com sucesso." });
            }
        });
        // Retorne true para indicar que a resposta será enviada assincronamente
        return true; 
    }
});