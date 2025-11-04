// gemini_handler.js - Site-specific handler for Gemini
(function(){
  const PM = (window.PMHandlers = window.PMHandlers || {});

  function getLastResponseGemini() {
    try {
      console.log('=== GEMINI HANDLER getLastResponse ===');
      const seletores = [
        '.model-response-text',
        '.message-content',
        '[class*="response-container"]',
        '.conversation-turn',
        'message-content',
        '[data-message-author="assistant"]',
        '.assistant-message',
        '[jsname*="message"]'
      ];
      let containers = [];
      for (const s of seletores) {
        try {
          const found = document.querySelectorAll(s);
          if (found && found.length) {
            containers = found;
            break;
          }
        } catch {}
      }
      if (!containers || containers.length === 0) return '';
      const last = containers[containers.length - 1];

      // tenta dentro do container, pegando parágrafos
      const textSelectors = [
        'p',
        '[class*="content"] p',
        '*:not(button):not(input)'
      ];
      for (const ts of textSelectors) {
        try {
          const nodes = last.querySelectorAll(ts);
          if (nodes && nodes.length) {
            const text = Array.from(nodes).map(n => n.innerText || n.textContent || '').join('\n').trim();
            if (text && text.length > 10) return text;
          }
        } catch {}
      }

      const fallback = last.innerText || last.textContent || '';
      return (fallback || '').trim();
    } catch (e) {
      console.log('Gemini handler getLastResponse error:', e.message);
      return '';
    }
  }

  function waitForFinishGemini() {
    return new Promise((resolve) => {
      console.log('GeminiHandler: aguardando término...');
      let previousLength = 0;
      let stable = 0;
      const poll = setInterval(() => {
        const stopEls = document.querySelectorAll(
          '.stop-icon, [class*="stop-icon"], .blue-circle.stop-icon, button[aria-label*="Parar"], button[mattooltip*="Stop"], .stop-button'
        );
        const isGenerating = document.querySelector('[class*="generating"], [class*="typing"], [aria-busy="true"]');
        let len = 0;
        try { len = (getLastResponseGemini() || '').length; } catch { len = 0; }
        if (len === previousLength) stable++; else { stable = 0; previousLength = len; }
        if (stopEls.length === 0 && !isGenerating && stable >= 3) {
          clearInterval(poll);
          setTimeout(resolve, 1500);
        }
      }, 2000);
      setTimeout(() => { try { clearInterval(poll); } catch{} resolve(); }, 120000);
    });
  }

  PM.gemini = {
    waitForFinish: waitForFinishGemini,
    getLastResponse: getLastResponseGemini
  };
})();
