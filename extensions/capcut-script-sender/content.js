// Content script para detectar cliques e extrair prompts
console.log('CapCut Prompt Extractor carregado');

// Armazenar prompts extraídos
let extractedPrompts = [];

// Estado da extração
let isExtracting = false;
let shouldStop = false;
let extractionQueue = [];
let currentExtractionIndex = -1;

// Armazenar prompts capturados dos logs
let capturedPromptsFromLogs = new Map();

// Interceptar logs do console para capturar prompts
(function interceptConsoleLogs() {
  const originalLog = console.log;
  console.log = function(...args) {
    // Chamar o log original
    originalLog.apply(console, args);

    // Tentar extrair prompts dos logs
    args.forEach(arg => {
      if (typeof arg === 'string') {
        // Procurar por padrões de resposta do CapCut
        if (arg.includes('text to image resp=') ||
            arg.includes('image to image resp=') ||
            arg.includes('genVideo resp=')) {
          try {
            extractPromptFromLogResponse(arg);
          } catch (e) {
            console.error('Erro ao extrair prompt do log:', e);
          }
        }
      }
    });
  };
})();

// Interceptar requisições XHR e Fetch para capturar respostas da API
(function interceptNetworkRequests() {
  // Interceptar XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    return originalXHROpen.call(this, method, url, ...args);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', function() {
      if (this._url && this.responseText) {
        try {
          const data = JSON.parse(this.responseText);
          extractPromptFromAPIResponse(data);
        } catch (e) {
          // Não é JSON ou erro ao parsear
        }
      }
    });
    return originalXHRSend.call(this, ...args);
  };

  // Interceptar Fetch API
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);

    // Clonar a resposta para não interferir no uso original
    const clonedResponse = response.clone();

    try {
      const data = await clonedResponse.json();
      extractPromptFromAPIResponse(data);
    } catch (e) {
      // Não é JSON ou erro ao parsear
    }

    return response;
  };
})();

// Função para extrair prompts de respostas da API
function extractPromptFromAPIResponse(data) {
  if (!data) return;

  // Verificar se a resposta contém um draft
  if (data.draft) {
    try {
      const draft = typeof data.draft === 'string' ? JSON.parse(data.draft) : data.draft;
      if (draft.component_list) {
        draft.component_list.forEach(component => {
          extractPromptFromComponent(component);
        });
      }
    } catch (e) {
      console.error('Erro ao processar draft da API:', e);
    }
  }

  // Verificar se há components diretamente
  if (data.component_list) {
    data.component_list.forEach(component => {
      extractPromptFromComponent(component);
    });
  }
}

// Função auxiliar para extrair prompt de um componente
function extractPromptFromComponent(component) {
  let promptText = null;

  // Text to Image
  if (component.abilities?.generate?.core_param?.prompt) {
    promptText = component.abilities.generate.core_param.prompt;
  }
  // Image to Image (blend)
  else if (component.abilities?.blend?.core_param?.prompt) {
    promptText = component.abilities.blend.core_param.prompt;
  }
  // Video Generation
  else if (component.abilities?.gen_video?.text_to_video_params?.video_gen_inputs) {
    const inputs = component.abilities.gen_video.text_to_video_params.video_gen_inputs;
    if (inputs.length > 0 && inputs[0].prompt) {
      promptText = inputs[0].prompt;
    }
  }

  // Filtrar prompts de teste
  if (promptText &&
      promptText !== '测试生成一张图' &&
      promptText !== '测试图生图' &&
      promptText !== '测试生视频' &&
      promptText.length > 3) {

    capturedPromptsFromLogs.set(promptText, {
      text: promptText,
      timestamp: new Date().toLocaleString('pt-BR'),
      source: 'api_response'
    });
    console.log('🔍 Prompt capturado da API:', promptText);
  }
}

// Função para extrair prompts das respostas nos logs
function extractPromptFromLogResponse(logMessage) {
  try {
    // Extrair o JSON da mensagem de log
    const match = logMessage.match(/resp=(\{.*\})/);
    if (!match) return;

    const jsonData = JSON.parse(match[1]);
    if (!jsonData.draft) return;

    const draft = JSON.parse(jsonData.draft);
    if (!draft.component_list) return;

    // Iterar sobre os componentes para encontrar prompts
    draft.component_list.forEach(component => {
      extractPromptFromComponent(component);
    });
  } catch (error) {
    console.error('Erro ao parsear log:', error);
  }
}

// Função para encontrar todos os elementos de cena na página
function findAllSceneElements() {
  const sceneElements = document.querySelectorAll('.shotItem-E5KGax');
  console.log(`Encontrados ${sceneElements.length} elementos de cena`);
  return Array.from(sceneElements);
}

// Função para encontrar o botão de substituir em um elemento de cena
function findReplaceButton(sceneElement) {
  // Procurar pelo botão de substituir usando a classe específica
  const replaceButton = sceneElement.querySelector('.toolItem-CZ28Et');
  
  if (replaceButton) {
    return replaceButton;
  }
  
  // Fallback: procurar pelo SVG específico do botão de substituir
  const svgButton = sceneElement.querySelector('svg path[d*="M3.335 4.335h8.723l-1.01 1.011a.295.295 0 0 0 0 .417l.525.526a.295.295 0 0 0 .417 0l1.622-1.622h.008v-.008l.519-.519a.667.667 0 0 0 0-.943L11.99 1.05a.295.295 0 0 0-.417 0l-.526.526a.295.295 0 0 0 0 .417l1.011 1.01H3.335A1.333 1.333 0 0 0 2 4.335V7.04c0 .163.132.295.295.295h.744a.295.295 0 0 0 .295-.295V4.335Zm.613 8.667 1.01 1.01a.295.295 0 0 1 0 .418l-.525.526a.295.295 0 0 1-.417 0l-2.149-2.15a.667.667 0 0 1 0-.942l.519-.519v-.011h.012l1.618-1.619a.295.295 0 0 1 .417 0l.526.526a.295.295 0 0 1 0 .417l-1.011 1.01h8.72V8.963c0-.163.132-.295.295-.295h.744c.162 0 .294.132.294.295v2.707c0 .736-.596 1.333-1.333 1.333h-8.72Z"]');
  
  if (svgButton) {
    // Encontrar o elemento clicável pai
    const clickableElement = svgButton.closest('.toolItem-CZ28Et') || svgButton.closest('div');
    return clickableElement;
  }
  
  return null;
}

// Função para aguardar o modal desaparecer
function waitForModalToClose(timeout = 3000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        console.warn('Tempo esgotado esperando o modal fechar. Prosseguindo de qualquer maneira.');
        resolve(); // Resolve mesmo em timeout para não parar a extração
        return;
      }
      if (extractPromptFromModal() === null) { // Se não encontrar mais o modal, ele fechou
        clearInterval(interval);
        resolve();
      }
    }, 50); // Verifica mais rápido
  });
}
// Função para aguardar o modal e extrair o prompt
function waitForModalAndExtractPrompt(timeout = 3000) { // Reduzido o timeout para 3s
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Tempo esgotado (3s) esperando pelo modal do prompt.'));
        return;
      }

      const promptText = extractPromptFromModal();
      if (promptText) {
        clearInterval(interval);
        resolve(promptText);
      } else {
        // Log para depuração: o que extractPromptFromModal retornou na última tentativa antes do timeout
        console.log(`waitForModalAndExtractPrompt: extractPromptFromModal retornou null na tentativa ${Date.now() - startTime}ms.`);
      }
    }, 100); // Verifica a cada 100ms para detecção mais rápida
  });
}

// Função para extrair imagem do elemento de cena
async function extractImageFromScene(sceneElement) {
  try {
    // Procurar pela tag img com crossorigin
    const img = sceneElement.querySelector('img[crossorigin="anonymous"]');
    if (!img || !img.src) {
      console.log('Imagem não encontrada no elemento de cena');
      return null;
    }

    // Se for blob URL, converter para base64
    if (img.src.startsWith('blob:')) {
      const base64 = await blobUrlToBase64(img.src);
      return base64;
    }

    // Se for URL normal, retornar a URL
    return img.src;
  } catch (error) {
    console.error('Erro ao extrair imagem:', error);
    return null;
  }
}

// Função para converter blob URL para base64
async function blobUrlToBase64(blobUrl) {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro ao converter blob para base64:', error);
    return null;
  }
}

// Função para processar um único elemento de cena
async function processSceneElement(sceneElement, index, total, uniquePrompts) {
    // Limpar prompts capturados anteriormente antes de processar nova cena
    capturedPromptsFromLogs.clear();

    // Extrair imagem ANTES de clicar no botão
    console.log(`Extraindo imagem do elemento ${index + 1}`);
    const imageData = await extractImageFromScene(sceneElement);

    const replaceButton = findReplaceButton(sceneElement);
    if (!replaceButton) {
        console.log(`Botão de substituir não encontrado no elemento ${index + 1}`);
        return null;
    }

    console.log(`Clicando no botão de substituir do elemento ${index + 1}`);
    replaceButton.click();

    // Aguardar um pouco para o log ser capturado
    await new Promise(resolve => setTimeout(resolve, 300));

    const promptText = await waitForModalAndExtractPrompt();

    // Retornar tanto o prompt quanto a imagem
    return {
      text: promptText,
      image: imageData
    };
}

// Função para extrair todos os prompts da página (SIMULAÇÃO DE CLIQUES)
async function extractAllPrompts() {
  if (isExtracting) {
    console.log('Extração já em andamento');
    return;
  }
  isExtracting = true;
  shouldStop = false;
  currentExtractionIndex = 0;
  extractionQueue = []; // Clear queue
  chrome.storage.local.set({ prompts: [] }); // Clear storage

  const sceneElements = findAllSceneElements();
  if (sceneElements.length === 0) {
    showNotification('Nenhum elemento de cena encontrado na página');
    isExtracting = false;
    return;
  }
  showNotification(`Iniciando extração automática de ${sceneElements.length} cenas...`);
  const resultsArray = new Array(sceneElements.length).fill(null);
  const uniquePrompts = new Map();

  // --- LÓGICA DE EXTRAÇÃO ÚNICA COM TENTATIVAS ---
  console.log('--- Iniciando extração com lógica de nova tentativa ---');
  for (let index = 0; index < sceneElements.length; index++) {
    if (shouldStop || index >= sceneElements.length) {
        break;
    }
    currentExtractionIndex = index;
    const sceneElement = sceneElements[index];
    console.log(`Processando elemento ${index + 1}/${sceneElements.length} (automático)`);
    sceneElement.scrollIntoView({ behavior: 'instant', block: 'center' });
    
    let success = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await processSceneElement(sceneElement, index, sceneElements.length);
        const promptText = result?.text;
        const imageData = result?.image;
        const promptHash = promptText ? await createPromptHash(promptText) : null;

        const alreadyExists = promptText && uniquePrompts.has(promptHash);

        if (promptText && !alreadyExists) {
          uniquePrompts.set(promptHash, promptText);
          const promptData = {
            text: promptText,
            image: imageData,
            timestamp: new Date().toLocaleString('pt-BR'),
            id: Date.now() + Math.random(),
            sceneIndex: index + 1,
            hash: promptHash
          };
          resultsArray[index] = promptData;
          chrome.runtime.sendMessage({ type: 'PROMPT_EXTRACTED', data: promptData });

          if (imageData) {
            console.log(`✅ Imagem capturada para o prompt ${index + 1}`);
          }
        }

        // Fecha o modal pressionando a tecla Escape
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true
        }));
        await new Promise(resolve => setTimeout(resolve, 150)); // Atraso rápido para fechar
        success = true;
        break; // Sai do loop de tentativas se for bem-sucedido
      } catch (error) {
        console.warn(`Falha na tentativa ${attempt} para o item ${index + 1}. Erro:`, error.message);
        // Fecha qualquer modal que possa ter ficado aberto para limpar o estado
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));
        await waitForModalToClose(500); // Espera um pouco para o modal fechar
        
        if (attempt < 2) {
          console.log(`Aguardando 1s antes de tentar novamente o item ${index + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa de recuo
        }
      }
    }
    if (!success) {
      console.error(`Falha final ao extrair prompt do elemento ${index + 1} após 2 tentativas.`);
      showNotification(`Falha ao extrair o item ${index + 1}.`, 'error');
    }
  }

  // Montar a lista final ordenada e salvar
  extractedPrompts = resultsArray.filter(p => p !== null);
  // Atribuir o número do prompt na ordem correta
  extractedPrompts.forEach((prompt, i) => {
    prompt.promptNumber = i + 1;
  });

  await chrome.storage.local.set({ prompts: extractedPrompts });

  isExtracting = false;
  const wasInterrupted = shouldStop;
  const finalMessage = shouldStop
    ? `Extração interrompida. ${extractedPrompts.length} prompts foram extraídos.`
    : `Extração concluída! ${extractedPrompts.length} prompts foram extraídos.`;
  showNotification(finalMessage);
  shouldStop = false;

  // Se não foi interrompido e há prompts, exportar automaticamente e clicar em Edit more
  if (!wasInterrupted && extractedPrompts.length > 0) {
    console.log('Iniciando exportação automática...');

    // Notificar popup para exportar automaticamente
    chrome.runtime.sendMessage({ type: 'AUTO_EXPORT_AFTER_EXTRACTION' });

    // Aguardar um pouco para a exportação acontecer
    setTimeout(async () => {
      console.log('Procurando botão Edit more...');
      clickEditMoreButton();
    }, 3000); // Aumentado para dar mais tempo para exportar
  }
}

// Função para extrair o prompt do modal visível
function extractPromptFromModal(isRetry = false) {
  // PRIMEIRO: Verificar se há prompts capturados dos logs que ainda não foram processados
  if (capturedPromptsFromLogs.size > 0) {
    const recentPrompts = Array.from(capturedPromptsFromLogs.values());
    const mostRecent = recentPrompts[recentPrompts.length - 1];
    if (mostRecent && mostRecent.text) {
      console.log('✅ Usando prompt capturado do log:', mostRecent.text);
      return mostRecent.text;
    }
  }

  // SEGUNDA TENTATIVA: Tentar encontrar o campo de prompt diretamente
  const directPromptSelectors = [
    'textarea[class*="prompt"]',
    'textarea[placeholder*="prompt"]',
    'textarea[placeholder*="Describe"]',
    'textarea[placeholder*="描述"]',
    '.lv-textarea[class*="prompt-input"]',
    '.aigc-prompt-input',
    'textarea',
    '[contenteditable="true"]',
  ];

  for (const selector of directPromptSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      if (element.offsetWidth > 0 || element.offsetHeight > 0) {
        const text = element?.value?.trim() || element?.textContent?.trim();
        if (text && text.length > 5 && !text.includes('测试')) {
          if (isRetry) console.log(`extractPromptFromModal (RETRY): Prompt encontrado diretamente com seletor: ${selector}`);
          return text;
        }
      }
    }
  }

  // Se não for encontrado diretamente, prosseguir com a busca por um modal e depois o prompt dentro dele.
  // 1. Encontrar o modal principal que está visível
  const modalSelectors = [
    '.aigc-creator-modal-content', // Seletor principal para o modal de criação
    '.semi-modal-content', // Novo seletor, mais genérico e robusto
    '[class*="modal-content"]',
    '[role="dialog"]'
  ];
  
  let modal = null;
  let foundModalSelector = ''; // Declarar a variável aqui
  for (const selector of modalSelectors) {
    const element = document.querySelector(selector);
    // Verifica se o elemento está visível
    if (element && (element.offsetWidth > 0 || element.offsetHeight > 0)) {
      modal = element;
      foundModalSelector = selector;
      break;
    } else if (element) {
      if (isRetry) console.log(`extractPromptFromModal (RETRY): Modal encontrado com seletor "${selector}" mas não está visível.`);
    }
  }

  if (!modal) {
    if (isRetry) console.log('extractPromptFromModal (RETRY): Nenhum modal encontrado ou visível com os seletores atuais.');
    return null;
  }
  if (isRetry) console.log(`extractPromptFromModal (RETRY): Modal encontrado com seletor: ${foundModalSelector}`);
  // 2. Procurar por elementos que podem conter o prompt dentro do modal
  const promptSelectorsInModal = [ // Renomeado para clareza, mas são os mesmos seletores
    '.lv-textarea[class*="prompt-input"]', // Seletor mais específico e robusto
    '.aigc-prompt-input', // Fallback
    'textarea[placeholder*="Describe"]',
    'textarea',
    '[contenteditable="true"]',
  ];

  for (const selector of promptSelectorsInModal) {
    const element = modal.querySelector(selector);
    const text = element?.value?.trim() || element?.textContent?.trim();
    if (text) {
      if (isRetry) console.log(`extractPromptFromModal (RETRY): Prompt encontrado com seletor: ${selector}`);
      return text;
    }
  }

  if (isRetry) console.log('extractPromptFromModal (RETRY): Modal encontrado, mas nenhum campo de prompt válido dentro dele.');
  return null;
}

// Função para detectar cliques manuais em botões de substituir
function setupManualClickDetection() {
  document.addEventListener('click', async (event) => {
    const target = event.target;
    
    // Verificar se é um clique no botão de substituir
    const replaceButton = target.closest('.toolItem-CZ28Et') || 
                         target.closest('svg path[d*="M3.335 4.335h8.723l-1.01 1.011a.295.295 0 0 0 0 .417l.525.526a.295.295 0 0 0 .417 0l1.622-1.622h.008v-.008l.519-.519a.667.667 0 0 0 0-.943L11.99 1.05a.295.295 0 0 0-.417 0l-.526.526a.295.295 0 0 0 0 .417l1.011 1.01H3.335A1.333 1.333 0 0 0 2 4.335V7.04c0 .163.132.295.295.295h.744a.295.295 0 0 0 .295-.295V4.335Zm.613 8.667 1.01 1.01a.295.295 0 0 1 0 .418l-.525.526a.295.295 0 0 1-.417 0l-2.149-2.15a.667.667 0 0 1 0-.942l.519-.519v-.011h.012l1.618-1.619a.295.295 0 0 1 .417 0l.526.526a.295.295 0 0 1 0 .417l-1.011 1.01h8.72V8.963c0-.163.132-.295.295-.295h.744c.162 0 .294.132.294.295v2.707c0 .736-.596 1.333-1.333 1.333h-8.72Z"]');
    
    if (replaceButton) {
      console.log('Clique manual no botão de substituir detectado');
      
      if (isExtracting) {
        console.log('Extração automática em andamento. Clique manual ignorado.');
        return;
      }
    }
  });
}

// Função para criar um hash único do prompt
async function createPromptHash(text) {
  // Normalizar o texto (remover espaços extras, converter para minúsculas)
  const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Criar um hash do texto usando a API Web Crypto
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Converter o hash para string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// Função para verificar se um texto parece ser um prompt
function isLikelyPrompt(text) {
  const promptKeywords = [
    'generate', 'create', 'make', 'draw', 'paint', 'render',
    'photo', 'image', 'picture', 'art', 'style', 'color',
    'background', 'foreground', 'subject', 'object',
    'lighting', 'mood', 'atmosphere', 'composition',
    'realistic', 'abstract', 'digital', 'hand-drawn',
    'vintage', 'modern', 'minimalist', 'detailed'
  ];
  
  const lowerText = text.toLowerCase();
  return promptKeywords.some(keyword => lowerText.includes(keyword)) ||
         text.includes(',') || // Prompts geralmente têm vírgulas
         text.split(' ').length > 5; // Prompts são geralmente longos
}

// Função para mostrar notificação
function showNotification(message) {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remover após 3 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Função para carregar prompts salvos
async function loadSavedPrompts() {
  try {
    const result = await chrome.storage.local.get(['prompts']);
    if (result.prompts) {
      extractedPrompts = result.prompts;
    }
  } catch (error) {
    console.error('Erro ao carregar prompts salvos:', error);
  }
}

// Função para clicar no botão Edit more
function clickEditMoreButton() {
  // Procurar o botão Edit more usando vários seletores possíveis
  const selectors = [
    'button:has(span:contains("Edit more"))',
    'button span:contains("Edit more")',
    '.lv-btn:has(span:contains("Edit more"))',
    'button.button-OU7gqF',
    '.lv-btn.lv-btn-secondary.lv-btn-size-small span'
  ];

  let editButton = null;

  // Tentar com querySelector direto primeiro
  editButton = document.querySelector('button.lv-btn.lv-btn-secondary.lv-btn-size-small');

  // Se não encontrar, procurar por texto
  if (!editButton) {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const span = button.querySelector('span');
      if (span && span.textContent && span.textContent.includes('Edit more')) {
        editButton = button;
        break;
      }
    }
  }

  if (editButton) {
    console.log('✅ Botão Edit more encontrado, clicando...');
    editButton.click();
    showNotification('Abrindo editor...');
  } else {
    console.warn('⚠️ Botão Edit more não encontrado');
    showNotification('Botão Edit more não encontrado', 'error');
  }
}

// Contador de tentativas para substituir o draft input
let replaceDraftAttempts = 0;
const MAX_REPLACE_ATTEMPTS = 30; // Tentar por até 30 segundos
const INITIAL_DELAY = 5000; // Aguardar 5 segundos antes de iniciar

// Função para substituir o conteúdo do draft-input (apenas uma vez por sessão)
async function replaceDraftInput() {
  console.log(`📝 [Tentativa ${replaceDraftAttempts + 1}/${MAX_REPLACE_ATTEMPTS}] Verificando se estamos na página do editor...`);

  // Verificar se estamos na URL do editor
  if (!window.location.href.includes('/editor/')) {
    console.log('❌ Não estamos na página do editor');
    return;
  }

  // Verificar se já substituímos o nome nesta sessão
  const sessionCheck = await chrome.storage.local.get(['draftNameReplaced']);
  if (sessionCheck.draftNameReplaced) {
    console.log('✓ Nome já foi substituído nesta sessão, não substituindo novamente');
    return;
  }

  // Obter o nome do arquivo salvo
  const result = await chrome.storage.local.get(['lastFilename']);
  const filename = result.lastFilename || '';

  if (!filename) {
    console.log('⚠️ Nenhum nome de arquivo configurado no input "filenameInput"');
    console.log('💡 Dica: Abra o popup da extensão e preencha o campo "Nome do arquivo"');
    return;
  }

  console.log(`🔍 Procurando INPUT REAL (draft-input__item) para substituir por: "${filename}"`);

  // Procurar o INPUT REAL que salva na nuvem
  const draftInput = document.querySelector('input.draft-input__item');

  if (draftInput) {
    console.log(`✅ INPUT REAL encontrado! Valor atual: "${draftInput.value}"`);
    console.log(`   Tipo: ${draftInput.type}, Tag: ${draftInput.tagName}, Classes: ${draftInput.className}`);

    // MÉTODO 1: Native Value Setter (bypass React)
    try {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(draftInput, filename);
      console.log('   🔧 Método 1: Native setter aplicado (bypass React)');
    } catch (e) {
      console.log('   ⚠️ Método 1 falhou:', e.message);
    }

    // MÉTODO 2: Substituir via propriedade .value
    draftInput.value = filename;
    console.log('   🔧 Método 2: .value aplicado diretamente');

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 150));

    // MÉTODO 3: Focus e seleção para simular interação do usuário
    draftInput.focus();
    draftInput.select();
    console.log('   🔧 Método 3: Focus e select aplicados');

    // Aguardar
    await new Promise(resolve => setTimeout(resolve, 150));

    // MÉTODO 4: Disparar TODOS os eventos necessários para React/Vue
    const events = [
      new FocusEvent('focus', { bubbles: true }),
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true }),
      new Event('input', { bubbles: true, cancelable: true }),
      new InputEvent('input', { bubbles: true, cancelable: true, data: filename }),
      new KeyboardEvent('keyup', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
      new FocusEvent('blur', { bubbles: true })
    ];

    events.forEach((event, index) => {
      draftInput.dispatchEvent(event);
    });
    console.log('   🔧 Método 4: Eventos disparados (focus, keydown, input, keyup, change, blur)');

    // Aguardar para o React processar
    await new Promise(resolve => setTimeout(resolve, 300));

    // Remover focus
    draftInput.blur();

    // Verificar se a substituição "pegou"
    await new Promise(resolve => setTimeout(resolve, 200));
    const currentValue = draftInput.value;

    if (currentValue === filename) {
      console.log(`✅✅✅ SUCESSO TOTAL! Valor REAL verificado: "${currentValue}"`);
      console.log(`   ✓✓✓ O nome "${filename}" DEVE SALVAR NA NUVEM agora!`);
      showNotification(`✓ Nome "${filename}" salvo!`);

      // Marcar que já substituímos o nome nesta sessão
      await chrome.storage.local.set({ draftNameReplaced: true });
      console.log('✓ Marcado como substituído - não substituirá novamente até clicar em "Limpar"');

      // Resetar contador de tentativas
      replaceDraftAttempts = 0;
    } else {
      console.log(`⚠️ ATENÇÃO: Substituição não persistiu! Valor atual: "${currentValue}"`);
      console.log(`   ⏳ Tentando novamente em 1s...`);

      replaceDraftAttempts++;
      if (replaceDraftAttempts < MAX_REPLACE_ATTEMPTS) {
        setTimeout(replaceDraftInput, 1000);
      } else {
        console.log(`❌ Máximo de tentativas atingido (${MAX_REPLACE_ATTEMPTS})`);
        replaceDraftAttempts = 0;
      }
    }
  } else {
    replaceDraftAttempts++;

    if (replaceDraftAttempts >= MAX_REPLACE_ATTEMPTS) {
      console.log(`❌ INPUT REAL (draft-input__item) não encontrado após ${MAX_REPLACE_ATTEMPTS} tentativas`);
      console.log('💡 O elemento input.draft-input__item pode não estar disponível nesta página');
      console.log('💡 Verifique se você está na página correta do editor do CapCut');
      replaceDraftAttempts = 0;
      return;
    }

    console.log(`⏳ INPUT REAL ainda não encontrado, tentando novamente em 1s... (${replaceDraftAttempts}/${MAX_REPLACE_ATTEMPTS})`);
    setTimeout(replaceDraftInput, 1000);
  }
}

// Observer para detectar mudanças de URL e elementos novos
function setupPageObserver() {
  // Detectar mudança de URL
  let lastUrl = window.location.href;

  const urlObserver = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('🔄 URL mudou para:', currentUrl);

      // Se mudou para o editor, resetar tentativas e substituir o draft input
      if (currentUrl.includes('/editor/')) {
        console.log('📄 Página do editor detectada! Aguardando 5 segundos para página carregar completamente...');
        replaceDraftAttempts = 0; // Resetar contador
        setTimeout(replaceDraftInput, INITIAL_DELAY); // Aguardar 5s para página carregar completamente
      }
    }
  });

  urlObserver.observe(document.body, { childList: true, subtree: true });

  // Não precisa mais de verificação periódica - substituição acontece apenas uma vez
}

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CapCut Prompt Extractor inicializado (DOMContentLoaded)');
    loadSavedPrompts();
    setupManualClickDetection();
    setupPageObserver();

    // Se já estamos no editor, tentar substituir
    if (window.location.href.includes('/editor/')) {
      console.log('📄 Já estamos na página do editor! Aguardando 5 segundos para página carregar completamente...');
      replaceDraftAttempts = 0; // Resetar contador
      setTimeout(replaceDraftInput, INITIAL_DELAY); // Aguardar 5s para garantir que a página carregou completamente
    }
  });
} else {
  console.log('🚀 CapCut Prompt Extractor inicializado (página já carregada)');
  loadSavedPrompts();
  setupManualClickDetection();
  setupPageObserver();

  // Se já estamos no editor, tentar substituir
  if (window.location.href.includes('/editor/')) {
    console.log('📄 Já estamos na página do editor! Aguardando 5 segundos para página carregar completamente...');
    replaceDraftAttempts = 0; // Resetar contador
    setTimeout(replaceDraftInput, INITIAL_DELAY); // Aguardar 5s para garantir que a página carregou completamente
  }
}

// Escutar mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PROMPTS') {
    sendResponse({ prompts: extractedPrompts });
  } else if (request.type === 'CLEAR_PROMPTS') {
    console.log('🗑️ Limpando TODOS os dados no content script...');

    // Limpar todos os arrays e estruturas
    extractedPrompts = [];
    capturedPromptsFromLogs.clear();
    extractionQueue = [];
    currentExtractionIndex = -1;
    isExtracting = false;
    shouldStop = false;

    // Limpar storage
    chrome.storage.local.set({
      prompts: [],
      draftNameReplaced: false,
      lastExportTime: null
    });

    console.log('✅ Todos os dados foram limpos no content script');
    sendResponse({ success: true });
  } else if (request.type === 'EXTRACT_ALL_PROMPTS') {
    shouldStop = false;
    extractAllPrompts();
    sendResponse({ success: true });
  } else if (request.type === 'STOP_EXTRACTION') {
    shouldStop = true;
    isExtracting = false;
    showNotification('Extração interrompida');
    sendResponse({ success: true });
  } else if (request.type === 'GET_EXTRACTION_STATUS') {
    sendResponse({
      isExtracting: isExtracting,
      currentIndex: currentExtractionIndex,
      totalFound: findAllSceneElements().length
    });
  } else if (request.type === 'FORCE_NAME_REPLACEMENT') {
    console.log('🔄🔄🔄 FORÇAR SUBSTITUIÇÃO DE NOME RECEBIDO!');
    console.log('Nome a ser forçado:', request.filename);

    // Resetar tentativas e flag
    replaceDraftAttempts = 0;

    // Salvar o nome no storage
    chrome.storage.local.set({
      lastFilename: request.filename,
      draftNameReplaced: false // Importante: resetar para permitir nova substituição
    }).then(() => {
      console.log('✓ Storage atualizado, iniciando substituição forçada AGORA...');

      // Chamar a função de substituição IMEDIATAMENTE (sem delay)
      replaceDraftInput();

      sendResponse({ success: true });
    });

    return true; // Manter canal aberto para resposta assíncrona
  }
});
