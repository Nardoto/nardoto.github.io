// content.js (v.Sidebar_Integration)
console.log("Google Speech content.js (v.Sidebar_Integration) injetado!");

let lastAudioSrc = null;
let sidebarInjected = false;

// Função para injetar a sidebar
async function injectSidebar() {
    if (sidebarInjected) return;

    try {
        // Busca o HTML da sidebar
        const sidebarUrl = chrome.runtime.getURL('sidebar.html');
        const response = await fetch(sidebarUrl);
        const sidebarHTML = await response.text();

        // Cria o container da sidebar usando DOM methods ao invés de innerHTML
        const sidebarContainer = document.createElement('div');
        sidebarContainer.id = 'blablabot-sidebar';
        
        // Cria um documento temporário para fazer o parse do HTML de forma segura
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sidebarHTML;
        
        // Move o conteúdo do body do HTML para nossa sidebar
        const bodyContent = tempDiv.querySelector('body');
        if (bodyContent) {
            while (bodyContent.firstChild) {
                sidebarContainer.appendChild(bodyContent.firstChild);
            }
        } else {
            // Se não houver body, usa todo o conteúdo
            while (tempDiv.firstChild) {
                sidebarContainer.appendChild(tempDiv.firstChild);
            }
        }

        // Cria o botão toggle
        const toggleButton = document.createElement('button');
        toggleButton.id = 'blablabot-toggle';
        toggleButton.innerHTML = '🎵';
        toggleButton.title = 'Google Speech - Clique para abrir/fechar';

        // Adiciona os elementos ao DOM
        document.body.appendChild(sidebarContainer);
        document.body.appendChild(toggleButton);
        
        // Injeta o modal de ajuda diretamente no body para que funcione mesmo com a sidebar fechada
        const helpModal = document.createElement('div');
        helpModal.id = 'help-modal';
        helpModal.className = 'modal hidden';
        helpModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📋 Como usar o Google Speech</h3>
                    <button class="modal-close" id="helpModalClose">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="help-content">
                        <h4>🚀 Modo Automático:</h4>
                        <ol>
                            <li>Cole o texto na área de texto</li>
                            <li>Clique em "📝 Dividir Texto"</li>
                            <li>Revise as partes divididas</li>
                            <li>Clique em "🎵 Iniciar Modo Automático" para começar</li>
                        </ol>
                        
                        <h4>✏️ Modo Manual:</h4>
                        <ol>
                            <li>Clique em "➕ Adicionar Bloco"</li>
                            <li>Digite o texto em cada bloco</li>
                            <li>Clique em "🎵 Iniciar Geração de Áudio"</li>
                        </ol>
                        
                        <h4>💡 Dicas:</h4>
                        <ul>
                            <li>Use o modo automático para textos longos</li>
                            <li>Use o modo manual para controle total</li>
                            <li>Você pode editar as partes antes de processar</li>
                            <li>O sistema baixa automaticamente os áudios gerados</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="helpModalCloseBtn" class="success-btn">Entendi!</button>
                </div>
            </div>
        `;
        document.body.appendChild(helpModal);

        // Adiciona event listener para o toggle
        toggleButton.addEventListener('click', toggleSidebar);
        
        // Adiciona event listeners para o modal de ajuda
        const helpModalClose = helpModal.querySelector('#helpModalClose');
        const helpModalCloseBtn = helpModal.querySelector('#helpModalCloseBtn');
        
        if (helpModalClose) {
            helpModalClose.addEventListener('click', () => {
                helpModal.classList.add('hidden');
            });
        }
        
        if (helpModalCloseBtn) {
            helpModalCloseBtn.addEventListener('click', () => {
                helpModal.classList.add('hidden');
            });
        }
        
        // Fechar modal ao clicar fora
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.add('hidden');
            }
        });

        // Injeta o script da sidebar
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('sidebar-script.js');
        script.onload = function() {
            console.log("Google Speech: Script da sidebar carregado!");
        };
        document.head.appendChild(script);
        
        // Função global para abrir o modal de ajuda
        window.openHelpModal = function() {
            const helpModal = document.getElementById('help-modal');
            if (helpModal) {
                helpModal.classList.remove('hidden');
            }
        };

        sidebarInjected = true;
        console.log("Google Speech: Sidebar injetada com sucesso!");

        // Verifica se já existe estado salvo para abrir automaticamente
        chrome.storage.local.get(['sidebarOpen'], function(result) {
            if (result.sidebarOpen) {
                openSidebar();
            }
        });

    } catch (error) {
        console.error("Google Speech: Erro ao injetar sidebar:", error);
    }
}

// Função para toggle da sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('blablabot-sidebar');
    if (!sidebar) return;

    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// Função para abrir sidebar
function openSidebar() {
    const sidebar = document.getElementById('blablabot-sidebar');
    if (!sidebar) return;

    sidebar.classList.add('open');
    document.body.classList.add('blablabot-sidebar-open');
    
    // Atualiza o ícone do botão
    const toggleBtn = document.getElementById('blablabot-toggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = '←';
        toggleBtn.title = 'Google Speech - Clique para recolher';
    }
    
    // Salva o estado
    chrome.storage.local.set({ sidebarOpen: true });
    
    console.log("Google Speech: Sidebar aberta");
}

// Função para fechar sidebar
function closeSidebar() {
    const sidebar = document.getElementById('blablabot-sidebar');
    if (!sidebar) return;

    sidebar.classList.remove('open');
    document.body.classList.remove('blablabot-sidebar-open');
    
    // Atualiza o ícone do botão
    const toggleBtn = document.getElementById('blablabot-toggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = '→';
        toggleBtn.title = 'Google Speech - Clique para abrir';
    }
    
    // Salva o estado
    chrome.storage.local.set({ sidebarOpen: false });
    
    console.log("Google Speech: Sidebar fechada");
}

// Aguarda o DOM carregar completamente antes de injetar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSidebar);
} else {
    // Se o DOM já estiver carregado
    setTimeout(injectSidebar, 100);
}

// Funções originais do content.js mantidas
async function waitForElement(selector, timeout = 30000, interval = 200, aninhadoEm = document) {
  console.log(`content.js: Aguardando por "${selector}"`);
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const element = aninhadoEm.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
        const styles = getComputedStyle(element);
        const isDisplayed = styles.display !== 'none' && styles.visibility !== 'hidden' && parseFloat(styles.opacity) > 0;
        if (isVisible && isDisplayed) {
          console.log(`content.js: Elemento "${selector}" ENCONTRADO e VISÍVEL.`);
          clearInterval(timer);
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(timer);
          console.error(`content.js: Elemento "${selector}" NÃO ESTAVA VISÍVEL após ${timeout}ms.`);
          reject(new Error(`Elemento "${selector}" NÃO ESTAVA VISÍVEL após ${timeout}ms.`));
        }
      } else if (Date.now() - startTime > timeout) {
        clearInterval(timer);
        console.error(`content.js: Elemento "${selector}" NÃO FOI ENCONTRADO NO DOM APÓS ${timeout}ms.`);
        reject(new Error(`Elemento "${selector}" NÃO FOI ENCONTRADO NO DOM APÓS ${timeout}ms.`));
      }
    }, interval);
  });
}

async function waitForAudioElement(timeout = 120000, interval = 1000) {
  console.log("content.js: Procurando por elemento de áudio...");
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkForAudio = () => {
      // Tenta múltiplos seletores para encontrar o áudio
      const audioSelectors = [
        'audio[controls]',
        'audio[src]',
        'audio',
        '[role="button"][aria-label*="audio"]',
        '[role="button"][aria-label*="Play"]',
        'button[aria-label*="Play"]',
        'div[role="button"][aria-label*="Play"]'
      ];
      
      for (const selector of audioSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.tagName === 'AUDIO') {
            if (element.src && element.src.startsWith('data:audio')) {
              console.log(`content.js: Áudio encontrado com seletor "${selector}"`);
              resolve(element);
              return;
            }
          } else {
            // Procura por áudio próximo ao botão
            const audioNearby = element.querySelector('audio') || 
                               element.parentElement?.querySelector('audio') ||
                               element.closest('[data-testid]')?.querySelector('audio');
            
            if (audioNearby && audioNearby.src && audioNearby.src.startsWith('data:audio')) {
              console.log(`content.js: Áudio encontrado próximo ao elemento "${selector}"`);
              resolve(audioNearby);
              return;
            }
          }
        }
      }
      
      // Se passou do timeout
      if (Date.now() - startTime > timeout) {
        console.error(`content.js: Nenhum elemento de áudio foi encontrado após ${timeout}ms`);
        reject(new Error(`Nenhum elemento de áudio foi encontrado após ${timeout}ms`));
        return;
      }
      
      // Log de progresso a cada 10 segundos
      if ((Date.now() - startTime) % 10000 < interval) {
        console.log(`content.js: Ainda procurando áudio... ${Math.floor((Date.now() - startTime) / 1000)}s`);
      }
      
      setTimeout(checkForAudio, interval);
    };
    
    checkForAudio();
  });
}

async function waitForAudioDataUrl(audioElement, timeout = 90000, interval = 500, srcToIgnore = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log("content.js: Aguardando src do audioElement ser preenchido com Data URL válido e NOVO...");
    if (srcToIgnore) console.log("content.js: Ignorando src antigo:", srcToIgnore.substring(0, 50) + "...");

    const timer = setInterval(() => {
      if (!document.body.contains(audioElement)) {
        clearInterval(timer);
        console.error("content.js: Elemento <audio> foi removido do DOM.");
        reject(new Error("Elemento <audio> removido do DOM."));
        return;
      }
      if (audioElement && audioElement.src && audioElement.src.startsWith('data:audio/wav;base64,') && audioElement.src.length > 1000) {
        if (srcToIgnore && audioElement.src === srcToIgnore) {
          if ((Date.now() - startTime) % 5000 < interval) {
            console.log("content.js: Encontrado src, mas é o mesmo que o anterior. Aguardando atualização...");
          }
        } else {
          clearInterval(timer);
          console.log("content.js: src do audioElement preenchido com NOVO Data URL.");
          resolve(audioElement.src);
        }
      } else if (Date.now() - startTime > timeout) {
        clearInterval(timer);
        let errorMsg = `Elemento <audio> não obteve um Data URL válido e NOVO no src após ${timeout}ms.`;
        console.error(`content.js: ${errorMsg}`);
        reject(new Error(errorMsg));
      }
    }, interval);
  });
}

async function triggerAudioGeneration(text) {
  let textarea;
  console.log("content.js: Procurando textarea para colar texto...");
  
  // Lista de seletores para tentar
  const textareaSelectors = [
    'textarea[arialabel="Enter a prompt"]',
    'textarea[aria-label="Enter a prompt"]', 
    'textarea[placeholder*="prompt"]',
    'textarea[placeholder*="text"]',
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]'
  ];
  
  for (const selector of textareaSelectors) {
    try {
      console.log(`content.js: Tentando seletor: ${selector}`);
      textarea = await waitForElement(selector, 3000);
      if (textarea) {
        console.log(`content.js: Textarea encontrada com seletor: ${selector}`);
        break;
      }
    } catch (e) {
      console.log(`content.js: Seletor ${selector} não funcionou, tentando próximo...`);
      continue;
    }
  }
  
  if (!textarea) {
    throw new Error("Nenhuma textarea encontrada para colar o texto");
  }

  // Limpa o campo primeiro
  if (textarea.tagName.toLowerCase() === 'textarea' || textarea.tagName.toLowerCase() === 'input') {
    textarea.value = '';
    textarea.focus();
    await new Promise(resolve => setTimeout(resolve, 100));
    textarea.value = text;
  } else if (textarea.hasAttribute('contenteditable')) {
    textarea.textContent = '';
    textarea.focus();
    await new Promise(resolve => setTimeout(resolve, 100));
    textarea.textContent = text;
  }
  
  // Dispara eventos para notificar a mudança
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  
  console.log("content.js: Texto colado no textarea.");
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Garante que o campo está focado antes de enviar
  textarea.focus();
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Tenta Ctrl+Enter primeiro
  textarea.dispatchEvent(new KeyboardEvent('keydown', { 
    key: 'Enter', 
    code: 'Enter', 
    ctrlKey: true, 
    bubbles: true, 
    cancelable: true 
  }));
  
  console.log("content.js: Ctrl+Enter enviado.");
  
  // Se não funcionar, tenta procurar botão de submit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const submitSelectors = [
    'button[type="submit"]',
    'button:contains("Submit")',
    'button:contains("Generate")',
    'button:contains("Send")',
    '[role="button"][aria-label*="submit"]',
    '[role="button"][aria-label*="generate"]'
  ];
  
  for (const selector of submitSelectors) {
    try {
      const submitButton = document.querySelector(selector);
      if (submitButton && !submitButton.disabled) {
        console.log(`content.js: Clicando em botão submit: ${selector}`);
        submitButton.click();
        break;
      }
    } catch (e) {
      continue;
    }
  }
}

// Listener para eventos customizados da sidebar
document.addEventListener('blablabot-paste-text', async (event) => {
    const request = event.detail;
    const isManual = request.isManual || false;
    
    console.log(`content.js: Recebido evento da sidebar (${isManual ? 'manual' : 'automático'}):`, request);
    
    try {
        const existingAudioPlayer = document.querySelector('audio[controls][src^="data:audio"]');
        if (existingAudioPlayer && existingAudioPlayer.src !== lastAudioSrc) {
            lastAudioSrc = existingAudioPlayer.src;
            console.log("content.js: SRC de áudio anterior era:", lastAudioSrc.substring(0,50)+"...");
        } else if (!existingAudioPlayer) {
            lastAudioSrc = null;
            console.log("content.js: Nenhum player de áudio encontrado antes de gerar novo.");
        }

        await triggerAudioGeneration(request.text);

        if (isManual) {
            // Para cópia manual, apenas cola o texto e responde sucesso
            console.log("content.js: Cópia manual - texto colado no AI Studio");
            const responseEvent = new CustomEvent('blablabot-paste-response', {
                detail: {
                    partIndex: request.partIndex,
                    success: true,
                    downloadInitiated: false,
                    message: "Texto colado no AI Studio. Configure e clique em Submit manualmente.",
                    isManual: true
                }
            });
            document.dispatchEvent(responseEvent);
            return;
        }

        // Para processamento automático, continua com o fluxo completo
        console.log("content.js: Aguardando NOVO elemento de áudio aparecer...");
        
        // Usa a nova função mais robusta para encontrar o áudio
        const audioPlayerElement = await waitForAudioElement(120000, 1000);
        const audioDataUrl = await waitForAudioDataUrl(audioPlayerElement, 90000, 500, lastAudioSrc);

        lastAudioSrc = audioDataUrl;
        console.log("content.js: Data URL do áudio NOVO obtido:", audioDataUrl.substring(0, 100) + "...");
        
        chrome.runtime.sendMessage({ 
            action: "downloadAudio", 
            audioDataUrl: audioDataUrl, 
            filename: request.filename || `audio_parte_${Date.now()}.wav` 
        }, (responseFromBg) => {
            // Dispara evento de resposta para a sidebar
            const responseEvent = new CustomEvent('blablabot-paste-response', {
                detail: {
                    partIndex: request.partIndex,
                    success: !chrome.runtime.lastError && responseFromBg && responseFromBg.success,
                    downloadInitiated: responseFromBg && responseFromBg.success,
                    message: chrome.runtime.lastError ? 
                        `Erro: ${chrome.runtime.lastError.message}` : 
                        (responseFromBg && responseFromBg.success ? 
                            "Download solicitado ao background." : 
                            `Falha: ${responseFromBg ? responseFromBg.message : 'sem resposta'}`)
                }
            });
            document.dispatchEvent(responseEvent);
        });

    } catch (error) {
        console.error("content.js: ERRO no processamento:", error.message, error.stack);
        
        // Dispara evento de erro para a sidebar
        const errorEvent = new CustomEvent('blablabot-paste-response', {
            detail: {
                partIndex: request.partIndex,
                success: false,
                downloadInitiated: false,
                message: error.message,
                isManual: isManual
            }
        });
        document.dispatchEvent(errorEvent);
    }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "pasteText") {
    console.log("content.js: Recebido pasteText com texto:", request.text.substring(0, 50) + "...");
    try {
      const existingAudioPlayer = document.querySelector('audio[controls][src^="data:audio"]');
      if (existingAudioPlayer && existingAudioPlayer.src !== lastAudioSrc) {
          lastAudioSrc = existingAudioPlayer.src;
          console.log("content.js: SRC de áudio anterior era:", lastAudioSrc.substring(0,50)+"...");
      } else if (!existingAudioPlayer) {
          lastAudioSrc = null;
          console.log("content.js: Nenhum player de áudio encontrado antes de gerar novo.");
      }

      await triggerAudioGeneration(request.text);

      console.log("content.js: Aguardando NOVO elemento de áudio e Data URL...");
      const audioPlayerSelector = 'audio[controls]';
      const audioPlayerElement = await waitForElement(audioPlayerSelector, 60000); 
      const audioDataUrl = await waitForAudioDataUrl(audioPlayerElement, 90000, 500, lastAudioSrc);

      lastAudioSrc = audioDataUrl;
      console.log("content.js: Data URL do áudio NOVO obtido:", audioDataUrl.substring(0, 100) + "...");
      
      chrome.runtime.sendMessage({ 
        action: "downloadAudio", 
        audioDataUrl: audioDataUrl, 
        filename: request.filename || `audio_parte_${Date.now()}.wav` 
      }, (responseFromBg) => {
        if (chrome.runtime.lastError) {
          console.error("content.js: Erro ao enviar downloadAudio para background:", chrome.runtime.lastError.message);
          sendResponse({ success: false, downloadInitiated: false, message: `Erro ao enviar Data URL: ${chrome.runtime.lastError.message}` });
        } else if (responseFromBg && responseFromBg.success) {
          console.log("content.js: Solicitação de download enviada para background.");
          sendResponse({ success: true, downloadInitiated: true, message: "Download solicitado ao background." });
        } else {
          console.error("content.js: Falha ao enviar downloadAudio para background:", responseFromBg);
          sendResponse({ success: false, downloadInitiated: false, message: `Falha ao solicitar download via background: ${responseFromBg ? responseFromBg.message : 'sem resposta'}` });
        }
      });

    } catch (error) {
      console.error("content.js: ERRO no processamento:", error.message, error.stack);
      sendResponse({ success: false, downloadInitiated: false, message: error.message });
    }
    return true; 
  }
});