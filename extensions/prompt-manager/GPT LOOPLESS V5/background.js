// background.js - GPT LoopLess 5.0
// Service Worker para gerenciamento de extensão exclusiva para ChatGPT

chrome.runtime.onInstalled.addListener((details) => {
  const version = chrome.runtime.getManifest().version;
  
  if (details.reason === 'install') {
    console.log(`▶ GPT LoopLess v${version} instalado com sucesso`);
  } else if (details.reason === 'update') {
    console.log(`▶ GPT LoopLess atualizado para v${version}`);
  }
});

// Opcional: Configurações iniciais ou cleanup
chrome.runtime.onStartup.addListener(() => {
  console.log("GPT LoopLess: Service worker iniciado");
});