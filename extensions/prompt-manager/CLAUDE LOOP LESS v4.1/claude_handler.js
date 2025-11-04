// claude_handler.js - Site-specific handler for Claude
(function(){
  const PM = (window.PMHandlers = window.PMHandlers || {});

  function getLastResponseClaude() {
    try {
      console.log('=== CLAUDE HANDLER getLastResponse ===');

      // PRIORIDADE: Pega APENAS mensagens que NÃO estão em streaming (finalizadas)
      let assistantMessages = document.querySelectorAll('div[data-is-streaming="false"]');

      if (!assistantMessages || assistantMessages.length === 0) {
        console.log('⚠️ Nenhuma mensagem com data-is-streaming="false" - tentando fallback');
        // Fallback: tenta outros seletores
        const fallbackSelectors = [
          '.font-claude-response',
          '[data-testid*="message"]',
          '.prose'
        ];

        for (const selector of fallbackSelectors) {
          const found = document.querySelectorAll(selector);
          if (found && found.length > 0) {
            assistantMessages = found;
            console.log(`Claude Handler: Fallback - Encontrou ${found.length} mensagens com "${selector}"`);
            break;
          }
        }
      } else {
        console.log(`✅ Claude Handler: Encontrou ${assistantMessages.length} mensagens FINALIZADAS (data-is-streaming="false")`);
      }

      if (assistantMessages && assistantMessages.length > 0) {
        // Pega a ÚLTIMA mensagem
        const last = assistantMessages[assistantMessages.length - 1];

        // Tenta extrair o texto completo da resposta
        // Prioriza .font-claude-response que contém o texto completo
        const responseContainer = last.querySelector('.font-claude-response');
        if (responseContainer) {
          const text = responseContainer.innerText || responseContainer.textContent || '';
          if (text.trim().length > 0) {
            console.log(`✅ Claude Handler: Texto extraído (${text.trim().length} chars) de .font-claude-response`);
            return text.trim();
          }
        }

        // Fallback: tenta pegar de outros elementos
        const contentSelectors = [
          '.standard-markdown',
          '.progressive-markdown',
          '.prose',
          'div > div'
        ];

        for (const cs of contentSelectors) {
          const c = last.querySelector(cs);
          if (c) {
            const t = c.innerText || c.textContent || '';
            if (t.trim().length > 0) {
              console.log(`✅ Claude Handler: Texto extraído (${t.trim().length} chars) via "${cs}"`);
              return t.trim();
            }
          }
        }

        // Fallback final: pega texto direto do elemento
        const direct = last.innerText || last.textContent || '';
        if (direct.trim().length > 0) {
          console.log(`✅ Claude Handler: Texto extraído (${direct.trim().length} chars) via innerText direto`);
          return direct.trim();
        }
      }

      console.log('❌ Claude Handler: Nenhuma mensagem encontrada ou texto vazio');
      return '';
    } catch (e) {
      console.log('❌ Claude handler error:', e.message);
      return '';
    }
  }

  function waitForFinishClaude() {
    return new Promise((resolve) => {
      console.log('⏳ ClaudeHandler: Aguardando COMPLETAMENTE terminar de gerar...');

      let checkCount = 0;
      let lastResponseLength = 0;
      let stableCount = 0;
      const STABLE_REQUIRED = 10; // Requer 10 segundos de estabilidade

      const poll = setInterval(() => {
        checkCount++;

        // 1. Verifica se ainda está em streaming
        const streamingElements = document.querySelectorAll('[data-is-streaming="true"]');
        const isStreaming = streamingElements.length > 0;

        // 2. Verifica botão de stop
        const stopBtn = document.querySelector('button[aria-label*="Stop"], button[aria-label*="Parar"]');
        const hasStopButton = stopBtn && stopBtn.offsetParent !== null;

        // 3. Verifica se o texto parou de crescer
        const currentResponse = getLastResponseClaude();
        const currentLength = currentResponse.length;

        if (currentLength === lastResponseLength && currentLength > 0) {
          stableCount++;
        } else {
          stableCount = 0;
          lastResponseLength = currentLength;
        }

        // Log detalhado
        console.log(`⏳ Claude Handler verificação ${checkCount}: streaming=${isStreaming}, stopBtn=${hasStopButton}, textLen=${currentLength}, stable=${stableCount}/${STABLE_REQUIRED}`);

        // CRITÉRIOS RIGOROSOS para considerar que terminou:
        if (!isStreaming && !hasStopButton && stableCount >= STABLE_REQUIRED && currentLength > 0) {
          console.log('✅ Claude Handler: FINALIZOU - Aguardando 5 segundos extras...');
          clearInterval(poll);
          setTimeout(() => {
            console.log('✅ Claude Handler: Delay de segurança concluído');
            resolve();
          }, 5000); // 5 segundos extras de segurança
        }
      }, 1000); // Verifica a cada 1 segundo

      // Timeout de segurança de 3 minutos
      setTimeout(() => {
        console.log('⚠️ Claude Handler: Timeout de 3 minutos atingido');
        try { clearInterval(poll); } catch{}
        resolve();
      }, 180000);
    });
  }

  PM.claude = {
    waitForFinish: waitForFinishClaude,
    getLastResponse: getLastResponseClaude
  };
})();
