// Script do popup para gerenciar a interface
let prompts = [];

// Elementos DOM
const promptsContainer = document.getElementById('promptsContainer');
const togglePromptsBtn = document.getElementById('togglePromptsBtn');
const toggleIcon = document.getElementById('toggleIcon');
const promptCount = document.getElementById('promptCount');
const stopBtn = document.getElementById('stopBtn');
const exportTxtBtn = document.getElementById('exportTxtBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const pinSidePanelBtn = document.getElementById('pinSidePanelBtn');
const filenameInput = document.getElementById('filenameInput');
const forceNameBtn = document.getElementById('forceNameBtn');
const linePrefixInput = document.getElementById('linePrefixInput');
const promptPrefixInput = document.getElementById('promptPrefixInput');
const extractAllBtn = document.getElementById('extractAllBtn');
const txtFileInput = document.getElementById('txtFileInput');
const joinTxtFilesBtn = document.getElementById('joinTxtFilesBtn');
const progressContainer = document.getElementById('progressContainer');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const progressFails = document.getElementById('progressFails');

// Carregar prompts salvos
async function loadPrompts() {
  try {
    const result = await chrome.storage.local.get(['prompts']);
    if (result.prompts) {
      prompts = result.prompts;
      updateDisplay();
    }
  } catch (error) {
    console.error('Erro ao carregar prompts:', error);
  }
}

// Atualizar exibição dos prompts
function updateDisplay() {
  // Atualizar contador
  updatePromptCounter();

  if (prompts.length === 0) {
    promptsContainer.innerHTML = '<div class="empty-state">Nenhum prompt extraído ainda</div>';
    return;
  }

  promptsContainer.innerHTML = prompts.map(prompt => {
    const imageHtml = prompt.image
      ? `<img src="${prompt.image}" class="prompt-image" alt="Preview">`
      : '';

    return `
      <div class="prompt-item">
        ${imageHtml}
        <div class="prompt-content">
          <div class="prompt-text">${escapeHtml(prompt.text)}</div>
          <div class="prompt-meta">Extraído em: ${prompt.timestamp}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Função para atualizar o contador de prompts
function updatePromptCounter() {
  const count = prompts.length;
  const imagesCount = prompts.filter(p => p.image).length;

  if (count === 0) {
    promptCount.textContent = '0 prompts extraídos';
  } else if (imagesCount > 0) {
    promptCount.textContent = `${count} prompts (${imagesCount} com imagens)`;
  } else {
    promptCount.textContent = `${count} prompts extraídos`;
  }
}

// Função para mostrar/ocultar prompts
function togglePrompts() {
  const isHidden = promptsContainer.style.display === 'none';

  if (isHidden) {
    promptsContainer.style.display = 'block';
    toggleIcon.textContent = '▲';
  } else {
    promptsContainer.style.display = 'none';
    toggleIcon.textContent = '▼';
  }

  // Salvar preferência
  chrome.storage.local.set({ promptsVisible: isHidden });
}

// Carregar preferência de visibilidade
async function loadVisibilityPreference() {
  const result = await chrome.storage.local.get(['promptsVisible']);
  if (result.promptsVisible !== undefined) {
    if (result.promptsVisible) {
      promptsContainer.style.display = 'block';
      toggleIcon.textContent = '▲';
    } else {
      promptsContainer.style.display = 'none';
      toggleIcon.textContent = '▼';
    }
  }
}

// Escapar HTML para segurança
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Copiar todos os prompts
async function copyAllPrompts() {
  if (prompts.length === 0) {
    showStatus('Nenhum prompt para copiar', 'error');
    return;
  }
  
  const allPrompts = prompts.map((prompt, index) => 
    `${index + 1}. ${prompt.text}\n`
  ).join('\n');
  
  try {
    await navigator.clipboard.writeText(allPrompts);
    showStatus('Prompts copiados para a área de transferência!', 'success');
  } catch (error) {
    console.error('Erro ao copiar:', error);
    showStatus('Erro ao copiar prompts', 'error');
  }
}

// Exportar prompts como arquivo TXT formatado
async function exportPromptsAsTxt() {
  if (prompts.length === 0) {
    showStatus('Nenhum prompt para exportar', 'error');
    return;
  }

  const linePrefix = linePrefixInput.value.trim();
  const promptPrefix = promptPrefixInput.value.trim();

  // Formatar prompts com numeração sequencial
  const formattedPrompts = prompts.map((prompt, index) => {
    const fullPromptText = promptPrefix ? `${promptPrefix} ${prompt.text}` : prompt.text;

    if (linePrefix) {
      return `${linePrefix} ${index + 1}: ${fullPromptText}`;
    } else {
      const number = String(index + 1).padStart(3, '0');
      return `${number}: ${fullPromptText}`;
    }
  }).join('\n\n');

  // Pega o nome do arquivo do input, ou usa um padrão se estiver vazio
  let filename = filenameInput.value.trim();
  if (!filename) {
    filename = `capcut-prompts-${new Date().toISOString().split('T')[0]}`;
  }

  downloadFile(formattedPrompts, `${filename}.txt`, 'text/plain;charset=utf-8');
  showStatus('✅ TXT exportado! Limpando prompts...', 'success');
  console.log('📄 TXT exportado com sucesso');

  // LIMPAR TUDO após exportar
  setTimeout(async () => {
    prompts = [];

    // Limpar storage, mas manter as configurações do usuário
    const result = await chrome.storage.local.get(['lastFilename', 'lastLinePrefix', 'lastPromptPrefix']);

    await chrome.storage.local.set({
      prompts: [],
      draftNameReplaced: false,
      lastExportTime: null,
      // Manter as configurações
      lastFilename: result.lastFilename,
      lastLinePrefix: result.lastLinePrefix,
      lastPromptPrefix: result.lastPromptPrefix
    });

    // Notificar content script
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].id) {
        await chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR_PROMPTS' });
      }
    } catch (error) {
      console.log('⚠️ Não foi possível notificar content script');
    }

    updateDisplay();
    updatePromptCounter();
    showStatus('✅ TXT exportado e prompts limpos!', 'success');
    console.log('🗑️ Prompts limpos automaticamente após exportação');
  }, 500);
}

// Exportar prompts como arquivo JSON
function exportPromptsAsJson() {
  if (prompts.length === 0) {
    showStatus('Nenhum prompt para exportar', 'error');
    return;
  }
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalPrompts: prompts.length,
    prompts: prompts.map((prompt, index) => ({
      id: index + 1,
      text: prompt.text,
      extractedAt: prompt.timestamp
    }))
  };
  
  const defaultFilename = `capcut-prompts-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(JSON.stringify(exportData, null, 2), defaultFilename, 'application/json');
  showStatus('Prompts exportados como JSON!', 'success');
}

// Limpar todos os prompts
async function clearPrompts() {
  console.log('🗑️ Botão Limpar foi clicado!');
  console.log('Prompts atuais:', prompts.length);

  // Remover a verificação - sempre permitir limpar
  if (confirm('Tem certeza que deseja limpar TUDO (prompts, imagens, e configurações de sessão)?')) {
    console.log('✓ Usuário confirmou limpeza');

    // Limpar array de prompts
    prompts = [];

    // Limpar TUDO do storage, incluindo a flag de nome substituído
    await chrome.storage.local.set({
      prompts: [],
      draftNameReplaced: false, // Resetar flag para permitir nova substituição
      lastExportTime: null // Resetar tempo de última exportação também
    });
    console.log('✓ Storage limpo');

    // Notificar content script para limpar também
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].id) {
        await chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR_PROMPTS' });
        console.log('✓ Content script notificado');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível notificar content script (normal se não estiver no CapCut)');
    }

    // Atualizar interface
    updateDisplay();
    updatePromptCounter();

    showStatus('✅ TUDO LIMPO! Próxima vez que abrir o editor, o nome será substituído novamente.', 'success');
    console.log('✅ Limpeza completa - flag de nome substituído foi resetada');
    console.log('✅ Próxima extração será uma nova sessão');
  } else {
    console.log('❌ Usuário cancelou a limpeza');
  }
}

// Mostrar status
function showStatus(message, type = 'info') {
  status.textContent = message;
  status.className = `status ${type}`;
  
  setTimeout(() => {
    status.textContent = '';
    status.className = 'status';
  }, 3000);
}

// Extrair todos os prompts da página
let extracting = false;
async function extractAllPrompts() {
  try {
    // Verificar se há uma aba ativa do CapCut
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab || !currentTab.id || !currentTab.url.includes('capcut.com')) {
      showStatus('Por favor, abra o CapCut primeiro', 'error');
      return;
    }

    // Enviar comando para o content script
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'EXTRACT_ALL_PROMPTS'
    });

    // Mostrar container de progresso e resetar
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = 'Iniciando...';
    progressFails.textContent = '';
    if (response && response.success) {
      showStatus('Extração iniciada! Aguarde...', 'info');
      extractAllBtn.style.display = 'none';
      stopBtn.style.display = 'block';
      // Monitorar progresso
      monitorExtractionProgress();
    }
  } catch (error) {
    console.error('Erro ao iniciar extração:', error);
    showStatus('Falha ao iniciar. Recarregue a página do CapCut.', 'error');
  }
}

function stopExtraction() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'STOP_EXTRACTION' });
    }
  });
  showStatus('Extração interrompida!', 'info');
  stopBtn.style.display = 'none';
  extractAllBtn.style.display = 'block';
  progressContainer.style.display = 'none';
  extracting = false;
}

// Monitorar progresso da extração
async function monitorExtractionProgress() {
  extracting = true;
  const checkProgress = async () => {
    if (!extracting) return;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0] || !tabs[0].id) {
        throw new Error("Aba não encontrada.");
      }
      const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_EXTRACTION_STATUS' });
      if (response) {
        const { isExtracting: stillExtracting, currentIndex, totalFound, successCount, failCount } = response;

        if (!response.isExtracting) {
          let finalMessage = `Extração concluída! ${successCount} de ${totalFound} prompts extraídos.`;
          if (failCount > 0) {
            finalMessage += ` (${failCount} falhas)`;
          }
          showStatus(finalMessage, 'success');
          await loadPrompts();
          stopBtn.style.display = 'none';
          extractAllBtn.style.display = 'block';
          progressContainer.style.display = 'none';
          extracting = false;
        } else {
          const progressPercentage = totalFound > 0 ? ((currentIndex + 1) / totalFound) * 100 : 0;
          progressBar.style.width = `${progressPercentage}%`;
          progressText.textContent = `Extraindo ${currentIndex + 1} de ${totalFound}... (Sucessos: ${successCount})`;
          progressFails.textContent = failCount > 0 ? `Falhas: ${failCount}` : '';
          setTimeout(checkProgress, 500); // Verifica mais rápido para uma UI mais responsiva
        }
      }
    } catch (error) {
      console.warn('Não foi possível verificar o progresso. A aba pode ter sido fechada.', error);
      stopBtn.style.display = 'none';
      extractAllBtn.style.display = 'block';
      extracting = false;
      progressContainer.style.display = 'none';
    }
  };
  checkProgress();
}

// Função para juntar múltiplos arquivos TXT
async function joinTxtFiles() {
  const files = txtFileInput.files;
  if (files.length === 0) {
    showStatus('Selecione pelo menos um arquivo TXT para juntar.', 'error');
    return;
  }

  showStatus(`Lendo ${files.length} arquivos...`, 'info');

  const fileContents = [];
  const readPromises = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Basic check for .txt extension, though accept=".txt" helps
    if (!file.name.toLowerCase().endsWith('.txt')) {
      console.warn(`Arquivo "${file.name}" não é um TXT e será ignorado.`);
      showStatus(`Arquivo "${file.name}" não é um TXT e será ignorado.`, 'warning');
      continue;
    }

    readPromises.push(new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        fileContents.push({ name: file.name, content: event.target.result });
        resolve();
      };
      reader.onerror = (event) => {
        console.error(`Erro ao ler o arquivo ${file.name}:`, event.target.error);
        showStatus(`Erro ao ler o arquivo "${file.name}".`, 'error');
        reject(event.target.error);
      };
      reader.readAsText(file);
    }));
  }

  try {
    await Promise.all(readPromises);

    if (fileContents.length === 0) {
      showStatus('Nenhum arquivo TXT válido foi lido.', 'error');
      return;
    }

    // Sort files by name for consistent output
    fileContents.sort((a, b) => a.name.localeCompare(b.name));

    let combinedContent = '';
    fileContents.forEach((item, index) => {
      combinedContent += item.content.trim();
      if (index < fileContents.length - 1) {
        combinedContent += '\n\n'; // Add double newline between files
      }
    });

    const defaultFilename = `prompts_combinados_${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(combinedContent, defaultFilename, 'text/plain;charset=utf-8');
    showStatus(`Todos os ${fileContents.length} arquivos TXT foram combinados e baixados!`, 'success');
  } catch (error) {
    console.error('Erro ao juntar arquivos TXT:', error);
    showStatus('Erro ao juntar arquivos TXT.', 'error');
  }
}

// Funções de exportação de imagens foram REMOVIDAS conforme solicitado pelo usuário

// Função para FORÇAR a substituição do nome no editor do CapCut
async function forceNameReplacement() {
  const filename = filenameInput.value.trim();

  if (!filename) {
    showStatus('❌ Por favor, preencha o nome do arquivo primeiro!', 'error');
    return;
  }

  try {
    showStatus('🔄 Forçando substituição do nome...', 'info');
    console.log('🔄 Botão FORÇAR clicado! Resetando flag e forçando substituição...');

    // RESETAR a flag para permitir nova substituição
    await chrome.storage.local.set({ draftNameReplaced: false });
    console.log('✓ Flag resetada, agora vai forçar a substituição');

    // Enviar mensagem para o content script forçar a substituição
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0] || !tabs[0].id) {
      showStatus('❌ Abra a página do editor do CapCut primeiro!', 'error');
      return;
    }

    if (!tabs[0].url.includes('capcut.com/editor/')) {
      showStatus('❌ Você precisa estar na página do editor do CapCut!', 'error');
      return;
    }

    // Enviar comando para forçar substituição
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      type: 'FORCE_NAME_REPLACEMENT',
      filename: filename
    });

    if (response && response.success) {
      showStatus(`✅ Nome "${filename}" forçado com sucesso!`, 'success');
      console.log('✅ Substituição forçada com sucesso!');
    } else {
      showStatus('⚠️ Não foi possível forçar a substituição. Veja o console.', 'error');
    }
  } catch (error) {
    console.error('Erro ao forçar substituição:', error);
    showStatus('❌ Erro ao forçar substituição. Recarregue a página do CapCut.', 'error');
  }
}

// Event listeners
togglePromptsBtn.addEventListener('click', togglePrompts);
clearBtn.addEventListener('click', clearPrompts);
extractAllBtn.addEventListener('click', extractAllPrompts);
stopBtn.addEventListener('click', stopExtraction);

exportTxtBtn.addEventListener('click', exportPromptsAsTxt);
forceNameBtn.addEventListener('click', forceNameReplacement);

// Fixar no painel lateral
if (pinSidePanelBtn && window.chrome && chrome.sidePanel && chrome.sidePanel.open) {
  pinSidePanelBtn.addEventListener('click', async () => {
    try {
      await chrome.sidePanel.setOptions({ enabled: true });
      await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
      window.close();
    } catch (e) {
      console.error('Falha ao abrir painel lateral', e);
      showStatus('Não foi possível abrir o painel lateral. Atualize o Chrome.', 'error');
    }
  });
} else if (pinSidePanelBtn) {
  pinSidePanelBtn.disabled = true;
  pinSidePanelBtn.title = 'Painel lateral não disponível nesta versão do Chrome';
}
joinTxtFilesBtn.addEventListener('click', joinTxtFiles);

// Salvar nome do arquivo quando mudar
filenameInput.addEventListener('input', () => {
  const filename = filenameInput.value.trim();
  chrome.storage.local.set({ lastFilename: filename });
  console.log('Nome do arquivo salvo:', filename);
});

// Salvar prefixo da linha quando mudar
linePrefixInput.addEventListener('input', () => {
  const linePrefix = linePrefixInput.value.trim();
  chrome.storage.local.set({ lastLinePrefix: linePrefix });
  console.log('Prefixo da linha salvo:', linePrefix);
});

// Salvar prefixo do prompt quando mudar
promptPrefixInput.addEventListener('input', () => {
  const promptPrefix = promptPrefixInput.value.trim();
  chrome.storage.local.set({ lastPromptPrefix: promptPrefix });
  console.log('Prefixo do prompt salvo:', promptPrefix);
});

// Carregar configurações salvas
async function loadSavedSettings() {
  const result = await chrome.storage.local.get([
    'lastFilename',
    'lastLinePrefix',
    'lastPromptPrefix'
  ]);

  if (result.lastFilename) {
    filenameInput.value = result.lastFilename;
  }

  if (result.lastLinePrefix) {
    linePrefixInput.value = result.lastLinePrefix;
  }

  if (result.lastPromptPrefix) {
    promptPrefixInput.value = result.lastPromptPrefix;
  }
}

// Função antiga mantida para compatibilidade
async function loadFilename() {
  // Agora chama a função mais completa
  await loadSavedSettings();
}

// Flag para evitar exportação dupla
let isExporting = false;

// Escutar mensagens do content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PROMPT_EXTRACTED') {
    prompts.push(request.data);
    updateDisplay();
    showStatus('Novo prompt extraído!', 'success');
  } else if (request.type === 'AUTO_EXPORT_AFTER_EXTRACTION') {
    console.log('Popup: Recebido comando para exportar automaticamente');

    // Verificar se já está exportando
    if (isExporting) {
      console.log('Popup: Já está exportando, ignorando comando duplicado');
      sendResponse({ handled: true, alreadyExporting: true });
      return;
    }

    // Marcar que está exportando e responder imediatamente
    isExporting = true;
    sendResponse({ handled: true });

    // Executar exportação automática
    setTimeout(async () => {
      await loadPrompts(); // Garantir que temos os prompts mais recentes

      if (prompts.length > 0) {
        console.log('Popup: Exportando automaticamente...');
        showStatus('Exportando automaticamente...', 'info');

        // Exportar apenas TXT (imagens foram removidas)
        await exportPromptsAsTxt();

        // Reset flag após completar
        setTimeout(() => {
          isExporting = false;
        }, 3000);
      } else {
        isExporting = false;
      }
    }, 500);
  } else if (request.type === 'CHECK_POPUP_ACTIVE') {
    // Responder que o popup está ativo
    sendResponse({ popupActive: true });
  }

  return true; // Manter canal aberto para resposta assíncrona
});

// Helper function to trigger file download (reused from export functions)
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Carregar configurações quando o popup abrir
loadPrompts();
loadSavedSettings();
loadVisibilityPreference();
