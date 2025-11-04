// chatgpt_handler.js - Handler específico para ChatGPT
(function(){
  const PM = (window.PMHandlers = window.PMHandlers || {});

  function getLastResponseChatGPT() {
    try {
      console.log('=== CHATGPT HANDLER getLastResponse ===');
      
      // Seletores expandidos para melhor detecção no ChatGPT
      const containerSelectors = [
        '[data-message-author-role="assistant"]',
        '[data-author="assistant"]',
        '[class*="assistant"]',
        'div[data-testid*="conversation-turn"]',
        '.group.text-token-text-primary',
        '[class*="group"][class*="text-"]'
      ];
      
      let containers = [];
      for (const s of containerSelectors) {
        try {
          const list = document.querySelectorAll(s);
          if (list && list.length) { 
            // Filtra containers que podem ser da sidebar ou ocultos
            containers = Array.from(list).filter(el => 
              el.offsetParent !== null && 
              !el.closest('#promptmanager-sidebar') &&
              !el.hasAttribute('aria-hidden')
            );
            if (containers.length) break;
          }
        } catch {}
      }
      
      if (!containers.length) {
        console.log('ChatGPT handler: No assistant containers found');
        return '';
      }
      
      // Filtra containers placeholder
      const validContainers = containers.filter(container => {
        const id = container.getAttribute('data-message-id');
        return id && !id.includes('placeholder');
      });
      
      if (!validContainers.length) {
        console.log('ChatGPT handler: Only placeholder containers found');
        return '';
      }
      
      const last = validContainers[validContainers.length - 1];
      console.log('ChatGPT handler: Found last container', last);
      
      // Seletores de conteúdo focados para ChatGPT
      const contentSelectors = [
        '.markdown.prose',
        '.markdown',
        'div[data-message-content="true"]',
        '.prose',
        '.whitespace-pre-wrap'
      ];
      
      for (const cs of contentSelectors) {
        try {
          const el = last.querySelector(cs);
          if (el) {
            const text = el.innerText || el.textContent || '';
            if (text.trim()) {
              console.log(`ChatGPT handler: Found text with selector ${cs}:`, text.substring(0, 100) + '...');
              return text.trim();
            }
          }
        } catch {}
      }
      
      // Fallback simples - pega texto diretamente com filtro mínimo
      let fallback = last.innerText || last.textContent || '';
      fallback = fallback.trim();
      
      console.log('ChatGPT handler: Raw fallback text length:', fallback.length);
      console.log('ChatGPT handler: Raw fallback preview:', fallback.substring(0, 200) + '...');
      
      // Verifica se há pelo menos algum conteúdo significativo
      if (!fallback || fallback.length < 3) {
        console.log('ChatGPT handler: No meaningful content found - too short');
        return '';
      }
      
      // Verifica se não é apenas texto de UI (mais permissivo)
      const cleanForCheck = fallback.replace(/\s+/g, ' ').trim().toLowerCase();
      if (cleanForCheck === 'copiar editar' || cleanForCheck === 'copy edit' || cleanForCheck === 'intercom not booted') {
        console.log('ChatGPT handler: Only UI text found:', cleanForCheck);
        return '';
      }
      
      // Limpa ruído óbvio da UI preservando conteúdo
      const cleanedText = fallback
        .replace(/^(csharp|less|vbnet|sql|javascript|python|mathematica)\s*/i, '') // Remove indicadores de linguagem de código  
        .replace(/\n(Copiar|Editar|Copy|Edit)\n/g, '\n') // Remove texto de botão standalone
        .replace(/^(Copiar|Editar|Copy|Edit)\s*\n/i, '') // Remove texto de botão no início
        .trim();
      
      // Se a limpeza removeu tudo importante, usa o texto original
      const finalText = (cleanedText && cleanedText.length > 10) ? cleanedText : fallback;
      
      console.log('ChatGPT handler: Using fallback text:', finalText.substring(0, 100) + '...');
      return finalText;
    } catch (e) {
      console.log('ChatGPT handler getLastResponse error:', e.message);
      return '';
    }
  }

  function waitForFinishChatGPT() {
    return new Promise((resolve) => {
      console.log('ChatGPTHandler: aguardando término...');
      let lastLen = 0, stable = 0;
      const poll = setInterval(() => {
        const stopSelectors = [
          'button[data-testid="stop-button"]',
          'button[aria-label*="Stop"]',
          'button[aria-label*="Interromper"]',
          'button[aria-label*="Parar"]',
          'button[title*="Stop"]',
          'button[title*="Parar"]',
          '[data-testid*="stop"]',
          'button:has([data-testid*="stop"])'
        ];
        let stopBtn = null;
        for (const sel of stopSelectors) { try { stopBtn = document.querySelector(sel); if (stopBtn && stopBtn.offsetParent !== null) break; } catch {} }
        const text = getLastResponseChatGPT();
        const len = (text || '').length;
        if (len === lastLen) stable++; else { stable = 0; lastLen = len; }
        if (!stopBtn && stable >= 3) { clearInterval(poll); setTimeout(resolve, 1000); }
      }, 1500);
      setTimeout(() => { try { clearInterval(poll); } catch{} resolve(); }, 90000);
    });
  }

  PM.chatgpt = {
    waitForFinish: waitForFinishChatGPT,
    getLastResponse: getLastResponseChatGPT
  };
})();
