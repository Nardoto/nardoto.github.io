// interactive-tour.js - Sistema de tour interativo profissional (i18n)
class InteractiveTour {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.steps = [];
    this.overlay = null;
    this.tooltip = null;
    this.init();

    // Rebuild steps when locale changes so the tour uses the new language
    try {
      window.addEventListener('sbd-locale-changed', () => {
        console.log('🌍 Tour received locale change event');
        if (this.isActive) {
          // Se o tour está ativo, atualiza o tooltip atual
          this.updateCurrentTooltip();
        } else {
          // Se não está ativo, reconstrói os passos
          this.init();
        }
      });
    } catch {}
  }

  init() {
    // Bilingual (EN first, PT smaller) content, fixed and independent of i18n
    this.EN = {
      tourStep01Title: 'Main Panel',
      tourStep02Title: 'CREATE Tab',
      tourStep03Title: 'Refresh',
      tourStep04Title: 'Individual Checkbox',
      tourStep05Title: 'Select All',
      tourStep06Title: 'Navigation',
      tourStep07Title: 'Deselect Page',
      tourStep08Title: 'Clear All',
      tourStep09Title: 'Download Selected',
      tourStep10Title: 'MP3/Lyric Buttons',
      tourStep11Title: 'Click the Song Title',
      tourStep12Title: 'MP3 Button',
      tourStep13Title: 'Lyric Button',
      tourStep14Title: 'Play Button',
      tourStep15Title: 'Player Download',
      tourStep16Title: 'Other Pages',
      tourStep17Title: 'Support the Project',
      tourStep18Title: 'Tour Completed!',
      tourStep01Content: 'Welcome! This is the SUNO LoopLess Download panel.',
      tourStep02Content: 'Click the CREATE tab to get started!',
      tourStep03Content: 'If checkboxes are missing, click here. If it persists, switch pages.',
      tourStep04Content: 'The checkbox on each song to mark what you want to download.',
      tourStep05Content: 'Marks all songs on the current page.',
      tourStep06Content: 'You can browse and keep selecting. It stays saved!',
      tourStep07Content: 'Clears only this page’s selection. Others remain.',
      tourStep08Content: 'Clears the selection from ALL pages.',
      tourStep09Content: 'TIP: Disable “ask where to save” in Chrome to avoid pop-ups.',
      tourStep10Content: 'Individual buttons on each song for quick download.',
      tourStep11Content: 'Click the TITLE to open the song page!',
      tourStep12Content: 'On the song page: downloads only this song as MP3.',
      tourStep13Content: 'Downloads synchronized lyrics (karaoke) as SRT.',
      tourStep14Content: 'Click PLAY to start the player!',
      tourStep15Content: 'With the song playing, use the player bar button to download the current one.',
      tourStep16Content: 'Works on Library, profiles, and any Suno page.',
      tourStep17Content: 'Like it? Click to support development!',
      tourStep18Content: 'You now know everything! Consider disabling Chrome’s save prompt.'
    };
    this.PT = {
      tourStep01Title: 'Painel Principal',
      tourStep02Title: 'Aba CREATE',
      tourStep03Title: 'Atualizar',
      tourStep04Title: 'Checkbox Individual',
      tourStep05Title: 'Selecionar Todas',
      tourStep06Title: 'Navegação',
      tourStep07Title: 'Desmarcar Página',
      tourStep08Title: 'Limpar Tudo',
      tourStep09Title: 'Baixar Selecionadas',
      tourStep10Title: 'Botões MP3/Lyric',
      tourStep11Title: 'Clique no Nome da Música',
      tourStep12Title: 'Botão MP3',
      tourStep13Title: 'Botão Lyric',
      tourStep14Title: 'Botão Play',
      tourStep15Title: 'Download no Player',
      tourStep16Title: 'Outras Páginas',
      tourStep17Title: 'Apoiar o Projeto',
      tourStep18Title: 'Tour Concluído!',
      tourStep01Content: 'Bem-vindo! Este é o painel da extensão SUNO LoopLess Download.',
      tourStep02Content: 'Clique na aba CREATE para começarmos!',
      tourStep03Content: 'Se as caixas não aparecerem, clique aqui. Se persistir, troque de página.',
      tourStep04Content: 'A caixinha de seleção em cada música para marcar o que baixar.',
      tourStep05Content: 'Marca todas as músicas da página atual.',
      tourStep06Content: 'Você pode navegar e continuar selecionando. Fica salvo!',
      tourStep07Content: 'Limpa apenas a seleção desta página. As outras permanecem.',
      tourStep08Content: 'Limpa a seleção de TODAS as páginas.',
      tourStep09Content: 'DICA: Desative "perguntar onde salvar" no Chrome para evitar pop-ups.',
      tourStep10Content: 'Botões individuais em cada música para download rápido.',
      tourStep11Content: 'Clique no TÍTULO para abrir a página da música!',
      tourStep12Content: 'Na página da música: baixa apenas esta música em MP3.',
      tourStep13Content: 'Baixa as letras sincronizadas (karaokê) em SRT.',
      tourStep14Content: 'Clique em PLAY para iniciar o player!',
      tourStep15Content: 'Com a música tocando, use o botão na barra do player para baixar a atual.',
      tourStep16Content: 'Funciona na Library, perfis e qualquer página do Suno.',
      tourStep17Content: 'Gostou? Clique para apoiar o desenvolvimento!',
      tourStep18Content: 'Agora você conhece tudo! Considere desativar o prompt de salvar do Chrome.'
    };
    // Define os 18 passos completos do tour usando chaves que serão traduzidas dinamicamente
    this.steps = [
      {
        selector: '#sbd-sidebar',
        titleKey: 'tourStep01Title',
        contentKey: 'tourStep01Content',
        position: 'right',
        clickRequired: false
      },
      {
        selector: 'nav a[href="/create"], a[href*="create"]',
        titleKey: 'tourStep02Title',
        contentKey: 'tourStep02Content',
        position: 'bottom',
        clickRequired: true,
        navigate: true
      },
      {
        selector: '#sbd-refresh',
        titleKey: 'tourStep03Title',
        contentKey: 'tourStep03Content',
        position: 'bottom',
        clickRequired: false
      },
      {
        selector: 'input[type="checkbox"], .sbd-checkbox',
        titleKey: 'tourStep04Title',
        contentKey: 'tourStep04Content',
        position: 'bottom',
        clickRequired: false,
        fallback: true
      },
      {
        selector: '#sbd-select-all',
        titleKey: 'tourStep05Title',
        contentKey: 'tourStep05Content',
        position: 'bottom',
        clickRequired: false
      },
      {
        selector: 'body',
        titleKey: 'tourStep06Title',
        contentKey: 'tourStep06Content',
        position: 'center',
        clickRequired: false
      },
      {
        selector: '#sbd-clear-page',
        titleKey: 'tourStep07Title',
        contentKey: 'tourStep07Content',
        position: 'bottom',
        clickRequired: false
      },
      {
        selector: '#sbd-clear-all',
        titleKey: 'tourStep08Title',
        contentKey: 'tourStep08Content',
        position: 'bottom',
        clickRequired: false
      },
      {
        selector: '#sbd-download',
        titleKey: 'tourStep09Title',
        contentKey: 'tourStep09Content',
        position: 'bottom',
        clickRequired: false
      },
      {
        selector: '.sbd-btn-mp3, .sbd-card-btn',
        titleKey: 'tourStep10Title',
        contentKey: 'tourStep10Content',
        position: 'top',
        clickRequired: false,
        fallback: true
      },
      {
        selector: 'h1, [class*="title"], a[href*="/song/"], div[class*="grid"] > div:not(.sbd-card-buttons)',
        titleKey: 'tourStep11Title',
        contentKey: 'tourStep11Content',
        position: 'bottom',
        clickRequired: true,
        navigate: true,
        fallback: true
      },
      {
        selector: '.sbd-btn-mp3, .sbd-card-btn',
        titleKey: 'tourStep12Title',
        contentKey: 'tourStep12Content',
        position: 'top',
        clickRequired: false,
        fallback: true
      },
      {
        selector: '.sbd-btn-srt, .sbd-card-btn-srt',
        titleKey: 'tourStep13Title',
        contentKey: 'tourStep13Content',
        position: 'top',
        clickRequired: false,
        fallback: true
      },
      {
        selector: 'button[class*="rounded-full"], button[class*="h-10"], button[aria-label*="play"]',
        titleKey: 'tourStep14Title',
        contentKey: 'tourStep14Content',
        position: 'bottom',
        clickRequired: true,
        fallback: true
      },
      {
        selector: '.pmu-player-bar-actions, .sbd-btn-mp3',
        titleKey: 'tourStep15Title',
        contentKey: 'tourStep15Content',
        position: 'top',
        clickRequired: false,
        fallback: true
      },
      {
        selector: 'body',
        titleKey: 'tourStep16Title',
        contentKey: 'tourStep16Content',
        position: 'center',
        clickRequired: false
      },
      {
        selector: '#sbd-donate',
        titleKey: 'tourStep17Title',
        contentKey: 'tourStep17Content',
        position: 'bottom',
        clickRequired: true
      },
      {
        selector: 'body',
        titleKey: 'tourStep18Title',
        contentKey: 'tourStep18Content',
        position: 'center',
        clickRequired: false
      }
    ];
  }

  // Métodos para obter textos traduzidos dinamicamente
  getStepTitle(step) {
    // Hardcoded bilingual rendering
    if (step.titleKey) {
      const en = this.EN[step.titleKey];
      const pt = this.PT[step.titleKey];
      if (en && pt) return `${en}<div style="color:#bbb; font-size:12px; margin-top:4px;">${pt}</div>`;
      if (en) return en;
    }
    
    // Fallback para textos hardcoded se não há tradução
    const fallbacks = {
      'tourStep01Title': '🎵 Painel Principal',
      'tourStep02Title': '🎨 Aba CREATE',
      'tourStep03Title': '🔄 Atualizar',
      'tourStep04Title': '☑️ Checkbox Individual',
      'tourStep05Title': '✅ Selecionar Todas',
      'tourStep06Title': '🔄 Navegação',
      'tourStep07Title': '❌ Desmarcar Página',
      'tourStep08Title': '🗑️ Limpar Tudo',
      'tourStep09Title': '⬇️ Baixar Selecionadas',
      'tourStep10Title': '🎵 Botões MP3/Lyric',
      'tourStep11Title': '🎵 Clique no Nome da Música',
      'tourStep12Title': '🎵 Botão MP3',
      'tourStep13Title': '📝 Botão Lyric',
      'tourStep14Title': '▶️ Botão Play',
      'tourStep15Title': '🎵 Download no Player',
      'tourStep16Title': '📚 Outras Páginas',
      'tourStep17Title': '❤️ Apoiar o Projeto',
      'tourStep18Title': '🎉 Tour Concluído!'
    };
    
    return fallbacks[step.titleKey] || step.title || step.titleKey || 'Step Title';
  }

  getStepContent(step) {
    // Hardcoded bilingual rendering
    if (step.contentKey) {
      const en = this.EN[step.contentKey];
      const pt = this.PT[step.contentKey];
      if (en && pt) return `${en}<div style="color:#bbb; font-size:12px; margin-top:8px;">${pt}</div>`;
      if (en) return en;
    }
    
    // Fallback para textos hardcoded se não há tradução
    const fallbacks = {
      'tourStep01Content': 'Bem-vindo! Este é o painel da extensão SUNO LoopLess Download.',
      'tourStep02Content': 'Clique na aba CREATE para começarmos!',
      'tourStep03Content': 'Se as caixas não aparecerem, clique aqui. Se persistir, troque de página.',
      'tourStep04Content': 'A caixinha de seleção em cada música para marcar o que baixar.',
      'tourStep05Content': 'Marca todas as músicas da página atual.',
      'tourStep06Content': 'Você pode navegar e continuar selecionando. Fica salvo!',
      'tourStep07Content': 'Limpa apenas a seleção desta página. As outras permanecem.',
      'tourStep08Content': 'Limpa a seleção de TODAS as páginas.',
      'tourStep09Content': 'DICA: Desative "perguntar onde salvar" no Chrome para evitar pop-ups.',
      'tourStep10Content': 'Botões individuais em cada música para download rápido.',
      'tourStep11Content': 'Clique no TÍTULO para abrir a página da música!',
      'tourStep12Content': 'Na página da música: baixa apenas esta música em MP3.',
      'tourStep13Content': 'Baixa as letras sincronizadas (karaokê) em SRT.',
      'tourStep14Content': 'Clique em PLAY para iniciar o player!',
      'tourStep15Content': 'Com a música tocando, use o botão na barra do player para baixar a atual.',
      'tourStep16Content': 'Funciona na Library, perfis e qualquer página do Suno.',
      'tourStep17Content': 'Gostou? Clique para apoiar o desenvolvimento!',
      'tourStep18Content': 'Agora você conhece tudo! Considere desativar o prompt de salvar do Chrome.'
    };
    
    return fallbacks[step.contentKey] || step.content || step.contentKey || 'Step content description.';
  }

  updateCurrentTooltip() {
    if (!this.isActive || !this.tooltip || this.currentStep < 0) return;
    
    const step = this.steps[this.currentStep];
    if (!step) return;
    
    // Atualiza o conteúdo do tooltip atual
    const titleElement = this.tooltip.querySelector('h3');
    const contentElement = this.tooltip.querySelector('p');
    
    if (titleElement) {
      titleElement.innerHTML = this.getStepTitle(step);
    }
    
    if (contentElement) {
      contentElement.innerHTML = this.getStepContent(step);
    }
    
    // Atualiza botões se necessário
    const continueBtn = this.tooltip.querySelector('#tour-continue');
    if (continueBtn) {
      const isLastStep = this.currentStep === this.steps.length - 1;
      continueBtn.textContent = isLastStep 
        ? ((window.sunoI18n && window.sunoI18n.t) ? window.sunoI18n.t('tourFinish') : 'Finish Tour') 
        : ((window.sunoI18n && window.sunoI18n.t) ? window.sunoI18n.t('tourContinue') : 'Continue →');
    }
    
    console.log('✅ Tour tooltip updated with new language');
  }

  async startTour() {
    if (this.isActive) return;

  // Start instantly (no i18n dependency)
    this.init();

    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
  }

  async ensureI18nReady() {
  // No-op: we don't wait on i18n anymore
  return;
  }

  createOverlay() {
    // Remove overlay existente
    if (this.overlay) {
      this.overlay.remove();
    }

    // Cria container para elementos do tour (sem fundo escuro)
    this.overlay = document.createElement('div');
    this.overlay.id = 'tour-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999998;
      pointer-events: none;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(this.overlay);

    // Cria tooltip
    this.createTooltip();
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'tour-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 2px solid #d96b00;
      border-radius: 12px;
      padding: 25px;
      min-width: 320px;
      max-width: 400px;
      min-height: 180px;
      z-index: 999999;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      pointer-events: auto;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(this.tooltip);
  }

  showStep(stepIndex) {
    if (stepIndex >= this.steps.length) {
      this.endTour();
      return;
    }

    const step = this.steps[stepIndex];
    let element = null;

    // Tenta cada seletor separadamente para evitar erro de sintaxe
    if (step.selector.includes(',')) {
      const selectors = step.selector.split(',').map(s => s.trim());
      for (const selector of selectors) {
        try {
          element = document.querySelector(selector);
          if (element) break;
        } catch (e) {
          console.warn(`Seletor inválido: ${selector}`, e);
        }
      }
    } else {
      try {
        element = document.querySelector(step.selector);
      } catch (e) {
        console.warn(`Seletor inválido: ${step.selector}`, e);
      }
    }

    // Se não encontrar o elemento e tiver fallback, tenta encontrar similar
    if (!element && step.fallback) {
      element = this.findSimilarElement(step);
    }

    if (!element) {
      // Aguardar mais tempo para elementos que podem aparecer depois
      const waitSteps = [12, 13]; // Passos 12 e 13 (MP3 e SRT buttons)
      if (waitSteps.includes(this.currentStep + 1)) {
        console.log(`⏳ Tour: Aguardando elemento aparecer no passo ${this.currentStep + 1}...`);
        // Aguardar até 3 segundos para elementos aparecerem
        const maxAttempts = 6;
        let attempts = 0;
        const checkElement = () => {
          attempts++;
          // Tenta encontrar o elemento novamente
          element = document.querySelector(step.selector);
          if (!element && step.fallback) {
            element = this.findSimilarElement(step);
          }
          if (element || attempts >= maxAttempts) {
            if (element) {
              console.log(`✅ Tour: Elemento encontrado após ${attempts} tentativas`);
              this.showStepWithElement(step, element);
            } else {
              console.warn(`🚫 Tour: Elemento não encontrado após ${attempts} tentativas no passo ${this.currentStep + 1}: "${step.title}"`);
              this.currentStep++;
              setTimeout(() => this.showStep(this.currentStep), 500);
            }
          } else {
            setTimeout(checkElement, 500);
          }
        };
        checkElement();
        return;
      }
      
      // Se não encontrar, pula para o próximo
      console.warn(`🚫 Tour: Elemento não encontrado no passo ${this.currentStep + 1}: "${step.title}" - Seletor: "${step.selector}"`);
      this.currentStep++;
      setTimeout(() => this.showStep(this.currentStep), 500);
      return;
    }

    this.showStepWithElement(step, element);
  }
  
  showStepWithElement(step, element) {
    console.log(`✅ Tour: Passo ${this.currentStep + 1} - "${step.title}" - Elemento encontrado:`, element);

    // Faz scroll para o elemento
    this.scrollToElement(element);
    
    // Destaca o elemento
    this.highlightElement(element);
    
    // Se o passo requer clique, adiciona listener
    if (step.clickRequired) {
      this.waitForClick(element, step);
    }
    
    // Posiciona e mostra tooltip
    this.positionTooltip(element, step);
    this.showTooltip(step);
  }

  waitForClick(element, step) {
    // Remove listeners anteriores
    this.removeClickListeners();
    
    // Função que será chamada no clique
    const clickHandler = (e) => {
      // Não previne o comportamento padrão para permitir navegação
      if (!step.navigate) {
        e.preventDefault();
      }
      
      console.log(`✅ Clique detectado no passo ${this.currentStep + 1} - Elemento:`, e.target);
      
      // Remove o listener
      this.removeClickListeners();
      
      // Se é um passo de navegação, aguarda a mudança de página
      if (step.navigate) {
        console.log(`🔄 Aguardando navegação...`);
        this.waitForNavigation(() => {
          this.currentStep++;
          setTimeout(() => this.showStep(this.currentStep), 1000);
        });
      } else {
        // Avança para o próximo passo imediatamente
        this.currentStep++;
        setTimeout(() => this.showStep(this.currentStep), 300);
      }
    };
    
    // Adiciona listener ao elemento principal com captura
    element.addEventListener('click', clickHandler, { capture: true, passive: false });
    
    // Adiciona listener a todos os elementos similares para maior detecção
    const allSimilarElements = this.findAllSimilarElements(step);
    allSimilarElements.forEach(el => {
      if (el !== element) {
        el.addEventListener('click', clickHandler, { capture: true, passive: false });
      }
    });
    
    // Armazena os listeners para remoção posterior
    this.currentClickListeners = { 
      element, 
      clickHandler, 
      step, 
      allElements: allSimilarElements 
    };
    
    console.log(`🎯 Aguardando clique no passo ${this.currentStep + 1} - Elementos detectados:`, allSimilarElements.length);
  }

  removeClickListeners() {
    if (this.currentClickListeners) {
      const { element, clickHandler, allElements } = this.currentClickListeners;
      
      // Remove listener do elemento principal
      element.removeEventListener('click', clickHandler, { capture: true });
      
      // Remove listeners de todos os elementos similares
      if (allElements) {
        allElements.forEach(el => {
          el.removeEventListener('click', clickHandler, { capture: true });
        });
      }
      
      this.currentClickListeners = null;
    }
  }

  waitForNavigation(callback) {
    const currentUrl = window.location.href;
    const checkNavigation = () => {
      if (window.location.href !== currentUrl) {
        callback();
      } else {
        setTimeout(checkNavigation, 200);
      }
    };
    setTimeout(checkNavigation, 100);
  }

  scrollToElement(element) {
    if (element) {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + window.pageYOffset;
      const elementHeight = rect.height;
      const windowHeight = window.innerHeight;
      
      // Calcula posição ideal para centralizar o elemento
      const idealScrollTop = elementTop - (windowHeight / 2) + (elementHeight / 2);
      
      // Scroll suave para o elemento
      window.scrollTo({
        top: Math.max(0, idealScrollTop),
        behavior: 'smooth'
      });
      
      // Aguarda um pouco para o scroll terminar
      setTimeout(() => {
        console.log(`📜 Scroll realizado para elemento do passo ${this.currentStep + 1}`);
      }, 500);
    }
  }

  findSimilarElement(step) {
    // Tenta encontrar elementos similares baseado no tipo
    const alternatives = {
      '[data-testid="song-card"], .song-item, [class*="song"]': [
        '[data-testid="song-card"]',
        '.song-item',
        '[class*="song-card"]',
        '[class*="track"]',
        'article',
        '.song',
        '[role="listitem"]'
      ],
      'input[type="checkbox"], .checkbox, [role="checkbox"]': [
        'input[type="checkbox"]',
        '.checkbox',
        '[role="checkbox"]',
        '.sbd-checkbox',
        'input[class*="checkbox"]'
      ],
      'button[class*="rounded-full"], button[class*="h-10"]': [
        'button[class*="rounded-full"]',
        'button[class*="h-10"]',
        'button[class*="w-10"]',
        'svg[viewBox="0 0 24 24"]',
        'button[aria-label*="next"]',
        'button[aria-label*="previous"]'
      ],
      '.sbd-btn-mp3, button[aria-label*="download"], button[class*="download"]': [
        '.sbd-btn-mp3',
        'button[aria-label*="download"]',
        'button[class*="download"]',
        'button[title*="download"]',
        '.download-btn'
      ],
      '.sbd-btn-srt': [
        '.sbd-btn-srt',
        'button[class*="srt"]',
        'button[title*="lyric"]'
      ]
    };

    const alts = alternatives[step.selector];
    if (alts) {
      for (const alt of alts) {
        const el = document.querySelector(alt);
        if (el) return el;
      }
    }

    return null;
  }

  findAllSimilarElements(step) {
    const elements = [];
    
    // Adiciona elementos do seletor principal
    if (step.selector.includes(',')) {
      const selectors = step.selector.split(',').map(s => s.trim());
      selectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            if (!elements.includes(el)) elements.push(el);
          });
        } catch (e) {
          console.warn(`Seletor inválido: ${selector}`, e);
        }
      });
    } else {
      try {
        document.querySelectorAll(step.selector).forEach(el => {
          if (!elements.includes(el)) elements.push(el);
        });
      } catch (e) {
        console.warn(`Seletor inválido: ${step.selector}`, e);
      }
    }

    // Adiciona elementos alternativos se tiver fallback
    if (step.fallback) {
      const alternatives = {
        'input[type="checkbox"], .sbd-checkbox': [
          'input[type="checkbox"]',
          '.checkbox',
          '[role="checkbox"]',
          '.sbd-checkbox',
          'input[class*="checkbox"]'
        ],
        'h1, [class*="title"], a[href*="/song/"], div[class*="grid"] > div:not(.sbd-card-buttons)': [
          'h1',
          '[class*="title"]',
          'a[href*="/song/"]',
          '[data-testid="song-card"]:not(.sbd-card-buttons)',
          '.song-item:not(.sbd-card-buttons)',
          '[class*="song-card"]:not(.sbd-card-buttons)',
          '[class*="track"]:not(.sbd-card-buttons)',
          'article:not(.sbd-card-buttons)',
          '.song:not(.sbd-card-buttons)',
          '[role="listitem"]:not(.sbd-card-buttons)',
          'div[class*="grid"] > div:not(.sbd-card-buttons)',
          '[class*="card"]:not(.sbd-card-buttons)',
          '[class*="name"]:not(.sbd-card-buttons)'
        ],
        '.sbd-btn-mp3, .sbd-card-btn': [
          '.sbd-btn-mp3',
          '.sbd-card-btn',
          '.pmu-player-bar-actions button',
          'button[aria-label*="download"]',
          'button[class*="download"]',
          'button[title*="download"]',
          'button[title*="MP3"]',
          '.sbd-card-buttons button:first-child'
        ],
        '.sbd-btn-srt, .sbd-card-btn-srt': [
          '.sbd-btn-srt',
          '.sbd-card-btn-srt',
          'button[class*="srt"]',
          'button[title*="lyric"]',
          'button[title*="SRT"]',
          '.sbd-card-buttons button:last-child'
        ],
        '.pmu-player-bar-actions, .sbd-btn-mp3': [
          '.pmu-player-bar-actions',
          '.sbd-btn-mp3',
          'button[title*="Baixar MP3"]',
          'button[aria-label*="Baixar MP3"]',
          '.pmu-player-bar-actions button'
        ],
        'button[class*="rounded-full"], button[class*="h-10"], button[aria-label*="play"]': [
          'button[class*="rounded-full"]',
          'button[class*="h-10"]',
          'button[class*="w-10"]',
          'button[aria-label*="play"]',
          'button[title*="play"]',
          '[aria-label*="Play"]',
          '[title*="Play"]'
        ],
        'button[aria-label*="next"], button[aria-label*="previous"]': [
          'button[aria-label*="next"]',
          'button[aria-label*="previous"]',
          'button[title*="next"]',
          'button[title*="previous"]'
        ]
      };

      const alts = alternatives[step.selector];
      if (alts) {
        alts.forEach(altSelector => {
          try {
            document.querySelectorAll(altSelector).forEach(el => {
              if (!elements.includes(el)) elements.push(el);
            });
          } catch (e) {
            console.warn(`Seletor alternativo inválido: ${altSelector}`, e);
          }
        });
      }
    }

    return elements;
  }

  highlightElement(element) {
    // Remove highlight anterior
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
      el.style.position = '';
      el.style.zIndex = '';
    });

    // Remove setas anteriores
    document.querySelectorAll('.tour-arrow').forEach(el => el.remove());

    const rect = element.getBoundingClientRect();
    
    // Destaca o elemento com borda brilhante
    element.classList.add('tour-highlight');
    element.style.position = 'relative';
    element.style.zIndex = '999997';
    
    // Cria seta apontando para o elemento
    this.createArrow(element);
    
    // Adiciona estilos de destaque
    const style = document.createElement('style');
    style.textContent = `
      .tour-highlight {
        animation: tour-pulse 2s infinite;
        border-radius: 8px !important;
        box-shadow: 0 0 0 4px #d96b00, 0 0 25px rgba(217, 107, 0, 0.6) !important;
        position: relative !important;
        z-index: 999997 !important;
      }
      @keyframes tour-pulse {
        0%, 100% { 
          box-shadow: 0 0 0 4px #d96b00, 0 0 25px rgba(217, 107, 0, 0.6);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 0 6px #ff8c00, 0 0 35px rgba(255, 140, 0, 0.8);
          transform: scale(1.02);
        }
      }
      .tour-arrow {
        position: fixed;
        z-index: 999999;
        pointer-events: none;
        font-size: 40px;
        color: #d96b00;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        animation: tour-bounce 1.5s infinite;
      }
      @keyframes tour-bounce {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  createArrow(element) {
    const rect = element.getBoundingClientRect();
    const arrow = document.createElement('div');
    arrow.className = 'tour-arrow';
    
    // Determina a melhor posição para a seta baseada no espaço disponível
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;
    
    let arrowSymbol, top, left;
    
    // Escolhe a posição com mais espaço
    if (spaceTop > 80) {
      // Seta de cima apontando para baixo
      arrowSymbol = '👇';
      top = rect.top - 60;
      left = rect.left + rect.width/2 - 20;
    } else if (spaceBottom > 80) {
      // Seta de baixo apontando para cima  
      arrowSymbol = '☝️';
      top = rect.bottom + 20;
      left = rect.left + rect.width/2 - 20;
    } else if (spaceLeft > 80) {
      // Seta da esquerda apontando para direita
      arrowSymbol = '👉';
      top = rect.top + rect.height/2 - 20;
      left = rect.left - 60;
    } else {
      // Seta da direita apontando para esquerda
      arrowSymbol = '👈';
      top = rect.top + rect.height/2 - 20;
      left = rect.right + 20;
    }
    
    arrow.innerHTML = arrowSymbol;
    arrow.style.top = top + 'px';
    arrow.style.left = left + 'px';
    
    document.body.appendChild(arrow);
  }

  positionTooltip(element, step) {
    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    
    // Margem maior para garantir que os botões sejam acessíveis
    const margin = 20;
    const tooltipWidth = Math.max(320, tooltipRect.width);
    const tooltipHeight = Math.max(200, tooltipRect.height);
    
    let top, left;
    let finalPosition = step.position;
    
    // Se a posição é 'center', centraliza na tela
    if (step.position === 'center') {
      top = (window.innerHeight - tooltipHeight) / 2;
      left = (window.innerWidth - tooltipWidth) / 2;
      this.tooltip.style.top = top + 'px';
      this.tooltip.style.left = left + 'px';
      this.tooltip.style.width = tooltipWidth + 'px';
      return;
    }
    
    // Verifica espaço disponível em cada direção
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;
    
    // Se a posição preferida não tem espaço suficiente, escolhe a melhor
    if (step.position === 'top' && spaceTop < tooltipHeight + 30) {
      finalPosition = spaceBottom > spaceLeft && spaceBottom > spaceRight ? 'bottom' : 
                     spaceRight > spaceLeft ? 'right' : 'left';
    } else if (step.position === 'bottom' && spaceBottom < tooltipHeight + 30) {
      finalPosition = spaceTop > spaceLeft && spaceTop > spaceRight ? 'top' : 
                     spaceRight > spaceLeft ? 'right' : 'left';
    } else if (step.position === 'left' && spaceLeft < tooltipWidth + 30) {
      finalPosition = spaceRight > spaceTop && spaceRight > spaceBottom ? 'right' : 
                     spaceBottom > spaceTop ? 'bottom' : 'top';
    } else if (step.position === 'right' && spaceRight < tooltipWidth + 30) {
      finalPosition = spaceLeft > spaceTop && spaceLeft > spaceBottom ? 'left' : 
                     spaceBottom > spaceTop ? 'bottom' : 'top';
    }
    
    // Posiciona baseado na melhor posição encontrada
    switch(finalPosition) {
      case 'top':
        top = rect.top - tooltipHeight - 15;
        left = rect.left + (rect.width - tooltipWidth) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 15;
        left = rect.left + (rect.width - tooltipWidth) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipHeight) / 2;
        left = rect.left - tooltipWidth - 15;
        break;
      case 'right':
      default:
        top = rect.top + (rect.height - tooltipHeight) / 2;
        left = rect.right + 15;
        break;
    }
    
    // Ajusta para garantir que fique completamente visível na tela
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    
    // Se ainda assim ficou muito no canto, centraliza na tela
    if (left < margin * 2 || left > window.innerWidth - tooltipWidth - margin * 2 ||
        top < margin * 2 || top > window.innerHeight - tooltipHeight - margin * 2) {
      // Centraliza na tela como fallback
      top = (window.innerHeight - tooltipHeight) / 2;
      left = (window.innerWidth - tooltipWidth) / 2;
    }
    
    this.tooltip.style.top = top + 'px';
    this.tooltip.style.left = left + 'px';
    this.tooltip.style.width = tooltipWidth + 'px';
  }

  showTooltip(step) {
    const isLastStep = this.currentStep === this.steps.length - 1;
    
    this.tooltip.innerHTML = `
      <div style="color: #fff; line-height: 1.5; position: relative;">
        <!-- Botão de sair pequeno e cinza sempre presente -->
        <button id="tour-exit" style="
          position: absolute;
          top: -10px;
          right: -10px;
          background: #666;
          color: #ccc;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          z-index: 1000000;
        " onmouseover="this.style.background='#888'" onmouseout="this.style.background='#666'">×</button>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
          <h3 style="margin: 0; color: #d96b00; font-size: 18px;">${this.getStepTitle(step)}</h3>
          <span style="color: #888; font-size: 14px;">${this.currentStep + 1}/${this.steps.length}</span>
        </div>
        
  <p style="margin: 0 0 20px 0; color: #ccc; font-size: 14px;">${this.getStepContent(step)}</p>
        
        ${step.clickRequired ? `
          <div style="text-align: center; margin-top: 15px;">
            <div style="color: #ff8c00; font-size: 16px; font-weight: bold; margin-bottom: 10px;">
              Waiting for your click...
              <div style="color:#bbb; font-size:12px;">Aguardando seu clique...</div>
            </div>
          </div>
        ` : `
          <div style="text-align: center; margin-top: 20px;">
            <button id="tour-continue" style="
              background: linear-gradient(45deg, #d96b00, #ff8c00);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 25px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px rgba(217, 107, 0, 0.3);
            ">${isLastStep 
                ? ((window.sunoI18n && window.sunoI18n.t) ? window.sunoI18n.t('tourFinish') : 'Finish Tour') 
                : ((window.sunoI18n && window.sunoI18n.t) ? window.sunoI18n.t('tourContinue') : 'Continue →')}</button>
          </div>
        `}
      </div>
    `;

    // Evento do botão de sair
    this.tooltip.querySelector('#tour-exit').addEventListener('click', () => this.endTour());
    
    // Evento do botão continuar (apenas se não requer clique)
    if (!step.clickRequired) {
      const continueBtn = this.tooltip.querySelector('#tour-continue');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          if (isLastStep) {
            this.endTour();
          } else {
            this.currentStep++;
            this.showStep(this.currentStep);
          }
        });
      }
    }

    // Mostra tooltip com animação
    requestAnimationFrame(() => {
      this.tooltip.style.opacity = '1';
      this.tooltip.style.transform = 'scale(1)';
    });
  }

  // Métodos removidos - não são mais necessários
  // O tour agora só avança com cliques diretos nos elementos

  endTour() {
    this.isActive = false;
    
    // Remove listeners de clique
    this.removeClickListeners();
    
    // Remove highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
      el.style.position = '';
      el.style.zIndex = '';
    });
    
    // Remove setas
    document.querySelectorAll('.tour-arrow').forEach(el => el.remove());
    
    // Remove elementos
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      setTimeout(() => this.overlay?.remove(), 300);
    }
    
    if (this.tooltip) {
      this.tooltip.style.opacity = '0';
      this.tooltip.style.transform = 'scale(0.8)';
      setTimeout(() => this.tooltip?.remove(), 300);
    }

    // Remove styles
    document.querySelectorAll('style').forEach(style => {
      if (style.textContent.includes('tour-pulse') || style.textContent.includes('tour-bounce')) {
        style.remove();
      }
    });
    
    console.log('🎉 Tour finalizado!');
  }
}

// Instância global do tour
window.sunoTour = new InteractiveTour();