// module-loader.js - Carregador de módulos para compatibilidade

// Este arquivo garante que os módulos sejam exportados corretamente
// para uso tanto em content scripts quanto em workers

(function() {
  'use strict';
  
  // Verificar se estamos em um Worker ou na página
  const isWorker = typeof importScripts === 'function';
  const isModule = typeof module !== 'undefined' && module.exports;
  
  // Função para registrar módulos globalmente
  function registerModule(name, moduleExports) {
    if (isWorker) {
      // No worker, adicionar ao escopo global
      self[name] = moduleExports;
    } else {
      // Na página, adicionar ao window
      window[name] = moduleExports;
    }
  }
  
  // Polyfill para importMap se necessário
  if (!isWorker && !document.querySelector('script[type="importmap"]')) {
    const importMap = document.createElement('script');
    importMap.type = 'importmap';
    importMap.textContent = JSON.stringify({
      imports: {
        './utils.js': chrome.runtime.getURL('utils.js'),
        './dom-manager.js': chrome.runtime.getURL('dom-manager.js'),
        './storage-manager.js': chrome.runtime.getURL('storage-manager.js'),
        './lyrics-worker.js': chrome.runtime.getURL('lyrics-worker.js')
      }
    });
    document.head.appendChild(importMap);
  }
  
  // Expor função de registro
  if (isWorker) {
    self.registerModule = registerModule;
  } else {
    window.registerModule = registerModule;
  }
  
})();