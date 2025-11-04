// content-simplified.js - Suno Bulk Downloader v5.5 - Versão Simplificada e Funcional

console.log('🎵 Suno Bulk Downloader v5.5 loading...');

class SunoBulkDownloaderSimplified {
  constructor() {
    console.log('🏗️ SunoBulkDownloaderSimplified constructor called');
    this.selections = new Map();
    this.cache = new Map();
    this.initialized = false;
    this.observers = [];
    this.processedRows = new WeakSet(); // Prevenir duplicação
    this.processing = false;
    this.isAutoScrolling = false; // Flag para auto-scroll

    console.log('🔧 Starting initialization...');
    this.init();
  }
  
  async init() {
    try {
      console.log('🚀 Initializing Suno Bulk Downloader...');
      
      // Carregar sistema de internacionalização
      await this.loadI18n();
      
      // Configurar listener para comunicação com background
      this.setupMessageListener();
      
      // Sempre criar interface principal
      await this.restoreSelections();
      this.createInterface();
      this.setupObservers();
      this.setupDownloadEventListener(); // Configurar listener de renomeação
      this.processExistingSongs();
      
      // Restaurar estado do sidebar
      this.restoreSidebarState();

      // Garantir botão SRT na página de música individual (timing igual extensão modelo)
      setTimeout(() => this.ensureSRTButton(), 3000);

      // Observer para mudanças de URL (navegação SPA)
      this.observeURLChanges();
      
      this.initialized = true;
      console.log('✅ Suno Bulk Downloader initialized successfully');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
    }
  }

  // Configurar listener para comunicação com background
  setupMessageListener() {
    chrome.runtime?.onMessage?.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === "pmu-get-current-title") {
        // Usar a mesma lógica que funciona para downloads individuais
        const title = this.getCurrentPageTitle();
        console.log(`🎵 [PMU] Título encontrado para background: "${title}"`);
        sendResponse({ title });
        return true;
      }
    });
  }

  // Obter título atual da página (mesma lógica do sistema PMU)
  getCurrentPageTitle() {
    // Estratégia 1: Tentar seletores específicos primeiro
    let title = '';
    const titleSelectors = [
      'main h1',
      'div[class*="text-white"] h1',
      'h1[class*="text-2xl"]',
      'h1[class*="font-bold"]',
      'div[style*="font-weight: 600"][style*="font-size: 24px"]',
      'div[style*="font-weight:600"][style*="font-size:24px"]',
      '[data-testid="song-title"]',
      '.song-title',
      'h1',
      'h2'
    ];
    
    for (const selector of titleSelectors) {
      const titleEl = this.queryOutsideSidebar(selector);
      if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 0) {
        const text = titleEl.textContent.trim();
        // Filtrar textos da extensão
        if (!text.includes('🎵') && !text.includes('Suno Automator') && !text.includes('Bulk Downloader')) {
          title = text;
          // Remover versões (v1.5+, v4.5+, etc)
          title = title.replace(/\s*v\d+(\.\d+)?\+?\s*$/i, '').trim();
          break;
        }
      }
    }

    // Estratégia 2: Fallback para row/card title
    if (!title) {
      const row = __pmuLastRow || document.querySelector('[data-clip-id][role="button"][data-react-aria-pressable="true"]');
      if (row) {
        title = pmuExtractRowTitle(row);
      }
    }

    // Fallback: título do painel lateral / cabeçalho
    if (!title) {
      const sideTitle = document.querySelector('aside h1, aside h2, [data-testid*=song] h1, [data-testid*=song] h2');
      if (sideTitle?.textContent) {
        title = sideTitle.textContent.trim();
      }
    }

    return this.sanitizeTitleForFile(title || 'suno-track');
  }

  // Carregar sistema de internacionalização
  async loadI18n() {
    try {
      console.log('🌍 Loading i18n system...');
      
      // Injetar o script i18n
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('i18n.js');
      
      document.head.appendChild(script);
      
      // Aguardar o script carregar
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('✅ i18n system loaded');
          
          // Aguardar um pouco para o sistema inicializar
          setTimeout(() => {
            if (window.sunoI18n) {
              console.log(`🌍 Current locale: ${window.sunoI18n.getCurrentLocale()}`);
            }
            resolve();
          }, 100);
        };
        script.onerror = (error) => {
          console.error('❌ Failed to load i18n system:', error);
          reject(error);
        };
      });
      
    } catch (error) {
      console.error('❌ Error loading i18n:', error);
    }
  }

  // Função helper para obter traduções
  t(key, substitutions) {
    if (window.t) {
      return window.t(key, substitutions);
    }
    
    // Fallback se i18n não estiver carregado
    const fallbackTexts = {
      extensionName: 'SUNO LoopLess Download',
  version: 'v5.5',
  distributedBy: 'Distributed by:',
  developedBy: 'Developed by:',
  selected: 'selected',
  selectAll: 'Select All',
  deselectPage: 'Deselect Page',
  clearAll: 'Clear All',
  download: 'Download',
  refresh: 'Refresh',
  donate: 'Support ❤️',
  help: 'Help'
    };
    
    return fallbackTexts[key] || key;
  }
  
  // Debounce simples
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  
  // Observer para mudanças de URL
  observeURLChanges() {
    let currentUrl = location.href;

    setInterval(() => {
      if (location.href !== currentUrl) {
        currentUrl = location.href;
        console.log('🔄 URL changed - reprocessing songs');

        // Atualizar visibilidade do botão Auto-Scroll
        setTimeout(() => {
          this.toggleAutoScrollButton();
        }, 100);

        // Não limpar seleções ao trocar de página; apenas reprocessar e sincronizar
        setTimeout(() => {
          this.processExistingSongs()?.then(() => {
            this.syncCheckboxStates();
            this.updateInterface();
          });
        }, 300);
        
        // Reavaliar injeção do botão SRT quando trocar de página (timing igual extensão modelo)
        setTimeout(() => this.ensureSRTButton(), 1000);
      }
    }, 1000);
  }

  // Inserir botão MP3 em páginas de música individuais (padronizado)
  ensureSRTButton() {
    try {
      const isSongPage = window.location.pathname.includes('/song/');
      if (!isSongPage) {
        const existing = document.getElementById('sbd-individual-mp3');
        if (existing) existing.remove();
        return;
      }

      // Evitar duplicação
      if (document.getElementById('sbd-individual-mp3') || document.getElementById('sbd-individual-srt') || document.getElementById('sbd-individual-music')) return;

      const songId = window.location.pathname.split('/song/')[1]?.split('?')[0]?.split('/')[0];
      if (!songId) return;

      // ESTRATÉGIA 1: Buscar imagem específica com classes típicas do Suno
      let targetImage = null;
      
      // Buscar por Song Cover Image (como no exemplo fornecido)
      const coverImages = document.querySelectorAll('img[alt*="Song Cover"], img[alt*="Cover"], img.object-cover');
      if (coverImages.length > 0) {
        // Priorizar imagem que contenha o songId no src
        targetImage = Array.from(coverImages).find(img => img.src && img.src.includes(songId));
        if (!targetImage) targetImage = coverImages[0];
        console.log('✅ Found Song Cover Image');
      }
      
      // ESTRATÉGIA 2: Buscar imagem com songId e classes comuns
      if (!targetImage) {
        const images = document.querySelectorAll(`img[src*="${songId}"].w-full.h-full, img[src*="${songId}"].block.h-full.w-full`);
        if (images.length > 0) {
          targetImage = images[0];
          console.log('✅ Found image with songId and typical classes');
        }
      }
      
      // ESTRATÉGIA 3: Buscar qualquer imagem com songId
      if (!targetImage) {
        const anyImages = document.querySelectorAll(`img[src*="${songId}"]`);
        if (anyImages.length > 0) {
          targetImage = anyImages[0];
          console.log('✅ Found any image with songId');
        }
      }
      
      // ESTRATÉGIA 4: Buscar imagem em página individual (sem depender do songId)
      if (!targetImage && window.location.href.includes('/song/')) {
        const pageImages = document.querySelectorAll('img.object-cover, img[class*="cursor-pointer"], img[data-src*="suno.ai"]');
        if (pageImages.length > 0) {
          targetImage = pageImages[0];
          console.log('✅ Found image on individual song page');
        }
      }
      
      console.log(`🔍 Found ${targetImage ? '1' : '0'} target image for songId ${songId}`);
      
      if (targetImage) {
        console.log('✅ Using image method for button placement');
        this.createMP3ButtonOnImage(targetImage, songId);
      } else {
        console.log('⚠️ No suitable image found, trying container method');
        // Fallback: tentar método original
        const container = this.findActionsContainer(songId) || this.findActionsContainer();
        if (container) {
          console.log('📍 Using original container method');
          this.createMP3ButtonNative(container, songId);
        } else {
          console.log('❌ No suitable location found for MP3 button');
        }
      }
    } catch (e) {
      console.warn('ensureMP3Button error:', e);
    }
  }

  // Encontrar o container de botões de ação (próximo à imagem ou por seletor direto)
  findActionsContainer(songId) {
    // Estratégia 1: encontrar imagem contendo o songId no src e subir na árvore
    if (songId) {
      const coverImg = document.querySelector(`div > img[src*="${songId}"]`);
      if (coverImg) {
        let cur = coverImg;
        for (let i = 0; i < 15 && cur; i++) {
          const candidate = cur.querySelector('.flex.flex-1.flex-row.items-center.justify-start.gap-2')
            || cur.querySelector('[class*="flex"][class*="flex-row"][class*="items-center"][class*="gap-2"]');
          if (candidate && candidate.querySelector('button')) return candidate;
          cur = cur.parentElement;
        }
      }
    }

    // Estratégia 2: busca direta por seletores comuns
    const selectors = [
      '.flex.flex-1.flex-row.items-center.justify-start.gap-2',
      '[class*="flex-1"][class*="flex-row"][class*="items-center"][class*="gap-2"]',
      '[class*="justify-start"][class*="gap-2"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.querySelector('button')) return el;
    }
    return null;
  }

  // Criar botão MP3 sobre a imagem (padronizado igual aos outros)
  createMP3ButtonOnImage(image, songId) {
    const parentDiv = image.parentElement;
    if (!parentDiv) return;

    // Verificar se já existe container de botões
    let buttonContainer = parentDiv.querySelector('.sbd-image-buttons');
    if (!buttonContainer) {
      buttonContainer = document.createElement('div');
      buttonContainer.className = 'sbd-image-buttons';
      buttonContainer.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px;
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        z-index: 1000;
      `;
      parentDiv.style.position = 'relative'; // Garantir que o pai tenha position relative
      parentDiv.appendChild(buttonContainer);
    }

    // Criar apenas UM botão MP3 (padronizado igual aos outros)
    const mp3Button = document.createElement('button');
    mp3Button.id = 'sbd-individual-mp3';
    mp3Button.className = 'font-sans font-medium text-center rounded-md cursor-pointer bg-quaternary text-primary hover:bg-primary/30 hover:text-primary px-3 py-2 min-w-0 text-sm block w-full';
    mp3Button.style.cssText = `
      background: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      backdrop-filter: blur(10px) !important;
    `;
    
    // VISUAL PADRONIZADO: MP3 + seta para baixo (igual aos outros botões)
    mp3Button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block; margin-right: 4px;">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
      MP3
    `;

    // Hover effects
    mp3Button.addEventListener('mouseenter', () => {
      mp3Button.style.background = 'linear-gradient(135deg, #d96b00, #ff8c00) !important';
      mp3Button.style.borderColor = '#d96b00 !important';
      mp3Button.style.transform = 'translateY(-2px) !important';
    });
    mp3Button.addEventListener('mouseleave', () => {
      mp3Button.style.background = 'rgba(255, 255, 255, 0.1) !important';
      mp3Button.style.borderColor = 'rgba(255, 255, 255, 0.3) !important';
      mp3Button.style.transform = 'translateY(0) !important';
    });

    mp3Button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Disparar evento para configurar nome do arquivo
      window.dispatchEvent(new CustomEvent('pmu-download', { 
        detail: { songId, explicitExt: 'mp3' }
      }));
      
      this.downloadMusicFromId(songId);
    });

    // Criar botão SRT
    const srtButton = document.createElement('button');
    srtButton.id = 'sbd-individual-srt';
    srtButton.className = 'font-sans font-medium text-center rounded-md cursor-pointer bg-quaternary text-primary hover:bg-primary/30 hover:text-primary px-3 py-2 min-w-0 text-sm block w-full';
    srtButton.style.cssText = `
      background: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      backdrop-filter: blur(10px) !important;
    `;
    
    srtButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block; margin-right: 4px;">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
      Lyrics
    `;
    srtButton.title = this.t('downloadSrt');

    // Hover effects para SRT
    srtButton.addEventListener('mouseenter', () => {
      srtButton.style.background = 'linear-gradient(135deg, #d96b00, #ff8c00) !important';
      srtButton.style.borderColor = '#d96b00 !important';
      srtButton.style.transform = 'translateY(-2px) !important';
    });
    srtButton.addEventListener('mouseleave', () => {
      srtButton.style.background = 'rgba(255, 255, 255, 0.1) !important';
      srtButton.style.borderColor = 'rgba(255, 255, 255, 0.3) !important';
      srtButton.style.transform = 'translateY(0) !important';
    });

    srtButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Usar a mesma lógica de download SRT
      await this.downloadSRTFromAligned(songId);
    });

    // Adicionar ambos os botões (SRT + MP3)
    buttonContainer.appendChild(srtButton);
    buttonContainer.appendChild(mp3Button);
  }

  // Criar botão MP3 com aparência nativa e inserir no container
  createMP3ButtonNative(container, songId) {
    // Criar botão SRT
    const srtBtn = document.createElement('button');
    srtBtn.id = 'sbd-individual-srt';
    srtBtn.type = 'button';
    srtBtn.className = 'relative inline-block font-sans font-medium text-center before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:border before:border-transparent before:bg-transparent after:absolute after:inset-0 after:pointer-events-none after:rounded-[inherit] after:bg-transparent after:opacity-0 enabled:hover:after:opacity-100 transition duration-75 before:transition before:duration-75 after:transition after:duration-75 select-none cursor-pointer px-3 py-0.5 text-sm leading-[24px] rounded-full text-foreground-primary bg-background-tertiary enabled:hover:before:bg-overlay-on-primary disabled:after:bg-background-primary disabled:after:opacity-50 grow md:grow-0';

    const srtSpan = document.createElement('span');
    srtSpan.className = 'relative flex flex-row items-center justify-center gap-1';
    srtSpan.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="text-current shrink-0 w-4 h-4 m-1 mx-0">
        <path d="M7 10l5 5 5-5"/>
      </svg>
      <span>Lyrics</span>
    `;
    srtBtn.appendChild(srtSpan);
  srtBtn.title = this.t('downloadSrt');

    srtBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.downloadSRTFromAligned(songId);
    });

    // Criar botão MP3
    const mp3Btn = document.createElement('button');
    mp3Btn.id = 'sbd-individual-mp3';
    mp3Btn.type = 'button';
    mp3Btn.className = 'relative inline-block font-sans font-medium text-center before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:border before:border-transparent before:bg-transparent after:absolute after:inset-0 after:pointer-events-none after:rounded-[inherit] after:bg-transparent after:opacity-0 enabled:hover:after:opacity-100 transition duration-75 before:transition before:duration-75 after:transition after:duration-75 select-none cursor-pointer px-3 py-0.5 text-sm leading-[24px] rounded-full text-foreground-primary bg-background-tertiary enabled:hover:before:bg-overlay-on-primary disabled:after:bg-background-primary disabled:after:opacity-50 grow md:grow-0';

    const mp3Span = document.createElement('span');
    mp3Span.className = 'relative flex flex-row items-center justify-center gap-1';
    mp3Span.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="text-current shrink-0 w-4 h-4 m-1 mx-0">
        <path d="M7 10l5 5 5-5"/>
      </svg>
      <span>MP3</span>
    `;
    mp3Btn.appendChild(mp3Span);
  mp3Btn.title = this.t('downloadMusic');

    mp3Btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.downloadMusicFromId(songId);
    });

    // Inserir antes do botão "Mais opções" quando possível
    const moreBtn = container.querySelector('button[aria-label="More Options"], button[aria-label="More Actions"]');
    try {
      if (moreBtn) {
        let ref = moreBtn;
        while (ref && ref.parentElement && ref.parentElement !== container) ref = ref.parentElement;
        if (ref && ref.parentElement === container) {
          container.insertBefore(srtBtn, ref);
          container.insertBefore(mp3Btn, ref);
        } else if (moreBtn.parentElement && container.contains(moreBtn.parentElement)) {
          moreBtn.parentElement.insertBefore(srtBtn, moreBtn);
          moreBtn.parentElement.insertBefore(mp3Btn, moreBtn);
        } else {
          container.appendChild(srtBtn);
          container.appendChild(mp3Btn);
        }
      } else {
        container.appendChild(srtBtn);
        container.appendChild(mp3Btn);
      }
    } catch (_) {
      container.appendChild(srtBtn);
      container.appendChild(mp3Btn);
    }

    console.log('🎯 SRT + MP3 buttons added to container for song:', songId);
  }

  // Download de música individual usando ID
  async downloadMusicFromId(songId, preferredTitle) {
    try {
  this.showToast(this.t('preparingDownload'));
      
      // USAR AS FUNÇÕES ESPECÍFICAS QUE CRIAMOS
      let songTitle = preferredTitle || null;
      
      // Se não temos título preferido, determinar contexto e usar função apropriada
      if (!songTitle) {
        const isPlayerContext = document.querySelector('.player') !== null;
        const isPlaylistContext = window.location.href.includes('/playlist') || document.querySelector('[class*="playlist"]') !== null;
        const isIndividualPage = window.location.href.includes('/song/');
        
        console.log(`🔍 [INDIVIDUAL DOWNLOAD] Contexto: Player=${isPlayerContext}, Playlist=${isPlaylistContext}, Individual=${isIndividualPage}`);
        
        if (isIndividualPage) {
          songTitle = this.extractTitleForIndividualPage(songId);
          console.log(`🎵 [INDIVIDUAL] Título extraído: "${songTitle}"`);
        } else if (isPlaylistContext) {
          songTitle = this.extractTitleForPlaylistButton(songId);
          console.log(`🎵 [PLAYLIST] Título extraído: "${songTitle}"`);
        } else if (isPlayerContext) {
          songTitle = this.extractTitleForPlayerBar();
          console.log(`🎵 [PLAYER] Título extraído: "${songTitle}"`);
        } else {
          // Fallback para bulk se não conseguir detectar contexto
          songTitle = this.extractTitleForBulkDownload(songId);
          console.log(`🎵 [FALLBACK] Título extraído: "${songTitle}"`);
        }
      }
      
      // Estratégia de fallback se todas as funções específicas falharam
      if (!songTitle) {
        try {
          const meta = await this.getSongMetadata(songId);
          if (meta?.title) {
            songTitle = meta.title;
            console.log(`🎵 [API FALLBACK] Título da API: "${songTitle}"`);
          }
        } catch (e) {
          console.log('⚠️ API não disponível');
        }
      }
      
      // Último fallback
      if (!songTitle) {
        songTitle = `Music-${songId.substring(0, 8)}`;
        console.log(`🎵 [ULTIMO FALLBACK] Usando: "${songTitle}"`);
      }
      
      // Se ainda não encontrou, tentar pelo título da página
      if (songTitle === 'suno-song') {
        const pageTitle = document.title;
        if (pageTitle && !pageTitle.includes('Suno') && pageTitle.length < 100) {
          songTitle = pageTitle.replace(' - Suno', '').trim();
          console.log(`📄 Título da página usado: "${songTitle}"`);
        }
      }
      // Informar intenção de nome amigável ao background com o título final
      try {
        await chrome.runtime.sendMessage({
          type: 'pmu-set-filename',
          base: this.sanitizeTitleForFile(songTitle || songId),
          ext: 'mp3'
        });
      } catch (_) { /* ignore */ }

      // Criar nome de arquivo limpo com o nome da música
      const cleanTitle = songTitle
        .replace(/[^\w\s\-\u00C0-\u017F]/g, '') // Removes special characters, keeps accents
        .replace(/\s+/g, '_')                    // Spaces become underscore
        .replace(/_{2,}/g, '_')                  // Removes double underscores
        .replace(/^_+|_+$/g, '')                 // Removes underscores from start/end
        .substring(0, 50);                       // Limits size
      
      const filename = `${cleanTitle || songId}.mp3`;
      const url = `https://cdn1.suno.ai/${songId}.mp3`;
      
      console.log(`🎵 Iniciando download: ${filename} de ${url}`);

      // Enviar mensagem para o background script fazer o download
      const response = await chrome.runtime.sendMessage({
        action: 'download',
        url: url,
        filename: filename
      });

      if (response && response.success) {
        this.showToast(`✅ Download iniciado: ${songTitle}`);
        console.log(`✅ Download enviado com sucesso: ${filename}`);
        
        // Limpar seleções após download individual bem-sucedido
        if (this.selections && this.selections.has) {
          // Remover apenas esta música das seleções
          const songCards = document.querySelectorAll('[data-clip-id]');
          songCards.forEach(card => {
            const cardId = card.getAttribute('data-clip-id');
            if (cardId === songId) {
              this.selections.delete(cardId);
            }
          });
          this.updateInterface();
          this.saveSelections();
          console.log('🧹 Seleção removida após download individual');
        }
      } else {
  throw new Error(response?.error || this.t('downloadFailed'));
      }

    } catch (err) {
      console.error('Music download failed:', err);
  this.showToast(`${this.t('downloadError')} ${err.message}`);
    }
  }

  // Download SRT usando aligned_lyrics/v2
  async downloadSRTFromAligned(songId, preferredTitle) {
    try {
  this.showToast(this.t('extractingLyrics'));
      
      // Buscar nome da música de forma mais abrangente
      let songTitle = preferredTitle || 'suno-song';
      
      // Estratégia 1: Priorizar API primeiro
      try {
        const meta = await this.getSongMetadata(songId);
        if (meta?.title) {
          songTitle = meta.title;
          console.log(`🎵 Título da API para SRT: "${songTitle}"`);
        }
      } catch (e) {
        console.log('⚠️ API não disponível para SRT, tentando DOM');
      }

      // Estratégia 2: Seletores específicos do Suno (só se API falhar)
      if (songTitle === 'suno-song') {
        // PRIMEIRA PRIORIDADE: Input com value do nome da música
        const titleInput = document.querySelector('input[type="text"][value]:not([value=""]):not([value="Song"]):not([value="Music"]):not([value="Track"])');
        if (titleInput && titleInput.value) {
          const inputValue = titleInput.value.trim();
          if (inputValue && 
              !inputValue.includes('🎵') && 
              !inputValue.includes('Suno Automator') && 
              !inputValue.includes('Bulk Downloader') &&
              !inputValue.includes('Frequently Used') &&
              inputValue !== 'Song' && inputValue !== 'Music' && inputValue !== 'Track' &&
              inputValue.length > 2) {
            songTitle = inputValue;
            console.log(`🎵 Título do input para SRT: "${songTitle}"`);
          }
        }
        
        // FALLBACK: Outros seletores se o input não funcionar
        if (songTitle === 'suno-song') {
          const titleSelectors = [
            // Página de música individual
            'main h1',
            'div[class*="text-white"] h1',
            'h1[class*="text-2xl"]',
            'h1[class*="font-bold"]',
            'div[style*="font-weight: 600"][style*="font-size: 24px"]',
            'div[style*="font-weight:600"][style*="font-size:24px"]',
            // Fallbacks genéricos
            '[data-testid="song-title"]',
            '.song-title',
            'h1',
            'h2'
          ];
          
          for (const selector of titleSelectors) {
            const titleEl = this.queryOutsideSidebar(selector);
            if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 0) {
              const text = titleEl.textContent.trim();
              // Filtrar textos da extensão e títulos problemáticos
              if (!text.includes('🎵') && 
                  !text.includes('Suno Automator') && 
                  !text.includes('Bulk Downloader') &&
                  !text.includes('Frequently Used') &&
                  text !== 'Song' && text !== 'Music' && text !== 'Track') {
                songTitle = text;
                // Remover versões (v1.5+, v4.5+, etc)
                songTitle = songTitle.replace(/\s*v\d+(\.\d+)?\+?\s*$/i, '').trim();
                console.log(`🎵 Título encontrado no DOM para SRT: "${songTitle}"`);
                break;
              }
            }
          }
        }
      }
      
      // Se ainda não encontrou, tentar pelo título da página
      if (songTitle === 'suno-song') {
        const pageTitle = document.title;
        if (pageTitle && !pageTitle.includes('Suno') && pageTitle.length < 100) {
          songTitle = pageTitle.replace(' - Suno', '').trim();
          console.log(`📄 Título da página usado para SRT: "${songTitle}"`);
        }
      }

      // Informar intenção de nome para o próximo download (SRT) com o título final
      try {
        await chrome.runtime.sendMessage({
          type: 'pmu-set-filename',
          base: this.sanitizeTitleForFile(songTitle || songId),
          ext: 'srt'
        });
      } catch (_) { /* ignore */ }

      const sessionToken = ('; ' + document.cookie).split('; __session=').length === 2
        ? ('; ' + document.cookie).split('; __session=').pop().split(';').shift()
        : null;
      if (!sessionToken) throw new Error('Token de sessão ausente');

      const resp = await fetch(`https://studio-api.prod.suno.com/api/gen/${songId}/aligned_lyrics/v2/`, {
        headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' }
      });
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const data = await resp.json();
      const words = Array.isArray(data.aligned_words) ? data.aligned_words : [];
      if (!words.length) throw new Error('Sem dados de timing');
      
      console.log(`📊 Dados brutos da API:`, {
        totalWords: words.length,
        firstFew: words.slice(0, 10),
        lastFew: words.slice(-10)
      });
      
      // Debug: mostrar TODAS as palavras para entender a estrutura
      console.log(`🔍 TODAS as palavras recebidas da API:`, words.map((w, i) => `${i}: "${w.word}"`).slice(0, 20));

      // Agrupamento por estrutura musical
      const phrases = this.groupByMusicalStructure(words);
      console.log(`🎼 Agrupadas ${phrases.length} seções musicais de ${words.length} palavras`);
      
      const srt = phrases.map((p, i) => `${i + 1}\n${this.formatSRTTime(p.start_s)} --> ${this.formatSRTTime(p.end_s)}\n${p.text}\n`).join('\n');
      
      console.log(`📝 Geradas ${phrases.length} seções de SRT de ${words.length} palavras originais`);
      console.log(`🎵 Preview das frases:`, phrases.slice(0, 5).map(p => `"${p.text.substring(0, 50)}..."`));
      
      // Log do conteúdo final para debug
      if (phrases.length > 0) {
        const allText = phrases.map(p => p.text).join(' ');
        console.log(`📋 Conteúdo completo (primeiros 200 chars): "${allText.substring(0, 200)}..."`);
      }
      
      // Criar nome de arquivo limpo com o nome da música
      const cleanTitle = songTitle
        .replace(/[^\w\s\-\u00C0-\u017F]/g, '') // Remove caracteres especiais, mantém acentos
        .replace(/\s+/g, '_')                    // Espaços viram underscore
        .replace(/_{2,}/g, '_')                  // Remove underscores duplos
        .replace(/^_+|_+$/g, '')                 // Remove underscores do início/fim
        .substring(0, 50);                       // Limita tamanho
      
      const file = `${cleanTitle || songId}.srt`;
      console.log(`💾 Arquivo será salvo como: "${file}"`);
      const blob = new Blob([srt], { type: 'text/srt;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file; a.style.display = 'none';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
  this.showToast(`✅ ${this.t('srtDownloaded')} ${file}`);
      
      // Limpar seleções após download SRT individual bem-sucedido
      if (this.selections && this.selections.has) {
        // Remover apenas esta música das seleções
        const songCards = document.querySelectorAll('[data-clip-id]');
        songCards.forEach(card => {
          const cardId = card.getAttribute('data-clip-id');
          if (cardId === songId) {
            this.selections.delete(cardId);
          }
        });
        this.updateInterface();
        this.saveSelections();
        console.log('🧹 Seleção removida após download SRT individual');
      }
    } catch (err) {
      console.error('SRT download failed:', err);
  this.showToast(`❌ ${this.t('srtDownloadError')} ${err.message}`);
    }
  }

  // NOVA ABORDAGEM: Preservar TODAS as palavras, só tratar tags especialmente
  groupByMusicalStructure(alignedWords) {
    const phrases = [];
    let currentWords = [];
    let phraseStartTime = null;
    let phraseEndTime = null;

    for (let i = 0; i < alignedWords.length; i++) {
      const word = alignedWords[i];
      const text = (word.word || '').trim();

      // NOVA REGRA: PRESERVAR TODAS AS PALAVRAS
      if (!text || text.length === 0) {
        continue; // Pular apenas palavras completamente vazias
      }

      // Se é uma tag completa entre colchetes, tratar como seção separada
      if (text.includes('[') && text.includes(']')) {
        // Finalizar frase atual se houver
        if (currentWords.length > 0) {
          const cleanText = currentWords
            .map(w => (w.word || '').trim())
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (cleanText.length > 0) {
            phrases.push({
              text: cleanText,
              start_s: phraseStartTime,
              end_s: phraseEndTime,
              isLyrics: true
            });
          }
        }

        // Adicionar a tag como seção própria
        phrases.push({
          text: text,
          start_s: word.start_s,
          end_s: word.end_s,
          isTag: true
        });

        console.log(`🎵 Tag de estrutura: "${text}"`);

        // Resetar para próxima frase
        currentWords = [];
        phraseStartTime = null;
        phraseEndTime = null;
        continue;
      }

      // Adicionar palavra normal (SEM FILTROS)
      currentWords.push(word);
      if (phraseStartTime === null) phraseStartTime = word.start_s;
      phraseEndTime = word.end_s;

      // Verificar se deve quebrar a frase aqui
      const shouldBreak = this.shouldBreakPhrase(word, alignedWords[i + 1], currentWords);

      if (shouldBreak) {
        // Criar frase com TODAS as palavras (sem filtros)
        const cleanText = currentWords
          .map(w => (w.word || '').trim())
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText.length > 0) {
          phrases.push({
            text: cleanText,
            start_s: phraseStartTime,
            end_s: phraseEndTime,
            isLyrics: true
          });
          console.log(`📝 Frase preservada: "${cleanText}"`);
        }

        // Resetar para próxima frase
        currentWords = [];
        phraseStartTime = null;
        phraseEndTime = null;
      }
    }

    // Finalizar última frase se houver
    if (currentWords.length > 0) {
      const cleanText = currentWords
        .map(w => (w.word || '').trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanText.length > 0) {
        phrases.push({
          text: cleanText,
          start_s: phraseStartTime,
          end_s: phraseEndTime,
          isLyrics: true
        });
      }
    }

    console.log(`🎼 Total de ${phrases.length} seções criadas (preservando tudo)`);
    return phrases;
  }

  // Decidir se deve quebrar a frase
  shouldBreakPhrase(currentWord, nextWord, currentWords) {
    const text = (currentWord.word || '').trim();
    
    // Quebrar se:
    // 1. Tem quebra de linha na palavra atual
    if (text.includes('\n')) {
      return true;
    }
    
    // 2. Muitas palavras acumuladas (máximo 8-10 palavras por frase)
    if (currentWords.length >= 8) {
      return true;
    }
    
    // 3. Pausa longa até próxima palavra (mais de 1 segundo)
    if (nextWord && (nextWord.start_s - currentWord.end_s) > 1.0) {
      return true;
    }
    
    // 4. Termina com pontuação
    if (/[.!?:;]$/.test(text)) {
      return true;
    }
    
    // 5. Próxima palavra é uma tag (início de nova seção)
    if (nextWord && (nextWord.word || '').includes('[')) {
      return true;
    }
    
    return false;
  }

  // FUNÇÃO DESABILITADA - Preservar todas as palavras
  isInstructionOrTag(text) {
    // DESABILITADO - preservar todas as palavras
    // Tags [] serão tratadas na função groupByMusicalStructure
    return false;
  }

  // Verificar se é uma tag de estrutura musical
  isMusicalStructureTag(text) {
    const structuralTags = [
      'intro', 'verse', 'chorus', 'bridge', 'outro', 'hook',
      'pre-chorus', 'refrain', 'instrumental', 'solo', 'break', 
      'fade', 'end', 'spoken', 'rap'
    ];

    const lowerText = text.toLowerCase();
    
    // Verificar se contém colchetes e alguma tag estrutural
    if (text.includes('[') && text.includes(']')) {
      return structuralTags.some(tag => lowerText.includes(tag));
    }

    return false;
  }

  // Agrupamento em frases legíveis (SEM filtragem adicional) 
  groupWordsIntoPhrases(alignedWords) {
    // Usar palavras já filtradas, sem processar mais
    const phrases = [];
    if (!alignedWords.length) return phrases;
    
    let cur = { words: [], start_s: alignedWords[0].start_s, end_s: alignedWords[0].end_s };
    for (let i = 0; i < alignedWords.length; i++) {
      const w = alignedWords[i];
      const nxt = alignedWords[i + 1];
      cur.words.push(w.word);
      cur.end_s = w.end_s;
      let breakHere = false;
      if (!nxt) breakHere = true; else {
        const pause = nxt.start_s - w.end_s;
        const text = cur.words.join(' ');
        const tooMany = cur.words.length >= 8;
        const tooLong = text.length > 50;
        const longPause = pause > 0.8;
        const punct = /[.!?;:]$/.test((w.word || '').trim());
        breakHere = longPause || tooMany || tooLong || punct;
      }
      if (breakHere) {
        const text = cur.words.join(' ').trim();
        if (text) phrases.push({ text, start_s: cur.start_s, end_s: cur.end_s });
        if (nxt) cur = { words: [], start_s: nxt.start_s, end_s: nxt.end_s };
      }
    }
    return phrases;
  }

  // Formatar tempo SRT
  formatSRTTime(sec) {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')},${ms.toString().padStart(3,'0')}`;
  }
  
  // Sanitiza um título para uso como nome de arquivo (preserva espaços e acentos)
  sanitizeTitleForFile(s) {
    if (!s) return 'suno';
    return s
      .normalize('NFKC')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'suno';
  }

  // Extrair título específico do card pela ID
  extractTitleFromCard(songId) {
    console.log(`🔍 Buscando card para ID: ${songId}`);
    
    // Tentar múltiplos seletores para encontrar o card
    const selectors = [
      `[data-clip-id="${songId}"]`,
      `[data-id="${songId}"]`,
      `[id*="${songId}"]`,
      `[data-song-id="${songId}"]`
    ];
    
    let card = null;
    let usedSelector = '';
    
    for (const selector of selectors) {
      card = document.querySelector(selector);
      if (card) {
        usedSelector = selector;
        break;
      }
    }
    
    if (!card) {
      console.log(`❌ Card não encontrado para ID: ${songId}`);
      return null;
    }
    
    console.log(`✅ Card encontrado com seletor: ${usedSelector}`);

    // Se não encontrou com seletores específicos, vamos tentar uma busca mais ampla
    if (!card) {
      console.log(`🔍 Tentando busca mais ampla por ID: ${songId}`);
      const allCards = document.querySelectorAll('[class*="card"], [class*="track"], [class*="song"], [class*="clip"], div[id], div[data-id]');
      for (const potentialCard of allCards) {
        const cardText = potentialCard.textContent || '';
        const cardId = potentialCard.id || potentialCard.getAttribute('data-id') || potentialCard.getAttribute('data-clip-id');
        
        if (cardId === songId || potentialCard.outerHTML.includes(songId)) {
          card = potentialCard;
          console.log(`✅ Card encontrado via busca ampla`);
          break;
        }
      }
    }

    // Tentar múltiplas estratégias de extração
    const strategies = [
      // Estratégia 0: Usar a mesma lógica que funciona para downloads individuais (aria-label do Play)
      () => {
        console.log(`🧪 Estratégia 0: Buscando aria-label do Play...`);
        const playButton = card.querySelector('[aria-label*="Play"]');
        if (playButton) {
          const ariaLabel = playButton.getAttribute("aria-label") || "";
          console.log(`🔍 Aria-label encontrado: "${ariaLabel}"`);
          const match = ariaLabel.match(/Play(?:\s+song)?[:\-]?\s*(.+)$/i);
          if (match && match[1]) {
            const title = match[1].trim();
            console.log(`📝 Título extraído do aria-label: "${title}"`);
            if (title && !/^🎵\s*Suno/i.test(title)) {
              return title;
            }
          }
        }
        console.log(`❌ Estratégia 0: Nenhum aria-label útil encontrado`);
        return null;
      },
      
      // Estratégia 1: Buscar por elementos específicos de título de música
      () => {
        const selectors = [
          '[class*="song-title"]',
          '[class*="track-title"]', 
          '[class*="clip-title"]',
          '[data-testid*="title"]',
          '[data-testid*="song"]',
          'h1, h2, h3, h4',
          '[class*="font-bold"]',
          '[class*="font-semibold"]'
        ];
        
        for (const selector of selectors) {
          const el = card.querySelector(selector);
          const text = el?.textContent?.trim();
          if (text && text.length > 2 && text.length < 150 && 
              !text.includes('Play') && !text.includes('Download') && 
              !text.includes('Share') && !text.includes('Like') &&
              !text.includes('🎵') && !text.includes('Subscribe')) {
            return text;
          }
        }
        return null;
      },
      
      // Estratégia 2: Usar lógica similar ao pmuExtractRowTitle
      () => {
        console.log(`🧪 Estratégia 2: Usando lógica pmuExtractRowTitle...`);
        const badPatterns = /^(Edit|Publish|Share|View|MP3|SRT|V\d(\.\d+)?|🎵\s*Suno|Play|Download|Like|Subscribe)/i;
        const candidates = [];
        
        card.querySelectorAll("a, h1, h2, h3, h4, [data-testid*=title]").forEach((el) => {
          const text = el.textContent?.trim();
          console.log(`🔍 Candidato encontrado: "${text}"`);
          if (text && text.length >= 3 && !badPatterns.test(text)) {
            candidates.push(text);
            console.log(`✅ Candidato válido: "${text}"`);
          } else if (text) {
            console.log(`❌ Candidato rejeitado (badPattern): "${text}"`);
          }
        });
        
        // Ordenar por comprimento (títulos mais longos primeiro)
        candidates.sort((a, b) => b.length - a.length);
        console.log(`📋 Candidatos finais (${candidates.length}):`, candidates);
        return candidates[0] || null;
      },
      
      // Estratégia 3: Buscar texto que parece ser título (não botão)
      () => {
        const textElements = card.querySelectorAll('div, span, p');
        for (const el of textElements) {
          const text = el.textContent?.trim();
          if (text && text.length > 3 && text.length < 100 && 
              !text.includes('Play') && !text.includes('Download') && 
              !text.includes('Share') && !text.includes('Like') &&
              !text.includes('ago') && !text.includes('views') &&
              !text.includes('🎵') && !text.match(/^\d+:\d+$/) &&
              !text.includes('Subscribe') && !text.includes('Follow')) {
            
            // Verificar se é realmente um título (não tem elementos filhos com botões)
            const hasButtons = el.querySelector('button, [role="button"], [onclick]');
            if (!hasButtons) {
              return text;
            }
          }
        }
        return null;
      },
      
      // Estratégia 4: Buscar por aria-label ou title (filtrado)
      () => {
        const labelEl = card.querySelector('[aria-label], [title]');
        const text = labelEl?.getAttribute('aria-label') || labelEl?.getAttribute('title');
        if (text && !text.includes('Play') && !text.includes('Download') && text.length > 3) {
          return text;
        }
        return null;
      }
    ];

    for (const strategy of strategies) {
      try {
        const title = strategy();
        console.log(`🧪 Estratégia tentada, resultado: "${title}"`);
        if (title && title.length > 3 && title.length < 150 &&
            !title.includes('🎵') && 
            !title.includes('Suno Automator') && 
            !title.includes('Bulk Downloader') &&
            !title.includes('Play Song') &&
            !title.includes('Download') &&
            !title.includes('Share') &&
            !title.includes('Like') &&
            !title.includes('Subscribe') &&
            !title.includes('Follow') &&
            !title.includes('ago') &&
            !title.includes('views') &&
            !title.match(/^\d+:\d+$/)) { // Evitar duração de música
          
          // Rejeitar títulos muito genéricos
          if (title === 'Song' || title === 'Music' || title === 'Track') {
            console.log(`⚠️ Título muito genérico rejeitado: "${title}"`);
            continue;
          }
          
          console.log(`✅ Título extraído do card: "${title}"`);
          return title;
        } else {
          console.log(`❌ Título rejeitado por validação: "${title}"`);
        }
      } catch (e) {
        console.log(`❌ Erro na estratégia: ${e.message}`);
        continue;
      }
    }
    
    console.log(`❌ Nenhuma estratégia funcionou para ID: ${songId}`);
    return null;
  }

  // Buscar elemento fora do sidebar da extensão
  queryOutsideSidebar(selector) {
    const all = Array.from(document.querySelectorAll(selector));
    return all.find(el => !el.closest('#sbd-sidebar')) || null;
  }
  
  
  createInterface() {
    if (document.getElementById('sbd-bar')) return;
    
    // Injetar CSS
    this.injectCSS();
    
    // Criar sidebar retrátil
    const sidebar = document.createElement('div');
    sidebar.id = 'sbd-sidebar';
    sidebar.innerHTML = `
      <!-- Cabeçalho do Sidebar -->
  <div class="sbd-sidebar-header">
  <h3 class="sbd-sidebar-title">${this.t('extensionName')} <span class="sbd-version-pill">v5.0</span></h3>
        <p class="sbd-sidebar-credits">
          ${this.t('distributedBy')} <strong>LoopLess</strong> • ${this.t('developedBy')} <strong>Nardoto</strong>
        </p>
      </div>

      <!-- Contador -->
      <div class="sbd-counter">
        <span class="sbd-counter-number">0</span>
        <span class="sbd-counter-label">${this.t('selected')}</span>
      </div>

      <!-- Botões Principais -->
        <button id="sbd-select-all" class="sbd-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 11l3 3L22 4"/>
          </svg>
  ${this.t('selectAll')}
        </button>

        <button id="sbd-auto-scroll" class="sbd-btn sbd-btn-primary" style="display: none;">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          🚀 Auto-Scroll
        </button>

        <button id="sbd-clear-page" class="sbd-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M6 6l12 12M6 18L18 6"/>
          </svg>
${this.t('deselectPage')}
        </button>

  <button id="sbd-clear-all" class="sbd-btn sbd-btn-danger">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="3,6 5,6 21,6"/>
            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
          </svg>
          ${this.t('clearAll')}
        </button>

  <button id="sbd-download" class="sbd-btn sbd-btn-primary" disabled>
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <path d="M7 10l5 5 5-5"/>
            <path d="M12 15V3"/>
          </svg>
          ${this.t('download')} (0)
        </button>

      <!-- Separador para botões secundários -->
      <div style="flex: 1;"></div>

  <button id="sbd-refresh" class="sbd-btn sbd-btn-secondary">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          ${this.t('refresh')}
        </button>

  <button id="sbd-donate" class="sbd-btn sbd-btn-donate">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          ${this.t('donate')}
        </button>
        
        <button id="sbd-help" class="sbd-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <circle cx="12" cy="18" r="1"/>
          </svg>
          ${this.t('help')}
        </button>
    `;

    // Criar botão toggle
    const toggleButton = document.createElement('button');
    toggleButton.id = 'sbd-toggle';
    toggleButton.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    `;
    
    document.body.insertAdjacentElement('afterbegin', sidebar);
    document.body.insertAdjacentElement('afterbegin', toggleButton);
    
  // Removido: seletor de idioma (interface sempre em EN)

    // Traduzir interface após criação
    this.translateInterface();
    
    // Event listeners
    this.setupEventListeners();
    
    console.log('🎨 Interface created');
  }

  // Traduzir interface usando i18n
  translateInterface() {
    try {
      console.log('🌍 Translating interface...');

      // Elementos com IDs específicos
      const translations = {
        // Textos de botões
        'sbd-select-all': () => {
          const btn = document.getElementById('sbd-select-all');
          if (btn) {
            const svg = btn.querySelector('svg').outerHTML;
            btn.innerHTML = svg + this.t('selectAll');
          }
        },
        'sbd-clear-page': () => {
          const btn = document.getElementById('sbd-clear-page'); 
          if (btn) {
            const svg = btn.querySelector('svg').outerHTML;
            btn.innerHTML = svg + this.t('deselectPage');
          }
        },
        'sbd-clear-all': () => {
          const btn = document.getElementById('sbd-clear-all');
          if (btn) {
            const svg = btn.querySelector('svg').outerHTML;
            btn.innerHTML = svg + this.t('clearAll');
          }
        },
        'sbd-download': () => {
          const btn = document.getElementById('sbd-download');
          if (btn) {
            const svg = btn.querySelector('svg').outerHTML;
            btn.innerHTML = svg + `${this.t('download')} (0)`;
          }
        },
        'sbd-refresh': () => {
          const btn = document.getElementById('sbd-refresh');
          if (btn) {
            // SVG corrigido para evitar erro de arc flag
            btn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>` + this.t('refresh');
          }
        },
        'sbd-donate': () => {
          const btn = document.getElementById('sbd-donate');
          if (btn) {
            const svg = btn.querySelector('svg').outerHTML;
            btn.innerHTML = svg + this.t('donate');
          }
        },
        'sbd-help': () => {
          const btn = document.getElementById('sbd-help');
          if (btn) {
            const svg = btn.querySelector('svg').outerHTML;
            btn.innerHTML = svg + this.t('help');
          }
        }
      };

      // Textos por seletores
      const selectorTranslations = {
  '.sbd-sidebar-title': `${this.t('extensionName')} <span class="sbd-version-pill">v5.0</span>`,
        '.sbd-sidebar-credits': `${this.t('distributedBy')} <strong>LoopLess</strong> • ${this.t('developedBy')} <strong>Nardoto</strong>`,
        '.sbd-counter-label': this.t('selected')
      };

      // Aplicar traduções por ID
      Object.values(translations).forEach(translateFn => {
        try {
          translateFn();
        } catch (error) {
          console.warn('Translation warning:', error);
        }
      });

      // Aplicar traduções por seletor
      Object.entries(selectorTranslations).forEach(([selector, text]) => {
        const element = document.querySelector(selector);
        if (element) {
          element.innerHTML = text;
        }
      });

  // Seletor de idioma removido

      console.log('✅ Interface translated');

    } catch (error) {
      console.error('❌ Translation error:', error);
    }
  }
  
  injectCSS() {
    if (document.getElementById('sbd-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sbd-styles';
    style.textContent = `
    body { 
      margin: 0 !important; 
    }
    /* Quando a barra superior estiver aberta, empurra o conteúdo para baixo */
    body.sbd-topbar-open {
      padding-top: 80px !important; /* altura da barra */
    }
    
    /* Topbar Retrátil - Não empurra página */
    #sbd-sidebar {
      position: fixed;
      top: -80px; /* Escondido inicialmente */
      left: 0;
      right: 0;
      width: 100%;
      height: 80px;
      background: rgba(20, 20, 24, 0.98);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 20px;
      z-index: 99999;
      transition: all 0.3s ease;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      white-space: nowrap;
    }

    #sbd-sidebar.open {
      top: 0; /* Quando aberto, aparece no topo */
    }

    /* Botão Toggle Centralizado */
    #sbd-toggle {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, rgba(217, 107, 0, 0.8), rgba(255, 140, 0, 0.8));
      border: none;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(217, 107, 0, 0.4);
    }

    #sbd-toggle:hover {
      background: linear-gradient(135deg, rgba(255, 140, 0, 0.9), rgba(255, 165, 0, 0.9));
      transform: translateX(-50%) scale(1.1);
      box-shadow: 0 6px 20px rgba(217, 107, 0, 0.6);
    }

    #sbd-toggle.sidebar-open {
      top: 100px; /* Desce junto com a barra da extensão quando aberta (80px da barra + 20px de margem) */
      transform: translateX(-50%) rotate(180deg);
    }

    #sbd-toggle.sidebar-open:hover {
      transform: translateX(-50%) rotate(180deg) scale(1.1);
    }

    /* Cabeçalho Compacto em Linha */
    .sbd-sidebar-header {
      flex: 0 0 auto;
      margin-right: 15px;
      padding-right: 15px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .sbd-sidebar-title {
      color: #d96b00;
      font-size: 14px;
      font-weight: 700;
      margin: 0;
      text-align: left;
      line-height: 1.2;
    }

    .sbd-sidebar-credits {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.6);
      margin: 2px 0 0 0;
      text-align: left;
      line-height: 1.1;
    }

    .sbd-sidebar-credits strong {
      color: rgba(255, 255, 255, 0.9);
    }

  /* Locale selector removed */

    /* Contador Compacto */
    #sbd-sidebar .sbd-counter {
      flex: 0 0 auto;
      margin-right: 15px;
      padding: 8px 12px;
      border-radius: 8px;
      justify-content: center;
      min-width: 120px;
    }

    /* Botões em Linha Única - Sem Sobreposição */
    #sbd-sidebar .sbd-btn {
      white-space: nowrap;
      justify-content: center;
      padding: 8px 12px;
      font-size: 12px;
      min-width: auto;
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    /* Responsividade */
    @media (max-width: 768px) {
      #sbd-sidebar {
        height: 300px;
        top: -300px;
        flex-direction: column;
        gap: 15px;
      }
      
      #sbd-toggle.sidebar-open {
        top: 320px;
      }
      

      .sbd-sidebar-header {
        flex: none;
        border-right: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        margin-right: 0;
        padding-right: 0;
        padding-bottom: 15px;
        margin-bottom: 15px;
      }

      .sbd-button-group {
        margin-right: 0;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 10px;
      }

      #sbd-sidebar .sbd-btn {
        min-width: 120px;
        flex: 1;
      }
    }

    @media (max-width: 480px) {
      #sbd-sidebar {
        height: 350px;
        top: -350px;
        padding: 15px;
      }
      
      #sbd-toggle.sidebar-open {
        top: 370px;
      }
      

      .sbd-button-group {
        flex-direction: column;
      }

      #sbd-sidebar .sbd-btn {
        min-width: 100%;
        font-size: 12px;
        padding: 8px 12px;
      }

      .sbd-sidebar-title {
        font-size: 14px;
      }
    }
    
    .sbd-counter {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: rgba(217, 107, 0, 0.1);
      border: 1px solid rgba(217, 107, 0, 0.3);
      border-radius: 12px;
      min-width: 140px;
    }
    
    .sbd-counter-number {
      font: 700 18px/1 system-ui;
      color: #d96b00;
    }
    
    .sbd-counter-label {
      font: 500 12px/1 system-ui;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .sbd-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #ff8c00, #ff6b9d);
      border: none;
      border-radius: 50px;
      color: white;
      font: 600 14px/1 system-ui;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(255, 140, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .sbd-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }
    
    .sbd-btn:hover::before {
      left: 100%;
    }
    
    .sbd-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #ffa500, #ff8fa3);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(255, 140, 0, 0.5);
    }
    
    .sbd-btn:active:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(255, 140, 0, 0.3);
    }
    
    .sbd-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: linear-gradient(135deg, #666, #888);
      box-shadow: none;
    }
    
    .sbd-btn-primary {
      background: linear-gradient(135deg, #ff8c00, #ff6b9d);
      box-shadow: 0 4px 15px rgba(255, 140, 0, 0.4);
    }
    
    .sbd-btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #ffa500, #ff8fa3);
      box-shadow: 0 8px 25px rgba(255, 140, 0, 0.6);
    }
    
    .sbd-btn-danger {
      background: linear-gradient(135deg, #ff6b6b, #ff8787);
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    }
    
    .sbd-btn-danger:hover:not(:disabled) {
      background: linear-gradient(135deg, #ff5252, #ff7979);
      box-shadow: 0 8px 25px rgba(255, 107, 107, 0.6);
    }
    
    
    .sbd-btn-secondary {
      background: linear-gradient(135deg, #74b9ff, #a29bfe);
      box-shadow: 0 4px 15px rgba(116, 185, 255, 0.4);
    }
    
    .sbd-btn-secondary:hover:not(:disabled) {
      background: linear-gradient(135deg, #54a3ff, #8c7ae6);
      box-shadow: 0 8px 25px rgba(116, 185, 255, 0.6);
    }
    
    .sbd-btn-donate {
      background: linear-gradient(135deg, #00d2d3, #00b894) !important;
      border: none !important;
      color: white !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 15px rgba(0, 210, 211, 0.4) !important;
    }
    
    .sbd-btn-donate:hover:not(:disabled) {
      background: linear-gradient(135deg, #00b2b3, #00a085) !important;
      box-shadow: 0 8px 25px rgba(0, 210, 211, 0.6) !important;
      transform: translateY(-3px) !important;
    }
    
    .sbd-btn-zip {
      background: linear-gradient(135deg, #2196f3, #03a9f4);
      border: none;
      color: white;
      font-weight: 600;
    }
    
    .sbd-btn-zip:hover:not(:disabled) {
      background: linear-gradient(135deg, #03a9f4, #00bcd4);
      box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
    }
    
    
    .sbd-checkbox-wrapper {
      position: relative;
      width: 40px;
      height: 40px;
      margin-right: 12px;
    }
    
    .sbd-checkbox {
      position: absolute;
      opacity: 0;
      cursor: pointer;
    }
    
    .sbd-checkbox-visual {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 20px; height: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .sbd-checkbox:hover ~ .sbd-checkbox-visual {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(217, 107, 0, 0.5);
      transform: translate(-50%, -50%) scale(1.1);
    }
    
    .sbd-checkbox:checked ~ .sbd-checkbox-visual {
      background: linear-gradient(135deg, #d96b00, #ff8c00);
      border-color: #d96b00;
    }
    
    .sbd-checkbox-visual::after {
      content: '✓';
      color: white;
      font-size: 14px;
      opacity: 0;
      transform: scale(0);
      transition: all 0.2s ease;
    }
    
    .sbd-checkbox:checked ~ .sbd-checkbox-visual::after {
      opacity: 1;
      transform: scale(1);
    }
    
    /* Botões de Download nos Cards */
    .sbd-card-buttons {
      display: flex;
      gap: 4px;
      margin-left: auto;
      align-items: center;
    }
    
    .sbd-card-btn {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      background: #2a2a2a;
      color: white;
      opacity: 0.8;
    }
    
    .sbd-card-btn:hover {
      opacity: 1;
      background: #333333;
      transform: translateY(-1px);
    }
    
    .sbd-card-btn:active {
      transform: translateY(0);
      background: #1a1a1a;
    }
    
    .sbd-card-btn svg {
      width: 10px;
      height: 10px;
    }
    
    /* Barra de Progresso */
    .sbd-progress-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100001;
      backdrop-filter: blur(10px);
    }
    
    .sbd-progress-card {
      background: rgba(32, 32, 36, 0.98);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(217, 107, 0, 0.3);
      border-radius: 20px;
      padding: 30px;
      min-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    
    .sbd-progress-title {
      font: 700 18px/1.2 system-ui;
      color: #d96b00;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .sbd-progress-bar {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      height: 8px;
      overflow: hidden;
      margin-bottom: 15px;
    }
    
    .sbd-progress-fill {
      background: linear-gradient(135deg, #d96b00, #ff8c00);
      height: 100%;
      border-radius: 12px;
      transition: width 0.3s ease;
      box-shadow: 0 0 12px rgba(217, 107, 0, 0.4);
    }
    
    .sbd-progress-text {
      font: 500 14px/1.4 system-ui;
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
      margin-bottom: 10px;
    }
    
    .sbd-progress-current {
      font: 400 12px/1.4 system-ui;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      margin-bottom: 20px;
    }
    
    .sbd-progress-cancel {
      background: linear-gradient(135deg, #ff4757, #ff3742);
      border: none;
      border-radius: 12px;
      padding: 12px 20px;
      color: white;
      font: 500 14px/1 system-ui;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
    }
    
    .sbd-progress-cancel:hover {
      background: linear-gradient(135deg, #ff3742, #ff2f3a);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
    }
    
    /* Version pill styling */
    .sbd-version-pill {
      color: #d01670 !important;
      border: 1px solid #d01670 !important;
      background: transparent !important;
      padding: 2px 6px !important;
      border-radius: 999px !important;
      display: inline-block !important;
      margin-left: 6px !important;
      font-weight: 800 !important;
      font-size: 12px !important;
    }
    `;
    
    document.head.appendChild(style);
  }
  
  setupEventListeners() {
    document.getElementById('sbd-select-all')?.addEventListener('click', () => this.selectAll(true));
    document.getElementById('sbd-auto-scroll')?.addEventListener('click', () => this.autoScrollAndSelectAll());
    document.getElementById('sbd-clear-page')?.addEventListener('click', () => this.selectAll(false));
    document.getElementById('sbd-clear-all')?.addEventListener('click', () => this.clearAll());
    document.getElementById('sbd-download')?.addEventListener('click', () => this.startDownload());
    document.getElementById('sbd-refresh')?.addEventListener('click', () => this.forceRefresh());
    document.getElementById('sbd-donate')?.addEventListener('click', () => this.showDonate());
    // Botão de ajuda agora é gerenciado pelo help-modal.js
    document.getElementById('sbd-toggle')?.addEventListener('click', () => this.toggleSidebar());

    // Mostrar/ocultar botão Auto-Scroll baseado na página
    this.toggleAutoScrollButton();
  }

  // Verificar se está na página /create
  isOnCreatePage() {
    return window.location.pathname.includes('/create');
  }

  // Mostrar/ocultar botão Auto-Scroll
  toggleAutoScrollButton() {
    const autoScrollBtn = document.getElementById('sbd-auto-scroll');
    if (!autoScrollBtn) return;

    if (this.isOnCreatePage()) {
      autoScrollBtn.style.display = 'flex';
    } else {
      autoScrollBtn.style.display = 'none';
    }
  }
  
  // Toggle do Topbar
  toggleSidebar() {
    const sidebar = document.getElementById('sbd-sidebar');
    const toggleBtn = document.getElementById('sbd-toggle');

    if (!sidebar || !toggleBtn) return;

    const isOpen = sidebar.classList.contains('open');

    if (isOpen) {
      // Fechar topbar
      sidebar.classList.remove('open');
      toggleBtn.classList.remove('sidebar-open');
  document.body.classList.remove('sbd-topbar-open');
      
      // Salvar estado
      sessionStorage.setItem('sbd-sidebar-open', 'false');
      
      console.log('🔼 Topbar fechado');
    } else {
      // Abrir topbar
      sidebar.classList.add('open');
      toggleBtn.classList.add('sidebar-open');
  document.body.classList.add('sbd-topbar-open');
      
      // Salvar estado
      sessionStorage.setItem('sbd-sidebar-open', 'true');
      
      console.log('🔽 Topbar aberto');
    }
  }

  // Restaurar estado do topbar
  restoreSidebarState() {
    const wasOpen = sessionStorage.getItem('sbd-sidebar-open') === 'true';
    
    if (wasOpen) {
      // Timeout para garantir que o DOM está pronto
      setTimeout(() => {
        const sidebar = document.getElementById('sbd-sidebar');
        const toggleBtn = document.getElementById('sbd-toggle');

        if (sidebar && toggleBtn) {
          sidebar.classList.add('open');
          toggleBtn.classList.add('sidebar-open');
          document.body.classList.add('sbd-topbar-open');
          console.log('🔄 Estado do topbar restaurado: aberto');
        }
      }, 100);
    }
  }

  // Forçar atualização das caixas (para resolver problemas da página 2)
  forceRefresh() {
    console.log('🔄 Force refreshing checkboxes...');
    
    // Remover todas as checkboxes e botões de download existentes
    document.querySelectorAll('.sbd-checkbox-wrapper').forEach(wrapper => wrapper.remove());
    document.querySelectorAll('.sbd-card-buttons').forEach(buttons => buttons.remove());
    
    // Processar novamente com delay maior
    setTimeout(() => this.processExistingSongs(), 100);
    setTimeout(() => this.processExistingSongs(), 500);
    setTimeout(() => this.processExistingSongs(), 1000);
    
  this.showToast('🔄 Refreshing checkboxes...');
  }
  
  setupObservers() {
    // Observer para detectar novas músicas (paginação SPA)
    const observer = new MutationObserver(this.debounce((mutations) => {
      const hasNewSongs = mutations.some(mutation => 
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === 1 && (
            node.getAttribute?.('role') === 'row' ||
            node.querySelector?.('[role="row"]') ||
            node.querySelector?.('a[href*="/song/"]')
          )
        )
      );
      
      // Também detectar remoção de nós (mudança de página)
      const hasRemovedSongs = mutations.some(mutation => 
        Array.from(mutation.removedNodes).some(node => 
          node.nodeType === 1 && node.querySelector?.('[role="row"]')
        )
      );
      
      if (hasNewSongs || hasRemovedSongs) {
        console.log('🎵 Songs changed - processing...');
        
        // Timing especial para página 2 (que tem problemas)
        const isPage2 = window.location.href.includes('page=2') || 
                       document.querySelector('[data-page="2"]') ||
                       document.querySelector('[aria-current="page"][data-value="2"]');
        
        if (isPage2) {
          console.log('📖 Page 2 detected - using extended timing');
          setTimeout(() => this.processExistingSongs(), 200);
          setTimeout(() => this.processExistingSongs(), 500);
          setTimeout(() => this.processExistingSongs(), 1000);
          setTimeout(() => this.processExistingSongs(), 2000);
          setTimeout(() => this.processExistingSongs(), 3000);
        } else {
          // Timing normal para outras páginas
          setTimeout(() => this.processExistingSongs(), 100);
          setTimeout(() => this.processExistingSongs(), 300);
          setTimeout(() => this.processExistingSongs(), 800);
          setTimeout(() => this.processExistingSongs(), 1500);
        }
      }
    }, 100));
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.observers.push(observer);
    
    // Observer para mudanças de URL (navegação SPA)
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('🔄 URL changed - reprocessing songs');
        
        // Delay maior para mudanças de URL
        setTimeout(() => this.processExistingSongs(), 200);
        setTimeout(() => this.processExistingSongs(), 600);
        setTimeout(() => this.processExistingSongs(), 1200);
      }
    });
    
    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.observers.push(urlObserver);
    
    // Listener para mudanças de história do navegador
    window.addEventListener('popstate', () => {
      console.log('🔄 History changed - reprocessing songs');
      setTimeout(() => this.processExistingSongs(), 300);
    });
    
    console.log('👀 Observers setup');
  }
  
  async processExistingSongs() {
    // Detectar se estamos na página /create
    const isCreatePage = location.pathname === '/create';

    if (isCreatePage) {
      console.log('📄 Página /create detectada - usando processamento específico');
      return this.processCreatePageSongs();
    }

    // Lógica original para outras páginas
    console.log('📄 Página padrão - usando processamento normal');

    // Debug: verificar quantos elementos encontramos
    const allRowsWithClipId = document.querySelectorAll('[data-clip-id]');
    const allRowsWithButton = document.querySelectorAll('[role="button"]');
    const allRowsWithPressable = document.querySelectorAll('[data-react-aria-pressable="true"]');
    const allMultiSelectButtons = document.querySelectorAll('.multi-select-button');

    console.log(`🔍 Debug: Encontrados ${allRowsWithClipId.length} elementos com data-clip-id`);
    console.log(`🔍 Debug: Encontrados ${allRowsWithButton.length} elementos com role="button"`);
    console.log(`🔍 Debug: Encontrados ${allRowsWithPressable.length} elementos com data-react-aria-pressable`);
    console.log(`🔍 Debug: Encontrados ${allMultiSelectButtons.length} elementos .multi-select-button`);

    // Usar seletores robustos para detectar rows de música
    let rows = document.querySelectorAll('[data-clip-id][role="button"][data-react-aria-pressable="true"]');

    // Se não encontrar com o seletor padrão, tentar alternativas
    if (rows.length === 0) {
      // Tentar apenas com data-clip-id
      rows = document.querySelectorAll('[data-clip-id]');
      console.log(`🔍 Fallback: Usando seletor [data-clip-id], encontrados ${rows.length} elementos`);

      // Se ainda não encontrar, procurar por elementos que tenham .multi-select-button
      if (rows.length === 0) {
        const elementsWithCheckbox = document.querySelectorAll('.multi-select-button');
        rows = Array.from(elementsWithCheckbox).map(cb => cb.closest('[data-clip-id]')).filter(Boolean);
        console.log(`🔍 Fallback 2: Procurando por .multi-select-button parents, encontrados ${rows.length} elementos`);
      }
    }

    let processed = 0;
    const songsToProcess = [];

    for (const row of rows) {
      // IMPORTANTE: Pular se já processado (WeakSet)
      if (this.processedRows.has(row)) continue;

      // IMPORTANTE: Verificar se já tem checkbox nativo do Suno ou da extensão
      const hasNativeCheckbox = row.querySelector('.multi-select-button');
      const hasExtensionCheckbox = row.querySelector('.sbd-checkbox-wrapper') || row.querySelector('.sbd-card-buttons[data-song-id]');

      // Se tem checkbox nativo, usar ele; se já tem da extensão, pular
      if (hasExtensionCheckbox) continue;

      // Obter ID do data-clip-id (mais confiável)
      const id = row.getAttribute('data-clip-id');
      if (!id) continue;

      // Buscar link da música para obter título
      const songLink = row.querySelector('a[href*="/song/"]');

      songsToProcess.push({ row, songLink, id, hasNativeCheckbox });

      console.log(`🎵 Encontrada música para processar: ID=${id}, hasNative=${!!hasNativeCheckbox}, hasLink=${!!songLink}`);
    }

    // Processar cada música
    for (const { row, songLink, id, hasNativeCheckbox } of songsToProcess) {
      try {
        // Fallback direto para evitar API lenta
        let title = 'unknown-song';
        const titleText = songLink.textContent.trim();
        if (titleText) {
          title = titleText.replace(/\s*v\d+\.\d+\+?\s*$/i, '').trim();
        }
        const metadata = { title, artist: 'Unknown', filename: this.createFilename(title, 'Unknown') };

        // Se há checkbox nativo, interceptar eventos dele
        if (hasNativeCheckbox) {
          this.setupNativeCheckboxListener(row, id, metadata, hasNativeCheckbox);
        } else {
          // Criar checkbox da extensão como fallback
          this.createExtensionCheckbox(row, id, metadata);
        }

        this.processedRows.add(row);
        processed++;

      } catch (error) {
        console.error('Error processing song:', error);
      }
    }

    if (processed > 0) {
      console.log(`🎵 Processed ${processed} songs`);
      this.updateInterface();
    }
  }

  setupNativeCheckboxListener(row, id, metadata, nativeCheckbox) {
    // Interceptar cliques no checkbox nativo
    const button = nativeCheckbox.querySelector('button');
    if (!button) return;

    // Detectar estado inicial baseado no SVG
    const isInitiallyChecked = this.isNativeCheckboxChecked(nativeCheckbox);
    if (isInitiallyChecked) {
      this.selections.set(id, metadata);
    }

    // Interceptar cliques
    button.addEventListener('click', (e) => {
      // Pequeno delay para o estado atualizar
      setTimeout(() => {
        const isChecked = this.isNativeCheckboxChecked(nativeCheckbox);

        if (isChecked) {
          this.selections.set(id, metadata);
          console.log(`✅ Native checkbox selected: ${metadata.title}`);
        } else {
          this.selections.delete(id);
          console.log(`❌ Native checkbox deselected: ${metadata.title}`);
        }

        this.updateInterface();
        this.saveSelections();
      }, 50);
    });

    // Adicionar botões de download apenas
    this.createDownloadButtons(row, id, metadata);
  }

  isNativeCheckboxChecked(nativeCheckbox) {
    // Método 1: Verificar se tem o SVG do checked (com checkmark)
    const checkedSvg = nativeCheckbox.querySelector('svg path[d*="10.444"]'); // Parte do path do checkmark
    if (checkedSvg) return true;

    // Método 2: Verificar path alternativo baseado no seu exemplo
    const altCheckedSvg = nativeCheckbox.querySelector('svg path[d*="13.556"]');
    if (altCheckedSvg) return true;

    // Método 3: Verificar por classe ou atributo do botão
    const button = nativeCheckbox.querySelector('button');
    if (button && (button.getAttribute('aria-pressed') === 'true' || button.classList.contains('selected'))) {
      return true;
    }

    // Método 4: Verificar por outros indicadores visuais
    const hasCheckmark = nativeCheckbox.querySelector('svg path[d*="m10.444"], svg path[d*="L17.5"]');
    if (hasCheckmark) return true;

    // Debug: logar o HTML do checkbox para entender melhor
    console.log('🔍 Debug checkbox state:', nativeCheckbox.innerHTML);

    return false;
  }

  createExtensionCheckbox(row, id, metadata) {
    // Criar checkbox da extensão como antes
    const wrapper = document.createElement('div');
    wrapper.className = 'sbd-checkbox-wrapper';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'sbd-checkbox';
    checkbox.dataset.id = id;
        
    if (this.selections.has(id)) {
      checkbox.checked = true;
    }

    checkbox.addEventListener('change', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.target.checked) {
        this.selections.set(id, {
          id,
          title: metadata.title,
          artist: metadata.artist,
          filename: metadata.filename,
          timestamp: Date.now()
        });
        this.showToast(`"${metadata.title}" adicionado`);
      } else {
        this.selections.delete(id);
        this.showToast(`"${metadata.title}" removido`);
      }

      this.updateInterface();
      this.saveSelections();
    });

    // Adicionar click no wrapper também
    wrapper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    });

    const visual = document.createElement('div');
    visual.className = 'sbd-checkbox-visual';

    wrapper.appendChild(checkbox);
    wrapper.appendChild(visual);

    row.prepend(wrapper);

    // Adicionar botões de download
    this.createDownloadButtons(row, id, metadata);
  }

  createDownloadButtons(row, id, metadata) {
    // Criar botões de download para o card
    const downloadButtons = this.createCardDownloadButtons(id, metadata);

    // 1) Tentar inserir na barra nativa de botões do Suno (preferido)
    let buttonHost = row.querySelector('.sbd-card-buttons[data-song-id]');

    // 2) Fallback: usar wrapper horizontal da linha
    if (!buttonHost) {
      buttonHost = row.querySelector('div.relative.flex.w-full.items-center');
    }

    // 3) Fallback final: inserir no final da row
    if (!buttonHost) {
      buttonHost = row;
    }

    // Definir song-id nos botões para identificação
    downloadButtons.setAttribute('data-song-id', id);
    buttonHost.appendChild(downloadButtons);
  }

  // Função específica para processar músicas na página /create
  async processCreatePageSongs() {
    console.log('🎵 Processando músicas na página /create...');

    // Procurar por LINHAS DE MÚSICA (clip-row) ao invés de checkboxes
    const songRows = document.querySelectorAll('[data-testid="clip-row"]');
    console.log(`🔍 Encontradas ${songRows.length} músicas (clip-row) na página /create`);

    let processed = 0;

    for (const songElement of songRows) {
      // Encontrar o link da música para extrair o ID
      const songLink = songElement.querySelector('a[href*="/song/"]');
      if (!songLink) {
        console.log('⚠️ Música sem link válido');
        continue;
      }

      // Extrair ID do href (ex: /song/405c10a8-4c7a-4e60-9c7b-43c8904505ca)
      const href = songLink.getAttribute('href');
      const idMatch = href.match(/\/song\/([a-f0-9-]+)/);
      if (!idMatch) {
        console.log('⚠️ Não foi possível extrair ID do href:', href);
        continue;
      }

      const id = idMatch[1];

      // Verificar se já processamos este elemento
      if (this.processedRows.has(songElement)) {
        continue;
      }

      // Buscar título da música
      let title = 'unknown-song';
      const titleText = songLink.textContent.trim();
      if (titleText) {
        // Remove tags de versão (v5, v4.5+, etc)
        title = titleText.replace(/\s*v\d+(\.\d+)?\+?\s*$/i, '').trim();
      }

      const metadata = {
        id,
        title,
        artist: 'Unknown',
        filename: this.createFilename(title, 'Unknown'),
        timestamp: Date.now()
      };

      console.log(`🎵 Processando música /create: ${title} (${id})`);

      // Procurar checkbox nativo dentro desta linha
      const nativeCheckbox = songElement.querySelector('.multi-select-button');
      if (nativeCheckbox) {
        // Configurar interceptação do checkbox nativo
        this.setupNativeCheckboxInterception(nativeCheckbox, songElement, id, metadata);
      } else {
        console.log('⚠️ Checkbox não encontrado para:', title);
      }

      // Adicionar botões de download
      this.addDownloadButtonsToCreatePage(songElement, id, metadata);

      // Marcar como processado
      this.processedRows.add(songElement);
      processed++;
    }

    if (processed > 0) {
      console.log(`✅ Processadas ${processed} músicas na página /create`);
      this.updateInterface();
    }
  }

  // Configurar interceptação do checkbox nativo específico para /create
  setupNativeCheckboxInterception(nativeCheckbox, songElement, id, metadata) {
    const button = nativeCheckbox.querySelector('button');
    if (!button) {
      console.log('⚠️ Checkbox sem botão');
      return;
    }

    // Verificar estado inicial
    const isInitiallyChecked = this.isNativeCheckboxChecked(nativeCheckbox);
    if (isInitiallyChecked) {
      this.selections.set(id, metadata);
      console.log(`✅ Checkbox já selecionado: ${metadata.title}`);
    }

    // Interceptar cliques no checkbox
    const clickHandler = (e) => {
      // Pequeno delay para o DOM atualizar
      setTimeout(() => {
        const isChecked = this.isNativeCheckboxChecked(nativeCheckbox);

        if (isChecked) {
          this.selections.set(id, metadata);
          console.log(`✅ Selecionado: ${metadata.title}`);
          this.showToast(`✅ ${metadata.title}`);
        } else {
          this.selections.delete(id);
          console.log(`❌ Removido: ${metadata.title}`);
          this.showToast(`❌ ${metadata.title}`);
        }

        this.updateInterface();
        this.saveSelections();
      }, 100);
    };

    // Adicionar listener
    button.addEventListener('click', clickHandler);

    // Guardar referência para remoção posterior se necessário
    button._sbdClickHandler = clickHandler;
  }

  // Adicionar botões de download específicos para a página /create
  addDownloadButtonsToCreatePage(songElement, id, metadata) {
    // Verificar se já tem botões
    if (songElement.querySelector('.sbd-card-buttons[data-song-id]')) {
      return;
    }

    // Criar botões de download
    const downloadButtons = this.createCardDownloadButtons(id, metadata);
    downloadButtons.setAttribute('data-song-id', id);

    // Procurar um local adequado para inserir os botões
    let insertLocation = songElement.querySelector('.multi-select-button')?.parentElement;

    if (!insertLocation) {
      // Fallback: procurar por um container de ações
      insertLocation = songElement.querySelector('[class*="action"], [class*="button"]')?.parentElement;
    }

    if (!insertLocation) {
      // Fallback final: inserir no final do elemento
      insertLocation = songElement;
    }

    insertLocation.appendChild(downloadButtons);
  }

  // Função selectAll específica para página /create
  async selectAllCreatePage(select) {
    console.log(`🎯 Select All na página /create: ${select ? 'Selecionando' : 'Desmarcando'} todas as músicas`);

    // Se for para desmarcar, apenas processar músicas visíveis
    if (!select) {
      await this.processCreatePageSongs();
      const songRows = document.querySelectorAll('[data-testid="clip-row"]');
      let changed = 0;

      songRows.forEach(songElement => {
        const songLink = songElement.querySelector('a[href*="/song/"]');
        if (!songLink) return;

        const href = songLink.getAttribute('href');
        const idMatch = href.match(/\/song\/([a-f0-9-]+)/);
        if (!idMatch) return;

        const nativeCheckbox = songElement.querySelector('.multi-select-button');
        if (!nativeCheckbox) return;

        const isCurrentlyChecked = this.isNativeCheckboxChecked(nativeCheckbox);

        if (isCurrentlyChecked !== select) {
          const button = nativeCheckbox.querySelector('button');
          if (button) {
            button.click();
            changed++;
          }
        }
      });

      this.selections.clear();
      console.log(`✅ Desmarcados ${changed} checkboxes na página /create`);
      this.showToast(`Desmarcadas ${changed} músicas`);

      setTimeout(() => {
        this.updateInterface();
        this.saveSelections();
      }, 200);
      return;
    }

    // Se for para SELECIONAR, fazer auto-scroll até o final
    console.log('🚀 Iniciando auto-scroll para selecionar todas as músicas...');

    // Scroll até o topo primeiro para garantir que começamos do início
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Encontrar container de scroll
    const scrollContainer = this.findScrollContainer();
    if (!scrollContainer) {
      this.showToast('❌ Container de scroll não encontrado');
      return;
    }

    let totalSelected = 0;
    let previousRowCount = 0;
    let noNewRowsCount = 0;
    const maxAttempts = 5; // Aumentado para 5 tentativas
    let processedIds = new Set(); // Rastrear IDs já processados

    // Mostrar progresso
    this.showAutoScrollProgress(0);

    while (noNewRowsCount < maxAttempts) {
      // Aguardar um pouco antes de processar (dar tempo para o DOM estabilizar)
      await new Promise(resolve => setTimeout(resolve, 600));

      // Processar músicas visíveis atualmente
      await this.processCreatePageSongs();

      const songRows = document.querySelectorAll('[data-testid="clip-row"]');
      const currentRowCount = songRows.length;

      console.log(`📊 Total de ${currentRowCount} músicas no DOM (${currentRowCount - previousRowCount} novas desde última verificação)`);

      // Selecionar APENAS músicas que ainda não foram processadas
      let changed = 0;
      songRows.forEach(songElement => {
        const songLink = songElement.querySelector('a[href*="/song/"]');
        if (!songLink) return;

        const href = songLink.getAttribute('href');
        const idMatch = href.match(/\/song\/([a-f0-9-]+)/);
        if (!idMatch) return;

        const id = idMatch[1];

        // Pular se já processamos este ID
        if (processedIds.has(id)) return;
        processedIds.add(id);

        const nativeCheckbox = songElement.querySelector('.multi-select-button');
        if (!nativeCheckbox) return;

        const isCurrentlyChecked = this.isNativeCheckboxChecked(nativeCheckbox);

        if (!isCurrentlyChecked) {
          const button = nativeCheckbox.querySelector('button');
          if (button) {
            button.click();
            changed++;
            console.log(`✅ Selecionada música ${id}`);
          }
        }
      });

      totalSelected += changed;
      this.updateAutoScrollProgress(totalSelected, currentRowCount);
      console.log(`✅ Selecionadas ${changed} músicas novas (total: ${totalSelected})`);

      // Verificar se encontramos o elemento final "X songs"
      const endMarker = Array.from(document.querySelectorAll('div')).find(div => {
        const text = div.textContent?.trim();
        return text && /^\d+\s+songs?$/i.test(text);
      });

      if (endMarker) {
        const totalSongsMatch = endMarker.textContent.match(/(\d+)/);
        const totalSongs = totalSongsMatch ? parseInt(totalSongsMatch[1]) : 0;
        console.log(`🎯 Encontrado marcador de fim: ${endMarker.textContent}`);

        // Verificar se já processamos todas
        if (processedIds.size >= totalSongs) {
          console.log(`✅ Todas as ${totalSongs} músicas foram processadas!`);
          break;
        } else {
          console.log(`⚠️ Processadas ${processedIds.size}/${totalSongs} músicas, continuando...`);
        }
      }

      // Verificar se há novas linhas carregadas
      if (currentRowCount === previousRowCount) {
        noNewRowsCount++;
        console.log(`⚠️ Nenhuma nova música carregada (tentativa ${noNewRowsCount}/${maxAttempts})`);
      } else {
        noNewRowsCount = 0; // Reset contador se encontramos novas músicas
      }

      previousRowCount = currentRowCount;

      // Scroll GRADUAL para baixo - mais lento para dar tempo de carregar
      const lastRow = songRows[songRows.length - 1];
      if (lastRow) {
        // Scroll suave até o final
        lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log(`📜 Scrolling até a última música visível...`);
      } else {
        // Fallback: scroll no container
        scrollContainer.scrollBy({ top: 400, behavior: 'smooth' });
      }

      // TEMPO DE ESPERA MAIOR - dar mais tempo para carregar
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log(`✅ Auto-scroll concluído! Total de músicas selecionadas: ${totalSelected}`);
    console.log(`📊 IDs únicos processados: ${processedIds.size}`);
    this.hideAutoScrollProgress();
    this.showToast(`✅ Selecionadas ${totalSelected} músicas de ${processedIds.size} encontradas`);

    setTimeout(() => {
      this.updateInterface();
      this.saveSelections();
    }, 200);
  }

  // AUTO-SCROLL & SELECT ALL para página /create
  async autoScrollAndSelectAll() {
    if (!this.isOnCreatePage()) {
      this.showToast('❌ Esta função só funciona na página /create');
      return;
    }

    // Impedir múltiplas execuções simultâneas
    if (this.isAutoScrolling) {
      console.log('⚠️ Auto-scroll já está em execução');
      return;
    }

    this.isAutoScrolling = true;
    console.log('🚀 Iniciando auto-scroll na página /create...');

    // Encontrar o container com scroll
    const scrollContainer = this.findScrollContainer();
    if (!scrollContainer) {
      this.showToast('❌ Container de scroll não encontrado');
      this.isAutoScrolling = false;
      return;
    }

    // Contador para interface
    let totalProcessed = 0;
    let lastSongCount = 0;
    let noNewSongsCount = 0;

    // Modal de progresso
    this.showAutoScrollProgress(0, 0);

    try {
      while (this.isAutoScrolling) {
        // Processar músicas visíveis
        await this.processCreatePageSongs();

        // Selecionar músicas visíveis
        const songRows = document.querySelectorAll('[data-testid="clip-row"]');
        let selectedNow = 0;

        for (const songElement of songRows) {
          if (!this.isAutoScrolling) break;

          const songLink = songElement.querySelector('a[href*="/song/"]');
          if (!songLink) continue;

          const href = songLink.getAttribute('href');
          const idMatch = href.match(/\/song\/([a-f0-9-]+)/);
          if (!idMatch) continue;

          const nativeCheckbox = songElement.querySelector('.multi-select-button');
          if (!nativeCheckbox) continue;

          const isChecked = this.isNativeCheckboxChecked(nativeCheckbox);

          if (!isChecked) {
            const button = nativeCheckbox.querySelector('button');
            if (button) {
              button.click();
              selectedNow++;
              await new Promise(resolve => setTimeout(resolve, 50)); // Pequeno delay entre cliques
            }
          }
        }

        totalProcessed += selectedNow;
        console.log(`📊 Processadas ${songRows.length} músicas, selecionadas ${selectedNow} novas`);

        // Atualizar progresso
        this.updateAutoScrollProgress(totalProcessed, this.selections.size);

        // Verificar se não há novas músicas (chegamos ao fim)
        if (songRows.length === lastSongCount) {
          noNewSongsCount++;
          if (noNewSongsCount >= 3) {
            console.log('✅ Fim da lista alcançado!');
            break;
          }
        } else {
          noNewSongsCount = 0;
          lastSongCount = songRows.length;
        }

        // Scroll para baixo
        const currentScroll = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;

        // Verificar se chegou ao fim
        if (currentScroll + clientHeight >= scrollHeight - 100) {
          console.log('📜 Chegou ao fim do scroll');
          noNewSongsCount++;
          if (noNewSongsCount >= 3) {
            break;
          }
        }

        // Fazer scroll suave
        scrollContainer.scrollBy({
          top: 500,
          behavior: 'smooth'
        });

        // Aguardar carregamento de novas músicas
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Finalizar
      this.isAutoScrolling = false;
      this.hideAutoScrollProgress();
      this.showToast(`✅ Auto-scroll concluído! ${this.selections.size} músicas selecionadas`);
      console.log(`✅ Auto-scroll finalizado: ${this.selections.size} músicas selecionadas`);

    } catch (error) {
      console.error('❌ Erro no auto-scroll:', error);
      this.isAutoScrolling = false;
      this.hideAutoScrollProgress();
      this.showToast('❌ Erro no auto-scroll');
    }
  }

  // Parar auto-scroll
  stopAutoScroll() {
    if (this.isAutoScrolling) {
      console.log('🛑 Parando auto-scroll...');
      this.isAutoScrolling = false;
      this.hideAutoScrollProgress();
      this.showToast(`🛑 Auto-scroll interrompido. ${this.selections.size} músicas selecionadas`);
    }
  }

  // Encontrar container de scroll
  findScrollContainer() {
    // Procura por div com role="rowgroup" ou container de scroll
    const containers = [
      document.querySelector('[role="rowgroup"]'),
      document.querySelector('div[style*="overflow"]'),
      ...Array.from(document.querySelectorAll('div')).filter(el => {
        const style = window.getComputedStyle(el);
        return (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
                style.overflow === 'auto' || style.overflow === 'scroll') &&
               el.querySelector('[data-testid="clip-row"]');
      })
    ];

    return containers.find(el => el && el.querySelector('[data-testid="clip-row"]'));
  }

  // Mostrar modal de progresso
  showAutoScrollProgress(processed, selected) {
    // Remover modal existente se houver
    const existing = document.getElementById('sbd-autoscroll-progress');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'sbd-autoscroll-progress';
    modal.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                  background: rgba(20, 20, 24, 0.98); padding: 30px; border-radius: 20px;
                  border: 2px solid #d96b00; z-index: 999999; min-width: 400px;
                  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); text-align: center;">
        <h2 style="color: #d96b00; margin: 0 0 20px; font-size: 24px;">
          🚀 Auto-Scroll Ativo
        </h2>
        <div style="color: #fff; font-size: 16px; margin-bottom: 10px;">
          <div id="sbd-progress-processed">Processadas: <strong>0</strong></div>
          <div id="sbd-progress-selected">Selecionadas: <strong>0</strong></div>
        </div>
        <div style="margin: 20px 0;">
          <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden;">
            <div id="sbd-progress-bar" style="background: linear-gradient(90deg, #d96b00, #ff8c00);
                                             height: 100%; width: 0%; transition: width 0.3s ease;"></div>
          </div>
        </div>
        <button id="sbd-stop-autoscroll" style="background: linear-gradient(135deg, #ff4757, #ff3742);
                                                 color: white; border: none; padding: 12px 30px;
                                                 border-radius: 25px; font-size: 16px; font-weight: 600;
                                                 cursor: pointer; transition: all 0.2s;">
          🛑 Parar
        </button>
        <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 15px;">
          Rolando automaticamente e selecionando músicas...
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listener para botão parar
    document.getElementById('sbd-stop-autoscroll').addEventListener('click', () => {
      this.stopAutoScroll();
    });
  }

  // Atualizar progresso
  updateAutoScrollProgress(processed, selected) {
    const processedEl = document.getElementById('sbd-progress-processed');
    const selectedEl = document.getElementById('sbd-progress-selected');

    if (processedEl) processedEl.innerHTML = `Processadas: <strong>${processed}</strong>`;
    if (selectedEl) selectedEl.innerHTML = `Selecionadas: <strong>${selected}</strong>`;
  }

  // Esconder modal de progresso
  hideAutoScrollProgress() {
    const modal = document.getElementById('sbd-autoscroll-progress');
    if (modal) modal.remove();
  }

  // Criar botões de download para cards das músicas
  createCardDownloadButtons(songId, metadata) {
    const container = document.createElement('div');
    container.className = 'sbd-card-buttons';
    container.dataset.songId = songId;
    
    // Botão LYRIC (voltando como era antes)
    const srtButton = document.createElement('button');
    srtButton.className = 'sbd-card-btn sbd-card-btn-srt';
    srtButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 2px;">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
      LYRIC
    `;
    srtButton.title = this.t('downloadSrt');
    
    // Botão MP3 (mantendo tamanho original, só adicionando símbolo)
    const mp3Button = document.createElement('button');
    mp3Button.className = 'sbd-card-btn sbd-card-btn-mp3';
    mp3Button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
      MP3
    `;
    mp3Button.title = this.t('downloadMusic');
    
    // Event listeners
    srtButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Disparar evento para configurar nome do arquivo
      window.dispatchEvent(new CustomEvent('pmu-download', { 
        detail: { songId, explicitExt: 'srt' }
      }));
      
      await this.downloadSRTFromCard(songId, metadata);
    });
    
    mp3Button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Disparar evento para configurar nome do arquivo
      window.dispatchEvent(new CustomEvent('pmu-download', { 
        detail: { songId, explicitExt: 'mp3' }
      }));
      
      await this.downloadMusicFromCard(songId, metadata);
    });
    
    // Adicionar ambos os botões (SRT + MP3) como era antes
    container.appendChild(srtButton);
    container.appendChild(mp3Button);
    
    return container;
  }

  // Download SRT direto do card (voltando como era)
  async downloadSRTFromCard(songId, metadata) {
    try {
      console.log(`🎵 Downloading SRT for: ${metadata.title}`);
      this.showToast(this.t('extractingLyrics'));
      
      // Usar a mesma lógica do downloadSRTFromAligned
      await this.downloadSRTFromAligned(songId, metadata?.title);
      
    } catch (error) {
      console.error('Error downloading SRT from card:', error);
      this.showToast(`${this.t('downloadError')} ${error.message}`);
    }
  }

  // Download MP3 direto do card  
  async downloadMusicFromCard(songId, metadata) {
    try {
      console.log(`🎵 Downloading music for: ${metadata.title}`);
      this.showToast(this.t('preparingDownload'));
      
      // Usar a mesma lógica do downloadMusicFromId
  await this.downloadMusicFromId(songId, metadata?.title);
      
    } catch (error) {
      console.error('Error downloading music from card:', error);
      this.showToast(`${this.t('downloadError')} ${error.message}`);
    }
  }

  // ===== FUNÇÕES ESPECÍFICAS DO PLAYER BAR (independentes) =====
  
  // Download MP3 específico do player bar
  async downloadMusicFromPlayerBar(songId) {
    try {
      console.log(`🎵 [PLAYER BAR] Iniciando download MP3 para: ${songId}`);
      
      // Extrair título específico do player
      const title = this.extractTitleFromPlayerBar(songId);
      console.log(`🎵 [PLAYER BAR] Título extraído: "${title}"`);
      
      // Baixar usando a URL correta
      const url = `https://cdn1.suno.ai/${songId}.mp3`;
      const filename = this.sanitizeTitleForFile(title) + '.mp3';
      
      console.log(`🎵 [PLAYER BAR] Iniciando download: ${filename} de ${url}`);
      
      const element = document.createElement('a');
      element.href = url;
      element.download = filename;
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      console.log(`✅ [PLAYER BAR] Download enviado: ${filename}`);
  this.showToast(`${this.t('downloadStarted')} ${title}`);
      
    } catch (error) {
      console.error('🚫 [PLAYER BAR] Erro no download MP3:', error);
  this.showToast(`${this.t('downloadError')} ${error.message}`);
    }
  }

  // Download SRT específico do player bar
  async downloadSRTFromPlayerBar(songId) {
    try {
      console.log(`🎵 [PLAYER BAR] Iniciando download SRT para: ${songId}`);
      
      // Extrair título específico do player
      const title = this.extractTitleFromPlayerBar(songId);
      console.log(`🎵 [PLAYER BAR] Título extraído: "${title}"`);
      
      // Usar a mesma lógica de SRT que já funciona
      await this.downloadSRTFromAligned(songId, title);
      
    } catch (error) {
      console.error('🚫 [PLAYER BAR] Erro no download SRT:', error);
  this.showToast(`${this.t('downloadError')} ${error.message}`);
    }
  }

  // Extração de título específica do player bar
  extractTitleFromPlayerBar(songId) {
    console.log(`🔍 [PLAYER BAR] Extraindo título específico do player para ID: ${songId}`);
    
    // ESTRATÉGIA 1: Buscar pelo link específico do playbar com aria-label
    const playbarLink = document.querySelector('a[aria-label*="Playbar: Title for"]');
    if (playbarLink) {
      const ariaLabel = playbarLink.getAttribute('aria-label');
      if (ariaLabel) {
        // Extrair o título do aria-label: "Playbar: Title for NOME_DA_MÚSICA"
        const match = ariaLabel.match(/Playbar:\s*Title\s*for\s*(.+)$/i);
        if (match && match[1]) {
          const title = match[1].trim();
          console.log(`✅ [PLAYER BAR] Título extraído do aria-label: "${title}"`);
          return this.sanitizeTitleForFile(title);
        }
      }
      
      // Fallback: usar o texto do link se aria-label não funcionar
      const linkText = playbarLink.textContent?.trim();
      if (linkText && linkText.length > 3 && linkText.length < 150) {
        console.log(`✅ [PLAYER BAR] Título do texto do link: "${linkText}"`);
        return this.sanitizeTitleForFile(linkText);
      }
    }
    
    // ESTRATÉGIA 2: Usar a mesma lógica que funciona no card (buscar por songId)
    if (songId) {
      console.log(`🧪 [PLAYER BAR] Tentando extrair do card para ID: ${songId}`);
      const title = this.extractTitleFromCard(songId);
      if (title && title !== 'Song' && title !== 'Unknown Song') {
        console.log(`✅ [PLAYER BAR] Título extraído do card: "${title}"`);
        return title;
      }
    }
    
    // ESTRATÉGIA 3: Buscar na barra do player atual
    console.log(`🧪 [PLAYER BAR] Buscando título na barra do player`);
    const playerBar = this.findPlayerBar();
    if (playerBar) {
      // Procurar link da música no player
      const songLink = playerBar.querySelector('a[href*="/song/"]');
      if (songLink) {
        const linkText = songLink.textContent?.trim();
        if (linkText && linkText.length > 3 && linkText.length < 100) {
          console.log(`✅ [PLAYER BAR] Título do link: "${linkText}"`);
          return this.sanitizeTitleForFile(linkText);
        }
      }
    }
    
    // ESTRATÉGIA 4: Fallback para título da página
    console.log(`🧪 [PLAYER BAR] Fallback - tentando título da página`);
    const pageTitle = document.title;
    if (pageTitle && !pageTitle.includes('Suno') && pageTitle.length > 3) {
      const cleanTitle = pageTitle.split('|')[0]?.split('-')[0]?.trim();
      if (cleanTitle && cleanTitle.length > 3) {
        console.log(`✅ [PLAYER BAR] Título da página: "${cleanTitle}"`);
        return this.sanitizeTitleForFile(cleanTitle);
      }
    }
    
    console.log(`❌ [PLAYER BAR] Não foi possível extrair título`);
    return `Unknown_Song_${songId || Date.now()}`;
  }

  // Função auxiliar para encontrar a barra do player
  findPlayerBar() {
    // Procurar pela barra do player na parte inferior da página
    const playerSelectors = [
      '[class*="player"]',
      '[data-testid*="player"]',
      '.pmu-player-bar-actions',
      '[class*="audio"]',
      '[class*="music"]'
    ];
    
    for (const selector of playerSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // Verificar se está na parte inferior da tela (últimos 200px)
        if (rect.bottom > window.innerHeight - 200) {
          return el;
        }
      }
    }
    
    return null;
  }
  
  // Sincronizar estado das checkboxes com selections
  syncCheckboxStates() {
    const checkboxes = document.querySelectorAll('.sbd-checkbox');
    let synced = 0;
    
    checkboxes.forEach(checkbox => {
      const id = checkbox.dataset.id;
      const shouldBeChecked = this.selections.has(id);
      
      if (checkbox.checked !== shouldBeChecked) {
        checkbox.checked = shouldBeChecked;
        synced++;
      }
    });
    
    if (synced > 0) {
      console.log(`🔄 Synced ${synced} checkbox states`);
      this.updateInterface();
    }
  }
  
  selectAll(select) {
    // Detectar se estamos na página /create
    const isCreatePage = location.pathname === '/create';

    if (isCreatePage) {
      this.selectAllCreatePage(select);
      return;
    }

    // Lógica original para outras páginas
    this.processExistingSongs().then(() => {
      const extensionCheckboxes = document.querySelectorAll('.sbd-checkbox');
      const nativeCheckboxes = document.querySelectorAll('.multi-select-button');
      let changed = 0;

      // Se selecionando tudo, adicionar todas as músicas visíveis
      if (select) {
        const rows = document.querySelectorAll('[data-clip-id]');
        rows.forEach(row => {
          const id = row.getAttribute('data-clip-id');
          const songLink = row.querySelector('a[href*="/song/"]');

          if (id && songLink && !this.selections.has(id)) {
            let title = 'unknown-song';
            const titleText = songLink.textContent.trim();
            if (titleText) {
              title = titleText.replace(/\s*v\d+\.\d+\+?\s*$/i, '').trim();
            }

            this.selections.set(id, {
              id,
              title,
              artist: 'Unknown',
              filename: this.createFilename(title, 'Unknown'),
              timestamp: Date.now()
            });
            changed++;
          }
        });
      }

      // Aplicar estado às checkboxes da extensão
      extensionCheckboxes.forEach(checkbox => {
        const shouldBeChecked = select;
        if (checkbox.checked !== shouldBeChecked) {
          checkbox.checked = shouldBeChecked;
          changed++;
        }
      });

      // Simular cliques nos checkboxes nativos do Suno
      nativeCheckboxes.forEach(nativeCheckbox => {
        const row = nativeCheckbox.closest('[data-clip-id]');
        if (!row) return;

        const id = row.getAttribute('data-clip-id');
        const isCurrentlyChecked = this.isNativeCheckboxChecked(nativeCheckbox);

        if (isCurrentlyChecked !== select) {
          const button = nativeCheckbox.querySelector('button');
          if (button) {
            button.click();
            changed++;
          }
        }
      });

      // Se desmarcando, limpar selections das músicas atuais
      if (!select) {
        const currentIds = [...Array.from(extensionCheckboxes).map(cb => cb.dataset.id),
                          ...Array.from(nativeCheckboxes).map(cb => cb.closest('[data-clip-id]')?.getAttribute('data-clip-id')).filter(Boolean)];
        currentIds.forEach(id => this.selections.delete(id));
      }

      this.updateInterface();
      this.saveSelections();
  this.showToast(`${select ? 'Selected' : 'Deselected'} ${changed} songs`);
    });
  }
  
  clearAll() {
    if (this.selections.size === 0) {
  this.showToast('No selections to clear');
      return;
    }
    
    const count = this.selections.size;
    console.log(`🧹 Limpando ${count} seleções...`);
    
    // Limpar seleções
    this.selections.clear();
    
    // Remover checkmarks visuais
    document.querySelectorAll('.sbd-checkbox:checked').forEach(cb => {
      cb.checked = false;
    });
    
    // Remover classes visuais
    document.querySelectorAll('.sbd-song-card.selected').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Limpar storage
    try {
      sessionStorage.removeItem('suno-bulk-selection');
      localStorage.removeItem('suno-bulk-selection');
      console.log('🧹 Storage limpo');
    } catch (e) {
      console.warn('Erro ao limpar storage:', e);
    }
    
    this.updateInterface();
    this.saveSelections();
    
  this.showToast(`✅ ${count} selections removed`);
    console.log('✅ Limpeza concluída');
  }
  
  // ========== 1. FUNÇÃO PARA DOWNLOAD EM MASSA ==========
  extractTitleForBulkDownload(songId) {
    console.log(`🔍 [BULK MASSA] Extraindo título para ID: ${songId}`);
    
    // Estratégia 1: Buscar elementos específicos do DOM para bulk
    const musicElements = document.querySelectorAll(`[data-clip-id="${songId}"]`);
    
    for (const element of musicElements) {
      // Buscar especificamente por links e elementos de texto (ignorar aria-label que dá "Song")
      const textCandidates = element.querySelectorAll("a[href*='/song/'], h1, h2, h3, h4, span, div[class*='title']");
      
      for (const textEl of textCandidates) {
        const text = textEl.textContent?.trim();
        // Rejeitar textos genéricos ou muito curtos
        if (text && text.length >= 5 && text.length <= 150 && 
            !/^(Edit|Publish|Share|View|MP3|SRT|Play|Song|V\d(\.\d+)?|🎵|[0-9:]+$)/i.test(text)) {
          console.log(`✅ [BULK MASSA] Título extraído: "${text}"`);
          return this.sanitizeTitleForFile(text);
        }
      }
    }
    
    console.log(`❌ [BULK MASSA] Não foi possível extrair título para ID: ${songId}`);
    return null;
  }

  // ========== 2. FUNÇÃO PARA BOTÃO NA BARRA DA PLAYLIST ==========
  extractTitleForPlaylistButton(songId) {
    console.log(`🔍 [PLAYLIST BAR] Extraindo título para ID: ${songId}`);
    
    // Buscar no card específico da playlist
    const playlistCard = document.querySelector(`[data-clip-id="${songId}"]`);
    if (playlistCard) {
      // Procurar por links e elementos de título
      const titleElements = playlistCard.querySelectorAll("a[href*='/song/'], h1, h2, h3, [data-testid*='title'], [class*='title']");
      
      for (const el of titleElements) {
        const text = el.textContent?.trim();
        if (text && text.length >= 3 && text.length <= 150 && 
            !/^(Play|Song|Edit|Share|View|MP3|SRT|[0-9:]+$)/i.test(text)) {
          console.log(`✅ [PLAYLIST BAR] Título extraído: "${text}"`);
          return this.sanitizeTitleForFile(text);
        }
      }
    }
    
    console.log(`❌ [PLAYLIST BAR] Não foi possível extrair título para ID: ${songId}`);
    return null;
  }

  // ========== 3. FUNÇÃO PARA BOTÃO NA BARRA DO PLAYER ==========
  extractTitleForPlayerBar() {
    console.log(`🔍 [PLAYER BAR] Extraindo título da barra do player`);
    
    // Estratégia 1: Título do player principal
    const playerSelectors = [
      'h1', 'h2', 'h3', 
      '[data-testid*="title"]', 
      '.player-title', 
      '[class*="title"]',
      'meta[property="og:title"]',
      'meta[name="twitter:title"]'
    ];
    
    for (const selector of playerSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.content || element.textContent?.trim();
        if (text && text.length >= 3 && text.length <= 150 && 
            !/^(Play|Suno|Library|Song|[0-9:]+$)/i.test(text)) {
          console.log(`✅ [PLAYER BAR] Título extraído: "${text}"`);
          return this.sanitizeTitleForFile(text);
        }
      }
    }
    
    console.log(`❌ [PLAYER BAR] Não foi possível extrair título do player`);
    return null;
  }

  // ========== 4. FUNÇÃO PARA BOTÕES INDIVIDUAIS DENTRO DA PÁGINA DA MÚSICA ==========
  extractTitleForIndividualPage(songId) {
    console.log(`🔍 [INDIVIDUAL PAGE] Extraindo título para ID: ${songId}`);
    
    // ESTRATÉGIA 1: Buscar input com o valor do título (mais confiável)
    const titleInputs = document.querySelectorAll('input[type="text"]');
    for (const input of titleInputs) {
      const value = input.value?.trim();
      if (value && value.length >= 3 && value.length <= 150 && 
          !/^(Edit|Publish|Share|View|MP3|SRT|Play|Song|V\d|[0-9:]+$|🎵|Frequently|Recently|Popular|Trending|Custom|Emojis)/i.test(value)) {
        console.log(`✅ [INDIVIDUAL PAGE] Título extraído de input: "${value}"`);
        return this.sanitizeTitleForFile(value);
      }
    }
    
    // ESTRATÉGIA 2: Buscar título na página individual da música via data-clip-id
    const songCard = document.querySelector(`[data-clip-id="${songId}"]`);
    if (songCard) {
      const candidates = songCard.querySelectorAll('a[href*="/song/"], h1, h2, h3, [data-testid*="title"], [class*="title"]');
      
      for (const candidate of candidates) {
        const text = candidate.textContent?.trim();
        
        if (text && text.length >= 3 && text.length <= 150 && 
            !/^(Edit|Publish|Share|View|MP3|SRT|Play|Song|V\d|[0-9:]+$|🎵)/i.test(text)) {
          console.log(`✅ [INDIVIDUAL PAGE] Título extraído via data-clip-id: "${text}"`);
          return this.sanitizeTitleForFile(text);
        }
      }
    }
    
    // ESTRATÉGIA 3: Buscar título nos metadados da página (title, h1, etc.)
    const pageTitle = document.title;
    if (pageTitle && !pageTitle.includes('Suno') && pageTitle.length >= 3 && pageTitle.length <= 150) {
      const cleanTitle = pageTitle.replace(/\s*[-|]\s*Suno.*$/i, '').trim();
      if (cleanTitle && cleanTitle !== pageTitle) {
        console.log(`✅ [INDIVIDUAL PAGE] Título extraído do page title: "${cleanTitle}"`);
        return this.sanitizeTitleForFile(cleanTitle);
      }
    }
    
    // ESTRATÉGIA 4: Usar a mesma lógica que funciona (extractTitleFromCard)
    console.log(`🧪 [INDIVIDUAL PAGE] Usando lógica de card que funciona para ID: ${songId}`);
    const cardTitle = this.extractTitleFromCard(songId);
    if (cardTitle && cardTitle !== 'Song' && cardTitle !== 'Unknown Song') {
      console.log(`✅ [INDIVIDUAL PAGE] Título extraído via card: "${cardTitle}"`);
      return cardTitle;
    }
    
    // Estratégia 5: Buscar em elementos com classes comuns de título
    const titleSelectors = [
      '[class*="song-title"]',
      '[class*="track-title"]', 
      '[class*="title"]',
      '[data-testid*="title"]',
      '[aria-label*="title"]'
    ];
    
    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent?.trim();
        if (text && text.length >= 3 && text.length <= 150 && 
            !/^(Edit|Publish|Share|View|MP3|SRT|Play|Song|V\d|[0-9:]+$|🎵)/i.test(text)) {
          console.log(`✅ [INDIVIDUAL PAGE] Título extraído via seletor "${selector}": "${text}"`);
          return this.sanitizeTitleForFile(text);
        }
      }
    }
    
    // Estratégia 6: Buscar na URL se contém informações úteis
    const urlPath = window.location.pathname;
    const urlMatch = urlPath.match(/\/song\/[^\/]+\/(.+)/);
    if (urlMatch) {
      const urlTitle = decodeURIComponent(urlMatch[1]).replace(/[-_]/g, ' ').trim();
      if (urlTitle && urlTitle.length >= 3 && urlTitle.length <= 150) {
        console.log(`✅ [INDIVIDUAL PAGE] Título extraído da URL: "${urlTitle}"`);
        return this.sanitizeTitleForFile(urlTitle);
      }
    }
    
    console.log(`❌ [INDIVIDUAL PAGE] Não foi possível extrair título para ID: ${songId}`);
    return null;
  }

  async startDownload() {
    if (this.selections.size === 0) {
  this.showToast('No songs selected');
      return;
    }
    
    // Inicializar variáveis de controle
    this.cancelDownloads = false;
    const totalSongs = this.selections.size;
    
    // Criar modal de progresso
    const progressModal = this.createProgressModal();
    this.updateProgress(progressModal, 0, totalSongs, 'Preparando metadados...');
    
    try {
      // Garantir que temos metadados atualizados para todas as seleções
      const downloads = [];
      let processedMetadata = 0;
      
      // Usar Set para evitar IDs duplicados
      const uniqueSelections = new Map();
      for (const selection of this.selections.values()) {
        uniqueSelections.set(selection.id, selection);
      }
      
      console.log(`🎵 Processing ${uniqueSelections.size} unique songs from ${this.selections.size} total selections`);
      
      for (const selection of uniqueSelections.values()) {
        if (this.cancelDownloads) {
          progressModal.remove();
          return;
        }
        
        // DETERMINAR CONTEXTO E CHAMAR FUNÇÃO APROPRIADA
        let songTitle = null;
        
        // Detectar contexto baseado em origem do download
        const sourceElement = document.querySelector(`[data-clip-id="${selection.id}"]`);
        const isPlayerContext = document.querySelector('.player') !== null;
        const isPlaylistContext = window.location.href.includes('/playlist') || document.querySelector('[class*="playlist"]') !== null;
        const isIndividualPage = window.location.href.includes('/song/');
        
        console.log(`🔍 Contexto detectado: Player=${isPlayerContext}, Playlist=${isPlaylistContext}, Individual=${isIndividualPage}`);
        
        if (isIndividualPage) {
          songTitle = this.extractTitleForIndividualPage(selection.id);
          console.log(`🎵 [INDIVIDUAL] Título extraído: "${songTitle}"`);
        } else if (isPlaylistContext) {
          songTitle = this.extractTitleForPlaylistButton(selection.id);
          console.log(`🎵 [PLAYLIST] Título extraído: "${songTitle}"`);
        } else if (isPlayerContext) {
          songTitle = this.extractTitleForPlayerBar();
          console.log(`🎵 [PLAYER] Título extraído: "${songTitle}"`);
        } else {
          songTitle = this.extractTitleForBulkDownload(selection.id);
          console.log(`🎵 [BULK MASSA] Título extraído: "${songTitle}"`);
        }
        
        if (!songTitle || songTitle === 'suno-song') {
          songTitle = selection.title || selection.filename || `Music-${selection.id.substring(0, 8)}`;
          console.log(`🎵 Fallback título: "${songTitle}" (ID: ${selection.id})`);
        }
        
        // Criar filename limpo
        const cleanFilename = this.sanitizeTitleForFile(songTitle) + '.mp3';
        
        downloads.push({
          url: `https://cdn1.suno.ai/${selection.id}.mp3`,
          filename: cleanFilename,
          title: songTitle,
          songId: selection.id, // Adicionar songId para uso na renomeação
          options: {}
        });
        
        processedMetadata++;
        this.updateProgress(progressModal, processedMetadata, totalSongs, `Preparando: ${songTitle}`);
      }
      
      if (this.cancelDownloads) {
        progressModal.remove();
        return;
      }
      
      console.log('📦 Downloads preparados:', downloads.map(d => d.filename));
      
      // Fazer downloads sequenciais um por vez com nome correto
  this.updateProgress(progressModal, 0, totalSongs, this.t('startingDownloads'));
      
      const results = { successful: [], failed: [], total: downloads.length };
      
      for (let i = 0; i < downloads.length; i++) {
        if (this.cancelDownloads) break;
        
        const download = downloads[i];
        
        try {
          // Configurar nome do arquivo para este download específico
          await chrome.runtime.sendMessage({
            type: 'pmu-set-filename',
            base: this.sanitizeTitleForFile(download.title),
            ext: 'mp3'
          });
          
          console.log(`🎵 [BULK ${i+1}/${downloads.length}] ${this.t('downloading')}: "${download.title}" (ID: ${download.songId})`);
          
          // Fazer download individual
          const response = await chrome.runtime.sendMessage({
            action: 'download',
            url: download.url,
            filename: download.filename
          });
          
          if (response.success) {
            results.successful.push({
              id: response.id,
              filename: download.filename,
              title: download.title
            });
            console.log(`✅ [BULK] Sucesso: "${download.title}"`);
          } else {
            throw new Error(response.error || 'Download failed');
          }
          
        } catch (error) {
          results.failed.push({
            filename: download.filename,
            title: download.title,
            error: error.message
          });
          console.error(`❌ [BULK] ${this.t('failed')}: "${download.title}": ${error.message}`);
        }
        
        // Atualizar progresso
        this.updateProgress(progressModal, i + 1, totalSongs, download.title);
        
        // Delay entre downloads para evitar sobrecarga
        if (i < downloads.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      const response = { success: true, results };
      
      if (response.success) {
        
        // Finalizar
        setTimeout(() => {
          progressModal.remove();
          if (!this.cancelDownloads) {
            this.showToast(`✅ ${response.results.successful.length}/${response.results.total} songs downloaded successfully!`);
            
            // Limpar TODAS as seleções após download em lote bem-sucedido
            console.log('🧹 Limpando todas as seleções após download em lote...');
            this.selections.clear();
            
            // DESMARCAR TODOS OS CHECKBOXES - FUNÇÃO ROBUSTA
            this.clearAllSelections();
            
            // Limpar storage também
            try {
              sessionStorage.removeItem('suno-bulk-selection');
              localStorage.removeItem('suno-bulk-selection');
            } catch (e) {
              console.warn('Erro ao limpar storage:', e);
            }
            
            this.updateInterface();
            this.saveSelections();
            console.log('✅ Todas as seleções foram removidas e checkboxes desmarcados');
          }
        }, 500);
        
      } else {
        throw new Error(response.error);
      }
      
    } catch (error) {
      progressModal.remove();
      
      // DESMARCAR TUDO MESMO EM CASO DE ERRO
      console.log('🧹 Limpando seleções após erro no download...');
      this.clearAllSelections();
      this.selections.clear();
      this.updateInterface();
      this.saveSelections();
      
  this.showToast(`❌ ${this.t('downloadError')} ${error.message}`);
      console.error('Download failed:', error);
    }
  }
  
  
  // Buscar metadados da música via API do Suno
  async getSongMetadata(songId) {
    try {
      // Verificar cache primeiro
      if (this.cache.has(`metadata_${songId}`)) {
        return this.cache.get(`metadata_${songId}`);
      }
      
      // Extrair token de sessão dos cookies
      const sessionToken = "; ".concat(document.cookie).split("; __session=").length === 2 
        ? "; ".concat(document.cookie).split("; __session=").pop().split(";").shift() 
        : null;
        
      if (!sessionToken) {
        console.warn(`⚠️ No session token for metadata ${songId}`);
        return null;
      }
      
      console.log(`🔍 Fetching metadata for: ${songId}`);
      
      // Tentar múltiplas URLs da API
      const apiUrls = [
        `https://studio-api.prod.suno.com/api/gen/${songId}/`,
        `https://studio-api.suno.com/api/gen/${songId}/`,
        `https://api.suno.com/api/gen/${songId}/`
      ];
      
      let data = null;
      for (const url of apiUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${sessionToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (e) {
          continue; // Tentar próxima URL
        }
      }
      
      if (!data) {
        console.warn(`⚠️ API metadata failed for ${songId}: all URLs failed`);
        return null;
      }
      
      // Extrair metadados
      const title = data.title || data.display_name || 'Unknown Song';
      const artist = data.metadata?.prompt || data.user?.handle || 'Unknown Artist';
      const duration = data.metadata?.duration || 0;
      const tags = data.metadata?.tags || [];
      
      const metadata = {
        title: this.cleanText(title),
        artist: this.cleanText(artist),
        duration,
        tags,
        filename: this.createFilename(title, artist)
      };
      
      // Cache do resultado
      this.cache.set(`metadata_${songId}`, metadata);
      
      console.log(`✅ Metadata retrieved: "${metadata.title}" by ${metadata.artist}`);
      return metadata;
      
    } catch (error) {
      console.warn(`⚠️ Error fetching metadata for ${songId}:`, error);
      return null;
    }
  }
  
  // Limpar texto para uso em nomes de arquivos
  cleanText(text) {
    return text
      .replace(/[\/\\?%*:|"<>]/g, '-')  // Caracteres inválidos
      .replace(/\s+/g, ' ')            // Múltiplos espaços
      .replace(/^-+|-+$/g, '')         // Hífens no início/fim
      .trim()
      .substring(0, 60);               // Limitar tamanho
  }
  
  // Criar nome de arquivo formatado
  createFilename(title, artist) {
    const cleanTitle = this.cleanText(title);
    const cleanArtist = this.cleanText(artist);
    
    // Formato: "Artista - Título.mp3"
    if (cleanArtist && cleanArtist !== 'Unknown Artist' && cleanArtist !== 'Unknown') {
      return `${cleanArtist} - ${cleanTitle}.mp3`;
    }
    
    // Apenas título se não houver artista
    return `${cleanTitle}.mp3`;
  }
  
  
  // Criar modal de progresso
  createProgressModal() {
    const modal = document.createElement('div');
    modal.className = 'sbd-progress-modal';
    modal.innerHTML = `
      <div class="sbd-progress-card">
  <div class="sbd-progress-title">🎵 Downloading Songs</div>
        <div class="sbd-progress-bar">
          <div class="sbd-progress-fill" style="width: 0%"></div>
        </div>
        <div class="sbd-progress-text">Preparando downloads...</div>
  <div class="sbd-progress-current">0 / 0 ${this.t('completed')}</div>
  <button class="sbd-progress-cancel">${this.t('cancel')}</button>
      </div>
    `;
    
    // Event listener para cancelar
    modal.querySelector('.sbd-progress-cancel').addEventListener('click', () => {
      this.cancelDownloads = true;
      modal.remove();
  this.showToast('Downloads canceled');
    });
    
    document.body.appendChild(modal);
    return modal;
  }
  
  // Atualizar progresso
  updateProgress(modal, current, total, currentFile = '') {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    
    const fillElement = modal.querySelector('.sbd-progress-fill');
    const textElement = modal.querySelector('.sbd-progress-text');
    const currentElement = modal.querySelector('.sbd-progress-current');
    
    if (fillElement) fillElement.style.width = `${percentage}%`;
  if (textElement) textElement.textContent = currentFile ? `${this.t('downloading')}: ${currentFile}` : this.t('processing');
  if (currentElement) currentElement.textContent = `${current} / ${total} ${this.t('completed')}`;
  }
  
  
  
  showDonate() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
    `;
    
    modal.innerHTML = `
      <div style="
        background: rgba(32, 32, 36, 0.98);
        backdrop-filter: blur(20px);
        color: white;
        padding: 30px;
        border-radius: 20px;
        border: 1px solid rgba(0, 210, 211, 0.3);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        max-width: 550px;
        text-align: center;
      ">
        <h2 style="color: #00d2d3; margin-bottom: 20px;">❤️ Obrigado pelo apoio!</h2>
        
        <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 25px;">
          <div style="
            background: rgba(0, 210, 211, 0.1);
            border: 2px solid #009b3a;
            border-radius: 15px;
            padding: 20px;
            flex: 1;
            max-width: 220px;
          ">
            <h3 style="color: #009b3a; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;">
              🇧🇷 Brasil - PIX
            </h3>
            <p style="margin-bottom: 15px; line-height: 1.6; font-size: 14px;">
              <strong style="color: #00d2d3;">Tharcisio Bernardo Valli Nardoto</strong><br><br>
              <strong>Chave PIX:</strong><br>
              <span style="background: rgba(0, 210, 211, 0.2); padding: 6px 10px; border-radius: 6px; font-family: monospace; font-size: 12px;">tharcisionardoto@gmail.com</span><br><br>
              <strong>WhatsApp:</strong><br>
              <span style="background: rgba(0, 210, 211, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 12px;">(27) 99913-2594</span>
            </p>
          </div>
          
          <div style="
            background: rgba(255, 140, 0, 0.1);
            border: 2px solid #ff8c00;
            border-radius: 15px;
            padding: 20px;
            flex: 1;
            max-width: 220px;
          ">
            <h3 style="color: #ff8c00; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;">
              🌍 Internacional
            </h3>
            <p style="margin-bottom: 15px; line-height: 1.6; font-size: 14px;">
              Support the project from anywhere in the world!
            </p>
            <button onclick="window.open('https://ko-fi.com/tharcisionardoto', '_blank')" style="
              background: linear-gradient(45deg, #ff8c00, #d96b00);
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              font-size: 14px;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px rgba(255, 140, 0, 0.3);
            ">☕ Ko-fi</button>
          </div>
        </div>
        
        <p style="margin-bottom: 20px; line-height: 1.6; font-style: italic; opacity: 0.8; font-size: 14px;">
          Qualquer valor é bem-vindo.<br>
          <strong style="color: #00d2d3;">"O sonho é a coisa mais real que existe."</strong><br>
          Gratidão! 🙏
        </p>
        
        <button id="close-donate" style="
          background: linear-gradient(135deg, #00d2d3, #00b894);
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        ">Fechar</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Hover effect para o botão Ko-fi
    const kofiBtn = modal.querySelector('button[onclick*="ko-fi"]');
    kofiBtn.addEventListener('mouseenter', () => {
      kofiBtn.style.background = 'linear-gradient(45deg, #e67e00, #c55a00)';
      kofiBtn.style.transform = 'translateY(-2px)';
    });
    kofiBtn.addEventListener('mouseleave', () => {
      kofiBtn.style.background = 'linear-gradient(45deg, #ff8c00, #d96b00)';
      kofiBtn.style.transform = 'translateY(0)';
    });
    
    // Hover effect para o botão de fechar
    const closeBtn = document.getElementById('close-donate');
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'linear-gradient(135deg, #00b2b3, #00a085)';
      closeBtn.style.transform = 'translateY(-2px)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'linear-gradient(135deg, #00d2d3, #00b894)';
      closeBtn.style.transform = 'translateY(0)';
    });
    
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  showHelp() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
    `;
    
    modal.innerHTML = `
      <div style="
        background: rgba(32, 32, 36, 0.98);
        backdrop-filter: blur(20px);
        color: white;
        padding: 30px;
        border-radius: 20px;
        border: 1px solid rgba(217, 107, 0, 0.3);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        max-width: 500px;
      ">
  <h2 style="color: #d96b00; margin-bottom: 20px;">🎵 ${this.t('helpTitle').replace(/v5\.0/, '<span style="color: #d01670; border: 1px solid #d01670; padding: 2px 6px; border-radius: 999px;">v5.0</span>')}</h2>
        <p style="margin-bottom: 15px; line-height: 1.6;">
          <strong>${this.t('helpHowToUse')}</strong><br>
          ${this.t('helpStep1')}<br>
          ${this.t('helpStep2')}<br>
          ${this.t('helpStep3')}<br>
          ${this.t('helpStep4')}
        </p>
        
        <p style="margin-bottom: 20px; line-height: 1.6;">
          <strong>${this.t('helpTips')}</strong><br>
          ${this.t('helpTip1')}<br>
          ${this.t('helpTip2')}<br>
          ${this.t('helpTip3')}<br>
          ${this.t('helpTip4')}<br>
          ${this.t('helpTip5')}
        </p>
        
        <button id="close-help" style="
          background: linear-gradient(135deg, #d96b00, #ff8c00);
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        ">${this.t('close')}</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('close-help').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  // ========== FUNÇÃO PARA DESMARCAR TODOS OS CHECKBOXES ==========
  clearAllSelections() {
    console.log('🧹 Iniciando limpeza completa de todas as seleções...');

    // Estratégia 1: Desmarcar todos os checkboxes da extensão
    const allCheckboxes = document.querySelectorAll('.sbd-checkbox');
    let uncheckedCount = 0;

    allCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        checkbox.checked = false;
        uncheckedCount++;
      }
    });

    console.log(`✅ Desmarcados ${uncheckedCount} checkboxes da extensão`);

    // Estratégia 2: Desmarcar checkboxes nativos do Suno
    const nativeCheckboxes = document.querySelectorAll('.multi-select-button');
    let nativeUncheckedCount = 0;

    nativeCheckboxes.forEach(nativeCheckbox => {
      const isChecked = this.isNativeCheckboxChecked(nativeCheckbox);
      if (isChecked) {
        const button = nativeCheckbox.querySelector('button');
        if (button) {
          button.click();
          nativeUncheckedCount++;
        }
      }
    });

    console.log(`✅ Desmarcados ${nativeUncheckedCount} checkboxes nativos do Suno`);

    // Estratégia 3: Limpar selections baseado nos IDs que tínhamos
    const selectionIds = Array.from(this.selections.keys());
    selectionIds.forEach(songId => {
      // Buscar card específico e desmarcar ambos os tipos
      const card = document.querySelector(`[data-clip-id="${songId}"]`);
      if (card) {
        // Checkbox da extensão
        const checkbox = card.querySelector('.sbd-checkbox');
        if (checkbox) {
          checkbox.checked = false;
        }

        // Checkbox nativo
        const nativeCheckbox = card.querySelector('.multi-select-button');
        if (nativeCheckbox && this.isNativeCheckboxChecked(nativeCheckbox)) {
          const button = nativeCheckbox.querySelector('button');
          if (button) {
            button.click();
          }
        }
      }
    });

    // Estratégia 4: Busca mais ampla para garantir que nada foi esquecido
    const allCards = document.querySelectorAll('[class*="card"], [class*="track"], [class*="song"], [class*="clip"]');
    allCards.forEach(card => {
      const checkbox = card.querySelector('.sbd-checkbox');
      if (checkbox && checkbox.checked) {
        checkbox.checked = false;
        console.log('✅ Desmarcado checkbox adicional encontrado');
      }
    });
    
    console.log('🎯 Limpeza completa finalizada - todos os checkboxes desmarcados');
  }

  updateInterface() {
    const count = this.selections.size;
    
    // Atualizar contador
    const counter = document.querySelector('.sbd-counter-number');
    if (counter) counter.textContent = count;
    
    // Atualizar botões
    const downloadBtn = document.getElementById('sbd-download');
    const exportBtn = document.getElementById('sbd-export');
    const zipBtn = document.getElementById('sbd-zip');
    
    if (downloadBtn) {
      downloadBtn.disabled = count === 0;
      downloadBtn.innerHTML = downloadBtn.innerHTML.replace(/\(\d+\)/, `(${count})`);
    }
    
    if (exportBtn) {
      exportBtn.disabled = count === 0;
    }
    
    if (zipBtn) {
      zipBtn.disabled = count === 0;
      zipBtn.innerHTML = zipBtn.innerHTML.replace(/\(\d+\)/, `(${count})`);
    }
  }
  
  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(20, 20, 24, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px 20px;
      color: white;
      font-size: 14px;
      z-index: 100000;
      opacity: 0;
      transition: all 0.3s ease;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
  
  async saveSelections() {
    try {
      const data = {};
      this.selections.forEach((value, key) => {
        data[key] = value;
      });
      
      // Salvar em sessionStorage E localStorage para maior persistência
      const jsonData = JSON.stringify(data);
      sessionStorage.setItem('suno-bulk-selection', jsonData);
      localStorage.setItem('suno-bulk-selection', jsonData);
      
      console.log(`💾 Saved ${this.selections.size} selections`);
    } catch (error) {
      console.error('Failed to save selections:', error);
    }
  }
  
  async restoreSelections() {
    try {
      // Tentar sessionStorage primeiro, depois localStorage
      let data = sessionStorage.getItem('suno-bulk-selection') || 
                 localStorage.getItem('suno-bulk-selection');
      
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([key, value]) => {
          this.selections.set(key, value);
        });
        console.log(`🔄 Restored ${this.selections.size} selections`);
      }
    } catch (error) {
      console.error('Failed to restore selections:', error);
    }
  }
  
  // Configurar listener para o evento pmu-download
  setupDownloadEventListener() {
    window.addEventListener('pmu-download', (e) => {
      const { songId, explicitExt } = e.detail || {};
      const row = this.findRowBySongId(songId);
      
      // Usar a mesma lógica de extração de título dos cards
      let title = '';
      
      if (row) {
        title = this.extractTitleFromCard(songId);
      }
      
      if (!title) {
        // Fallback para página individual: usar seletores específicos da página de música
        const isSongPage = window.location.pathname.includes('/song/');
        
        if (isSongPage) {
          // PRIMEIRA PRIORIDADE: Input com value do nome da música
          const titleInput = document.querySelector('input[type="text"][value]:not([value=""]):not([value="Song"]):not([value="Music"]):not([value="Track"])');
          if (titleInput && titleInput.value) {
            const inputValue = titleInput.value.trim();
            if (inputValue && 
                !inputValue.includes('🎵') && 
                !inputValue.includes('Suno Automator') && 
                !inputValue.includes('Bulk Downloader') &&
                !inputValue.includes('Frequently Used') &&
                inputValue !== 'Song' && inputValue !== 'Music' && inputValue !== 'Track' &&
                inputValue.length > 2) {
              title = this.sanitizeTitleForFile(inputValue);
              console.log(`🎵 Título do input da página: "${title}"`);
            }
          }
          
          // FALLBACK: Outros seletores se o input não funcionar
          if (!title) {
            const titleSelectors = [
              'main h1',
              'div[class*="text-white"] h1',
              'h1[class*="text-2xl"]',
              'h1[class*="font-bold"]',
              'div[style*="font-weight: 600"][style*="font-size: 24px"]',
              'div[style*="font-weight:600"][style*="font-size:24px"]',
              '[data-testid="song-title"]',
              '.song-title'
            ];
            
            for (const selector of titleSelectors) {
              const titleEl = this.queryOutsideSidebar(selector);
              if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 0) {
                const text = titleEl.textContent.trim();
                // Filtrar textos da extensão e genéricos
                if (!text.includes('🎵') && 
                    !text.includes('Suno Automator') && 
                    !text.includes('Bulk Downloader') &&
                    !text.includes('Frequently Used') &&
                    text !== 'Song' && text !== 'Music' && text !== 'Track') {
                  title = this.sanitizeTitleForFile(text);
                  console.log(`🎵 Título fallback da página: "${title}"`);
                  break;
                }
              }
            }
          }
        } else {
          // Para páginas de lista: tentar pegar do painel à direita
          const sideTitle = document.querySelector('aside h1, aside h2, [data-testid*="song"] h1, [data-testid*="song"] h2');
          if (sideTitle?.textContent && !sideTitle.textContent.includes('Frequently Used')) {
            title = this.sanitizeTitleForFile(sideTitle.textContent);
          }
        }
      }
      if (!title) title = `suno-${songId || 'track'}`;

      // Avisar o background qual deve ser o nome-base do próximo download
      try {
        if (chrome.runtime?.id) {
          chrome.runtime.sendMessage({
            type: 'pmu-set-filename',
            base: title,
            ext: explicitExt || 'mp3'
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('⚠️ Runtime error:', chrome.runtime.lastError.message);
            }
          });
        } else {
          console.warn('⚠️ Extension context invalidated. Please refresh the page.');
          this.showToast('❌ Extension disconnected. Refresh the page (F5).');
          return;
        }
      } catch (error) {
        console.warn('⚠️ Failed to send message:', error.message);
  this.showToast('❌ Connection error. Refresh the page (F5).');
        return;
      }

      console.log(`🎵 [PMU] Filename intent set: "${title}.${explicitExt || 'mp3'}"`);
    });
  }

  // Método auxiliar para sanitizar títulos
  sanitizeTitleForFile(s) {
    return (s || '')
      .replace(/\s+/g, ' ')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .trim();
  }

  // Buscar row por songId usando seletores robustos
  findRowBySongId(songId) {
    const rows = document.querySelectorAll('[data-clip-id][role="button"][data-react-aria-pressable="true"]');
    for (const r of rows) {
      if (r.getAttribute('data-clip-id') === songId) return r;
      const host = r.querySelector('.sbd-card-buttons[data-song-id]');
      if (host && host.getAttribute('data-song-id') === songId) return r;
    }
    return null;
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.saveSelections();
    console.log('🧹 Cleanup completed');
  }
}

// Inicialização
if (window.location.hostname.includes('suno.com')) {
  console.log('🚀 Suno Bulk Downloader: Loading on Suno.com');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOM loaded, initializing Suno Bulk Downloader...');
      setTimeout(() => {
        window.sunoBulkDownloader = new SunoBulkDownloaderSimplified();
      }, 1000);
    });
  } else {
    console.log('📄 DOM already ready, initializing Suno Bulk Downloader...');
    setTimeout(() => {
      window.sunoBulkDownloader = new SunoBulkDownloaderSimplified();
    }, 1000);
  }
} else {
  console.log('Suno Bulk Downloader: Not on Suno.com');
}

// ===== PMU: util para extrair o título “de verdade” de uma linha ===========
function pmuSanitizeTitleForFile(s) {
  return (s || "")
    .replace(/\s+/g, " ")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .trim();
}

function pmuExtractRowTitle(row) {
  if (!row) return "";

  // 1) aria-label do botão Play costuma conter o título
  const play = row.querySelector('[aria-label*="Play"]');
  if (play) {
    const al = play.getAttribute("aria-label") || "";
    const m = al.match(/Play(?:\s+song)?[:\-]?\s*(.+)$/i);
    if (m && m[1]) {
      const t = pmuSanitizeTitleForFile(m[1]);
      if (t && !/^🎵\s*Suno/i.test(t)) return t;
    }
  }

  // 2) textos candidatos dentro da linha (descarta rótulos e títulos do plugin)
  const bad = /^(Edit|Publish|Share|View|MP3|SRT|V\d(\.\d+)?|🎵\s*Suno)/i;
  const cands = [];
  row.querySelectorAll("a, h1, h2, h3, h4, [data-testid*=title]").forEach((el) => {
    const t = el.textContent?.trim();
    if (t && t.length >= 3 && !bad.test(t)) cands.push(t);
  });
  cands.sort((a, b) => b.length - a.length);
  return pmuSanitizeTitleForFile(cands[0] || "");
}

// guarda a última linha “focada/clicada” para ajudar o background
let __pmuLastRow = null;
document.addEventListener("click", (e) => {
  const r = e.target.closest('[data-clip-id][role="button"][data-react-aria-pressable="true"]');
  if (r) __pmuLastRow = r;
}, true);
document.addEventListener("mousemove", (e) => {
  const r = e.target.closest('[data-clip-id][role="button"][data-react-aria-pressable="true"]');
  if (r) __pmuLastRow = r;
}, true);

// Listener de títulos removido - funcionalidade integrada na classe principal

// Listener removido - agora está integrado na classe principal

// === PMU: Botões na BARRA DO PLAYER (fundo) ================================
(() => {
  if (!/suno\.ai|suno\.com/i.test(location.hostname)) return;

  // 1) estilos discretos (tamanho parecido com os botões do player)
  function ensureStyle() {
    if (document.getElementById('pmu-player-bar-style')) return;
    const css = `
      .pmu-player-bar-actions { display:flex; gap:8px; align-items:center; margin-left:10px; }
      .pmu-player-bar-actions .pmu-btn{
        display:inline-flex; align-items:center; justify-content:center;
        width:28px; height:28px; border-radius:8px;
        border:1px solid rgba(0,0,0,.15);
        background:#F4F3FF; color:#6559F5; font-weight:700; font-size:12px; cursor:pointer;
      }
      .pmu-player-bar-actions .pmu-btn:hover{ filter:brightness(1.06); }
      .pmu-player-bar-actions .pmu-btn:active{ transform:scale(.96); }
      .pmu-player-bar-actions .pmu-btn svg{ width:16px; height:16px; stroke:currentColor; fill:none; }
      
  /* Escopo seguro: só os botões adicionados por nós ficam acima localmente */
  .pmu-player-bar-actions { position: relative; z-index: 2; }
  .pmu-player-bar-actions .pmu-btn { position: relative; z-index: 2; }
    `;
    const st = document.createElement('style');
    st.id = 'pmu-player-bar-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // 2) localizar a BARRA do player (seletor alinhado ao seu print)
  //    alvo primário: div.z-50.absolute.bottom-0 … (bem característico dessa barra)
  const PLAYER_BAR_SELECTOR = [
    'div[class*="z-50"][class*="absolute"][class*="bottom-0"]',
    'div[class*="z-50"][class*="fixed"][class*="bottom-0"]' // fallback
  ].join(',');

  function findPlayerBar() {
    const els = [...document.querySelectorAll(PLAYER_BAR_SELECTOR)]
      .filter(el =>
        el.offsetWidth > 600 &&
        el.querySelector('button[aria-label*="Play"],button[aria-label*="Pause"]')
      );
    // pega o mais largo (geralmente é a barra certa)
    return els.sort((a,b)=>b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0] || null;
  }

  // 3) dentro da barra, escolher um HOST onde acoplar (linha de botões)
  function findPlayerHost(bar) {
    if (!bar) return null;
    // tenta um wrapper alinhado com os controles (Tailwind usa muito "items-center/justify-between")
    return bar.querySelector('div[class*="items-center"][class*="justify-between"]')
        || bar.querySelector('div[class*="items-center"]')
        || bar;
  }

  // 4) util para título do arquivo (pega do player ou do painel)
  function sanitize(s){ return (s||'').replace(/\s+/g,' ').replace(/[\\/:*?"<>|]+/g,' ').trim(); }
  function extractTitleFromPlayer(bar){
    // PRIMEIRA PRIORIDADE: Link do playbar com aria-label
    const playbarLink = document.querySelector('a[aria-label*="Playbar: Title for"]');
    if (playbarLink) {
      const ariaLabel = playbarLink.getAttribute('aria-label');
      if (ariaLabel) {
        const match = ariaLabel.match(/Playbar:\s*Title\s*for\s*(.+)$/i);
        if (match && match[1]) {
          const title = match[1].trim();
          return sanitize(title);
        }
      }
      
      // Fallback: texto do link
      const linkText = playbarLink.textContent?.trim();
      if (linkText && linkText.length > 3) {
        return sanitize(linkText);
      }
    }
    
    // SEGUNDA PRIORIDADE: Input com value do nome da música
    const titleInput = document.querySelector('input[type="text"][value]:not([value=""]):not([value="Song"]):not([value="Music"]):not([value="Track"])');
    if (titleInput && titleInput.value) {
      const inputValue = titleInput.value.trim();
      if (inputValue && 
          !inputValue.includes('🎵') && 
          !inputValue.includes('Suno Automator') && 
          !inputValue.includes('Bulk Downloader') &&
          !inputValue.includes('Frequently Used') &&
          inputValue !== 'Song' && inputValue !== 'Music' && inputValue !== 'Track' &&
          inputValue.length > 2) {
        return sanitize(inputValue);
      }
    }
    
    // FALLBACK: título dentro da barra, se existir
    const t1 = bar?.querySelector('h1, h2, h3, [data-testid*="title"], a[href*="/song"]');
    if (t1?.textContent) {
      const text = sanitize(t1.textContent);
      if (text && !text.includes('Frequently Used') && text.length > 2) {
        return text;
      }
    }
    
    return 'suno-track';
  }

  // 5) criar botão minimalista
  function makeBtn(svgPathD, title, onClick){
    const b = document.createElement('button');
    b.className = 'pmu-btn'; b.title = title;
    b.innerHTML = `<svg viewBox="0 0 24 24" stroke-width="2">
      <path d="${svgPathD}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    b.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); onClick?.(); });
    return b;
  }

  async function triggerDownload(ext){
    console.log(`🎵 [PLAYER BAR] Botão ${ext.toUpperCase()} clicado!`);
    
    const bar = findPlayerBar();
    const title = extractTitleFromPlayer(bar);
    
    // Pegar songId de qualquer link /song/ disponível
    let songId = null;
    
    // Prioridade 1: pegar do link do playbar (mantém a faixa atual)
    const playbarLink = document.querySelector('a[aria-label*="Playbar: Title for"]');
    if (!songId && playbarLink && playbarLink.getAttribute('href')) {
      const href = playbarLink.getAttribute('href');
      songId = href.split('/song/')[1]?.split('?')[0]?.split('/')[0] || null;
    }

    // Tentar pegar da URL atual
    if (window.location.pathname.includes('/song/')) {
      songId = window.location.pathname.split('/song/')[1]?.split('?')[0]?.split('/')[0];
    }
    
    // Se não tiver na URL, pegar de links na página
    if (!songId) {
      const songLinks = document.querySelectorAll('a[href*="/song/"]');
      for (const link of songLinks) {
        const href = link.getAttribute('href');
        if (href) {
          songId = href.split('/song/')[1]?.split('?')[0]?.split('/')[0];
          break;
        }
      }
    }
    
    if (!songId) {
      console.error('🚫 SongId não encontrado!');
      return;
    }
    
    console.log(`🎵 Download: ${title} (${songId})`);
    
    if (ext === 'mp3') {
      const url = `https://cdn1.suno.ai/${songId}.mp3`;
      const base = pmuSanitizeTitleForFile(title || 'suno-track');
      const filename = `${base}.mp3`;

      try {
        // Informar intenção de nome para o background renomear corretamente
        await chrome.runtime.sendMessage({
          type: 'pmu-set-filename',
          base,
          ext: 'mp3'
        });
      } catch (_) { /* noop */ }

      try {
        const resp = await chrome.runtime.sendMessage({
          action: 'download',
          url,
          filename
        });
        if (resp && resp.success) {
          console.log(`✅ Download iniciado: ${filename}`);
        } else {
          console.warn('⚠️ Falha ao iniciar via background, fallback para âncora');
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch (err) {
        console.warn('⚠️ Erro ao usar background, fallback para âncora:', err);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  }

  // 6) montar os botões na barra
  function mountPlayerButtons(){
    const bar = findPlayerBar();
    const host = findPlayerHost(bar);
    if (!host || host.querySelector('.pmu-player-bar-actions')) return;

    const box = document.createElement('div');
    box.className = 'pmu-player-bar-actions';

    // ícone minimalista: download (MP3) apenas
    const ICON_DL  = 'M12 5v10M7 10l5 5 5-5M5 19h14';

  box.appendChild(makeBtn(ICON_DL,  (window.t ? window.t('downloadMusic') : 'Download Music'), () => triggerDownload('mp3')));

    host.appendChild(box);
    console.log('🎵 [PLAYER BAR] Apenas botão MP3 adicionado à barra do player');
  }

  // bootstrap + observar re-renderizações (o player troca de DOM com frequência)
  ensureStyle();
  
  // Aguardar a inicialização da classe principal antes de montar os botões
  setTimeout(() => {
    mountPlayerButtons();
    const mo = new MutationObserver(mountPlayerButtons);
    mo.observe(document.body, { childList:true, subtree:true });
  }, 2000);

  // util para debugar no console:
  window.__pmuFindPlayer = () => findPlayerBar();
})();

// Listener para mudanças de idioma vindas do popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'localeChanged') {
    console.log('🌍 Locale change received from popup:', message.locale);
    
    // Atualizar idioma no sistema i18n se estiver carregado
    if (window.sunoI18n && window.sunoI18n.setLocale) {
      window.sunoI18n.setLocale(message.locale).then(() => {
        console.log('✅ Content script locale updated');
        
        // Retraduzir interface se o bulk downloader estiver ativo
        if (window.sunoBulkDownloader && window.sunoBulkDownloader.translateInterface) {
          window.sunoBulkDownloader.translateInterface();
        }
        
        // Atualizar tour se estiver ativo
        if (window.sunoTour) {
          console.log('🎯 Notifying tour about locale change');
          // Disparar evento para o tour
          window.dispatchEvent(new CustomEvent('sbd-locale-changed', { 
            detail: { locale: message.locale } 
          }));
        }
      });
    }
    
    sendResponse({ success: true });
  }
});