// dom-manager.js - Gerenciador DOM Otimizado com Cache

(function(global) {
  'use strict';
  
  // Aguardar utils estar disponível
  function waitForUtils() {
    return new Promise((resolve) => {
      if (global.SunoUtils) {
        resolve(global.SunoUtils);
      } else {
        setTimeout(() => waitForUtils().then(resolve), 100);
      }
    });
  }

class DOMManager {
  constructor() {
    this.utils = global.SunoUtils || {};
    const { LRUCache, Logger } = this.utils;
    
    this.cache = LRUCache ? new LRUCache(200) : new Map();
    this.observers = new Map();
    this.elementRefs = new WeakMap();
    this.selectorIndex = new Map();
    
    this.setupPerformanceOptimizations();
    if (Logger) Logger.info('DOMManager initialized with cache size: 200');
  }
  
  // Cache inteligente de seletores
  $(selector, context = document, useCache = true) {
    const key = `${selector}:${context.nodeName || 'document'}`;
    
    if (useCache && this.cache && this.cache.has) {
      const cached = this.cache.has(key) ? this.cache.get(key) : null;
      if (cached && this.isElementValid(cached)) {
        return cached;
      }
      if (this.cache.delete) this.cache.delete(key);
    }
    
    const element = context.querySelector(selector);
    if (element && useCache && this.cache && this.cache.set) {
      this.cache.set(key, element);
    }
    return element;
  }
  
  // Cache para querySelectorAll
  $$(selector, context = document, useCache = true) {
    const key = `all:${selector}:${context.nodeName || 'document'}`;
    
    if (useCache && this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (cached && this.areElementsValid(cached)) {
        return cached;
      }
      this.cache.delete(key);
    }
    
    const elements = Array.from(context.querySelectorAll(selector));
    if (elements.length > 0 && useCache) {
      this.cache.set(key, elements);
    }
    return elements;
  }
  
  // Verifica se elemento ainda está no DOM
  isElementValid(element) {
    return element && element.isConnected && element.parentNode;
  }
  
  // Verifica se array de elementos ainda é válido
  areElementsValid(elements) {
    return Array.isArray(elements) && elements.every(el => this.isElementValid(el));
  }
  
  // Cache específico para elementos da extensão
  getCachedElement(id) {
    return this.cache.get(`sbd:${id}`) || document.getElementById(id);
  }
  
  setCachedElement(id, element) {
    this.cache.set(`sbd:${id}`, element);
  }
  
  // Busca inteligente de elementos com múltiplos seletores
  findElement(selectors, context = document) {
    for (const selector of selectors) {
      const element = this.$(selector, context);
      if (element) {
        Logger.debug(`Found element with selector: ${selector}`);
        return element;
      }
    }
    return null;
  }
  
  // Observer otimizado para mudanças específicas
  observeChanges(target, callback, options = {}) {
    const observerId = Math.random().toString(36).substr(2, 9);
    
    const defaultOptions = {
      childList: true,
      subtree: false,
      attributes: false,
      attributeOldValue: false,
      characterData: false,
      characterDataOldValue: false
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    const observer = new MutationObserver(debounce((mutations) => {
      const relevantMutations = mutations.filter(mutation => {
        return mutation.addedNodes.length > 0 || 
               mutation.removedNodes.length > 0 ||
               (mutation.type === 'attributes' && options.attributes);
      });
      
      if (relevantMutations.length > 0) {
        PerformanceMonitor.start(`observer-${observerId}`);
        callback(relevantMutations);
        PerformanceMonitor.end(`observer-${observerId}`);
      }
    }, 100, false));
    
    observer.observe(target, finalOptions);
    this.observers.set(observerId, observer);
    
    Logger.debug(`Observer created with ID: ${observerId}`);
    return observerId;
  }
  
  // Desconectar observer específico
  disconnectObserver(observerId) {
    const observer = this.observers.get(observerId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(observerId);
      Logger.debug(`Observer ${observerId} disconnected`);
    }
  }
  
  // Limpar todos os observers
  disconnectAllObservers() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    Logger.info('All observers disconnected');
  }
  
  // Inserção otimizada de HTML
  insertHTML(target, position, html) {
    PerformanceMonitor.start('insertHTML');
    
    if (!target || !html) return null;
    
    try {
      target.insertAdjacentHTML(position, html);
      this.invalidateCache(); // Limpar cache após modificações
      PerformanceMonitor.end('insertHTML');
      return target;
    } catch (error) {
      Logger.error('Error inserting HTML:', error);
      PerformanceMonitor.end('insertHTML');
      return null;
    }
  }
  
  // Event delegation otimizada
  delegate(parent, selector, event, callback) {
    const delegatedCallback = (e) => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        callback.call(target, e);
      }
    };
    
    parent.addEventListener(event, delegatedCallback);
    
    return () => parent.removeEventListener(event, delegatedCallback);
  }
  
  // Cleanup de elementos removidos do cache
  invalidateCache() {
    const toRemove = [];
    
    this.cache.cache.forEach((value, key) => {
      if (value && !this.isElementValid(value)) {
        toRemove.push(key);
      }
    });
    
    toRemove.forEach(key => this.cache.cache.delete(key));
    
    if (toRemove.length > 0) {
      Logger.debug(`Cache cleaned: ${toRemove.length} invalid entries removed`);
    }
  }
  
  // Batch operations para múltiplas operações DOM
  batch(operations) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        PerformanceMonitor.start('dom-batch');
        const results = operations.map(op => {
          try {
            return op();
          } catch (error) {
            Logger.error('Batch operation error:', error);
            return null;
          }
        });
        PerformanceMonitor.end('dom-batch');
        resolve(results);
      });
    });
  }
  
  // Detecção inteligente de mudanças na página
  detectPageChanges() {
    const url = window.location.href;
    const title = document.title;
    const hash = window.location.hash;
    
    const currentState = `${url}:${title}:${hash}`;
    const lastState = this.cache.get('pageState');
    
    if (lastState !== currentState) {
      this.cache.set('pageState', currentState);
      this.invalidateCache(); // Limpar cache em mudanças de página
      return true;
    }
    
    return false;
  }
  
  // Configurações de performance
  setupPerformanceOptimizations() {
    // Cleanup automático do cache a cada 30 segundos
    setInterval(() => {
      this.invalidateCache();
    }, 30000);
    
    // Monitoramento de mudanças de página
    window.addEventListener('popstate', () => {
      if (this.detectPageChanges()) {
        Logger.info('Page change detected, cache invalidated');
      }
    });
    
    // Cleanup na saída da página
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
  
  // Limpeza completa
  cleanup() {
    this.disconnectAllObservers();
    this.cache.clear();
    this.selectorIndex.clear();
    Logger.info('DOMManager cleanup completed');
  }
  
  // Estatísticas do cache
  getCacheStats() {
    return {
      size: this.cache.size(),
      maxSize: this.cache.maxSize,
      hitRate: this.cache.hits / (this.cache.hits + this.cache.misses) || 0,
      observers: this.observers.size
    };
  }
}

// Classe específica para gerenciar elementos do Suno
class SunoElementManager extends DOMManager {
  constructor() {
    super();
    this.sunoSelectors = {
      rows: '[role="row"]',
      songLinks: 'a[href*="/song/"]',
      playerBar: '[class*="player"], [class*="Player"]',
      grid: '[role="grid"], [role="table"]',
      sidebar: '[role="dialog"], aside, [class*="sidebar"]',
      timeDisplay: '*[class*="time"], *:has-text(/\\d{1,2}:\\d{2}/)',
      lyrics: 'div[style*="white-space: pre-wrap"], div[style*="whitespace-pre-wrap"]',
      buttons: 'button',
      progressBar: '[role="progressbar"], [class*="progress"]'
    };
    
    this.initSunoSpecific();
  }
  
  initSunoSpecific() {
    // Cache elementos específicos do Suno
    this.cacheSunoElements();
    
    // Observer específico para o grid de músicas
    this.observeGrid();
    
    Logger.info('SunoElementManager initialized');
  }
  
  cacheSunoElements() {
    Object.entries(this.sunoSelectors).forEach(([key, selector]) => {
      const elements = this.$$(selector);
      if (elements.length > 0) {
        this.cache.set(`suno:${key}`, elements);
        Logger.debug(`Cached ${elements.length} elements for ${key}`);
      }
    });
  }
  
  // Busca otimizada para linhas de música
  getMusicRows(refresh = false) {
    const cacheKey = 'suno:music-rows';
    
    if (!refresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (this.areElementsValid(cached)) {
        return cached;
      }
    }
    
    const rows = this.$$(this.sunoSelectors.rows).filter(row => {
      return row.querySelector('a[href*="/song/"]') !== null;
    });
    
    this.cache.set(cacheKey, rows);
    return rows;
  }
  
  // Busca inteligente da barra do player
  findPlayerBar() {
    const selectors = [
      // Busca por elementos com tempo no formato MM:SS
      '*:has-text(/\\d{1,2}:\\d{2}\\s*\\/\\s*\\d{1,2}:\\d{2}/)',
      // Busca por containers na parte inferior
      'div[class*="player"]:last-child',
      'div[class*="Player"]:last-child',
      // Busca por estruturas com botões e progresso
      'div:has(button):has([role="progressbar"])',
      // Fallback por posição
      'div[style*="position: fixed"][style*="bottom"]'
    ];
    
    for (const selector of selectors) {
      const elements = this.$$(selector);
      const playerBar = elements.find(el => {
        const rect = el.getBoundingClientRect();
        return rect.bottom > window.innerHeight - 200 && 
               rect.width > 300 &&
               el.querySelectorAll('button').length > 0;
      });
      
      if (playerBar) {
        this.cache.set('suno:playerBar', playerBar);
        Logger.debug('Player bar found and cached');
        return playerBar;
      }
    }
    
    Logger.warn('Player bar not found');
    return null;
  }
  
  // Observer específico para o grid
  observeGrid() {
    const grid = this.$(this.sunoSelectors.grid);
    if (!grid) {
      Logger.warn('Grid not found for observation');
      return;
    }
    
    return this.observeChanges(grid, (mutations) => {
      const hasNewRows = mutations.some(mutation => 
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === 1 && 
          (node.getAttribute('role') === 'row' || 
           node.querySelector('[role="row"]'))
        )
      );
      
      if (hasNewRows) {
        // Invalidar cache de rows
        this.cache.delete('suno:music-rows');
        this.cache.delete('suno:rows');
        
        // Emitir evento customizado
        window.dispatchEvent(new CustomEvent('sunoRowsChanged', {
          detail: { mutations, timestamp: Date.now() }
        }));
        
        Logger.debug('New music rows detected');
      }
    }, {
      childList: true,
      subtree: true
    });
  }
  
  // Extração otimizada de dados de música
  extractSongData(row) {
    const cached = this.elementRefs.get(row);
    if (cached) return cached;
    
    const songLink = row.querySelector('a[href*="/song/"]');
    if (!songLink) return null;
    
    const id = songLink.href.split('/song/')[1]?.split('?')[0];
    if (!id) return null;
    
    // Extração do título otimizada
    let title = 'unknown-song';
    const titleText = songLink.textContent.trim();
    if (titleText) {
      title = titleText
        .replace(/\s*v\d+\.\d+\+?\s*$/i, '')
        .replace(/[^\w\s\-\[\]()]/g, '')
        .trim();
    }
    
    const data = {
      id,
      title,
      filename: title.replace(/[\/\\?%*:|"<>]/g, '-').trim().substring(0, 80) + '.mp3',
      element: row,
      link: songLink.href
    };
    
    this.elementRefs.set(row, data);
    return data;
  }
  
  // Busca de letras otimizada
  findLyrics(context = document) {
    const lyricsSelectors = [
      'div[style*="white-space: pre-wrap"]',
      'div[style*="whitespace: pre-wrap"]', 
      'div[style*="white-space:pre-wrap"]',
      'div[style*="whitespace:pre-wrap"]',
      '[data-testid*="lyrics"]',
      '[data-testid*="lyric"]',
      'div[class*="lyrics"]',
      'div[class*="lyric"]',
      'pre'
    ];
    
    for (const selector of lyricsSelectors) {
      const elements = this.$$(selector, context);
      const lyrics = elements.find(el => {
        const text = el.textContent.trim();
        return text.length > 50 && 
               (text.includes('\n') || text.includes('[Verse') || 
                text.includes('[Chorus') || text.includes('[Bridge')) &&
               !text.includes('Suno') && 
               !text.includes('©') &&
               !text.includes('http');
      });
      
      if (lyrics) {
        Logger.debug('Lyrics found');
        return lyrics.textContent.trim();
      }
    }
    
    return null;
  }
}

// Exportar para global
const SunoDOMManager = {
  DOMManager,
  SunoElementManager
};

if (typeof window !== 'undefined') {
  window.SunoDOMManager = SunoDOMManager;
} else if (typeof global !== 'undefined') {
  global.SunoDOMManager = SunoDOMManager;
} else if (typeof self !== 'undefined') {
  self.SunoDOMManager = SunoDOMManager;
}

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : self);