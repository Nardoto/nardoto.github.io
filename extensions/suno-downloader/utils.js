// utils.js - Utilitários de Performance e Helpers

(function(global) {
  'use strict';

// Debounce otimizado para alta performance
const debounce = (func, wait, immediate = false) => {
  let timeout, args, context, timestamp, result;
  
  const later = () => {
    const last = Date.now() - timestamp;
    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  };
  
  return function(...params) {
    context = this;
    args = params;
    timestamp = Date.now();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }
    return result;
  };
};

// Throttle para controle de frequência
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Batch Updates para agregar operações DOM
const BatchUpdater = (() => {
  let pending = false;
  const updates = [];
  
  return {
    add(fn) {
      updates.push(fn);
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          updates.forEach(fn => {
            try { fn(); } catch(e) { console.error('BatchUpdate error:', e); }
          });
          updates.length = 0;
          pending = false;
        });
      }
    },
    
    flush() {
      if (updates.length > 0) {
        updates.forEach(fn => {
          try { fn(); } catch(e) { console.error('BatchUpdate flush error:', e); }
        });
        updates.length = 0;
        pending = false;
      }
    }
  };
})();

// Cache LRU otimizado
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  
  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

// Performance Monitor
const PerformanceMonitor = {
  metrics: new Map(),
  
  start(label) {
    this.metrics.set(label, {
      start: performance.now(),
      memory: performance.memory ? performance.memory.usedJSHeapSize : 0
    });
  },
  
  end(label) {
    const metric = this.metrics.get(label);
    if (!metric) return null;
    
    const end = performance.now();
    const result = {
      duration: end - metric.start,
      memory: performance.memory ? performance.memory.usedJSHeapSize - metric.memory : 0
    };
    
    this.metrics.delete(label);
    console.log(`⏱️ ${label}: ${result.duration.toFixed(2)}ms, Memory: ${(result.memory/1024/1024).toFixed(2)}MB`);
    return result;
  },
  
  measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
};

// Sanitização e validação
const sanitize = {
  filename: (text) => text.replace(/[\/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_').trim().substring(0, 100),
  
  text: (text) => text.replace(/<[^>]*>/g, '').replace(/[^\w\s\-\[\]().,!?]/g, '').trim(),
  
  url: (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname.includes('suno') ? url : null;
    } catch {
      return null;
    }
  },
  
  json: (data) => {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      return null;
    }
  }
};

// Event Emitter otimizado
class EventEmitter {
  constructor() {
    this.events = new Map();
  }
  
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
    
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }
  
  emit(event, ...args) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`EventEmitter error in ${event}:`, error);
        }
      });
    }
  }
  
  clear() {
    this.events.clear();
  }
}

// Intersection Observer Manager
class IntersectionManager {
  constructor() {
    this.observers = new Map();
  }
  
  observe(element, callback, options = {}) {
    const key = JSON.stringify(options);
    
    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const cb = this.callbacks.get(entry.target);
          if (cb) cb(entry);
        });
      }, {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      });
      
      this.observers.set(key, {
        observer,
        callbacks: new WeakMap()
      });
    }
    
    const { observer, callbacks } = this.observers.get(key);
    callbacks.set(element, callback);
    observer.observe(element);
    
    return () => {
      callbacks.delete(element);
      observer.unobserve(element);
    };
  }
  
  disconnect() {
    this.observers.forEach(({ observer }) => observer.disconnect());
    this.observers.clear();
  }
}

// Web Worker Pool para operações pesadas
class WorkerPool {
  constructor(workerScript, poolSize = 2) {
    this.workers = [];
    this.queue = [];
    this.busy = new Set();
    
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(URL.createObjectURL(
        new Blob([workerScript], { type: 'application/javascript' })
      ));
      this.workers.push(worker);
    }
  }
  
  execute(data) {
    return new Promise((resolve, reject) => {
      const availableWorker = this.workers.find(w => !this.busy.has(w));
      
      if (availableWorker) {
        this.runTask(availableWorker, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }
  
  runTask(worker, data, resolve, reject) {
    this.busy.add(worker);
    
    const timeout = setTimeout(() => {
      reject(new Error('Worker timeout'));
      this.busy.delete(worker);
    }, 10000);
    
    worker.onmessage = (e) => {
      clearTimeout(timeout);
      this.busy.delete(worker);
      resolve(e.data);
      this.processQueue();
    };
    
    worker.onerror = (error) => {
      clearTimeout(timeout);
      this.busy.delete(worker);
      reject(error);
      this.processQueue();
    };
    
    worker.postMessage(data);
  }
  
  processQueue() {
    if (this.queue.length > 0) {
      const availableWorker = this.workers.find(w => !this.busy.has(w));
      if (availableWorker) {
        const { data, resolve, reject } = this.queue.shift();
        this.runTask(availableWorker, data, resolve, reject);
      }
    }
  }
  
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
    this.busy.clear();
  }
}

// Virtual List para grandes quantidades de dados
class VirtualList {
  constructor(container, itemHeight = 50, bufferSize = 5) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.bufferSize = bufferSize;
    this.items = [];
    this.visibleItems = new Map();
    this.scrollTop = 0;
    
    this.setupScrollListener();
  }
  
  setItems(items) {
    this.items = items;
    this.container.style.height = `${items.length * this.itemHeight}px`;
    this.render();
  }
  
  setupScrollListener() {
    const scrollListener = throttle(() => {
      this.scrollTop = this.container.scrollTop;
      this.render();
    }, 16); // ~60fps
    
    this.container.addEventListener('scroll', scrollListener);
  }
  
  render() {
    const containerHeight = this.container.clientHeight;
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
    const endIndex = Math.min(this.items.length, startIndex + Math.ceil(containerHeight / this.itemHeight) + this.bufferSize * 2);
    
    // Remove itens fora da vista
    this.visibleItems.forEach((element, index) => {
      if (index < startIndex || index >= endIndex) {
        element.remove();
        this.visibleItems.delete(index);
      }
    });
    
    // Adiciona novos itens visíveis
    for (let i = startIndex; i < endIndex; i++) {
      if (!this.visibleItems.has(i)) {
        const item = this.createItem(this.items[i], i);
        item.style.position = 'absolute';
        item.style.top = `${i * this.itemHeight}px`;
        item.style.height = `${this.itemHeight}px`;
        this.container.appendChild(item);
        this.visibleItems.set(i, item);
      }
    }
  }
  
  createItem(data, index) {
    // Override este método para criar elementos customizados
    const div = document.createElement('div');
    div.textContent = data.toString();
    return div;
  }
}

// Logger otimizado com níveis
const Logger = {
  level: 'info',
  levels: { error: 0, warn: 1, info: 2, debug: 3 },
  
  log(level, message, ...args) {
    if (this.levels[level] <= this.levels[this.level]) {
      const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '🐛';
      console[level](`${prefix} [${new Date().toLocaleTimeString()}] ${message}`, ...args);
    }
  },
  
  error(message, ...args) { this.log('error', message, ...args); },
  warn(message, ...args) { this.log('warn', message, ...args); },
  info(message, ...args) { this.log('info', message, ...args); },
  debug(message, ...args) { this.log('debug', message, ...args); }
};

// Exportar todos os módulos
const SunoUtils = {
  debounce,
  throttle,
  BatchUpdater,
  LRUCache,
  PerformanceMonitor,
  sanitize,
  EventEmitter,
  IntersectionManager,
  WorkerPool,
  VirtualList,
  Logger
};

// Compatibilidade com diferentes ambientes
if (typeof window !== 'undefined') {
  window.SunoUtils = SunoUtils;
} else if (typeof global !== 'undefined') {
  global.SunoUtils = SunoUtils;
} else if (typeof self !== 'undefined') {
  self.SunoUtils = SunoUtils;
}

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : self);