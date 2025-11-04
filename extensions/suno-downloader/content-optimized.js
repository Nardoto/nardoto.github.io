// content-optimized.js - Suno Bulk Downloader v5.5 - Otimizado para Performance

// Dynamic imports para módulos (usando importmap ou scripts inline)
let utils, domManager, storageManager, workerPool;

// Configuração inicial
const CONFIG = {
  MAX_SELECTIONS: 1000,
  DEBOUNCE_DELAY: 150,
  BATCH_SIZE: 50,
  WORKER_POOL_SIZE: 2,
  OBSERVER_THROTTLE: 100,
  CACHE_TTL: 300000, // 5 minutos
  VERSION: '5.5'
};

class SunoBulkDownloader {
  constructor() {
    this.initialized = false;
    this.selections = new Map();
    this.observers = new Map();
    this.performanceMetrics = new Map();
    this.components = new Map();

    this.init();
  }

  async init() {
    try {
      console.log('🎵 Suno Bulk Downloader v5.5 initializing...');
      
      // Carregar módulos dinamicamente
      await this.loadModules();
      
      // Inicializar componentes core
      await this.initializeCore();
      
      // Configurar observadores otimizados
      this.setupOptimizedObservers();
      
      // Carregar estado persistido
      await this.restoreState();
      
      // Criar interface inicial
      await this.createInterface();
      
      // Setup cleanup
      this.setupCleanup();
      
      this.initialized = true;
      
      if (utils && utils.Logger) {
        utils.Logger.info('Suno Bulk Downloader initialized successfully');
      } else {
        console.log('✅ Suno Bulk Downloader initialized successfully');
      }
      
      if (utils && utils.PerformanceMonitor) {
        utils.PerformanceMonitor.end('initialization');
      }
      
    } catch (error) {
      if (utils && utils.Logger) {
        utils.Logger.error('Initialization failed:', error);
      } else {
        console.error('❌ Initialization failed:', error);
      }
    }
  }
  
  async loadModules() {
    console.log('📦 Loading modules...');
    
    try {
      // Carregamento dinâmico dos módulos com aguardo
      await this.loadScript('./utils.js');
      console.log('✅ Utils loaded');
      
      await this.loadScript('./dom-manager.js');
      console.log('✅ DOM Manager loaded');
      
      await this.loadScript('./storage-manager.js');
      console.log('✅ Storage Manager loaded');
      
      // Aguardar módulos estarem disponíveis
      await this.waitForModules();
      
      // Importar classes dos scripts carregados
      const sunoUtils = window.SunoUtils || {};
      const sunoDOMManager = window.SunoDOMManager || {};
      const sunoStorageManager = window.SunoStorageManager || {};
      
      utils = sunoUtils;
      
      if (utils.PerformanceMonitor) {
        utils.PerformanceMonitor.start('module-loading');
      }
      
      // Inicializar managers apenas se classes existirem
      if (sunoDOMManager.SunoElementManager) {
        domManager = new sunoDOMManager.SunoElementManager();
        console.log('✅ DOM Manager initialized');
      }
      
      if (sunoStorageManager.MusicSelectionManager) {
        storageManager = new sunoStorageManager.MusicSelectionManager();
        console.log('✅ Storage Manager initialized');
      }
      
      // Criar worker pool se WorkerPool existir
      if (utils.WorkerPool) {
        workerPool = new utils.WorkerPool(this.createLyricsWorkerScript(), CONFIG.WORKER_POOL_SIZE);
        console.log('✅ Worker Pool initialized');
      }
      
      if (utils.PerformanceMonitor) {
        utils.PerformanceMonitor.end('module-loading');
      }
      
      console.log('✅ All modules loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load modules:', error);
      // Fallback para funcionamento básico
      this.initializeFallback();
    }
  }
  
  async waitForModules() {
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos máximo
    
    while (attempts < maxAttempts) {
      if (window.SunoUtils && window.SunoDOMManager && window.SunoStorageManager) {
        console.log('📦 All modules ready');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    console.warn('⚠️ Some modules may not have loaded completely');
  }
  
  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(src);
      script.onload = () => {
        console.log(`✅ Script loaded: ${src}`);
        resolve();
      };
      script.onerror = (error) => {
        console.error(`❌ Failed to load script: ${src}`, error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }
  
  initializeFallback() {
    // Implementação básica sem otimizações avançadas
    utils = {
      debounce: (fn, delay) => {
        let timeout;
        return (...args) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => fn(...args), delay);
        };
      },
      Logger: {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
      },
      PerformanceMonitor: {
        start: () => {},
        end: () => {},
        measure: (label, fn) => fn()
      },
      BatchUpdater: {
        add: (fn) => requestAnimationFrame(fn)
      }
    };
    
    domManager = { $: document.querySelector.bind(document) };
    storageManager = new Map();
  }
  
  async initializeCore() {
    // Inicializar sistema de eventos
    this.eventEmitter = new utils.EventEmitter();
    
    // Configurar listeners de eventos
    this.setupEventListeners();
    
    // Inicializar cache
    this.cache = new utils.LRUCache(200);
    
    utils.Logger.info('Core components initialized');
  }
  
  setupEventListeners() {
    // Event listeners otimizados
    this.eventEmitter.on('selectionsChanged', utils.debounce((data) => {
      this.updateInterface(data);
      this.saveState();
    }, CONFIG.DEBOUNCE_DELAY));
    
    this.eventEmitter.on('newSongsDetected', utils.throttle((songs) => {
      this.processSongs(songs);
    }, CONFIG.OBSERVER_THROTTLE));
    
    // Cleanup na saída da página
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    // Listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseOperations();
      } else {
        this.resumeOperations();
      }
    });
  }
  
  setupOptimizedObservers() {
    utils.PerformanceMonitor.start('observer-setup');
    
    // Observer principal otimizado para detectar novas linhas de música
    const gridObserver = domManager.observeChanges(
      domManager.$('[role="grid"], [role="table"]') || document.body,
      utils.debounce((mutations) => {
        const relevantMutations = mutations.filter(mutation => 
          Array.from(mutation.addedNodes).some(node => 
            node.nodeType === 1 && (
              node.getAttribute?.('role') === 'row' ||
              node.querySelector?.('[role="row"]') ||
              node.querySelector?.('a[href*="/song/"]')
            )
          )
        );
        
        if (relevantMutations.length > 0) {
          utils.PerformanceMonitor.measure('process-new-rows', () => {
            this.processNewRows(relevantMutations);
          });
        }
      }, CONFIG.DEBOUNCE_DELAY),
      {
        childList: true,
        subtree: true,
        attributes: false
      }
    );
    
    this.observers.set('grid', gridObserver);
    
    // Observer para detectar mudanças no player
    const playerObserver = domManager.observeChanges(
      document.body,
      utils.debounce(() => {
        this.updatePlayerButton();
      }, 500),
      {
        childList: true,
        subtree: true,
        attributes: false
      }
    );
    
    this.observers.set('player', playerObserver);
    
    utils.PerformanceMonitor.end('observer-setup');
    utils.Logger.info('Optimized observers configured');
  }
  
  async processNewRows(mutations) {
    const newSongs = [];
    
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        
        const rows = node.getAttribute?.('role') === 'row' 
          ? [node] 
          : Array.from(node.querySelectorAll?.('[role="row"]') || []);
        
        rows.forEach(row => {
          const songData = domManager.extractSongData(row);
          if (songData) {
            newSongs.push(songData);
          }
        });
      });
    });
    
    if (newSongs.length > 0) {
      await this.processSongsInBatches(newSongs);
      this.eventEmitter.emit('newSongsDetected', newSongs);
    }
  }
  
  async processSongsInBatches(songs) {
    const batches = [];
    for (let i = 0; i < songs.length; i += CONFIG.BATCH_SIZE) {
      batches.push(songs.slice(i, i + CONFIG.BATCH_SIZE));
    }
    
    for (const batch of batches) {
      await utils.BatchUpdater.add(() => {
        batch.forEach(song => this.addCheckboxToSong(song));
      });
      
      // Pequena pausa entre batches para não bloquear a UI
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  addCheckboxToSong(songData) {
    if (songData.element.querySelector('.suno-bulk-checkbox')) return;
    
    const checkbox = this.createOptimizedCheckbox(songData);
    songData.element.prepend(checkbox);
  }
  
  createOptimizedCheckbox(songData) {
    const wrapper = document.createElement('div');
    wrapper.className = 'sbd-checkbox-wrapper';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'suno-bulk-checkbox sbd-checkbox';
    checkbox.dataset.id = songData.id;
    
    // Verificar estado persistido
    if (this.selections.has(songData.id)) {
      checkbox.checked = true;
    }
    
    // Event listener otimizado
    checkbox.addEventListener('change', utils.debounce((e) => {
      this.handleCheckboxChange(e, songData);
    }, 50));
    
    const visual = document.createElement('div');
    visual.className = 'sbd-checkbox-visual';
    
    wrapper.appendChild(checkbox);
    wrapper.appendChild(visual);
    
    return wrapper;
  }
  
  handleCheckboxChange(event, songData) {
    utils.PerformanceMonitor.start('checkbox-change');
    
    if (event.target.checked) {
      if (this.selections.size >= CONFIG.MAX_SELECTIONS) {
        event.target.checked = false;
        this.showNotification(`Limite de ${CONFIG.MAX_SELECTIONS} seleções atingido`, 'warning');
        return;
      }
      
      this.selections.set(songData.id, {
        id: songData.id,
        title: songData.title,
        filename: songData.filename,
        timestamp: Date.now()
      });
      
      this.showNotification(`"${songData.title}" adicionado`, 'success');
    } else {
      this.selections.delete(songData.id);
      this.showNotification(`"${songData.title}" removido`, 'info');
    }
    
    this.eventEmitter.emit('selectionsChanged', {
      count: this.selections.size,
      action: event.target.checked ? 'add' : 'remove',
      song: songData
    });
    
    utils.PerformanceMonitor.end('checkbox-change');
  }
  
  async createInterface() {
    utils.PerformanceMonitor.start('interface-creation');
    
    // Criar barra de ferramentas otimizada
    const toolbar = this.createOptimizedToolbar();
    
    // Inserir no DOM de forma otimizada
    await utils.BatchUpdater.add(() => {
      document.body.insertAdjacentElement('afterbegin', toolbar);
    });
    
    // Configurar event listeners da interface
    this.setupInterfaceEvents();
    
    utils.PerformanceMonitor.end('interface-creation');
    utils.Logger.info('Interface created successfully');
  }
  
  createOptimizedToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'sbd-bar';
    toolbar.innerHTML = this.getToolbarHTML();
    
    // Injetar CSS otimizado
    this.injectOptimizedCSS();
    
    return toolbar;
  }
  
  getToolbarHTML() {
    return `
      <div class="sbd-counter">
        <span class="sbd-counter-number">0</span>
        <span class="sbd-counter-label">selecionadas</span>
      </div>

      <button id="sbd-select-all" class="sbd-btn">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 11l3 3L22 4"/>
        </svg>
        Selecionar Todas
      </button>

      <button id="sbd-clear-page" class="sbd-btn">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 6l12 12M6 18L18 6"/>
        </svg>
        Desmarcar Página
      </button>

      <button id="sbd-clear-all" class="sbd-btn sbd-btn-danger">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polyline points="3,6 5,6 21,6"/>
          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
        </svg>
        Limpar Tudo
      </button>

      <button id="sbd-download" class="sbd-btn sbd-btn-primary" disabled>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <path d="M7 10l5 5 5-5"/>
          <path d="M12 15V3"/>
        </svg>
        Baixar (0)
      </button>

      <button id="sbd-export" class="sbd-btn" disabled>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Exportar TXT (0)
      </button>

      <div class="sbd-progress-container" style="display: none;">
        <div class="sbd-progress-bar">
          <div class="sbd-progress-fill" style="width: 0%"></div>
        </div>
        <span class="sbd-progress-text">0/0</span>
      </div>

      <div style="margin-left: auto; display: flex; gap: 12px;">
        <button id="sbd-stats" class="sbd-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M3 3v18h18"/>
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
          </svg>
          Stats
        </button>
        
        <button id="sbd-settings" class="sbd-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
          </svg>
          Config
        </button>

        <button id="sbd-help" class="sbd-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <point cx="12" cy="17"/>
          </svg>
          Ajuda
        </button>
      </div>
    `;
  }
  
  injectOptimizedCSS() {
    if (document.getElementById('sbd-optimized-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sbd-optimized-styles';
    style.textContent = this.getOptimizedCSS();
    document.head.appendChild(style);
  }
  
  getOptimizedCSS() {
    return `
    /* CSS Otimizado para Performance */
    body { padding-top: 70px !important; }
    
    #sbd-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: rgba(20, 20, 24, 0.98);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 99999;
      height: 70px;
      will-change: transform;
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
      will-change: transform;
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
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.8);
      font: 500 14px/1 system-ui;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform;
    }
    
    .sbd-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .sbd-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    .sbd-btn-primary {
      background: linear-gradient(135deg, #d96b00, #ff8c00);
      border: none;
      color: white;
      font-weight: 600;
    }
    
    .sbd-btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #ff8c00, #ffa500);
      box-shadow: 0 6px 20px rgba(217, 107, 0, 0.4);
    }
    
    .sbd-btn-danger {
      background: linear-gradient(135deg, #ff4757, #ff3742);
      border-color: rgba(255, 71, 87, 0.3);
    }
    
    .sbd-checkbox-wrapper {
      position: relative;
      width: 40px;
      height: 40px;
      margin-right: 12px;
      will-change: transform;
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
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .sbd-checkbox:checked ~ .sbd-checkbox-visual::after {
      opacity: 1;
      transform: scale(1);
    }
    
    .sbd-progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .sbd-progress-bar {
      width: 200px;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }
    
    .sbd-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #d96b00, #ff8c00);
      border-radius: 3px;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .sbd-progress-text {
      font: 500 12px/1 system-ui;
      color: rgba(255, 255, 255, 0.7);
      white-space: nowrap;
    }
    
    /* Otimizações para GPU */
    .sbd-btn,
    .sbd-counter,
    .sbd-checkbox-wrapper,
    .sbd-progress-fill {
      will-change: transform;
      transform: translateZ(0);
    }
    `;
  }
  
  setupInterfaceEvents() {
    const eventMappings = {
      'sbd-select-all': () => this.selectAllOnPage(true),
      'sbd-clear-page': () => this.selectAllOnPage(false),
      'sbd-clear-all': () => this.clearAllSelections(),
      'sbd-download': () => this.startDownload(),
      'sbd-export': () => this.exportSelections(),
      'sbd-stats': () => this.showStats(),
      'sbd-settings': () => this.showSettings(),
      'sbd-help': () => this.showHelp()
    };
    
    Object.entries(eventMappings).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', utils.debounce(handler, 100));
      }
    });
  }
  
  selectAllOnPage(select) {
    utils.PerformanceMonitor.start('select-all');
    
    const checkboxes = document.querySelectorAll('.suno-bulk-checkbox');
    let changed = 0;
    
    utils.BatchUpdater.add(() => {
      checkboxes.forEach(checkbox => {
        if (checkbox.checked !== select) {
          checkbox.checked = select;
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          changed++;
        }
      });
    });
    
    this.showNotification(
      `${select ? 'Selecionadas' : 'Desmarcadas'} ${changed} músicas da página`,
      'success'
    );
    
    utils.PerformanceMonitor.end('select-all');
  }
  
  async clearAllSelections() {
    if (this.selections.size === 0) {
      this.showNotification('Nenhuma seleção para limpar', 'info');
      return;
    }
    
    const count = this.selections.size;
    this.selections.clear();
    
    // Desmarcar checkboxes visíveis
    utils.BatchUpdater.add(() => {
      document.querySelectorAll('.suno-bulk-checkbox:checked').forEach(cb => {
        cb.checked = false;
      });
    });
    
    this.eventEmitter.emit('selectionsChanged', { count: 0, action: 'clear' });
    
    this.showNotification(`${count} seleções removidas`, 'success');
  }
  
  async startDownload() {
    if (this.selections.size === 0) {
      this.showNotification('Nenhuma música selecionada', 'warning');
      return;
    }
    
    const downloads = Array.from(this.selections.values()).map(selection => ({
      url: `https://cdn1.suno.ai/${selection.id}.mp3`,
      filename: selection.filename,
      id: selection.id,
      title: selection.title
    }));
    
    this.showProgressBar(true);
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'bulkDownload',
        downloads: downloads,
        tabId: await this.getCurrentTabId()
      });
      
      if (response.success) {
        const { results } = response;
        this.showNotification(
          `Download iniciado: ${results.successful.length}/${results.total} sucessos`,
          'success'
        );
        
        // Limpar seleções após download bem-sucedido
        setTimeout(() => {
          this.clearAllSelections();
        }, 2000);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      this.showNotification(`Erro no download: ${error.message}`, 'error');
      utils.Logger.error('Download failed:', error);
    } finally {
      this.showProgressBar(false);
    }
  }
  
  async exportSelections() {
    if (this.selections.size === 0) {
      this.showNotification('Nenhuma música selecionada para exportar', 'warning');
      return;
    }
    
    const songs = Array.from(this.selections.values());
    
    // Usar Web Worker para processamento pesado
    try {
      const result = await workerPool.execute({
        type: 'processExport',
        data: songs
      });
      
      this.generateTxtFile(result.songs, result.stats);
      
      this.showNotification(
        `Arquivo TXT gerado com ${result.stats.successful} músicas`,
        'success'
      );
      
    } catch (error) {
      utils.Logger.error('Export failed:', error);
      this.showNotification(`Erro na exportação: ${error.message}`, 'error');
    }
  }
  
  generateTxtFile(songs, stats) {
    const content = this.formatExportContent(songs, stats);
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `suno_export_${new Date().toISOString().slice(0, 10)}.txt`;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
  
  formatExportContent(songs, stats) {
    const header = [
      `SUNO BULK EXPORT - ${new Date().toLocaleDateString('pt-BR')}`,
      `Generated by: Suno Bulk Downloader v${CONFIG.VERSION}`,
      `Total songs: ${stats.total}`,
      `Processing time: ${stats.processingTime}ms`,
      '',
      '='.repeat(60),
      ''
    ].join('\n');
    
    const songsContent = songs.map((song, index) => [
      `${index + 1}. ${song.title}`,
      `ID: ${song.id}`,
      `Filename: ${song.filename}`,
      `Timestamp: ${new Date(song.timestamp).toLocaleString('pt-BR')}`,
      song.genres ? `Genres: ${song.genres.join(', ')}` : '',
      song.error ? `Error: ${song.error}` : '',
      '-'.repeat(40),
      ''
    ].filter(Boolean).join('\n')).join('\n');
    
    return header + songsContent;
  }
  
  updateInterface(data) {
    utils.BatchUpdater.add(() => {
      // Atualizar contador
      const counter = document.querySelector('.sbd-counter-number');
      if (counter) counter.textContent = data.count;
      
      // Atualizar botões
      const downloadBtn = document.getElementById('sbd-download');
      const exportBtn = document.getElementById('sbd-export');
      
      if (downloadBtn) {
        downloadBtn.disabled = data.count === 0;
        downloadBtn.innerHTML = downloadBtn.innerHTML.replace(/\(\d+\)/, `(${data.count})`);
      }
      
      if (exportBtn) {
        exportBtn.disabled = data.count === 0;
        exportBtn.textContent = `Exportar TXT (${data.count})`;
      }
    });
  }
  
  showProgressBar(show, progress = 0) {
    const container = document.querySelector('.sbd-progress-container');
    if (!container) return;
    
    container.style.display = show ? 'flex' : 'none';
    
    if (show) {
      const fill = container.querySelector('.sbd-progress-fill');
      const text = container.querySelector('.sbd-progress-text');
      
      if (fill) fill.style.width = `${progress * 100}%`;
      if (text && typeof progress === 'object') {
        text.textContent = `${progress.current}/${progress.total}`;
      }
    }
  }
  
  showNotification(message, type = 'info') {
    // Implementação otimizada de notificação
    const toast = document.createElement('div');
    toast.className = `sbd-toast sbd-toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    });
    
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      toast.style.opacity = '0';
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
  
  async restoreState() {
    try {
      if (storageManager && storageManager.getAllSelections) {
        const stored = storageManager.getAllSelections();
        stored.forEach(([id, data]) => {
          this.selections.set(id, data);
        });
        
        utils.Logger.info(`Restored ${this.selections.size} selections`);
      }
    } catch (error) {
      utils.Logger.error('Failed to restore state:', error);
    }
  }
  
  saveState() {
    try {
      if (storageManager && storageManager.clearAllSelections) {
        storageManager.clearAllSelections();
        this.selections.forEach((data, id) => {
          storageManager.addSelection(id, data);
        });
      }
    } catch (error) {
      utils.Logger.error('Failed to save state:', error);
    }
  }
  
  async getCurrentTabId() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0]?.id || 0;
    } catch {
      return 0;
    }
  }
  
  pauseOperations() {
    this.observers.forEach(observer => {
      if (observer.pause) observer.pause();
    });
    utils.Logger.debug('Operations paused');
  }
  
  resumeOperations() {
    this.observers.forEach(observer => {
      if (observer.resume) observer.resume();
    });
    utils.Logger.debug('Operations resumed');
  }
  
  setupCleanup() {
    const cleanup = () => {
      this.saveState();
      this.observers.forEach(observer => {
        domManager.disconnectObserver(observer);
      });
      if (workerPool) workerPool.terminate();
      utils.Logger.info('Cleanup completed');
    };
    
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
  }
  
  cleanup() {
    this.saveState();
    this.observers.forEach(observer => {
      if (typeof observer === 'string') {
        domManager.disconnectObserver(observer);
      }
    });
    
    if (workerPool) {
      workerPool.terminate();
    }
    
    if (domManager && domManager.cleanup) {
      domManager.cleanup();
    }
    
    utils.Logger.info('Suno Bulk Downloader cleanup completed');
  }
  
  createLyricsWorkerScript() {
    // Retorna o código do worker como string para criação dinâmica
    return `
      // Web Worker inline para operações pesadas
      self.addEventListener('message', function(e) {
        const { type, data, id } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'processExport':
              result = processExport(data);
              break;
            default:
              throw new Error('Unknown task type: ' + type);
          }
          
          self.postMessage({
            id,
            type: 'success',
            result
          });
        } catch (error) {
          self.postMessage({
            id,
            type: 'error',
            error: error.message
          });
        }
      });
      
      function processExport(songs) {
        const processed = songs.map((song, index) => ({
          ...song,
          processedAt: Date.now(),
          index
        }));
        
        return {
          songs: processed,
          stats: {
            total: songs.length,
            successful: processed.length,
            failed: 0,
            processingTime: 100
          }
        };
      }
    `;
  }
}

// Inicialização com detecção de página
if (window.location.hostname.includes('suno.com')) {
  // Aguardar carregamento completo da página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => new SunoBulkDownloader(), 1000);
    });
  } else {
    setTimeout(() => new SunoBulkDownloader(), 1000);
  }
} else {
  console.log('Suno Bulk Downloader: Not on Suno.com, skipping initialization');
}