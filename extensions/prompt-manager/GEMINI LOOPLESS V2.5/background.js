// background.js - Gemini LoopLess 2.5
// Service Worker para gerenciamento de extensão

chrome.runtime.onInstalled.addListener((details) => {
  const version = chrome.runtime.getManifest().version;
  
  if (details.reason === 'install') {
  console.log(`▶ Gemini LoopLess v${version} instalado com sucesso`);
  } else if (details.reason === 'update') {
  console.log(`▶ Gemini LoopLess atualizado para v${version}`);
  }
});

// Opcional: Configurações iniciais ou cleanup
chrome.runtime.onStartup.addListener(() => {
  console.log("Gemini LoopLess: Service worker iniciado");
});