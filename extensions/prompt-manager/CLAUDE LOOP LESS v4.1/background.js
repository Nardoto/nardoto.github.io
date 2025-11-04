// background.js - Prompt Manager v2.0
// Service Worker para gerenciamento de extensão

chrome.runtime.onInstalled.addListener((details) => {
  const version = chrome.runtime.getManifest().version;
  
  if (details.reason === 'install') {
    console.log(`▶ Prompt Manager v${version} instalado com sucesso`);
  } else if (details.reason === 'update') {
    console.log(`▶ Prompt Manager atualizado para v${version}`);
  }
});

// Opcional: Configurações iniciais ou cleanup
chrome.runtime.onStartup.addListener(() => {
  console.log("Prompt Manager: Service worker iniciado");
});