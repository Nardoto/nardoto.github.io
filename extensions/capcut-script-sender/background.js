// Background script para gerenciar mensagens e exportação automática
let backgroundExportInProgress = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'AUTO_EXPORT_AFTER_EXTRACTION') {
    console.log('Background: Recebido comando para exportar automaticamente');

    // Primeiro, verificar se o popup está ativo
    chrome.runtime.sendMessage({ type: 'CHECK_POPUP_ACTIVE' })
      .then(response => {
        if (response && response.popupActive) {
          console.log('Background: Popup está ativo, deixando ele lidar com a exportação');

          // Enviar comando para o popup e esperar resposta
          return chrome.runtime.sendMessage({ type: 'AUTO_EXPORT_AFTER_EXTRACTION' });
        } else {
          throw new Error('Popup não está ativo');
        }
      })
      .then(response => {
        if (response && response.handled) {
          console.log('Background: Popup confirmou que está lidando com a exportação');
        }
      })
      .catch(() => {
        // Se o popup não estiver aberto ou não responder, executar exportação no background
        console.log('Background: Popup não está disponível, executando exportação no background');

        // Aguardar um pouco mais para evitar conflitos
        setTimeout(() => {
          if (!backgroundExportInProgress) {
            backgroundExportInProgress = true;
            autoExportFromBackground().finally(() => {
              backgroundExportInProgress = false;
            });
          }
        }, 1000);
      });
  }

  return true; // Manter canal aberto para respostas assíncronas
});

// Função para exportar automaticamente do background
async function autoExportFromBackground() {
  try {
    // Verificar se já foi exportado recentemente
    const exportCheck = await chrome.storage.local.get(['lastExportTime']);
    if (exportCheck.lastExportTime) {
      const timeSinceExport = Date.now() - exportCheck.lastExportTime;
      // Se foi exportado há menos de 5 segundos, pular
      if (timeSinceExport < 5000) {
        console.log('Background: Exportação recente detectada, pulando para evitar duplicação');
        return;
      }
    }

    // Marcar o tempo de exportação
    await chrome.storage.local.set({ lastExportTime: Date.now() });

    // Obter prompts e configurações salvas
    const result = await chrome.storage.local.get([
      'prompts',
      'lastFilename',
      'lastLinePrefix',
      'lastPromptPrefix'
    ]);
    const prompts = result.prompts || [];
    const filename = result.lastFilename || `capcut-prompts-${new Date().toISOString().split('T')[0]}`;
    const linePrefix = result.lastLinePrefix || '';
    const promptPrefix = result.lastPromptPrefix || '';

    if (prompts.length === 0) {
      console.log('Nenhum prompt para exportar');
      return;
    }

    console.log(`Background: Exportando ${prompts.length} prompts`);

    // Criar conteúdo do arquivo TXT com prefixos
    const formattedPrompts = prompts.map((prompt, index) => {
      const fullPromptText = promptPrefix ? `${promptPrefix} ${prompt.text}` : prompt.text;

      if (linePrefix) {
        return `${linePrefix} ${index + 1}: ${fullPromptText}`;
      } else {
        const number = String(index + 1).padStart(3, '0');
        return `${number}: ${fullPromptText}`;
      }
    }).join('\n\n');

    // Criar e baixar arquivo
    const blob = new Blob([formattedPrompts], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Usar chrome.downloads API para baixar o arquivo
    chrome.downloads.download({
      url: url,
      filename: `${filename}.txt`,
      saveAs: false
    }, (downloadId) => {
      console.log(`Background: Download iniciado com ID ${downloadId}`);
      // Limpar URL após o download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    // Exportar imagens se houver
    const promptsWithImages = prompts.filter(p => p.image);
    if (promptsWithImages.length > 0) {
      console.log(`Background: Exportando ${promptsWithImages.length} imagens`);

      for (let i = 0; i < promptsWithImages.length; i++) {
        const prompt = promptsWithImages[i];
        const index = prompts.indexOf(prompt);

        // Aplicar prefixos ao nome da imagem também
        let fullPromptText = promptPrefix ? `${promptPrefix} ${prompt.text}` : prompt.text;

        // Sanitizar nome do prompt para usar como nome de arquivo
        const sanitized = fullPromptText
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
          .replace(/\s+/g, '_')
          .replace(/[^\w\-_.]/g, '')
          .substring(0, 100) || 'prompt';

        let imageFilename;
        if (linePrefix) {
          imageFilename = `${linePrefix}_${index + 1}_${sanitized}.png`;
        } else {
          const number = String(index + 1).padStart(3, '0');
          imageFilename = `${number}_${sanitized}.png`;
        }

        // Baixar imagem
        chrome.downloads.download({
          url: prompt.image,
          filename: imageFilename,
          saveAs: false
        });

        // Pequeno delay entre downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('Background: Exportação completa');
  } catch (error) {
    console.error('Erro ao exportar do background:', error);
  }
}