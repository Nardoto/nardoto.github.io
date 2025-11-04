// storage-manager.js - Gerenciador de Persistência Otimizado

(function(global) {
  'use strict';

  const utils = global.SunoUtils || {};
  const { debounce, sanitize, Logger, EventEmitter } = utils;

class StorageManager extends EventEmitter {
  constructor() {
    super();
    this.cache = new Map();
    this.pendingWrites = new Map();
    this.initialized = false;
    
    this.init();
  }
  
  async init() {
    try {
      await this.loadFromStorage();
      this.setupAutoSave();
      this.initialized = true;
      this.emit('initialized');
      Logger.info('StorageManager initialized');
    } catch (error) {
      Logger.error('StorageManager initialization failed:', error);
    }
  }
  
  // Carregamento otimizado do storage
  async loadFromStorage() {
    const keys = [
      'suno-bulk-selection',
      'suno-bulk-settings',
      'suno-bulk-metrics',
      'suno-bulk-cache'
    ];
    
    const results = await Promise.allSettled(
      keys.map(key => this.getStorageItem(key))
    );
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        this.cache.set(keys[index], result.value);
        Logger.debug(`Loaded ${keys[index]} from storage`);
      }
    });
  }
  
  // Wrapper para diferentes tipos de storage
  async getStorageItem(key) {
    const storageTypes = [
      () => sessionStorage.getItem(key),
      () => localStorage.getItem(key),
      () => this.getChromeStorage(key)
    ];
    
    for (const getStorage of storageTypes) {
      try {
        const item = await getStorage();
        if (item) {
          const parsed = sanitize.json(item);
          if (parsed !== null) return parsed;
        }
      } catch (error) {
        Logger.debug(`Storage access failed for ${key}:`, error);
      }
    }
    
    return null;
  }
  
  // Chrome storage com fallback
  async getChromeStorage(key) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] || null);
        });
      });
    }
    return null;
  }
  
  // Salvamento com debounce e batch
  set(key, value, immediate = false) {
    this.cache.set(key, value);
    this.emit('dataChanged', { key, value });
    
    if (immediate) {
      this.saveToStorage(key, value);
    } else {
      this.scheduleSave(key, value);
    }
  }
  
  get(key, defaultValue = null) {
    return this.cache.get(key) || defaultValue;
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  delete(key) {
    const had = this.cache.has(key);
    this.cache.delete(key);
    if (had) {
      this.scheduleSave(key, null, true); // null indica deletion
      this.emit('dataDeleted', { key });
    }
    return had;
  }
  
  // Agendamento de salvamento com debounce
  scheduleSave = debounce((key, value, isDelete = false) => {
    this.saveToStorage(key, value, isDelete);
  }, 500)
  
  async saveToStorage(key, value, isDelete = false) {
    try {
      if (isDelete) {
        await this.removeFromStorage(key);
      } else {
        await this.setStorageItem(key, value);
      }
      
      this.emit('dataSaved', { key, value });
      Logger.debug(`Saved ${key} to storage`);
    } catch (error) {
      Logger.error(`Failed to save ${key} to storage:`, error);
      this.emit('saveError', { key, error });
    }
  }
  
  async setStorageItem(key, value) {
    const serialized = JSON.stringify(value);
    const storageOps = [
      () => sessionStorage.setItem(key, serialized),
      () => localStorage.setItem(key, serialized),
      () => this.setChromeStorage(key, value)
    ];
    
    for (const setStorage of storageOps) {
      try {
        await setStorage();
        return true;
      } catch (error) {
        Logger.debug(`Storage write failed for ${key}:`, error);
      }
    }
    
    throw new Error(`All storage methods failed for key: ${key}`);
  }
  
  async setChromeStorage(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(true);
          }
        });
      });
    }
    throw new Error('Chrome storage not available');
  }
  
  async removeFromStorage(key) {
    const removeOps = [
      () => sessionStorage.removeItem(key),
      () => localStorage.removeItem(key),
      () => this.removeChromeStorage(key)
    ];
    
    await Promise.allSettled(removeOps.map(op => op()));
  }
  
  async removeChromeStorage(key) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove([key], () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(true);
          }
        });
      });
    }
  }
  
  // Auto-save configurável
  setupAutoSave() {
    // Auto-save a cada 30 segundos
    setInterval(() => {
      this.flushPendingWrites();
    }, 30000);
    
    // Save antes de sair da página
    window.addEventListener('beforeunload', () => {
      this.flushPendingWrites();
    });
    
    // Save quando página perde foco
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flushPendingWrites();
      }
    });
  }
  
  // Força salvamento de todos os dados pendentes
  async flushPendingWrites() {
    const promises = [];
    
    this.cache.forEach((value, key) => {
      promises.push(this.saveToStorage(key, value));
    });
    
    if (promises.length > 0) {
      await Promise.allSettled(promises);
      Logger.debug(`Flushed ${promises.length} pending writes`);
    }
  }
  
  // Limpeza de dados antigos
  async cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 dias
    const now = Date.now();
    const keysToRemove = [];
    
    this.cache.forEach((value, key) => {
      if (value && value.timestamp && (now - value.timestamp) > maxAge) {
        keysToRemove.push(key);
      }
    });
    
    for (const key of keysToRemove) {
      this.delete(key);
    }
    
    if (keysToRemove.length > 0) {
      Logger.info(`Cleaned up ${keysToRemove.length} old storage entries`);
    }
  }
  
  // Estatísticas de storage
  getStats() {
    let totalSize = 0;
    const stats = {
      keys: this.cache.size,
      totalSize: 0,
      largestKey: null,
      largestSize: 0
    };
    
    this.cache.forEach((value, key) => {
      const size = JSON.stringify(value).length;
      totalSize += size;
      
      if (size > stats.largestSize) {
        stats.largestSize = size;
        stats.largestKey = key;
      }
    });
    
    stats.totalSize = totalSize;
    return stats;
  }
  
  // Export/Import para backup
  export() {
    const data = {};
    this.cache.forEach((value, key) => {
      data[key] = value;
    });
    
    return {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
  }
  
  async import(exportData) {
    if (!exportData.data || !exportData.version) {
      throw new Error('Invalid export data format');
    }
    
    this.cache.clear();
    
    Object.entries(exportData.data).forEach(([key, value]) => {
      this.set(key, value, true); // immediate save
    });
    
    Logger.info(`Imported ${Object.keys(exportData.data).length} storage entries`);
  }
}

// Gerenciador específico para seleções de música
class MusicSelectionManager extends StorageManager {
  constructor() {
    super();
    this.selections = new Map();
    this.maxSelections = 1000; // Limite para performance
    
    this.on('initialized', () => {
      this.loadSelections();
    });
  }
  
  loadSelections() {
    const stored = this.get('suno-bulk-selection', {});
    
    // Converter objeto para Map para melhor performance
    Object.entries(stored).forEach(([id, data]) => {
      this.selections.set(id, {
        ...data,
        timestamp: data.timestamp || Date.now()
      });
    });
    
    Logger.info(`Loaded ${this.selections.size} music selections`);
  }
  
  addSelection(id, data) {
    // Verificar limite
    if (this.selections.size >= this.maxSelections) {
      this.removeOldestSelection();
    }
    
    const selectionData = {
      ...data,
      timestamp: Date.now(),
      id
    };
    
    this.selections.set(id, selectionData);
    this.saveSelections();
    
    this.emit('selectionAdded', { id, data: selectionData });
    Logger.debug(`Added selection: ${id}`);
  }
  
  removeSelection(id) {
    const had = this.selections.has(id);
    this.selections.delete(id);
    
    if (had) {
      this.saveSelections();
      this.emit('selectionRemoved', { id });
      Logger.debug(`Removed selection: ${id}`);
    }
    
    return had;
  }
  
  hasSelection(id) {
    return this.selections.has(id);
  }
  
  getSelection(id) {
    return this.selections.get(id);
  }
  
  getAllSelections() {
    return Array.from(this.selections.entries());
  }
  
  getSelectionCount() {
    return this.selections.size;
  }
  
  clearAllSelections() {
    const count = this.selections.size;
    this.selections.clear();
    this.saveSelections();
    
    this.emit('selectionsCleared', { count });
    Logger.info(`Cleared ${count} selections`);
    
    return count;
  }
  
  // Remove seleção mais antiga para economizar espaço
  removeOldestSelection() {
    let oldest = null;
    let oldestTime = Infinity;
    
    this.selections.forEach((data, id) => {
      if (data.timestamp < oldestTime) {
        oldestTime = data.timestamp;
        oldest = id;
      }
    });
    
    if (oldest) {
      this.removeSelection(oldest);
      Logger.debug(`Removed oldest selection: ${oldest}`);
    }
  }
  
  // Salva seleções no storage
  saveSelections() {
    const selectionsObj = {};
    this.selections.forEach((data, id) => {
      selectionsObj[id] = data;
    });
    
    this.set('suno-bulk-selection', selectionsObj);
  }
  
  // Filtragem e busca otimizada
  filterSelections(filterFn) {
    return Array.from(this.selections.entries())
      .filter(([id, data]) => filterFn(id, data));
  }
  
  // Busca por título
  searchByTitle(query) {
    const lowerQuery = query.toLowerCase();
    return this.filterSelections((id, data) => 
      data.title && data.title.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Estatísticas das seleções
  getSelectionStats() {
    const stats = {
      total: this.selections.size,
      byDate: new Map(),
      totalSize: 0
    };
    
    this.selections.forEach((data) => {
      const date = new Date(data.timestamp).toDateString();
      stats.byDate.set(date, (stats.byDate.get(date) || 0) + 1);
      stats.totalSize += JSON.stringify(data).length;
    });
    
    return stats;
  }
}

// Exportar para global
const SunoStorageManager = {
  StorageManager,
  MusicSelectionManager
};

if (typeof window !== 'undefined') {
  window.SunoStorageManager = SunoStorageManager;
} else if (typeof global !== 'undefined') {
  global.SunoStorageManager = SunoStorageManager;
} else if (typeof self !== 'undefined') {
  self.SunoStorageManager = SunoStorageManager;
}

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : self);