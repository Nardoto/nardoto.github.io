// Este arquivo content.js pode ser usado para funcionalidades futuras
// Por enquanto, a extração é feita via executeScript no popup.js

console.log('YouTube Link Extractor - Content Script carregado');

// Listener para mensagens futuras, se necessário
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
  }
});
